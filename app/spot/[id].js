import React from 'react';
import {
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AddaButton from '../../components/AddaButton';
import PixelAvatar from '../../components/PixelAvatar';
import { getCategory } from '../../constants/spots';
import { peopleWhoRecommend } from '../../constants/people';
import { photoForSpot } from '../../lib/photos';
import { useRankings } from '../../lib/rankStore';
import { useFollowing } from '../../lib/socialStore';
import { useSaved } from '../../lib/savedStore';
import { getAnySpot, useUserSpots } from '../../lib/userSpots';
import { fetchFriendScoresForSpot, tintFor } from '../../lib/supabase';
import { colors, fonts, radius } from '../../constants/theme';

export default function SpotDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { scores, ordered } = useRankings();
  const { isFollowing } = useFollowing();
  const { isSaved, toggle } = useSaved();
  const [friendScores, setFriendScores] = React.useState([]);
  useUserSpots(); // keeps user-added spots loaded for getAnySpot
  const saved = isSaved(id);

  React.useEffect(() => {
    let alive = true;
    fetchFriendScoresForSpot(id).then((rows) => { if (alive) setFriendScores(rows); }).catch(() => {});
    return () => { alive = false; };
  }, [id]);

  const spot = getAnySpot(id);
  const myScore = scores?.[id];
  const myRank = ordered?.find((r) => r.id === id)?.rank;
  if (!spot) {
    return (
      <View style={[styles.root, styles.center]}>
        <Text style={styles.missing}>Spot not found.</Text>
        <AddaButton label="Back to map" variant="secondary" onPress={() => router.back()} style={{ width: 220 }} />
      </View>
    );
  }

  const cat = getCategory(spot.category);
  const recos = peopleWhoRecommend(id);
  const reviews = recos
    .map(({ person, reco }) => ({ id: person.id, name: person.name, tint: person.tint, text: reco.quote + '.', friend: isFollowing(person.id) }))
    .sort((a, b) => (b.friend ? 1 : 0) - (a.friend ? 1 : 0));
  const friendCount = reviews.filter((r) => r.friend).length;

  const toggleSave = () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    toggle(id);
  };

  const directions = () => {
    const url = Platform.select({
      ios: `http://maps.apple.com/?daddr=${spot.lat},${spot.lng}&q=${encodeURIComponent(spot.name)}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}`,
    });
    Linking.openURL(url).catch(() => {});
  };

  const ride = async () => {
    const deep = `uber://?action=setPickup&dropoff[latitude]=${spot.lat}&dropoff[longitude]=${spot.lng}&dropoff[nickname]=${encodeURIComponent(spot.name)}`;
    const web = `https://m.uber.com/ul/?action=setPickup&dropoff[latitude]=${spot.lat}&dropoff[longitude]=${spot.lng}&dropoff[nickname]=${encodeURIComponent(spot.name)}`;
    try {
      const ok = await Linking.canOpenURL(deep);
      Linking.openURL(ok ? deep : web);
    } catch {
      Linking.openURL(web).catch(() => {});
    }
  };

  const rank = () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
    router.push(`/rank/${id}`);
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        {/* hero */}
        <View style={styles.hero}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: cat.color }]} />
          <Image source={{ uri: photoForSpot(spot, 1000, 700) }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          <LinearGradient colors={['rgba(0,0,0,0.35)', 'rgba(0,0,0,0.05)', 'rgba(18,15,14,0.6)']} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
          <Pressable onPress={() => router.back()} style={[styles.back, { top: insets.top + 8 }]} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </Pressable>
          <Pressable onPress={toggleSave} style={[styles.saveTop, { top: insets.top + 8 }]} hitSlop={12}>
            <Ionicons name={saved ? 'heart' : 'heart-outline'} size={22} color="#fff" />
          </Pressable>
          {(myScore ?? spot.score) != null ? (
            <View style={styles.heroScore}>
              <Ionicons name="star" size={14} color={colors.red} />
              <Text style={styles.heroScoreTxt}>{(myScore ?? spot.score).toFixed(1)}</Text>
            </View>
          ) : null}
          {myRank ? (
            <View style={styles.heroRank}>
              <Ionicons name="trophy" size={12} color="#fff" />
              <Text style={styles.heroRankTxt}>YOUR #{myRank}</Text>
            </View>
          ) : null}
        </View>

        {/* header */}
        <View style={styles.body}>
          <Text style={styles.catLabel}>{cat.label.toUpperCase()}</Text>
          <Text style={styles.name}>{spot.name}</Text>
          <View style={styles.metaRow}>
            <Ionicons name="location" size={15} color={colors.textOnDarkMuted} />
            <Text style={styles.meta}>{spot.area}</Text>
            <Text style={styles.dot}>·</Text>
            <Text style={styles.meta}>{spot.price}</Text>
          </View>

          <Text style={styles.blurb}>{spot.blurb}</Text>

          {/* quick actions */}
          <View style={styles.quick}>
            <QuickAction icon="navigate" label="Directions" onPress={directions} />
            <QuickAction icon="car-sport" label="Ride there" onPress={ride} highlight />
            <QuickAction icon={saved ? 'heart' : 'heart-outline'} label={saved ? 'Saved' : 'Save'} onPress={toggleSave} />
          </View>

          {/* real friends' scores */}
          {friendScores.length > 0 ? (
            <>
              <View style={styles.sectionRow}>
                <Text style={styles.section}>YOUR FRIENDS RANKED THIS</Text>
                <Text style={styles.sectionCount}>{friendScores.length} of your people</Text>
              </View>
              {friendScores.map((f) => (
                <Pressable key={f.userId} style={styles.review} onPress={() => router.push(`/user/${f.userId}`)}>
                  <PixelAvatar seed={f.username} size={40} tint={tintFor(f.username)} />
                  <View style={{ flex: 1 }}>
                    <View style={styles.rvTop}>
                      <Text style={styles.rvName}>@{f.username}</Text>
                      <View style={styles.friendTag}><Text style={styles.friendTagTxt}>FRIEND</Text></View>
                    </View>
                    <Text style={styles.rvText}>
                      {f.sentiment === 'liked' ? 'Loved it' : f.sentiment === 'fine' ? 'Thought it was fine' : 'Not their thing'}
                    </Text>
                  </View>
                  {f.score != null ? (
                    <View style={styles.fsScore}><Text style={styles.fsScoreTxt}>{Number(f.score).toFixed(1)}</Text></View>
                  ) : null}
                </Pressable>
              ))}
            </>
          ) : null}

          {/* reviews */}
          <View style={styles.sectionRow}>
            <Text style={styles.section}>WHAT PEOPLE SAY</Text>
            <Text style={styles.sectionCount}>
              {recos.length} recommend{friendCount ? ` · ${friendCount} you follow` : ''}
            </Text>
          </View>
          {reviews.map((r, i) => (
            <Pressable key={i} style={styles.review} onPress={() => router.push(`/person/${r.id}`)}>
              <PixelAvatar seed={r.id} size={40} tint={r.tint} />
              <View style={{ flex: 1 }}>
                <View style={styles.rvTop}>
                  <Text style={styles.rvName}>{r.name}</Text>
                  {r.friend ? <View style={styles.friendTag}><Text style={styles.friendTagTxt}>FRIEND</Text></View> : null}
                </View>
                <Text style={styles.rvText}>{r.text}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textOnDarkFaint} />
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* sticky rank bar */}
      <View style={[styles.rankBar, { paddingBottom: insets.bottom + 14 }]}>
        <AddaButton label={myScore ? 'Re-rank this spot' : 'Rank this spot'} onPress={rank} icon={<Ionicons name="trophy" size={18} color="#fff" />} />
      </View>
    </View>
  );
}

function QuickAction({ icon, label, onPress, highlight }) {
  return (
    <Pressable style={styles.qa} onPress={onPress}>
      <View style={[styles.qaIcon, highlight && { backgroundColor: colors.red, borderColor: colors.red }]}>
        <Ionicons name={icon} size={20} color={highlight ? '#fff' : colors.textOnDark} />
      </View>
      <Text style={styles.qaLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  center: { alignItems: 'center', justifyContent: 'center', gap: 16 },
  missing: { fontFamily: fonts.bold, fontSize: 18, color: colors.textOnDark },

  hero: { height: 260, alignItems: 'center', justifyContent: 'center' },
  back: { position: 'absolute', left: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.28)', alignItems: 'center', justifyContent: 'center' },
  saveTop: { position: 'absolute', right: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.28)', alignItems: 'center', justifyContent: 'center' },
  heroScore: { position: 'absolute', bottom: 16, right: 16, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill },
  heroScoreTxt: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.textOnLight },
  heroRank: { position: 'absolute', bottom: 16, left: 16, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.red, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill },
  heroRankTxt: { fontFamily: fonts.label, fontSize: 11, letterSpacing: 1, color: '#fff' },

  body: { padding: 20, marginTop: -20, backgroundColor: colors.ink, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  catLabel: { fontFamily: fonts.label, fontSize: 12, letterSpacing: 2.5, color: colors.red },
  name: { fontFamily: fonts.extrabold, fontSize: 30, color: colors.textOnDark, marginTop: 6, letterSpacing: -0.6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  meta: { fontFamily: fonts.medium, fontSize: 14, color: colors.textOnDarkMuted },
  dot: { color: colors.textOnDarkFaint },
  blurb: { fontFamily: fonts.regular, fontSize: 15.5, lineHeight: 24, color: colors.textOnDark, marginTop: 16 },

  quick: { flexDirection: 'row', gap: 12, marginTop: 22 },
  qa: { flex: 1, alignItems: 'center', gap: 8 },
  qaIcon: { width: '100%', height: 56, borderRadius: radius.md, backgroundColor: colors.ink2, borderWidth: 1, borderColor: colors.hairline, alignItems: 'center', justifyContent: 'center' },
  qaLabel: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.textOnDarkMuted },

  sectionRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 30, marginBottom: 14 },
  section: { fontFamily: fonts.label, fontSize: 12, letterSpacing: 2.5, color: colors.red },
  sectionCount: { fontFamily: fonts.medium, fontSize: 12, color: colors.textOnDarkFaint },
  review: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  rvAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  rvAvatarTxt: { color: '#fff', fontFamily: fonts.bold, fontSize: 16 },
  rvTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rvName: { fontFamily: fonts.bold, fontSize: 15, color: colors.textOnDark },
  friendTag: { backgroundColor: colors.maroon, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  friendTagTxt: { fontFamily: fonts.label, fontSize: 9, letterSpacing: 1, color: '#fff' },
  rvText: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: colors.textOnDarkMuted, marginTop: 3 },

  rankBar: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 14, backgroundColor: colors.ink, borderTopWidth: 1, borderTopColor: colors.hairline },
  fsScore: { backgroundColor: colors.red, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5 },
  fsScoreTxt: { fontFamily: fonts.extrabold, fontSize: 13, color: '#fff' },
});
