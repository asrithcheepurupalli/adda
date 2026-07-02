import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import PixelAvatar from '../../components/PixelAvatar';
import { FollowBtn } from '../(main)/friends';
import { getPerson } from '../../constants/people';
import { getCategory, getSpot } from '../../constants/spots';
import { useFollowing } from '../../lib/socialStore';
import { colors, fonts, radius } from '../../constants/theme';

export default function PersonProfile() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isFollowing, toggle } = useFollowing();

  const person = getPerson(id);
  if (!person) {
    return (
      <View style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.name}>Person not found.</Text>
      </View>
    );
  }

  const following = isFollowing(person.id);
  const onToggle = () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
    toggle(person.id);
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <LinearGradient colors={[person.tint, colors.ink]} style={StyleSheet.absoluteFill} />
          <Pressable onPress={() => router.back()} style={[styles.back, { top: insets.top + 8 }]} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </Pressable>
          <PixelAvatar seed={person.id} size={96} tint={person.tint} style={{ borderWidth: 3 }} />
          <Text style={styles.name}>{person.name}</Text>
          <Text style={styles.handle}>@{person.username}</Text>
          <Text style={styles.bio}>{person.bio}</Text>

          <View style={styles.metaRow}>
            <Text style={styles.metaN}>{person.recos.length}<Text style={styles.metaL}>  spots</Text></Text>
            <Text style={styles.metaN}>{person.followers}<Text style={styles.metaL}>  followers</Text></Text>
          </View>

          <View style={{ width: 180, marginTop: 18 }}>
            <FollowBtn following={following} onPress={onToggle} />
          </View>
        </View>

        <Text style={styles.section}>{person.name.toUpperCase()}'S TOP SPOTS</Text>
        <View style={styles.list}>
          {[...person.recos].sort((a, b) => b.score - a.score).map((r, i) => {
            const spot = getSpot(r.spot);
            if (!spot) return null;
            const cat = getCategory(spot.category);
            return (
              <Pressable key={r.spot} style={styles.row} onPress={() => router.push(`/spot/${spot.id}`)}>
                <Text style={styles.rank}>{i + 1}</Text>
                <View style={[styles.rowIcon, { backgroundColor: cat.color }]}>
                  <Ionicons name={cat.icon} size={16} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowName}>{spot.name}</Text>
                  <Text style={styles.rowQuote} numberOfLines={1}>{r.quote}</Text>
                </View>
                <Text style={styles.rowScore}>{r.score.toFixed(1)}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  hero: { alignItems: 'center', paddingTop: 90, paddingBottom: 26, paddingHorizontal: 20 },
  back: { position: 'absolute', left: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.28)', alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff' },
  avatarTxt: { color: '#fff', fontFamily: fonts.display, fontSize: 46 },
  name: { fontFamily: fonts.extrabold, fontSize: 26, color: colors.textOnDark, marginTop: 14 },
  handle: { fontFamily: fonts.medium, fontSize: 14, color: colors.textOnDarkMuted, marginTop: 2 },
  bio: { fontFamily: fonts.regular, fontSize: 14.5, color: colors.textOnDark, marginTop: 12, textAlign: 'center', maxWidth: 300 },
  metaRow: { flexDirection: 'row', gap: 26, marginTop: 18 },
  metaN: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.textOnDark },
  metaL: { fontFamily: fonts.medium, fontSize: 13, color: colors.textOnDarkMuted },
  section: { fontFamily: fonts.label, fontSize: 12, letterSpacing: 2.5, color: colors.red, marginTop: 26, marginBottom: 12, paddingHorizontal: 20 },
  list: { paddingHorizontal: 20, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.ink2, borderRadius: radius.md, padding: 12, borderWidth: 1, borderColor: colors.hairline },
  rank: { fontFamily: fonts.display, fontSize: 20, color: colors.red, width: 24 },
  rowIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowName: { fontFamily: fonts.bold, fontSize: 15, color: colors.textOnDark },
  rowQuote: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.textOnDarkMuted, marginTop: 2 },
  rowScore: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.textOnDark },
});
