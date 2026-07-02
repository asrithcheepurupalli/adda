// Mock Vizag tastemakers — the seeded social graph.
// Each person recommends real spots (ties into constants/spots.js ids).

export const PEOPLE = [
  {
    id: 'priya', username: 'priya', name: 'Priya', tint: '#C0202E', followers: 312,
    bio: 'Beach walker, biryani believer.',
    recos: [
      { spot: 'rk-beach', score: 9.4, quote: 'Sunset here never gets old' },
      { spot: 'sairam-parlour', score: 9.0, quote: 'Mysore bajji before 9am' },
      { spot: 'dharani-daspalla', score: 8.8, quote: 'Andhra thali, come hungry' },
    ],
  },
  {
    id: 'arjun', username: 'arjun', name: 'Arjun', tint: '#2E7DD8', followers: 204,
    bio: 'Chasing viewpoints and long drives.',
    recos: [
      { spot: 'kailasagiri', score: 9.1, quote: 'Take the ropeway, worth it' },
      { spot: 'tenneti-park', score: 8.6, quote: 'Cleanest sunset seat' },
      { spot: 'dolphins-nose', score: 8.4, quote: 'Lighthouse view at dusk' },
    ],
  },
  {
    id: 'aisha', username: 'aisha', name: 'Aisha', tint: '#E5A020', followers: 428,
    bio: 'Cafes, books, cold brew.',
    recos: [
      { spot: 'baes-coffee', score: 8.9, quote: 'Best filter coffee in town' },
      { spot: 'araku-coffee', score: 8.7, quote: 'Cold brew is dangerous' },
      { spot: 'beach-road-carts', score: 8.3, quote: 'Punugulu + sunset = therapy' },
    ],
  },
  {
    id: 'karthik', username: 'karthik', name: 'Karthik', tint: '#1F9BC4', followers: 156,
    bio: 'Surf, sand, sunrise.',
    recos: [
      { spot: 'rushikonda', score: 9.0, quote: 'Go early, less crowd' },
      { spot: 'rk-beach', score: 8.6, quote: 'Best morning jog spot' },
      { spot: 'bheemili', score: 8.2, quote: 'Worth the drive up' },
    ],
  },
  {
    id: 'meghana', username: 'meghana', name: 'Meghana', tint: '#B3474E', followers: 501,
    bio: 'Will find the best food anywhere.',
    recos: [
      { spot: 'dharani-daspalla', score: 9.2, quote: 'Gongura mutton, always' },
      { spot: 'simhachalam', score: 8.9, quote: 'Go at dawn, it\'s serene' },
      { spot: 'raju-gari-dhaba', score: 8.4, quote: 'Worth the drive north' },
    ],
  },
  {
    id: 'dev', username: 'dev', name: 'Dev', tint: '#7A3FB0', followers: 189,
    bio: 'Rooftops and last calls.',
    recos: [
      { spot: 'skyy-bar', score: 8.8, quote: 'Rooftop cocktails, harbour view' },
      { spot: 'raju-gari-dhaba', score: 8.5, quote: 'Ulavacharu biryani. That\'s it.' },
      { spot: 'tds', score: 8.0, quote: 'Old faithful, never misses' },
    ],
  },
  {
    id: 'sana', username: 'sana', name: 'Sana', tint: '#8A57C0', followers: 273,
    bio: 'Weekday explorer, crowd avoider.',
    recos: [
      { spot: 'erra-matti-dibbalu', score: 8.7, quote: 'Golden hour, thank me later' },
      { spot: 'kailasagiri', score: 8.5, quote: 'Go on a weekday' },
      { spot: 'submarine-museum', score: 8.1, quote: 'Weirdly moving' },
    ],
  },
  {
    id: 'ravi', username: 'ravi', name: 'Ravi', tint: '#3B7DD8', followers: 340,
    bio: 'Vizag local, old reliable picks.',
    recos: [
      { spot: 'rk-beach', score: 9.0, quote: 'Been coming here for years' },
      { spot: 'kambalakonda', score: 8.7, quote: 'Best morning trek in town' },
      { spot: 'dharani-daspalla', score: 8.3, quote: 'Old reliable' },
    ],
  },
];

export const getPerson = (id) => PEOPLE.find((p) => p.id === id);

// Everyone who recommends a given spot, with their reco.
export function peopleWhoRecommend(spotId) {
  const out = [];
  for (const p of PEOPLE) {
    const reco = p.recos.find((r) => r.spot === spotId);
    if (reco) out.push({ person: p, reco });
  }
  return out.sort((a, b) => b.reco.score - a.reco.score);
}
