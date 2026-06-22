import { useCallback, useEffect, useMemo, useState } from "react";
import { getCourses } from "../api/courses";
import type { Course } from "../api/courses";
import { getEnrollmentsByStudent } from "../api/enrollments";
import type { Enrollment } from "../api/enrollments";
import { formatCourseLabel } from "../utils/formatCourseLabel";
import ViewDetailModal, { type DetailField } from "../components/ViewDetailModal";
import RecordActions from "../components/RecordActions";
import ModuleLayout from "../components/ModuleLayout";
import ModuleHelpBanner from "../components/ModuleHelpBanner";
import { moduleThemes } from "../theme/moduleThemes";
import FamilyStudentPicker, { FamilyStudentRequired } from "./FamilyStudentPicker";
import FamilyStudentContextBar from "./FamilyStudentContextBar";
import { useFamilyStudent } from "./FamilyStudentContext";

interface MyCourseProps {
  onBack: () => void;
}

interface CourseRow {
  enrollment: Enrollment;
  course: Course | null;
  courseLabel: string;
}

export default function MyCourse({ onBack }: MyCourseProps) {
  const theme = moduleThemes.myCourse;
  const { selectedStudent, isGuardianPanel } = useFamilyStudent();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<CourseRow[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [viewingRow, setViewingRow] = useState<CourseRow | null>(null);

  const load = useCallback(async () => {
    if (!selectedStudent) {
      setLoading(false);
      setRows([]);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const [enrollments, courses] = await Promise.all([
        getEnrollmentsByStudent(selectedStudent.studentId),
        getCourses(),
      ]);
      const mapped: CourseRow[] = enrollments.map((enrollment) => {
        const course = courses.find((c) => c.id === enrollment.courseId) ?? null;
        return {
          enrollment,
          course,
          courseLabel: course ? formatCourseLabel(course) : `Curso ${enrollment.courseId}`,
        };
      });
      setRows(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar el curso");
    } finally {
      setLoading(false);
    }
  }, [selectedStudent]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredRows = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return rows;
    return rows.filter((row) => {
      return (
        row.courseLabel.toLowerCase().includes(q) ||
        (row.enrollment.enrollmentStatus ?? "").toLowerCase().includes(q) ||
        (row.course?.classroom ?? "").toLowerCase().includes(q) ||
        (row.course?.shift ?? "").toLowerCase().includes(q)
      );
    });
  }, [rows, searchTerm]);

  const detailFields = (row: CourseRow): DetailField[] => [
    { label: "Curso", value: row.courseLabel },
    { label: "Nivel", value: row.course?.grade },
    { label: "Año académico", value: row.course?.academicYear },
    { label: "Jornada", value: row.course?.shift },
    { label: "Sala", value: row.course?.classroom },
    { label: "Estado del curso", value: row.course?.courseStatus },
    { label: "Estado matrícula", value: row.enrollment.enrollmentStatus },
    { label: "Fecha matrícula", value: row.enrollment.enrollmentDate },
    { label: "N° matrícula", value: row.enrollment.enrollmentNumber },
    { label: "Año matrícula", value: row.enrollment.academicYear },
    { label: "Regular", value: row.enrollment.isRegular ? "Sí" : "No" },
    { label: "Observaciones", value: row.enrollment.observations, fullWidth: true },
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
        searchPlaceholder="Buscar por curso, jornada o estado..."
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
            {isGuardianPanel ? (
              <>
                Matrículas y curso de <strong>{selectedStudent.studentLabel}</strong> (solo consulta).
              </>
            ) : (
              <>Tu información de curso y matrícula (solo consulta).</>
            )}
          </ModuleHelpBanner>
        )}

        {selectedStudent && !loading && (
          <FamilyStudentContextBar
            theme={theme}
            student={selectedStudent}
            isGuardianPanel={isGuardianPanel}
          />
        )}

        {selectedStudent && !loading && rows.length === 0 && (
          <div className="py-12 text-center text-slate-500">No hay matrículas registradas.</div>
        )}

        {selectedStudent && !loading && rows.length > 0 && filteredRows.length === 0 && (
          <div className="py-12 text-center text-slate-500">
            <div className="mb-4 text-6xl">🔍</div>
            <p>No hay resultados para la búsqueda</p>
          </div>
        )}

        {selectedStudent && filteredRows.length > 0 && viewMode === "cards" && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredRows.map((row) => (
              <div key={row.enrollment.id} className={theme.cardClass}>
                <div className="mb-4 text-4xl">📖</div>
                <h3 className="mb-2 text-xl font-semibold text-slate-800">{row.courseLabel}</h3>
                <p className="text-sm text-slate-600">Estado matrícula: {row.enrollment.enrollmentStatus ?? "—"}</p>
                <p className="text-sm text-slate-600">Jornada: {row.course?.shift ?? "—"}</p>
                <p className="text-sm text-slate-600">Sala: {row.course?.classroom ?? "—"}</p>
                <p className="text-sm text-slate-600">
                  Fecha matrícula:{" "}
                  {row.enrollment.enrollmentDate
                    ? new Date(row.enrollment.enrollmentDate).toLocaleDateString("es-CL")
                    : "—"}
                </p>
                <div className="mt-4">
                  <RecordActions
                    onView={() => setViewingRow(row)}
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

        {selectedStudent && filteredRows.length > 0 && viewMode === "table" && (
          <div className={theme.tableWrap}>
            <table className="w-full text-sm">
              <thead className={theme.tableHead}>
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Curso</th>
                  <th className="px-4 py-3 text-left font-semibold">Jornada</th>
                  <th className="px-4 py-3 text-left font-semibold">Sala</th>
                  <th className="px-4 py-3 text-left font-semibold">Estado matrícula</th>
                  <th className="px-4 py-3 text-left font-semibold">Fecha</th>
                  <th className="px-4 py-3 text-center font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.enrollment.id} className={`border-t border-slate-100 ${theme.tableRowHover}`}>
                    <td className="px-4 py-3 font-medium text-slate-800">{row.courseLabel}</td>
                    <td className="px-4 py-3 text-slate-600">{row.course?.shift ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{row.course?.classroom ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{row.enrollment.enrollmentStatus ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {row.enrollment.enrollmentDate
                        ? new Date(row.enrollment.enrollmentDate).toLocaleDateString("es-CL")
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <RecordActions
                        onView={() => setViewingRow(row)}
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

      {viewingRow && (
        <ViewDetailModal
          title="Detalle del curso"
          subtitle={viewingRow.courseLabel}
          theme={theme}
          fields={detailFields(viewingRow)}
          onClose={() => setViewingRow(null)}
        />
      )}
    </>
  );
}
