import type { Course } from "../api/courses";

/** Ej: "1° Medio A" — grado + paralelo (A, B, C) */
export function formatCourseLabel(course: Course): string {
  const grade = (course.grade ?? "").trim();
  const name = (course.name ?? "").trim();

  if (!grade && !name) return `Curso #${course.id}`;

  if (/^[A-Z]$/i.test(name)) {
    return grade ? `${grade} ${name.toUpperCase()}` : name.toUpperCase();
  }

  if (grade && name.toLowerCase().includes(grade.toLowerCase())) {
    return name;
  }

  if (grade && name && grade.toLowerCase() !== name.toLowerCase()) {
    return `${grade} ${name}`;
  }

  return grade || name;
}
