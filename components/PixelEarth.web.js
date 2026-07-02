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
  useAnimatedStyle,
  useSharedValue,
  withDecay,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import PixelAvatar from './PixelAvatar';
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

const tileUrl = (x, y) =>
  `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${TILE_Z}/${y}/${x}`;

const TILES = [];
for (let ty = 0; ty < GRID; ty++) {
  for (let tx = 0; tx < GRID; tx++) {
    TILES.push({ key: `${tx}-${ty}`, url: tileUrl(TILE_X0 + tx, TILE_Y0 + ty), x: tx * TILE_RENDER, y: ty * TILE_RENDER });
  }
}

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

const PixelEarth = forwardRef(function PixelEarth({ spots, selectedId, onSelect, onOpen }, ref) {
  const [viewport, setViewport] = useState(null);
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

  return (
    <View style={styles.root} onLayout={onLayout}>
      <GestureDetector gesture={gesture}>
        <View style={StyleSheet.absoluteFill}>
          <Animated.View style={[styles.world, worldStyle]}>
            {TILES.map((t) => (
              <Image
                key={t.key}
                source={{ uri: t.url }}
                style={[styles.tile, { left: t.x, top: t.y }]}
              />
            ))}
          </Animated.View>

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
