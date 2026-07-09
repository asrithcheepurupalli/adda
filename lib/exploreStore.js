import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Fog of war: Vizag starts dark and reveals as you actually move through it.
// The PixelEarth world window is a 32x32 grid of ~300m blocks; being
// somewhere (GPS while the map is open, verified check-ins) clears blocks.

const KEY = 'adda.explored.v1';

// mirror of PixelEarth's mercator window (z12 tiles 2994-2997 / 1841-1844)
const TILE_X0 = 2994;
const TILE_Y0 = 1841;
const N_TILES = 1 << 12;
const TILE_RENDER = 512;
export const WORLD = 4 * TILE_RENDER;
export const CELL = 64; // world px per fog block
export const GRID = WORLD / CELL; // 32

export function geoToCell(lat, lng) {
  const mx = ((lng + 180) / 360) * N_TILES;
  const rad = (lat * Math.PI) / 180;
  const my = ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * N_TILES;
  const x = (mx - TILE_X0) * TILE_RENDER;
  const y = (my - TILE_Y0) * TILE_RENDER;
  return { cx: Math.floor(x / CELL), cy: Math.floor(y / CELL) };
}

// "city core" — the stretch everyone actually roams; basis for the % stat
const CORE_A = geoToCell(17.78, 83.27);
const CORE_B = geoToCell(17.67, 83.37);
const CORE = {
  x0: Math.min(CORE_A.cx, CORE_B.cx),
  x1: Math.max(CORE_A.cx, CORE_B.cx),
  y0: Math.min(CORE_A.cy, CORE_B.cy),
  y1: Math.max(CORE_A.cy, CORE_B.cy),
};
const CORE_TOTAL = (CORE.x1 - CORE.x0 + 1) * (CORE.y1 - CORE.y0 + 1);

let cells = new Set(); // "cx,cy"
let loaded = false;
const listeners = new Set();

async function ensureLoaded() {
  if (loaded) return;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) cells = new Set(JSON.parse(raw));
  } catch {}
  loaded = true;
}

async function persist() {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify([...cells]));
  } catch {}
}

function notify() {
  for (const l of listeners) l();
}

function inGrid(cx, cy) {
  return cx >= 0 && cx < GRID && cy >= 0 && cy < GRID;
}

export async function revealAt(lat, lng, radius = 1) {
  await ensureLoaded();
  const { cx, cy } = geoToCell(lat, lng);
  let changed = false;
  for (let dx = -radius; dx <= radius; dx++) {
    for (let dy = -radius; dy <= radius; dy++) {
      const x = cx + dx, y = cy + dy;
      if (!inGrid(x, y)) continue;
      const k = `${x},${y}`;
      if (!cells.has(k)) {
        cells.add(k);
        changed = true;
      }
    }
  }
  if (changed) {
    await persist();
    notify();
  }
  return changed;
}

// a fresh map shouldn't be pitch black — the city centre starts lit
export async function ensureStarter() {
  await ensureLoaded();
  if (cells.size === 0) await revealAt(17.7231, 83.3245, 2);
}

export function snapshot() {
  let core = 0;
  for (const k of cells) {
    const [x, y] = k.split(',').map(Number);
    if (x >= CORE.x0 && x <= CORE.x1 && y >= CORE.y0 && y <= CORE.y1) core++;
  }
  return {
    cells,
    count: cells.size,
    corePercent: Math.min(100, Math.round((core / CORE_TOTAL) * 100)),
  };
}

export async function resetExplore() {
  cells = new Set();
  loaded = true;
  await persist();
  notify();
}

export function useExplore() {
  const [, setTick] = useState(0);
  const [ready, setReady] = useState(loaded);
  useEffect(() => {
    let alive = true;
    ensureStarter().then(() => {
      if (alive) {
        setReady(true);
        setTick((t) => t + 1);
      }
    });
    const l = () => setTick((t) => t + 1);
    listeners.add(l);
    return () => {
      alive = false;
      listeners.delete(l);
    };
  }, []);
  return { ...snapshot(), ready };
}
