import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { GUIDES } from '../../constants/guides';
import { colors, fonts, radius } from '../../constants/theme';

export default function Lists() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const open = (g) => {
    try { Haptics.selectionAsync(); } catch {}
    router.push(`/guide/${g.id}`);
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 120, paddingHorizontal: 20 }}>
        <Text style={styles.kicker}>ADDA GUIDES</Text>
        <Text style={styles.h1}>Lists worth following</Text>
        <Text style={styles.sub}>Curated by locals and your friends. Save one, or start your own.</Text>

        {GUIDES.map((g) => (
          <Pressable key={g.id} style={({ pressed }) => [styles.guide, pressed && styles.guidePressed]} onPress={() => open(g)}>
            <View style={[styles.gIcon, { backgroundColor: g.color }]}>
              <Ionicons name={g.icon} size={22} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.gTitle}>{g.title}</Text>
              <Text style={styles.gMeta}>{g.spots.length} spots · by {g.curator}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textOnDarkFaint} />
          </Pressable>
        ))}

        <View style={styles.soon}>
          <Ionicons name="construct" size={18} color={colors.textOnDarkFaint} />
          <Text style={styles.soonTxt}>Building your own guides is coming soon.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  kicker: { fontFamily: fonts.label, fontSize: 12, letterSpacing: 3, color: colors.red },
  h1: { fontFamily: fonts.extrabold, fontSize: 30, color: colors.textOnDark, marginTop: 8, letterSpacing: -0.5 },
  sub: { fontFamily: fonts.regular, fontSize: 14.5, color: colors.textOnDarkMuted, marginTop: 8, lineHeight: 22, marginBottom: 20 },
  guide: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.ink2, borderRadius: radius.lg, padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: colors.hairline,
  },
  guidePressed: { backgroundColor: colors.ink3 },
  gIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  gTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.textOnDark },
  gMeta: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.textOnDarkMuted, marginTop: 2 },
  soon: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20 },
  soonTxt: { fontFamily: fonts.medium, fontSize: 13, color: colors.textOnDarkFaint },
});
