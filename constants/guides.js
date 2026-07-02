import { colors } from './theme';

// Curated guides — each references real spot ids from constants/spots.js.
export const GUIDES = [
  {
    id: 'sunset-vizag',
    title: 'Sunset in Vizag',
    blurb: 'Where the city goes when the light turns gold. Pick one, get there by 5:30, thank us later.',
    icon: 'sunny',
    color: '#E5A020',
    curator: 'Adda',
    spots: ['rk-beach', 'kailasagiri', 'tenneti-park', 'yarada-beach', 'erra-matti-dibbalu', 'dolphins-nose'],
  },
  {
    id: 'andhra-thali',
    title: 'Best Andhra thali',
    blurb: 'Banana leaves, gongura, ghee podi and no mercy. The definitive meals crawl of the city.',
    icon: 'restaurant',
    color: colors.red,
    curator: 'Meghana',
    spots: ['dharani-daspalla', 'venkatadri-vantillu', 'sairam-parlour', 'raju-gari-dhaba', 'kunda-biryani', 'mehfil', 'new-andhra-hotel', 'spicy-venue'],
  },
  {
    id: 'quiet-cafes',
    title: 'Quiet cafes to work',
    blurb: 'Reliable Wi-Fi, sockets you can actually reach, and coffee that keeps its promises.',
    icon: 'cafe',
    color: '#2E9E6B',
    curator: 'Aisha',
    spots: ['baes-coffee', 'pcc', 'araku-coffee', 'makobrew', 'coffee-cup'],
  },
  {
    id: 'first-date',
    title: 'A perfect first date',
    blurb: 'Low pressure, good light, easy exits. Everything you need for a first impression.',
    icon: 'heart',
    color: '#7A3FB0',
    curator: 'Adda',
    spots: ['tenneti-park', 'pcc', 'beach-road-carts', 'skyy-bar', 'vuda-park', 'cream-stone', 'lawsons-bay'],
  },
];

export const getGuide = (id) => GUIDES.find((g) => g.id === id);
