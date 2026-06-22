export type AppRole = "ADMINISTRADOR" | "DOCENTE" | "APODERADO" | "ESTUDIANTE";

export type ModuleKey =
  | "courses"
  | "students"
  | "myStudents"
  | "subjects"
  | "enrollments"
  | "evaluations"
  | "grades"
  | "attendance"
  | "annotations"
  | "teachers"
  | "guardians"
  | "myCourse"
  | "myGrades"
  | "myAttendance"
  | "myAnnotations"
  | "myChildren";

const ADMIN_MODULES: ModuleKey[] = [
  "courses",
  "students",
  "subjects",
  "enrollments",
  "evaluations",
  "grades",
  "attendance",
  "annotations",
  "teachers",
  "guardians",
];

const TEACHER_MODULES: ModuleKey[] = [
  "courses",
  "myStudents",
  "subjects",
  "evaluations",
  "grades",
  "attendance",
  "annotations",
];

const GUARDIAN_MODULES: ModuleKey[] = [
  "myChildren",
  "myCourse",
  "myGrades",
  "myAttendance",
  "myAnnotations",
];

const STUDENT_MODULES: ModuleKey[] = [
  "myCourse",
  "myGrades",
  "myAttendance",
  "myAnnotations",
];

/** Admin gestiona estructura del colegio (CRUD completo) */
const ADMIN_WRITABLE_MODULES: ModuleKey[] = [
  "courses",
  "students",
  "subjects",
  "enrollments",
  "teachers",
  "guardians",
];

/** Docente registra operación pedagógica diaria */
const TEACHER_WRITABLE_MODULES: ModuleKey[] = ["evaluations", "grades", "attendance", "annotations"];

/** Admin puede entrar pero solo consultar (no crear/editar/borrar) */
const ADMIN_READ_ONLY_MODULES: ModuleKey[] = [
  "evaluations",
  "grades",
  "attendance",
  "annotations",
];

const ADMIN_ONLY_MODULES: ModuleKey[] = ["teachers", "guardians", "students", "enrollments"];

/** Módulos visibles en el inicio del panel docente (acciones del día a día) */
export const TEACHER_DASHBOARD_MODULES: ModuleKey[] = [
  "attendance",
  "evaluations",
  "grades",
  "myStudents",
  "annotations",
];

export const GUARDIAN_DASHBOARD_MODULES: ModuleKey[] = GUARDIAN_MODULES;
export const STUDENT_DASHBOARD_MODULES: ModuleKey[] = STUDENT_MODULES;

export function isTeacherDashboardModule(module: ModuleKey): boolean {
  return TEACHER_DASHBOARD_MODULES.includes(module);
}

export function isFamilyDashboardModule(module: ModuleKey): boolean {
  return GUARDIAN_DASHBOARD_MODULES.includes(module) || STUDENT_DASHBOARD_MODULES.includes(module);
}

export function isAdminReadOnlyModule(module: ModuleKey): boolean {
  return ADMIN_READ_ONLY_MODULES.includes(module);
}

export function normalizeRoles(roles: string[] | Set<string> | undefined): AppRole[] {
  if (!roles) {
    return [];
  }
  const list = Array.isArray(roles) ? roles : Array.from(roles);
  return list.filter((role): role is AppRole =>
    ["ADMINISTRADOR", "DOCENTE", "APODERADO", "ESTUDIANTE"].includes(role),
  );
}

export function isAdmin(roles: AppRole[]): boolean {
  return roles.includes("ADMINISTRADOR");
}

export function isTeacher(roles: AppRole[]): boolean {
  return roles.includes("DOCENTE");
}

export function isGuardian(roles: AppRole[]): boolean {
  return roles.includes("APODERADO");
}

export function isStudent(roles: AppRole[]): boolean {
  return roles.includes("ESTUDIANTE");
}

export function canAccessModule(roles: AppRole[], module: ModuleKey): boolean {
  if (isAdmin(roles)) {
    return ADMIN_MODULES.includes(module);
  }
  if (isTeacher(roles)) {
    return TEACHER_MODULES.includes(module);
  }
  if (isGuardian(roles)) {
    return GUARDIAN_MODULES.includes(module);
  }
  if (isStudent(roles)) {
    return STUDENT_MODULES.includes(module);
  }
  return false;
}

export function canCreateInModule(roles: AppRole[], module: ModuleKey): boolean {
  if (isAdmin(roles)) {
    return ADMIN_WRITABLE_MODULES.includes(module);
  }
  if (isTeacher(roles)) {
    return TEACHER_WRITABLE_MODULES.includes(module);
  }
  return false;
}

export function canEditInModule(roles: AppRole[], module: ModuleKey): boolean {
  return canCreateInModule(roles, module);
}

export function canDeleteInModule(roles: AppRole[], module: ModuleKey): boolean {
  return canCreateInModule(roles, module);
}

export function isAdminOnlyModule(module: ModuleKey): boolean {
  return ADMIN_ONLY_MODULES.includes(module);
}

export function dashboardTitle(roles: AppRole[]): string {
  if (isAdmin(roles)) {
    return "Panel de Administración";
  }
  if (isTeacher(roles)) {
    return "Panel Docente";
  }
  if (isGuardian(roles)) {
    return "Panel Apoderado";
  }
  if (isStudent(roles)) {
    return "Panel Estudiante";
  }
  return "Libro Digital";
}
