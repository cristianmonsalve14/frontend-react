import { useCallback, useEffect, useMemo, useState } from "react";
import { getGradesByStudent } from "../api/grades";
import type { Grade } from "../api/grades";
import ViewDetailModal, { type DetailField } from "../components/ViewDetailModal";
import RecordActions from "../components/RecordActions";
import ModuleLayout from "../components/ModuleLayout";
import ModuleHelpBanner from "../components/ModuleHelpBanner";
import { moduleThemes } from "../theme/moduleThemes";
import FamilyStudentPicker, { FamilyStudentRequired } from "./FamilyStudentPicker";
import FamilyStudentContextBar from "./FamilyStudentContextBar";
import { useFamilyStudent } from "./FamilyStudentContext";

interface FamilyGradesProps {
  onBack: () => void;
}

export default function FamilyGrades({ onBack }: FamilyGradesProps) {
  const theme = moduleThemes.myGrades;
  const { selectedStudent, isGuardianPanel } = useFamilyStudent();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table">("table");
  const [viewingGrade, setViewingGrade] = useState<Grade | null>(null);

  const load = useCallback(async () => {
    if (!selectedStudent) {
      setLoading(false);
      setGrades([]);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await getGradesByStudent(selectedStudent.studentId);
      setGrades(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar notas");
    } finally {
      setLoading(false);
    }
  }, [selectedStudent]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setSubjectFilter("");
    setSearchTerm("");
  }, [selectedStudent?.studentId]);

  const subjectOptions = useMemo(() => {
    const byId = new Map<number, string>();
    for (const grade of grades) {
      if (grade.subjectId && !byId.has(grade.subjectId)) {
        byId.set(grade.subjectId, grade.subjectName?.trim() || `Asignatura ${grade.subjectId}`);
      }
    }
    return [...byId.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [grades]);

  const filteredGrades = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return grades.filter((grade) => {
      if (subjectFilter && String(grade.subjectId) !== subjectFilter) {
        return false;
      }
      if (!q) return true;
      return (
        (grade.evaluationName ?? "").toLowerCase().includes(q) ||
        (grade.subjectName ?? "").toLowerCase().includes(q) ||
        (grade.gradeStatus ?? "").toLowerCase().includes(q) ||
        (grade.gradedByTeacherName ?? "").toLowerCase().includes(q)
      );
    });
  }, [grades, searchTerm, subjectFilter]);

  const detailFields = (grade: Grade): DetailField[] => [
    { label: "Evaluación", value: grade.evaluationName },
    { label: "Asignatura", value: grade.subjectName },
    { label: "Nota", value: grade.isAbsent ? "Ausente" : grade.score },
    { label: "Fecha", value: grade.gradeDate ? new Date(grade.gradeDate).toLocaleDateString("es-CL") : undefined },
    { label: "Estado", value: grade.gradeStatus },
    { label: "Calificado por", value: grade.gradedByTeacherName },
    { label: "Comentarios del docente", value: grade.teacherComments, fullWidth: true },
  ];

  const scoreLabel = (grade: Grade) => (grade.isAbsent ? "Ausente" : String(grade.score));

  return (
    <>
      <ModuleLayout
        theme={theme}
        onBack={onBack}
        createLabel=""
        onCreate={() => {}}
        canCreate={false}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar por evaluación, docente o estado..."
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onRefresh={load}
        loading={loading}
        error={error}
        toolbarExtra={
          subjectOptions.length > 0 ? (
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className={`min-w-[200px] rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:ring-2 ${theme.focusRing}`}
              aria-label="Filtrar por asignatura"
            >
              <option value="">Todas las asignaturas</option>
              {subjectOptions.map((subject) => (
                <option key={subject.id} value={String(subject.id)}>
                  {subject.name}
                </option>
              ))}
            </select>
          ) : undefined
        }
      >
        <FamilyStudentPicker theme={theme} />
        {!loading && !selectedStudent && <FamilyStudentRequired theme={theme} onBack={onBack} />}

        {selectedStudent && (
          <ModuleHelpBanner>
            Calificaciones de <strong>{selectedStudent.studentLabel}</strong> (solo lectura).
          </ModuleHelpBanner>
        )}

        {selectedStudent && !loading && (
          <FamilyStudentContextBar
            theme={theme}
            student={selectedStudent}
            isGuardianPanel={isGuardianPanel}
          />
        )}

        {selectedStudent && !loading && grades.length === 0 && (
          <div className="py-12 text-center text-slate-500">No hay notas registradas.</div>
        )}

        {selectedStudent && !loading && grades.length > 0 && filteredGrades.length === 0 && (
          <div className="py-12 text-center text-slate-500">
            <div className="mb-4 text-6xl">🔍</div>
            <p>No hay notas que coincidan con la búsqueda o el filtro de asignatura</p>
          </div>
        )}

        {selectedStudent && filteredGrades.length > 0 && viewMode === "cards" && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredGrades.map((grade) => (
              <div key={grade.id} className={theme.cardClass}>
                <div className="mb-4 text-4xl">📊</div>
                <h3 className="mb-1 text-lg font-semibold text-slate-800">{grade.evaluationName ?? "—"}</h3>
                <p className="text-sm text-slate-600">Asignatura: {grade.subjectName ?? "—"}</p>
                <p className="text-sm font-medium text-slate-700">Nota: {scoreLabel(grade)}</p>
                <p className="text-sm text-slate-600">
                  Fecha: {grade.gradeDate ? new Date(grade.gradeDate).toLocaleDateString("es-CL") : "—"}
                </p>
                <p className="text-sm text-slate-600">Estado: {grade.gradeStatus ?? "—"}</p>
                <div className="mt-4">
                  <RecordActions
                    onView={() => setViewingGrade(grade)}
                    onEdit={() => {}}
                    onDelete={() => {}}
                    canEdit={false}
                    canDelete={false}
                    compact
                    stretch
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedStudent && filteredGrades.length > 0 && viewMode === "table" && (
          <div className={theme.tableWrap}>
            <table className="w-full text-sm">
              <thead className={theme.tableHead}>
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Evaluación</th>
                  <th className="px-4 py-3 text-left font-semibold">Asignatura</th>
                  <th className="px-4 py-3 text-left font-semibold">Nota</th>
                  <th className="px-4 py-3 text-left font-semibold">Fecha</th>
                  <th className="px-4 py-3 text-left font-semibold">Estado</th>
                  <th className="px-4 py-3 text-center font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredGrades.map((grade) => (
                  <tr key={grade.id} className={`border-t border-slate-100 ${theme.tableRowHover}`}>
                    <td className="px-4 py-3 font-medium text-slate-800">{grade.evaluationName ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{grade.subjectName ?? "—"}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{scoreLabel(grade)}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {grade.gradeDate ? new Date(grade.gradeDate).toLocaleDateString("es-CL") : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{grade.gradeStatus ?? "—"}</td>
                    <td className="px-4 py-3">
                      <RecordActions
                        onView={() => setViewingGrade(grade)}
                        onEdit={() => {}}
                        onDelete={() => {}}
                        canEdit={false}
                        canDelete={false}
                        compact
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ModuleLayout>

      {viewingGrade && (
        <ViewDetailModal
          title="Detalle de la nota"
          subtitle={viewingGrade.evaluationName}
          theme={theme}
          fields={detailFields(viewingGrade)}
          onClose={() => setViewingGrade(null)}
        />
      )}
    </>
  );
}
