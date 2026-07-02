import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, STORAGE } from '../constants/theme';

// Entry gate: send onboarded users to home, everyone else to onboarding.
export default function Index() {
  const [route, setRoute] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const done = await AsyncStorage.getItem(STORAGE.onboarded);
        setRoute(done === 'true' ? '/map' : '/onboarding');
      } catch {
        setRoute('/onboarding');
      }
    })();
  }, []);

  if (!route) return <View style={{ flex: 1, backgroundColor: colors.ink }} />;
  return <Redirect href={route} />;
}
