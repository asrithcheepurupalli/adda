import React from 'react';
import { StyleSheet, View } from 'react-native';

// Full-body pixel character drawn from a token grid + a recolourable palette.
// Tokens: . transparent, H hair, S skin, E eye, T top, B bottom, F footwear

const BODY = [
  '...HHHHHH...',
  '..HHHHHHHH..',
  '..HHHHHHHH..',
  '..HSSSSSSH..',
  '..HSSSSSSH..',
  '..HSESSESH..',
  '..HSSSSSSH..',
  '...SSSSSS...',
  '..TTTTTTTT..',
  '.TTTTTTTTTT.',
  'STTTTTTTTTTS',
  'STTTTTTTTTTS',
  '.TTTTTTTTTT.',
  '..TTTTTTTT..',
  '..BBB..BBB..',
  '..BBB..BBB..',
  '..BBB..BBB..',
  '..BBB..BBB..',
  '..FFF..FFF..',
  '..FFF..FFF..',
];

// long hair variant: hair falls down the sides of the face + neck
const LONG_OVERLAY = { 6: [2, 9], 7: [2, 9], 8: [1, 10] };

export const OPTIONS = {
  skin: ['#F1C9A5', '#E7B58C', '#C68642', '#8D5524'],
  hair: ['#2B1B12', '#5A3210', '#C24E2B', '#111111', '#C9C4BE', '#6B3FA0'],
  top: ['#BC2130', '#2E7DD8', '#2E9E6B', '#E5A020', '#7A3FB0', '#F1E9DC'],
  bottom: ['#241E1C', '#3A4A5A', '#6B5A3E', '#2E3B2E'],
  hairStyle: ['short', 'long'],
};

export const DEFAULT_CHARACTER = {
  skin: OPTIONS.skin[1],
  hair: OPTIONS.hair[0],
  top: OPTIONS.top[0],
  bottom: OPTIONS.bottom[0],
  hairStyle: 'short',
};

export function characterFromSeed(seed = 'adda') {
  let h = 0;
  const s = String(seed);
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 100000;
  const pick = (arr, salt) => arr[(h + salt) % arr.length];
  return {
    skin: pick(OPTIONS.skin, 1),
    hair: pick(OPTIONS.hair, 7),
    top: pick(OPTIONS.top, 13),
    bottom: pick(OPTIONS.bottom, 23),
    hairStyle: pick(OPTIONS.hairStyle, 31),
  };
}

function colorFor(token, c) {
  switch (token) {
    case 'H': return c.hair;
    case 'S': return c.skin;
    case 'E': return '#1C1714';
    case 'T': return c.top;
    case 'B': return c.bottom;
    case 'F': return '#2A2320';
    default: return 'transparent';
  }
}

function PixelCharacter({ config = DEFAULT_CHARACTER, scale = 6, style }) {
  const grid = BODY.map((row) => row.split(''));
  if (config.hairStyle === 'long') {
    for (const r of Object.keys(LONG_OVERLAY)) {
      for (const col of LONG_OVERLAY[r]) grid[Number(r)][col] = 'H';
    }
  }
  return (
    <View style={[{ width: 12 * scale, height: 20 * scale }, style]}>
      {grid.map((row, r) => (
        <View key={r} style={styles.row}>
          {row.map((tok, c) => (
            <View key={c} style={{ width: scale, height: scale, backgroundColor: colorFor(tok, config) }} />
          ))}
        </View>
      ))}
    </View>
  );
}

export default React.memo(PixelCharacter);

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
});
