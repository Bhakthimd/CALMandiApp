import React, { useState } from 'react';
import { View, Text, Image, ImageStyle, StyleProp, ImageResizeMode } from 'react-native';
import { getProductEmoji, getProductImage } from '../utils/productImages';
import { useTheme } from '../context/ThemeContext';

interface SmartProductImageProps {
  name?: string;
  category?: string;
  image?: string;
  uri?: string;
  style?: StyleProp<ImageStyle>;
  resizeMode?: ImageResizeMode;
  emojiSize?: number;
}

export default function SmartProductImage({
  name,
  category,
  image,
  uri,
  style,
  resizeMode = 'cover',
  emojiSize = 26,
}: SmartProductImageProps) {
  const { isDark } = useTheme();
  const resolvedUri = uri || getProductImage({ name, category, image });
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const hasError = failedUri === resolvedUri;

  if (hasError || !resolvedUri) {
    return (
      <View
        style={[
          style as any,
          {
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isDark ? '#143823' : '#ECFDF5',
          },
        ]}
      >
        <Text style={{ fontSize: emojiSize }}>{getProductEmoji(name, category)}</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: resolvedUri }}
      style={style}
      resizeMode={resizeMode}
      onError={() => setFailedUri(resolvedUri)}
    />
  );
}
