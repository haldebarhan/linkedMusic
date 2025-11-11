export const isPresent = <T>(v: T | undefined | null): v is T =>
  v !== undefined && v !== null;
export const definedEntries = (obj: Record<string, any>) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

export const mergeFileList = (
  existing: readonly string[] = [],
  incoming: readonly string[] = [],
  toRemove: readonly string[] = []
) => {
  const remove = new Set(toRemove ?? []);
  const keepExisting = existing.filter((f) => !remove.has(f));
  const existingSet = new Set(keepExisting);
  const add = (incoming ?? []).filter((f) => f && !existingSet.has(f));
  return [...keepExisting, ...add];
};
