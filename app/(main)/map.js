import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import CityMap from '../../components/CityMap';
import PixelEarth from '../../components/PixelEarth';
import SpotMap from '../../components/SpotMap';
import PixelAvatar from '../../components/PixelAvatar';
import { CATEGORY_LIST, SPOTS, getCategory } from '../../constants/spots';
import { EVENTS, EVENT_CATEGORY_LIST, getEventCategory } from '../../constants/events';
import { photoForSpot, photoForEvent } from '../../lib/photos';
import { colors, fonts, radius } from '../../constants/theme';

const CARD_W = 240;
const CARD_GAP = 12;

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [mode, setMode] = useState('places'); // 'places' | 'events'
  const [active, setActive] = useState(null);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  // map style cycles: real streets -> satellite -> pixel satellite -> pixel world
  // (native maps don't exist on web, so web only offers the modes that work there)
  const MAP_MODES = Platform.OS === 'web'
    ? ['pixelearth', 'pixel']
    : ['standard', 'hybrid', 'pixelearth', 'pixel'];
  const MODE_ICON = { standard: 'map', hybrid: 'globe', pixelearth: 'planet', pixel: 'game-controller' };
  const [mapType, setMapType] = useState(MAP_MODES[0]);
  const mapRef = useRef(null);
  const listRef = useRef(null);
  const fromPinRef = useRef(false);
  const userScrolledRef = useRef(false);

  const isEvents = mode === 'events';
  const chips = isEvents ? EVENT_CATEGORY_LIST : CATEGORY_LIST;

  const points = useMemo(() => {
    let list = isEvents
      ? (active ? EVENTS.filter((e) => e.category === active) : EVENTS).map((e) => ({ ...e, _kind: 'event' }))
      : (active ? SPOTS.filter((s) => s.category === active) : SPOTS).map((s) => ({ ...s, _kind: 'spot' }));
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((p) =>
        [p.name, p.title, p.area, p.category].some((f) => f && f.toLowerCase().includes(q))
      );
    }
    return list;
  }, [mode, active, query]);

  // searching flies the camera to the best match
  React.useEffect(() => {
    if (!query.trim() || points.length === 0) return;
    if (!points.some((p) => p.id === selectedId)) {
      fromPinRef.current = true;
      setSelectedId(points[0].id);
    }
  }, [query, points]);

  const open = (p) => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    router.push(p._kind === 'event' ? `/event/${p.id}` : `/spot/${p.id}`);
  };

  // pin tapped -> select + bring its card into view
  const selectFromPin = (p) => {
    fromPinRef.current = true;
    setSelectedId(p.id);
    const idx = points.findIndex((x) => x.id === p.id);
    if (idx >= 0) listRef.current?.scrollToIndex({ index: idx, viewPosition: 0.5, animated: true });
  };

  // carousel swiped -> select pin, camera follows
  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (!userScrolledRef.current) return;
    if (fromPinRef.current) { fromPinRef.current = false; return; }
    const first = viewableItems.find((v) => v.isViewable);
    if (first?.item) setSelectedId(first.item.id);
  }, []);
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  const switchMode = (m) => {
    try { Haptics.selectionAsync(); } catch {}
    setMode(m);
    setActive(null);
    setSelectedId(null);
  };

  const pickChip = (key) => {
    try { Haptics.selectionAsync(); } catch {}
    setActive(key);
    setSelectedId(null);
  };

  return (
    <View style={styles.root}>
      {mapType === 'pixel' ? (
        <SpotMap
          ref={mapRef}
          spots={points}
          selectedId={selectedId}
          onSelect={selectFromPin}
          onOpen={open}
        />
      ) : mapType === 'pixelearth' ? (
        <PixelEarth
          ref={mapRef}
          spots={points}
          selectedId={selectedId}
          onSelect={selectFromPin}
          onOpen={open}
        />
      ) : (
        <CityMap
          ref={mapRef}
          spots={points}
          selectedId={selectedId}
          onSelect={selectFromPin}
          onOpen={open}
          mapType={mapType}
        />
      )}

      <View style={[styles.top, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
        <View style={styles.searchRow}>
          <View style={styles.search}>
            <Ionicons name="search" size={18} color={colors.textOnLightMuted} />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder={`Search ${isEvents ? 'events' : 'spots'} in Vizag`}
              placeholderTextColor={colors.textOnLightMuted}
              returnKeyType="search"
              autoCorrect={false}
            />
            {query ? (
              <Pressable onPress={() => setQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={colors.textOnLightMuted} />
              </Pressable>
            ) : null}
          </View>
          <Pressable onPress={() => router.push('/(main)/profile')}>
            <PixelAvatar seed="you" size={48} tint={colors.maroon} />
          </Pressable>
        </View>

        <View style={styles.segment}>
          <SegBtn label="Places" icon="location" active={!isEvents} onPress={() => switchMode('places')} />
          <SegBtn label="Events" icon="sparkles" active={isEvents} onPress={() => switchMode('events')} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Chip label="All" active={!active} onPress={() => pickChip(null)} />
          {chips.map((c) => (
            <Chip key={c.key} label={c.label} icon={c.icon} color={c.color} active={active === c.key} onPress={() => pickChip(active === c.key ? null : c.key)} />
          ))}
        </ScrollView>
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 78 }]} pointerEvents="box-none">
        <Pressable
          style={styles.recenter}
          onPress={() => {
            try { Haptics.selectionAsync(); } catch {}
            setMapType((m) => MAP_MODES[(MAP_MODES.indexOf(m) + 1) % MAP_MODES.length]);
          }}
        >
          <Ionicons name={MODE_ICON[mapType]} size={20} color={colors.textOnLight} />
        </Pressable>
        <Pressable
          style={styles.recenter}
          onPress={() => { setSelectedId(null); mapRef.current?.recenter(); }}
        >
          <Ionicons name="locate" size={20} color={colors.textOnLight} />
        </Pressable>

        {points.length === 0 ? (
          <View style={styles.emptyPill}>
            <Ionicons name="compass-outline" size={16} color={colors.textOnDarkMuted} />
            <Text style={styles.emptyTxt}>No matches — try another word</Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={points}
            keyExtractor={(p) => p.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_W + CARD_GAP}
            decelerationRate="fast"
            contentContainerStyle={{ paddingHorizontal: 16 }}
            getItemLayout={(_, index) => ({
              length: CARD_W + CARD_GAP,
              offset: (CARD_W + CARD_GAP) * index,
              index,
            })}
            onScrollBeginDrag={() => { userScrolledRef.current = true; }}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            renderItem={({ item }) =>
              item._kind === 'event'
                ? <EventCard event={item} selected={selectedId === item.id} onPress={() => open(item)} />
                : <SpotCard spot={item} selected={selectedId === item.id} onPress={() => open(item)} />
            }
          />
        )}
      </View>
    </View>
  );
}

function SegBtn({ label, icon, active, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.segBtn, active && styles.segBtnActive]}>
      <Ionicons name={icon} size={15} color={active ? '#fff' : colors.textOnDarkMuted} />
      <Text style={[styles.segTxt, active && styles.segTxtActive]}>{label}</Text>
    </Pressable>
  );
}

function Chip({ label, icon, color, active, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      {icon ? <Ionicons name={icon} size={14} color={active ? '#fff' : color || colors.textOnLight} /> : null}
      <Text style={[styles.chipTxt, active && styles.chipTxtActive]}>{label}</Text>
    </Pressable>
  );
}

function SpotCard({ spot, selected, onPress }) {
  const cat = getCategory(spot.category);
  return (
    <Pressable style={[styles.card, selected && styles.cardSel]} onPress={onPress}>
      <View style={[styles.cardThumb, { backgroundColor: cat.color }]}>
        <Image source={{ uri: photoForSpot(spot, 480, 300) }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <View style={styles.scorePill}>
          <Ionicons name="star" size={11} color={colors.red} />
          <Text style={styles.scorePillTxt}>{spot.score.toFixed(1)}</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={1}>{spot.name}</Text>
        <Text style={styles.cardMeta} numberOfLines={1}>{cat.label} · {spot.area} · {spot.price}</Text>
        {spot.friend ? (
          <View style={styles.cardFriend}>
            <View style={[styles.fDot, { backgroundColor: spot.friend.tint }]} />
            <Text style={styles.cardFriendTxt} numberOfLines={1}>{spot.friend.name}: {spot.friend.quote}</Text>
          </View>
        ) : (
          <Text style={styles.cardBlurb} numberOfLines={2}>{spot.blurb}</Text>
        )}
      </View>
    </Pressable>
  );
}

function EventCard({ event, selected, onPress }) {
  const cat = getEventCategory(event.category);
  return (
    <Pressable style={[styles.card, selected && styles.cardSel]} onPress={onPress}>
      <View style={[styles.cardThumb, { backgroundColor: cat.color }]}>
        <Image source={{ uri: photoForEvent(event, 480, 300) }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <View style={styles.dayPill}>
          <Text style={styles.dayPillTxt}>{event.day} · {event.time}</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={1}>{event.title}</Text>
        <Text style={styles.cardMeta} numberOfLines={1}>{cat.label} · {event.area} · {event.price}</Text>
        <View style={styles.cardFriend}>
          <Ionicons name="people" size={13} color={colors.textOnLightMuted} />
          <Text style={styles.cardFriendTxt} numberOfLines={1}>{event.going} going</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  top: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 16 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  search: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff', height: 48, borderRadius: radius.pill, paddingHorizontal: 16,
    shadowColor: '#000', shadowOpacity: 0.14, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },
  searchInput: { flex: 1, fontFamily: fonts.medium, fontSize: 15, color: colors.textOnLight, paddingVertical: 0 },

  segment: { flexDirection: 'row', alignSelf: 'center', marginTop: 12, backgroundColor: 'rgba(18,15,14,0.85)', borderRadius: radius.pill, padding: 4, gap: 4 },
  segBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 18, paddingVertical: 8, borderRadius: radius.pill },
  segBtnActive: { backgroundColor: colors.red },
  segTxt: { fontFamily: fonts.label, fontSize: 12.5, letterSpacing: 1, color: colors.textOnDarkMuted, textTransform: 'uppercase' },
  segTxtActive: { color: '#fff' },

  chips: { gap: 8, paddingVertical: 12, paddingRight: 16 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fff', height: 38, paddingHorizontal: 14, borderRadius: radius.pill,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  chipActive: { backgroundColor: colors.ink },
  chipTxt: { fontFamily: fonts.semibold, fontSize: 13.5, color: colors.textOnLight },
  chipTxtActive: { color: '#fff' },

  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  recenter: {
    alignSelf: 'flex-end', marginRight: 16, marginBottom: 10,
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.16, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  emptyPill: {
    alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(18,15,14,0.9)', borderRadius: radius.pill, paddingHorizontal: 16, paddingVertical: 10,
  },
  emptyTxt: { fontFamily: fonts.medium, fontSize: 13.5, color: colors.textOnDarkMuted },

  card: {
    width: CARD_W, marginRight: CARD_GAP, backgroundColor: '#fff', borderRadius: radius.lg, overflow: 'hidden',
    borderWidth: 2, borderColor: 'transparent',
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8,
  },
  cardSel: { borderColor: colors.red },
  cardThumb: { height: 96, justifyContent: 'flex-start' },
  scorePill: {
    position: 'absolute', top: 8, right: 8, flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#fff', borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3,
  },
  scorePillTxt: { fontFamily: fonts.bold, fontSize: 12, color: colors.textOnLight },
  dayPill: {
    position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4,
  },
  dayPillTxt: { fontFamily: fonts.label, fontSize: 10, letterSpacing: 0.5, color: '#fff' },
  cardBody: { padding: 12 },
  cardName: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.textOnLight },
  cardMeta: { fontFamily: fonts.medium, fontSize: 12, color: colors.textOnLightMuted, marginTop: 3 },
  cardBlurb: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.textOnLightMuted, marginTop: 8, lineHeight: 18 },
  cardFriend: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  fDot: { width: 8, height: 8, borderRadius: 4 },
  cardFriendTxt: { flex: 1, fontFamily: fonts.medium, fontSize: 12.5, color: colors.textOnLight },
});
