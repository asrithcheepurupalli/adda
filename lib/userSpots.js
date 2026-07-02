import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSpot } from '../constants/spots';
import { touchStreak } from './streakStore';

// Spots added by the user — full spot objects, persisted.
const KEY = 'adda.userSpots.v1';

let spots = [];
let loaded = false;
const listeners = new Set();

export async function ensureLoaded() {
  if (loaded) return;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) spots = JSON.parse(raw) || [];
  } catch {}
  loaded = true;
}

async function persist() {
  try { await AsyncStorage.setItem(KEY, JSON.stringify(spots)); } catch {}
}

function notify() {
  const snap = [...spots];
  listeners.forEach((cb) => cb(snap));
}

export async function addUserSpot({ name, category, area, price, blurb, lat, lng }) {
  await ensureLoaded();
  const id = `u-${Date.now().toString(36)}`;
  const spot = {
    id,
    name: name.trim(),
    category,
    area: area.trim() || 'Vizag',
    price: price || '₹₹',
    blurb: blurb.trim() || 'Added by you. Rank it to put it on the board.',
    lat,
    lng,
    user: true,
  };
  spots = [...spots, spot];
  await persist();
  notify();
  touchStreak();
  return spot;
}

export async function removeUserSpot(id) {
  await ensureLoaded();
  spots = spots.filter((s) => s.id !== id);
  await persist();
  notify();
}

export async function resetUserSpots() {
  spots = [];
  await persist();
  notify();
}

export function getUserSpot(id) {
  return spots.find((s) => s.id === id);
}

// Looks a spot up wherever it lives — seeded data or user-added.
export function getAnySpot(id) {
  return getSpot(id) || getUserSpot(id);
}

export function useUserSpots() {
  const [list, setList] = useState(spots);
  const [ready, setReady] = useState(loaded);
  useEffect(() => {
    let alive = true;
    ensureLoaded().then(() => {
      if (!alive) return;
      setList([...spots]);
      setReady(true);
    });
    const cb = (snap) => setList(snap);
    listeners.add(cb);
    return () => { alive = false; listeners.delete(cb); };
  }, []);
  return { spots: list, count: list.length, ready };
}
