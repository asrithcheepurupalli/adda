import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AddaButton from '../../components/AddaButton';
import { colors, fonts, STORAGE } from '../../constants/theme';

export default function LocationPrime() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);

  const pulse = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(20)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(rise, { toValue: 0, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
    Animated.loop(
      Animated.timing(pulse, { toValue: 1, duration: 2200, easing: Easing.out(Easing.quad), useNativeDriver: true })
    ).start();
  }, []);

  const ring = (delay) => ({
    transform: [
      {
        scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.7, 2.4] }),
      },
    ],
    opacity: pulse.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.5, 0.15, 0] }),
  });

  const enable = async () => {
    setBusy(true);
    try {
      await Location.requestForegroundPermissionsAsync();
    } catch {}
    await AsyncStorage.setItem(STORAGE.locationAsked, 'true').catch(() => {});
    setBusy(false);
    router.push('/onboarding/username');
  };

  const later = () => router.push('/onboarding/username');

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#230B0F', colors.ink]} style={StyleSheet.absoluteFill} />

      <View style={styles.center}>
        <View style={styles.pinStage}>
          <Animated.View style={[styles.ringBase, ring()]} />
          <View style={styles.pinCircle}>
            <Ionicons name="location" size={44} color="#fff" />
          </View>
        </View>

        <Animated.View style={{ opacity: fade, transform: [{ translateY: rise }], alignItems: 'center' }}>
          <Text style={styles.kicker}>ONE QUICK THING</Text>
          <Text style={styles.title}>Turn on location</Text>
          <Text style={styles.body}>
            Adda works its magic when it can see what is around you. We use your location only to show the best spots and friends' picks nearby. Never shared, never sold.
          </Text>
        </Animated.View>
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 20 }]}>
        <AddaButton label={busy ? 'Just a second…' : 'Enable location'} onPress={enable} disabled={busy} />
        <AddaButton label="Maybe later" variant="ghost" onPress={later} style={{ marginTop: 6 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink, paddingHorizontal: 24 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pinStage: { width: 200, height: 200, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  ringBase: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    backgroundColor: colors.red,
  },
  pinCircle: {
    width: 92, height: 92, borderRadius: 46, backgroundColor: colors.red,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.red, shadowOpacity: 0.6, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 10,
  },
  kicker: { fontFamily: fonts.label, fontSize: 12, letterSpacing: 3, color: colors.red, textTransform: 'uppercase' },
  title: { fontFamily: fonts.extrabold, fontSize: 30, color: colors.textOnDark, marginTop: 12, letterSpacing: -0.5 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 24, color: colors.textOnDarkMuted, textAlign: 'center', marginTop: 16, maxWidth: 330 },
  bottom: { gap: 4 },
});
