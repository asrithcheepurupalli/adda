import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { touchStreak } from './streakStore';

// Spots you've saved (the heart button). Persisted list of spot ids.
const KEY = 'adda.saved.v1';

let saved = [];
let loaded = false;
const listeners = new Set();

export async function ensureLoaded() {
  if (loaded) return;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) saved = JSON.parse(raw) || [];
  } catch {}
  loaded = true;
}

async function persist() {
  try { await AsyncStorage.setItem(KEY, JSON.stringify(saved)); } catch {}
}

function notify() {
  const snap = [...saved];
  listeners.forEach((cb) => cb(snap));
}

export function isSaved(id) {
  return saved.includes(id);
}

export async function toggleSaved(id) {
  await ensureLoaded();
  if (saved.includes(id)) saved = saved.filter((x) => x !== id);
  else saved = [...saved, id];
  await persist();
  notify();
  touchStreak();
  return saved.includes(id);
}

export async function resetSaved() {
  saved = [];
  await persist();
  notify();
}

export function useSaved() {
  const [ids, setIds] = useState(saved);
  const [ready, setReady] = useState(loaded);
  useEffect(() => {
    let alive = true;
    ensureLoaded().then(() => {
      if (!alive) return;
      setIds([...saved]);
      setReady(true);
    });
    const cb = (snap) => setIds(snap);
    listeners.add(cb);
    return () => { alive = false; listeners.delete(cb); };
  }, []);
  return { ids, count: ids.length, ready, isSaved: (id) => ids.includes(id), toggle: toggleSaved };
}
