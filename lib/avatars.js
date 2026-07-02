// Deterministic pixel-art character avatars (DiceBear pixel-art).
// Same seed always yields the same little character.
export function pixelAvatar(seed, size = 160) {
  const s = encodeURIComponent(String(seed == null ? 'adda' : seed));
  return `https://api.dicebear.com/9.x/pixel-art/png?seed=${s}&size=${size}`;
}
