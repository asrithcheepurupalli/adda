// Mock Vizag tastemakers — the seeded social graph.
// Each person recommends real spots (ties into constants/spots.js ids).

export const PEOPLE = [
  {
    id: 'priya', username: 'priya', name: 'Priya', tint: '#C0202E', followers: 312,
    bio: 'Beach walker, biryani believer.',
    recos: [
      { spot: 'rk-beach', score: 9.4, quote: 'Sunset here never gets old' },
      { spot: 'daspalla', score: 9.0, quote: 'Andhra thali, come hungry' },
      { spot: 'beach-road-grill', score: 8.8, quote: 'Coal-grilled prawns, trust me' },
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
      { spot: 'sea-breeze', score: 8.9, quote: 'Best filter coffee in town' },
      { spot: 'araku-coffee', score: 8.7, quote: 'Cold brew is dangerous' },
      { spot: 'tenneti-park', score: 8.3, quote: 'Quiet in the mornings' },
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
      { spot: 'daspalla', score: 9.2, quote: 'Gongura mutton, always' },
      { spot: 'beach-road-grill', score: 8.9, quote: 'Book a sunset table' },
      { spot: 'sea-breeze', score: 8.4, quote: 'Great for a catch-up' },
    ],
  },
  {
    id: 'dev', username: 'dev', name: 'Dev', tint: '#7A3FB0', followers: 189,
    bio: 'Rooftops and last calls.',
    recos: [
      { spot: 'the-terrace-bar', score: 8.8, quote: 'Rooftop cocktails, harbour view' },
      { spot: 'beach-road-grill', score: 8.5, quote: 'Best on a Friday' },
      { spot: 'araku-coffee', score: 8.0, quote: 'Solid espresso martini' },
    ],
  },
  {
    id: 'sana', username: 'sana', name: 'Sana', tint: '#8A57C0', followers: 273,
    bio: 'Weekday explorer, crowd avoider.',
    recos: [
      { spot: 'kailasagiri', score: 8.7, quote: 'Go on a weekday' },
      { spot: 'rushikonda', score: 8.5, quote: 'Surf lessons in the morning' },
      { spot: 'submarine-museum', score: 8.1, quote: 'Weirdly moving' },
    ],
  },
  {
    id: 'ravi', username: 'ravi', name: 'Ravi', tint: '#3B7DD8', followers: 340,
    bio: 'Vizag local, old reliable picks.',
    recos: [
      { spot: 'rk-beach', score: 9.0, quote: 'Been coming here for years' },
      { spot: 'daspalla', score: 8.7, quote: 'Old reliable' },
      { spot: 'submarine-museum', score: 8.3, quote: 'Great for the kids' },
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
