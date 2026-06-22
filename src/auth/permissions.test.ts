import { describe, expect, it } from "vitest";
import {
  canAccessModule,
  canCreateInModule,
  canDeleteInModule,
  dashboardTitle,
  isAdmin,
  isAdminOnlyModule,
  isAdminReadOnlyModule,
  isTeacher,
  normalizeRoles,
  type AppRole,
} from "./permissions";

const admin: AppRole[] = ["ADMINISTRADOR"];
const teacher: AppRole[] = ["DOCENTE"];
const guardian: AppRole[] = ["APODERADO"];
const student: AppRole[] = ["ESTUDIANTE"];

describe("permissions", () => {
  it("normalizeRoles filters unknown values", () => {
    expect(normalizeRoles(["ADMINISTRADOR", "INVALIDO", "DOCENTE"])).toEqual([
      "ADMINISTRADOR",
      "DOCENTE",
    ]);
  });

  it("admin can access structural modules", () => {
    expect(canAccessModule(admin, "students")).toBe(true);
    expect(canAccessModule(admin, "courses")).toBe(true);
  });

  it("teacher can access pedagogical modules", () => {
    expect(canAccessModule(teacher, "attendance")).toBe(true);
    expect(canAccessModule(teacher, "evaluations")).toBe(true);
  });

  it("teacher cannot access admin-only modules", () => {
    expect(canAccessModule(teacher, "guardians")).toBe(false);
    expect(canAccessModule(teacher, "enrollments")).toBe(false);
  });

  it("guardian can access family modules", () => {
    expect(canAccessModule(guardian, "myChildren")).toBe(true);
    expect(canAccessModule(guardian, "myGrades")).toBe(true);
  });

  it("student can access own academic view modules", () => {
    expect(canAccessModule(student, "myCourse")).toBe(true);
    expect(canAccessModule(student, "students")).toBe(false);
  });

  it("admin can create in writable modules but not read-only ones", () => {
    expect(canCreateInModule(admin, "courses")).toBe(true);
    expect(canCreateInModule(admin, "attendance")).toBe(false);
  });

  it("teacher can create evaluations and attendance", () => {
    expect(canCreateInModule(teacher, "grades")).toBe(true);
    expect(canCreateInModule(teacher, "students")).toBe(false);
  });

  it("marks admin-only and read-only modules", () => {
    expect(isAdminOnlyModule("teachers")).toBe(true);
    expect(isAdminReadOnlyModule("annotations")).toBe(true);
  });

  it("delete permission mirrors create permission", () => {
    expect(canDeleteInModule(teacher, "attendance")).toBe(true);
    expect(canDeleteInModule(guardian, "myGrades")).toBe(false);
  });

  it("role helpers identify primary role", () => {
    expect(isAdmin(admin)).toBe(true);
    expect(isTeacher(teacher)).toBe(true);
  });

  it("dashboardTitle changes by role", () => {
    expect(dashboardTitle(admin)).toBe("Panel de Administración");
    expect(dashboardTitle(teacher)).toBe("Panel Docente");
    expect(dashboardTitle(guardian)).toBe("Panel Apoderado");
    expect(dashboardTitle(student)).toBe("Panel Estudiante");
  });
});
