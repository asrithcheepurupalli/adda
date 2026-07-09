import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import PixelCharacter from './PixelCharacter';
import { useCharacter } from '../lib/characterStore';
import { getCategory } from '../constants/spots';
import { getEventCategory } from '../constants/events';
import { colors, fonts } from '../constants/theme';

// Real Vizag. City view wide enough to catch Beach Road through Rushikonda.
const VIZAG = {
  latitude: 17.7286,
  longitude: 83.3255,
  latitudeDelta: 0.085,
  longitudeDelta: 0.085,
};
const FOCUS_DELTA = 0.024;

function PixelPin({ color, icon, badge, friend, name, selected }) {
  return (
    <View style={styles.pinWrap}>
      {selected ? (
        <View style={styles.pinLabel}>
          <Text style={styles.pinLabelTxt} numberOfLines={1}>{name}</Text>
        </View>
      ) : null}
      {selected ? <View style={styles.pinGlow} /> : null}
      <View style={[styles.pin, { backgroundColor: color }, selected && styles.pinSel]}>
        <Ionicons name={icon} size={selected ? 17 : 15} color="#fff" />
      </View>
      <View style={[styles.pinStem, { backgroundColor: color }]} />
      {badge ? (
        <View style={styles.badge}><Text style={styles.badgeTxt}>{badge}</Text></View>
      ) : null}
      {friend ? (
        <View style={[styles.friendDot, { backgroundColor: friend.tint }]}>
          <Text style={styles.friendDotTxt}>{friend.name[0]}</Text>
        </View>
      ) : null}
    </View>
  );
}

const CityMap = forwardRef(function CityMap(
  { spots, selectedId, onSelect, onOpen, mapType = 'standard' },
  ref
) {
  const mapRef = useRef(null);
  const [userPos, setUserPos] = useState(null);
  const youCharacter = useCharacter('you');

  // real GPS — permission was requested during onboarding
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const last = await Location.getLastKnownPositionAsync();
        const loc = last || (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
        if (alive && loc) {
          setUserPos({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        }
      } catch {}
    })();
    return () => { alive = false; };
  }, []);

  const focusOn = (lat, lng, delta = FOCUS_DELTA) => {
    // nudge the centre south so the pin sits above the card carousel
    mapRef.current?.animateToRegion(
      {
        latitude: lat - delta * 0.14,
        longitude: lng,
        latitudeDelta: delta,
        longitudeDelta: delta,
      },
      550
    );
  };

  useImperativeHandle(ref, () => ({
    recenter: () => {
      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
      if (userPos) focusOn(userPos.latitude, userPos.longitude, 0.03);
      else mapRef.current?.animateToRegion(VIZAG, 550);
    },
  }));

  useEffect(() => {
    if (!selectedId) return;
    const p = spots.find((s) => s.id === selectedId);
    if (p) focusOn(p.lat, p.lng);
  }, [selectedId]);

  const pressPin = (p) => {
    try { Haptics.selectionAsync(); } catch {}
    if (selectedId === p.id) onOpen(p);
    else onSelect(p);
  };

  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      initialRegion={VIZAG}
      mapType={mapType}
      showsPointsOfInterest={false}
      showsCompass={false}
      showsMyLocationButton={false}
      toolbarEnabled={false}
      pitchEnabled={false}
    >
      {userPos ? (
        <Marker coordinate={userPos} anchor={{ x: 0.5, y: 1 }} zIndex={50}>
          <View style={styles.youWrap}>
            <View style={styles.youRing} />
            <PixelCharacter config={youCharacter} scale={2.3} />
            <View style={[styles.nameTag, styles.nameTagSel]}>
              <Text style={styles.nameTxt}>you</Text>
            </View>
          </View>
        </Marker>
      ) : null}

      {spots.map((p) => {
        const selected = selectedId === p.id;
        const kind = p._kind === 'event' ? getEventCategory(p.category) : getCategory(p.category);
        return (
          <Marker
            key={p.id}
            coordinate={{ latitude: p.lat, longitude: p.lng }}
            anchor={{ x: 0.5, y: 1 }}
            zIndex={selected ? 40 : 10}
            onPress={(e) => { e.stopPropagation?.(); pressPin(p); }}
          >
            <PixelPin
              color={kind.color}
              icon={kind.icon}
              badge={p._kind === 'event' ? p.day : p.score ? p.score.toFixed(1) : null}
              friend={p._kind !== 'event' ? p.friend : null}
              name={p._kind === 'event' ? p.title : p.name}
              selected={selected}
            />
          </Marker>
        );
      })}
    </MapView>
  );
});

export default CityMap;

const styles = StyleSheet.create({
  pinWrap: { alignItems: 'center', paddingTop: 6 },
  pinGlow: {
    position: 'absolute', top: 0, width: 46, height: 46, borderRadius: 12,
    backgroundColor: 'rgba(188,33,48,0.28)',
  },
  pin: {
    width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5, borderColor: '#fff',
  },
  pinSel: { width: 40, height: 40, borderRadius: 10, borderColor: colors.cream },
  pinStem: { width: 6, height: 8, marginTop: -1 },
  badge: {
    position: 'absolute', top: 0, right: -10, backgroundColor: colors.ink, borderRadius: 5,
    paddingHorizontal: 4, paddingVertical: 1, borderWidth: 1, borderColor: '#fff',
  },
  badgeTxt: { color: '#fff', fontFamily: fonts.bold, fontSize: 9 },

  pinLabel: {
    marginBottom: 4, backgroundColor: colors.ink, borderRadius: 5, paddingHorizontal: 7,
    paddingVertical: 3, borderWidth: 1, borderColor: '#fff', maxWidth: 140,
  },
  pinLabelTxt: { color: '#fff', fontFamily: fonts.bold, fontSize: 10 },
  friendDot: {
    position: 'absolute', top: 0, left: -10, width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#fff',
  },
  friendDotTxt: { color: '#fff', fontFamily: fonts.bold, fontSize: 10 },
  nameTag: {
    marginTop: 3, backgroundColor: colors.ink, paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 4, borderWidth: 1, borderColor: '#fff', maxWidth: 110,
  },
  nameTagSel: { backgroundColor: colors.red },
  nameTxt: { color: '#fff', fontFamily: fonts.bold, fontSize: 9 },

  youWrap: { alignItems: 'center' },
  youRing: {
    position: 'absolute', top: -5, width: 46, height: 46, borderRadius: 23,
    borderWidth: 3, borderColor: colors.red, opacity: 0.55,
  },
});
