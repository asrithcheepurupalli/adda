import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { touchStreak } from './streakStore';
import { syncCheckin } from './supabase';

// Check-ins: "I was here", optionally with a photo that hangs on the map.
// Local-first (works signed out); mirrors to Supabase in the background.

const KEY = 'adda.checkins.v1';
const MAX = 200;

let checkins = []; // newest first: {id, spotId, note, photoUri, verified, at}
let loaded = false;
const listeners = new Set();

async function ensureLoaded() {
  if (loaded) return;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) checkins = JSON.parse(raw);
  } catch {}
  loaded = true;
}

async function persist() {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(checkins));
  } catch {}
}

function notify() {
  for (const l of listeners) l();
}

export async function addCheckin({ spotId, note = '', photoUri = null, verified = false }) {
  await ensureLoaded();
  const c = {
    id: `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    spotId,
    note: note.trim(),
    photoUri,
    verified,
    at: new Date().toISOString(),
  };
  checkins = [c, ...checkins].slice(0, MAX);
  await persist();
  notify();
  touchStreak();
  syncCheckin(c);
  return c;
}

export async function removeCheckin(id) {
  await ensureLoaded();
  checkins = checkins.filter((c) => c.id !== id);
  await persist();
  notify();
}

export function checkinsForSpot(spotId) {
  return checkins.filter((c) => c.spotId === spotId);
}

export function lastCheckinFor(spotId) {
  return checkins.find((c) => c.spotId === spotId) ?? null;
}

export async function resetCheckins() {
  checkins = [];
  loaded = true;
  await persist();
  notify();
}

export function useCheckins() {
  const [, setTick] = useState(0);
  const [ready, setReady] = useState(loaded);
  useEffect(() => {
    let alive = true;
    ensureLoaded().then(() => {
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
  return {
    list: checkins,
    count: checkins.length,
    photoCount: checkins.filter((c) => c.photoUri).length,
    ready,
    forSpot: checkinsForSpot,
  };
}
