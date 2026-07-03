import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import AddaButton from '../../components/AddaButton';
import { sendEmailCode, verifyEmailCode } from '../../lib/supabase';
import { colors, fonts, radius } from '../../constants/theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function SignIn() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState('email'); // 'email' | 'code'
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const shake = useRef(new Animated.Value(0)).current;

  const emailValid = EMAIL_RE.test(email.trim());
  // Supabase OTP length is configurable (6-10 digits) — accept the range
  const codeValid = code.trim().length >= 6;

  const doShake = () => {
    Animated.sequence([
      Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); } catch {}
  };

  const sendCode = async () => {
    if (!emailValid || busy) return doShake();
    setBusy(true);
    setError(null);
    try {
      await sendEmailCode(email.trim().toLowerCase());
      try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
      setStep('code');
    } catch (e) {
      setError(e?.message || 'Could not send the code. Try again in a minute.');
      doShake();
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    if (!codeValid || busy) return doShake();
    setBusy(true);
    setError(null);
    try {
      await verifyEmailCode(email.trim().toLowerCase(), code.trim());
      try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
      router.push('/onboarding/username');
    } catch (e) {
      setError('That code didn’t match. Check the email and try again.');
      doShake();
    } finally {
      setBusy(false);
    }
  };

  const translateX = shake.interpolate({ inputRange: [-1, 1], outputRange: [-8, 8] });
  const isEmail = step === 'email';

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient colors={['#200A0E', colors.ink]} style={StyleSheet.absoluteFill} />

      <View style={[styles.top, { paddingTop: insets.top + 8 }]}>
        <Pressable hitSlop={12} onPress={() => (isEmail ? router.back() : setStep('email'))}>
          <Ionicons name="chevron-back" size={26} color={colors.textOnDarkMuted} />
        </Pressable>
      </View>

      <View style={styles.center}>
        <Text style={styles.kicker}>{isEmail ? 'JOIN THE CITY' : 'CHECK YOUR INBOX'}</Text>
        <Text style={styles.title}>{isEmail ? 'Your email' : 'Enter the code'}</Text>
        <Text style={styles.body}>
          {isEmail
            ? 'One account, all your spots and friends — synced. We’ll send a sign-in code, no password ever.'
            : `We sent a sign-in code to ${email.trim()}. It can take a minute to arrive.`}
        </Text>

        <Animated.View style={[styles.inputWrap, { transform: [{ translateX }] }]}>
          <Ionicons name={isEmail ? 'mail' : 'key'} size={20} color={colors.red} />
          {isEmail ? (
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={colors.textOnDarkFaint}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              inputMode="email"
              style={styles.input}
              onSubmitEditing={sendCode}
              returnKeyType="send"
            />
          ) : (
            <TextInput
              value={code}
              onChangeText={(t) => setCode(t.replace(/[^0-9]/g, '').slice(0, 10))}
              placeholder="000000"
              placeholderTextColor={colors.textOnDarkFaint}
              autoFocus
              inputMode="numeric"
              style={[styles.input, styles.codeInput]}
              onSubmitEditing={verify}
              returnKeyType="done"
            />
          )}
          {busy ? <ActivityIndicator color={colors.red} /> : null}
        </Animated.View>

        {error ? <Text style={styles.error}>{error}</Text> : (
          <Text style={styles.hint}>
            {isEmail ? 'We only use this to sign you in.' : 'Didn’t get it? Go back and resend.'}
          </Text>
        )}
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 20 }]}>
        <AddaButton
          label={isEmail ? 'Send code' : 'Verify'}
          onPress={isEmail ? sendCode : verify}
          disabled={(isEmail ? !emailValid : !codeValid) || busy}
        />
        <Pressable onPress={() => router.push('/onboarding/username')} hitSlop={8}>
          <Text style={styles.skip}>Skip for now — stay on this phone only</Text>
        </Pressable>
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
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 23, color: colors.textOnDarkMuted, marginTop: 12, maxWidth: 330 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.ink2, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.hairline,
    paddingHorizontal: 18, height: 64, marginTop: 28,
  },
  input: { flex: 1, fontFamily: fonts.bold, fontSize: 18, color: colors.textOnDark, padding: 0 },
  codeInput: { fontSize: 26, letterSpacing: 10 },
  hint: { fontFamily: fonts.medium, fontSize: 13, color: colors.textOnDarkFaint, marginTop: 12 },
  error: { fontFamily: fonts.medium, fontSize: 13, color: '#E5636E', marginTop: 12 },
  bottom: { gap: 14, alignItems: 'center' },
  skip: { fontFamily: fonts.medium, fontSize: 13.5, color: colors.textOnDarkMuted, textDecorationLine: 'underline' },
});
