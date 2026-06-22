import type { ModuleTheme } from "../theme/moduleThemes";

interface TeacherCourseRequiredProps {
  theme: ModuleTheme;
  onBack: () => void;
}

/** Bloquea el módulo docente hasta que elija curso activo en el inicio del panel. */
function TeacherCourseRequired({ theme, onBack }: TeacherCourseRequiredProps) {
  return (
    <div className="text-center py-16 text-gray-500">
      <div className="text-6xl mb-4">🎒</div>
      <p className="text-lg font-medium text-slate-700 mb-2">Primero elige tu curso activo</p>
      <p className="text-sm max-w-md mx-auto mb-6">
        En el <strong>inicio del Panel Docente</strong> selecciona el curso con el que trabajarás hoy
        (ej. 1° Medio A o 2° Medio B). Luego vuelve a este módulo.
      </p>
      <button
        type="button"
        onClick={onBack}
        className={`px-6 py-3 rounded-lg text-base font-semibold ${theme.primaryBtn}`}
      >
        Ir al inicio del panel
      </button>
    </div>
  );
}

export default TeacherCourseRequired;
