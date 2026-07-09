import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import AddaButton from '../components/AddaButton';
import PixelCharacter, { OPTIONS } from '../components/PixelCharacter';
import { randomCharacter, saveCharacter, useCharacter } from '../lib/characterStore';
import { syncCharacter } from '../lib/supabase';
import { colors, fonts, radius } from '../constants/theme';

const STYLE_LABELS = { short: 'Short', long: 'Long', cap: 'Cap' };

export default function CharacterEditor() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const current = useCharacter('you');
  const [draft, setDraft] = useState(current);
  const [saving, setSaving] = useState(false);

  // adopt the stored look once it loads
  useEffect(() => { setDraft(current); }, [JSON.stringify(current)]);

  const bob = useSharedValue(0);
  const pop = useSharedValue(1);
  useEffect(() => {
    bob.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 1100, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1100, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );
  }, []);
  const charStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bob.value }, { scale: pop.value }],
  }));

  const set = (field, value) => {
    try { Haptics.selectionAsync(); } catch {}
    pop.value = withSequence(withSpring(1.07, { damping: 12, stiffness: 300 }), withSpring(1));
    setDraft((d) => ({ ...d, [field]: value }));
  };

  const shuffle = () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
    pop.value = withSequence(withSpring(0.85, { damping: 14, stiffness: 320 }), withSpring(1.1), withSpring(1));
    setDraft(randomCharacter());
  };

  const save = async () => {
    if (saving) return;
    setSaving(true);
    await saveCharacter(draft);
    syncCharacter(draft);
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
    router.back();
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 30 }}>
        <View style={styles.grabber} />
        <Text style={styles.kicker}>YOUR CHARACTER</Text>
        <Text style={styles.title}>This is you on the map</Text>

        {/* stage */}
        <View style={styles.stage}>
          <Animated.View style={charStyle}>
            <PixelCharacter config={draft} scale={9} />
          </Animated.View>
          <View style={styles.pedestal} />
          <Pressable style={styles.shuffle} onPress={shuffle} hitSlop={8}>
            <Ionicons name="dice" size={20} color="#fff" />
            <Text style={styles.shuffleTxt}>SHUFFLE</Text>
          </Pressable>
        </View>

        <SwatchRow label="SKIN" options={OPTIONS.skin} value={draft.skin} onPick={(v) => set('skin', v)} />
        <SwatchRow label="HAIR" options={OPTIONS.hair} value={draft.hair} onPick={(v) => set('hair', v)} />

        <Text style={styles.rowLabel}>STYLE</Text>
        <View style={styles.chipRow}>
          {OPTIONS.hairStyle.map((s) => (
            <Pressable
              key={s}
              onPress={() => set('hairStyle', s)}
              style={[styles.chip, draft.hairStyle === s && styles.chipActive]}
            >
              <Text style={[styles.chipTxt, draft.hairStyle === s && styles.chipTxtActive]}>{STYLE_LABELS[s]}</Text>
            </Pressable>
          ))}
        </View>

        <SwatchRow label="TOP" options={OPTIONS.top} value={draft.top} onPick={(v) => set('top', v)} />
        <SwatchRow label="BOTTOM" options={OPTIONS.bottom} value={draft.bottom} onPick={(v) => set('bottom', v)} />

        <AddaButton
          label={saving ? 'Saving…' : 'Save my look'}
          onPress={save}
          disabled={saving}
          style={{ marginTop: 28 }}
          icon={<Ionicons name="checkmark" size={18} color="#fff" />}
        />
        <AddaButton label="Cancel" variant="ghost" onPress={() => router.back()} style={{ marginTop: 6 }} />
        <View style={{ height: insets.bottom }} />
      </ScrollView>
    </View>
  );
}

function SwatchRow({ label, options, value, onPick }) {
  return (
    <>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.swatchRow}>
        {options.map((c) => (
          <Pressable
            key={c}
            onPress={() => onPick(c)}
            style={[styles.swatch, { backgroundColor: c }, value === c && styles.swatchActive]}
          >
            {value === c ? <Ionicons name="checkmark" size={14} color={c === '#F1E9DC' || c === '#C9C4BE' ? '#1C1815' : '#fff'} /> : null}
          </Pressable>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  grabber: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: colors.ink3, marginBottom: 18 },
  kicker: { fontFamily: fonts.label, fontSize: 12, letterSpacing: 2.5, color: colors.red },
  title: { fontFamily: fonts.extrabold, fontSize: 26, color: colors.textOnDark, marginTop: 6, letterSpacing: -0.5 },

  stage: {
    marginTop: 20, alignItems: 'center', paddingVertical: 26,
    backgroundColor: colors.ink2, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.hairline,
  },
  pedestal: { width: 120, height: 12, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.45)', marginTop: 8 },
  shuffle: {
    position: 'absolute', top: 14, right: 14, flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.red, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 8,
  },
  shuffleTxt: { fontFamily: fonts.label, fontSize: 11, letterSpacing: 1.5, color: '#fff' },

  rowLabel: { fontFamily: fonts.label, fontSize: 11.5, letterSpacing: 2, color: colors.textOnDarkMuted, marginTop: 22, marginBottom: 10 },
  swatchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  swatch: {
    width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.12)',
  },
  swatchActive: { borderColor: '#fff' },

  chipRow: { flexDirection: 'row', gap: 10 },
  chip: {
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: radius.pill,
    backgroundColor: colors.ink2, borderWidth: 1, borderColor: colors.hairline,
  },
  chipActive: { backgroundColor: colors.red, borderColor: colors.red },
  chipTxt: { fontFamily: fonts.semibold, fontSize: 13.5, color: colors.textOnDarkMuted },
  chipTxtActive: { color: '#fff' },
});
