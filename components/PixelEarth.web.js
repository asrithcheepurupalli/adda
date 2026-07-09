import React, {
  forwardRef,
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
  useSharedValue,
  withDecay,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import PixelCharacter, { characterFromSeed } from './PixelCharacter';
import { getCategory } from '../constants/spots';
import { getEventCategory } from '../constants/events';
import { colors, fonts } from '../constants/theme';

// ---- PixelEarth (web): real satellite tiles, pixelated by the browser ----
// Same real Esri imagery and camera as the native Skia version; the browser's
// `image-rendering: pixelated` does the nearest-neighbour work.

const TILE_Z = 12;
const TILE_X0 = 2994;
const TILE_Y0 = 1841;
const GRID = 4;
const N_TILES = 1 << TILE_Z;
const TILE_RENDER = 512;
const WORLD = GRID * TILE_RENDER;
const MAX_SCALE = 5;

const tileUrl = (z, x, y) =>
  `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;

const TILES = [];
for (let ty = 0; ty < GRID; ty++) {
  for (let tx = 0; tx < GRID; tx++) {
    TILES.push({ key: `${tx}-${ty}`, url: tileUrl(TILE_Z, TILE_X0 + tx, TILE_Y0 + ty), x: tx * TILE_RENDER, y: ty * TILE_RENDER, size: TILE_RENDER });
  }
}

// z13 detail layer — lazy-loaded on first zoom-in; sharper but still pixel
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

const clampN = (v, lo, hi) => Math.max(lo, Math.min(v, hi));
function geoToWorld(lat, lng) {
  const mx = ((lng + 180) / 360) * N_TILES;
  const rad = (lat * Math.PI) / 180;
  const my = ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * N_TILES;
  return { x: (mx - TILE_X0) * TILE_RENDER, y: (my - TILE_Y0) * TILE_RENDER };
}
const CITY_CENTER = geoToWorld(17.7231, 83.3245);

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

// a friend standing where they last checked in
function FriendMarker({ f, pos, onPress, tx, ty, s }) {
  const st = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value + s.value * pos.x - 44 },
      { translateY: ty.value + s.value * pos.y - 50 },
    ],
  }));
  const config = f.character || characterFromSeed(f.username);
  return (
    <Animated.View style={[styles.marker, { zIndex: 8 }, st]}>
      <Pressable onPress={() => onPress(f.userId)} hitSlop={8} style={styles.friendWrap}>
        <PixelCharacter config={config} scale={2} />
        <View style={styles.friendPresTag}>
          <Text style={styles.friendPresTagTxt} numberOfLines={1}>@{f.username} · {timeAgo(f.at)}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function timeAgo(iso) {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.round(hrs / 24)}d`;
}

const PixelEarth = forwardRef(function PixelEarth(
  { spots, selectedId, onSelect, onOpen, drops = [], friends = [], onOpenFriend },
  ref
) {
  const [viewport, setViewport] = useState(null);
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
      flyTo(CITY_CENTER.x, CITY_CENTER.y, 1.2);
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

  const worldStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: s.value }],
  }));

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
          <Animated.View style={[styles.world, worldStyle]}>
            {TILES.map((t) => (
              <Image
                key={t.key}
                source={{ uri: t.url }}
                style={[styles.tile, { left: t.x, top: t.y, width: t.size, height: t.size }]}
              />
            ))}
            {detail ? DETAIL_TILES.map((t) => (
              <Image
                key={t.key}
                source={{ uri: t.url }}
                style={[styles.tile, { left: t.x, top: t.y, width: t.size, height: t.size }]}
              />
            )) : null}
          </Animated.View>

          {phase !== 'day' ? (
            <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: TINT[phase] }]} />
          ) : null}

          {dropItems.map((d) => (
            <PhotoDrop key={d.id} d={d} pos={d.pos} onPress={openDrop} tx={tx} ty={ty} s={s} />
          ))}
          {friends.map((f) => (
            <FriendMarker
              key={f.userId}
              f={f}
              pos={geoToWorld(f.lat, f.lng)}
              onPress={onOpenFriend || (() => {})}
              tx={tx}
              ty={ty}
              s={s}
            />
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
  world: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: WORLD,
    height: WORLD,
    transformOrigin: 'top left',
  },
  friendWrap: { alignItems: 'center' },
  friendPresTag: {
    marginTop: 2, backgroundColor: colors.ink, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2,
    borderWidth: 1, borderColor: '#fff', maxWidth: 92,
  },
  friendPresTagTxt: { color: '#fff', fontFamily: fonts.bold, fontSize: 8 },

  drop: {
    width: 46, backgroundColor: '#fff', borderRadius: 4, padding: 3, paddingBottom: 2,
    shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 5,
  },
  dropImg: { width: 40, height: 40, borderRadius: 2, backgroundColor: '#2A2320' },
  dropWho: { fontFamily: fonts.bold, fontSize: 7.5, color: '#1C1815', marginTop: 1, textAlign: 'center' },
  dropPin: { alignSelf: 'center', width: 2.5, height: 10, backgroundColor: 'rgba(255,255,255,0.85)' },

  tile: {
    position: 'absolute',
    width: TILE_RENDER,
    height: TILE_RENDER,
    // the browser does the nearest-neighbour chunky-pixel work
    imageRendering: 'pixelated',
  },
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

  attribution: {
    position: 'absolute', left: 8, bottom: 4, backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1,
  },
  attributionTxt: { color: 'rgba(255,255,255,0.75)', fontSize: 8, fontFamily: fonts.medium },
});
