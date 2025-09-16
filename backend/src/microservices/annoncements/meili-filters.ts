const esc = (s: string) => String(s).replace(/"/g, '\\"');

export function buildMeiliFilter(
  categorySlug: string,
  f: {
    styles?: string[];
    location?: string;
    serviceTypeId?: number | string;
    status?: string;
    tag?: string;
    serviceType?: string;
  } = {}
) {
  const parts: string[] = [];

  parts.push(`category = "${esc(categorySlug)}"`);
  parts.push("status = PENDING_APPROVAL");

  // Styles (array string) -> OR entre les valeurs
  if (Array.isArray(f.styles) && f.styles.length) {
    const or = f.styles
      .filter((s) => s !== null && s !== undefined && String(s).trim() !== "")
      .map((s) => `styles = "${esc(String(s))}"`);
    if (or.length === 1) parts.push(or[0]);
    else if (or.length > 1) parts.push(`(${or.join(" OR ")})`);
  }

  // Localisation (string)
  if (f.location && String(f.location).trim() !== "") {
    parts.push(`location = "${esc(String(f.location))}"`);
  }

  // Service type (number)
  if (
    f.serviceTypeId !== undefined &&
    f.serviceTypeId !== null &&
    String(f.serviceTypeId) !== ""
  ) {
    parts.push(`serviceTypeId = ${Number(f.serviceTypeId)}`);
  }

  // Statut texte (si tu l'utilises au lieu de isPublished)
  if (f.status && String(f.status).trim() !== "") {
    parts.push(`status = "${esc(String(f.status))}"`);
  }

  if (f.tag && String(f.tag).trim() !== "") {
    parts.push(`tag = "${esc(String(f.tag))}"`);
  }

  if (f.serviceType && String(f.serviceType).trim() !== "") {
    parts.push(`serviceType = "${esc(String(f.serviceType))}"`);
  }

  return parts.join(" AND ");
}
