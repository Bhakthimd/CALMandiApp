/**
 * CALMandi AI Assistant Service
 *
 * Integrates Google Gemini API with fallback to grounded APMC Mandi local intelligence.
 * Supports English, Hindi, and Kannada for both Voice Assistant and Chatbot.
 * Enforces role-based permissions and explicit transaction safety confirmations.
 */

import { Product, Customer, UserProfile } from '../types';
import { resolveCommodityKey } from '../utils/productImages';

export type SupportedLanguage = 'en' | 'hi' | 'kn';

export interface AIContext {
  currentUser: UserProfile | null;
  isOwner: boolean;
  products: Product[];
  customers: Customer[];
  todaySales: number;
  totalUdhaar: number;
  todayProfit?: number;
  recentArrivalsCount?: number;
  recentSalesCount?: number;
  language: SupportedLanguage;
}

export interface AIResponse {
  text: string;
  spokenText: string;
  language: SupportedLanguage;
  intent: 'QUERY' | 'GUIDE' | 'NAVIGATE' | 'TRANSACTION';
  navigationTarget?: string;
  transactionPayload?: {
    type: 'INWARD' | 'OUTWARD';
    productName: string;
    productId?: string;
    quantity: number;
    unit: string;
  };
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
  source: 'GEMINI_LLM' | 'LOCAL_EXPERT_ENGINE';
}

const GEMINI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export class AIService {
  private customApiKey: string | null = null;

  public setApiKey(key: string | null) {
    this.customApiKey = key;
  }

  public getApiKey(): string | null {
    // Check custom key first, then environment variable
    if (this.customApiKey) return this.customApiKey;
    if (typeof process !== 'undefined' && process.env) {
      return (
        process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
        process.env.GEMINI_API_KEY ||
        null
      );
  
    }
    return null;
  }

  /**
   * Process a user prompt (typed or spoken) in the context of the live Mandi app.
   */
  public async processPrompt(
    prompt: string,
    context: AIContext
  ): Promise<AIResponse> {
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt) {
      return this.getEmptyPromptResponse(context.language);
    }

    // 1. First check if it is a sensitive transaction command (e.g. "Add 20 kg of almonds")
    const transactionCheck = this.detectTransactionIntent(cleanPrompt, context);
    if (transactionCheck) {
      return transactionCheck;
    }

    // 2. Check if it is a direct navigation command (e.g. "Open product catalogue")
    const navigationCheck = this.detectNavigationIntent(cleanPrompt, context);
    if (navigationCheck) {
      return navigationCheck;
    }

    // 3. If an API key is available and online, attempt real Gemini LLM call
    const apiKey = this.getApiKey();
    if (apiKey) {
      try {
        const geminiResult = await this.callGeminiAPI(cleanPrompt, apiKey, context);
        if (geminiResult) {
          return geminiResult;
        }
      } catch (err) {
        console.warn('[AIService] Gemini API error, falling back to local engine:', err);
      }
    }

    // 4. Grounded Local APMC Mandi Intelligence Engine
    return this.processWithLocalEngine(cleanPrompt, context);
  }

  /**
   * Detect sensitive inventory transactions and mandate confirmation
   */
  private findProductInPrompt(prompt: string, products: Product[]): Product | undefined {
    const lower = prompt.toLowerCase();
    const direct = products.find((p) => lower.includes(p.name.toLowerCase()));
    if (direct) return direct;

    const promptKey = resolveCommodityKey(lower);
    if (promptKey) {
      const byCanonical = products.find((p) => {
        const prodKey = resolveCommodityKey(p.name);
        return prodKey === promptKey || p.name.toLowerCase().includes(promptKey);
      });
      if (byCanonical) return byCanonical;
    }

    return undefined;
  }

  private detectTransactionIntent(
    prompt: string,
    context: AIContext
  ): AIResponse | null {
    const lower = prompt.toLowerCase();

    // Check for inward arrival patterns: "add 20 kg of almonds", "inward 50 crates tomato", "20 किलो बादाम जोड़ो"
    const isInward =
      lower.includes('add ') ||
      lower.includes('inward') ||
      lower.includes('arrival') ||
      lower.includes('जोड़ो') ||
      lower.includes('आवक') ||
      lower.includes('ಸೇರಿಸಿ') ||
      lower.includes('ಆವಕ');

    const isOutward =
      lower.includes('sell ') ||
      lower.includes('dispatch') ||
      lower.includes('outward') ||
      lower.includes('बेचो') ||
      lower.includes('रवाना') ||
      lower.includes('ಮಾರಾಟ') ||
      lower.includes('ರವಾನಿಸಿ');

    if (!isInward && !isOutward) return null;

    // Extract quantity (first number found)
    const qtyMatch = prompt.match(/\b\d+(\.\d+)?\b/);
    const quantity = qtyMatch ? parseFloat(qtyMatch[0]) : null;

    if (!quantity || quantity <= 0) return null;

    // Match product name against existing products
    let matchedProduct = this.findProductInPrompt(prompt, context.products);



    // If not matched, try generic commodity keywords
    const candidateName = matchedProduct ? matchedProduct.name : 'commodity';
    const unit = matchedProduct ? matchedProduct.unit : 'Kg';

    const type = isInward ? 'INWARD' : 'OUTWARD';
    const actionLabel = isInward ? 'add' : 'dispatch';
    const actionHindi = isInward ? 'स्टॉक जोड़ना' : 'बिक्री दर्ज करना';
    const actionKannada = isInward ? 'ಸ್ಟಾಕ್ ಸೇರಿಸುವುದು' : 'ಮಾರಾಟ ದಾಖಲಿಸುವುದು';

    let message = '';
    let spoken = '';
    let confirmationMsg = '';

    if (context.language === 'hi') {
      message = `आप ${quantity} ${unit} ${candidateName} की ${actionHindi} चाहते हैं। क्या मैं इसे दर्ज करूँ?`;
      spoken = message;
      confirmationMsg = `पुष्टि करें: ${quantity} ${unit} ${candidateName} ${actionHindi}?`;
    } else if (context.language === 'kn') {
      message = `ನೀವು ${quantity} ${unit} ${candidateName} ${actionKannada} ಬಯಸಿದ್ದೀರಿ. ಮುಂದುವರಿಯಬೇಕೆ?`;
      spoken = message;
      confirmationMsg = `ದೃಢೀಕರಿಸಿ: ${quantity} ${unit} ${candidateName} ${actionKannada}?`;
    } else {
      message = `You want to ${actionLabel} ${quantity} ${unit} of ${candidateName} to inventory. Should I proceed?`;
      spoken = message;
      confirmationMsg = `Confirm: ${actionLabel.toUpperCase()} ${quantity} ${unit} ${candidateName}?`;
    }

    return {
      text: message,
      spokenText: spoken,
      language: context.language,
      intent: 'TRANSACTION',
      transactionPayload: {
        type,
        productName: candidateName,
        productId: matchedProduct?.id,
        quantity,
        unit,
      },
      requiresConfirmation: true,
      confirmationMessage: confirmationMsg,
      source: 'LOCAL_EXPERT_ENGINE',
    };
  }

  /**
   * Detect voice navigation commands
   */
  private detectNavigationIntent(
    prompt: string,
    context: AIContext
  ): AIResponse | null {
    const lower = prompt.toLowerCase();

    const navRules: {
      keywords: string[];
      target: string;
      labelEn: string;
      labelHi: string;
      labelKn: string;
    }[] = [
      {
        keywords: ['reminder', 'overdue', 'settlement', 'due date', 'रिमाइंडर', 'ಜ್ಞಾಪನೆ'],
        target: 'PaymentReminders',
        labelEn: 'Payment Reminders',
        labelHi: 'भुगतान रिमाइंडर',
        labelKn: 'ಪಾವತಿ ಜ್ಞಾಪನೆಗಳು',
      },
      {
        keywords: ['product', 'catalogue', 'catalog', 'उत्पाद', 'सामान', 'ಉತ್ಪನ್ನ'],
        target: 'Products',
        labelEn: 'Product Catalogue',
        labelHi: 'उत्पाद सूची',
        labelKn: 'ಉತ್ಪನ್ನಗಳ ಪಟ್ಟಿ',
      },
      {
        keywords: ['customer', 'khata', 'buyer', 'farmer', 'ग्राहक', 'खाता', 'ಗ್ರಾಹಕರು'],
        target: 'Customers',
        labelEn: 'Customer Directory',
        labelHi: 'ग्राहक सूची',
        labelKn: 'ಗ್ರಾಹಕರ ಮಾಹಿತಿ',
      },
      {
        keywords: ['report', 'summary', 'analytics', 'रिपोर्ट', 'विवरण', 'ವರದಿ'],
        target: 'Reports',
        labelEn: 'Reports & Analytics',
        labelHi: 'रिपोर्ट और विवरण',
        labelKn: 'ವರದಿಗಳು',
      },
      {
        keywords: ['slip', 'delivery slip', 'gate pass', 'पर्ची', 'रसीद', 'ರಶೀದಿ'],
        target: 'Slips',
        labelEn: 'Delivery Slips',
        labelHi: 'डिलीवरी पर्ची',
        labelKn: 'ವಿತರಣಾ ರಶೀದಿಗಳು',
      },
      {
        keywords: ['arrival', 'inward', 'आवक', 'ಆವಕ'],
        target: 'RecordArrival',
        labelEn: 'Record Inward Arrival',
        labelHi: 'आवक दर्ज करें',
        labelKn: 'ಆವಕ ದಾಖಲಿಸಿ',
      },
      {
        keywords: ['sale', 'outward', 'dispatch', 'बिक्री', 'ಮಾರಾಟ'],
        target: 'RecordSale',
        labelEn: 'Record Outward Sale',
        labelHi: 'बिक्री दर्ज करें',
        labelKn: 'ಮಾರಾಟ ದಾಖಲಿಸಿ',
      },
      {
        keywords: ['setting', 'profile', 'language', 'सेटिंग', 'भाषा', 'ಸೆಟ್ಟಿಂಗ್ಸ್'],
        target: 'Settings',
        labelEn: 'Settings & Profile',
        labelHi: 'सेटिंग्स और प्रोफ़ाइल',
        labelKn: 'ಸೆಟ್ಟಿಂಗ್ಸ್',
      },
      {
        keywords: ['tally', 'clicker', 'floor', 'टैली', 'ಕ್ಲಿಕ್ಕರ್'],
        target: 'CrateTally',
        labelEn: 'Floor Crate Tally',
        labelHi: 'क्रेट टैली',
        labelKn: 'ಕ್ರೇಟ್ ಲೆಕ್ಕ',
      },
    ];

    const isNavRequest =
      lower.includes('open ') ||
      lower.includes('show ') ||
      lower.includes('go to ') ||
      lower.includes('take me to') ||
      lower.includes('खोलो') ||
      lower.includes('दिखाओ') ||
      lower.includes('ತೆರೆಯಿರಿ') ||
      lower.includes('ತೋರಿಸಿ');

    if (!isNavRequest) return null;

    for (const rule of navRules) {
      if (rule.keywords.some((kw) => lower.includes(kw))) {
        let text = '';
        if (context.language === 'hi') {
          text = `${rule.labelHi} खोली जा रही है।`;
        } else if (context.language === 'kn') {
          text = `${rule.labelKn} ತೆರೆಯಲಾಗುತ್ತಿದೆ.`;
        } else {
          text = `Opening ${rule.labelEn} screen.`;
        }

        return {
          text,
          spokenText: text,
          language: context.language,
          intent: 'NAVIGATE',
          navigationTarget: rule.target,
          source: 'LOCAL_EXPERT_ENGINE',
        };
      }
    }

    return null;
  }

  /**
   * Real Google Gemini API Call
   */
  private async callGeminiAPI(
    prompt: string,
    apiKey: string,
    context: AIContext
  ): Promise<AIResponse | null> {
    const systemPrompt = `You are the official AI assistant for CAL Mandi Ops, an APMC agricultural market management application.
The user is ${context.currentUser?.name || 'User'}, role: ${context.currentUser?.role || 'Operator'}.
Business Name: ${context.currentUser?.business || 'Mandi Yard'}.
Available Live Data:
- Today's Total Sales: ₹${context.todaySales.toLocaleString('en-IN')}
- Total Market Udhaar (Customer Debt): ₹${context.totalUdhaar.toLocaleString('en-IN')}
- Active Products: ${context.products.map((p) => `${p.name} (${p.quantity || 0} ${p.unit})`).join(', ')}
- Customer Count: ${context.customers.length}
Rules:
1. Provide concise, helpful, and polite answers.
2. If the user asks in Hindi or Kannada, answer in that exact language.
3. NEVER make up financial or inventory numbers; use only the live data provided above.
4. If a transaction is requested, clearly specify the details and ask for explicit confirmation.
5. Keep explanations step-by-step and easy to understand for non-technical mandi traders.`;

    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\nUser Question: ${prompt}` }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 500,
      },
    };

    const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Gemini API returned status ${response.status}`);
    }

    const data = await response.json();
    const candidateText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!candidateText) {
      return null;
    }

    return {
      text: candidateText,
      spokenText: candidateText.replace(/[*#_`]/g, ''),
      language: context.language,
      intent: 'QUERY',
      source: 'GEMINI_LLM',
    };
  }

  /**
   * Grounded APMC Mandi Local Intelligence Engine
   */
  private processWithLocalEngine(
    prompt: string,
    context: AIContext
  ): AIResponse {
    const lower = prompt.toLowerCase();
    const lang = context.language;

    // 1. SALES & FINANCIAL INQUIRIES (Exclude slip inquiries)
    if (
      !lower.includes('slip') &&
      !lower.includes('पर्ची') &&
      !lower.includes('ರಶೀದಿ') &&
      (lower.includes('sale') ||
        lower.includes('बिक्री') ||
        lower.includes('ಮಾರಾಟ') ||
        lower.includes('revenue') ||
        lower.includes('कमाई'))
    ) {
      if (lang === 'hi') {
        const text = `आज की कुल बिक्री ₹${context.todaySales.toLocaleString('en-IN')} है। कुल बाज़ार उधारी ₹${context.totalUdhaar.toLocaleString('en-IN')} बकाया है।`;
        return { text, spokenText: text, language: lang, intent: 'QUERY', source: 'LOCAL_EXPERT_ENGINE' };
      }
      if (lang === 'kn') {
        const text = `ಇಂದಿನ ಒಟ್ಟು ಮಾರಾಟ ₹${context.todaySales.toLocaleString('en-IN')}. ಮಾರುಕಟ್ಟೆಯಿಂದ ಬರಬೇಕಾದ ಒಟ್ಟು ಉದ್ಧಾರ ₹${context.totalUdhaar.toLocaleString('en-IN')}.`;
        return { text, spokenText: text, language: lang, intent: 'QUERY', source: 'LOCAL_EXPERT_ENGINE' };
      }
      const text = `Today's total sales are ₹${context.todaySales.toLocaleString('en-IN')}. Total outstanding market debt (udhaar) is ₹${context.totalUdhaar.toLocaleString('en-IN')}.`;
      return { text, spokenText: text, language: lang, intent: 'QUERY', source: 'LOCAL_EXPERT_ENGINE' };
    }

    // 2. STOCK & INVENTORY INQUIRIES
    if (
      lower.includes('stock') ||
      lower.includes('स्टॉक') ||
      lower.includes('ಸ್ಟಾಕ್') ||
      lower.includes('available') ||
      lower.includes('quantity') ||
      lower.includes('माल')
    ) {
      // Check if a specific product was mentioned
      const matched = this.findProductInPrompt(prompt, context.products);
      if (matched) {
        const qty = matched.quantity || '0';
        if (lang === 'hi') {
          const text = `${matched.name} का उपलब्ध स्टॉक ${qty} ${matched.unit} है। दर: ₹${matched.price || '0'} प्रति ${matched.unit}।`;
          return { text, spokenText: text, language: lang, intent: 'QUERY', source: 'LOCAL_EXPERT_ENGINE' };
        }
        if (lang === 'kn') {
          const text = `${matched.name} ಲಭ್ಯವಿರುವ ಸ್ಟಾಕ್ ${qty} ${matched.unit}. ದರ: ₹${matched.price || '0'} ಪ್ರತಿ ${matched.unit}.`;
          return { text, spokenText: text, language: lang, intent: 'QUERY', source: 'LOCAL_EXPERT_ENGINE' };
        }
        const text = `Available stock for ${matched.name} is ${qty} ${matched.unit}. Rate: ₹${matched.price || '0'} per ${matched.unit}.`;
        return { text, spokenText: text, language: lang, intent: 'QUERY', source: 'LOCAL_EXPERT_ENGINE' };
      }

      // General inventory overview
      const summaryList = context.products
        .slice(0, 5)
        .map((p) => `• ${p.name}: ${p.quantity || 0} ${p.unit}`)
        .join('\n');

      if (lang === 'hi') {
        const text = `आपके पास कुल ${context.products.length} वस्तुएँ हैं:\n${summaryList}\n\nपूरी सूची के लिए उत्पाद मेनू देखें।`;
        return { text, spokenText: `आपके पास कुल ${context.products.length} वस्तुएं हैं।`, language: lang, intent: 'QUERY', source: 'LOCAL_EXPERT_ENGINE' };
      }
      if (lang === 'kn') {
        const text = `ನಿಮ್ಮ ಬಳಿ ಒಟ್ಟು ${context.products.length} ಉತ್ಪನ್ನಗಳಿವೆ:\n${summaryList}\n\nಸಂಪೂರ್ಣ ಪಟ್ಟಿಗೆ ಉತ್ಪನ್ನಗಳ ಮೆನು ನೋಡಿ.`;
        return { text, spokenText: `ನಿಮ್ಮ ಬಳಿ ಒಟ್ಟು ${context.products.length} ಉತ್ಪನ್ನಗಳಿವೆ.`, language: lang, intent: 'QUERY', source: 'LOCAL_EXPERT_ENGINE' };
      }
      const text = `You currently have ${context.products.length} commodities in catalog:\n${summaryList}\n\nOpen Product Catalogue for full inventory breakdown.`;
      return { text, spokenText: `You have ${context.products.length} commodities in inventory.`, language: lang, intent: 'QUERY', source: 'LOCAL_EXPERT_ENGINE' };
    }

    // 3a. PAYMENT REMINDERS & OVERDUE SETTLEMENTS
    if (
      lower.includes('reminder') ||
      lower.includes('overdue') ||
      lower.includes('settlement') ||
      lower.includes('due date') ||
      lower.includes('who needs to pay') ||
      lower.includes('रिमाइंडर') ||
      lower.includes('ಜ್ಞಾಪನೆ')
    ) {
      const text =
        lang === 'hi'
          ? `भुगतान रिमाइंडर (Payment Reminders) खोलकर आप ओवरड्यू खरीदार बकाया और किसानों के लंबित भुगतान देख सकते हैं। वहीं से आप WhatsApp रिमाइंडर भेज सकते हैं, कॉल कर सकते हैं या देय तिथि बदल सकते हैं।`
          : lang === 'kn'
          ? `ಪಾವತಿ ಜ್ಞಾಪನೆಗಳು (Payment Reminders) ಪರದೆಯಲ್ಲಿ ಬಾಕಿ ಇರುವ ಖರೀದಿದಾರರ ಹಣ ಮತ್ತು ರೈತರ ಪಾವತಿಗಳನ್ನು ನೋಡಬಹುದು. ಅಲ್ಲಿಂದಲೇ WhatsApp ಜ್ಞಾಪನೆ ಕಳುಹಿಸಬಹುದು ಅಥವಾ ಕರೆ ಮಾಡಬಹುದು.`
          : `Open Payment Reminders (from Home Alerts or More Menu) to view flagged overdue buyer dues and pending farmer settlements with due dates. You can send WhatsApp reminders, call parties, adjust due dates, snooze, or collect/settle directly.`;
      return { text, spokenText: text, language: lang, intent: 'GUIDE', source: 'LOCAL_EXPERT_ENGINE' };
    }

    // 3. UDHAAR / DEBT INQUIRIES
    if (
      lower.includes('udhaar') ||
      lower.includes('debt') ||
      lower.includes('pending') ||
      lower.includes('उधारी') ||
      lower.includes('ಉದ್ಧಾರ') ||
      lower.includes('बाकी')
    ) {
      if (lang === 'hi') {
        const text = `बाज़ार से कुल ₹${context.totalUdhaar.toLocaleString('en-IN')} की उधारी लेनी बाकी है। ग्राहक सूची में जाकर व्यक्तिगत खाता देख सकते हैं।`;
        return { text, spokenText: text, language: lang, intent: 'QUERY', source: 'LOCAL_EXPERT_ENGINE' };
      }
      if (lang === 'kn') {
        const text = `ಮಾರುಕಟ್ಟೆಯಿಂದ ಒಟ್ಟು ₹${context.totalUdhaar.toLocaleString('en-IN')} ಉದ್ಧಾರ ಬಾಕಿ ಬರಬೇಕಾಗಿದೆ. ಗ್ರಾಹಕರ ಮೆನುವಿನಲ್ಲಿ ವೈಯಕ್ತಿಕ ಖಾತೆ ನೋಡಬಹುದು.`;
        return { text, spokenText: text, language: lang, intent: 'QUERY', source: 'LOCAL_EXPERT_ENGINE' };
      }
      const text = `Total outstanding market debt is ₹${context.totalUdhaar.toLocaleString('en-IN')}. Open Customers screen to see individual balances and collect payments.`;
      return { text, spokenText: text, language: lang, intent: 'QUERY', source: 'LOCAL_EXPERT_ENGINE' };
    }

    // 3b. CUSTOMER PAYMENTS GUIDANCE
    if (
      lower.includes('payment') ||
      lower.includes('collect payment') ||
      lower.includes('receive payment') ||
      lower.includes('customer payment') ||
      lower.includes('भुगतान') ||
      lower.includes('ಪಾವತಿ')
    ) {
      const text =
        lang === 'hi'
          ? `ग्राहक भुगतान (Payment) दर्ज करने के चरण:\n1. 'Customers' टैब खोलें और संबंधित ग्राहक चुनें।\n2. 'Ledger' पर टैप करके ग्राहक का बहीखाता देखें।\n3. 'Receive Payment' पर टैप करें।\n4. प्राप्त राशि, भुगतान विधि (Cash/UPI/Cheque) और विवरण दर्ज करें।\n5. 'Save' करें। बकाया खाता तुरंत अपडेट हो जाएगा।`
          : lang === 'kn'
          ? `ಗ್ರಾಹಕರ ಪಾವತಿ (Payment) ದಾಖಲಿಸಲು ಕ್ರಮಗಳು:\n1. 'Customers' ಟ್ಯಾಬ್ ತೆರೆದು ಗ್ರಾಹಕರನ್ನು ಆರಿಸಿ.\n2. ಗ್ರಾಹಕರ 'Ledger' (ಖಾತೆ) ತೆರೆಯಿರಿ.\n3. 'Receive Payment' ಒತ್ತಿರಿ.\n4. ಬಂದ ಹಣ, ಪಾವತಿ ವಿಧಾನ (Cash/UPI) ನಮೂದಿಸಿ.\n5. 'Save' ಒತ್ತಿರಿ. ಬಾಕಿ ಹಣ ತಕ್ಷಣ ಅಪ್ಡೇಟ್ ಆಗುತ್ತದೆ.`
          : `Steps to manage customer payments:\n1. Open the 'Customers' tab and select the customer.\n2. Tap 'Ledger' to view their transaction history.\n3. Tap 'Receive Payment'.\n4. Enter the amount paid, payment mode (Cash, UPI, Cheque), and notes.\n5. Confirm to immediately credit the payment and reduce their balance.`;

      return { text, spokenText: text, language: lang, intent: 'GUIDE', source: 'LOCAL_EXPERT_ENGINE' };
    }

    // 3c. INVENTORY MANAGEMENT GUIDANCE
    if (
      lower.includes('manage inventory') ||
      lower.includes('inventory management') ||
      lower.includes('स्टॉक प्रबंधन') ||
      lower.includes('ದಾಸ್ತಾನು ನಿರ್ವಹಣೆ')
    ) {
      const text =
        lang === 'hi'
          ? `इन्वेंटरी स्टॉक प्रबंधन के चरण:\n1. 'Products' टैब खोलें और वस्तु पर '+ Select' टैप करें।\n2. मात्रा (+ / -) सेट करें या सीधे संख्या भरें।\n3. 'Add to Stock' पर टैप करें।\n4. 'Add to Existing Stock' (स्टॉक बढ़ाना) या 'Set Exact Stock' (नया स्टॉक सेट करना) चुनें।\n5. कन्फर्म करते ही भौतिक स्टॉक अपडेट हो जाएगा।`
          : lang === 'kn'
          ? `ದಾಸ್ತಾನು ನಿರ್ವಹಣೆಯ ಕ್ರಮಗಳು:\n1. 'Products' ಟ್ಯಾಬ್ ತೆರೆದು ಸರಕಿನ ಮೇಲೆ '+ Select' ಒತ್ತಿರಿ.\n2. ಪ್ರಮಾಣವನ್ನು (+ / -) ಮೂಲಕ ಸರಿಹೊಂದಿಸಿ.\n3. 'Add to Stock' ಒತ್ತಿರಿ.\n4. 'Add to Existing Stock' ಅಥವಾ 'Set Exact Stock' ಆರಿಸಿ.\n5. ಖಚಿತಪಡಿಸಿದ ತಕ್ಷಣ ಲಭ್ಯವಿರುವ ಸ್ಟಾಕ್ ಅಪ್ಡೇಟ್ ಆಗುತ್ತದೆ.`
          : `Steps to manage inventory:\n1. Open the 'Products' tab and tap '+ Select' on the commodity.\n2. Adjust quantity using [+] / [-] or tap the count to type directly.\n3. Tap 'Add to Stock' in the review bar.\n4. Choose 'Add to Existing Stock' (to add to current inventory) or 'Set Exact Stock Count' (to overwrite).\n5. Confirm to immediately update mandi stock.`;

      return { text, spokenText: text, language: lang, intent: 'GUIDE', source: 'LOCAL_EXPERT_ENGINE' };
    }

    // 4. GUIDANCE: HOW TO ADD PRODUCT
    if (
      lower.includes('add product') ||
      lower.includes('add a product') ||
      (lower.includes('add') && lower.includes('product')) ||
      lower.includes('create product') ||
      lower.includes('नया उत्पाद') ||
      lower.includes('ಉತ್ಪನ್ನ ಸೇರಿಸು')
    ) {
      if (!context.isOwner) {
        const text =
          lang === 'hi'
            ? 'केवल मंडी मालिक नए उत्पाद जोड़ सकते हैं। कृपया अपने मंडी मालिक से संपर्क करें।'
            : lang === 'kn'
            ? 'ಕೇವಲ ಮಂಡಿ ಮಾಲೀಕರು ಮಾತ್ರ ಹೊಸ ಉತ್ಪನ್ನಗಳನ್ನು ಸೇರಿಸಬಹುದು. ದಯವಿಟ್ಟು ಮಾಲೀಕರನ್ನು ಸಂಪರ್ಕಿಸಿ.'
            : 'Only the Mandi Owner has permission to add new products to the master catalog. Please contact your Owner.';
        return { text, spokenText: text, language: lang, intent: 'GUIDE', source: 'LOCAL_EXPERT_ENGINE' };
      }

      const text =
        lang === 'hi'
          ? `नया उत्पाद जोड़ने के चरण:\n1. नीचे 'प्लस (+)' बटन या उत्पाद सूची खोलें।\n2. 'Add New Product' पर टैप करें।\n3. नाम, श्रेणी, मापने की इकाई (Kg/Crate) और आधार दर दर्ज करें।\n4. 'Save Product' पर टैप करें।`
          : lang === 'kn'
          ? `ಹೊಸ ಉತ್ಪನ್ನ ಸೇರಿಸಲು ಕ್ರಮಗಳು:\n1. ಕೆಳಗಿನ '+' ಬಟನ್ ಅಥವಾ ಉತ್ಪನ್ನಗಳ ಪಟ್ಟಿ ತೆರೆಯಿರಿ.\n2. 'Add New Product' ಒತ್ತಿರಿ.\n3. ಹೆಸರು, ವರ್ಗ, ಯೂನಿಟ್ ಮತ್ತು ದರ ನಮೂದಿಸಿ.\n4. 'Save Product' ಒತ್ತಿರಿ.`
          : `Steps to add a product:\n1. Tap the central '+' button or open Product Catalogue.\n2. Tap '+ Add New Product'.\n3. Enter product name, category, measuring unit (Kg/Crate), and base price.\n4. Tap 'Save Product'.`;

      return { text, spokenText: text, language: lang, intent: 'GUIDE', source: 'LOCAL_EXPERT_ENGINE' };
    }

    // 5. GUIDANCE: HOW TO RECORD INWARD ARRIVAL
    if (
      lower.includes('record arrival') ||
      lower.includes('inward arrival') ||
      lower.includes('record inward') ||
      lower.includes('how to record arrival') ||
      lower.includes('आवक') ||
      lower.includes('ಆವಕ')
    ) {
      const text =
        lang === 'hi'
          ? `आवक (Inward Arrival) दर्ज करने के चरण:\n1. नीचे '+' मेनू से 'Record Inward Arrival' चुनें।\n2. किसान का नाम और उत्पाद चुनें।\n3. प्राप्त मात्रा और वजन दर्ज करें।\n4. वाहन संख्या और नोट भरें।\n5. 'Save Arrival' पर टैप करें। स्टॉक तुरंत अपडेट हो जाएगा।`
          : lang === 'kn'
          ? `ಆವಕ ದಾಖಲಿಸಲು ಕ್ರಮಗಳು:\n1. ಕೆಳಗಿನ '+' ಮೆನುವಿನಿಂದ 'Record Inward Arrival' ಆಯ್ಕೆಮಾಡಿ.\n2. ರೈತನ ಹೆಸರು ಮತ್ತು ಉತ್ಪನ್ನ ಆರಿಸಿ.\n3. ಬಂದ ಪ್ರಮಾಣ ನಮೂದಿಸಿ.\n4. 'Save Arrival' ಒತ್ತಿರಿ. ಸ್ಟಾಕ್ ತಕ್ಷಣ ಹೆಚ್ಚಾಗುತ್ತದೆ.`
          : `Steps to record Inward Arrival:\n1. Tap the central '+' button and select 'Record Inward Arrival'.\n2. Select farmer name and commodity.\n3. Enter received quantity, unit, and vehicle number.\n4. Tap 'Save Arrival'. Physical stock is credited immediately.`;

      return { text, spokenText: text, language: lang, intent: 'GUIDE', source: 'LOCAL_EXPERT_ENGINE' };
    }

    // 6. GUIDANCE: HOW TO CREATE DELIVERY SLIP
    if (
      lower.includes('slip') ||
      lower.includes('delivery slip') ||
      lower.includes('sales slip') ||
      lower.includes('create slip') ||
      lower.includes('पर्ची') ||
      lower.includes('ರಶೀದಿ')
    ) {
      const text =
        lang === 'hi'
          ? `डिलीवरी पर्ची (Slip) बनाने के चरण:\n1. '+' मेनू से 'Create Delivery Slip' पर टैप करें।\n2. आवक (IN) या बिक्री (OUT) का चयन करें।\n3. ग्राहक/किसान का नाम, वस्तु और मात्रा चुनें।\n4. दर और नकद भुगतान दर्ज करें।\n5. पर्ची तैयार होने पर सीधे WhatsApp पर साझा करें।`
          : lang === 'kn'
          ? `ವಿತರಣಾ ರಶೀದಿ (Slip) ಸೃಷ್ಟಿಸಲು ಕ್ರಮಗಳು:\n1. '+' ಮೆನುವಿನಿಂದ 'Create Delivery Slip' ಒತ್ತಿರಿ.\n2. ಆವಕ (IN) ಅಥವಾ ಮಾರಾಟ (OUT) ಆರಿಸಿ.\n3. ಗ್ರಾಹಕ, ಸರಕು ಮತ್ತು ಪ್ರಮಾಣ ನಮೂದಿಸಿ.\n4. ದರ ಮತ್ತು ಪಾವತಿ ವಿವರ ನೀಡಿ.\n5. ರಶೀದಿಯನ್ನು ನೇರವಾಗಿ WhatsApp ನಲ್ಲಿ ಕಳುಹಿಸಿ.`
          : `Steps to create Delivery Slip:\n1. Tap '+' menu and select 'Create Delivery Slip'.\n2. Choose Inward (IN) or Outward (OUT).\n3. Select party name, commodity, quantity, and unit rate.\n4. Enter paid amount and balance due.\n5. Print or share directly via WhatsApp.`;

      return { text, spokenText: text, language: lang, intent: 'GUIDE', source: 'LOCAL_EXPERT_ENGINE' };
    }

    // 7. GUIDANCE: WHAT IS PATTI?
    if (lower.includes('patti') || lower.includes('पट्टी') || lower.includes('ಪಟ್ಟಿ')) {
      const text =
        lang === 'hi'
          ? `पट्टी (Farmer Settlement Patti) किसान और आढ़ती के बीच का आधिकारिक हिसाब है। इसमें कुल सकल मूल्य से मंडी कमीशन और हमाली काटकर किसान को देय शुद्ध राशि (Net Payable) दर्शाई जाती है।`
          : lang === 'kn'
          ? `ಪಟ್ಟಿ (Farmer Settlement Patti) ರೈತರಿಗೆ ನೀಡುವ ಅಧಿಕೃತ ಲೆಕ್ಕದ ಚೀಟಿ. ಇದರಲ್ಲಿ ಒಟ್ಟು ಮೌಲ್ಯದಿಂದ ಮಂಡಿ ಕಮಿಷನ್ ಮತ್ತು ಹಮಾಲಿ ಕಡಿತಗೊಳಿಸಿ, ರೈತನಿಗೆ ಪಾವತಿಸಬೇಕಾದ ನಿವ್ವಳ ಹಣವನ್ನು ಲೆಕ್ಕಹಾಕಲಾಗುತ್ತದೆ.`
          : `Farmer Patti is an official APMC settlement slip given to farmers upon arrival of produce. It computes Gross Value minus Mandi Commission and Hamali/Labor, arriving at the final Net Payable owed to the farmer.`;

      return { text, spokenText: text, language: lang, intent: 'GUIDE', source: 'LOCAL_EXPERT_ENGINE' };
    }

    // 8. GUIDANCE: GRADING & WASTAGE
    if (
      lower.includes('grade') ||
      lower.includes('wastage') ||
      lower.includes('छंटाई') ||
      lower.includes('खराबी') ||
      lower.includes('ಗ್ರೇಡಿಂಗ್') ||
      lower.includes('ವೇಸ್ಟೇಜ್')
    ) {
      const text =
        lang === 'hi'
          ? `ग्रेडिंग और खराबी (Sort & Wastage):\n1. बिना छंटे माल (Ungraded Stock) को Grade A, Grade B, और Grade C में बाँटा जाता है।\n2. सड़े-गले माल को Wastage में दर्ज किया जाता है, ताकि स्टॉक का सटीक हिसाब रहे और वित्तीय नुकसान ट्रैक हो सके।`
          : lang === 'kn'
          ? `ಗ್ರೇಡಿಂಗ್ ಮತ್ತು ವೇಸ್ಟೇಜ್:\n1. ತಂದ ಮಾಲನ್ನು Grade A, Grade B ಮತ್ತು Grade C ಗುಣಮಟ್ಟಕ್ಕೆ ವಿಂಗಡಿಸಲಾಗುತ್ತದೆ.\n2. ಹಾಳಾದ ಮಾಲನ್ನು ವೇಸ್ಟೇಜ್ ಎಂದು ದಾಖಲಿಸಿ, ನಷ್ಟವನ್ನು ಸರಿಯಾಗಿ ಲೆಕ್ಕಹಾಕಲಾಗುತ್ತದೆ.`
          : `Produce Sorting & Wastage:\n1. Incoming lots are sorted into Grade A (Premium), Grade B (Standard), and Grade C (Economy).\n2. Spoiled or culled produce is logged as Wastage with a reason to maintain 100% audit accuracy and prevent phantom stock.`;

      return { text, spokenText: text, language: lang, intent: 'GUIDE', source: 'LOCAL_EXPERT_ENGINE' };
    }

    // 9. GREETINGS (SHORT & DISTINCT)
    if (
      lower === 'hi' ||
      lower === 'hello' ||
      lower === 'hey' ||
      lower === 'namaste' ||
      lower.startsWith('hi ') ||
      lower.startsWith('hello ') ||
      lower.includes('नमस्ते') ||
      lower.includes('ನಮಸ್ಕಾರ')
    ) {
      const text =
        lang === 'hi'
          ? `नमस्ते! आज मैं आपकी मंडी में किस प्रकार सहायता कर सकता हूँ? आप स्टॉक, बिक्री, उधारी, या पर्ची के बारे में पूछ सकते हैं।`
          : lang === 'kn'
          ? `ನಮಸ್ಕಾರ! ಇಂದು ನಿಮ್ಮ ಮಂಡಿ ಕೆಲಸದಲ್ಲಿ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ? ನೀವು ಸ್ಟಾಕ್, ಮಾರಾಟ, ಉದ್ಧಾರ ಅಥವಾ ರಶೀದಿ ಬಗ್ಗೆ ಕೇಳಬಹುದು.`
          : `Hello! I am ready to help with your mandi operations. You can ask about today's sales, stock levels, customer balances, or creating slips.`;

      return { text, spokenText: text, language: lang, intent: 'QUERY', source: 'LOCAL_EXPERT_ENGINE' };
    }

    // DEFAULT FALLBACK HELPFUL ASSISTANCE (DO NOT REPEAT GENERIC WELCOME)
    const fallbackText =
      lang === 'hi'
        ? `मुझे आपका यह सवाल पूरी तरह समझ नहीं आया। आप इनमें से कुछ पूछ सकते हैं:\n• आज की कुल बिक्री या बाज़ार उधारी\n• किसी वस्तु का स्टॉक (जैसे 'टमाटर का स्टॉक')\n• नया उत्पाद जोड़ना, आवक दर्ज करना या पर्ची बनाना\n• ग्राहक भुगतान दर्ज करना`
        : lang === 'kn'
        ? `ನಿಮ್ಮ ಪ್ರಶ್ನೆ ಸ್ಪಷ್ಟವಾಗಿಲ್ಲ. ನೀವು ಇವುಗಳನ್ನು ಕೇಳಬಹುದು:\n• ಇಂದಿನ ಒಟ್ಟು ಮಾರಾಟ ಅಥವಾ ಉದ್ಧಾರ ಬಾಕಿ\n• ಯಾವುದೇ ಸರಕಿನ ಸ್ಟಾಕ್ (ಉದಾ: 'ಟೊಮೆಟೊ ಸ್ಟಾಕ್')\n• ಹೊಸ ಉತ್ಪನ್ನ ಸೇರಿಸುವುದು ಅಥವಾ ರಶೀದಿ ಮಾಡುವುದು\n• ಗ್ರಾಹಕರ ಪಾವತಿ ನಿರ್ವಹಣೆ`
        : `I didn't quite catch that specific mandi action. You can ask me:\n• Check stock levels (e.g. "Tomato stock")\n• Review today's sales or market udhaar\n• How to add products, record arrivals, or create slips\n• How to manage customer payments and ledgers\n\nOr tap any of the suggested topics above.`;

    return {
      text: fallbackText,
      spokenText: fallbackText,
      language: lang,
      intent: 'QUERY',
      source: 'LOCAL_EXPERT_ENGINE',
    };
  }

  private getEmptyPromptResponse(lang: SupportedLanguage): AIResponse {
    const text =
      lang === 'hi'
        ? 'कृपया अपना प्रश्न पूछें या बोलें।'
        : lang === 'kn'
        ? 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಕೇಳಿ ಅಥವಾ ಮಾತನಾಡಿ.'
        : 'Please ask or speak your question.';

    return {
      text,
      spokenText: text,
      language: lang,
      intent: 'QUERY',
      source: 'LOCAL_EXPERT_ENGINE',
    };
  }
}

export const aiService = new AIService();
