import type { Student } from "../api/students";

export type StudentNameFields = Pick<
  Student,
  "firstName" | "secondName" | "lastName" | "motherLastName"
>;

export function formatStudentFullName(student: StudentNameFields) {
  return [student.firstName, student.secondName, student.lastName, student.motherLastName]
    .filter(Boolean)
    .join(" ");
}

export function formatStudentFirstNames(student: StudentNameFields) {
  return [student.firstName, student.secondName].filter(Boolean).join(" ");
}

export const STUDENT_NAME_COLUMNS = [
  { key: "firstName", label: "Primer nombre" },
  { key: "secondName", label: "Segundo nombre" },
  { key: "lastName", label: "Apellido paterno" },
  { key: "motherLastName", label: "Apellido materno" },
] as const;
