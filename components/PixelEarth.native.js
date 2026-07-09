import React, {
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDecay,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  Canvas,
  FilterMode,
  Group,
  Image as SkiaImage,
  MipmapMode,
  useImage,
} from '@shopify/react-native-skia';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import PixelCharacter from './PixelCharacter';
import { useCharacter } from '../lib/characterStore';
import { getCategory } from '../constants/spots';
import { getEventCategory } from '../constants/events';
import { colors, fonts } from '../constants/theme';

// ---- PixelEarth: real satellite tiles of Vizag, rendered as chunky pixels ----
// Real Esri World Imagery tiles (z12) drawn at 2x through nearest-neighbour
// sampling on a Skia canvas — genuine geography, retro pixels. The camera
// lives inside the canvas so pixels stay crisp at every zoom level.

const TILE_Z = 12;
const TILE_X0 = 2994; // covers ~83.14°E … 83.50°E
const TILE_Y0 = 1841; // covers ~17.91°N … 17.57°N
const GRID = 4;       // 4x4 = 16 tiles
const N_TILES = 1 << TILE_Z;
const TILE_RENDER = 512; // 256px imagery drawn at 512 -> 2px chunks at scale 1
const WORLD = GRID * TILE_RENDER; // 2048
const MAX_SCALE = 5;

const tileUrl = (z, x, y) =>
  `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;

const TILES = [];
for (let ty = 0; ty < GRID; ty++) {
  for (let tx = 0; tx < GRID; tx++) {
    TILES.push({ key: `${tx}-${ty}`, url: tileUrl(TILE_Z, TILE_X0 + tx, TILE_Y0 + ty), x: tx * TILE_RENDER, y: ty * TILE_RENDER, size: TILE_RENDER });
  }
}

// z13 detail layer — same world plane, 4x the imagery resolution. Lazy-loaded
// the first time the user zooms in, so the city sharpens while staying pixel.
const DETAIL_GRID = GRID * 2;
const DETAIL_RENDER = TILE_RENDER / 2;
const DETAIL_TILES = [];
for (let ty = 0; ty < DETAIL_GRID; ty++) {
  for (let tx = 0; tx < DETAIL_GRID; tx++) {
    DETAIL_TILES.push({
      key: `d${tx}-${ty}`,
      url: tileUrl(TILE_Z + 1, TILE_X0 * 2 + tx, TILE_Y0 * 2 + ty),
      x: tx * DETAIL_RENDER,
      y: ty * DETAIL_RENDER,
      size: DETAIL_RENDER,
    });
  }
}

// time-of-day atmosphere over the real imagery
function dayPhase() {
  const h = new Date().getHours();
  if (h >= 19 || h < 5) return 'night';
  if (h >= 17) return 'dusk';
  if (h < 7) return 'dawn';
  return 'day';
}
const TINT = {
  night: 'rgba(10,14,52,0.42)',
  dusk: 'rgba(255,110,40,0.12)',
  dawn: 'rgba(255,170,90,0.10)',
  day: 'transparent',
};

// Web-mercator lat/lng -> world pixels inside our tile window.
const clampN = (v, lo, hi) => Math.max(lo, Math.min(v, hi));
function geoToWorld(lat, lng) {
  const mx = ((lng + 180) / 360) * N_TILES;
  const rad = (lat * Math.PI) / 180;
  const my = ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * N_TILES;
  return { x: (mx - TILE_X0) * TILE_RENDER, y: (my - TILE_Y0) * TILE_RENDER };
}
const inWorld = (p) => p.x >= 0 && p.x <= WORLD && p.y >= 0 && p.y <= WORLD;
const CITY_CENTER = geoToWorld(17.7231, 83.3245);

// nudge apart pins that share a block so they stay tappable
function layoutPositions(spots) {
  const MIN = 38;
  const pos = spots.map((p) => ({ id: p.id, ...geoToWorld(p.lat, p.lng) }));
  for (let iter = 0; iter < 10; iter++) {
    let moved = false;
    for (let i = 0; i < pos.length; i++) {
      for (let j = i + 1; j < pos.length; j++) {
        const dx = pos[j].x - pos[i].x;
        const dy = pos[j].y - pos[i].y;
        const d = Math.hypot(dx, dy) || 1;
        if (d < MIN) {
          const push = (MIN - d) / 2;
          const ux = (dx / d) || 0.7, uy = (dy / d) || 0.7;
          pos[i].x -= ux * push; pos[i].y -= uy * push;
          pos[j].x += ux * push; pos[j].y += uy * push;
          moved = true;
        }
      }
    }
    if (!moved) break;
  }
  const out = {};
  for (const p of pos) out[p.id] = { x: clampN(p.x, 20, WORLD - 20), y: clampN(p.y, 40, WORLD - 20) };
  return out;
}

const Tile = memo(function Tile({ url, x, y, size }) {
  const img = useImage(url);
  if (!img) return null;
  return (
    <SkiaImage
      image={img}
      x={x}
      y={y}
      width={size}
      height={size}
      fit="fill"
      sampling={{ filter: FilterMode.Nearest, mipmap: MipmapMode.None }}
    />
  );
});

function Pin({ p, selected }) {
  const kind = p._kind === 'event' ? getEventCategory(p.category) : getCategory(p.category);
  return (
    <View style={styles.pinWrap}>
      {selected ? (
        <View style={styles.pinLabel}>
          <Text style={styles.pinLabelTxt} numberOfLines={1}>
            {p._kind === 'event' ? p.title : p.name}
          </Text>
        </View>
      ) : null}
      <View style={[styles.pin, { backgroundColor: kind.color }, selected && styles.pinSel]}>
        <Ionicons name={kind.icon} size={15} color="#fff" />
      </View>
      <View style={[styles.pinStem, { backgroundColor: kind.color }]} />
      {p._kind === 'event' ? (
        <View style={styles.badge}><Text style={styles.badgeTxt}>{p.day}</Text></View>
      ) : p.score ? (
        <View style={styles.badge}><Text style={styles.badgeTxt}>{p.score.toFixed(1)}</Text></View>
      ) : null}
      {p._kind !== 'event' && p.friend ? (
        <View style={[styles.friendDot, { backgroundColor: p.friend.tint }]}>
          <Text style={styles.friendDotTxt}>{p.friend.name[0]}</Text>
        </View>
      ) : null}
    </View>
  );
}

function GeoMarker({ p, pos, selected, onPress, tx, ty, s }) {
  const pop = useSharedValue(1);
  useEffect(() => {
    pop.value = withSpring(selected ? 1.25 : 1, { damping: 11, stiffness: 220 });
  }, [selected]);
  const st = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value + s.value * pos.x - 18 },
      { translateY: ty.value + s.value * pos.y - 40 },
      { scale: pop.value },
    ],
  }));
  return (
    <Animated.View style={[styles.marker, { zIndex: selected ? 40 : 10 }, st]}>
      <Pressable onPress={() => onPress(p)} hitSlop={8}>
        <Pin p={p} selected={selected} />
      </Pressable>
    </Animated.View>
  );
}

// a check-in photo hanging on the map, polaroid-style
function PhotoDrop({ d, pos, onPress, tx, ty, s }) {
  const rot = ((d.id.charCodeAt(2) + d.id.charCodeAt(d.id.length - 1)) % 9) - 4;
  const st = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value + s.value * pos.x - 23 },
      { translateY: ty.value + s.value * pos.y - 62 },
      { rotate: `${rot}deg` },
    ],
  }));
  return (
    <Animated.View style={[styles.marker, { zIndex: 6 }, st]}>
      <Pressable onPress={() => onPress(d)} hitSlop={6}>
        <View style={styles.drop}>
          <Image source={{ uri: d.uri }} style={styles.dropImg} />
          <Text style={styles.dropWho} numberOfLines={1}>{d.who}</Text>
        </View>
        <View style={styles.dropPin} />
      </Pressable>
    </Animated.View>
  );
}

function YouMarker({ pos, tx, ty, s }) {
  const character = useCharacter('you');
  const st = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value + s.value * pos.x - 14 },
      { translateY: ty.value + s.value * pos.y - 52 },
    ],
  }));
  return (
    <Animated.View style={[styles.marker, { zIndex: 50 }]} pointerEvents="none">
      <Animated.View style={st}>
        <View style={styles.youWrap}>
          <View style={styles.youRing} />
          <PixelCharacter config={character} scale={2.3} />
          <View style={styles.nameTag}><Text style={styles.nameTxt}>you</Text></View>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const PixelEarth = forwardRef(function PixelEarth({ spots, selectedId, onSelect, onOpen, drops = [] }, ref) {
  const [viewport, setViewport] = useState(null);
  const [userWorld, setUserWorld] = useState(null);
  const [detail, setDetail] = useState(false);
  const phase = useMemo(dayPhase, []);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const s = useSharedValue(1);
  const minS = useSharedValue(0.4);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const startS = useSharedValue(1);
  const introDone = useRef(false);

  const positions = useMemo(() => layoutPositions(spots), [spots]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const last = await Location.getLastKnownPositionAsync();
        const loc = last || (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
        if (alive && loc) {
          const w = geoToWorld(loc.coords.latitude, loc.coords.longitude);
          if (inWorld(w)) setUserWorld(w);
        }
      } catch {}
    })();
    return () => { alive = false; };
  }, []);

  const clampT = (t, sc, view, world) => {
    'worklet';
    const min = Math.min(0, view - world * sc);
    return Math.max(min, Math.min(0, t));
  };

  // first zoom past 1.6x pulls in the sharper z13 imagery (stays pixelated)
  const enableDetail = () => setDetail(true);
  useAnimatedReaction(
    () => s.value > 1.6,
    (zoomed, was) => {
      if (zoomed && !was) runOnJS(enableDetail)();
    }
  );

  const flyTo = (wx, wy, targetS) => {
    if (!viewport) return;
    const ns = Math.min(MAX_SCALE, Math.max(targetS ?? Math.max(s.value, 1.6), minS.value));
    const easing = Easing.out(Easing.cubic);
    const nx = Math.max(Math.min(0, viewport.w - WORLD * ns), Math.min(0, viewport.w / 2 - ns * wx));
    const ny = Math.max(Math.min(0, viewport.h - WORLD * ns), Math.min(0, viewport.h * 0.4 - ns * wy));
    s.value = withTiming(ns, { duration: 520, easing });
    tx.value = withTiming(nx, { duration: 520, easing });
    ty.value = withTiming(ny, { duration: 520, easing });
  };

  useImperativeHandle(ref, () => ({
    recenter: () => {
      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
      const c = userWorld || CITY_CENTER;
      flyTo(c.x, c.y, 1.2);
    },
  }));

  useEffect(() => {
    if (!selectedId) return;
    const pos = positions[selectedId];
    if (pos) flyTo(pos.x, pos.y);
  }, [selectedId, viewport]);

  const onLayout = (e) => {
    const { width: w, height: h } = e.nativeEvent.layout;
    setViewport({ w, h });
    const min = Math.max(w / WORLD, h / WORLD, 0.35);
    minS.value = min;
    if (!introDone.current) {
      introDone.current = true;
      const s0 = 2.1;
      const s1 = Math.max(1.05, min);
      const c = CITY_CENTER;
      s.value = s0;
      tx.value = Math.max(Math.min(0, w - WORLD * s0), w / 2 - s0 * c.x);
      ty.value = Math.max(Math.min(0, h - WORLD * s0), h * 0.45 - s0 * c.y);
      const easing = Easing.out(Easing.cubic);
      s.value = withDelay(400, withTiming(s1, { duration: 1000, easing }));
      tx.value = withDelay(400, withTiming(Math.max(Math.min(0, w - WORLD * s1), Math.min(0, w / 2 - s1 * c.x)), { duration: 1000, easing }));
      ty.value = withDelay(400, withTiming(Math.max(Math.min(0, h - WORLD * s1), Math.min(0, h * 0.45 - s1 * c.y)), { duration: 1000, easing }));
    }
  };

  const vw = viewport?.w ?? 0;
  const vh = viewport?.h ?? 0;

  const pan = Gesture.Pan()
    .activeOffsetX([-8, 8])
    .activeOffsetY([-8, 8])
    .onStart(() => {
      startX.value = tx.value;
      startY.value = ty.value;
    })
    .onUpdate((e) => {
      tx.value = clampT(startX.value + e.translationX, s.value, vw, WORLD);
      ty.value = clampT(startY.value + e.translationY, s.value, vh, WORLD);
    })
    .onEnd((e) => {
      tx.value = withDecay({ velocity: e.velocityX, clamp: [Math.min(0, vw - WORLD * s.value), 0] });
      ty.value = withDecay({ velocity: e.velocityY, clamp: [Math.min(0, vh - WORLD * s.value), 0] });
    });

  const pinch = Gesture.Pinch()
    .onStart(() => {
      startS.value = s.value;
      startX.value = tx.value;
      startY.value = ty.value;
    })
    .onUpdate((e) => {
      const ns = Math.min(MAX_SCALE, Math.max(minS.value, startS.value * e.scale));
      s.value = ns;
      const k = ns / startS.value;
      tx.value = clampT(e.focalX - k * (e.focalX - startX.value), ns, vw, WORLD);
      ty.value = clampT(e.focalY - k * (e.focalY - startY.value), ns, vh, WORLD);
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((e) => {
      const zoomIn = s.value < 2.2;
      const ns = zoomIn ? Math.min(MAX_SCALE, 3) : Math.max(minS.value, 1.05);
      const k = ns / s.value;
      const easing = Easing.out(Easing.cubic);
      const nx = clampT(e.x - k * (e.x - tx.value), ns, vw, WORLD);
      const ny = clampT(e.y - k * (e.y - ty.value), ns, vh, WORLD);
      s.value = withTiming(ns, { duration: 380, easing });
      tx.value = withTiming(nx, { duration: 380, easing });
      ty.value = withTiming(ny, { duration: 380, easing });
    });

  const gesture = Gesture.Simultaneous(pan, pinch, doubleTap);

  const cameraTransform = useDerivedValue(() => [
    { translateX: tx.value },
    { translateY: ty.value },
    { scale: s.value },
  ]);

  const pressPin = (p) => {
    try { Haptics.selectionAsync(); } catch {}
    if (selectedId === p.id) onOpen(p);
    else onSelect(p);
  };

  // photo drops hang next to their spot; stacked drops fan out slightly
  const dropItems = useMemo(() => {
    const perSpot = {};
    return drops
      .filter((d) => d.lat != null && d.lng != null)
      .slice(0, 20)
      .map((d) => {
        const n = (perSpot[d.spotId] = (perSpot[d.spotId] ?? -1) + 1);
        const w = geoToWorld(d.lat, d.lng);
        return { ...d, pos: { x: w.x + 26 + n * 14, y: w.y - 6 - n * 10 } };
      });
  }, [drops]);

  const openDrop = (d) => {
    try { Haptics.selectionAsync(); } catch {}
    const p = spots.find((x) => x.id === d.spotId);
    if (p) onOpen(p);
  };

  return (
    <View style={styles.root} onLayout={onLayout}>
      <GestureDetector gesture={gesture}>
        <View style={StyleSheet.absoluteFill}>
          <Canvas style={StyleSheet.absoluteFill}>
            <Group transform={cameraTransform}>
              {TILES.map((t) => (
                <Tile key={t.key} {...t} />
              ))}
              {detail ? DETAIL_TILES.map((t) => <Tile key={t.key} {...t} />) : null}
            </Group>
          </Canvas>

          {phase !== 'day' ? (
            <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: TINT[phase] }]} />
          ) : null}

          {userWorld ? <YouMarker pos={userWorld} tx={tx} ty={ty} s={s} /> : null}
          {dropItems.map((d) => (
            <PhotoDrop key={d.id} d={d} pos={d.pos} onPress={openDrop} tx={tx} ty={ty} s={s} />
          ))}
          {spots.map((p) => (
            <GeoMarker
              key={p.id}
              p={p}
              pos={positions[p.id]}
              selected={selectedId === p.id}
              onPress={pressPin}
              tx={tx}
              ty={ty}
              s={s}
            />
          ))}
        </View>
      </GestureDetector>

      <View style={styles.attribution} pointerEvents="none">
        <Text style={styles.attributionTxt}>Imagery © Esri</Text>
      </View>
    </View>
  );
});

export default PixelEarth;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0E1B26', overflow: 'hidden' },
  marker: { position: 'absolute', top: 0, left: 0 },

  pinWrap: { alignItems: 'center' },
  pin: {
    width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5, borderColor: '#fff',
  },
  pinSel: { borderColor: colors.cream },
  pinStem: { width: 6, height: 8, marginTop: -1 },
  pinLabel: {
    marginBottom: 4, backgroundColor: colors.ink, borderRadius: 5, paddingHorizontal: 7,
    paddingVertical: 3, borderWidth: 1, borderColor: '#fff', maxWidth: 140,
  },
  pinLabelTxt: { color: '#fff', fontFamily: fonts.bold, fontSize: 10 },
  badge: {
    position: 'absolute', top: -8, right: -12, backgroundColor: colors.ink, borderRadius: 5,
    paddingHorizontal: 4, paddingVertical: 1, borderWidth: 1, borderColor: '#fff',
  },
  badgeTxt: { color: '#fff', fontFamily: fonts.bold, fontSize: 9 },
  friendDot: {
    position: 'absolute', top: -8, left: -10, width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#fff',
  },
  friendDotTxt: { color: '#fff', fontFamily: fonts.bold, fontSize: 10 },

  drop: {
    width: 46, backgroundColor: '#fff', borderRadius: 4, padding: 3, paddingBottom: 2,
    shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 5,
  },
  dropImg: { width: 40, height: 40, borderRadius: 2, backgroundColor: '#2A2320' },
  dropWho: { fontFamily: fonts.bold, fontSize: 7.5, color: '#1C1815', marginTop: 1, textAlign: 'center' },
  dropPin: { alignSelf: 'center', width: 2.5, height: 10, backgroundColor: 'rgba(255,255,255,0.85)' },

  youWrap: { alignItems: 'center' },
  youRing: {
    position: 'absolute', top: 8, width: 52, height: 52, borderRadius: 26,
    borderWidth: 3, borderColor: colors.red, opacity: 0.55,
  },
  nameTag: {
    marginTop: 3, backgroundColor: colors.red, paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 4, borderWidth: 1, borderColor: '#fff',
  },
  nameTxt: { color: '#fff', fontFamily: fonts.bold, fontSize: 9 },

  attribution: {
    position: 'absolute', left: 8, bottom: 4, backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1,
  },
  attributionTxt: { color: 'rgba(255,255,255,0.75)', fontSize: 8, fontFamily: fonts.medium },
});
