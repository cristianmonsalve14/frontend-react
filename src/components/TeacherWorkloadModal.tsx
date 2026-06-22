import { useEffect } from "react";
import type { Course } from "../api/courses";
import type { Subject } from "../api/subjects";
import type { Teacher } from "../api/teachers";
import type { ModuleTheme } from "../theme/moduleThemes";
import { formatCourseLabel } from "../utils/formatCourseLabel";
import { formatRutDisplay, RUT_TABLE_CELL_CLASS } from "../utils/formatRut";

const MAX_WEEKLY_ACADEMIC_HOURS = 12;

const formatSubjectHours = (hours?: number) => {
  if (hours === undefined || hours === null || hours < 1 || hours > MAX_WEEKLY_ACADEMIC_HOURS) {
    return "—";
  }
  return `${hours} h`;
};

interface TeacherWorkloadModalProps {
  teacher: Teacher & {
    address?: string;
    commune?: string;
    city?: string;
    employeeNumber?: string;
    educationLevel?: string;
    hireDate?: string;
    contractType?: string;
  };
  subjects: Subject[];
  courses: Course[];
  theme: ModuleTheme;
  specializationLabel?: string;
  contractTypeLabel?: string;
  onClose: () => void;
}

function TeacherWorkloadModal({
  teacher,
  subjects,
  courses,
  theme,
  specializationLabel,
  contractTypeLabel,
  onClose,
}: TeacherWorkloadModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const fullName = [teacher.firstName, teacher.lastName, teacher.secondLastName]
    .filter(Boolean)
    .join(" ");

  const courseMap = new Map(courses.map((course) => [course.id, course]));

  const getCourseLabel = (courseId?: number) => {
    if (!courseId) return "Sin curso";
    const course = courseMap.get(courseId);
    return course ? formatCourseLabel(course) : `Curso ${courseId}`;
  };

  const teacherSubjects = subjects
    .filter((subject) => subject.teacherId === teacher.id)
    .sort((a, b) => {
      const courseA = getCourseLabel(a.courseId);
      const courseB = getCourseLabel(b.courseId);
      if (courseA !== courseB) return courseA.localeCompare(courseB, "es");
      return (a.subjectName ?? "").localeCompare(b.subjectName ?? "", "es");
    });

  const headTeacherCourses = courses
    .filter((course) => course.headTeacherId === teacher.id)
    .sort((a, b) => formatCourseLabel(a).localeCompare(formatCourseLabel(b), "es"));

  const totalHours = teacherSubjects.reduce((sum, subject) => sum + (subject.weeklyHours ?? 0), 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[2px]"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="teacher-workload-title"
        className="flex w-full max-w-4xl max-h-[90vh] flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-900/10"
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
              <h3 id="teacher-workload-title" className="text-xl font-bold tracking-tight text-slate-800">
                {fullName}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                <span className={RUT_TABLE_CELL_CLASS}>{formatRutDisplay(teacher.rut) || "—"}</span>
                {" · "}
                {teacher.email ?? "Sin email"} · {teacher.teacherStatus ?? "—"}
              </p>
              {specializationLabel && (
                <p className="mt-1 text-sm text-slate-500">Especialidad: {specializationLabel}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-600"
              aria-label="Cerrar"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          <section>
            <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">
              Carga horaria semanal
            </h4>
            {teacherSubjects.length > 0 ? (
              <div className={theme.tableWrap}>
                <table className="w-full text-sm">
                  <thead className={theme.tableHead}>
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Asignatura</th>
                      <th className="px-4 py-3 text-left font-semibold">Curso</th>
                      <th className="px-4 py-3 text-right font-semibold">Horas sem.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teacherSubjects.map((subject) => (
                      <tr
                        key={subject.id}
                        className={`border-t border-slate-100 ${theme.tableRowHover}`}
                      >
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {subject.subjectName}
                          {subject.subjectCode ? (
                            <span className="ml-2 text-xs font-normal text-slate-500">
                              ({subject.subjectCode})
                            </span>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {getCourseLabel(subject.courseId)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-700">
                          {formatSubjectHours(subject.weeklyHours)}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-slate-200 bg-slate-50">
                      <td colSpan={2} className="px-4 py-3 text-right font-bold text-slate-800">
                        Total semanal
                      </td>
                      <td className="px-4 py-3 text-right text-base font-bold text-slate-900">
                        {totalHours > 0 ? `${totalHours} h` : "—"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                Este docente no tiene asignaturas asignadas.
              </p>
            )}
          </section>

          {headTeacherCourses.length > 0 && (
            <section>
              <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">
                Profesor jefe de curso
              </h4>
              <ul className="space-y-2">
                {headTeacherCourses.map((course) => (
                  <li
                    key={course.id}
                    className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm font-medium text-slate-700"
                  >
                    {formatCourseLabel(course)}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">
              Datos del contrato
            </h4>
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  N° empleado
                </dt>
                <dd className="mt-1.5 text-sm font-medium text-slate-800">
                  {teacher.employeeNumber || "—"}
                </dd>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Tipo contrato
                </dt>
                <dd className="mt-1.5 text-sm font-medium text-slate-800">
                  {contractTypeLabel || teacher.contractType || "—"}
                </dd>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Fecha contrato
                </dt>
                <dd className="mt-1.5 text-sm font-medium text-slate-800">
                  {teacher.hireDate
                    ? new Date(teacher.hireDate).toLocaleDateString("es-CL")
                    : "—"}
                </dd>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Teléfono
                </dt>
                <dd className="mt-1.5 text-sm font-medium text-slate-800">{teacher.phone || "—"}</dd>
              </div>
            </dl>
          </section>
        </div>

        <div className="shrink-0 border-t border-slate-100 bg-slate-50/50 px-6 py-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition ${theme.primaryBtn}`}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

export default TeacherWorkloadModal;
