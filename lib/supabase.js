import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Anon key is public by design — safe to ship in the client. Row Level
// Security (supabase/migrations/001_social.sql) is what protects the data.
// The service_role key must NEVER appear in this repo.
const SUPABASE_URL = 'https://tgxxebtyhnpmwlurxgbp.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRneHhlYnR5aG5wbXdsdXJ4Z2JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwNDM0NjQsImV4cCI6MjA5ODYxOTQ2NH0.twk5cg2FPUU5x5awlUk5mrUltsrFR2Qnf7YnYiMibJ8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ---- auth ----------------------------------------------------------------

export async function sendEmailCode(email) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });
  if (error) throw error;
}

export async function verifyEmailCode(email, code) {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token: code,
    type: 'email',
  });
  if (error) throw error;
  return data.session;
}

export async function getSession() {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session || null;
  } catch {
    return null;
  }
}

export async function currentUserId() {
  const session = await getSession();
  return session?.user?.id || null;
}

// Claim (or update) the signed-in user's username.
// Throws { code: 'taken' } when someone already owns it.
export async function claimProfile(username) {
  const uid = await currentUserId();
  if (!uid) return null;
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: uid, username }, { onConflict: 'id' });
  if (error) {
    if (error.code === '23505') throw { code: 'taken' };
    throw error;
  }
  return uid;
}

// ---- background sync (fire-and-forget; local stores stay source of truth) --

export function syncRankings(ordered) {
  (async () => {
    const uid = await currentUserId();
    if (!uid) return;
    const rows = ordered.map((r) => ({
      user_id: uid,
      spot_id: r.id,
      sentiment: r.sentiment,
      rank: r.rank,
      score: r.score,
      updated_at: new Date().toISOString(),
    }));
    if (rows.length) {
      await supabase.from('rankings').upsert(rows, { onConflict: 'user_id,spot_id' });
    }
  })().catch(() => {});
}

export function clearRankings() {
  (async () => {
    const uid = await currentUserId();
    if (!uid) return;
    await supabase.from('rankings').delete().eq('user_id', uid);
  })().catch(() => {});
}

export function syncRsvp(eventId, going) {
  (async () => {
    const uid = await currentUserId();
    if (!uid) return;
    if (going) {
      await supabase.from('rsvps').upsert(
        { user_id: uid, event_id: eventId },
        { onConflict: 'user_id,event_id' }
      );
    } else {
      await supabase.from('rsvps').delete().eq('user_id', uid).eq('event_id', eventId);
    }
  })().catch(() => {});
}

// ---- real people ----------------------------------------------------------

export async function searchProfiles(q) {
  const uid = await currentUserId();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username')
    .ilike('username', `%${q}%`)
    .limit(12);
  if (error) return [];
  return (data || []).filter((p) => p.id !== uid);
}

export async function fetchMyFollowing() {
  const uid = await currentUserId();
  if (!uid) return [];
  const { data, error } = await supabase
    .from('follows')
    .select('followee')
    .eq('follower', uid);
  if (error) return [];
  return (data || []).map((r) => r.followee);
}

export async function setFollowUser(followeeId, follow) {
  const uid = await currentUserId();
  if (!uid) return false;
  if (follow) {
    const { error } = await supabase
      .from('follows')
      .upsert({ follower: uid, followee: followeeId }, { onConflict: 'follower,followee' });
    return !error;
  }
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower', uid)
    .eq('followee', followeeId);
  return !error;
}
