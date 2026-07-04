import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import PixelAvatar from '../../components/PixelAvatar';
import { FollowBtn } from '../(main)/friends';
import { getCategory } from '../../constants/spots';
import { getAnySpot, useUserSpots } from '../../lib/userSpots';
import {
  fetchMyFollowing,
  fetchProfile,
  fetchUserRankings,
  setFollowUser,
  tintFor,
} from '../../lib/supabase';
import { colors, fonts, radius } from '../../constants/theme';

// A real person on Adda — profile, follow state and their ranked spots,
// all straight from the backend.
export default function UserProfile() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState(null);
  const [rankings, setRankings] = useState([]);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  useUserSpots(); // keeps user-added spots resolvable via getAnySpot

  useEffect(() => {
    let alive = true;
    (async () => {
      const [p, r, mine] = await Promise.all([
        fetchProfile(id),
        fetchUserRankings(id),
        fetchMyFollowing(),
      ]);
      if (!alive) return;
      setProfile(p);
      setRankings(r);
      setFollowing(mine.includes(id));
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [id]);

  const onToggle = async () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
    const next = !following;
    setFollowing(next);
    setProfile((p) => (p ? { ...p, followers: p.followers + (next ? 1 : -1) } : p));
    const ok = await setFollowUser(id, next);
    if (!ok) {
      setFollowing(!next);
      setProfile((p) => (p ? { ...p, followers: p.followers + (next ? -1 : 1) } : p));
    }
  };

  if (loading) {
    return (
      <View style={[styles.root, styles.center]}>
        <ActivityIndicator color={colors.red} size="large" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.root, styles.center]}>
        <Text style={styles.name}>Couldn’t load this profile.</Text>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.backLink}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const tint = tintFor(profile.username);
  const ranked = rankings
    .map((r) => ({ ...r, spot: getAnySpot(r.spot_id) }))
    .filter((r) => r.spot)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <LinearGradient colors={[tint, colors.ink]} style={StyleSheet.absoluteFill} />
          <Pressable onPress={() => router.back()} style={[styles.back, { top: insets.top + 8 }]} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </Pressable>
          <PixelAvatar seed={profile.username} size={96} tint={tint} style={{ borderWidth: 3 }} />
          <Text style={styles.name}>@{profile.username}</Text>
          <Text style={styles.handle}>On Adda since {new Date(profile.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</Text>

          <View style={styles.metaRow}>
            <Text style={styles.metaN}>{ranked.length}<Text style={styles.metaL}>  spots</Text></Text>
            <Text style={styles.metaN}>{profile.followers}<Text style={styles.metaL}>  followers</Text></Text>
            <Text style={styles.metaN}>{profile.following}<Text style={styles.metaL}>  following</Text></Text>
          </View>

          <View style={{ width: 180, marginTop: 18 }}>
            <FollowBtn following={following} onPress={onToggle} />
          </View>
        </View>

        <Text style={styles.section}>@{profile.username.toUpperCase()}'S TOP SPOTS</Text>
        {ranked.length === 0 ? (
          <Text style={styles.none}>Nothing ranked yet. Their city is still loading.</Text>
        ) : (
          <View style={styles.list}>
            {ranked.map((r, i) => {
              const cat = getCategory(r.spot.category);
              return (
                <Pressable key={r.spot_id} style={styles.row} onPress={() => router.push(`/spot/${r.spot_id}`)}>
                  <Text style={styles.rank}>{i + 1}</Text>
                  <View style={[styles.rowIcon, { backgroundColor: cat.color }]}>
                    <Ionicons name={cat.icon} size={16} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowName}>{r.spot.name}</Text>
                    <Text style={styles.rowQuote} numberOfLines={1}>{r.spot.area}</Text>
                  </View>
                  {r.score != null ? <Text style={styles.rowScore}>{Number(r.score).toFixed(1)}</Text> : null}
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  center: { justifyContent: 'center', alignItems: 'center', gap: 14 },
  backLink: { fontFamily: fonts.medium, fontSize: 14, color: colors.textOnDarkMuted, textDecorationLine: 'underline' },
  hero: { alignItems: 'center', paddingTop: 90, paddingBottom: 26, paddingHorizontal: 20 },
  back: { position: 'absolute', left: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.28)', alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: fonts.extrabold, fontSize: 26, color: colors.textOnDark, marginTop: 14 },
  handle: { fontFamily: fonts.medium, fontSize: 14, color: colors.textOnDarkMuted, marginTop: 2 },
  metaRow: { flexDirection: 'row', gap: 26, marginTop: 18 },
  metaN: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.textOnDark },
  metaL: { fontFamily: fonts.medium, fontSize: 13, color: colors.textOnDarkMuted },
  section: { fontFamily: fonts.label, fontSize: 12, letterSpacing: 2.5, color: colors.red, marginTop: 26, marginBottom: 12, paddingHorizontal: 20 },
  none: { fontFamily: fonts.regular, fontSize: 14, color: colors.textOnDarkMuted, paddingHorizontal: 20 },
  list: { paddingHorizontal: 20, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.ink2, borderRadius: radius.md, padding: 12, borderWidth: 1, borderColor: colors.hairline },
  rank: { fontFamily: fonts.display, fontSize: 20, color: colors.red, width: 24 },
  rowIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowName: { fontFamily: fonts.bold, fontSize: 15, color: colors.textOnDark },
  rowQuote: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.textOnDarkMuted, marginTop: 2 },
  rowScore: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.textOnDark },
});
