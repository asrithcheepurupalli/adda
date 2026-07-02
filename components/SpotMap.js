import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PixelAvatar from './PixelAvatar';
import { SPOTS, getCategory } from '../constants/spots';
import { getEventCategory } from '../constants/events';
import { colors, fonts } from '../constants/theme';

// ---- pixel-art tile map (retro / overworld) ----
const COLS = 14;
const ROWS = 18;

const PX = {
  water: '#4E86B0',
  wave: '#6FA6C8',
  sand: '#E6D2A0',
  grass: '#86BE6A',
  park: '#5FA046',
  road: '#DACFAF',
  building: '#BFA684',
  window: '#7C6247',
  leaf: '#3E7D34',
  trunk: '#7A5230',
};

function tileAt(c, r) {
  const waterEdge = 10 - Math.floor(r / 7); // coastline recedes going down
  if (c > waterEdge + 1) return 'water';
  if (c === waterEdge + 1) return 'wave';
  if (c === waterEdge) return 'sand';
  if (r % 6 === 3) return 'road';
  if (c === 3) return 'road';
  if (c === waterEdge - 1 && r % 3 !== 0) return 'park';
  if (c % 4 === 1 && r % 4 === 0) return 'building';
  if (c % 5 === 2 && r % 3 === 1) return 'tree';
  return 'grass';
}

function Tile({ type }) {
  if (type === 'tree') {
    return (
      <View style={[styles.cell, { backgroundColor: PX.grass }]}>
        <View style={styles.leaf} />
        <View style={styles.trunk} />
      </View>
    );
  }
  if (type === 'building') {
    return (
      <View style={[styles.cell, { backgroundColor: PX.grass }]}>
        <View style={styles.building}>
          <View style={styles.win} />
        </View>
      </View>
    );
  }
  const bg =
    type === 'water' ? PX.water
    : type === 'wave' ? PX.wave
    : type === 'sand' ? PX.sand
    : type === 'park' ? PX.park
    : type === 'road' ? PX.road
    : PX.grass;
  return <View style={[styles.cell, { backgroundColor: bg }]} />;
}

// ---- coordinate projection ----
const LATS = SPOTS.map((s) => s.lat);
const LNGS = SPOTS.map((s) => s.lng);
const MIN_LAT = Math.min(...LATS), MAX_LAT = Math.max(...LATS);
const MIN_LNG = Math.min(...LNGS), MAX_LNG = Math.max(...LNGS);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(v, hi));
const posFor = (p) => ({
  left: `${8 + clamp((p.lng - MIN_LNG) / (MAX_LNG - MIN_LNG || 1), 0, 1) * 78}%`,
  top: `${14 + clamp((MAX_LAT - p.lat) / (MAX_LAT - MIN_LAT || 1), 0, 1) * 60}%`,
});

// a little pixel person standing on the map
function Character({ seed, tint, name }) {
  return (
    <View style={styles.char}>
      <PixelAvatar seed={seed} size={34} tint={tint} />
      <View style={[styles.body, { backgroundColor: tint }]} />
      <View style={styles.legs} />
      {name ? (
        <View style={styles.nameTag}><Text style={styles.nameTxt}>{name}</Text></View>
      ) : null}
    </View>
  );
}

function PixelPin({ color, icon, badge }) {
  return (
    <View style={styles.pinWrap}>
      <View style={[styles.pin, { backgroundColor: color }]}>
        <Ionicons name={icon} size={15} color="#fff" />
      </View>
      <View style={[styles.pinStem, { backgroundColor: color }]} />
      {badge ? (
        <View style={styles.badge}><Text style={styles.badgeTxt}>{badge}</Text></View>
      ) : null}
    </View>
  );
}

export default function SpotMap({ spots, onSelect }) {
  return (
    <View style={styles.map}>
      {/* pixel tile background */}
      <View style={styles.grid} pointerEvents="none">
        {Array.from({ length: ROWS }).map((_, r) => (
          <View key={r} style={styles.gridRow}>
            {Array.from({ length: COLS }).map((_, c) => (
              <Tile key={c} type={tileAt(c, r)} />
            ))}
          </View>
        ))}
      </View>

      {/* markers */}
      {spots.map((p) => (
        <Pressable key={p.id} onPress={() => onSelect(p)} style={[styles.marker, posFor(p)]}>
          {p._kind === 'event' ? (
            <PixelPin color={getEventCategory(p.category).color} icon={getEventCategory(p.category).icon} badge={p.day} />
          ) : p.friend ? (
            <Character seed={p.friend.name} tint={p.friend.tint} name={p.name} />
          ) : (
            <PixelPin color={getCategory(p.category).color} icon={getCategory(p.category).icon} badge={p.score ? p.score.toFixed(1) : null} />
          )}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1, backgroundColor: PX.water, overflow: 'hidden' },
  grid: { ...StyleSheet.absoluteFillObject, flexDirection: 'column' },
  gridRow: { flex: 1, flexDirection: 'row' },
  cell: { flex: 1 },
  leaf: { position: 'absolute', top: '18%', left: '22%', width: '56%', height: '46%', backgroundColor: PX.leaf },
  trunk: { position: 'absolute', top: '58%', left: '44%', width: '12%', height: '28%', backgroundColor: PX.trunk },
  building: { position: 'absolute', top: '20%', left: '22%', width: '56%', height: '62%', backgroundColor: PX.building, alignItems: 'center', paddingTop: 3 },
  win: { width: '34%', height: '26%', backgroundColor: PX.window },

  marker: { position: 'absolute', transform: [{ translateX: -18 }, { translateY: -40 }] },

  char: { alignItems: 'center' },
  body: { width: 24, height: 12, borderTopLeftRadius: 4, borderTopRightRadius: 4, marginTop: -2, borderWidth: 2, borderColor: '#fff', borderBottomWidth: 0 },
  legs: { width: 16, height: 8, backgroundColor: '#241E1C' },
  nameTag: { marginTop: 3, backgroundColor: colors.ink, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#fff', maxWidth: 96 },
  nameTxt: { color: '#fff', fontFamily: fonts.bold, fontSize: 9 },

  pinWrap: { alignItems: 'center' },
  pin: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 2.5, borderColor: '#fff' },
  pinStem: { width: 6, height: 8, marginTop: -1 },
  badge: { position: 'absolute', top: -8, right: -12, backgroundColor: colors.ink, borderRadius: 5, paddingHorizontal: 4, paddingVertical: 1, borderWidth: 1, borderColor: '#fff' },
  badgeTxt: { color: '#fff', fontFamily: fonts.bold, fontSize: 9 },
});
