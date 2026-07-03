import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AddaButton from '../../components/AddaButton';
import Wordmark from '../../components/Wordmark';
import { colors, fonts } from '../../constants/theme';

export default function Welcome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(24)).current;
  const markScale = useRef(new Animated.Value(0.9)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(rise, { toValue: 0, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(markScale, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 3200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 3200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0.9] });

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#2A0E12', colors.ink, '#0C0A09']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[styles.glow, { opacity: glowOpacity }]} pointerEvents="none">
        <LinearGradient
          colors={['rgba(188,33,48,0.55)', 'rgba(188,33,48,0)']}
          style={styles.glowInner}
        />
      </Animated.View>

      <View style={[styles.top, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.eyebrow}>THE SOCIAL MAP OF YOUR CITY</Text>
      </View>

      <View style={styles.center}>
        <Animated.View style={{ transform: [{ scale: markScale }] }}>
          <Wordmark size={128} />
        </Animated.View>
        <Animated.Text style={[styles.tagline, { opacity: fade, transform: [{ translateY: rise }] }]}>
          FIND YOUR SPOTS<Text style={{ color: colors.red }}>.</Text>
        </Animated.Text>
        <Animated.Text style={[styles.sub, { opacity: fade, transform: [{ translateY: rise }] }]}>
          Everything worth doing in Vizag, discovered with your friends. Food, places and events, alive on one map.
        </Animated.Text>
      </View>

      <Animated.View style={[styles.bottom, { opacity: fade, paddingBottom: insets.bottom + 20 }]}>
        <AddaButton label="Get started" onPress={() => router.push('/onboarding/tour')} />
        <AddaButton
          label="I already have an account"
          variant="ghost"
          onPress={() => router.push('/onboarding/signin')}
          style={{ marginTop: 6 }}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink, paddingHorizontal: 24 },
  glow: { position: 'absolute', top: -120, left: -60, right: -60, height: 460 },
  glowInner: { flex: 1, borderRadius: 300 },
  top: { alignItems: 'center' },
  eyebrow: {
    fontFamily: fonts.label, fontSize: 12, letterSpacing: 3,
    color: colors.textOnDarkFaint, textTransform: 'uppercase',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tagline: {
    fontFamily: fonts.labelBold, fontSize: 30, letterSpacing: 3,
    color: colors.textOnDark, marginTop: 18, transform: [{ skewX: '-8deg' }],
  },
  sub: {
    fontFamily: fonts.regular, fontSize: 15.5, lineHeight: 24,
    color: colors.textOnDarkMuted, textAlign: 'center', marginTop: 20, maxWidth: 320,
  },
  bottom: { gap: 4 },
});
