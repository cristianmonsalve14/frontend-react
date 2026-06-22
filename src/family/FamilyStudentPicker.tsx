import type { ModuleTheme } from "../theme/moduleThemes";
import { useFamilyStudent } from "./FamilyStudentContext";

interface FamilyStudentPickerProps {
  theme: ModuleTheme;
}

export default function FamilyStudentPicker({ theme }: FamilyStudentPickerProps) {
  const family = useFamilyStudent();

  if (!family.isGuardianPanel || family.studentOptions.length <= 1) {
    return null;
  }

  return (
    <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="family-student-picker">
        ¿De qué alumno quieres ver la información?
      </label>
      <select
        id="family-student-picker"
        value={family.selectedStudentId ?? ""}
        onChange={(e) => {
          const value = e.target.value;
          if (value) family.selectStudent(parseInt(value, 10));
        }}
        className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:ring-2 ${theme.focusRing}`}
      >
        <option value="">— Selecciona un alumno —</option>
        {family.studentOptions.map((option) => (
          <option key={option.studentId} value={option.studentId}>
            {option.studentLabel}
          </option>
        ))}
      </select>
    </div>
  );
}

interface FamilyStudentRequiredProps {
  theme: ModuleTheme;
  onBack: () => void;
}

export function FamilyStudentRequired({ theme, onBack }: FamilyStudentRequiredProps) {
  const family = useFamilyStudent();

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-8 text-center">
      <div className="mb-3 text-4xl">🔗</div>
      {!family.linked ? (
        <>
          <h3 className="mb-2 text-lg font-semibold text-amber-900">Cuenta sin vincular</h3>
          <p className="mb-4 text-sm text-amber-800">
            Tu usuario no está vinculado a un registro académico. El administrador debe usar el
            mismo <strong>email</strong> en el apoderado o estudiante.
          </p>
        </>
      ) : (
        <>
          <h3 className="mb-2 text-lg font-semibold text-amber-900">Selecciona un alumno</h3>
          <p className="mb-4 text-sm text-amber-800">
            Elige el alumno antes de consultar notas, asistencia o anotaciones.
          </p>
        </>
      )}
      <button type="button" onClick={onBack} className={`rounded-lg px-4 py-2 text-sm font-medium ${theme.primaryBtn}`}>
        Volver al inicio
      </button>
    </div>
  );
}
