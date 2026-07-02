import { colors } from './theme';

// Category system — each has a colour + icon used for pins, chips and detail.
export const CATEGORIES = {
  food:    { key: 'food',    label: 'Food',    color: colors.red,   icon: 'restaurant' },
  cafe:    { key: 'cafe',    label: 'Cafes',   color: '#E5A020',    icon: 'cafe' },
  bar:     { key: 'bar',     label: 'Bars',    color: '#7A3FB0',    icon: 'wine' },
  beach:   { key: 'beach',   label: 'Beaches', color: '#1F9BC4',    icon: 'sunny' },
  view:    { key: 'view',    label: 'Views',   color: '#2E7DD8',    icon: 'telescope' },
  park:    { key: 'park',    label: 'Parks',   color: '#2E9E6B',    icon: 'leaf' },
  culture: { key: 'culture', label: 'Culture', color: '#C06A2E',    icon: 'business' },
};

export const CATEGORY_LIST = Object.values(CATEGORIES);

// Vizag (Visakhapatnam) region — real, well-known spots with plausible coords.
// score is the Adda ranked score (out of 10). `friend` = a hanging review card.
export const SPOTS = [
  {
    id: 'rk-beach',
    name: 'RK Beach',
    category: 'beach',
    lat: 17.7108, lng: 83.3247,
    score: 9.2, price: 'Free',
    area: 'Beach Road',
    blurb: 'The heart of the city by the sea. Morning walks, evening chaat carts, and the best people watching in Vizag.',
    friend: { name: 'Priya', tint: '#C0202E', quote: 'Sunset here never gets old' },
  },
  {
    id: 'kailasagiri',
    name: 'Kailasagiri',
    category: 'view',
    lat: 17.7496, lng: 83.3437,
    score: 8.9, price: '₹',
    area: 'Hilltop',
    blurb: 'Hilltop park with a ropeway and the widest view of the coastline. Go up for sunset, stay for the breeze.',
    friend: { name: 'Arjun', tint: '#2E7DD8', quote: 'Take the ropeway, worth it' },
  },
  {
    id: 'sea-breeze',
    name: 'Sea Breeze Cafe',
    category: 'cafe',
    lat: 17.7192, lng: 83.3320,
    score: 8.7, price: '₹₹',
    area: 'Siripuram',
    blurb: 'Quiet corner cafe with strong filter coffee and a balcony that catches the sea air. A local writing spot.',
    friend: { name: 'Aisha', tint: '#E5A020', quote: 'Best filter coffee in town' },
  },
  {
    id: 'tenneti-park',
    name: 'Tenneti Park',
    category: 'park',
    lat: 17.7315, lng: 83.3396,
    score: 8.4, price: 'Free',
    area: 'Beach Road',
    blurb: 'Cliffside green with the waves crashing right below. Cleanest sunset seat on the whole stretch.',
  },
  {
    id: 'rushikonda',
    name: 'Rushikonda Beach',
    category: 'beach',
    lat: 17.7826, lng: 83.3852,
    score: 8.8, price: 'Free',
    area: 'Rushikonda',
    blurb: 'Golden sand and the cleanest water near the city. Surf lessons in the morning, bonfires by night.',
    friend: { name: 'Karthik', tint: '#1F9BC4', quote: 'Go early, less crowd' },
  },
  {
    id: 'dolphins-nose',
    name: "Dolphin's Nose",
    category: 'view',
    photoKw: 'lighthouse,cliff',
    lat: 17.6868, lng: 83.2820,
    score: 8.1, price: 'Free',
    area: 'Yarada',
    blurb: 'Dramatic headland shaped like a dolphin. The lighthouse view over the harbour is unreal at dusk.',
  },
  {
    id: 'daspalla',
    name: 'Daspalla Diner',
    category: 'food',
    lat: 17.7205, lng: 83.3018,
    score: 8.6, price: '₹₹',
    area: 'Suryabagh',
    blurb: 'Old-school Andhra thali done right. Come hungry, leave defeated. The gongura mutton is the move.',
    friend: { name: 'Meghana', tint: '#C0202E', quote: 'Andhra thali, come hungry' },
  },
  {
    id: 'beach-road-grill',
    name: 'Beach Road Grill',
    category: 'food',
    lat: 17.7148, lng: 83.3210,
    score: 8.9, price: '₹₹₹',
    area: 'Beach Road',
    blurb: 'Seafood off the boats, grilled over coal, eaten with your feet almost in the sand. Book a sunset table.',
  },
  {
    id: 'submarine-museum',
    name: 'Submarine Museum',
    category: 'culture',
    photoKw: 'submarine,navy',
    lat: 17.7169, lng: 83.3230,
    score: 8.0, price: '₹',
    area: 'Beach Road',
    blurb: 'A real decommissioned submarine you can walk through. Weirdly moving, especially for kids.',
  },
  {
    id: 'the-terrace-bar',
    name: 'The Terrace',
    category: 'bar',
    lat: 17.7260, lng: 83.3145,
    score: 8.3, price: '₹₹₹',
    area: 'Siripuram',
    blurb: 'Rooftop cocktails with the harbour lights below. Loud on weekends, perfect on a Tuesday.',
    friend: { name: 'Dev', tint: '#7A3FB0', quote: 'Rooftop cocktails, harbour view' },
  },
  {
    id: 'araku-coffee',
    name: 'Araku Coffee House',
    category: 'cafe',
    lat: 17.7301, lng: 83.3062,
    score: 8.5, price: '₹₹',
    area: 'Dwaraka Nagar',
    blurb: 'Single-origin coffee from the Araku valley, roasted in house. The cold brew is dangerously good.',
  },
  {
    id: 'bheemili',
    name: 'Bheemili Beach',
    category: 'beach',
    lat: 17.8899, lng: 83.4519,
    score: 8.2, price: 'Free',
    area: 'Bheemili',
    blurb: 'Old Dutch town where the river meets the sea. Quiet, historic, and worth the drive up the coast.',
  },
];

export const getSpot = (id) => SPOTS.find((s) => s.id === id);
export const getCategory = (key) => CATEGORIES[key] || CATEGORIES.food;
