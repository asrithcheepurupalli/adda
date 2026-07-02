import React, { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import PixelAvatar from '../../components/PixelAvatar';
import { photoForEvent } from '../../lib/photos';
import {
  EVENTS,
  EVENT_CATEGORY_LIST,
  GROUPS,
  getEventCategory,
} from '../../constants/events';
import { getPerson } from '../../constants/people';
import { useGoing } from '../../lib/eventStore';
import { colors, fonts, radius } from '../../constants/theme';

export default function Events() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isGoing, toggle } = useGoing();
  const [active, setActive] = useState(null);

  const filtered = useMemo(() => {
    const list = active ? EVENTS.filter((e) => e.category === active) : EVENTS;
    return [...list].sort((a, b) => a.sort - b.sort);
  }, [active]);

  const featured = filtered[0];
  const rest = filtered.slice(1);

  const rsvp = (id) => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
    toggle(id);
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View style={styles.head}>
          <Text style={styles.kicker}>WHAT'S ON</Text>
          <Text style={styles.h1}>Vizag, right now</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Chip label="All" active={!active} onPress={() => setActive(null)} />
          {EVENT_CATEGORY_LIST.map((c) => (
            <Chip key={c.key} label={c.label} icon={c.icon} color={c.color} active={active === c.key} onPress={() => setActive(active === c.key ? null : c.key)} />
          ))}
        </ScrollView>

        {featured && (
          <FeaturedCard
            event={featured}
            going={isGoing(featured.id)}
            onGo={() => rsvp(featured.id)}
            onOpen={() => router.push(`/event/${featured.id}`)}
          />
        )}

        {GROUPS.map((g) => {
          const items = rest.filter((e) => e.group === g);
          if (!items.length) return null;
          return (
            <View key={g}>
              <Text style={styles.section}>{g.toUpperCase()}</Text>
              <View style={styles.list}>
                {items.map((e) => (
                  <EventRow
                    key={e.id}
                    event={e}
                    going={isGoing(e.id)}
                    onGo={() => rsvp(e.id)}
                    onOpen={() => router.push(`/event/${e.id}`)}
                  />
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

function Chip({ label, icon, color, active, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      {icon ? <Ionicons name={icon} size={14} color={active ? '#fff' : color} /> : null}
      <Text style={[styles.chipTxt, active && styles.chipTxtActive]}>{label}</Text>
    </Pressable>
  );
}

function FriendsGoing({ ids, count, dark }) {
  const people = ids.map(getPerson).filter(Boolean).slice(0, 3);
  return (
    <View style={styles.fg}>
      <View style={{ flexDirection: 'row' }}>
        {people.map((p, i) => (
          <PixelAvatar key={p.id} seed={p.id} size={24} tint={p.tint} style={{ marginLeft: i === 0 ? 0 : -8 }} />
        ))}
      </View>
      <Text style={[styles.fgTxt, dark && { color: 'rgba(255,255,255,0.9)' }]}>{count} going</Text>
    </View>
  );
}

function GoBtn({ going, onPress, big }) {
  return (
    <Pressable onPress={onPress} style={[styles.goBtn, big && styles.goBtnBig, going && styles.goBtnOn]}>
      <Ionicons name={going ? 'checkmark' : 'add'} size={big ? 18 : 16} color={going ? '#fff' : (big ? colors.ink : colors.textOnDark)} />
      <Text style={[styles.goTxt, big && { color: going ? '#fff' : colors.ink }, going && !big && { color: '#fff' }]}>
        {going ? 'Going' : "I'm in"}
      </Text>
    </Pressable>
  );
}

function FeaturedCard({ event, going, onGo, onOpen }) {
  const cat = getEventCategory(event.category);
  return (
    <Pressable style={styles.featured} onPress={onOpen}>
      <View style={styles.featuredHero}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: cat.color }]} />
        <Image source={{ uri: photoForEvent(event, 900, 500) }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <LinearGradient colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.05)', 'rgba(18,15,14,0.9)']} locations={[0, 0.4, 1]} style={StyleSheet.absoluteFill} />
        <View style={styles.dayBadge}><Text style={styles.dayBadgeTxt}>{event.day} · {event.time}</Text></View>
        <View style={styles.featuredBottom}>
          <Text style={styles.featuredCat}>{cat.label.toUpperCase()}</Text>
          <Text style={styles.featuredTitle}>{event.title}</Text>
          <Text style={styles.featuredMeta}>{event.venue} · {event.area}</Text>
        </View>
      </View>
      <View style={styles.featuredFoot}>
        <FriendsGoing ids={event.friendsGoing} count={event.going + (going ? 1 : 0)} />
        <GoBtn going={going} onPress={onGo} big />
      </View>
    </Pressable>
  );
}

function EventRow({ event, going, onGo, onOpen }) {
  const cat = getEventCategory(event.category);
  return (
    <Pressable style={styles.row} onPress={onOpen}>
      <View style={[styles.thumb, { backgroundColor: cat.color }]}>
        <Image source={{ uri: photoForEvent(event, 300, 300) }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <View style={styles.thumbDay}><Text style={styles.thumbDayTxt}>{event.day}</Text></View>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle} numberOfLines={2}>{event.title}</Text>
        <Text style={styles.rowMeta} numberOfLines={1}>{event.time} · {event.area} · {event.price}</Text>
        <View style={styles.rowFoot}>
          <FriendsGoing ids={event.friendsGoing} count={event.going + (going ? 1 : 0)} />
        </View>
      </View>
      <GoBtn going={going} onPress={onGo} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  head: { paddingHorizontal: 20 },
  kicker: { fontFamily: fonts.label, fontSize: 12, letterSpacing: 3, color: colors.red },
  h1: { fontFamily: fonts.extrabold, fontSize: 30, color: colors.textOnDark, marginTop: 8, letterSpacing: -0.5 },
  chips: { gap: 8, paddingVertical: 16, paddingHorizontal: 20 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.ink2, borderWidth: 1, borderColor: colors.hairline, height: 36, paddingHorizontal: 14, borderRadius: radius.pill },
  chipActive: { backgroundColor: colors.red, borderColor: colors.red },
  chipTxt: { fontFamily: fonts.semibold, fontSize: 13, color: colors.textOnDark },
  chipTxtActive: { color: '#fff' },

  featured: { marginHorizontal: 20, backgroundColor: colors.ink2, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.hairline, overflow: 'hidden' },
  featuredHero: { height: 190, justifyContent: 'flex-end' },
  dayBadge: { position: 'absolute', top: 14, left: 14, backgroundColor: 'rgba(0,0,0,0.35)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill },
  dayBadgeTxt: { fontFamily: fonts.label, fontSize: 11, letterSpacing: 1, color: '#fff' },
  featuredBottom: { padding: 16 },
  featuredCat: { fontFamily: fonts.label, fontSize: 11, letterSpacing: 2, color: 'rgba(255,255,255,0.85)' },
  featuredTitle: { fontFamily: fonts.extrabold, fontSize: 24, color: '#fff', marginTop: 4, letterSpacing: -0.4 },
  featuredMeta: { fontFamily: fonts.medium, fontSize: 13.5, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  featuredFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },

  section: { fontFamily: fonts.label, fontSize: 12, letterSpacing: 2.5, color: colors.red, marginTop: 26, marginBottom: 12, paddingHorizontal: 20 },
  list: { paddingHorizontal: 20, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.ink2, borderRadius: radius.md, padding: 12, borderWidth: 1, borderColor: colors.hairline },
  thumb: { width: 74, height: 74, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  thumbDay: { position: 'absolute', bottom: 6, backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  thumbDayTxt: { fontFamily: fonts.label, fontSize: 9, letterSpacing: 0.5, color: '#fff' },
  rowTitle: { fontFamily: fonts.bold, fontSize: 15.5, color: colors.textOnDark, lineHeight: 20 },
  rowMeta: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.textOnDarkMuted, marginTop: 4 },
  rowFoot: { marginTop: 8 },

  fg: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fgAvatar: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  fgAvatarTxt: { color: '#fff', fontFamily: fonts.bold, fontSize: 11 },
  fgTxt: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.textOnDarkMuted },

  goBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.ink3, borderWidth: 1, borderColor: colors.hairline, paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.pill },
  goBtnBig: { backgroundColor: '#fff', borderColor: '#fff', paddingHorizontal: 18, paddingVertical: 11 },
  goBtnOn: { backgroundColor: colors.red, borderColor: colors.red },
  goTxt: { fontFamily: fonts.label, fontSize: 12, letterSpacing: 1, color: colors.textOnDark, textTransform: 'uppercase' },
});
