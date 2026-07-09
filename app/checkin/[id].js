import React, { useEffect, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import AddaButton from '../../components/AddaButton';
import { getCategory } from '../../constants/spots';
import { getAnySpot, useUserSpots } from '../../lib/userSpots';
import { addCheckin } from '../../lib/checkinStore';
import { colors, fonts, radius } from '../../constants/theme';

const NEARBY_M = 400;

function distanceM(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export default function CheckinScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  useUserSpots();
  const spot = getAnySpot(id);

  const [note, setNote] = useState('');
  const [photoUri, setPhotoUri] = useState(null);
  const [nearby, setNearby] = useState(null); // null=checking, true/false=answer
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!spot) return;
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted') { if (alive) setNearby(false); return; }
        const last = await Location.getLastKnownPositionAsync();
        const loc = last || (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
        if (alive && loc) {
          const d = distanceM(loc.coords.latitude, loc.coords.longitude, spot.lat, spot.lng);
          setNearby(d <= NEARBY_M);
        } else if (alive) setNearby(false);
      } catch {
        if (alive) setNearby(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  if (!spot) {
    return (
      <View style={[styles.root, styles.center]}>
        <Text style={styles.missing}>Spot not found.</Text>
        <AddaButton label="Back" variant="secondary" onPress={() => router.back()} style={{ width: 200 }} />
      </View>
    );
  }
  const cat = getCategory(spot.category);

  const pick = async (source) => {
    try { Haptics.selectionAsync(); } catch {}
    try {
      let result;
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') return;
        result = await ImagePicker.launchCameraAsync({ quality: 0.5, mediaTypes: ['images'] });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return;
        result = await ImagePicker.launchImageLibraryAsync({ quality: 0.5, mediaTypes: ['images'] });
      }
      if (!result.canceled && result.assets?.[0]?.uri) setPhotoUri(result.assets[0].uri);
    } catch {}
  };

  const drop = async () => {
    if (saving) return;
    setSaving(true);
    await addCheckin({ spotId: id, note, photoUri, verified: nearby === true });
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <View style={styles.grabber} />
        <Text style={styles.kicker}>CHECK IN</Text>
        <Text style={styles.title}>{spot.name}</Text>
        <View style={styles.metaRow}>
          <Ionicons name={cat.icon} size={14} color={cat.color} />
          <Text style={styles.meta}>{cat.label} · {spot.area}</Text>
        </View>

        {/* GPS verification state */}
        <View style={[styles.gps, nearby === true && styles.gpsOk]}>
          <Ionicons
            name={nearby === true ? 'checkmark-circle' : nearby === false ? 'walk' : 'time'}
            size={18}
            color={nearby === true ? '#4CAF6D' : colors.textOnDarkMuted}
          />
          <Text style={[styles.gpsTxt, nearby === true && { color: '#4CAF6D' }]}>
            {nearby === null
              ? 'Checking where you are…'
              : nearby
              ? "You're here — this check-in is verified"
              : "You're not nearby — it'll count, just unverified"}
          </Text>
        </View>

        {/* photo */}
        {photoUri ? (
          <View style={styles.polaroid}>
            <Image source={{ uri: photoUri }} style={styles.polaroidImg} />
            <View style={styles.polaroidRow}>
              <Pressable onPress={() => pick('camera')} hitSlop={8}>
                <Text style={styles.polaroidAction}>Retake</Text>
              </Pressable>
              <Pressable onPress={() => setPhotoUri(null)} hitSlop={8}>
                <Text style={[styles.polaroidAction, { color: colors.red }]}>Remove</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.photoRow}>
            <Pressable style={styles.photoBtn} onPress={() => pick('camera')}>
              <Ionicons name="camera" size={26} color={colors.textOnDark} />
              <Text style={styles.photoBtnTxt}>Snap a photo</Text>
            </Pressable>
            <Pressable style={styles.photoBtn} onPress={() => pick('library')}>
              <Ionicons name="images" size={26} color={colors.textOnDark} />
              <Text style={styles.photoBtnTxt}>From library</Text>
            </Pressable>
          </View>
        )}
        <Text style={styles.hint}>Photos hang on the map for your friends to find.</Text>

        {/* note */}
        <TextInput
          style={styles.note}
          value={note}
          onChangeText={(t) => setNote(t.slice(0, 120))}
          placeholder="Say something about it (optional)"
          placeholderTextColor={colors.textOnDarkFaint}
          multiline
        />

        <AddaButton
          label={saving ? 'Dropping…' : 'Drop it on the map'}
          onPress={drop}
          disabled={saving}
          icon={<Ionicons name="pin" size={18} color="#fff" />}
          style={{ marginTop: 24 }}
        />
        <AddaButton label="Cancel" variant="ghost" onPress={() => router.back()} style={{ marginTop: 6 }} />
        <View style={{ height: insets.bottom }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  center: { alignItems: 'center', justifyContent: 'center', gap: 16 },
  missing: { fontFamily: fonts.bold, fontSize: 18, color: colors.textOnDark },
  grabber: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: colors.ink3, marginBottom: 18 },

  kicker: { fontFamily: fonts.label, fontSize: 12, letterSpacing: 2.5, color: colors.red },
  title: { fontFamily: fonts.extrabold, fontSize: 28, color: colors.textOnDark, marginTop: 6, letterSpacing: -0.5 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  meta: { fontFamily: fonts.medium, fontSize: 13.5, color: colors.textOnDarkMuted },

  gps: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 20,
    backgroundColor: colors.ink2, borderRadius: radius.md, borderWidth: 1, borderColor: colors.hairline,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  gpsOk: { borderColor: 'rgba(76,175,109,0.45)' },
  gpsTxt: { flex: 1, fontFamily: fonts.semibold, fontSize: 13.5, color: colors.textOnDarkMuted },

  photoRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  photoBtn: {
    flex: 1, height: 110, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.ink2, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.hairline,
  },
  photoBtnTxt: { fontFamily: fonts.semibold, fontSize: 13, color: colors.textOnDarkMuted },
  hint: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.textOnDarkFaint, marginTop: 10 },

  polaroid: {
    marginTop: 20, alignSelf: 'center', backgroundColor: '#fff', borderRadius: 6,
    padding: 8, paddingBottom: 10, transform: [{ rotate: '-1.5deg' }],
    shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 8,
  },
  polaroidImg: { width: 240, height: 240, borderRadius: 3, backgroundColor: colors.ink3 },
  polaroidRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingHorizontal: 2 },
  polaroidAction: { fontFamily: fonts.bold, fontSize: 13, color: colors.textOnLight },

  note: {
    marginTop: 20, minHeight: 76, borderRadius: radius.md, backgroundColor: colors.ink2,
    borderWidth: 1, borderColor: colors.hairline, padding: 14, paddingTop: 12,
    fontFamily: fonts.medium, fontSize: 15, color: colors.textOnDark, textAlignVertical: 'top',
  },
});
