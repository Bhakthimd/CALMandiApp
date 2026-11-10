import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMandi } from '../context/MandiContext';
import { useTheme } from '../context/ThemeContext';
import { aiService, SupportedLanguage } from '../services/aiService';
import { speechService } from '../services/speechService';
import VoiceAssistantModal from '../components/VoiceAssistantModal';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  language?: SupportedLanguage;
}

let messageSeq = 1;
function generateMessageId(prefix: string): string {
  messageSeq += 1;
  return `${prefix}_${messageSeq}`;
}

function getFormattedCurrentTime(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatbotScreen({ navigation }: any) {
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
  } = useMandi();

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('en');
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome_1',
      sender: 'ai',
      text:
        '👋 Welcome to CAL Mandi AI Operations Assistant!\n\nI can help you check stock, review sales and market udhaar, guide you through recording arrivals & sales, creating slips, or explaining APMC Mandi operations.\n\nType a question below or choose a suggested topic.',
      timestamp: getFormattedCurrentTime(),
      language: 'en',
    },
  ]);

  const scrollViewRef = useRef<any>(null);

  useEffect(() => {
    speechService.stop();
    return () => {
      speechService.stop();
    };
  }, []);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    speechService.stop();
    const timeStr = getFormattedCurrentTime();

    const userMsg: ChatMessage = {
      id: generateMessageId('usr'),
      sender: 'user',
      text,
      timestamp: timeStr,
      language: selectedLanguage,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const response = await aiService.processPrompt(text, {
        currentUser,
        isOwner,
        products,
        customers,
        todaySales,
        totalUdhaar,
        todayProfit,
        language: selectedLanguage,
      });

      const aiMsg: ChatMessage = {
        id: generateMessageId('ai'),
        sender: 'ai',
        text: response.text,
        timestamp: getFormattedCurrentTime(),
        language: response.language,
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    } catch {
      setIsTyping(false);
      const errMsg: ChatMessage = {
        id: generateMessageId('err'),
        sender: 'ai',
        text: 'Sorry, I encountered an issue processing your request. Please try again.',
        timestamp: getFormattedCurrentTime(),
        language: selectedLanguage,
      };
      setMessages((prev) => [...prev, errMsg]);
    }
  };

  const handleClearChat = () => {
    Alert.alert(
      'Clear Conversation',
      'Are you sure you want to clear your conversation history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            speechService.stop();
            setMessages([
              {
                id: 'welcome_reset',
                sender: 'ai',
                text: 'Conversation cleared. How can I assist you with your Mandi today?',
                timestamp: getFormattedCurrentTime(),
                language: selectedLanguage,
              },
            ]);
          },
        },
      ]
    );
  };

  const suggestedQuestions = [
    'How do I add a product?',
    'How do I manage inventory?',
    'How do I record inward arrivals?',
    'How do I create a sales slip?',
    'How do I manage customer payments?',
    'How do I check today’s sales?',
    'What is patti?',
    'How do I use product grades?',
    'How do I record wastage?',
  ];

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: isDark ? colors.background : '#F7F9F8' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* WhatsApp-Style Mandi Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top + 8, 36),
            backgroundColor: isDark ? colors.cardBackground : '#16864B',
            borderBottomWidth: isDark ? 1 : 0,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => {
            speechService.stop();
            navigation.goBack();
          }}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <View
          style={[
            styles.avatarWrap,
            { backgroundColor: isDark ? '#143823' : '#FFFFFF' },
          ]}
        >
          <Ionicons
            name="sparkles"
            size={18}
            color={isDark ? '#4ADE80' : '#16864B'}
          />
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>CAL Mandi AI</Text>
          <Text
            style={[
              styles.headerSubtitle,
              { color: isDark ? colors.textSecondary : '#D1FAE5' },
            ]}
          >
            Online • Instant Mandi Support
          </Text>
        </View>

        {/* Language selector chip */}
        <TouchableOpacity
          style={styles.langToggleBtn}
          onPress={() => {
            const nextLang =
              selectedLanguage === 'en' ? 'hi' : selectedLanguage === 'hi' ? 'kn' : 'en';
            setSelectedLanguage(nextLang);
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.langToggleText}>
            {selectedLanguage === 'en' ? 'EN' : selectedLanguage === 'hi' ? 'हिंदी' : 'ಕನ್ನಡ'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleClearChat}
          style={styles.clearBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Suggested Quick Questions Bar */}
      <View
        style={[
          styles.suggestionsContainer,
          {
            backgroundColor: isDark ? colors.cardBackground : '#FFFFFF',
            borderBottomColor: isDark ? colors.border : '#E2E8F0',
          },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.suggestionsScroll}
        >
          {suggestedQuestions.map((q, idx) => (
            <TouchableOpacity
              key={idx}
              style={[
                styles.suggestChip,
                {
                  backgroundColor: isDark ? colors.surfaceElevated : '#F1F5F9',
                  borderColor: isDark ? colors.border : '#E2E8F0',
                },
              ]}
              onPress={() => handleSendMessage(q)}
              activeOpacity={0.7}
            >
              <Ionicons
                name="help-circle-outline"
                size={13}
                color={isDark ? '#4ADE80' : '#16864B'}
              />
              <Text
                style={[
                  styles.suggestChipText,
                  { color: isDark ? colors.textPrimary : '#334155' },
                ]}
              >
                {q}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Messages Scroll Area */}
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map((item) => {
          const isUser = item.sender === 'user';
          return (
            <View
              key={item.id}
              style={[
                styles.messageRow,
                isUser ? styles.messageRowUser : styles.messageRowAi,
              ]}
            >
              <View
                style={[
                  styles.messageBubble,
                  isUser
                    ? [
                        styles.bubbleUser,
                        isDark && { backgroundColor: '#143823' },
                      ]
                    : [
                        styles.bubbleAi,
                        isDark && {
                          backgroundColor: colors.surfaceElevated,
                          borderColor: colors.border,
                        },
                      ],
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    isUser
                      ? [styles.messageTextUser, isDark && { color: '#FFFFFF' }]
                      : [styles.messageTextAi, isDark && { color: '#FFFFFF' }],
                  ]}
                >
                  {item.text}
                </Text>

                <View style={styles.bubbleFooter}>
                  <Text
                    style={[
                      styles.timestampText,
                      isUser
                        ? [styles.timestampUser, isDark && { color: colors.textSecondary }]
                        : [styles.timestampAi, isDark && { color: colors.textSecondary }],
                    ]}
                  >
                    {item.timestamp}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}

        {isTyping && (
          <View style={[styles.messageRow, styles.messageRowAi]}>
            <View
              style={[
                styles.messageBubble,
                styles.bubbleAi,
                styles.typingBubble,
                isDark && {
                  backgroundColor: colors.surfaceElevated,
                  borderColor: colors.border,
                },
              ]}
            >
              <ActivityIndicator
                size="small"
                color={isDark ? '#4ADE80' : '#16864B'}
              />
              <Text
                style={[
                  styles.typingText,
                  isDark && { color: colors.textSecondary },
                ]}
              >
                CAL Mandi AI is typing...
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input Bar */}
      <View
        style={[
          styles.inputContainer,
          {
            paddingBottom: Math.max(insets.bottom + 8, 14),
            backgroundColor: isDark ? colors.cardBackground : '#FFFFFF',
            borderTopColor: isDark ? colors.border : '#E2E8F0',
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.micInputBtn,
            { backgroundColor: isDark ? colors.surfaceElevated : '#F1F5F9' },
          ]}
          onPress={() => setIsVoiceModalOpen(true)}
          activeOpacity={0.7}
        >
          <Ionicons
            name="mic"
            size={22}
            color={isDark ? '#4ADE80' : '#16864B'}
          />
        </TouchableOpacity>

        <TextInput
          style={[
            styles.textInput,
            {
              backgroundColor: isDark ? colors.inputBackground : '#F8FAFC',
              borderColor: isDark ? colors.border : '#E2E8F0',
              color: colors.textPrimary,
            },
          ]}
          placeholder="Ask a question about Mandi..."
          placeholderTextColor={colors.inputPlaceholder}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={300}
        />

        <TouchableOpacity
          style={[
            styles.sendBtn,
            { backgroundColor: isDark ? colors.primary : '#16864B' },
            !inputText.trim() && [
              styles.sendBtnDisabled,
              { backgroundColor: isDark ? colors.surfaceMuted : '#94A3B8' },
            ],
          ]}
          onPress={() => handleSendMessage()}
          disabled={!inputText.trim()}
          activeOpacity={0.8}
        >
          <Ionicons name="send" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Embedded Voice Assistant Modal */}
      <VoiceAssistantModal
        visible={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        navigation={navigation}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: '#16864B',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  backBtn: {
    marginRight: 10,
    padding: 4,
  },
  avatarWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#D1FAE5',
    fontSize: 11,
  },
  langToggleBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 10,
  },
  langToggleText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  clearBtn: {
    padding: 6,
  },
  suggestionsContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 8,
  },
  suggestionsScroll: {
    paddingHorizontal: 14,
    gap: 8,
  },
  suggestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  suggestChipText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
  },
  messagesList: {
    padding: 16,
    gap: 12,
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: 2,
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowAi: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '82%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  bubbleUser: {
    backgroundColor: '#DCF8C6',
    borderTopRightRadius: 4,
  },
  bubbleAi: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageTextUser: {
    color: '#0F172A',
  },
  messageTextAi: {
    color: '#0F172A',
  },
  bubbleFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  timestampText: {
    fontSize: 10,
  },
  timestampUser: {
    color: '#64748B',
  },
  timestampAi: {
    color: '#94A3B8',
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  typingText: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 8,
  },
  micInputBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0F172A',
    maxHeight: 90,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#16864B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#94A3B8',
    opacity: 0.5,
  },
});
