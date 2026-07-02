import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Who you follow. Persisted list of person ids.
const KEY = 'adda.following.v1';

let following = [];
let loaded = false;
const listeners = new Set();

export async function ensureLoaded() {
  if (loaded) return;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) following = JSON.parse(raw) || [];
  } catch {}
  loaded = true;
}

async function persist() {
  try { await AsyncStorage.setItem(KEY, JSON.stringify(following)); } catch {}
}

function notify() {
  const snap = [...following];
  listeners.forEach((cb) => cb(snap));
}

export function isFollowing(id) {
  return following.includes(id);
}

export async function toggleFollow(id) {
  await ensureLoaded();
  if (following.includes(id)) following = following.filter((x) => x !== id);
  else following = [...following, id];
  await persist();
  notify();
  return following.includes(id);
}

export async function resetFollowing() {
  following = [];
  await persist();
  notify();
}

export function useFollowing() {
  const [ids, setIds] = useState(following);
  const [ready, setReady] = useState(loaded);
  useEffect(() => {
    let alive = true;
    ensureLoaded().then(() => {
      if (!alive) return;
      setIds([...following]);
      setReady(true);
    });
    const cb = (snap) => setIds(snap);
    listeners.add(cb);
    return () => { alive = false; listeners.delete(cb); };
  }, []);
  return { ids, count: ids.length, ready, isFollowing: (id) => ids.includes(id), toggle: toggleFollow };
}
