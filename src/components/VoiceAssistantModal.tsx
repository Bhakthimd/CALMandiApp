import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMandi } from '../context/MandiContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { aiService, SupportedLanguage, AIResponse } from '../services/aiService';
import { speechService } from '../services/speechService';

interface VoiceAssistantModalProps {
  visible: boolean;
  onClose: () => void;
  navigation: any;
}

export default function VoiceAssistantModal({
  visible,
  onClose,
  navigation,
}: VoiceAssistantModalProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const {
    currentUser,
    isOwner,
    products,
    customers,
    todaySales,
    totalUdhaar,
    todayProfit,
    recordArrival,
    recordSale,
  } = useMandi();

  const { language: appLanguage } = useLanguage();
  const defaultLanguage: SupportedLanguage =
    appLanguage === 'hi' || appLanguage === 'kn' ? appLanguage : 'en';
  const [languageOverride, setLanguageOverride] = useState<SupportedLanguage | null>(null);
  const selectedLanguage = languageOverride || defaultLanguage;

  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);
  const [pendingTransaction, setPendingTransaction] = useState<AIResponse | null>(null);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);

  // Waveform pulse animation
  const [pulseAnim] = useState(() => new Animated.Value(1));
  const textInputRef = useRef<any>(null);
  const transcriptRef = useRef<string>('');

  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;
    if (isListening) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 550,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 550,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
    } else {
      pulseAnim.setValue(1);
    }

    return () => {
      animation?.stop();
    };
  }, [isListening, pulseAnim]);

  const handleCloseModal = () => {
    speechService.stop();
    speechService.stopListening();
    setIsListening(false);
    setIsProcessing(false);
    setTranscript('');
    setManualInput('');
    setAiResponse(null);
    setPendingTransaction(null);
    setVoiceNotice(null);
    setLanguageOverride(null);
    onClose();
  };

  // Start listening with Web Speech API or friendly fallback
  const handleStartListening = () => {
    speechService.stop();
    setAiResponse(null);
    setPendingTransaction(null);
    setVoiceNotice(null);
    transcriptRef.current = '';
    setIsListening(true);

    const isSupported = speechService.isRecognitionSupported();

    if (isSupported) {
      setTranscript(
        selectedLanguage === 'hi'
          ? 'सुन रहा हूँ... बोलिए...'
          : selectedLanguage === 'kn'
          ? 'ಕೇಳಿಸಿಕೊಳ್ಳುತ್ತಿದ್ದೇನೆ... ಮಾತನಾಡಿ...'
          : 'Listening... Please speak...'
      );

      const success = speechService.startListening({
        language: selectedLanguage,
        onResult: (spokenText: string, isFinal: boolean) => {
          transcriptRef.current = spokenText;
          setTranscript(spokenText);
          if (isFinal) {
            speechService.stopListening();
            setIsListening(false);
            executeVoiceQuery(spokenText);
          }
        },
        onError: () => {
          setIsListening(false);
          setVoiceNotice(
            selectedLanguage === 'hi'
              ? 'माइक से आवाज़ नहीं पहचानी गई। नीचे दिए गए सुझावों को टैप करें या टाइप करें।'
              : selectedLanguage === 'kn'
              ? 'ಧ್ವನಿ ಗುರುತಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಕೆಳಗಿನ ಸಲಹೆಗಳನ್ನು ಬಳಸಿ.'
              : 'Could not capture speech. Please select a suggestion below or type your question.'
          );
        },
        onEnd: () => {
          setIsListening(false);
          const currentSpoken = transcriptRef.current.trim();
          if (currentSpoken && !currentSpoken.includes('...')) {
            executeVoiceQuery(currentSpoken);
          }
        },
      });

      if (!success) {
        setIsListening(false);
        setVoiceNotice(
          selectedLanguage === 'hi'
            ? 'माइक्रोफ़ोन एक्सेस उपलब्ध नहीं है। नीचे सुझाव चुनें या टाइप करें।'
            : selectedLanguage === 'kn'
            ? 'ಮೈಕ್ರೊಫೋನ್ ಲಭ್ಯವಿಲ್ಲ. ದಯವಿಟ್ಟು ಕೆಳಗಿನ ಸಲಹೆಗಳನ್ನು ಬಳಸಿ.'
            : 'Microphone access unavailable. You can type or tap suggestions below.'
        );
      }
    } else {
      setIsListening(false);
      setVoiceNotice(
        selectedLanguage === 'hi'
          ? 'इस ब्राउज़र या डिवाइस में लाइव माइक उपलब्ध नहीं है। कृपया नीचे दिए गए सुझावों पर टैप करें या अपना प्रश्न टाइप करें।'
          : selectedLanguage === 'kn'
          ? 'ಈ ಸಾಧನದಲ್ಲಿ ಲೈವ್ ಮೈಕ್ರೊಫೋನ್ ಬೆಂಬಲಿತವಾಗಿಲ್ಲ. ದಯವಿಟ್ಟು ಕೆಳಗಿನ ಸಲಹೆಗಳನ್ನು ಟ್ಯಾಪ್ ಮಾಡಿ ಅಥವಾ ಟೈಪ್ ಮಾಡಿ.'
          : 'Live microphone is not supported in this browser. Please tap any suggestion below or type your question.'
      );
      textInputRef.current?.focus?.();
    }
  };

  const handleStopListening = () => {
    speechService.stopListening();
    setIsListening(false);
    const spoken = transcriptRef.current.trim() || transcript.trim();
    if (spoken && !spoken.includes('...')) {
      executeVoiceQuery(spoken);
    } else {
      setTranscript('');
    }
  };

  const executeVoiceQuery = async (queryText: string) => {
    const cleanQuery = queryText.trim();
    if (!cleanQuery) return;

    speechService.stop();
    speechService.stopListening();
    setIsListening(false);
    setTranscript(cleanQuery);
    setIsProcessing(true);
    setPendingTransaction(null);
    setVoiceNotice(null);

    try {
      const response = await aiService.processPrompt(cleanQuery, {
        currentUser,
        isOwner,
        products,
        customers,
        todaySales,
        totalUdhaar,
        todayProfit,
        language: selectedLanguage,
      });

      setAiResponse(response);
      setIsProcessing(false);

      // Speak response aloud using Text-to-Speech
      if (response.spokenText) {
        speechService.speak(response.spokenText, {
          language: selectedLanguage,
        });
      }

      // If sensitive transaction, prompt for explicit confirmation
      if (response.requiresConfirmation && response.transactionPayload) {
        setPendingTransaction(response);
        return;
      }

      // If navigation command, auto-navigate after speaking
      if (response.intent === 'NAVIGATE' && response.navigationTarget) {
        setTimeout(() => {
          handleCloseModal();
          navigation.navigate(response.navigationTarget);
        }, 1500);
      }
    } catch {
      setIsProcessing(false);
      const errText =
        selectedLanguage === 'hi'
          ? 'क्षमा करें, उत्तर प्राप्त करने में समस्या आई।'
          : selectedLanguage === 'kn'
          ? 'ಕ್ಷಮಿಸಿ, ಪ್ರತಿಕ್ರಿಯೆ ಪಡೆಯಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.'
          : 'Could not process voice command. Please try again.';
      setAiResponse({
        text: errText,
        spokenText: errText,
        language: selectedLanguage,
        intent: 'QUERY',
        source: 'LOCAL_EXPERT_ENGINE',
      });
    }
  };

  // Safe Transaction Confirmation
  const handleConfirmTransaction = async () => {
    if (!pendingTransaction || !pendingTransaction.transactionPayload) return;
    const payload = pendingTransaction.transactionPayload;

    try {
      const product =
        products.find(
          (p) =>
            p.id === payload.productId ||
            p.name.toLowerCase() === payload.productName.toLowerCase()
        ) || products[0];

      if (payload.type === 'INWARD') {
        recordArrival({
          productId: product ? product.id : 'prod_default',
          productName: payload.productName || (product ? product.name : 'Produce'),
          category: product ? product.category : 'Vegetables',
          quantity: payload.quantity,
          unit: payload.unit || 'Kg',
          farmerName: 'Voice Assistant Arrival',
          notes: 'Recorded via AI Voice Assistant with Owner Confirmation',
        });
      } else {
        const unitPrice = product?.price ? parseFloat(product.price) : 50;
        recordSale({
          productId: product ? product.id : 'prod_default',
          productName: payload.productName || (product ? product.name : 'Produce'),
          category: product ? product.category : 'Vegetables',
          quantity: payload.quantity,
          unit: payload.unit || 'Kg',
          unitPrice,
          totalAmount: payload.quantity * unitPrice,
          customerName: 'Voice Assistant Buyer',
          paymentMethod: 'Cash',
          notes: 'Recorded via AI Voice Assistant with Owner Confirmation',
        });
      }

      const successMsg =
        selectedLanguage === 'hi'
          ? `सफलतापूर्वक दर्ज किया गया: ${payload.quantity} ${payload.unit} ${payload.productName}। स्टॉक अपडेट हो गया है।`
          : selectedLanguage === 'kn'
          ? `ಯಶಸ್ವಿಯಾಗಿ ದಾಖಲಿಸಲಾಗಿದೆ: ${payload.quantity} ${payload.unit} ${payload.productName}. ಸ್ಟಾಕ್ ನವೀಕರಿಸಲಾಗಿದೆ.`
          : `Recorded successfully: ${payload.quantity} ${payload.unit} of ${payload.productName}. Stock has been updated.`;

      setPendingTransaction(null);
      setAiResponse({
        text: successMsg,
        spokenText: successMsg,
        language: selectedLanguage,
        intent: 'TRANSACTION',
        source: 'LOCAL_EXPERT_ENGINE',
      });

      speechService.speak(successMsg, { language: selectedLanguage });
      Alert.alert('Transaction Recorded ✅', successMsg);
    } catch {
      Alert.alert('Error', 'Failed to record transaction. Please try again manually.');
    }
  };

  // Voice command suggestions per language
  const suggestedCommands: Record<SupportedLanguage, string[]> = {
    en: [
      "Show today's sales",
      'How much stock is available?',
      'Show pending udhaar',
      'Add 20 kg of almonds',
      'Open product catalogue',
      'Create a sales slip',
    ],
    hi: [
      'आज की बिक्री दिखाओ',
      'कितना स्टॉक उपलब्ध है?',
      'बाज़ार उधारी कितनी है?',
      '20 किलो बादाम जोड़ो',
      'उत्पाद सूची खोलो',
      'डिलीवरी पर्ची बनाओ',
    ],
    kn: [
      'ಇಂದಿನ ಮಾರಾಟ ತೋರಿಸಿ',
      'ಎಷ್ಟು ಸ್ಟಾಕ್ ಲಭ್ಯವಿದೆ?',
      'ಬಾಕಿ ಉದ್ಧಾರ ಎಷ್ಟು?',
      '20 ಕೆಜಿ ಬಾದಾಮಿ ಸೇರಿಸಿ',
      'ಉತ್ಪನ್ನಗಳ ಪಟ್ಟಿ ತೆರೆಯಿರಿ',
      'ಮಾರಾಟ ರಶೀದಿ ಮಾಡಿ',
    ],
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleCloseModal}
    >
      <KeyboardAvoidingView
        style={[styles.overlay, { backgroundColor: colors.modalOverlay }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View
          style={[
            styles.cardContainer,
            {
              paddingBottom: Math.max(insets.bottom + 16, 24),
              backgroundColor: colors.modalBackground,
            },
          ]}
        >
          {/* Header */}
          <View
            style={[
              styles.modalHeader,
              { borderBottomColor: isDark ? colors.border : '#F1F5F9' },
            ]}
          >
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.headerBadge,
                  { backgroundColor: isDark ? '#143823' : '#E8F5E9' },
                ]}
              >
                <Ionicons
                  name="sparkles"
                  size={16}
                  color={isDark ? '#4ADE80' : '#16864B'}
                />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                  AI Voice Assistant
                </Text>
                <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                  {selectedLanguage === 'hi'
                    ? 'CAL Mandi आवाज़ सहायक'
                    : selectedLanguage === 'kn'
                    ? 'CAL Mandi ಧ್ವನಿ ಸಹಾಯಕ'
                    : 'Natural Speech Operations'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleCloseModal}
              style={[
                styles.closeBtn,
                { backgroundColor: isDark ? colors.surfaceElevated : '#F8FAFC' },
              ]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name="close"
                size={22}
                color={isDark ? colors.textSecondary : '#64748B'}
              />
            </TouchableOpacity>
          </View>

          {/* Language Selector Tabs */}
          <View
            style={[
              styles.langSelectorRow,
              { borderBottomColor: isDark ? colors.border : '#F8FAFC' },
            ]}
          >
            {[
              { code: 'en', label: 'English' },
              { code: 'hi', label: 'हिंदी (Hindi)' },
              { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
            ].map((item) => (
              <TouchableOpacity
                key={item.code}
                style={[
                  styles.langChip,
                  { backgroundColor: isDark ? colors.surfaceElevated : '#F1F5F9' },
                  selectedLanguage === item.code && [
                    styles.langChipActive,
                    { backgroundColor: isDark ? colors.primary : '#16864B' },
                  ],
                ]}
                onPress={() => setLanguageOverride(item.code as SupportedLanguage)}
              >
                <Text
                  style={[
                    styles.langChipText,
                    { color: isDark ? colors.textSecondary : '#475569' },
                    selectedLanguage === item.code && styles.langChipTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Waveform & Big Mic Button */}
            <View style={styles.micSection}>
              <Animated.View
                style={[
                  styles.pulseCircle,
                  {
                    transform: [{ scale: pulseAnim }],
                    backgroundColor: isListening
                      ? 'rgba(22, 134, 75, 0.18)'
                      : 'transparent',
                  },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.bigMicButton,
                    { backgroundColor: isDark ? colors.primary : '#16864B' },
                    isListening && styles.bigMicButtonListening,
                  ]}
                  onPress={isListening ? handleStopListening : handleStartListening}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={isListening ? 'mic' : 'mic-outline'}
                    size={40}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>
              </Animated.View>

              <Text
                style={[
                  styles.micStatusText,
                  { color: isDark ? colors.textSecondary : '#475569' },
                ]}
              >
                {isListening
                  ? selectedLanguage === 'hi'
                    ? 'सुन रहा हूँ... बोलिए...'
                    : selectedLanguage === 'kn'
                    ? 'ಕೇಳಿಸಿಕೊಳ್ಳುತ್ತಿದ್ದೇನೆ...'
                    : 'Listening to your voice...'
                  : selectedLanguage === 'hi'
                  ? 'बोलने के लिए माइक दबाएँ या टाइप करें'
                  : selectedLanguage === 'kn'
                  ? 'ಮಾತನಾಡಲು ಮೈಕ್ ಒತ್ತಿರಿ ಅಥವಾ ಟೈಪ್ ಮಾಡಿ'
                  : 'Tap mic to speak or type below'}
              </Text>
            </View>

            {/* Direct Voice & Text Input Bar */}
            <View
              style={[
                styles.directInputBar,
                {
                  backgroundColor: isDark ? colors.surfaceElevated : '#F8FAFC',
                  borderColor: isDark ? colors.border : '#E2E8F0',
                },
              ]}
            >
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={18}
                color={isDark ? '#4ADE80' : '#16864B'}
              />
              <TextInput
                ref={textInputRef}
                style={[styles.directInput, { color: colors.textPrimary }]}
                placeholder={
                  selectedLanguage === 'hi'
                    ? 'कमांड लिखें: आज की बिक्री, स्टॉक, उधारी...'
                    : selectedLanguage === 'kn'
                    ? 'ಆದೇಶ ಬರೆಯಿರಿ: ಇಂದಿನ ಮಾರಾಟ, ಸ್ಟಾಕ್...'
                    : 'Ask: sales, stock, pending udhaar, add almonds...'
                }
                placeholderTextColor={colors.inputPlaceholder}
                value={manualInput}
                onChangeText={setManualInput}
                returnKeyType="send"
                onSubmitEditing={() => {
                  if (manualInput.trim()) {
                    executeVoiceQuery(manualInput.trim());
                    setManualInput('');
                  }
                }}
              />
              <TouchableOpacity
                style={[
                  styles.directSendBtn,
                  {
                    backgroundColor: manualInput.trim()
                      ? (isDark ? colors.primary : '#16864B')
                      : (isDark ? '#334155' : '#CBD5E1'),
                  },
                ]}
                disabled={!manualInput.trim()}
                activeOpacity={0.8}
                onPress={() => {
                  if (manualInput.trim()) {
                    executeVoiceQuery(manualInput.trim());
                    setManualInput('');
                  }
                }}
              >
                <Ionicons name="arrow-up" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Voice Notice (if any) */}
            {voiceNotice && (
              <View
                style={[
                  styles.noticeBox,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#FEF3C7',
                    borderColor: isDark ? '#334155' : '#FDE68A',
                  },
                ]}
              >
                <Ionicons name="information-circle" size={16} color="#D97706" />
                <Text style={[styles.noticeText, { color: isDark ? '#FDE68A' : '#92400E' }]}>
                  {voiceNotice}
                </Text>
              </View>
            )}

            {/* Live Transcript / Processing */}
            {transcript ? (
              <View
                style={[
                  styles.transcriptBox,
                  {
                    backgroundColor: isDark ? '#143823' : '#F0FDF4',
                    borderColor: isDark ? '#235336' : '#BBF7D0',
                  },
                ]}
              >
                <Ionicons
                  name="volume-medium"
                  size={16}
                  color={isDark ? '#4ADE80' : '#16864B'}
                />
                <Text
                  style={[
                    styles.transcriptText,
                    { color: isDark ? '#FFFFFF' : '#166534' },
                  ]}
                >
                  &ldquo;{transcript}&rdquo;
                </Text>
              </View>
            ) : null}

            {isProcessing && (
              <View style={styles.processingRow}>
                <ActivityIndicator
                  size="small"
                  color={isDark ? colors.primary : '#16864B'}
                />
                <Text
                  style={[
                    styles.processingText,
                    { color: isDark ? colors.textSecondary : '#64748B' },
                  ]}
                >
                  Processing with AI...
                </Text>
              </View>
            )}

            {/* AI Response Bubble */}
            {aiResponse && !isProcessing && (
              <View
                style={[
                  styles.responseCard,
                  {
                    backgroundColor: isDark ? colors.surfaceElevated : '#FFFFFF',
                    borderColor: isDark ? colors.border : '#E2E8F0',
                  },
                ]}
              >
                <View style={styles.responseHeader}>
                  <View
                    style={[
                      styles.aiBadge,
                      { backgroundColor: isDark ? '#143823' : '#E8F5E9' },
                    ]}
                  >
                    <Ionicons
                      name="sparkles"
                      size={14}
                      color={isDark ? '#4ADE80' : '#16864B'}
                    />
                    <Text
                      style={[
                        styles.aiBadgeText,
                        { color: isDark ? '#4ADE80' : '#16864B' },
                      ]}
                    >
                      {aiResponse.source === 'GEMINI_LLM' ? 'Gemini AI' : 'Mandi AI'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.replaySpeakerBtn,
                      { backgroundColor: isDark ? colors.cardBackground : '#F1F5F9' },
                    ]}
                    onPress={() =>
                      speechService.speak(aiResponse.spokenText, {
                        language: selectedLanguage,
                      })
                    }
                  >
                    <Ionicons
                      name="volume-high"
                      size={18}
                      color={isDark ? '#4ADE80' : '#16864B'}
                    />
                    <Text style={[styles.replaySpeakerText, { color: isDark ? '#4ADE80' : '#16864B' }]}>
                      Listen Again
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text
                  style={[
                    styles.responseText,
                    { color: colors.textPrimary },
                  ]}
                >
                  {aiResponse.text}
                </Text>
              </View>
            )}

            {/* Sensitive Transaction Confirmation Dialog */}
            {pendingTransaction && (
              <View
                style={[
                  styles.confirmationBox,
                  {
                    backgroundColor: isDark ? '#3B2904' : '#FFFBEB',
                    borderColor: isDark ? '#78350F' : '#FDE68A',
                  },
                ]}
              >
                <View style={styles.confHeader}>
                  <Ionicons
                    name="alert-circle"
                    size={20}
                    color={isDark ? '#FBBF24' : '#D97706'}
                  />
                  <Text
                    style={[
                      styles.confTitle,
                      { color: isDark ? '#FBBF24' : '#92400E' },
                    ]}
                  >
                    Transaction Confirmation
                  </Text>
                </View>
                <Text
                  style={[
                    styles.confMessage,
                    { color: isDark ? '#FDE68A' : '#78350F' },
                  ]}
                >
                  {pendingTransaction.confirmationMessage}
                </Text>
                <View style={styles.confBtnRow}>
                  <TouchableOpacity
                    style={[
                      styles.confCancelBtn,
                      { backgroundColor: isDark ? colors.surfaceMuted : '#F3F4F6' },
                    ]}
                    onPress={() => setPendingTransaction(null)}
                  >
                    <Text
                      style={[
                        styles.confCancelText,
                        { color: isDark ? colors.textSecondary : '#4B5563' },
                      ]}
                    >
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.confProceedBtn,
                      { backgroundColor: isDark ? colors.primary : '#16864B' },
                    ]}
                    onPress={handleConfirmTransaction}
                  >
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    <Text style={styles.confProceedText}>Yes, Proceed</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Suggested Voice Commands */}
            <View style={styles.suggestedSection}>
              <Text
                style={[
                  styles.suggestedHeading,
                  { color: isDark ? colors.textSecondary : '#64748B' },
                ]}
              >
                {selectedLanguage === 'hi'
                  ? 'सुझाए गए आदेश (टैप करें):'
                  : selectedLanguage === 'kn'
                  ? 'ಸೂಚಿಸಲಾದ ಆದೇಶಗಳು (ಒತ್ತಿರಿ):'
                  : 'Or tap a voice command to try:'}
              </Text>

              <View style={styles.commandChipsWrap}>
                {suggestedCommands[selectedLanguage].map((cmd, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.commandChip,
                      {
                        backgroundColor: isDark ? colors.surfaceElevated : '#F8FAFC',
                        borderColor: isDark ? colors.border : '#E2E8F0',
                      },
                    ]}
                    onPress={() => executeVoiceQuery(cmd)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="mic"
                      size={13}
                      color={isDark ? '#4ADE80' : '#16864B'}
                    />
                    <Text
                      style={[
                        styles.commandChipText,
                        { color: isDark ? colors.textPrimary : '#334155' },
                      ]}
                    >
                      {cmd}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 16,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  langSelectorRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  langChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  langChipActive: {
    backgroundColor: '#16864B',
  },
  langChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  langChipTextActive: {
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  micSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  pulseCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigMicButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#16864B',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#16864B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  bigMicButtonListening: {
    backgroundColor: '#DC2626',
    shadowColor: '#DC2626',
  },
  micStatusText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '600',
  },
  directInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 10,
    gap: 8,
  },
  directInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 4,
  },
  directSendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginVertical: 6,
    gap: 8,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  transcriptBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginVertical: 8,
    gap: 8,
  },
  transcriptText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  processingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  processingText: {
    fontSize: 13,
  },
  responseCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  responseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  aiBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  replaySpeakerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  replaySpeakerText: {
    fontSize: 11,
    fontWeight: '700',
  },
  responseText: {
    fontSize: 14,
    lineHeight: 20,
  },
  confirmationBox: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginVertical: 8,
  },
  confHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  confTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  confMessage: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  confBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  confCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  confCancelText: {
    fontSize: 13,
    fontWeight: '600',
  },
  confProceedBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  confProceedText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  suggestedSection: {
    marginTop: 12,
  },
  suggestedHeading: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  commandChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  commandChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 5,
  },
  commandChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
