export function normalizePhone(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("56") && digits.length > 9) {
    digits = digits.slice(2);
  }
  return digits;
}

export function isValidPhone(phone: string): boolean {
  const digits = normalizePhone(phone);
  if (digits.length < 8 || digits.length > 9) return false;
  if (digits.length === 9 && digits[0] !== "9" && digits[0] !== "2") return false;
  return true;
}

export function validatePhoneField(phone: string, required = true): string | null {
  const trimmed = phone.trim();
  if (!trimmed) {
    return required ? "El teléfono es obligatorio" : null;
  }
  if (!isValidPhone(trimmed)) {
    return "El teléfono debe tener 8 o 9 dígitos (ej: 912345678)";
  }
  return null;
}
