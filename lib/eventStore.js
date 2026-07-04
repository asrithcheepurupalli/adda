import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchMyRsvps, syncRsvp } from './supabase';

// Events you've RSVP'd to. Persisted list of event ids.
const KEY = 'adda.going.v1';

let going = [];
let loaded = false;
const listeners = new Set();

export async function ensureLoaded() {
  if (loaded) return;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) going = JSON.parse(raw) || [];
  } catch {}
  loaded = true;
  // fresh device + signed-in account -> restore RSVPs from the cloud
  if (!going.length) {
    fetchMyRsvps().then((ids) => {
      if (ids.length && !going.length) {
        going = ids;
        persist();
        notify();
      }
    }).catch(() => {});
  }
}

async function persist() {
  try { await AsyncStorage.setItem(KEY, JSON.stringify(going)); } catch {}
}

function notify() {
  const snap = [...going];
  listeners.forEach((cb) => cb(snap));
}

export function isGoing(id) {
  return going.includes(id);
}

export async function toggleGoing(id) {
  await ensureLoaded();
  if (going.includes(id)) going = going.filter((x) => x !== id);
  else going = [...going, id];
  await persist();
  notify();
  syncRsvp(id, going.includes(id)); // background push when signed in
  return going.includes(id);
}

export async function resetGoing() {
  going = [];
  await persist();
  notify();
}

export function useGoing() {
  const [ids, setIds] = useState(going);
  const [ready, setReady] = useState(loaded);
  useEffect(() => {
    let alive = true;
    ensureLoaded().then(() => {
      if (!alive) return;
      setIds([...going]);
      setReady(true);
    });
    const cb = (snap) => setIds(snap);
    listeners.add(cb);
    return () => { alive = false; listeners.delete(cb); };
  }, []);
  return { ids, count: ids.length, ready, isGoing: (id) => ids.includes(id), toggle: toggleGoing };
}
