import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import AddaButton from '../components/AddaButton';
import { CATEGORY_LIST } from '../constants/spots';
import { addUserSpot } from '../lib/userSpots';
import { colors, fonts, radius } from '../constants/theme';

const PRICES = ['Free', '₹', '₹₹', '₹₹₹'];
// city centre fallback when GPS is off
const VIZAG = { lat: 17.7231, lng: 83.3245 };

export default function AddSpot() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('food');
  const [area, setArea] = useState('');
  const [price, setPrice] = useState('₹₹');
  const [blurb, setBlurb] = useState('');
  const [busy, setBusy] = useState(false);

  const canSave = name.trim().length >= 2;

  const save = async (thenRank) => {
    if (!canSave || busy) return;
    setBusy(true);
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
    let lat = VIZAG.lat, lng = VIZAG.lng;
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc =
          (await Location.getLastKnownPositionAsync()) ||
          (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
        if (loc) { lat = loc.coords.latitude; lng = loc.coords.longitude; }
      }
    } catch {}
    const spot = await addUserSpot({ name, category, area, price, blurb, lat, lng });
    if (thenRank) router.replace(`/rank/${spot.id}`);
    else router.back();
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 30, paddingHorizontal: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topRow}>
          <Pressable onPress={() => router.back()} style={styles.close} hitSlop={8}>
            <Ionicons name="close" size={22} color={colors.textOnDark} />
          </Pressable>
        </View>

        <Text style={styles.kicker}>NEW SPOT</Text>
        <Text style={styles.h1}>Put it on the map</Text>
        <Text style={styles.sub}>Found somewhere the city should know about? It pins to where you're standing.</Text>

        <Text style={styles.label}>NAME</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Ratna Tiffins"
          placeholderTextColor={colors.textOnDarkFaint}
          autoFocus
          maxLength={48}
        />

        <Text style={styles.label}>CATEGORY</Text>
        <View style={styles.chips}>
          {CATEGORY_LIST.map((c) => {
            const active = category === c.key;
            return (
              <Pressable
                key={c.key}
                onPress={() => { setCategory(c.key); try { Haptics.selectionAsync(); } catch {} }}
                style={[styles.chip, active && { backgroundColor: c.color, borderColor: c.color }]}
              >
                <Ionicons name={c.icon} size={14} color={active ? '#fff' : c.color} />
                <Text style={[styles.chipTxt, active && styles.chipTxtActive]}>{c.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>AREA</Text>
        <TextInput
          style={styles.input}
          value={area}
          onChangeText={setArea}
          placeholder="e.g. MVP Colony"
          placeholderTextColor={colors.textOnDarkFaint}
          maxLength={32}
        />

        <Text style={styles.label}>PRICE</Text>
        <View style={styles.chips}>
          {PRICES.map((p) => {
            const active = price === p;
            return (
              <Pressable
                key={p}
                onPress={() => { setPrice(p); try { Haptics.selectionAsync(); } catch {} }}
                style={[styles.chip, styles.priceChip, active && styles.priceChipActive]}
              >
                <Text style={[styles.chipTxt, active && styles.chipTxtActive]}>{p}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>ONE LINE ABOUT IT (OPTIONAL)</Text>
        <TextInput
          style={[styles.input, styles.blurbInput]}
          value={blurb}
          onChangeText={setBlurb}
          placeholder="What's the move here?"
          placeholderTextColor={colors.textOnDarkFaint}
          multiline
          maxLength={140}
        />

        <AddaButton
          label={busy ? 'Saving…' : 'Add & rank it now'}
          onPress={() => save(true)}
          disabled={!canSave || busy}
          style={{ marginTop: 24 }}
        />
        <AddaButton
          label="Just add it"
          variant="secondary"
          onPress={() => save(false)}
          disabled={!canSave || busy}
          style={{ marginTop: 10 }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  topRow: { flexDirection: 'row', justifyContent: 'flex-end' },
  close: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.ink2,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.hairline,
  },
  kicker: { fontFamily: fonts.label, fontSize: 12, letterSpacing: 3, color: colors.red, marginTop: 6 },
  h1: { fontFamily: fonts.extrabold, fontSize: 30, color: colors.textOnDark, marginTop: 8, letterSpacing: -0.5 },
  sub: { fontFamily: fonts.regular, fontSize: 14.5, color: colors.textOnDarkMuted, marginTop: 8, lineHeight: 22 },

  label: { fontFamily: fonts.label, fontSize: 11.5, letterSpacing: 2, color: colors.textOnDarkFaint, marginTop: 22, marginBottom: 8 },
  input: {
    backgroundColor: colors.ink2, borderRadius: radius.md, borderWidth: 1, borderColor: colors.hairline,
    paddingHorizontal: 14, paddingVertical: 13,
    fontFamily: fonts.medium, fontSize: 15.5, color: colors.textOnDark,
  },
  blurbInput: { minHeight: 76, textAlignVertical: 'top' },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.ink2, borderWidth: 1, borderColor: colors.hairline,
    paddingHorizontal: 13, paddingVertical: 9, borderRadius: radius.pill,
  },
  priceChip: { paddingHorizontal: 18 },
  priceChipActive: { backgroundColor: colors.red, borderColor: colors.red },
  chipTxt: { fontFamily: fonts.semibold, fontSize: 13.5, color: colors.textOnDark },
  chipTxtActive: { color: '#fff' },
});
