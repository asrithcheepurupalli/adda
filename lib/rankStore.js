import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { touchStreak } from './streakStore';

// Beli-style ranking store.
// Three sentiment buckets, each an ordered list of spot ids (best -> worst).
// Scores are derived from position within a band.

const KEY = 'adda.rankings.v1';
const BANDS = {
  liked: [6.9, 10.0],
  fine: [3.4, 6.7],
  disliked: [1.0, 3.3],
};
const ORDER = ['liked', 'fine', 'disliked'];

let buckets = { liked: [], fine: [], disliked: [] };
let loaded = false;
const listeners = new Set();

export async function ensureLoaded() {
  if (loaded) return;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      buckets = {
        liked: parsed.liked || [],
        fine: parsed.fine || [],
        disliked: parsed.disliked || [],
      };
    }
  } catch {}
  loaded = true;
}

async function persist() {
  try { await AsyncStorage.setItem(KEY, JSON.stringify(buckets)); } catch {}
}

function notify() {
  const snap = snapshot();
  listeners.forEach((cb) => cb(snap));
}

function computeScores() {
  const scores = {};
  for (const key of ORDER) {
    const ids = buckets[key];
    const [lo, hi] = BANDS[key];
    const k = ids.length;
    ids.forEach((id, i) => {
      let s;
      if (k <= 1) s = hi - (hi - lo) * 0.15;
      else s = hi - (i / (k - 1)) * (hi - lo);
      scores[id] = Math.round(s * 10) / 10;
    });
  }
  return scores;
}

export function snapshot() {
  const scores = computeScores();
  const ordered = [];
  for (const key of ORDER) {
    buckets[key].forEach((id) => ordered.push({ id, sentiment: key, score: scores[id] }));
  }
  ordered.forEach((r, i) => { r.rank = i + 1; });
  return { ordered, scores, total: ordered.length, buckets: { ...buckets } };
}

export function getBucket(sentiment) {
  return [...(buckets[sentiment] || [])];
}

export function scoreFor(id) {
  return computeScores()[id];
}

export function sentimentOf(id) {
  for (const key of ORDER) if (buckets[key].includes(id)) return key;
  return null;
}

// Insert (or move) a spot into a bucket at a given index.
export async function placeSpot(id, sentiment, index) {
  await ensureLoaded();
  // remove from any bucket first (re-rank case)
  for (const key of ORDER) buckets[key] = buckets[key].filter((x) => x !== id);
  const arr = buckets[sentiment];
  const at = Math.max(0, Math.min(index, arr.length));
  arr.splice(at, 0, id);
  await persist();
  notify();
  touchStreak();
  const snap = snapshot();
  const entry = snap.ordered.find((r) => r.id === id);
  return { ...entry, total: snap.total }; // { id, sentiment, score, rank, total }
}

export async function resetRankings() {
  buckets = { liked: [], fine: [], disliked: [] };
  await persist();
  notify();
}

// React hook
export function useRankings() {
  const [state, setState] = useState(() => snapshot());
  const [ready, setReady] = useState(loaded);
  useEffect(() => {
    let alive = true;
    ensureLoaded().then(() => {
      if (!alive) return;
      setState(snapshot());
      setReady(true);
    });
    const cb = (snap) => setState(snap);
    listeners.add(cb);
    return () => { alive = false; listeners.delete(cb); };
  }, []);
  return { ...state, ready };
}

export const SENTIMENTS = [
  { key: 'liked', label: 'Loved it', sub: 'One of the good ones', icon: 'heart', color: '#BC2130' },
  { key: 'fine', label: 'It was fine', sub: 'Nothing wrong with it', icon: 'thumbs-up', color: '#E5A020' },
  { key: 'disliked', label: 'Not for me', sub: 'Would not go back', icon: 'thumbs-down', color: '#6B6259' },
];
