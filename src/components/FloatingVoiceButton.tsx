import React, { useState } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import VoiceAssistantModal from './VoiceAssistantModal';

interface FloatingVoiceButtonProps {
  navigation: any;
  bottomOffset?: number;
}

export default function FloatingVoiceButton({
  navigation,
  bottomOffset = 76,
}: FloatingVoiceButtonProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const { colors, isDark } = useTheme();

  return (
    <>
      <View
        style={[
          styles.container,
          { bottom: bottomOffset },
        ]}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          style={[
            styles.floatingBtn,
            {
              backgroundColor: isDark ? colors.primary : '#16864B',
              borderColor: isDark ? colors.border : '#FFFFFF',
            },
          ]}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="mic" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <VoiceAssistantModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        navigation={navigation}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 18,
    zIndex: 90,
  },
  floatingBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#16864B',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#16864B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
