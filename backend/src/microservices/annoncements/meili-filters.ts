/** Construit un filter Meili à partir d’un objet de filtres + la catégorie */
export function buildMeiliFilter(
  categorySlug: string,
  filters: Record<string, any>
): string {
  const clauses: string[] = [`category = ${quote(categorySlug)}`];

  for (const [k, raw] of Object.entries(filters)) {
    if (raw == null || raw === "" || (Array.isArray(raw) && raw.length === 0))
      continue;

    // Cas classiques min/max (ex: priceMin/priceMax)
    if (k.endsWith("Min")) {
      const base = k.slice(0, -3);
      const n = Number(raw);
      if (!Number.isNaN(n)) clauses.push(`${base} >= ${n}`);
      continue;
    }
    if (k.endsWith("Max")) {
      const base = k.slice(0, -3);
      const n = Number(raw);
      if (!Number.isNaN(n)) clauses.push(`${base} <= ${n}`);
      continue;
    }

    // Booléens
    if (isBoolish(raw)) {
      clauses.push(`${k} = ${toBool(raw) ? "true" : "false"}`);
      continue;
    }

    // Arrays -> OR
    if (Array.isArray(raw)) {
      const or = raw
        .filter((v) => v !== null && v !== undefined && v !== "")
        .map((v) => `${k} = ${quote(v)}`);
      if (or.length) clauses.push(`(${or.join(" OR ")})`);
      continue;
    }

    // Fallback égalité
    clauses.push(`${k} = ${quote(raw)}`);
  }

  return clauses.join(" AND ");
}

function isBoolish(v: any) {
  return [true, false, "true", "false", "1", "0", 1, 0, "on", "off"].includes(
    v
  );
}
function toBool(v: any) {
  return v === true || v === 1 || v === "1" || v === "true" || v === "on";
}
function quote(v: any) {
  return typeof v === "number"
    ? String(v)
    : `"${String(v).replace(/"/g, '\\"')}"`;
}
