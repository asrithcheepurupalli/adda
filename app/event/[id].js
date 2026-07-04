import React from 'react';
import { Image, Linking, Platform, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AddaButton from '../../components/AddaButton';
import PixelAvatar from '../../components/PixelAvatar';
import { getEvent, getEventCategory } from '../../constants/events';
import { getPerson } from '../../constants/people';
import { photoForEvent } from '../../lib/photos';
import { useGoing } from '../../lib/eventStore';
import { colors, fonts, radius } from '../../constants/theme';

export default function EventDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isGoing, toggle } = useGoing();

  const event = getEvent(id);

  const share = () => {
    if (!event) return;
    try { Haptics.selectionAsync(); } catch {}
    Share.share({
      message: `${event.title} — ${event.day} ${event.time} at ${event.venue}, Vizag. I found it on Adda, the social map of Vizag.`,
    }).catch(() => {});
  };

  if (!event) {
    return (
      <View style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.title}>Event not found.</Text>
        <AddaButton label="Back" variant="secondary" onPress={() => router.back()} style={{ width: 200, marginTop: 16 }} />
      </View>
    );
  }

  const cat = getEventCategory(event.category);
  const going = isGoing(event.id);
  const goingCount = event.going + (going ? 1 : 0);
  const friends = event.friendsGoing.map(getPerson).filter(Boolean);

  const rsvp = () => {
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
    toggle(event.id);
  };

  const directions = () => {
    const url = Platform.select({
      ios: `http://maps.apple.com/?daddr=${event.lat},${event.lng}&q=${encodeURIComponent(event.venue)}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${event.lat},${event.lng}`,
    });
    Linking.openURL(url).catch(() => {});
  };

  const ride = async () => {
    const deep = `uber://?action=setPickup&dropoff[latitude]=${event.lat}&dropoff[longitude]=${event.lng}&dropoff[nickname]=${encodeURIComponent(event.venue)}`;
    const web = `https://m.uber.com/ul/?action=setPickup&dropoff[latitude]=${event.lat}&dropoff[longitude]=${event.lng}`;
    try {
      const ok = await Linking.canOpenURL(deep);
      Linking.openURL(ok ? deep : web);
    } catch { Linking.openURL(web).catch(() => {}); }
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: cat.color }]} />
          <Image source={{ uri: photoForEvent(event, 1000, 700) }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          <LinearGradient colors={['rgba(0,0,0,0.35)', 'rgba(0,0,0,0.05)', 'rgba(18,15,14,0.6)']} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
          <Pressable onPress={() => router.back()} style={[styles.back, { top: insets.top + 8 }]} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </Pressable>
          <View style={[styles.dayBadge, { top: insets.top + 10 }]}>
            <Ionicons name="time" size={13} color="#fff" />
            <Text style={styles.dayBadgeTxt}>{event.day} · {event.time}</Text>
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.cat}>{cat.label.toUpperCase()}</Text>
          <Text style={styles.title}>{event.title}</Text>

          <View style={styles.metaRow}>
            <Ionicons name="location" size={15} color={colors.textOnDarkMuted} />
            <Text style={styles.meta}>{event.venue} · {event.area}</Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="pricetag" size={14} color={colors.textOnDarkMuted} />
            <Text style={styles.meta}>{event.price}</Text>
            <Text style={styles.dot}>·</Text>
            <Ionicons name="person-circle" size={15} color={colors.textOnDarkMuted} />
            <Text style={styles.meta}>Hosted by {event.host}</Text>
          </View>

          <Text style={styles.blurb}>{event.blurb}</Text>

          <View style={styles.quick}>
            <QuickAction icon="navigate" label="Directions" onPress={directions} />
            <QuickAction icon="car-sport" label="Ride there" onPress={ride} highlight />
            <QuickAction icon="share-social" label="Share" onPress={share} />
          </View>

          <Text style={styles.section}>WHO'S GOING</Text>
          <View style={styles.goingBox}>
            <View style={{ flexDirection: 'row' }}>
              {friends.slice(0, 5).map((p, i) => (
                <Pressable key={p.id} onPress={() => router.push(`/person/${p.id}`)} style={{ marginLeft: i === 0 ? 0 : -12 }}>
                  <PixelAvatar seed={p.id} size={40} tint={p.tint} />
                </Pressable>
              ))}
            </View>
            <Text style={styles.goingTxt}>
              {friends.length > 0 ? `${friends.map((p) => p.name).slice(0, 2).join(', ')} and ${goingCount - Math.min(2, friends.length)} others` : `${goingCount} going`}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.rsvpBar, { paddingBottom: insets.bottom + 14 }]}>
        <AddaButton
          label={going ? "You're going" : "I'm going"}
          variant={going ? 'secondary' : 'primary'}
          onPress={rsvp}
          icon={<Ionicons name={going ? 'checkmark-circle' : 'add-circle'} size={18} color={going ? colors.textOnDark : '#fff'} />}
        />
      </View>
    </View>
  );
}

function QuickAction({ icon, label, onPress, highlight }) {
  return (
    <Pressable style={styles.qa} onPress={onPress}>
      <View style={[styles.qaIcon, highlight && { backgroundColor: colors.red, borderColor: colors.red }]}>
        <Ionicons name={icon} size={20} color={highlight ? '#fff' : colors.textOnDark} />
      </View>
      <Text style={styles.qaLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  hero: { height: 240, alignItems: 'center', justifyContent: 'center' },
  back: { position: 'absolute', left: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.28)', alignItems: 'center', justifyContent: 'center' },
  dayBadge: { position: 'absolute', right: 16, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.35)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.pill },
  dayBadgeTxt: { fontFamily: fonts.label, fontSize: 11, letterSpacing: 1, color: '#fff' },

  body: { padding: 20, marginTop: -20, backgroundColor: colors.ink, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  cat: { fontFamily: fonts.label, fontSize: 12, letterSpacing: 2.5, color: colors.red },
  title: { fontFamily: fonts.extrabold, fontSize: 28, color: colors.textOnDark, marginTop: 6, letterSpacing: -0.6, lineHeight: 34 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, flexWrap: 'wrap' },
  meta: { fontFamily: fonts.medium, fontSize: 14, color: colors.textOnDarkMuted },
  dot: { color: colors.textOnDarkFaint, marginHorizontal: 2 },
  blurb: { fontFamily: fonts.regular, fontSize: 15.5, lineHeight: 24, color: colors.textOnDark, marginTop: 16 },

  quick: { flexDirection: 'row', gap: 12, marginTop: 22 },
  qa: { flex: 1, alignItems: 'center', gap: 8 },
  qaIcon: { width: '100%', height: 56, borderRadius: radius.md, backgroundColor: colors.ink2, borderWidth: 1, borderColor: colors.hairline, alignItems: 'center', justifyContent: 'center' },
  qaLabel: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.textOnDarkMuted },

  section: { fontFamily: fonts.label, fontSize: 12, letterSpacing: 2.5, color: colors.red, marginTop: 30, marginBottom: 14 },
  goingBox: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.ink2, borderRadius: radius.md, borderWidth: 1, borderColor: colors.hairline, padding: 14 },
  gAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.ink2 },
  gAvatarTxt: { color: '#fff', fontFamily: fonts.bold, fontSize: 16 },
  goingTxt: { flex: 1, fontFamily: fonts.semibold, fontSize: 13.5, color: colors.textOnDark },

  rsvpBar: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 14, backgroundColor: colors.ink, borderTopWidth: 1, borderTopColor: colors.hairline },
});
