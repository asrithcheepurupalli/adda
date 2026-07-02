import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AddaButton from '../../components/AddaButton';
import { getCategory, getSpot } from '../../constants/spots';
import { ensureLoaded, getBucket, placeSpot, SENTIMENTS } from '../../lib/rankStore';
import { colors, fonts, radius } from '../../constants/theme';

export default function RankFlow() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const spot = getSpot(id);
  const [step, setStep] = useState('sentiment');
  const [sentiment, setSentiment] = useState(null);
  const [mid, setMid] = useState(0);
  const [result, setResult] = useState(null);
  const search = useRef({ lo: 0, hi: 0, bucket: [] });

  useEffect(() => { ensureLoaded(); }, []);

  if (!spot) {
    return (
      <View style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.h1}>Spot not found.</Text>
        <AddaButton label="Close" variant="secondary" onPress={() => router.back()} style={{ width: 200, marginTop: 16 }} />
      </View>
    );
  }

  const finish = async (index) => {
    const entry = await placeSpot(id, sentiment, index);
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
    setResult(entry);
    setStep('result');
  };

  const chooseSentiment = async (key) => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
    setSentiment(key);
    await ensureLoaded();
    const bucket = getBucket(key).filter((x) => x !== id);
    if (bucket.length === 0) {
      // nothing to compare against yet
      placeSpotFirst(key);
      return;
    }
    search.current = { lo: 0, hi: bucket.length, bucket };
    setMid(Math.floor(bucket.length / 2));
    setStep('compare');
  };

  const placeSpotFirst = async (key) => {
    const entry = await placeSpot(id, key, 0);
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
    setResult(entry);
    setStep('result');
  };

  const pick = (newIsBetter) => {
    try { Haptics.selectionAsync(); } catch {}
    const s = search.current;
    if (newIsBetter) s.hi = mid; else s.lo = mid + 1;
    if (s.lo >= s.hi) { finish(s.lo); return; }
    setMid(Math.floor((s.lo + s.hi) / 2));
  };

  const tooTough = () => {
    try { Haptics.selectionAsync(); } catch {}
    finish(mid);
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable hitSlop={12} onPress={() => router.back()}>
          <Ionicons name="close" size={26} color={colors.textOnDarkMuted} />
        </Pressable>
        <Text style={styles.headerTitle}>{step === 'result' ? 'Ranked' : 'Rank it'}</Text>
        <View style={{ width: 26 }} />
      </View>

      {step === 'sentiment' && <Sentiment spot={spot} onPick={chooseSentiment} />}
      {step === 'compare' && (
        <Compare
          spot={spot}
          other={getSpot(search.current.bucket[mid])}
          onNew={() => pick(true)}
          onOther={() => pick(false)}
          onTooTough={tooTough}
        />
      )}
      {step === 'result' && (
        <Result spot={spot} result={result} insets={insets} router={router} />
      )}
    </View>
  );
}

function Sentiment({ spot, onPick }) {
  const cat = getCategory(spot.category);
  return (
    <View style={styles.pad}>
      <View style={[styles.miniHero, { backgroundColor: cat.color }]}>
        <Ionicons name={cat.icon} size={30} color="#fff" />
      </View>
      <Text style={styles.q}>How was {spot.name}?</Text>
      <Text style={styles.qSub}>No stars. Just tell us the vibe, we handle the rest.</Text>

      <View style={{ gap: 12, marginTop: 24 }}>
        {SENTIMENTS.map((s) => (
          <Pressable key={s.key} style={styles.sentBtn} onPress={() => onPick(s.key)}>
            <View style={[styles.sentIcon, { backgroundColor: s.color }]}>
              <Ionicons name={s.icon} size={20} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sentLabel}>{s.label}</Text>
              <Text style={styles.sentSub}>{s.sub}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textOnDarkFaint} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function CompareCard({ spot, isNew, onPress }) {
  const cat = getCategory(spot.category);
  return (
    <Pressable style={styles.cmpCard} onPress={onPress}>
      <View style={[styles.cmpHero, { backgroundColor: cat.color }]}>
        <Ionicons name={cat.icon} size={34} color="rgba(255,255,255,0.9)" />
        {isNew ? (
          <View style={styles.newTag}><Text style={styles.newTagTxt}>NEW</Text></View>
        ) : (
          <View style={styles.cmpScore}><Text style={styles.cmpScoreTxt}>{spot.score.toFixed(1)}</Text></View>
        )}
      </View>
      <Text style={styles.cmpName} numberOfLines={1}>{spot.name}</Text>
      <Text style={styles.cmpMeta} numberOfLines={1}>{cat.label} · {spot.area}</Text>
    </Pressable>
  );
}

function Compare({ spot, other, onNew, onOther, onTooTough }) {
  if (!other) return null;
  return (
    <View style={styles.pad}>
      <Text style={styles.q}>Which do you prefer?</Text>
      <Text style={styles.qSub}>A couple of quick taps and it finds its place.</Text>

      <View style={styles.cmpRow}>
        <CompareCard spot={spot} isNew onPress={onNew} />
        <View style={styles.vs}><Text style={styles.vsTxt}>VS</Text></View>
        <CompareCard spot={other} onPress={onOther} />
      </View>

      <Pressable style={styles.tooTough} onPress={onTooTough}>
        <Text style={styles.tooToughTxt}>Too tough to call</Text>
      </Pressable>
    </View>
  );
}

function Result({ spot, result, insets, router }) {
  const cat = getCategory(spot.category);
  const scoreAnim = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0.6)).current;
  const [display, setDisplay] = useState('0.0');

  useEffect(() => {
    Animated.spring(pop, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }).start();
    const target = result?.score ?? 0;
    scoreAnim.addListener(({ value }) => setDisplay(value.toFixed(1)));
    Animated.timing(scoreAnim, { toValue: target, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    return () => scoreAnim.removeAllListeners();
  }, []);

  return (
    <View style={[styles.pad, { flex: 1 }]}>
      <View style={styles.resultCenter}>
        <Animated.View style={[styles.resultRing, { transform: [{ scale: pop }] }]}>
          <LinearGradient colors={[cat.color, colors.maroon]} style={StyleSheet.absoluteFill} />
          <Text style={styles.resultScore}>{display}</Text>
          <Text style={styles.resultOutOf}>your score</Text>
        </Animated.View>

        <Text style={styles.resultName}>{spot.name}</Text>
        <View style={styles.rankPill}>
          <Ionicons name="trophy" size={15} color={colors.red} />
          <Text style={styles.rankPillTxt}>
            #{result?.rank} of {result?.total} in your addas
          </Text>
        </View>
        <Text style={styles.resultNote}>Added to your ranked list. Keep ranking to sharpen your taste.</Text>
      </View>

      <View style={{ gap: 10, paddingBottom: insets.bottom + 16 }}>
        <AddaButton label="See your list" onPress={() => router.replace('/profile')} />
        <AddaButton label="Back to map" variant="ghost" onPress={() => router.replace('/map')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 8 },
  headerTitle: { fontFamily: fonts.label, fontSize: 13, letterSpacing: 2, color: colors.textOnDark, textTransform: 'uppercase' },
  pad: { flex: 1, paddingHorizontal: 24, paddingTop: 12 },
  h1: { fontFamily: fonts.bold, fontSize: 18, color: colors.textOnDark },

  miniHero: { width: 66, height: 66, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  q: { fontFamily: fonts.extrabold, fontSize: 28, color: colors.textOnDark, letterSpacing: -0.5 },
  qSub: { fontFamily: fonts.regular, fontSize: 14.5, color: colors.textOnDarkMuted, marginTop: 8, lineHeight: 21 },

  sentBtn: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.ink2, borderRadius: radius.lg, padding: 16, borderWidth: 1, borderColor: colors.hairline },
  sentIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  sentLabel: { fontFamily: fonts.bold, fontSize: 17, color: colors.textOnDark },
  sentSub: { fontFamily: fonts.regular, fontSize: 13, color: colors.textOnDarkMuted, marginTop: 2 },

  cmpRow: { flexDirection: 'row', alignItems: 'center', marginTop: 30, gap: 6 },
  cmpCard: { flex: 1, backgroundColor: colors.ink2, borderRadius: radius.lg, padding: 12, borderWidth: 1, borderColor: colors.hairline },
  cmpHero: { height: 110, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  newTag: { position: 'absolute', top: 8, left: 8, backgroundColor: colors.ink, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  newTagTxt: { fontFamily: fonts.label, fontSize: 10, letterSpacing: 1.5, color: '#fff' },
  cmpScore: { position: 'absolute', top: 8, right: 8, backgroundColor: '#fff', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  cmpScoreTxt: { fontFamily: fonts.extrabold, fontSize: 13, color: colors.textOnLight },
  cmpName: { fontFamily: fonts.bold, fontSize: 15, color: colors.textOnDark },
  cmpMeta: { fontFamily: fonts.regular, fontSize: 12, color: colors.textOnDarkMuted, marginTop: 3 },
  vs: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center' },
  vsTxt: { fontFamily: fonts.display, fontSize: 15, color: '#fff' },
  tooTough: { alignSelf: 'center', marginTop: 28, paddingVertical: 10, paddingHorizontal: 18 },
  tooToughTxt: { fontFamily: fonts.semibold, fontSize: 14, color: colors.textOnDarkMuted, textDecorationLine: 'underline' },

  resultCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  resultRing: { width: 180, height: 180, borderRadius: 90, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', shadowColor: colors.red, shadowOpacity: 0.5, shadowRadius: 30, shadowOffset: { width: 0, height: 12 }, elevation: 12 },
  resultScore: { fontFamily: fonts.display, fontSize: 62, color: '#fff', transform: [{ skewX: '-6deg' }] },
  resultOutOf: { fontFamily: fonts.label, fontSize: 11, letterSpacing: 2, color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', marginTop: -4 },
  resultName: { fontFamily: fonts.extrabold, fontSize: 26, color: colors.textOnDark, marginTop: 26, letterSpacing: -0.4 },
  rankPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.ink2, borderColor: colors.hairline, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, marginTop: 14 },
  rankPillTxt: { fontFamily: fonts.semibold, fontSize: 13.5, color: colors.textOnDark },
  resultNote: { fontFamily: fonts.regular, fontSize: 14, color: colors.textOnDarkMuted, textAlign: 'center', marginTop: 16, maxWidth: 300, lineHeight: 21 },
});
