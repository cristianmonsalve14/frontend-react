import type { ModuleTheme } from "../theme/moduleThemes";
import type { FamilyStudentOption } from "./FamilyStudentContext";

interface FamilyStudentContextBarProps {
  theme: ModuleTheme;
  student: FamilyStudentOption;
  isGuardianPanel: boolean;
}

export default function FamilyStudentContextBar({
  theme,
  student,
  isGuardianPanel,
}: FamilyStudentContextBarProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5">
      <span className="text-sm font-medium text-slate-500">
        {isGuardianPanel ? "Alumno:" : "Consultando:"}
      </span>
      <span className="text-base font-bold text-slate-800">{student.studentLabel}</span>
      <span
        className={`rounded-full border bg-white px-2.5 py-0.5 text-xs font-semibold ${theme.iconText}`}
      >
        Solo lectura
      </span>
    </div>
  );
}
