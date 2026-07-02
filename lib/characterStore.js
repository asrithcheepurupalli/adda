import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_CHARACTER, OPTIONS, characterFromSeed } from '../components/PixelCharacter';

const KEY = 'adda.character.v1';

let character = null; // null until loaded
let loaded = false;
const listeners = new Set();

export async function ensureLoaded() {
  if (loaded) return;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) character = { ...DEFAULT_CHARACTER, ...JSON.parse(raw) };
  } catch {}
  loaded = true;
}

export function getCharacter() {
  return character;
}

export async function saveCharacter(next) {
  character = { ...DEFAULT_CHARACTER, ...next };
  try { await AsyncStorage.setItem(KEY, JSON.stringify(character)); } catch {}
  const snap = { ...character };
  listeners.forEach((cb) => cb(snap));
}

export function randomCharacter() {
  const p = (arr) => arr[Math.floor(Math.random() * arr.length)];
  return {
    skin: p(OPTIONS.skin),
    hair: p(OPTIONS.hair),
    top: p(OPTIONS.top),
    bottom: p(OPTIONS.bottom),
    hairStyle: p(OPTIONS.hairStyle),
  };
}

// deterministic-ish shuffle by rotating each option
export function nextCharacter(current) {
  const c = current || DEFAULT_CHARACTER;
  const rot = (arr, val) => arr[(arr.indexOf(val) + 1 + arr.length) % arr.length];
  return {
    skin: rot(OPTIONS.skin, c.skin),
    hair: rot(OPTIONS.hair, c.hair),
    top: rot(OPTIONS.top, c.top),
    bottom: rot(OPTIONS.bottom, c.bottom),
    hairStyle: rot(OPTIONS.hairStyle, c.hairStyle),
  };
}

export function useCharacter(seed) {
  const [state, setState] = useState(character);
  useEffect(() => {
    let alive = true;
    ensureLoaded().then(() => {
      if (!alive) return;
      setState(character || characterFromSeed(seed));
    });
    const cb = (snap) => setState(snap);
    listeners.add(cb);
    return () => { alive = false; listeners.delete(cb); };
  }, []);
  return state || characterFromSeed(seed);
}
