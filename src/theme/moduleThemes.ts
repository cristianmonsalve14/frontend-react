export type ModuleId =
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

export interface ModuleTheme {
  id: ModuleId;
  icon: string;
  title: string;
  subtitle: string;
  pageBg: string;
  accentBar: string;
  iconBg: string;
  iconText: string;
  primaryBtn: string;
  focusRing: string;
  toggleActive: string;
  cardClass: string;
  tableWrap: string;
  tableHead: string;
  tableRowHover: string;
  spinner: string;
  dashboardCard: string;
}

export const moduleThemes: Record<ModuleId, ModuleTheme> = {
  courses: {
    id: "courses",
    icon: "📖",
    title: "Cursos",
    subtitle: "Gestión de cursos y niveles académicos",
    pageBg: "from-blue-50 via-indigo-50/60 to-slate-50",
    accentBar: "bg-gradient-to-r from-blue-500 to-indigo-500",
    iconBg: "bg-blue-100",
    iconText: "text-blue-700",
    primaryBtn: "bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-200",
    focusRing: "focus:ring-blue-500/30 focus:border-blue-400",
    toggleActive: "bg-blue-600 text-white shadow-sm",
    cardClass:
      "group rounded-xl border border-blue-100/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md",
    tableWrap: "overflow-x-auto rounded-xl border border-slate-200",
    tableHead: "bg-slate-50 text-slate-600",
    tableRowHover: "hover:bg-blue-50/40",
    spinner: "border-blue-500",
    dashboardCard:
      "hover:border-blue-300 hover:shadow-blue-100/80 border-l-4 border-l-blue-500",
  },
  students: {
    id: "students",
    icon: "👨‍🎓",
    title: "Estudiantes",
    subtitle: "Administración de alumnos y datos personales",
    pageBg: "from-emerald-50 via-green-50/60 to-slate-50",
    accentBar: "bg-gradient-to-r from-emerald-500 to-green-500",
    iconBg: "bg-emerald-100",
    iconText: "text-emerald-700",
    primaryBtn: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-200",
    focusRing: "focus:ring-emerald-500/30 focus:border-emerald-400",
    toggleActive: "bg-emerald-600 text-white shadow-sm",
    cardClass:
      "group rounded-xl border border-emerald-100/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md",
    tableWrap: "overflow-x-auto rounded-xl border border-slate-200",
    tableHead: "bg-slate-50 text-slate-600",
    tableRowHover: "hover:bg-emerald-50/40",
    spinner: "border-emerald-500",
    dashboardCard:
      "hover:border-emerald-300 hover:shadow-emerald-100/80 border-l-4 border-l-emerald-500",
  },
  subjects: {
    id: "subjects",
    icon: "📚",
    title: "Asignaturas",
    subtitle: "Planificación de asignaturas por curso",
    pageBg: "from-violet-50 via-purple-50/60 to-slate-50",
    accentBar: "bg-gradient-to-r from-violet-500 to-purple-500",
    iconBg: "bg-violet-100",
    iconText: "text-violet-700",
    primaryBtn: "bg-violet-600 hover:bg-violet-700 text-white shadow-sm shadow-violet-200",
    focusRing: "focus:ring-violet-500/30 focus:border-violet-400",
    toggleActive: "bg-violet-600 text-white shadow-sm",
    cardClass:
      "group rounded-xl border border-violet-100/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md",
    tableWrap: "overflow-x-auto rounded-xl border border-slate-200",
    tableHead: "bg-slate-50 text-slate-600",
    tableRowHover: "hover:bg-violet-50/40",
    spinner: "border-violet-500",
    dashboardCard:
      "hover:border-violet-300 hover:shadow-violet-100/80 border-l-4 border-l-violet-500",
  },
  enrollments: {
    id: "enrollments",
    icon: "📋",
    title: "Matrículas",
    subtitle: "Inscripción de estudiantes en cursos",
    pageBg: "from-orange-50 via-amber-50/60 to-slate-50",
    accentBar: "bg-gradient-to-r from-orange-500 to-amber-500",
    iconBg: "bg-orange-100",
    iconText: "text-orange-700",
    primaryBtn: "bg-orange-600 hover:bg-orange-700 text-white shadow-sm shadow-orange-200",
    focusRing: "focus:ring-orange-500/30 focus:border-orange-400",
    toggleActive: "bg-orange-600 text-white shadow-sm",
    cardClass:
      "group rounded-xl border border-orange-100/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md",
    tableWrap: "overflow-x-auto rounded-xl border border-slate-200",
    tableHead: "bg-slate-50 text-slate-600",
    tableRowHover: "hover:bg-orange-50/40",
    spinner: "border-orange-500",
    dashboardCard:
      "hover:border-orange-300 hover:shadow-orange-100/80 border-l-4 border-l-orange-500",
  },
  evaluations: {
    id: "evaluations",
    icon: "📝",
    title: "Evaluaciones",
    subtitle: "Pruebas, trabajos y ponderaciones",
    pageBg: "from-cyan-50 via-sky-50/60 to-slate-50",
    accentBar: "bg-gradient-to-r from-cyan-500 to-sky-500",
    iconBg: "bg-cyan-100",
    iconText: "text-cyan-700",
    primaryBtn: "bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm shadow-cyan-200",
    focusRing: "focus:ring-cyan-500/30 focus:border-cyan-400",
    toggleActive: "bg-cyan-600 text-white shadow-sm",
    cardClass:
      "group rounded-xl border border-cyan-100/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-md",
    tableWrap: "overflow-x-auto rounded-xl border border-slate-200",
    tableHead: "bg-slate-50 text-slate-600",
    tableRowHover: "hover:bg-cyan-50/40",
    spinner: "border-cyan-500",
    dashboardCard:
      "hover:border-cyan-300 hover:shadow-cyan-100/80 border-l-4 border-l-cyan-500",
  },
  grades: {
    id: "grades",
    icon: "📊",
    title: "Notas",
    subtitle: "Pon notas a tus alumnos paso a paso",
    pageBg: "from-teal-50 via-emerald-50/60 to-slate-50",
    accentBar: "bg-gradient-to-r from-teal-500 to-emerald-500",
    iconBg: "bg-teal-100",
    iconText: "text-teal-700",
    primaryBtn: "bg-teal-600 hover:bg-teal-700 text-white shadow-sm shadow-teal-200",
    focusRing: "focus:ring-teal-500/30 focus:border-teal-400",
    toggleActive: "bg-teal-600 text-white shadow-sm",
    cardClass:
      "group rounded-xl border border-teal-100/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md",
    tableWrap: "overflow-x-auto rounded-xl border border-slate-200",
    tableHead: "bg-slate-50 text-slate-600",
    tableRowHover: "hover:bg-teal-50/40",
    spinner: "border-teal-500",
    dashboardCard:
      "hover:border-teal-300 hover:shadow-teal-100/80 border-l-4 border-l-teal-500",
  },
  teachers: {
    id: "teachers",
    icon: "👨‍🏫",
    title: "Profesores",
    subtitle: "Gestión del cuerpo docente",
    pageBg: "from-rose-50 via-pink-50/60 to-slate-50",
    accentBar: "bg-gradient-to-r from-rose-500 to-pink-500",
    iconBg: "bg-rose-100",
    iconText: "text-rose-700",
    primaryBtn: "bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-200",
    focusRing: "focus:ring-rose-500/30 focus:border-rose-400",
    toggleActive: "bg-rose-600 text-white shadow-sm",
    cardClass:
      "group rounded-xl border border-rose-100/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-md",
    tableWrap: "overflow-x-auto rounded-xl border border-slate-200",
    tableHead: "bg-slate-50 text-slate-600",
    tableRowHover: "hover:bg-rose-50/40",
    spinner: "border-rose-500",
    dashboardCard:
      "hover:border-rose-300 hover:shadow-rose-100/80 border-l-4 border-l-rose-500",
  },
  myStudents: {
    id: "myStudents",
    icon: "🎒",
    title: "Mis alumnos",
    subtitle: "Consulta los alumnos de tu curso",
    pageBg: "from-lime-50 via-green-50/60 to-slate-50",
    accentBar: "bg-gradient-to-r from-lime-500 to-green-600",
    iconBg: "bg-lime-100",
    iconText: "text-lime-800",
    primaryBtn: "bg-lime-600 hover:bg-lime-700 text-white shadow-sm shadow-lime-200",
    focusRing: "focus:ring-lime-500/30 focus:border-lime-400",
    toggleActive: "bg-lime-600 text-white shadow-sm",
    cardClass:
      "group rounded-xl border border-lime-100/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-lime-200 hover:shadow-md",
    tableWrap: "overflow-x-auto rounded-xl border border-slate-200",
    tableHead: "bg-slate-50 text-slate-600",
    tableRowHover: "hover:bg-lime-50/40",
    spinner: "border-lime-500",
    dashboardCard:
      "hover:border-lime-300 hover:shadow-lime-100/80 border-l-4 border-l-lime-500",
  },
  attendance: {
    id: "attendance",
    icon: "✅",
    title: "Asistencia",
    subtitle: "Marca quién asistió a clase",
    pageBg: "from-indigo-50 via-blue-50/60 to-slate-50",
    accentBar: "bg-gradient-to-r from-indigo-500 to-blue-500",
    iconBg: "bg-indigo-100",
    iconText: "text-indigo-700",
    primaryBtn: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200",
    focusRing: "focus:ring-indigo-500/30 focus:border-indigo-400",
    toggleActive: "bg-indigo-600 text-white shadow-sm",
    cardClass:
      "group rounded-xl border border-indigo-100/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md",
    tableWrap: "overflow-x-auto rounded-xl border border-slate-200",
    tableHead: "bg-slate-50 text-slate-600",
    tableRowHover: "hover:bg-indigo-50/40",
    spinner: "border-indigo-500",
    dashboardCard:
      "hover:border-indigo-300 hover:shadow-indigo-100/80 border-l-4 border-l-indigo-500",
  },
  annotations: {
    id: "annotations",
    icon: "📌",
    title: "Anotaciones",
    subtitle: "Deja una observación sobre un alumno",
    pageBg: "from-fuchsia-50 via-pink-50/60 to-slate-50",
    accentBar: "bg-gradient-to-r from-fuchsia-500 to-pink-500",
    iconBg: "bg-fuchsia-100",
    iconText: "text-fuchsia-700",
    primaryBtn: "bg-fuchsia-600 hover:bg-fuchsia-700 text-white shadow-sm shadow-fuchsia-200",
    focusRing: "focus:ring-fuchsia-500/30 focus:border-fuchsia-400",
    toggleActive: "bg-fuchsia-600 text-white shadow-sm",
    cardClass:
      "group rounded-xl border border-fuchsia-100/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-fuchsia-200 hover:shadow-md",
    tableWrap: "overflow-x-auto rounded-xl border border-slate-200",
    tableHead: "bg-slate-50 text-slate-600",
    tableRowHover: "hover:bg-fuchsia-50/40",
    spinner: "border-fuchsia-500",
    dashboardCard:
      "hover:border-fuchsia-300 hover:shadow-fuchsia-100/80 border-l-4 border-l-fuchsia-500",
  },
  guardians: {
    id: "guardians",
    icon: "👪",
    title: "Apoderados",
    subtitle: "Tutores y contactos de emergencia",
    pageBg: "from-amber-50 via-yellow-50/50 to-slate-50",
    accentBar: "bg-gradient-to-r from-amber-500 to-yellow-500",
    iconBg: "bg-amber-100",
    iconText: "text-amber-800",
    primaryBtn: "bg-amber-600 hover:bg-amber-700 text-white shadow-sm shadow-amber-200",
    focusRing: "focus:ring-amber-500/30 focus:border-amber-400",
    toggleActive: "bg-amber-600 text-white shadow-sm",
    cardClass:
      "group rounded-xl border border-amber-100/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-md",
    tableWrap: "overflow-x-auto rounded-xl border border-slate-200",
    tableHead: "bg-slate-50 text-slate-600",
    tableRowHover: "hover:bg-amber-50/40",
    spinner: "border-amber-500",
    dashboardCard:
      "hover:border-amber-300 hover:shadow-amber-100/80 border-l-4 border-l-amber-500",
  },
  myCourse: {
    id: "myCourse",
    icon: "📖",
    title: "Mi curso",
    subtitle: "Información de tu curso actual",
    pageBg: "from-blue-50 via-indigo-50/60 to-slate-50",
    accentBar: "bg-gradient-to-r from-blue-500 to-indigo-500",
    iconBg: "bg-blue-100",
    iconText: "text-blue-700",
    primaryBtn: "bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-200",
    focusRing: "focus:ring-blue-500/30 focus:border-blue-400",
    toggleActive: "bg-blue-600 text-white shadow-sm",
    cardClass:
      "group rounded-xl border border-blue-100/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md",
    tableWrap: "overflow-x-auto rounded-xl border border-slate-200",
    tableHead: "bg-slate-50 text-slate-600",
    tableRowHover: "hover:bg-blue-50/40",
    spinner: "border-blue-500",
    dashboardCard:
      "hover:border-blue-300 hover:shadow-blue-100/80 border-l-4 border-l-blue-500",
  },
  myGrades: {
    id: "myGrades",
    icon: "📊",
    title: "Mis notas",
    subtitle: "Consulta tus calificaciones",
    pageBg: "from-teal-50 via-emerald-50/60 to-slate-50",
    accentBar: "bg-gradient-to-r from-teal-500 to-emerald-500",
    iconBg: "bg-teal-100",
    iconText: "text-teal-700",
    primaryBtn: "bg-teal-600 hover:bg-teal-700 text-white shadow-sm shadow-teal-200",
    focusRing: "focus:ring-teal-500/30 focus:border-teal-400",
    toggleActive: "bg-teal-600 text-white shadow-sm",
    cardClass:
      "group rounded-xl border border-teal-100/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md",
    tableWrap: "overflow-x-auto rounded-xl border border-slate-200",
    tableHead: "bg-slate-50 text-slate-600",
    tableRowHover: "hover:bg-teal-50/40",
    spinner: "border-teal-500",
    dashboardCard:
      "hover:border-teal-300 hover:shadow-teal-100/80 border-l-4 border-l-teal-500",
  },
  myAttendance: {
    id: "myAttendance",
    icon: "✅",
    title: "Mi asistencia",
    subtitle: "Historial de asistencia a clases",
    pageBg: "from-indigo-50 via-blue-50/60 to-slate-50",
    accentBar: "bg-gradient-to-r from-indigo-500 to-blue-500",
    iconBg: "bg-indigo-100",
    iconText: "text-indigo-700",
    primaryBtn: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200",
    focusRing: "focus:ring-indigo-500/30 focus:border-indigo-400",
    toggleActive: "bg-indigo-600 text-white shadow-sm",
    cardClass:
      "group rounded-xl border border-indigo-100/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md",
    tableWrap: "overflow-x-auto rounded-xl border border-slate-200",
    tableHead: "bg-slate-50 text-slate-600",
    tableRowHover: "hover:bg-indigo-50/40",
    spinner: "border-indigo-500",
    dashboardCard:
      "hover:border-indigo-300 hover:shadow-indigo-100/80 border-l-4 border-l-indigo-500",
  },
  myAnnotations: {
    id: "myAnnotations",
    icon: "📌",
    title: "Mis anotaciones",
    subtitle: "Observaciones registradas por docentes",
    pageBg: "from-fuchsia-50 via-pink-50/60 to-slate-50",
    accentBar: "bg-gradient-to-r from-fuchsia-500 to-pink-500",
    iconBg: "bg-fuchsia-100",
    iconText: "text-fuchsia-700",
    primaryBtn: "bg-fuchsia-600 hover:bg-fuchsia-700 text-white shadow-sm shadow-fuchsia-200",
    focusRing: "focus:ring-fuchsia-500/30 focus:border-fuchsia-400",
    toggleActive: "bg-fuchsia-600 text-white shadow-sm",
    cardClass:
      "group rounded-xl border border-fuchsia-100/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-fuchsia-200 hover:shadow-md",
    tableWrap: "overflow-x-auto rounded-xl border border-slate-200",
    tableHead: "bg-slate-50 text-slate-600",
    tableRowHover: "hover:bg-fuchsia-50/40",
    spinner: "border-fuchsia-500",
    dashboardCard:
      "hover:border-fuchsia-300 hover:shadow-fuchsia-100/80 border-l-4 border-l-fuchsia-500",
  },
  myChildren: {
    id: "myChildren",
    icon: "👪",
    title: "Mis hijos",
    subtitle: "Alumnos a tu cargo",
    pageBg: "from-amber-50 via-orange-50/60 to-slate-50",
    accentBar: "bg-gradient-to-r from-amber-500 to-orange-500",
    iconBg: "bg-amber-100",
    iconText: "text-amber-800",
    primaryBtn: "bg-amber-600 hover:bg-amber-700 text-white shadow-sm shadow-amber-200",
    focusRing: "focus:ring-amber-500/30 focus:border-amber-400",
    toggleActive: "bg-amber-600 text-white shadow-sm",
    cardClass:
      "group rounded-xl border border-amber-100/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-md",
    tableWrap: "overflow-x-auto rounded-xl border border-slate-200",
    tableHead: "bg-slate-50 text-slate-600",
    tableRowHover: "hover:bg-amber-50/40",
    spinner: "border-amber-500",
    dashboardCard:
      "hover:border-amber-300 hover:shadow-amber-100/80 border-l-4 border-l-amber-500",
  },
};
