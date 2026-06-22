export function validatePastDateField(date: string, label = "La fecha"): string | null {
  if (!date.trim()) return null;
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return `${label} no es válida`;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (parsed > today) return `${label} no puede ser futura`;
  return null;
}

export function validateNotFutureDateField(date: string, label = "La fecha"): string | null {
  return validatePastDateField(date, label);
}

export function validatePositiveIntField(
  value: string,
  label: string,
  min = 1,
  max?: number
): string | null {
  if (!value.trim()) return `${label} es obligatorio`;
  const num = parseInt(value, 10);
  if (Number.isNaN(num) || num < min) {
    return `${label} debe ser al menos ${min}`;
  }
  if (max !== undefined && num > max) {
    return `${label} no puede superar ${max}`;
  }
  return null;
}

export function validateWeightField(weight: string): string | null {
  if (!weight.trim()) return null;
  const num = parseFloat(weight);
  if (Number.isNaN(num) || num < 0 || num > 100) {
    return "La ponderación debe estar entre 0 y 100";
  }
  return null;
}
