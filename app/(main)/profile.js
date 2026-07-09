import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, fonts, radius, STORAGE } from '../../constants/theme';
import PixelAvatar from '../../components/PixelAvatar';
import PixelCharacter from '../../components/PixelCharacter';
import { useCharacter } from '../../lib/characterStore';
import { getCategory } from '../../constants/spots';
import { getAnySpot, useUserSpots } from '../../lib/userSpots';
import { getPerson } from '../../constants/people';
import { useRankings, resetRankings } from '../../lib/rankStore';
import { useFollowing, resetFollowing } from '../../lib/socialStore';
import { useGoing, resetGoing } from '../../lib/eventStore';
import { useSaved, resetSaved } from '../../lib/savedStore';
import { resetUserSpots } from '../../lib/userSpots';
import { useStreak, resetStreak } from '../../lib/streakStore';
import { useCheckins, resetCheckins } from '../../lib/checkinStore';
import { computeBadges } from '../../lib/badges';
import { getSession, supabase } from '../../lib/supabase';

export default function Profile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [name, setName] = useState('friend');
  const [email, setEmail] = useState(null);
  const { count: userSpotCount } = useUserSpots(); // also keeps user spots resolvable
  const { ordered, total } = useRankings();
  const { ids: following, count: followCount } = useFollowing();
  const { count: goingCount } = useGoing();
  const { count: savedCount } = useSaved();
  const streak = useStreak();
  const { count: checkinCount, photoCount } = useCheckins();
  const character = useCharacter(name);

  const badges = computeBadges({
    rankedCount: total,
    savedCount,
    userSpotCount,
    followCount,
    goingCount,
    bestStreak: streak.best,
    checkinCount,
    photoCount,
  });
  const earnedCount = badges.filter((b) => b.earned).length;

  useEffect(() => {
    AsyncStorage.getItem(STORAGE.username).then((v) => v && setName(v)).catch(() => {});
    getSession().then((s) => setEmail(s?.user?.email || null)).catch(() => {});
  }, []);

  const signOut = async () => {
    try { await supabase.auth.signOut(); } catch {}
    await AsyncStorage.removeItem(STORAGE.onboarded).catch(() => {});
    router.replace('/onboarding');
  };

  const reset = async () => {
    await resetRankings();
    await resetFollowing();
    await resetGoing();
    await resetSaved();
    await resetUserSpots();
    await resetStreak();
    await resetCheckins();
    await AsyncStorage.multiRemove([STORAGE.onboarded, STORAGE.username, STORAGE.locationAsked]).catch(() => {});
    router.replace('/onboarding');
  };

  const ranked = ordered
    .map((r) => ({ spot: getAnySpot(r.id), score: r.score, rank: r.rank }))
    .filter((r) => r.spot)
    .slice(0, 8);

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 120 }}>
        <View style={styles.header}>
          <Pressable onPress={() => router.push('/character')} style={styles.charStage}>
            <PixelCharacter config={character} scale={5} />
            <View style={styles.editLook}>
              <Ionicons name="color-palette" size={12} color="#fff" />
              <Text style={styles.editLookTxt}>EDIT LOOK</Text>
            </View>
          </Pressable>
          <Text style={styles.name}>@{name}</Text>
          <Text style={styles.tagline}>
            {email ? `Signed in as ${email}` : 'Exploring Vizag, one adda at a time.'}
          </Text>

          <View style={styles.stats}>
            <Stat n={String(total)} l="ranked" />
            <Stat n={String(goingCount)} l="events" />
            <Stat n={String(followCount)} l="friends" />
            <Stat n={String(streak.current)} l="streak" flame lit={streak.current > 0} />
          </View>

          {followCount > 0 ? (
            <Pressable style={styles.friendsStrip} onPress={() => router.push('/friends')}>
              <View style={{ flexDirection: 'row' }}>
                {following.slice(0, 5).map((pid, idx) => {
                  const p = getPerson(pid);
                  if (!p) return null;
                  return (
                    <PixelAvatar key={pid} seed={pid} size={30} tint={p.tint} style={{ marginLeft: idx === 0 ? 0 : -10 }} />
                  );
                })}
              </View>
              <Text style={styles.friendsStripTxt}>Friends you follow</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textOnDarkFaint} />
            </Pressable>
          ) : (
            <Pressable style={styles.findFriends} onPress={() => router.push('/friends')}>
              <Ionicons name="person-add" size={16} color={colors.red} />
              <Text style={styles.findFriendsTxt}>Find friends to follow</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.section}>BADGES</Text>
          <Text style={styles.sectionCount}>{earnedCount}/{badges.length}</Text>
        </View>
        <View style={styles.badgeGrid}>
          {badges.map((b) => (
            <View key={b.id} style={[styles.badge, !b.earned && styles.badgeLocked]}>
              <View style={[styles.badgeIcon, { backgroundColor: b.earned ? b.color : colors.ink3 }]}>
                <Ionicons
                  name={b.earned ? b.icon : 'lock-closed'}
                  size={20}
                  color={b.earned ? '#fff' : colors.textOnDarkFaint}
                />
              </View>
              <Text style={[styles.badgeLabel, !b.earned && { color: colors.textOnDarkFaint }]} numberOfLines={1}>
                {b.label}
              </Text>
              <Text style={styles.badgeDesc} numberOfLines={2}>{b.desc}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.section}>YOUR TOP SPOTS</Text>

        {ranked.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="trophy-outline" size={30} color={colors.textOnDarkFaint} />
            <Text style={styles.emptyTitle}>No addas yet</Text>
            <Text style={styles.emptyTxt}>Rank a spot and it lands here, sorted by how much you loved it.</Text>
            <Pressable style={styles.emptyBtn} onPress={() => router.replace('/map')}>
              <Text style={styles.emptyBtnTxt}>Find spots to rank</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.list}>
            {ranked.map(({ spot, score, rank }) => {
              const cat = getCategory(spot.category);
              return (
                <Pressable key={spot.id} style={styles.row} onPress={() => router.push(`/spot/${spot.id}`)}>
                  <Text style={styles.rank}>{rank}</Text>
                  <View style={[styles.rowIcon, { backgroundColor: cat.color }]}>
                    <Ionicons name={cat.icon} size={16} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowName}>{spot.name}</Text>
                    <Text style={styles.rowMeta}>{cat.label} · {spot.area}</Text>
                  </View>
                  <Text style={styles.rowScore}>{score.toFixed(1)}</Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {email ? (
          <Pressable onPress={signOut} style={styles.reset} hitSlop={10}>
            <Ionicons name="log-out-outline" size={16} color={colors.textOnDarkMuted} />
            <Text style={[styles.resetTxt, { color: colors.textOnDarkMuted }]}>Sign out</Text>
          </Pressable>
        ) : null}
        <Pressable onPress={reset} style={styles.reset} hitSlop={10}>
          <Ionicons name="refresh" size={16} color={colors.textOnDarkFaint} />
          <Text style={styles.resetTxt}>Reset & replay onboarding</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Stat({ n, l, flame, lit }) {
  return (
    <View style={styles.stat}>
      {flame ? (
        <View style={styles.streak}>
          <Ionicons name="flame" size={16} color={lit ? colors.red : colors.textOnDarkFaint} />
          <Text style={styles.statN}>{n}</Text>
        </View>
      ) : (
        <Text style={styles.statN}>{n}</Text>
      )}
      <Text style={styles.statL}>{l}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  header: { alignItems: 'center', paddingHorizontal: 20 },
  avatar: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: colors.maroon,
    alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.red,
  },
  avatarTxt: { color: '#fff', fontFamily: fonts.display, fontSize: 44 },
  name: { fontFamily: fonts.extrabold, fontSize: 24, color: colors.textOnDark, marginTop: 14 },
  tagline: { fontFamily: fonts.regular, fontSize: 14, color: colors.textOnDarkMuted, marginTop: 6 },
  stats: { flexDirection: 'row', marginTop: 22, backgroundColor: colors.ink2, borderRadius: radius.lg, paddingVertical: 16, width: '100%', borderWidth: 1, borderColor: colors.hairline },
  stat: { flex: 1, alignItems: 'center' },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statN: { fontFamily: fonts.extrabold, fontSize: 20, color: colors.textOnDark },
  statL: { fontFamily: fonts.medium, fontSize: 11.5, color: colors.textOnDarkMuted, marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.5 },
  friendsStrip: { flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%', marginTop: 14, backgroundColor: colors.ink2, borderRadius: radius.md, borderWidth: 1, borderColor: colors.hairline, padding: 12 },
  fAvatar: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.ink },
  fAvatarTxt: { color: '#fff', fontFamily: fonts.bold, fontSize: 13 },
  friendsStripTxt: { flex: 1, fontFamily: fonts.semibold, fontSize: 14, color: colors.textOnDark },
  findFriends: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', marginTop: 14, backgroundColor: colors.ink2, borderRadius: radius.md, borderWidth: 1, borderColor: colors.hairline, paddingVertical: 14 },
  findFriendsTxt: { fontFamily: fonts.semibold, fontSize: 14, color: colors.red },
  section: { fontFamily: fonts.label, fontSize: 12, letterSpacing: 2.5, color: colors.red, marginTop: 30, marginBottom: 12, paddingHorizontal: 20 },
  sectionRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingRight: 20 },
  sectionCount: { fontFamily: fonts.bold, fontSize: 12.5, color: colors.textOnDarkMuted },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 20 },
  badge: {
    width: '30.5%', alignItems: 'center', backgroundColor: colors.ink2,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.hairline,
    paddingVertical: 14, paddingHorizontal: 8,
  },
  badgeLocked: { opacity: 0.55 },
  badgeIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  badgeLabel: { fontFamily: fonts.bold, fontSize: 12, color: colors.textOnDark, marginTop: 8 },
  badgeDesc: { fontFamily: fonts.medium, fontSize: 10, color: colors.textOnDarkFaint, marginTop: 3, textAlign: 'center' },
  list: { paddingHorizontal: 20, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.ink2, borderRadius: radius.md, padding: 12, borderWidth: 1, borderColor: colors.hairline },
  rank: { fontFamily: fonts.display, fontSize: 20, color: colors.red, width: 24 },
  rowIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowName: { fontFamily: fonts.bold, fontSize: 15, color: colors.textOnDark },
  rowMeta: { fontFamily: fonts.medium, fontSize: 12, color: colors.textOnDarkMuted, marginTop: 2 },
  rowScore: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.textOnDark },
  empty: { alignItems: 'center', marginHorizontal: 20, backgroundColor: colors.ink2, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.hairline, padding: 26, gap: 8 },
  emptyTitle: { fontFamily: fonts.bold, fontSize: 17, color: colors.textOnDark, marginTop: 4 },
  emptyTxt: { fontFamily: fonts.regular, fontSize: 13.5, color: colors.textOnDarkMuted, textAlign: 'center', lineHeight: 20 },
  emptyBtn: { marginTop: 10, backgroundColor: colors.red, paddingHorizontal: 20, paddingVertical: 12, borderRadius: radius.md },
  emptyBtnTxt: { fontFamily: fonts.label, fontSize: 13, letterSpacing: 1, color: '#fff', textTransform: 'uppercase' },
  reset: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 30 },
  charStage: { alignItems: 'center' },
  editLook: {
    flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8,
    backgroundColor: colors.red, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5,
  },
  editLookTxt: { fontFamily: fonts.label, fontSize: 10, letterSpacing: 1.5, color: '#fff' },
  resetTxt: { fontFamily: fonts.medium, fontSize: 13, color: colors.textOnDarkFaint },
});
