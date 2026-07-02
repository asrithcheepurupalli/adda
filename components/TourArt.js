import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius } from '../constants/theme';

/* gentle floating loop helper */
function useFloat(delay = 0, distance = 8) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 1800, delay, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);
  return v.interpolate({ inputRange: [0, 1], outputRange: [0, -distance] });
}

/* faux map backdrop with soft "streets" */
function MapBackdrop() {
  return (
    <View style={styles.mapBg}>
      <View style={[styles.street, { top: 60, left: -40, width: 320, transform: [{ rotate: '18deg' }] }]} />
      <View style={[styles.street, { top: 150, left: -30, width: 340, transform: [{ rotate: '-9deg' }] }]} />
      <View style={[styles.street, { top: 230, left: 10, width: 300, transform: [{ rotate: '24deg' }] }]} />
      <View style={[styles.block, { top: 30, left: 30 }]} />
      <View style={[styles.block, { top: 190, right: 24 }]} />
      <View style={[styles.park, { bottom: 40, left: 24 }]} />
    </View>
  );
}

function Pin({ color, icon, style }) {
  return (
    <View style={[styles.pin, { backgroundColor: color }, style]}>
      <Ionicons name={icon} size={16} color="#fff" />
    </View>
  );
}

function FriendCard({ name, text, tint, floatY, style }) {
  return (
    <Animated.View style={[styles.fcard, style, { transform: [{ translateY: floatY }] }]}>
      <View style={styles.fcardRow}>
        <View style={[styles.avatar, { backgroundColor: tint }]}>
          <Text style={styles.avatarTxt}>{name[0]}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.fname}>{name}</Text>
          <Text style={styles.ftext} numberOfLines={1}>{text}</Text>
        </View>
        <Ionicons name="heart" size={14} color={colors.red} />
      </View>
    </Animated.View>
  );
}

/* Slide 1 — the city, alive */
export function AliveMap() {
  const f1 = useFloat(0, 9);
  const f2 = useFloat(600, 7);
  return (
    <View style={styles.stage}>
      <MapBackdrop />
      <Pin color={colors.red} icon="restaurant" style={{ top: 70, left: 60 }} />
      <Pin color="#2E9E6B" icon="leaf" style={{ top: 150, right: 70 }} />
      <Pin color="#E5A020" icon="cafe" style={{ bottom: 90, left: 48 }} />
      <Pin color="#3B7DD8" icon="musical-notes" style={{ bottom: 130, right: 54 }} />
      <FriendCard name="Priya" text="Best biryani in town" tint="#C0202E" floatY={f1} style={{ top: 40, right: 18 }} />
      <FriendCard name="Arjun" text="Sunset here is unreal" tint="#2E7DD8" floatY={f2} style={{ bottom: 34, left: 14 }} />
    </View>
  );
}

/* Slide 2 — rank, don't rate */
export function RankStack() {
  const float = useFloat(0, 6);
  return (
    <View style={styles.stage}>
      <View style={styles.rankList}>
        {[
          { n: '1', name: 'Sea Breeze Cafe', s: '9.4' },
          { n: '2', name: 'Beach Road Grill', s: '9.1' },
          { n: '3', name: 'Daspalla Diner', s: '8.7' },
        ].map((r) => (
          <View key={r.n} style={styles.rankRow}>
            <Text style={styles.rankNum}>{r.n}</Text>
            <Text style={styles.rankName}>{r.name}</Text>
            <Text style={styles.rankScore}>{r.s}</Text>
          </View>
        ))}
      </View>

      <Animated.View style={[styles.compareCard, { transform: [{ translateY: float }] }]}>
        <Text style={styles.compareEyebrow}>HOW WAS IT?</Text>
        <Text style={styles.compareName}>Tenneti Park Kiosk</Text>
        <Text style={styles.compareVs}>Better or worse than Daspalla Diner?</Text>
        <View style={styles.compareBtns}>
          <View style={[styles.cbtn, styles.cbtnBetter]}>
            <Ionicons name="arrow-up" size={16} color="#fff" />
            <Text style={styles.cbtnTxt}>Better</Text>
          </View>
          <View style={[styles.cbtn, styles.cbtnWorse]}>
            <Ionicons name="arrow-down" size={16} color={colors.textOnLight} />
            <Text style={[styles.cbtnTxt, { color: colors.textOnLight }]}>Worse</Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

/* Slide 3 — a profile you'll love */
export function ProfileArt() {
  const float = useFloat(0, 6);
  return (
    <View style={styles.stage}>
      <Animated.View style={[styles.profileCard, { transform: [{ translateY: float }] }]}>
        <View style={styles.profileTop}>
          <View style={styles.pAvatar}><Text style={styles.pAvatarTxt}>A</Text></View>
          <View>
            <Text style={styles.pName}>Aisha</Text>
            <Text style={styles.pHandle}>@aisha</Text>
          </View>
          <View style={styles.streak}>
            <Ionicons name="flame" size={14} color={colors.red} />
            <Text style={styles.streakTxt}>12</Text>
          </View>
        </View>
        <View style={styles.pStats}>
          {[['48', 'spots'], ['9', 'guides'], ['211', 'friends']].map(([n, l]) => (
            <View key={l} style={styles.pStat}>
              <Text style={styles.pStatN}>{n}</Text>
              <Text style={styles.pStatL}>{l}</Text>
            </View>
          ))}
        </View>
        <View style={styles.badges}>
          {['trophy', 'star', 'flame', 'ribbon'].map((b, i) => (
            <View key={i} style={[styles.badge, i === 0 && { backgroundColor: colors.red }]}>
              <Ionicons name={b} size={16} color={i === 0 ? '#fff' : colors.maroon} />
            </View>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const CARD = '#FFFFFF';
const styles = StyleSheet.create({
  stage: { width: 300, height: 340, alignItems: 'center', justifyContent: 'center' },

  /* map backdrop */
  mapBg: {
    position: 'absolute', width: 300, height: 340, borderRadius: 28,
    backgroundColor: '#F0E9DC', overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)',
  },
  street: { position: 'absolute', height: 16, backgroundColor: '#FBF6EE', borderRadius: 8 },
  block: { position: 'absolute', width: 70, height: 54, borderRadius: 10, backgroundColor: '#E7DECB' },
  park: { position: 'absolute', width: 90, height: 70, borderRadius: 16, backgroundColor: '#D8E6CC' },

  pin: {
    position: 'absolute', width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 4,
  },

  fcard: {
    position: 'absolute', width: 176, backgroundColor: CARD, borderRadius: 14, padding: 10,
    shadowColor: '#000', shadowOpacity: 0.16, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 8,
  },
  fcardRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { color: '#fff', fontFamily: fonts.bold, fontSize: 13 },
  fname: { fontFamily: fonts.bold, fontSize: 12.5, color: colors.textOnLight },
  ftext: { fontFamily: fonts.regular, fontSize: 11, color: colors.textOnLightMuted },

  /* rank */
  rankList: {
    position: 'absolute', top: 30, width: 244, backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 16, padding: 10, gap: 4,
  },
  rankRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 6 },
  rankNum: { fontFamily: fonts.display, color: colors.red, fontSize: 18, width: 26 },
  rankName: { flex: 1, fontFamily: fonts.semibold, fontSize: 13, color: colors.textOnLight },
  rankScore: { fontFamily: fonts.bold, fontSize: 13, color: colors.maroon },
  compareCard: {
    position: 'absolute', bottom: 18, width: 264, backgroundColor: CARD, borderRadius: 20, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 10,
  },
  compareEyebrow: { fontFamily: fonts.label, fontSize: 11, letterSpacing: 2, color: colors.red },
  compareName: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.textOnLight, marginTop: 4 },
  compareVs: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.textOnLightMuted, marginTop: 4 },
  compareBtns: { flexDirection: 'row', gap: 10, marginTop: 14 },
  cbtn: { flex: 1, height: 44, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  cbtnBetter: { backgroundColor: colors.red },
  cbtnWorse: { backgroundColor: colors.cream2 },
  cbtnTxt: { fontFamily: fonts.label, fontSize: 13, letterSpacing: 1, color: '#fff', textTransform: 'uppercase' },

  /* profile */
  profileCard: {
    width: 268, backgroundColor: CARD, borderRadius: 24, padding: 18,
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 20, shadowOffset: { width: 0, height: 12 }, elevation: 10,
  },
  profileTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pAvatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: colors.maroon, alignItems: 'center', justifyContent: 'center' },
  pAvatarTxt: { color: '#fff', fontFamily: fonts.display, fontSize: 26 },
  pName: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.textOnLight },
  pHandle: { fontFamily: fonts.medium, fontSize: 13, color: colors.textOnLightMuted },
  streak: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.cream2, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  streakTxt: { fontFamily: fonts.bold, fontSize: 13, color: colors.maroon },
  pStats: { flexDirection: 'row', marginTop: 16, borderTopWidth: 1, borderTopColor: '#EFE7D8', paddingTop: 14 },
  pStat: { flex: 1, alignItems: 'center' },
  pStatN: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.textOnLight },
  pStatL: { fontFamily: fonts.medium, fontSize: 11.5, color: colors.textOnLightMuted, marginTop: 2 },
  badges: { flexDirection: 'row', gap: 10, marginTop: 16 },
  badge: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.cream2, alignItems: 'center', justifyContent: 'center' },
});
