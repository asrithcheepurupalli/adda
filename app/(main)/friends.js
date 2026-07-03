import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import PixelAvatar from '../../components/PixelAvatar';
import { PEOPLE } from '../../constants/people';
import { useFollowing } from '../../lib/socialStore';
import { fetchMyFollowing, searchProfiles, setFollowUser } from '../../lib/supabase';
import { colors, fonts, radius } from '../../constants/theme';

export default function Friends() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isFollowing, toggle, count } = useFollowing();
  const [query, setQuery] = useState('');
  const [realUsers, setRealUsers] = useState([]);
  const [realFollowing, setRealFollowing] = useState([]);
  const searchSeq = useRef(0);

  // who I actually follow on the backend
  useEffect(() => {
    fetchMyFollowing().then(setRealFollowing).catch(() => {});
  }, []);

  const q = query.trim().toLowerCase();

  // search real Adda users as you type
  useEffect(() => {
    if (!q) { setRealUsers([]); return; }
    const seq = ++searchSeq.current;
    const t = setTimeout(() => {
      searchProfiles(q).then((rows) => {
        if (searchSeq.current === seq) setRealUsers(rows);
      }).catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const onToggleReal = async (id) => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    const follow = !realFollowing.includes(id);
    setRealFollowing((cur) => (follow ? [...cur, id] : cur.filter((x) => x !== id))); // optimistic
    const ok = await setFollowUser(id, follow);
    if (!ok) setRealFollowing((cur) => (follow ? cur.filter((x) => x !== id) : [...cur, id]));
  };

  const filtered = useMemo(
    () => PEOPLE.filter((p) => !q || p.username.includes(q) || p.name.toLowerCase().includes(q)),
    [q]
  );
  const following = filtered.filter((p) => isFollowing(p.id));
  const others = filtered.filter((p) => !isFollowing(p.id));

  const onToggle = (id) => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    toggle(id);
  };

  const Row = ({ p }) => (
    <Pressable style={styles.row} onPress={() => router.push(`/person/${p.id}`)}>
      <PixelAvatar seed={p.id} size={46} tint={p.tint} />
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{p.name}</Text>
        <Text style={styles.handle}>@{p.username} · {p.recos.length} spots</Text>
      </View>
      <FollowBtn following={isFollowing(p.id)} onPress={() => onToggle(p.id)} />
    </Pressable>
  );

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
        <View style={styles.head}>
          <Text style={styles.kicker}>FRIENDS</Text>
          <Text style={styles.h1}>Follow people you trust</Text>
          <Text style={styles.sub}>Their picks show up on your map. You are following {count}.</Text>

          <View style={styles.search}>
            <Ionicons name="search" size={18} color={colors.textOnDarkFaint} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search @username or name"
              placeholderTextColor={colors.textOnDarkFaint}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.searchInput}
            />
          </View>
        </View>

        {realUsers.length > 0 && (
          <>
            <Text style={styles.section}>ON ADDA</Text>
            <View style={styles.list}>
              {realUsers.map((u) => (
                <View key={u.id} style={styles.row}>
                  <PixelAvatar seed={u.username} size={46} tint={colors.maroon} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>@{u.username}</Text>
                    <Text style={styles.handle}>Real person, on Adda</Text>
                  </View>
                  <FollowBtn following={realFollowing.includes(u.id)} onPress={() => onToggleReal(u.id)} />
                </View>
              ))}
            </View>
          </>
        )}

        {following.length > 0 && (
          <>
            <Text style={styles.section}>FOLLOWING</Text>
            <View style={styles.list}>{following.map((p) => <Row key={p.id} p={p} />)}</View>
          </>
        )}

        <Text style={styles.section}>{q ? 'RESULTS' : 'PEOPLE IN VIZAG'}</Text>
        {others.length === 0 && following.length === 0 ? (
          <Text style={styles.none}>No one matches that. Try another name.</Text>
        ) : (
          <View style={styles.list}>{others.map((p) => <Row key={p.id} p={p} />)}</View>
        )}
      </ScrollView>
    </View>
  );
}

export function FollowBtn({ following, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.followBtn, following && styles.followingBtn]}>
      {following && <Ionicons name="checkmark" size={14} color={colors.textOnDark} />}
      <Text style={[styles.followTxt, following && styles.followingTxt]}>
        {following ? 'Following' : 'Follow'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  head: { paddingHorizontal: 20 },
  kicker: { fontFamily: fonts.label, fontSize: 12, letterSpacing: 3, color: colors.red },
  h1: { fontFamily: fonts.extrabold, fontSize: 30, color: colors.textOnDark, marginTop: 8, letterSpacing: -0.5 },
  sub: { fontFamily: fonts.regular, fontSize: 14, color: colors.textOnDarkMuted, marginTop: 8, lineHeight: 21 },
  search: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18,
    backgroundColor: colors.ink2, borderRadius: radius.md, borderWidth: 1, borderColor: colors.hairline,
    paddingHorizontal: 14, height: 50,
  },
  searchInput: { flex: 1, fontFamily: fonts.medium, fontSize: 15, color: colors.textOnDark, padding: 0 },
  section: { fontFamily: fonts.label, fontSize: 12, letterSpacing: 2.5, color: colors.red, marginTop: 26, marginBottom: 12, paddingHorizontal: 20 },
  list: { paddingHorizontal: 20, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.ink2, borderRadius: radius.md, padding: 12, borderWidth: 1, borderColor: colors.hairline },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { color: '#fff', fontFamily: fonts.bold, fontSize: 18 },
  name: { fontFamily: fonts.bold, fontSize: 15.5, color: colors.textOnDark },
  handle: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.textOnDarkMuted, marginTop: 2 },
  none: { fontFamily: fonts.regular, fontSize: 14, color: colors.textOnDarkMuted, paddingHorizontal: 20 },
  followBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.red, paddingHorizontal: 16, paddingVertical: 9, borderRadius: radius.pill },
  followingBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.hairline },
  followTxt: { fontFamily: fonts.label, fontSize: 12, letterSpacing: 1, color: '#fff', textTransform: 'uppercase' },
  followingTxt: { color: colors.textOnDark },
});
