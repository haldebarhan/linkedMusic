export function hasOwn(obj: any, k: string) {
  return obj && Object.prototype.hasOwnProperty.call(obj, k);
}
export function isEmptyValue(v: any) {
  return (
    v === null ||
    v === undefined ||
    v === "" ||
    (Array.isArray(v) && v.length === 0)
  );
}
export function toArray(v: any): string[] {
  if (Array.isArray(v)) return v.map(String);
  if (v === null || v === undefined || v === "") return [];
  if (typeof v === "string")
    return v
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  return [String(v)];
}
export function toBool(v: any): boolean {
  return v === true || v === 1 || v === "1" || v === "true" || v === "on";
}
