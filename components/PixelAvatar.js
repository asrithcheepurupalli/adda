import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { pixelAvatar } from '../lib/avatars';
import { colors } from '../constants/theme';

/**
 * A pixel-art character avatar in a chunky square token.
 */
export default function PixelAvatar({ seed, size = 44, tint, border = true, style }) {
  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: Math.max(3, Math.round(size * 0.16)),
          backgroundColor: tint || colors.ink3,
          borderWidth: border ? Math.max(2, Math.round(size * 0.05)) : 0,
        },
        style,
      ]}
    >
      <Image source={{ uri: pixelAvatar(seed, 160) }} style={styles.img} resizeMode="cover" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden', borderColor: '#fff' },
  img: { width: '100%', height: '100%' },
});
