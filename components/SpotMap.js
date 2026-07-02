import React, {
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDecay,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import PixelAvatar from './PixelAvatar';
import { SPOTS, getCategory } from '../constants/spots';
import { getEventCategory } from '../constants/events';
import { colors, fonts } from '../constants/theme';

// ---- living pixel world (retro overworld of Vizag) ----
const TILE = 26;
const COLS = 30;
const ROWS = 42;
const WORLD_W = COLS * TILE;
const WORLD_H = ROWS * TILE;
const MAX_SCALE = 2.4;

const PX = {
  waterDeep: '#3E729B',
  water: '#4E86B0',
  foam: '#7FB2D1',
  sand: '#E6D2A0',
  sandDark: '#DCC694',
  grass: '#86BE6A',
  grass2: '#7FB863',
  park: '#5FA046',
  hill: '#6FA855',
  hill2: '#639C4B',
  road: '#D8CDAD',
  building: '#BFA684',
  buildingTall: '#A8906F',
  roof: '#9C5B3C',
  window: '#7C6247',
  windowLit: '#FFD873',
  awning: '#BC2130',
  leaf: '#3E7D34',
  palmLeaf: '#4C9040',
  trunk: '#7A5230',
  boat: '#8A5A33',
  sail: '#FBF6EE',
};

// coastline drifts gently west as you go south, like Vizag's shore
const coastFor = (r) => Math.round(22 + 1.8 * Math.sin(r / 4.2) - r * 0.07);
const hash = (c, r) => (((c + 7) * 73856093) ^ ((r + 11) * 19349663)) >>> 0;

function tileAt(c, r) {
  const coast = coastFor(r);
  if (c > coast + 2) return 'waterDeep';
  if (c > coast) return 'water';
  if (c === coast) return 'foam';
  // RK Beach: wide sand through the middle stretch
  const beachW = r >= 11 && r <= 26 ? 2 : 1;
  if (c > coast - 1 - beachW) {
    return hash(c, r) % 4 === 0 && c === coast - 1 && r >= 12 && r <= 25 ? 'palm' : 'sand';
  }
  if (c === coast - 2 - beachW) return 'road'; // Beach Road hugs the shore
  // Kailasagiri ridge up north
  if (r <= 5 && c <= 9) {
    const h = hash(c, r);
    if (h % 6 === 0) return 'tree';
    return h % 2 === 0 ? 'hill' : 'hill2';
  }
  // city grid
  if (c === 4 && r > 5) return 'road';
  if (c === 10 || c === 16) return 'road';
  if (r === 8 || r === 15 || r === 22 || r === 29 || r === 36) return 'road';
  // VUDA park block
  if (c >= 12 && c <= 14 && r >= 17 && r <= 19) {
    return hash(c, r) % 3 === 0 ? 'tree' : 'park';
  }
  const h = hash(c, r);
  if (h % 19 === 0) return 'building';
  if (h % 13 === 0) return 'house';
  if (h % 23 === 0) return 'shop';
  if (h % 7 === 0) return 'tree';
  return h % 2 === 0 ? 'grass' : 'grass2';
}

const Tile = memo(function Tile({ type, night }) {
  if (type === 'tree') {
    return (
      <View style={[styles.cell, { backgroundColor: PX.grass }]}>
        <View style={styles.leaf} />
        <View style={styles.trunk} />
      </View>
    );
  }
  if (type === 'palm') {
    return (
      <View style={[styles.cell, { backgroundColor: PX.sand }]}>
        <View style={styles.palmTrunk} />
        <View style={[styles.frond, { top: '10%', left: '8%' }]} />
        <View style={[styles.frond, { top: '4%', left: '38%' }]} />
        <View style={[styles.frond, { top: '10%', left: '64%' }]} />
      </View>
    );
  }
  if (type === 'building') {
    return (
      <View style={[styles.cell, { backgroundColor: PX.grass }]}>
        <View style={styles.tower}>
          <View style={[styles.win, night && styles.winLit]} />
          <View style={[styles.win, night && styles.winLit, { marginTop: 2 }]} />
        </View>
      </View>
    );
  }
  if (type === 'house') {
    return (
      <View style={[styles.cell, { backgroundColor: PX.grass2 }]}>
        <View style={styles.houseRoof} />
        <View style={styles.houseBody}>
          <View style={[styles.winSm, night && styles.winLit]} />
        </View>
      </View>
    );
  }
  if (type === 'shop') {
    return (
      <View style={[styles.cell, { backgroundColor: PX.grass }]}>
        <View style={styles.shopBody}>
          <View style={styles.shopAwning} />
          <View style={styles.shopDoor} />
        </View>
      </View>
    );
  }
  const bg = PX[type] || PX.grass;
  return <View style={[styles.cell, { backgroundColor: bg }]} />;
});

// ---- coordinate projection: lat/lng -> world pixels (land rect) ----
const LATS = SPOTS.map((s) => s.lat);
const LNGS = SPOTS.map((s) => s.lng);
const MIN_LAT = Math.min(...LATS), MAX_LAT = Math.max(...LATS);
const MIN_LNG = Math.min(...LNGS), MAX_LNG = Math.max(...LNGS);
const clampN = (v, lo, hi) => Math.max(lo, Math.min(v, hi));
const worldPosFor = (p) => ({
  x: (2 + clampN((p.lng - MIN_LNG) / (MAX_LNG - MIN_LNG || 1), 0, 1) * 12.5) * TILE,
  y: (3.5 + clampN((MAX_LAT - p.lat) / (MAX_LAT - MIN_LAT || 1), 0, 1) * 31) * TILE,
});
const YOU = { x: 12.5 * TILE, y: 16 * TILE + TILE / 2 };

// spread overlapping pins apart so the city cluster stays readable
const MIN_PIN_DIST = 52;
function layoutPositions(spots) {
  const pos = spots.map((p) => ({ id: p.id, ...worldPosFor(p) }));
  for (let iter = 0; iter < 12; iter++) {
    let moved = false;
    for (let i = 0; i < pos.length; i++) {
      for (let j = i + 1; j < pos.length; j++) {
        const dx = pos[j].x - pos[i].x;
        const dy = pos[j].y - pos[i].y;
        const d = Math.hypot(dx, dy) || 1;
        if (d < MIN_PIN_DIST) {
          const push = (MIN_PIN_DIST - d) / 2;
          const ux = (dx / d) || 0.7;
          const uy = (dy / d) || 0.7;
          pos[i].x -= ux * push; pos[i].y -= uy * push;
          pos[j].x += ux * push; pos[j].y += uy * push;
          moved = true;
        }
      }
    }
    if (!moved) break;
  }
  const out = {};
  for (const p of pos) {
    out[p.id] = {
      x: clampN(p.x, 1.5 * TILE, 15.5 * TILE),
      y: clampN(p.y, 2.5 * TILE, (ROWS - 3) * TILE),
    };
  }
  return out;
}

// ---- time of day ----
function dayPhase() {
  const h = new Date().getHours();
  if (h >= 19 || h < 5) return 'night';
  if (h >= 17) return 'dusk';
  if (h < 7) return 'dawn';
  return 'day';
}
const TINT = {
  night: 'rgba(10,12,48,0.52)',
  dusk: 'rgba(255,110,40,0.14)',
  dawn: 'rgba(255,170,90,0.10)',
  day: 'transparent',
};

// ---- living decorations ----
function WaveDash({ x, y, w, delay }) {
  const o = useSharedValue(0.15);
  useEffect(() => {
    o.value = withDelay(
      delay,
      withRepeat(withTiming(0.65, { duration: 1600, easing: Easing.inOut(Easing.quad) }), -1, true)
    );
  }, []);
  const st = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[styles.wave, { left: x, top: y, width: w }, st]} />;
}

function Star({ x, y, delay }) {
  const o = useSharedValue(0.1);
  useEffect(() => {
    o.value = withDelay(
      delay,
      withRepeat(withTiming(0.9, { duration: 1200, easing: Easing.inOut(Easing.quad) }), -1, true)
    );
  }, []);
  const st = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[styles.star, { left: x, top: y }, st]} />;
}

function Boat({ x, y, size = 1, delay = 0 }) {
  const bob = useSharedValue(0);
  useEffect(() => {
    bob.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: 2100, easing: Easing.inOut(Easing.sin) }), -1, true)
    );
  }, []);
  const st = useAnimatedStyle(() => ({
    transform: [{ translateY: bob.value * 4 - 2 }, { rotate: `${bob.value * 4 - 2}deg` }],
  }));
  return (
    <Animated.View style={[styles.boat, { left: x, top: y, transform: [{ scale: size }] }, st]}>
      <View style={styles.sail} />
      <View style={styles.mast} />
      <View style={styles.hull} />
    </Animated.View>
  );
}

function Cloud({ y, duration, delay, night }) {
  const tx = useSharedValue(-140);
  useEffect(() => {
    tx.value = withDelay(
      delay,
      withRepeat(withTiming(WORLD_W + 140, { duration, easing: Easing.linear }), -1, false)
    );
  }, []);
  const st = useAnimatedStyle(() => ({ transform: [{ translateX: tx.value }] }));
  return (
    <Animated.View style={[styles.cloud, { top: y, opacity: night ? 0.18 : 0.45 }, st]}>
      <View style={styles.cloudPuff} />
      <View style={[styles.cloudPuff, { left: 18, top: -8, width: 34 }]} />
      <View style={[styles.cloudPuff, { left: 40, top: 2, width: 26 }]} />
    </Animated.View>
  );
}

// ---- markers ----
function YouMarker({ seed }) {
  const ring = useSharedValue(0);
  const bob = useSharedValue(0);
  useEffect(() => {
    ring.value = withRepeat(withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }), -1, false);
    bob.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 900, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );
  }, []);
  const ringSt = useAnimatedStyle(() => ({
    opacity: 0.55 * (1 - ring.value),
    transform: [{ scale: 0.6 + ring.value * 1.5 }],
  }));
  const bodySt = useAnimatedStyle(() => ({ transform: [{ translateY: bob.value }] }));
  return (
    <View style={[styles.marker, { left: YOU.x, top: YOU.y }]} pointerEvents="none">
      <View style={styles.youAnchor}>
        <Animated.View style={[styles.youRing, ringSt]} />
        <Animated.View style={[styles.char, bodySt]}>
          <PixelAvatar seed={seed} size={34} tint={colors.maroon} />
          <View style={[styles.body, { backgroundColor: colors.maroon }]} />
          <View style={styles.legs} />
          <View style={[styles.nameTag, { backgroundColor: colors.red }]}>
            <Text style={styles.nameTxt}>you</Text>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

function Marker({ p, pos, index, selected, onPress }) {
  const drop = useSharedValue(0);
  const pop = useSharedValue(1);
  useEffect(() => {
    drop.value = 0;
    drop.value = withDelay(
      Math.min(index, 12) * 45,
      withSpring(1, { damping: 13, stiffness: 160 })
    );
  }, []);
  useEffect(() => {
    pop.value = withSpring(selected ? 1.28 : 1, { damping: 11, stiffness: 220 });
  }, [selected]);
  const st = useAnimatedStyle(() => ({
    opacity: drop.value,
    transform: [{ translateY: (1 - drop.value) * -16 }, { scale: drop.value * pop.value }],
  }));
  const kind = p._kind === 'event' ? getEventCategory(p.category) : getCategory(p.category);
  return (
    <View style={[styles.marker, { left: pos.x, top: pos.y, zIndex: selected ? 40 : 10 }]}>
      <Animated.View style={st}>
        <Pressable onPress={() => onPress(p)} hitSlop={8}>
          {p._kind !== 'event' && p.friend ? (
            <View style={styles.char}>
              <PixelAvatar seed={p.friend.name} size={34} tint={p.friend.tint} />
              <View style={[styles.body, { backgroundColor: p.friend.tint }]} />
              <View style={styles.legs} />
              <View style={[styles.nameTag, selected && styles.nameTagSel]}>
                <Text style={styles.nameTxt} numberOfLines={1}>{p.name}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.pinWrap}>
              {selected ? (
                <View style={[styles.pinLabel]}>
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
            </View>
          )}
        </Pressable>
      </Animated.View>
    </View>
  );
}

// ---- the map ----
const SpotMap = forwardRef(function SpotMap({ spots, selectedId, onSelect, onOpen }, ref) {
  const [viewport, setViewport] = useState(null);
  const phase = useMemo(dayPhase, []);
  const night = phase === 'night';

  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const scale = useSharedValue(1);
  const minScale = useSharedValue(0.8);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const startS = useSharedValue(1);
  const introDone = useRef(false);

  const positions = useMemo(() => layoutPositions(spots), [spots]);

  const world = useMemo(
    () =>
      Array.from({ length: ROWS }).map((_, r) => (
        <View key={r} style={styles.gridRow}>
          {Array.from({ length: COLS }).map((_, c) => (
            <Tile key={c} type={tileAt(c, r)} night={night} />
          ))}
        </View>
      )),
    [night]
  );

  const seaDecor = useMemo(() => {
    const waves = [];
    for (let i = 0; i < 9; i++) {
      const r = 3 + i * 4.6;
      waves.push({
        x: (coastFor(Math.round(r)) + 1.6 + (i % 2)) * TILE,
        y: r * TILE,
        w: 14 + (hash(i, 3) % 12),
        delay: i * 260,
      });
    }
    return waves;
  }, []);

  const stars = useMemo(() => {
    if (!night) return [];
    return Array.from({ length: 10 }).map((_, i) => ({
      x: 600 + (hash(i, 5) % 160),
      y: 30 + (hash(3, i) % 330),
      delay: (hash(i, 9) % 14) * 100,
    }));
  }, [night]);

  const clampT = (t, s, view, worldSize) => {
    'worklet';
    const min = Math.min(0, view - worldSize * s);
    return Math.max(min, Math.min(0, t));
  };

  const flyTo = (wx, wy, targetS) => {
    if (!viewport) return;
    const ns = Math.min(MAX_SCALE, Math.max(targetS ?? Math.max(scale.value, 1.3), minScale.value));
    const easing = Easing.out(Easing.cubic);
    const nx = Math.max(Math.min(0, viewport.w - WORLD_W * ns), Math.min(0, viewport.w / 2 - ns * wx));
    const ny = Math.max(Math.min(0, viewport.h - WORLD_H * ns), Math.min(0, viewport.h * 0.4 - ns * wy));
    scale.value = withTiming(ns, { duration: 520, easing });
    tx.value = withTiming(nx, { duration: 520, easing });
    ty.value = withTiming(ny, { duration: 520, easing });
  };

  useImperativeHandle(ref, () => ({
    recenter: () => {
      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
      flyTo(YOU.x, YOU.y, 1.15);
    },
  }));

  // fly to selection
  useEffect(() => {
    if (!selectedId) return;
    const pos = positions[selectedId];
    if (pos) flyTo(pos.x, pos.y);
  }, [selectedId, viewport]);

  // cinematic intro: start close on "you", ease out to city view
  const onLayout = (e) => {
    const { width: w, height: h } = e.nativeEvent.layout;
    setViewport({ w, h });
    const min = Math.max(w / WORLD_W, h / WORLD_H, 0.7);
    minScale.value = min;
    if (!introDone.current) {
      introDone.current = true;
      const s0 = Math.min(MAX_SCALE, Math.max(1.6, min));
      const s1 = Math.max(1.05, min);
      scale.value = s0;
      tx.value = Math.max(Math.min(0, w - WORLD_W * s0), w / 2 - s0 * YOU.x);
      ty.value = Math.max(Math.min(0, h - WORLD_H * s0), h * 0.45 - s0 * YOU.y);
      const easing = Easing.out(Easing.cubic);
      scale.value = withDelay(350, withTiming(s1, { duration: 900, easing }));
      tx.value = withDelay(350, withTiming(Math.max(Math.min(0, w - WORLD_W * s1), Math.min(0, w / 2 - s1 * YOU.x)), { duration: 900, easing }));
      ty.value = withDelay(350, withTiming(Math.max(Math.min(0, h - WORLD_H * s1), Math.min(0, h * 0.45 - s1 * YOU.y)), { duration: 900, easing }));
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
      tx.value = clampT(startX.value + e.translationX, scale.value, vw, WORLD_W);
      ty.value = clampT(startY.value + e.translationY, scale.value, vh, WORLD_H);
    })
    .onEnd((e) => {
      tx.value = withDecay({
        velocity: e.velocityX,
        clamp: [Math.min(0, vw - WORLD_W * scale.value), 0],
      });
      ty.value = withDecay({
        velocity: e.velocityY,
        clamp: [Math.min(0, vh - WORLD_H * scale.value), 0],
      });
    });

  const pinch = Gesture.Pinch()
    .onStart(() => {
      startS.value = scale.value;
      startX.value = tx.value;
      startY.value = ty.value;
    })
    .onUpdate((e) => {
      const ns = Math.min(MAX_SCALE, Math.max(minScale.value, startS.value * e.scale));
      scale.value = ns;
      const k = ns / startS.value;
      tx.value = clampT(e.focalX - k * (e.focalX - startX.value), ns, vw, WORLD_W);
      ty.value = clampT(e.focalY - k * (e.focalY - startY.value), ns, vh, WORLD_H);
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((e) => {
      const zoomIn = scale.value < 1.5;
      const ns = zoomIn ? Math.min(MAX_SCALE, 1.9) : Math.max(minScale.value, 1.05);
      const k = ns / scale.value;
      const easing = Easing.out(Easing.cubic);
      const nx = clampT(e.x - k * (e.x - tx.value), ns, vw, WORLD_W);
      const ny = clampT(e.y - k * (e.y - ty.value), ns, vh, WORLD_H);
      scale.value = withTiming(ns, { duration: 380, easing });
      tx.value = withTiming(nx, { duration: 380, easing });
      ty.value = withTiming(ny, { duration: 380, easing });
    });

  const gesture = Gesture.Simultaneous(pan, pinch, doubleTap);

  const worldStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
  }));

  const pressPin = (p) => {
    try { Haptics.selectionAsync(); } catch {}
    if (selectedId === p.id) onOpen(p);
    else onSelect(p);
  };

  return (
    <View style={[styles.map, night && { backgroundColor: '#2A3A55' }]} onLayout={onLayout}>
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.world, worldStyle]}>
          <View style={styles.grid} pointerEvents="none">{world}</View>

          {/* the sea is alive */}
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            {seaDecor.map((w, i) => <WaveDash key={i} {...w} />)}
            <Boat x={25.4 * TILE} y={11 * TILE} />
            <Boat x={26.6 * TILE} y={25 * TILE} size={0.7} delay={800} />
            {stars.map((s, i) => <Star key={i} {...s} />)}
            <Cloud y={4 * TILE} duration={75000} delay={0} night={night} />
            <Cloud y={21 * TILE} duration={110000} delay={20000} night={night} />
          </View>

          {/* time-of-day tint */}
          {phase !== 'day' ? (
            <View
              pointerEvents="none"
              style={[StyleSheet.absoluteFill, { backgroundColor: TINT[phase] }]}
            />
          ) : null}

          <YouMarker seed="you" />
          {spots.map((p, i) => (
            <Marker
              key={p.id}
              p={p}
              pos={positions[p.id]}
              index={i}
              selected={selectedId === p.id}
              onPress={pressPin}
            />
          ))}
        </Animated.View>
      </GestureDetector>
    </View>
  );
});

export default SpotMap;

const styles = StyleSheet.create({
  map: { flex: 1, backgroundColor: PX.waterDeep, overflow: 'hidden' },
  world: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: WORLD_W,
    height: WORLD_H,
    transformOrigin: 'top left',
  },
  grid: { ...StyleSheet.absoluteFillObject, flexDirection: 'column' },
  gridRow: { flexDirection: 'row', height: TILE },
  cell: { width: TILE, height: TILE },

  // flora
  leaf: { position: 'absolute', top: '18%', left: '22%', width: '56%', height: '46%', backgroundColor: PX.leaf },
  trunk: { position: 'absolute', top: '58%', left: '44%', width: '12%', height: '28%', backgroundColor: PX.trunk },
  palmTrunk: { position: 'absolute', top: '34%', left: '46%', width: '10%', height: '52%', backgroundColor: PX.trunk },
  frond: { position: 'absolute', width: '30%', height: '18%', backgroundColor: PX.palmLeaf },

  // structures
  tower: { position: 'absolute', top: '8%', left: '24%', width: '52%', height: '80%', backgroundColor: PX.buildingTall, alignItems: 'center', paddingTop: 3 },
  win: { width: '38%', height: '20%', backgroundColor: PX.window },
  winSm: { width: '30%', height: '30%', backgroundColor: PX.window },
  winLit: { backgroundColor: PX.windowLit },
  houseRoof: { position: 'absolute', top: '16%', left: '16%', width: '68%', height: '20%', backgroundColor: PX.roof },
  houseBody: { position: 'absolute', top: '36%', left: '22%', width: '56%', height: '44%', backgroundColor: PX.building, alignItems: 'center', paddingTop: 2 },
  shopBody: { position: 'absolute', top: '22%', left: '18%', width: '64%', height: '58%', backgroundColor: PX.sand },
  shopAwning: { width: '100%', height: '28%', backgroundColor: PX.awning },
  shopDoor: { position: 'absolute', bottom: 0, left: '38%', width: '24%', height: '46%', backgroundColor: PX.window },

  // sea life
  wave: { position: 'absolute', height: 3, borderRadius: 2, backgroundColor: '#EAF4FA' },
  star: { position: 'absolute', width: 3, height: 3, borderRadius: 1, backgroundColor: '#FFF7D9' },
  boat: { position: 'absolute', width: 26, height: 26, alignItems: 'center' },
  sail: { width: 10, height: 10, backgroundColor: PX.sail },
  mast: { width: 2, height: 4, backgroundColor: PX.trunk },
  hull: { width: 22, height: 6, borderBottomLeftRadius: 4, borderBottomRightRadius: 4, backgroundColor: PX.boat },
  cloud: { position: 'absolute', left: 0, width: 70, height: 24 },
  cloudPuff: { position: 'absolute', width: 40, height: 16, borderRadius: 8, backgroundColor: '#FFFFFF' },

  // markers
  marker: { position: 'absolute', transform: [{ translateX: -18 }, { translateY: -40 }] },

  youAnchor: { alignItems: 'center', justifyContent: 'center' },
  youRing: { position: 'absolute', top: -6, width: 60, height: 60, borderRadius: 30, borderWidth: 3, borderColor: colors.red },

  char: { alignItems: 'center' },
  body: { width: 24, height: 12, borderTopLeftRadius: 4, borderTopRightRadius: 4, marginTop: -2, borderWidth: 2, borderColor: '#fff', borderBottomWidth: 0 },
  legs: { width: 16, height: 8, backgroundColor: '#241E1C' },
  nameTag: { marginTop: 3, backgroundColor: colors.ink, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#fff', maxWidth: 96 },
  nameTagSel: { backgroundColor: colors.red },
  nameTxt: { color: '#fff', fontFamily: fonts.bold, fontSize: 9 },

  pinWrap: { alignItems: 'center' },
  pin: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 2.5, borderColor: '#fff' },
  pinSel: { borderColor: colors.cream, shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 8 },
  pinStem: { width: 6, height: 8, marginTop: -1 },
  pinLabel: { marginBottom: 4, backgroundColor: colors.ink, borderRadius: 5, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderColor: '#fff', maxWidth: 130 },
  pinLabelTxt: { color: '#fff', fontFamily: fonts.bold, fontSize: 10 },
  badge: { position: 'absolute', top: -8, right: -12, backgroundColor: colors.ink, borderRadius: 5, paddingHorizontal: 4, paddingVertical: 1, borderWidth: 1, borderColor: '#fff' },
  badgeTxt: { color: '#fff', fontFamily: fonts.bold, fontSize: 9 },
});
