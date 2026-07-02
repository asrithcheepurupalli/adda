import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../constants/theme';

/**
 * The Adda street wordmark. Heavy condensed, skewed, maroon-red.
 */
export default function Wordmark({ size = 96, color = colors.red, style }) {
  return (
    <View style={[styles.wrap, style]}>
      <Text
        style={[
          styles.word,
          { fontSize: size, lineHeight: size * 1.02, color },
        ]}
      >
        adda
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { transform: [{ skewX: '-9deg' }] },
  word: {
    fontFamily: fonts.display,
    textTransform: 'uppercase',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 3, height: 4 },
    textShadowRadius: 0,
  },
});
