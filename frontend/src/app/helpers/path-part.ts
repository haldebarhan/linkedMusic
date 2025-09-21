export const pathPart = (u: string): string => {
  try {
    return new URL(u).pathname.toLowerCase();
  } catch {
    return (u || '').toLowerCase();
  } // fallback si URL relative
};

export const baseName = (u: string): string => {
  const p = pathPart(u);
  const i = p.lastIndexOf('/');
  return i >= 0 ? decodeURIComponent(p.slice(i + 1)) : decodeURIComponent(p);
};
