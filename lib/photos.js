// Topical real photos via Unsplash (verified stable ids, keyword-matched per category).
// Keeps the app self-contained (no API key); curated photography comes with seeding.

const SPOT_PHOTOS = {
  beach: ['1507525428034-b723cf961d3e', '1505228395891-9a51e7e86bf6', '1519046904884-53103b34b206', '1471922694854-ff1b63b20054'],
  cafe: ['1495474472287-4d71bcdd2085', '1509042239860-f550ce710b93', '1442512595331-e89e73853f31'],
  food: ['1585937421612-70a008356fbe', '1631452180519-c014fe946bc7', '1567188040759-fb8a883dc6d8'],
  bar: ['1514362545857-3bc16c4c7d1b', '1470337458703-46ad1756a187', '1551024709-8f23befc6f87'],
  view: ['1501785888041-af3ef285b470', '1470071459604-3b5ec3a7fe05', '1464822759023-fed622ff2c3b'],
  park: ['1441974231531-c6227db76b6e', '1518495973542-4542c06a5843'],
  culture: ['1518998053901-5348d3961a04', '1470229538611-16ba8c7ffbd7'],
};

const EVENT_PHOTOS = {
  music: ['1470229722913-7c0e2dbbafd3', '1501386761578-eac5c94b800a'],
  food: ['1555939594-58d7cb561ad1', '1533777324565-a040eb52facd'],
  nightlife: ['1514362545857-3bc16c4c7d1b', '1470337458703-46ad1756a187'],
  sport: ['1502680390469-be75c86b636f', '1552674605-db6ffd4facb5'],
  market: ['1488459716781-31db52582fe9', '1524594152303-9fd13543fe6e'],
  art: ['1516450360452-9312f5e86fc7', '1470229538611-16ba8c7ffbd7'],
  community: ['1559027615-cd4628902d4a', '1593113598332-cd288d649433'],
};

const FALLBACK = '1507525428034-b723cf961d3e';

function hash(id = '') {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 100000;
  return h;
}

function url(photoId, w, h) {
  return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=${w}&h=${h}&q=70`;
}

function pick(arr, id) {
  if (!arr || !arr.length) return FALLBACK;
  return arr[hash(id) % arr.length];
}

export function photoForSpot(spot, w = 800, h = 600) {
  return url(pick(SPOT_PHOTOS[spot.category], spot.id), w, h);
}

export function photoForEvent(event, w = 800, h = 600) {
  return url(pick(EVENT_PHOTOS[event.category], event.id), w, h);
}
