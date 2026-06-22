import type { ModuleTheme } from "../theme/moduleThemes";
import type { TeacherCourseOption } from "../teacher/TeacherCourseContext";

interface TeacherCoursePickerProps {
  theme: ModuleTheme;
  courseOptions: TeacherCourseOption[];
  selectedCourseId: number | null;
  onSelect: (courseId: number) => void;
  onClose?: () => void;
  title?: string;
  subtitle?: string;
}

function TeacherCoursePicker({
  theme,
  courseOptions,
  selectedCourseId,
  onSelect,
  onClose,
  title = "¿En qué curso trabajas hoy?",
  subtitle = "Elige el curso para continuar. Este curso quedará seleccionado en todas las secciones.",
}: TeacherCoursePickerProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[2px]"
      onClick={() => onClose?.()}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="teacher-course-picker-title"
        className="flex w-full max-w-lg max-h-[90vh] flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-900/10"
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
              <h3 id="teacher-course-picker-title" className="text-xl font-bold tracking-tight text-slate-800">
                {title}
              </h3>
              <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
            </div>
            {onClose && selectedCourseId !== null && (
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
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
          {courseOptions.map((option) => (
            <button
              key={option.courseId}
              type="button"
              onClick={() => onSelect(option.courseId)}
              className={`w-full rounded-xl border-2 px-5 py-5 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
                selectedCourseId === option.courseId
                  ? "border-teal-400 bg-teal-50 shadow-sm"
                  : "border-slate-200 bg-white hover:border-teal-200"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-slate-800">{option.courseLabel}</p>
                  <p className="mt-1 text-sm text-slate-500">{option.roleLabel}</p>
                </div>
                <span className="shrink-0 rounded-full bg-teal-100 px-3 py-1.5 text-sm font-bold text-teal-800">
                  {option.studentCount} alumno{option.studentCount !== 1 ? "s" : ""}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TeacherCoursePicker;
