import React, { useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AddaButton from '../../components/AddaButton';
import { claimProfile } from '../../lib/supabase';
import { colors, fonts, radius, STORAGE } from '../../constants/theme';

const clean = (s) => s.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20);

export default function Username() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [value, setValue] = useState('');
  const [taken, setTaken] = useState(false);
  const [busy, setBusy] = useState(false);
  const shake = useRef(new Animated.Value(0)).current;

  const valid = value.length >= 3;

  const onChange = (t) => {
    const c = clean(t);
    if (c !== value) { try { Haptics.selectionAsync(); } catch {} }
    setTaken(false);
    setValue(c);
  };

  const doShake = () => {
    Animated.sequence([
      Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); } catch {}
  };

  const finish = async () => {
    if (!valid || busy) return doShake();
    setBusy(true);
    try {
      // claim it server-side when signed in; offline users continue locally
      await claimProfile(value);
    } catch (e) {
      setBusy(false);
      if (e?.code === 'taken') {
        setTaken(true);
        return doShake();
      }
      // network hiccup — don't block onboarding, sync happens next launch
    }
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
    await AsyncStorage.multiSet([
      [STORAGE.username, value],
      [STORAGE.onboarded, 'true'],
    ]).catch(() => {});
    router.replace('/map');
  };

  const translateX = shake.interpolate({ inputRange: [-1, 1], outputRange: [-8, 8] });

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient colors={['#200A0E', colors.ink]} style={StyleSheet.absoluteFill} />

      <View style={[styles.top, { paddingTop: insets.top + 8 }]}>
        <Pressable hitSlop={12} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={26} color={colors.textOnDarkMuted} />
        </Pressable>
      </View>

      <View style={styles.center}>
        <Text style={styles.kicker}>CLAIM YOUR HANDLE</Text>
        <Text style={styles.title}>Pick your @name</Text>
        <Text style={styles.body}>This is how friends find you, tag you, and share your spots.</Text>

        <Animated.View style={[styles.inputWrap, { transform: [{ translateX }] }, valid && styles.inputWrapOk]}>
          <Text style={styles.at}>@</Text>
          <TextInput
            value={value}
            onChangeText={onChange}
            placeholder="yourname"
            placeholderTextColor={colors.textOnDarkFaint}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            style={styles.input}
            onSubmitEditing={finish}
            returnKeyType="done"
          />
          {valid && <Ionicons name="checkmark-circle" size={22} color="#2E9E6B" />}
        </Animated.View>

        <Text style={[styles.hint, taken && styles.hintTaken]}>
          {taken
            ? `@${value} is taken — try another.`
            : value.length === 0
            ? 'Letters, numbers and underscores. At least 3 characters.'
            : valid
            ? `Nice. You’ll be @${value}.`
            : 'A little longer. At least 3 characters.'}
        </Text>
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 20 }]}>
        <AddaButton label="Enter Adda" onPress={finish} disabled={!valid} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink, paddingHorizontal: 24 },
  top: { height: 44, justifyContent: 'center' },
  center: { flex: 1, justifyContent: 'center' },
  kicker: { fontFamily: fonts.label, fontSize: 12, letterSpacing: 3, color: colors.red, textTransform: 'uppercase' },
  title: { fontFamily: fonts.extrabold, fontSize: 32, color: colors.textOnDark, marginTop: 12, letterSpacing: -0.6 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 23, color: colors.textOnDarkMuted, marginTop: 12, maxWidth: 320 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.ink2, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.hairline,
    paddingHorizontal: 18, height: 64, marginTop: 28,
  },
  inputWrapOk: { borderColor: colors.red },
  at: { fontFamily: fonts.extrabold, fontSize: 24, color: colors.red },
  input: { flex: 1, fontFamily: fonts.bold, fontSize: 22, color: colors.textOnDark, padding: 0 },
  hint: { fontFamily: fonts.medium, fontSize: 13, color: colors.textOnDarkFaint, marginTop: 12 },
  hintTaken: { color: '#E5636E' },
  bottom: { gap: 4 },
});
