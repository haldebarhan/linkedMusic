export const pathPart = (u: string): string => {
  try {
    return new URL(u).pathname.toLowerCase();
  } catch {
    return (u || '').toLowerCase();
  } // fallback si URL relative
};

export const baseName = (u: string): string => {
  const p = pathnameOf(u);
  const i = p.lastIndexOf('/');
  return decodeURIComponent(i >= 0 ? p.slice(i + 1) : p);
};

export const pathname = (u: string) => {
  try {
    return new URL(u).pathname.toLowerCase();
  } catch {
    return String(u || '').toLowerCase();
  }
};

export const guessMime = (u: string): string | undefined => {
  const p = pathname(u);
  if (/\.(png|jpe?g|gif|webp|svg)$/.test(p)) return 'image/*';
  if (/\.(mp3|m4a|aac|wav|ogg|flac)$/.test(p)) return 'audio/*';
  if (/\.(mp4|webm|mov|mkv)$/.test(p)) return 'video/*';
  return undefined;
};

export const guessKind = (u: string): 'image' | 'audio' | 'video' | 'other' => {
  const p = pathname(u);
  if (/\.(png|jpe?g|gif|webp|svg)$/.test(p)) return 'image';
  if (/\.(mp3|m4a|aac|wav|ogg|flac)$/.test(p)) return 'audio';
  if (/\.(mp4|webm|mov|mkv)$/.test(p)) return 'video';
  return 'other';
};

export const kindFromMimeOrName = (
  mime?: string,
  name?: string
): 'image' | 'audio' | 'video' | 'other' => {
  const m = (mime || '').toLowerCase();
  if (m.startsWith('image/')) return 'image';
  if (m.startsWith('audio/')) return 'audio';
  if (m.startsWith('video/')) return 'video';
  return guessKind(name || '');
};

export const pathnameOf = (u: string): string => {
  try {
    return new URL(u).pathname;
  } catch {
    return u || '';
  }
};

export const stableIdFromUrl = (u: string): string => {
  const p = pathnameOf(u).replace(/^\/+/, ''); // enlève le(s) "/" de début
  const parts = p.split('/').filter(Boolean);
  if (parts.length >= 2) {
    // Heuristique: on enlève le premier segment (souvent le bucket)
    return decodeURIComponent(parts.slice(1).join('/'));
  }
  return baseName(u);
};
