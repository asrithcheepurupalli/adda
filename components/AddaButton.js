import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, fonts, radius } from '../constants/theme';

/**
 * Primary / secondary / ghost button with a springy press + haptic tap.
 */
export default function AddaButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
  icon = null,
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  };
  const pressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }).start();
  };
  const handlePress = () => {
    if (disabled) return;
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
    onPress && onPress();
  };

  const isPrimary = variant === 'primary';
  const isGhost = variant === 'ghost';

  return (
    <Animated.View style={[{ transform: [{ scale }], width: '100%' }, style]}>
      <Pressable
        onPressIn={pressIn}
        onPressOut={pressOut}
        onPress={handlePress}
        disabled={disabled}
        style={[
          styles.base,
          isPrimary && styles.primary,
          variant === 'secondary' && styles.secondary,
          isGhost && styles.ghost,
          disabled && styles.disabled,
        ]}
      >
        <View style={styles.row}>
          <Text
            style={[
              styles.label,
              isPrimary && styles.labelPrimary,
              variant === 'secondary' && styles.labelSecondary,
              isGhost && styles.labelGhost,
            ]}
          >
            {label}
          </Text>
          {icon}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 58,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  primary: {
    backgroundColor: colors.red,
    shadowColor: colors.red,
    shadowOpacity: 0.4,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.hairline,
  },
  ghost: { backgroundColor: 'transparent', height: 44 },
  disabled: { backgroundColor: colors.ink3, shadowOpacity: 0, elevation: 0 },
  label: {
    fontFamily: fonts.label,
    fontSize: 16,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  labelPrimary: { color: colors.white },
  labelSecondary: { color: colors.textOnDark },
  labelGhost: { color: colors.textOnDarkMuted, letterSpacing: 0.5 },
});
