import { colors } from '../constants/theme';

// Earned badges — each unlocks from real usage. Order = display order.
const BADGES = [
  {
    id: 'first-adda',
    label: 'First Adda',
    desc: 'Rank your first spot',
    icon: 'trophy',
    color: colors.red,
    earned: (s) => s.rankedCount >= 1,
  },
  {
    id: 'taste-maker',
    label: 'Taste Maker',
    desc: 'Rank 5 spots',
    icon: 'star',
    color: '#E5A020',
    earned: (s) => s.rankedCount >= 5,
  },
  {
    id: 'city-critic',
    label: 'City Critic',
    desc: 'Rank 15 spots',
    icon: 'ribbon',
    color: '#C06A2E',
    earned: (s) => s.rankedCount >= 15,
  },
  {
    id: 'collector',
    label: 'Collector',
    desc: 'Save 5 spots',
    icon: 'heart',
    color: '#B3474E',
    earned: (s) => s.savedCount >= 5,
  },
  {
    id: 'pioneer',
    label: 'Pioneer',
    desc: 'Put a new spot on the map',
    icon: 'flag',
    color: '#2E9E6B',
    earned: (s) => s.userSpotCount >= 1,
  },
  {
    id: 'squad',
    label: 'Squad',
    desc: 'Follow 3 friends',
    icon: 'people',
    color: '#2E7DD8',
    earned: (s) => s.followCount >= 3,
  },
  {
    id: 'plan-maker',
    label: 'Plan Maker',
    desc: 'RSVP to 2 events',
    icon: 'sparkles',
    color: '#7A3FB0',
    earned: (s) => s.goingCount >= 2,
  },
  {
    id: 'regular',
    label: 'Regular',
    desc: '3-day streak',
    icon: 'flame',
    color: '#D9313F',
    earned: (s) => s.bestStreak >= 3,
  },
  {
    id: 'street-legend',
    label: 'Street Legend',
    desc: '7-day streak',
    icon: 'bonfire',
    color: '#8A1C24',
    earned: (s) => s.bestStreak >= 7,
  },
];

export function computeBadges(stats) {
  return BADGES.map((b) => ({ ...b, earned: b.earned(stats) }));
}
