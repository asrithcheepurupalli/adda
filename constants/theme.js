// Adda brand system — street-premium.
// Dark base, maroon-red accent, warm cream. Matches the team brief cover.

export const colors = {
  // brand
  red: '#BC2130',
  redBright: '#D9313F',
  maroon: '#8A1C24',

  // dark surfaces (street)
  ink: '#120F0E',
  ink2: '#1B1615',
  ink3: '#241E1C',
  hairline: 'rgba(255,255,255,0.10)',

  // warm neutrals
  cream: '#FBF6EE',
  cream2: '#F3EADC',
  sand: '#E4D9C7',

  // text on dark
  textOnDark: '#F6EFE4',
  textOnDarkMuted: '#B7ABA0',
  textOnDarkFaint: '#8C8178',

  // text on light
  textOnLight: '#1C1815',
  textOnLightMuted: '#6B6259',

  white: '#FFFFFF',
  black: '#000000',
};

export const fonts = {
  // display / street wordmark
  display: 'Anton',
  // labels, buttons, eyebrows
  label: 'Oswald_600SemiBold',
  labelMed: 'Oswald_500Medium',
  labelBold: 'Oswald_700Bold',
  // body / UI
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
};

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
};

export const spacing = (n) => n * 4;

// storage keys
export const STORAGE = {
  onboarded: 'adda.onboarded.v1',
  username: 'adda.username.v1',
  locationAsked: 'adda.locationAsked.v1',
};
