import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius } from '../../constants/theme';

const GUIDES = [
  { title: 'Sunset in Vizag', count: 6, icon: 'sunny', color: '#E5A020' },
  { title: 'Best Andhra thali', count: 8, icon: 'restaurant', color: colors.red },
  { title: 'Quiet cafes to work', count: 5, icon: 'cafe', color: '#2E9E6B' },
  { title: 'A perfect first date', count: 7, icon: 'heart', color: '#7A3FB0' },
];

export default function Lists() {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 120, paddingHorizontal: 20 }}>
        <Text style={styles.kicker}>ADDA GUIDES</Text>
        <Text style={styles.h1}>Lists worth following</Text>
        <Text style={styles.sub}>Curated by locals and your friends. Save one, or start your own.</Text>

        {GUIDES.map((g) => (
          <View key={g.title} style={styles.guide}>
            <View style={[styles.gIcon, { backgroundColor: g.color }]}>
              <Ionicons name={g.icon} size={22} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.gTitle}>{g.title}</Text>
              <Text style={styles.gMeta}>{g.count} spots</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textOnDarkFaint} />
          </View>
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
  gIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  gTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.textOnDark },
  gMeta: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.textOnDarkMuted, marginTop: 2 },
  soon: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20 },
  soonTxt: { fontFamily: fonts.medium, fontSize: 13, color: colors.textOnDarkFaint },
});
