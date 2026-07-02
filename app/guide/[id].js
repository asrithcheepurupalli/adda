import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { getGuide } from '../../constants/guides';
import { getSpot, getCategory } from '../../constants/spots';
import { photoForSpot } from '../../lib/photos';
import { colors, fonts, radius } from '../../constants/theme';

export default function GuideScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const guide = getGuide(id);

  if (!guide) {
    return (
      <View style={[styles.root, styles.center]}>
        <Text style={styles.missing}>This guide wandered off.</Text>
      </View>
    );
  }

  const spots = guide.spots.map(getSpot).filter(Boolean);

  const open = (spot) => {
    try { Haptics.selectionAsync(); } catch {}
    router.push(`/spot/${spot.id}`);
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 40 }}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.back} hitSlop={8}>
            <Ionicons name="chevron-back" size={22} color={colors.textOnDark} />
          </Pressable>
          <View style={[styles.badgeIcon, { backgroundColor: guide.color }]}>
            <Ionicons name={guide.icon} size={26} color="#fff" />
          </View>
          <Text style={styles.kicker}>ADDA GUIDE · BY {guide.curator.toUpperCase()}</Text>
          <Text style={styles.h1}>{guide.title}</Text>
          <Text style={styles.blurb}>{guide.blurb}</Text>
          <Text style={styles.count}>{spots.length} spots</Text>
        </View>

        {spots.map((s, i) => {
          const cat = getCategory(s.category);
          return (
            <Pressable key={s.id} style={styles.row} onPress={() => open(s)}>
              <Text style={styles.rank}>{i + 1}</Text>
              <View style={styles.thumbWrap}>
                <Image source={{ uri: photoForSpot(s, 200, 200) }} style={styles.thumb} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name} numberOfLines={1}>{s.name}</Text>
                <Text style={styles.meta} numberOfLines={1}>
                  {cat.label} · {s.area} · {s.price}
                </Text>
                {s.friend ? (
                  <View style={styles.friendRow}>
                    <View style={[styles.fDot, { backgroundColor: s.friend.tint }]} />
                    <Text style={styles.friendTxt} numberOfLines={1}>{s.friend.name}: {s.friend.quote}</Text>
                  </View>
                ) : null}
              </View>
              <View style={styles.scorePill}>
                <Ionicons name="star" size={11} color={colors.red} />
                <Text style={styles.scoreTxt}>{s.score.toFixed(1)}</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  center: { alignItems: 'center', justifyContent: 'center' },
  missing: { fontFamily: fonts.medium, fontSize: 15, color: colors.textOnDarkMuted },

  header: { paddingHorizontal: 20, marginBottom: 18 },
  back: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.ink2,
    alignItems: 'center', justifyContent: 'center', marginBottom: 18,
    borderWidth: 1, borderColor: colors.hairline,
  },
  badgeIcon: {
    width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  kicker: { fontFamily: fonts.label, fontSize: 11.5, letterSpacing: 3, color: colors.red },
  h1: { fontFamily: fonts.extrabold, fontSize: 30, color: colors.textOnDark, marginTop: 8, letterSpacing: -0.5 },
  blurb: { fontFamily: fonts.regular, fontSize: 14.5, color: colors.textOnDarkMuted, marginTop: 8, lineHeight: 22 },
  count: { fontFamily: fonts.label, fontSize: 12, letterSpacing: 1.5, color: colors.textOnDarkFaint, marginTop: 12, textTransform: 'uppercase' },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.ink2, borderRadius: radius.lg, padding: 12,
    marginHorizontal: 20, marginBottom: 10,
    borderWidth: 1, borderColor: colors.hairline,
  },
  rank: { width: 22, textAlign: 'center', fontFamily: fonts.display, fontSize: 18, color: colors.textOnDarkFaint },
  thumbWrap: { width: 54, height: 54, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.ink3 },
  thumb: { width: '100%', height: '100%' },
  name: { fontFamily: fonts.bold, fontSize: 15.5, color: colors.textOnDark },
  meta: { fontFamily: fonts.medium, fontSize: 12, color: colors.textOnDarkMuted, marginTop: 2 },
  friendRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  fDot: { width: 7, height: 7, borderRadius: 4 },
  friendTxt: { flex: 1, fontFamily: fonts.medium, fontSize: 11.5, color: colors.textOnDarkMuted },
  scorePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.ink3, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 5,
  },
  scoreTxt: { fontFamily: fonts.bold, fontSize: 12.5, color: colors.textOnDark },
});
