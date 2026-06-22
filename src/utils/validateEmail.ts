export function isValidEmail(email: string): boolean {
  const trimmed = email.trim();
  if (!trimmed) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

export function validateEmailField(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) return "El email es obligatorio";
  if (!isValidEmail(trimmed)) return "El email no tiene un formato válido";
  return null;
}
