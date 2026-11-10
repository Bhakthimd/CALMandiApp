/**
 * CALMandi Speech & Voice Service
 *
 * Provides bidirectional Voice Operations:
 * 1. Speech-to-Text (STT) via Web Speech API with fallback.
 * 2. Text-to-Speech (TTS) via Expo Speech & Web SpeechSynthesis.
 * Supports English (en-IN), Hindi (hi-IN), and Kannada (kn-IN).
 */

import * as ExpoSpeech from 'expo-speech';

export type VoiceLanguage = 'en' | 'hi' | 'kn';

export interface SpeechOptions {
  language?: VoiceLanguage;
  pitch?: number;
  rate?: number;
  onDone?: () => void;
  onError?: (error: any) => void;
}

export interface RecognitionOptions {
  language?: VoiceLanguage;
  onResult: (transcript: string, isFinal: boolean) => void;
  onError?: (error: any) => void;
  onEnd?: () => void;
}

const LANGUAGE_CODE_MAP: Record<VoiceLanguage, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  kn: 'kn-IN',
};

class SpeechService {
  private isSpeaking = false;
  private activeRecognition: any = null;
  private isListeningActive = false;

  /**
   * Checks if browser speech recognition hardware/API is available.
   */
  public isRecognitionSupported(): boolean {
    if (typeof window === 'undefined') return false;
    const win = window as any;
    return !!(win.SpeechRecognition || win.webkitSpeechRecognition);
  }

  /**
   * Starts listening to user's microphone for spoken commands.
   */
  public startListening(options: RecognitionOptions): boolean {
    this.stopListening();

    if (!this.isRecognitionSupported()) {
      return false;
    }

    try {
      const win = window as any;
      const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;
      const recognition = new SpeechRecognitionClass();

      const lang = options.language || 'en';
      recognition.lang = LANGUAGE_CODE_MAP[lang] || 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      this.isListeningActive = true;

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = 0; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            finalTranscript += item[0].transcript + ' ';
          } else {
            interimTranscript += item[0].transcript;
          }
        }

        const text = (finalTranscript + interimTranscript).trim();
        if (text) {
          options.onResult(text, !interimTranscript && !!finalTranscript.trim());
        }
      };

      recognition.onerror = (err: any) => {
        console.warn('[SpeechService] Recognition error:', err);
        this.isListeningActive = false;
        options.onError?.(err);
      };

      recognition.onend = () => {
        this.isListeningActive = false;
        this.activeRecognition = null;
        options.onEnd?.();
      };

      this.activeRecognition = recognition;
      recognition.start();
      return true;
    } catch (err) {
      console.warn('[SpeechService] Failed to start speech recognition:', err);
      this.isListeningActive = false;
      this.activeRecognition = null;
      options.onError?.(err);
      return false;
    }
  }

  /**
   * Stops active speech recognition
   */
  public stopListening(): void {
    this.isListeningActive = false;
    if (this.activeRecognition) {
      try {
        this.activeRecognition.stop();
      } catch {
        // ignore
      }
      this.activeRecognition = null;
    }
  }

  public isListening(): boolean {
    return this.isListeningActive;
  }

  /**
   * Speaks the provided text using the best available engine:
   * 1. Window SpeechSynthesis (Web)
   * 2. Expo Speech (Native iOS/Android)
   */
  public async speak(text: string, options?: SpeechOptions): Promise<void> {
    if (!text || !text.trim()) return;

    const lang = options?.language || 'en';
    const langCode = LANGUAGE_CODE_MAP[lang] || 'en-IN';
    const pitch = options?.pitch ?? 1.0;
    const rate = options?.rate ?? 0.95;

    this.isSpeaking = true;

    // Check if Web SpeechSynthesis is available
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = langCode;
        utterance.pitch = pitch;
        utterance.rate = rate;

        utterance.onend = () => {
          this.isSpeaking = false;
          options?.onDone?.();
        };

        utterance.onerror = (e) => {
          this.isSpeaking = false;
          options?.onError?.(e);
        };

        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        window.speechSynthesis.speak(utterance);
        return;
      } catch (err) {
        console.warn('[SpeechService] Web SpeechSynthesis error:', err);
      }
    }

    // Native Expo Speech
    try {
      if (ExpoSpeech && typeof ExpoSpeech.speak === 'function') {
        ExpoSpeech.stop();
        ExpoSpeech.speak(text, {
          language: langCode,
          pitch,
          rate,
          onDone: () => {
            this.isSpeaking = false;
            options?.onDone?.();
          },
          onError: (err: any) => {
            this.isSpeaking = false;
            options?.onError?.(err);
          },
        });
        return;
      }
    } catch (err) {
      console.warn('[SpeechService] Expo Speech error:', err);
    }

    // Graceful fallback
    setTimeout(() => {
      this.isSpeaking = false;
      options?.onDone?.();
    }, 1500);
  }

  /**
   * Stop any active speech output
   */
  public stop(): void {
    this.isSpeaking = false;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }

    try {
      if (ExpoSpeech && typeof ExpoSpeech.stop === 'function') {
        ExpoSpeech.stop();
      }
    } catch {
      // ignore
    }
  }

  public getSpeakingStatus(): boolean {
    return this.isSpeaking;
  }
}

export const speechService = new SpeechService();
