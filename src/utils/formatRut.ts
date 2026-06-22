/** Evita que el RUT se parta en dos líneas (ej. 11.111.111- / 1). */
export const RUT_TABLE_CELL_CLASS = "whitespace-nowrap tabular-nums min-w-[6.75rem]";

export function cleanRut(rut: string): string {
  return rut.replace(/[^0-9kK]/g, "").toUpperCase();
}

export function isValidRut(rut: string): boolean {
  const cleaned = cleanRut(rut);
  if (cleaned.length < 2) return false;

  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);
  if (!/^\d+$/.test(body)) return false;

  let sum = 0;
  let multiplier = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += Number(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const mod = 11 - (sum % 11);
  const expected = mod === 11 ? "0" : mod === 10 ? "K" : String(mod);
  return dv === expected;
}

/** Formato estándar chileno: 11.111.111-1 */
export function normalizeRut(rut: string): string {
  const cleaned = cleanRut(rut);
  if (!cleaned) return "";

  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);
  const reversed = body.split("").reverse();
  const parts: string[] = [];

  for (let i = 0; i < reversed.length; i++) {
    if (i > 0 && i % 3 === 0) parts.push(".");
    parts.push(reversed[i]);
  }

  return `${parts.reverse().join("")}-${dv}`;
}

export function validateRutField(rut: string): string | null {
  const trimmed = rut.trim();
  if (!trimmed) return "El RUT es obligatorio";
  if (!isValidRut(trimmed)) {
    return "El RUT no es válido. Puedes escribirlo como 11111111-1 o 11.111.111-1";
  }
  return null;
}

export function formatRutDisplay(rut?: string | null): string {
  if (!rut?.trim()) return "";
  return rut.trim().replace(/-/g, "\u2011");
}
