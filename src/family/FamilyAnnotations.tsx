import { useCallback, useEffect, useMemo, useState } from "react";
import { getAnnotationsByStudent } from "../api/annotations";
import type { Annotation } from "../api/annotations";
import ViewDetailModal, { type DetailField } from "../components/ViewDetailModal";
import RecordActions from "../components/RecordActions";
import ModuleLayout from "../components/ModuleLayout";
import ModuleHelpBanner from "../components/ModuleHelpBanner";
import { moduleThemes } from "../theme/moduleThemes";
import FamilyStudentPicker, { FamilyStudentRequired } from "./FamilyStudentPicker";
import FamilyStudentContextBar from "./FamilyStudentContextBar";
import { useFamilyStudent } from "./FamilyStudentContext";

interface FamilyAnnotationsProps {
  onBack: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  POSITIVA: "Positiva",
  NEGATIVA: "Negativa",
};

export default function FamilyAnnotations({ onBack }: FamilyAnnotationsProps) {
  const theme = moduleThemes.myAnnotations;
  const { selectedStudent, isGuardianPanel } = useFamilyStudent();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [viewingAnnotation, setViewingAnnotation] = useState<Annotation | null>(null);

  const load = useCallback(async () => {
    if (!selectedStudent) {
      setLoading(false);
      setAnnotations([]);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await getAnnotationsByStudent(selectedStudent.studentId);
      setAnnotations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar anotaciones");
    } finally {
      setLoading(false);
    }
  }, [selectedStudent]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredAnnotations = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return annotations;
    return annotations.filter((annotation) => {
      const typeLabel = (TYPE_LABELS[annotation.type] ?? annotation.type).toLowerCase();
      return (
        typeLabel.includes(q) ||
        (annotation.description ?? "").toLowerCase().includes(q) ||
        (annotation.teacherName ?? "").toLowerCase().includes(q)
      );
    });
  }, [annotations, searchTerm]);

  const typeLabel = (type: string) => TYPE_LABELS[type] ?? type;

  const detailFields = (annotation: Annotation): DetailField[] => [
    { label: "Tipo", value: typeLabel(annotation.type) },
    { label: "Fecha", value: annotation.annotationDate ? new Date(annotation.annotationDate).toLocaleDateString("es-CL") : undefined },
    { label: "Docente", value: annotation.teacherName },
    { label: "Alumno", value: annotation.studentName ?? selectedStudent?.studentLabel },
    { label: "Descripción", value: annotation.description, fullWidth: true },
    { label: "Registrado", value: annotation.createdAt ? new Date(annotation.createdAt).toLocaleString("es-CL") : undefined },
  ];

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
        searchPlaceholder="Buscar por tipo, descripción o docente..."
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onRefresh={load}
        loading={loading}
        error={error}
      >
        <FamilyStudentPicker theme={theme} />
        {!loading && !selectedStudent && <FamilyStudentRequired theme={theme} onBack={onBack} />}

        {selectedStudent && (
          <ModuleHelpBanner>
            Anotaciones de <strong>{selectedStudent.studentLabel}</strong> (solo consulta).
          </ModuleHelpBanner>
        )}

        {selectedStudent && !loading && (
          <FamilyStudentContextBar
            theme={theme}
            student={selectedStudent}
            isGuardianPanel={isGuardianPanel}
          />
        )}

        {selectedStudent && !loading && annotations.length === 0 && (
          <div className="py-12 text-center text-slate-500">No hay anotaciones registradas.</div>
        )}

        {selectedStudent && !loading && annotations.length > 0 && filteredAnnotations.length === 0 && (
          <div className="py-12 text-center text-slate-500">
            <div className="mb-4 text-6xl">🔍</div>
            <p>No hay anotaciones que coincidan con la búsqueda</p>
          </div>
        )}

        {selectedStudent && filteredAnnotations.length > 0 && viewMode === "cards" && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredAnnotations.map((annotation) => (
              <div key={annotation.id} className={theme.cardClass}>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-3xl">{annotation.type === "POSITIVA" ? "⭐" : "⚠️"}</span>
                  <span className="text-sm text-slate-500">
                    {annotation.annotationDate
                      ? new Date(annotation.annotationDate).toLocaleDateString("es-CL")
                      : "—"}
                  </span>
                </div>
                <h3 className="mb-1 text-lg font-semibold text-slate-800">{typeLabel(annotation.type)}</h3>
                <p className="text-sm text-slate-600">Docente: {annotation.teacherName ?? "—"}</p>
                <p className="mt-2 line-clamp-3 text-sm text-slate-600">
                  {annotation.description ?? "Sin descripción"}
                </p>
                <div className="mt-4">
                  <RecordActions
                    onView={() => setViewingAnnotation(annotation)}
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

        {selectedStudent && filteredAnnotations.length > 0 && viewMode === "table" && (
          <div className={theme.tableWrap}>
            <table className="w-full text-sm">
              <thead className={theme.tableHead}>
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Tipo</th>
                  <th className="px-4 py-3 text-left font-semibold">Fecha</th>
                  <th className="px-4 py-3 text-left font-semibold">Docente</th>
                  <th className="px-4 py-3 text-left font-semibold">Descripción</th>
                  <th className="px-4 py-3 text-center font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredAnnotations.map((annotation) => (
                  <tr key={annotation.id} className={`border-t border-slate-100 ${theme.tableRowHover}`}>
                    <td className="px-4 py-3 font-medium text-slate-800">{typeLabel(annotation.type)}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {annotation.annotationDate
                        ? new Date(annotation.annotationDate).toLocaleDateString("es-CL")
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{annotation.teacherName ?? "—"}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-slate-600">
                      {annotation.description ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <RecordActions
                        onView={() => setViewingAnnotation(annotation)}
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

      {viewingAnnotation && (
        <ViewDetailModal
          title="Detalle de anotación"
          subtitle={typeLabel(viewingAnnotation.type)}
          theme={theme}
          fields={detailFields(viewingAnnotation)}
          onClose={() => setViewingAnnotation(null)}
        />
      )}
    </>
  );
}
