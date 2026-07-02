import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Daily streak — a day counts when you do something in the app
// (open the map, rank, save, add). Duolingo rules: miss a day, it resets.
const KEY = 'adda.streak.v1';
const MAX_DAYS = 120;

let state = { days: [], best: 0 };
let loaded = false;
const listeners = new Set();

const dayKey = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};

const shiftDay = (key, delta) => {
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(y, m - 1, d + delta);
  return dayKey(dt);
};

// consecutive run ending today (or yesterday — still alive until midnight)
function computeCurrent(days) {
  const set = new Set(days);
  let anchor = dayKey();
  if (!set.has(anchor)) anchor = shiftDay(anchor, -1);
  if (!set.has(anchor)) return 0;
  let n = 0;
  while (set.has(anchor)) {
    n += 1;
    anchor = shiftDay(anchor, -1);
  }
  return n;
}

export async function ensureLoaded() {
  if (loaded) return;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) state = { days: [], best: 0, ...JSON.parse(raw) };
  } catch {}
  loaded = true;
}

async function persist() {
  try { await AsyncStorage.setItem(KEY, JSON.stringify(state)); } catch {}
}

function notify() {
  const snap = snapshot();
  listeners.forEach((cb) => cb(snap));
}

function snapshot() {
  const current = computeCurrent(state.days);
  return { current, best: Math.max(state.best, current), todayDone: state.days.includes(dayKey()) };
}

// call this whenever the user does something that should keep the flame alive
export async function touchStreak() {
  await ensureLoaded();
  const today = dayKey();
  if (!state.days.includes(today)) {
    state.days = [...state.days, today].slice(-MAX_DAYS);
    state.best = Math.max(state.best, computeCurrent(state.days));
    await persist();
    notify();
  }
}

export async function resetStreak() {
  state = { days: [], best: 0 };
  await persist();
  notify();
}

export function useStreak() {
  const [snap, setSnap] = useState(snapshot());
  useEffect(() => {
    let alive = true;
    ensureLoaded().then(() => { if (alive) setSnap(snapshot()); });
    const cb = (s) => setSnap(s);
    listeners.add(cb);
    return () => { alive = false; listeners.delete(cb); };
  }, []);
  return snap;
}
