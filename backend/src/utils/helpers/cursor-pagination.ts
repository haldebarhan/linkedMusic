/**
 * Turns a `limit + 1` keyset query into a stable cursor response.
 * All current paginated models have an indexed, auto-incremented `id`.
 */
export function cursorPage<T extends { id: number }>(rows: T[], limit: number) {
  const hasNext = rows.length > limit;
  const data = hasNext ? rows.slice(0, limit) : rows;
  const last = data.at(-1);

  return {
    data,
    metadata: {
      limit,
      hasNext,
      nextCursor: hasNext && last ? last.id : null,
    },
  };
}

export function parseCursor(value: unknown): number | undefined {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return undefined;
  const cursor = Number(value);
  return Number.isSafeInteger(cursor) && cursor > 0 ? cursor : undefined;
}
