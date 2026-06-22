import { useEffect, useMemo, useState } from "react";
import { getSessions, createSession, deleteSession } from "./api/sessions";
import type { ClassSession } from "./api/sessions";
import {
  getAttendancesBySession,
  createAttendance,
  updateAttendance,
} from "./api/attendances";
import { getCourses } from "./api/courses";
import type { Course } from "./api/courses";
import { getSubjects } from "./api/subjects";
import type { Subject } from "./api/subjects";
import { getStudents } from "./api/students";
import type { Student } from "./api/students";
import { getEnrollments } from "./api/enrollments";
import { getCurrentTeacher } from "./api/teachers";
import { formatCourseLabel } from "./utils/formatCourseLabel";
import { formatStudentFullName } from "./utils/formatStudentFullName";
import { moduleThemes } from "./theme/moduleThemes";
import ModuleLayout from "./components/ModuleLayout";
import FormModal, { FormField, formInputClass } from "./components/FormModal";
import TeacherContextBar from "./components/TeacherContextBar";
import TeacherCourseRequired from "./components/TeacherCourseRequired";
import ModuleHelpBanner from "./components/ModuleHelpBanner";
import { useAuth } from "./auth/AuthContext";
import { useTeacherCourse } from "./teacher/TeacherCourseContext";
import { sortById } from "./utils/sortById";
import { validateNotFutureDateField } from "./utils/validateDate";

type SimpleAttendanceStatus = "PRESENTE" | "AUSENTE";

interface AttendanceProps {
  onBack: () => void;
}

function Attendance({ onBack }: AttendanceProps) {
  const theme = moduleThemes.attendance;
  const auth = useAuth();
  const canWriteAttendance = auth.canCreate("attendance");
  const isTeacherPanel = auth.isTeacher && !auth.isAdmin;
  const { selectedCourse, selectedCourseId, courseSubjects } = useTeacherCourse();
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [enrollments, setEnrollments] = useState<{ studentId: number; courseId: number }[]>([]);
  const [teacherId, setTeacherId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [activeSession, setActiveSession] = useState<ClassSession | null>(null);
  const [viewingSession, setViewingSession] = useState<ClassSession | null>(null);
  const [viewRecords, setViewRecords] = useState<Record<number, SimpleAttendanceStatus>>({});
  const [viewLoading, setViewLoading] = useState(false);
  const [viewError, setViewError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [attendanceDraft, setAttendanceDraft] = useState<Record<number, SimpleAttendanceStatus>>({});
  const [existingAttendance, setExistingAttendance] = useState<Record<number, number>>({});

  const [form, setForm] = useState({
    subjectId: "",
    sessionDate: new Date().toISOString().slice(0, 10),
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [sessionsData, coursesData, subjectsData, studentsData, enrollmentsData] =
        await Promise.all([
          getSessions(),
          getCourses(),
          getSubjects(),
          getStudents(),
          getEnrollments(),
        ]);
      setSessions(sortById(sessionsData));
      setCourses(sortById(coursesData));
      setSubjects(sortById(subjectsData));
      setStudents(sortById(studentsData));
      setEnrollments(sortById(enrollmentsData));
      if (auth.isTeacher && !auth.isAdmin) {
        const me = await getCurrentTeacher();
        setTeacherId(me?.id ?? null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar asistencia");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const courseMap = useMemo(() => new Map(courses.map((c) => [c.id, c])), [courses]);
  const subjectMap = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);

  const availableSubjects = useMemo(() => {
    if (isTeacherPanel && selectedCourseId) {
      return courseSubjects;
    }
    if (auth.isTeacher && !auth.isAdmin && teacherId) {
      return subjects.filter((subject) => subject.teacherId === teacherId);
    }
    return subjects;
  }, [subjects, auth.isTeacher, auth.isAdmin, teacherId, isTeacherPanel, selectedCourseId, courseSubjects]);

  const subjectLabel = (subject: Subject) => {
    const course = subject.courseId ? courseMap.get(subject.courseId) : undefined;
    const courseName = course ? formatCourseLabel(course) : "Sin curso";
    return `${subject.subjectName} — ${courseName}`;
  };

  const sessionSubjectLabel = (session: ClassSession) => {
    const subject = subjectMap.get(session.subjectId);
    return subject?.subjectName ?? `Asignatura ${session.subjectId}`;
  };

  const sessionCourseLabel = (session: ClassSession) => {
    const course = courseMap.get(session.courseId);
    return course ? formatCourseLabel(course) : `Curso ${session.courseId}`;
  };

  const sessionSearchText = (session: ClassSession) =>
    `${session.sessionDate} ${sessionSubjectLabel(session)} ${sessionCourseLabel(session)}`.toLowerCase();

  const [adminCourseFilter, setAdminCourseFilter] = useState("");

  const filteredSessions = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return sessions.filter((session) => {
      if (isTeacherPanel) {
        if (!selectedCourseId || session.courseId !== selectedCourseId) return false;
      } else if (adminCourseFilter && String(session.courseId) !== adminCourseFilter) {
        return false;
      }
      return sessionSearchText(session).includes(q);
    });
  }, [sessions, searchTerm, isTeacherPanel, selectedCourseId, adminCourseFilter, subjectMap, courseMap]);

  const studentsForSubject = (session: ClassSession) => {
    const ids = enrollments
      .filter((e) => e.courseId === session.courseId)
      .map((e) => e.studentId);
    return students
      .filter((s) => ids.includes(s.id))
      .sort((a, b) => formatStudentFullName(a).localeCompare(formatStudentFullName(b), "es"));
  };

  const openViewModal = async (session: ClassSession) => {
    setViewingSession(session);
    setViewLoading(true);
    setViewError(null);
    setViewRecords({});
    try {
      const records = await getAttendancesBySession(session.id);
      const saved: Record<number, SimpleAttendanceStatus> = {};
      records.forEach((record) => {
        saved[record.studentId] = record.status === "AUSENTE" ? "AUSENTE" : "PRESENTE";
      });
      setViewRecords(saved);
    } catch (err) {
      setViewError(err instanceof Error ? err.message : "Error al cargar asistencia");
    } finally {
      setViewLoading(false);
    }
  };

  const openAttendanceModal = async (session: ClassSession) => {
    setActiveSession(session);
    setFormError(null);
    try {
      const records = await getAttendancesBySession(session.id);
      const draft: Record<number, SimpleAttendanceStatus> = {};
      const existing: Record<number, number> = {};
      records.forEach((record) => {
        draft[record.studentId] = record.status === "AUSENTE" ? "AUSENTE" : "PRESENTE";
        existing[record.studentId] = record.id;
      });
      studentsForSubject(session).forEach((student) => {
        if (!draft[student.id]) draft[student.id] = "PRESENTE";
      });
      setAttendanceDraft(draft);
      setExistingAttendance(existing);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al cargar lista");
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subjectId) {
      setFormError("Selecciona una asignatura");
      return;
    }
    const subject = subjectMap.get(parseInt(form.subjectId));
    if (!subject?.courseId) {
      setFormError("La asignatura no tiene un curso asociado");
      return;
    }
    if (!form.sessionDate?.trim()) {
      setFormError("La fecha de la sesión es obligatoria");
      return;
    }
    const dateError = validateNotFutureDateField(form.sessionDate, "La fecha de la sesión");
    if (dateError) {
      setFormError(dateError);
      return;
    }
    if (!teacherId) {
      setFormError("No se pudo identificar al docente para registrar la sesión");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const created = await createSession({
        courseId: subject.courseId,
        subjectId: subject.id,
        teacherId,
        sessionDate: form.sessionDate,
      });
      setShowCreate(false);
      await loadData();
      await openAttendanceModal(created);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al crear registro");
    } finally {
      setSubmitting(false);
    }
  };

  const saveAttendance = async () => {
    if (!activeSession) return;
    setSubmitting(true);
    setFormError(null);
    try {
      for (const [studentIdStr, status] of Object.entries(attendanceDraft)) {
        const studentId = parseInt(studentIdStr);
        const payload = {
          sessionId: activeSession.id,
          studentId,
          status,
        };
        const existingId = existingAttendance[studentId];
        if (existingId) {
          await updateAttendance(existingId, payload);
        } else {
          await createAttendance(payload);
        }
      }
      setActiveSession(null);
      await loadData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al guardar asistencia");
    } finally {
      setSubmitting(false);
    }
  };

  const togglePresent = (studentId: number, isPresent: boolean) => {
    setAttendanceDraft((prev) => ({
      ...prev,
      [studentId]: isPresent ? "PRESENTE" : "AUSENTE",
    }));
  };

  const markAllPresent = () => {
    if (!activeSession) return;
    const next: Record<number, SimpleAttendanceStatus> = {};
    studentsForSubject(activeSession).forEach((student) => {
      next[student.id] = "PRESENTE";
    });
    setAttendanceDraft(next);
  };

  const inputClass = formInputClass(theme);
  const activeStudents = activeSession ? studentsForSubject(activeSession) : [];
  const viewStudents = viewingSession ? studentsForSubject(viewingSession) : [];
  const presentCount = activeStudents.filter(
    (s) => (attendanceDraft[s.id] ?? "PRESENTE") === "PRESENTE",
  ).length;
  const viewPresentCount = viewStudents.filter((s) => viewRecords[s.id] === "PRESENTE").length;
  const viewAbsentCount = viewStudents.filter((s) => viewRecords[s.id] === "AUSENTE").length;
  const viewPendingCount = viewStudents.filter((s) => viewRecords[s.id] === undefined).length;

  return (
    <>
      <ModuleLayout
        theme={theme}
        onBack={onBack}
        createLabel="Pasar lista hoy"
        onCreate={() => {
          setForm({
            subjectId: "",
            sessionDate: new Date().toISOString().slice(0, 10),
          });
          setFormError(null);
          setShowCreate(true);
        }}
        canCreate={canWriteAttendance}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar por asignatura, curso o fecha..."
        onRefresh={loadData}
        loading={loading}
        error={error}
        toolbarExtra={
          !isTeacherPanel && courses.length > 0 ? (
            <select
              value={adminCourseFilter}
              onChange={(e) => setAdminCourseFilter(e.target.value)}
              className={`min-w-[200px] rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:ring-2 ${theme.focusRing}`}
              aria-label="Filtrar por curso"
            >
              <option value="">Todos los cursos</option>
              {sortById(courses).map((course) => (
                <option key={course.id} value={course.id}>
                  {formatCourseLabel(course)}
                </option>
              ))}
            </select>
          ) : undefined
        }
      >
        {isTeacherPanel && !selectedCourse && !loading && (
          <TeacherCourseRequired theme={theme} onBack={onBack} />
        )}

        {isTeacherPanel && selectedCourse && (
          <ModuleHelpBanner>
            Solo verás listas de <strong>{selectedCourse.courseLabel}</strong>. Presiona{" "}
            <strong>Pasar lista hoy</strong>, elige la materia y marca quién asistió.
          </ModuleHelpBanner>
        )}

        {auth.isReadOnlyModule("attendance") && (
          <ModuleHelpBanner>
            Solo consulta. Los docentes son quienes pasan lista y registran la asistencia de sus
            clases.
          </ModuleHelpBanner>
        )}

        {isTeacherPanel && selectedCourse && (
          <TeacherContextBar theme={theme} course={selectedCourse} />
        )}

        {(!isTeacherPanel || selectedCourse) && filteredSessions.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">✅</div>
            <p>
              {searchTerm || adminCourseFilter
                ? "No hay registros de asistencia con ese criterio o curso"
                : "No hay registros de asistencia"}
            </p>
            {canWriteAttendance ? (
              <p className="text-sm mt-2">
                Comienza presionando <strong>Pasar lista hoy</strong> y elige la materia y la fecha
              </p>
            ) : (
              <p className="text-sm mt-2">Aún no hay listas registradas por los docentes.</p>
            )}
          </div>
        )}

        {(!isTeacherPanel || selectedCourse) && filteredSessions.length > 0 && (
          <div className={theme.tableWrap}>
            <table className="w-full text-sm">
              <thead className={theme.tableHead}>
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Fecha</th>
                  <th className="px-4 py-3 text-left font-semibold">Asignatura</th>
                  {!isTeacherPanel && (
                    <th className="px-4 py-3 text-left font-semibold">Curso</th>
                  )}
                  <th className="px-4 py-3 text-center font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredSessions.map((session) => (
                  <tr key={session.id} className={`border-t border-slate-100 ${theme.tableRowHover}`}>
                    <td className="px-4 py-3 whitespace-nowrap">{session.sessionDate}</td>
                    <td className="px-4 py-3 font-medium text-slate-700">
                      {sessionSubjectLabel(session)}
                    </td>
                    {!isTeacherPanel && (
                      <td className="px-4 py-3">{sessionCourseLabel(session)}</td>
                    )}
                    <td className="px-4 py-3 text-center space-x-2">
                      <button
                        type="button"
                        onClick={() => void openViewModal(session)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                      >
                        Ver
                      </button>
                      {canWriteAttendance && (
                        <button
                          type="button"
                          onClick={() => void openAttendanceModal(session)}
                          className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                        >
                          Pasar lista
                        </button>
                      )}
                      {auth.canDelete("attendance") && (
                        <button
                          type="button"
                          onClick={async () => {
                            if (!confirm("¿Eliminar este registro de asistencia?")) return;
                            await deleteSession(session.id);
                            await loadData();
                          }}
                          className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100"
                        >
                          Eliminar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ModuleLayout>

      {showCreate && (
        <FormModal
          title="Nueva asistencia"
          subtitle="Elige la asignatura y la fecha de la clase"
          theme={theme}
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreateSession}
          error={formError}
          submitting={submitting}
          submitLabel="Continuar a pasar lista"
        >
          <FormField label="Asignatura" required>
            <select
              value={form.subjectId}
              onChange={(e) => setForm((prev) => ({ ...prev, subjectId: e.target.value }))}
              className={`${inputClass} bg-white`}
              required
            >
              <option value="">Seleccionar asignatura</option>
              {availableSubjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subjectLabel(subject)}
                </option>
              ))}
            </select>
          </FormField>
          {form.subjectId && (
            <p className="text-sm text-slate-500 -mt-2">
              Se listarán los alumnos matriculados en el curso de esta asignatura.
            </p>
          )}
          <FormField label="Fecha de la clase" required>
            <input
              type="date"
              value={form.sessionDate}
              onChange={(e) => setForm((prev) => ({ ...prev, sessionDate: e.target.value }))}
              className={inputClass}
              required
            />
          </FormField>
        </FormModal>
      )}

      {viewingSession && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[2px]"
          onClick={() => setViewingSession(null)}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="view-attendance-title"
            className="flex w-full max-w-5xl max-h-[90vh] flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-900/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`h-1 shrink-0 ${theme.accentBar}`} />
            <div className="shrink-0 border-b border-slate-100 bg-gradient-to-br from-slate-50/80 to-white px-6 py-5">
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl ${theme.iconBg} ${theme.iconText}`}
                >
                  {theme.icon}
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <h3 id="view-attendance-title" className="text-xl font-bold tracking-tight text-slate-800">
                    Ver asistencia
                  </h3>
                  <p className="mt-1 text-sm font-medium text-slate-500">
                    {sessionSubjectLabel(viewingSession)} · {sessionCourseLabel(viewingSession)} ·{" "}
                    {viewingSession.sessionDate}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingSession(null)}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-600"
                  aria-label="Cerrar"
                >
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22z" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {viewError && (
                <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50/80 px-4 py-3">
                  <p className="text-sm font-medium text-rose-700">{viewError}</p>
                </div>
              )}

              {viewLoading ? (
                <p className="text-sm text-slate-500 text-center py-10">Cargando asistencia...</p>
              ) : (
                <>
                  <div className="mb-4 flex flex-wrap gap-3 text-sm">
                    <span className="rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700 border border-emerald-200">
                      {viewPresentCount} presentes
                    </span>
                    <span className="rounded-full bg-rose-50 px-3 py-1 font-medium text-rose-700 border border-rose-200">
                      {viewAbsentCount} ausentes
                    </span>
                    {viewPendingCount > 0 && (
                      <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600 border border-slate-200">
                        {viewPendingCount} sin registrar
                      </span>
                    )}
                  </div>

                  <div className={`${theme.tableWrap} max-h-[min(24rem,50vh)] overflow-y-auto`}>
                    <table className="w-full text-sm">
                      <thead className={`${theme.tableHead} sticky top-0 z-10`}>
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Primer nombre</th>
                          <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Segundo nombre</th>
                          <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Apellido paterno</th>
                          <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Apellido materno</th>
                          <th className="px-4 py-3 text-center font-semibold whitespace-nowrap">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewStudents.map((student) => {
                          const status = viewRecords[student.id];
                          return (
                            <tr
                              key={student.id}
                              className={`border-t border-slate-100 ${theme.tableRowHover} ${
                                status === "PRESENTE"
                                  ? "bg-emerald-50/40"
                                  : status === "AUSENTE"
                                    ? "bg-rose-50/30"
                                    : ""
                              }`}
                            >
                              <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">
                                {student.firstName || "—"}
                              </td>
                              <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                                {student.secondName || "—"}
                              </td>
                              <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                                {student.lastName || "—"}
                              </td>
                              <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                                {student.motherLastName || "—"}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {status === "PRESENTE" && (
                                  <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                                    Presente
                                  </span>
                                )}
                                {status === "AUSENTE" && (
                                  <span className="inline-flex rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-800">
                                    Ausente
                                  </span>
                                )}
                                {status === undefined && (
                                  <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                                    Sin registrar
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {viewStudents.length === 0 && (
                      <p className="text-sm text-slate-500 text-center py-8">
                        No hay alumnos matriculados en el curso de esta asignatura.
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="shrink-0 border-t border-slate-100 bg-slate-50/50 px-6 py-4 flex justify-end gap-2">
              {canWriteAttendance && (
                <button
                  type="button"
                  onClick={() => {
                    const session = viewingSession;
                    setViewingSession(null);
                    if (session) void openAttendanceModal(session);
                  }}
                  className="rounded-lg border border-indigo-200 bg-indigo-50 px-5 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
                >
                  Editar lista
                </button>
              )}
              <button
                type="button"
                onClick={() => setViewingSession(null)}
                className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition ${theme.primaryBtn}`}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {activeSession && (
        <FormModal
          title="Pasar lista"
          subtitle={`${sessionSubjectLabel(activeSession)} · ${sessionCourseLabel(activeSession)} · ${activeSession.sessionDate}`}
          theme={theme}
          size="2xl"
          fullWidthContent
          onClose={() => setActiveSession(null)}
          onSubmit={(e) => {
            e.preventDefault();
            void saveAttendance();
          }}
          error={formError}
          submitting={submitting}
          submitLabel="Guardar asistencia"
        >
          <div className="flex flex-nowrap items-center justify-between gap-4 rounded-lg bg-indigo-50 border border-indigo-100 px-5 py-3">
            <p className="text-sm text-indigo-800 min-w-0">
              Marca el ticket <strong>Presente</strong> de cada alumno. Sin marcar queda{" "}
              <strong>Ausente</strong>.
            </p>
            <button
              type="button"
              onClick={markAllPresent}
              className="shrink-0 whitespace-nowrap text-xs font-medium text-indigo-700 hover:text-indigo-900 underline"
            >
              Todos presentes
            </button>
          </div>

          <p className="text-xs text-slate-500 px-1">
            {presentCount} de {activeStudents.length} presentes
          </p>

          <div className={`${theme.tableWrap} max-h-[min(28rem,55vh)] overflow-y-auto`}>
            <table className="w-full text-sm">
              <thead className={`${theme.tableHead} sticky top-0 z-10`}>
                <tr>
                  <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Primer nombre</th>
                  <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Segundo nombre</th>
                  <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Apellido paterno</th>
                  <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Apellido materno</th>
                  <th className="px-4 py-3 text-center font-semibold whitespace-nowrap w-36">Presente</th>
                </tr>
              </thead>
              <tbody>
                {activeStudents.map((student) => {
                  const isPresent = (attendanceDraft[student.id] ?? "PRESENTE") === "PRESENTE";
                  const fullName = formatStudentFullName(student);
                  return (
                    <tr
                      key={student.id}
                      className={`border-t border-slate-100 transition ${
                        isPresent ? "bg-emerald-50/50" : "bg-rose-50/40"
                      } ${theme.tableRowHover}`}
                    >
                      <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">
                        {student.firstName || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                        {student.secondName || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                        {student.lastName || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                        {student.motherLastName || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <label className="flex items-center justify-center gap-2.5 cursor-pointer">
                          <span
                            className={`text-[11px] font-bold uppercase tracking-wide ${
                              isPresent ? "text-emerald-700" : "text-rose-600"
                            }`}
                          >
                            {isPresent ? "Presente" : "Ausente"}
                          </span>
                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-md border-2 bg-white shadow-sm ${
                              isPresent ? "border-emerald-400" : "border-rose-300"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isPresent}
                              onChange={(e) => togglePresent(student.id, e.target.checked)}
                              className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/30"
                              aria-label={`Marcar presente a ${fullName}`}
                            />
                          </div>
                        </label>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {activeStudents.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-8">
                No hay alumnos matriculados en el curso de esta asignatura.
              </p>
            )}
          </div>
        </FormModal>
      )}
    </>
  );
}

export default Attendance;
