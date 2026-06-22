import type { AttendanceRecord } from "../api/attendances";

export function formatSessionDate(sessionDate?: string): string {
  if (!sessionDate) return "—";
  const parsed = new Date(`${sessionDate}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return sessionDate;
  return parsed.toLocaleDateString("es-CL", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatAttendanceClassLabel(record: AttendanceRecord): string {
  const date = formatSessionDate(record.sessionDate);
  const subject = record.subjectName?.trim();
  if (date !== "—" && subject) return `${date} · ${subject}`;
  if (date !== "—") return date;
  if (subject) return subject;
  return `Clase #${record.sessionId}`;
}

export function attendanceSearchText(record: AttendanceRecord): string {
  return [
    record.sessionDate,
    record.subjectName,
    record.topic,
    record.status,
    record.observations,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function compareAttendanceBySessionDate(a: AttendanceRecord, b: AttendanceRecord): number {
  const dateA = a.sessionDate ?? "";
  const dateB = b.sessionDate ?? "";
  if (dateA !== dateB) return dateB.localeCompare(dateA);
  return b.id - a.id;
}
