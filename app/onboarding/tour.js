import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import AddaButton from '../../components/AddaButton';
import { AliveMap, RankStack, ProfileArt } from '../../components/TourArt';
import { colors, fonts } from '../../constants/theme';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    key: 'alive',
    art: AliveMap,
    kicker: 'YOUR CITY, ALIVE',
    title: 'See the city through your friends',
    body: 'Turn on your location and watch Vizag light up with the spots your friends love, hanging right there on the map.',
  },
  {
    key: 'rank',
    art: RankStack,
    kicker: 'RANK, DON’T RATE',
    title: 'Skip the stars. Just say better or worse',
    body: 'After every visit we ask one simple question and quietly build your personal ranked list of the best places in town.',
  },
  {
    key: 'profile',
    art: ProfileArt,
    kicker: 'MADE FOR YOU',
    title: 'A profile you’ll open just to look at',
    body: 'Your addas, your ranked lists, your badges and streaks. The more you explore, the more it becomes yours.',
  },
];

export default function Tour() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollX = useRef(new Animated.Value(0)).current;
  const listRef = useRef(null);
  const [index, setIndex] = useState(0);

  const goNext = () => {
    if (index < SLIDES.length - 1) {
      const next = index + 1;
      listRef.current?.scrollToOffset({ offset: next * width, animated: true });
      setIndex(next);
    } else {
      router.push('/onboarding/location');
    }
  };

  const skip = () => {
    try { Haptics.selectionAsync(); } catch {}
    router.push('/onboarding/location');
  };

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: false,
      listener: (e) => {
        const i = Math.round(e.nativeEvent.contentOffset.x / width);
        if (i !== index) setIndex(i);
      },
    }
  );

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#1E0C0F', colors.ink]} style={StyleSheet.absoluteFill} />

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.brand}>ADDA</Text>
        <Pressable hitSlop={12} onPress={skip}>
          <Text style={styles.skip}>Skip</Text>
        </Pressable>
      </View>

      <Animated.FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(s) => s.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        renderItem={({ item, index: i }) => {
          const Art = item.art;
          const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
          const artScale = scrollX.interpolate({ inputRange, outputRange: [0.82, 1, 0.82], extrapolate: 'clamp' });
          const artOpacity = scrollX.interpolate({ inputRange, outputRange: [0.4, 1, 0.4], extrapolate: 'clamp' });
          const textShift = scrollX.interpolate({ inputRange, outputRange: [40, 0, -40], extrapolate: 'clamp' });
          return (
            <View style={[styles.slide, { width }]}>
              <Animated.View style={{ transform: [{ scale: artScale }], opacity: artOpacity }}>
                <Art />
              </Animated.View>
              <Animated.View style={[styles.copy, { transform: [{ translateX: textShift }] }]}>
                <Text style={styles.kicker}>{item.kicker}</Text>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.body}>{item.body}</Text>
              </Animated.View>
            </View>
          );
        }}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            const dotW = scrollX.interpolate({ inputRange, outputRange: [8, 26, 8], extrapolate: 'clamp' });
            const dotO = scrollX.interpolate({ inputRange, outputRange: [0.3, 1, 0.3], extrapolate: 'clamp' });
            return <Animated.View key={i} style={[styles.dot, { width: dotW, opacity: dotO }]} />;
          })}
        </View>
        <AddaButton label={index === SLIDES.length - 1 ? 'Continue' : 'Next'} onPress={goNext} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24 },
  brand: { fontFamily: fonts.display, fontSize: 22, color: colors.red, letterSpacing: 1, transform: [{ skewX: '-8deg' }] },
  skip: { fontFamily: fonts.medium, fontSize: 15, color: colors.textOnDarkFaint },
  slide: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  copy: { alignItems: 'center', marginTop: 36, maxWidth: 340 },
  kicker: { fontFamily: fonts.label, fontSize: 12, letterSpacing: 3, color: colors.red, textTransform: 'uppercase' },
  title: { fontFamily: fonts.extrabold, fontSize: 26, lineHeight: 32, color: colors.textOnDark, textAlign: 'center', marginTop: 12, letterSpacing: -0.4 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 23, color: colors.textOnDarkMuted, textAlign: 'center', marginTop: 14 },
  footer: { paddingHorizontal: 24 },
  dots: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 22 },
  dot: { height: 8, borderRadius: 4, backgroundColor: colors.red },
});
