import { colors } from './theme';

export const EVENT_CATEGORIES = {
  music: { key: 'music', label: 'Music', color: '#BC2130', icon: 'musical-notes' },
  food: { key: 'food', label: 'Food', color: '#E5A020', icon: 'fast-food' },
  nightlife: { key: 'nightlife', label: 'Nightlife', color: '#7A3FB0', icon: 'wine' },
  sport: { key: 'sport', label: 'Active', color: '#1F9BC4', icon: 'bicycle' },
  market: { key: 'market', label: 'Markets', color: '#2E9E6B', icon: 'basket' },
  art: { key: 'art', label: 'Arts', color: '#C06A2E', icon: 'color-palette' },
  community: { key: 'community', label: 'Community', color: '#3B7DD8', icon: 'people-circle' },
};

export const EVENT_CATEGORY_LIST = Object.values(EVENT_CATEGORIES);

// group order for sectioning the feed
export const GROUPS = ['Today', 'Tomorrow', 'This weekend', 'Next week'];

export const EVENTS = [
  {
    id: 'sunset-beats',
    title: 'Sunset Beats on the Sand',
    category: 'music',
    venue: 'RK Beach', area: 'Beach Road', lat: 17.7108, lng: 83.3247,
    group: 'Today', sort: 1, day: 'Today', time: '6:00 PM',
    price: 'Free', host: 'Vizag Sounds',
    blurb: 'Golden hour DJ sets right on the sand. Bring a mat, grab a chai, watch the sky do its thing.',
    going: 214, friendsGoing: ['arjun', 'dev'],
  },
  {
    id: 'street-food-carnival',
    title: 'Vizag Street Food Carnival',
    category: 'food',
    venue: 'Beach Road Grounds', area: 'Beach Road', lat: 17.7148, lng: 83.3210,
    group: 'Today', sort: 2, day: 'Today', time: '5:00 PM',
    price: '₹', host: 'Coastal Eats Collective',
    blurb: 'Forty stalls, one long evening. Andhra classics, coastal seafood, and far too much dessert.',
    going: 512, friendsGoing: ['priya', 'meghana', 'ravi'],
  },
  {
    id: 'full-moon-kayak',
    title: 'Full Moon Kayaking',
    category: 'sport',
    venue: 'Bheemili Creek', area: 'Bheemili', lat: 17.8899, lng: 83.4519,
    group: 'Tomorrow', sort: 3, day: 'Tomorrow', time: '7:00 PM',
    price: '₹₹', host: 'East Coast Paddlers',
    blurb: 'Paddle out under a full moon where the river meets the sea. Beginners welcome, gear provided.',
    going: 38, friendsGoing: ['karthik'],
  },
  {
    id: 'open-mic-hill',
    title: 'Open Mic on the Hill',
    category: 'art',
    venue: 'Kailasagiri', area: 'Hilltop', lat: 17.7496, lng: 83.3437,
    group: 'Tomorrow', sort: 4, day: 'Tomorrow', time: '6:30 PM',
    price: 'Free', host: 'Vizag Verse',
    blurb: 'Poetry, acoustic sets and stand-up with the whole coastline behind the stage. Sign up to perform.',
    going: 96, friendsGoing: ['aisha', 'sana'],
  },
  {
    id: 'surf-meetup',
    title: 'Rushikonda Surf Meetup',
    category: 'sport',
    venue: 'Rushikonda Beach', area: 'Rushikonda', lat: 17.7826, lng: 83.3852,
    group: 'This weekend', sort: 5, day: 'Sat', time: '6:00 AM',
    price: 'Free', host: 'Rushikonda Surf Club',
    blurb: 'Dawn patrol with the local crew. Boards to borrow, coffee after, all levels in the water.',
    going: 74, friendsGoing: ['karthik', 'arjun'],
  },
  {
    id: 'craft-beer-fest',
    title: 'Coastal Craft Beer Fest',
    category: 'nightlife',
    venue: 'The Terrace', area: 'Siripuram', lat: 17.7260, lng: 83.3145,
    group: 'This weekend', sort: 6, day: 'Sat', time: '4:00 PM',
    price: '₹₹', host: 'The Terrace',
    blurb: 'Regional brewers take over the rooftop. Tasting flights, live band, harbour lights.',
    going: 168, friendsGoing: ['dev', 'meghana'],
  },
  {
    id: 'farmers-market',
    title: 'Sunday Farmers Market',
    category: 'market',
    venue: 'Siripuram Grounds', area: 'Siripuram', lat: 17.7230, lng: 83.3160,
    group: 'This weekend', sort: 7, day: 'Sun', time: '8:00 AM',
    price: 'Free', host: 'Vizag Grows',
    blurb: 'Araku coffee, hill produce, handmade everything. Come early for the good sourdough.',
    going: 143, friendsGoing: ['aisha', 'priya'],
  },
  {
    id: 'coastal-cleanup',
    title: 'Coastal Cleanup Drive',
    category: 'community',
    venue: 'Tenneti Park', area: 'Beach Road', lat: 17.7315, lng: 83.3396,
    group: 'Next week', sort: 8, day: 'Next Sat', time: '7:00 AM',
    price: 'Free', host: 'Clean Vizag',
    blurb: 'An hour of good work for our coastline, then breakfast on us. Gloves and bags sorted.',
    going: 89, friendsGoing: ['sana', 'ravi'],
  },
];

export const getEvent = (id) => EVENTS.find((e) => e.id === id);
export const getEventCategory = (key) => EVENT_CATEGORIES[key] || EVENT_CATEGORIES.music;
