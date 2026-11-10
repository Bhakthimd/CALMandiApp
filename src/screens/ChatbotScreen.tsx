import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Keyboard,
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

  // Initial welcome message displayed ONCE when conversation starts
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

  // Automatically scroll to the latest message on content or typing updates
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, isTyping]);

  // Keep latest message visible above keyboard when keyboard slides up
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 80);
      }
    );
    return () => {
      showSub.remove();
    };
  }, []);

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

    // Preserve full conversation history without repeating welcome
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
        text: 'Sorry, I encountered an issue processing your request. Please try asking again.',
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
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Clean Mandi Green Header with Integrated Navigation & Settings */}
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

        {/* Clean Header Settings Button (Replaces any floating button) */}
        <TouchableOpacity
          onPress={() => {
            speechService.stop();
            navigation.navigate('Settings');
          }}
          style={styles.headerActionBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
        >
          <Ionicons name="settings-outline" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Clear Conversation History Button */}
        <TouchableOpacity
          onPress={handleClearChat}
          style={styles.headerActionBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Suggested Quick Questions Bar (Horizontally scrollable with no clipping) */}
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
          keyboardShouldPersistTaps="handled"
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
                size={14}
                color={isDark ? '#4ADE80' : '#16864B'}
              />
              <Text
                style={[
                  styles.suggestChipText,
                  { color: isDark ? colors.textPrimary : '#334155' },
                ]}
                numberOfLines={1}
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
        style={styles.messagesScroll}
        contentContainerStyle={[
          styles.messagesList,
          { paddingBottom: 16 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
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
              {!isUser && (
                <View
                  style={[
                    styles.aiAvatarSmall,
                    { backgroundColor: isDark ? '#143823' : '#E8F5EC' },
                  ]}
                >
                  <Ionicons
                    name="sparkles"
                    size={12}
                    color={isDark ? '#4ADE80' : '#16864B'}
                  />
                </View>
              )}

              <View
                style={[
                  styles.messageBubble,
                  isUser
                    ? [
                        styles.bubbleUser,
                        isDark && { backgroundColor: '#14532D', borderColor: '#166534' },
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
                {!isUser && (
                  <Text style={[styles.aiLabel, { color: isDark ? '#4ADE80' : '#16834A' }]}>
                    CAL Mandi Assistant
                  </Text>
                )}

                <Text
                  style={[
                    styles.messageText,
                    isUser
                      ? [styles.messageTextUser, isDark && { color: '#FFFFFF' }]
                      : [styles.messageTextAi, isDark && { color: colors.textPrimary }],
                  ]}
                  selectable
                >
                  {item.text}
                </Text>

                <View style={styles.bubbleFooter}>
                  <Text
                    style={[
                      styles.timestampText,
                      isUser
                        ? [styles.timestampUser, isDark && { color: '#86EFAC' }]
                        : [styles.timestampAi, isDark && { color: colors.textSecondary }],
                    ]}
                  >
                    {item.timestamp}
                  </Text>
                  {isUser && (
                    <Ionicons
                      name="checkmark-done"
                      size={14}
                      color={isDark ? '#86EFAC' : '#16834A'}
                    />
                  )}
                </View>
              </View>
            </View>
          );
        })}

        {isTyping && (
          <View style={[styles.messageRow, styles.messageRowAi]}>
            <View
              style={[
                styles.aiAvatarSmall,
                { backgroundColor: isDark ? '#143823' : '#E8F5EC' },
              ]}
            >
              <Ionicons
                name="sparkles"
                size={12}
                color={isDark ? '#4ADE80' : '#16864B'}
              />
            </View>

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
                  { color: isDark ? colors.textSecondary : '#64748B' },
                ]}
              >
                CAL Mandi AI is typing...
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Input Area: Consistent Alignment, Multiline Support, Non-Shrinking Buttons */}
      <View
        style={[
          styles.inputContainer,
          {
            paddingBottom: Math.max(insets.bottom + 8, 12),
            backgroundColor: isDark ? colors.cardBackground : '#FFFFFF',
            borderTopColor: isDark ? colors.border : '#E2E8F0',
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.actionIconBtn,
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
          maxLength={400}
        />

        <TouchableOpacity
          style={[
            styles.actionIconBtn,
            styles.sendBtn,
            { backgroundColor: isDark ? colors.primary : '#16864B' },
            !inputText.trim() && [
              styles.sendBtnDisabled,
              { backgroundColor: isDark ? colors.surfaceMuted : '#CBD5E1' },
            ],
          ]}
          onPress={() => handleSendMessage()}
          disabled={!inputText.trim()}
          activeOpacity={0.8}
        >
          <Ionicons
            name="send"
            size={18}
            color={inputText.trim() ? '#FFFFFF' : '#94A3B8'}
          />
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
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
  },
  backBtn: {
    marginRight: 8,
    padding: 4,
  },
  avatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    marginTop: 1,
  },
  langToggleBtn: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    marginRight: 6,
  },
  langToggleText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  headerActionBtn: {
    padding: 6,
    marginLeft: 4,
  },
  suggestionsContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 10,
  },
  suggestionsScroll: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
  },
  suggestChipText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  messagesScroll: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: 4,
    alignItems: 'flex-end',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowAi: {
    justifyContent: 'flex-start',
  },
  aiAvatarSmall: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    marginBottom: 4,
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
    backgroundColor: '#DCFCE7',
    borderBottomRightRadius: 4,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  bubbleAi: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  aiLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
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
    gap: 4,
    marginTop: 6,
  },
  timestampText: {
    fontSize: 10,
  },
  timestampUser: {
    color: '#166534',
  },
  timestampAi: {
    color: '#94A3B8',
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  typingText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 8,
  },
  actionIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginBottom: 1,
  },
  sendBtn: {
    backgroundColor: '#16864B',
  },
  sendBtnDisabled: {
    backgroundColor: '#CBD5E1',
    opacity: 0.6,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 15,
    color: '#0F172A',
    minHeight: 42,
    maxHeight: 110,
    textAlignVertical: 'center',
  },
});
