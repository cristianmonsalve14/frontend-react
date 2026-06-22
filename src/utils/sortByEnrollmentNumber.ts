const ENROLLMENT_NUMBER_PATTERN = /^(\d{4})-(\d+)$/;

function parseEnrollmentNumber(value?: string): { year: number; sequence: number } | null {
  if (!value?.trim()) return null;
  const match = value.trim().match(ENROLLMENT_NUMBER_PATTERN);
  if (!match) return null;
  return {
    year: parseInt(match[1], 10),
    sequence: parseInt(match[2], 10),
  };
}

function compareEnrollmentNumbers(a?: string, b?: string): number {
  const parsedA = parseEnrollmentNumber(a);
  const parsedB = parseEnrollmentNumber(b);
  if (!parsedA && !parsedB) return 0;
  if (!parsedA) return 1;
  if (!parsedB) return -1;
  if (parsedA.year !== parsedB.year) return parsedA.year - parsedB.year;
  return parsedA.sequence - parsedB.sequence;
}

/** Orden ascendente por N° matrícula (ej. 2026-1, 2026-2, 2026-3). Sin número al final. */
export function sortByEnrollmentNumber<T extends { enrollmentNumber?: string }>(items: T[]): T[] {
  return [...items].sort((a, b) =>
    compareEnrollmentNumbers(a.enrollmentNumber, b.enrollmentNumber),
  );
}
