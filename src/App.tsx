import { useState } from "react";
import Login from "./Login";
import Courses from "./Courses";
import Students from "./Students";
import Subjects from "./Subjects";
import Enrollments from "./Enrollments";
import Evaluations from "./Evaluations";
import Teachers from "./Teachers";
import Guardians from "./Guardians";
import Grades from "./Grades";
import MyStudents from "./MyStudents";
import Attendance from "./Attendance";
import Annotations from "./Annotations";
import MyCourse from "./family/MyCourse";
import FamilyGrades from "./family/FamilyGrades";
import FamilyAttendance from "./family/FamilyAttendance";
import FamilyAnnotations from "./family/FamilyAnnotations";
import MyChildren from "./family/MyChildren";
import { moduleThemes } from "./theme/moduleThemes";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import type { ModuleKey } from "./auth/permissions";
import { isTeacherDashboardModule, isFamilyDashboardModule } from "./auth/permissions";
import { TeacherCourseProvider, useTeacherCourse } from "./teacher/TeacherCourseContext";
import { FamilyStudentProvider, useFamilyStudent } from "./family/FamilyStudentContext";

type View = "dashboard" | ModuleKey;

interface DashboardCard {
  key: ModuleKey;
  icon: string;
  title: string;
  description: string;
  teacherTitle?: string;
  teacherDescription?: string;
}

const DASHBOARD_CARDS: DashboardCard[] = [
  { key: "courses", icon: "📖", title: "Cursos", description: "Gestionar cursos académicos" },
  { key: "students", icon: "👨‍🎓", title: "Estudiantes", description: "Administrar estudiantes" },
  { key: "subjects", icon: "📚", title: "Asignaturas", description: "Gestionar asignaturas" },
  { key: "enrollments", icon: "📋", title: "Matrículas", description: "Inscribir estudiantes" },
  {
    key: "evaluations",
    icon: "📝",
    title: "Evaluaciones",
    description: "Consultar pruebas y controles del colegio",
    teacherTitle: "Crear evaluación",
    teacherDescription: "Programa una prueba, control o trabajo para tus alumnos",
  },
  {
    key: "grades",
    icon: "📊",
    title: "Notas",
    description: "Consultar calificaciones registradas por los docentes",
    teacherTitle: "Poner notas",
    teacherDescription: "Califica a tus alumnos en una prueba o control",
  },
  {
    key: "myStudents",
    icon: "🎒",
    title: "Mis alumnos",
    description: "Estudiantes de tus cursos",
    teacherTitle: "Ver mis alumnos",
    teacherDescription: "Consulta la lista de alumnos de tu curso",
  },
  {
    key: "attendance",
    icon: "✅",
    title: "Asistencia",
    description: "Consultar registros de asistencia de las clases",
    teacherTitle: "Pasar lista",
    teacherDescription: "Marca quién asistió a clase hoy",
  },
  {
    key: "annotations",
    icon: "📌",
    title: "Anotaciones",
    description: "Consultar observaciones dejadas por los docentes",
    teacherTitle: "Dejar una anotación",
    teacherDescription: "Registra una observación sobre un alumno",
  },
  { key: "teachers", icon: "👨‍🏫", title: "Profesores", description: "Gestionar profesores" },
  { key: "guardians", icon: "👪", title: "Apoderados", description: "Gestionar apoderados" },
  { key: "myChildren", icon: "👪", title: "Mis hijos", description: "Alumnos a tu cargo" },
  { key: "myCourse", icon: "📖", title: "Mi curso", description: "Información del curso actual" },
  { key: "myGrades", icon: "📊", title: "Mis notas", description: "Consulta calificaciones" },
  { key: "myAttendance", icon: "✅", title: "Mi asistencia", description: "Historial de asistencia" },
  { key: "myAnnotations", icon: "📌", title: "Mis anotaciones", description: "Observaciones de docentes" },
];

function AppContent() {
  const auth = useAuth();
  const teacherCourse = useTeacherCourse();
  const familyStudent = useFamilyStudent();
  const [currentView, setCurrentView] = useState<View>("dashboard");
  const isTeacherPanel = auth.isTeacher && !auth.isAdmin;
  const isGuardianPanel = auth.isGuardian && !auth.isAdmin;
  const isStudentPanel = auth.isStudent && !auth.isAdmin && !auth.isTeacher;

  const handleLogout = () => {
    auth.clearSession();
    sessionStorage.removeItem("teacherActiveCourseId");
    sessionStorage.removeItem("familyActiveStudentId");
    setCurrentView("dashboard");
  };

  const visibleCards = DASHBOARD_CARDS.filter((card) => {
    if (!auth.canAccessModule(card.key)) return false;
    if (isTeacherPanel) return isTeacherDashboardModule(card.key);
    if (isGuardianPanel || isStudentPanel) return isFamilyDashboardModule(card.key);
    return true;
  });

  const renderView = () => {
    switch (currentView) {
      case "courses":
        return <Courses onBack={() => setCurrentView("dashboard")} />;
      case "students":
        return <Students onBack={() => setCurrentView("dashboard")} />;
      case "subjects":
        return <Subjects onBack={() => setCurrentView("dashboard")} />;
      case "enrollments":
        return <Enrollments onBack={() => setCurrentView("dashboard")} />;
      case "evaluations":
        return <Evaluations onBack={() => setCurrentView("dashboard")} />;
      case "grades":
        return <Grades onBack={() => setCurrentView("dashboard")} />;
      case "myStudents":
        return <MyStudents onBack={() => setCurrentView("dashboard")} />;
      case "attendance":
        return <Attendance onBack={() => setCurrentView("dashboard")} />;
      case "annotations":
        return <Annotations onBack={() => setCurrentView("dashboard")} />;
      case "teachers":
        return <Teachers onBack={() => setCurrentView("dashboard")} />;
      case "guardians":
        return <Guardians onBack={() => setCurrentView("dashboard")} />;
      case "myChildren":
        return <MyChildren onBack={() => setCurrentView("dashboard")} />;
      case "myCourse":
        return <MyCourse onBack={() => setCurrentView("dashboard")} />;
      case "myGrades":
        return <FamilyGrades onBack={() => setCurrentView("dashboard")} />;
      case "myAttendance":
        return <FamilyAttendance onBack={() => setCurrentView("dashboard")} />;
      case "myAnnotations":
        return <FamilyAnnotations onBack={() => setCurrentView("dashboard")} />;
      default:
        return (
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
            <nav className="bg-white shadow-sm border-b border-gray-100">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-gray-700">📚 Libro Digital</h1>
                    {auth.user?.username && (
                      <span className="hidden sm:inline text-sm text-gray-500">
                        {auth.user.username}
                        {auth.isAdmin && " · Administración"}
                        {isTeacherPanel && " · Docente"}
                        {isGuardianPanel && " · Apoderado"}
                        {isStudentPanel && " · Estudiante"}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-400 text-white rounded-lg hover:bg-red-500 transition font-medium shadow-sm"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
              {isTeacherPanel && teacherCourse.courseOptions.length > 0 && (
                <div className="mb-8 mx-auto max-w-2xl rounded-2xl border-2 border-teal-300 bg-gradient-to-br from-teal-50 to-white px-6 py-5 shadow-md">
                  <p className="text-center text-lg font-bold text-teal-900 mb-1">
                    ¿Con qué curso trabajas hoy?
                  </p>
                  <p className="text-center text-sm text-teal-700/80 mb-4">
                    Elige antes de pasar lista, poner notas o crear evaluaciones
                  </p>
                  {teacherCourse.courseOptions.length > 1 ? (
                    <select
                      value={teacherCourse.selectedCourseId ?? ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value) {
                          teacherCourse.selectCourse(parseInt(value, 10));
                        }
                      }}
                      className="w-full rounded-xl border-2 border-teal-300 bg-white px-4 py-3.5 text-lg font-semibold text-slate-800 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                      aria-label="Seleccionar curso activo"
                    >
                      <option value="">— Selecciona un curso —</option>
                      {teacherCourse.courseOptions.map((option) => (
                        <option key={option.courseId} value={option.courseId}>
                          {option.courseLabel}
                          {option.studentCount > 0
                            ? ` · ${option.studentCount} alumno${option.studentCount !== 1 ? "s" : ""}`
                            : " · sin alumnos matriculados"}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-center text-xl font-bold text-slate-800">
                      {teacherCourse.courseOptions[0]?.courseLabel}
                    </p>
                  )}
                  {teacherCourse.selectedCourse ? (
                    <p className="mt-3 text-center text-sm text-teal-800">
                      Curso activo: <strong>{teacherCourse.selectedCourse.courseLabel}</strong>
                      {" · "}
                      {teacherCourse.selectedCourse.roleLabel}
                    </p>
                  ) : (
                    <p className="mt-3 text-center text-sm font-medium text-amber-700">
                      Debes elegir un curso para continuar
                    </p>
                  )}
                </div>
              )}

              {isGuardianPanel && familyStudent.studentOptions.length > 1 && (
                <div className="mb-8 mx-auto max-w-2xl rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-white px-6 py-5 shadow-md">
                  <p className="text-center text-lg font-bold text-amber-900 mb-1">
                    ¿De qué alumno quieres ver la información?
                  </p>
                  <select
                    value={familyStudent.selectedStudentId ?? ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value) familyStudent.selectStudent(parseInt(value, 10));
                    }}
                    className="w-full rounded-xl border-2 border-amber-300 bg-white px-4 py-3 text-lg font-semibold text-slate-800 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                  >
                    <option value="">— Selecciona un alumno —</option>
                    {familyStudent.studentOptions.map((option) => (
                      <option key={option.studentId} value={option.studentId}>
                        {option.studentLabel}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="text-center mb-10">
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-700 mb-3">
                  {auth.dashboardTitle}
                </h2>
                <p className="text-gray-500 text-lg max-w-2xl mx-auto">
                  {isTeacherPanel
                    ? "Luego elige una acción del día (notas, lista, evaluación, etc.)"
                    : isGuardianPanel || isStudentPanel
                      ? "Consulta tu información académica (solo lectura)"
                      : "Selecciona una opción para comenzar"}
                </p>
              </div>

              <div
                className={`grid gap-5 sm:gap-6 ${
                  isTeacherPanel || isGuardianPanel || isStudentPanel
                    ? "grid-cols-1 sm:grid-cols-2 max-w-4xl mx-auto"
                    : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                }`}
              >
                {visibleCards.map((card) => (
                  <button
                    key={card.key}
                    onClick={() => setCurrentView(card.key)}
                    className={`bg-white rounded-2xl shadow-md p-8 sm:p-10 hover:shadow-xl transition border border-slate-200 text-left ${
                      isTeacherPanel ? "hover:-translate-y-1" : "transform hover:scale-105"
                    } ${moduleThemes[card.key].dashboardCard}`}
                  >
                    <div className={`mb-5 ${isTeacherPanel ? "text-5xl" : "text-6xl"}`}>
                      {card.icon}
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-700 mb-2">
                      {isTeacherPanel && card.teacherTitle ? card.teacherTitle : card.title}
                    </h3>
                    <p className="text-gray-500 text-base leading-relaxed">
                      {isTeacherPanel && card.teacherDescription
                        ? card.teacherDescription
                        : card.description}
                    </p>
                  </button>
                ))}
              </div>
            </main>

          </div>
        );
    }
  };

  if (!auth.isAuthenticated) {
    return <Login />;
  }
  return renderView();
}

function App() {
  return (
    <AuthProvider>
      <TeacherCourseProvider>
        <FamilyStudentProvider>
          <AppContent />
        </FamilyStudentProvider>
      </TeacherCourseProvider>
    </AuthProvider>
  );
}

export default App;
