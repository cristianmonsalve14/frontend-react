import { useCallback, useEffect, useMemo, useState } from "react";
import { getStudents, type Student } from "../api/students";
import { getEnrollments } from "../api/enrollments";
import type { Enrollment } from "../api/enrollments";
import { getCourses } from "../api/courses";
import type { Course } from "../api/courses";
import { formatCourseLabel } from "../utils/formatCourseLabel";
import { formatStudentFullName } from "../utils/formatStudentFullName";
import ViewDetailModal, { type DetailField } from "../components/ViewDetailModal";
import RecordActions from "../components/RecordActions";
import ModuleLayout from "../components/ModuleLayout";
import ModuleHelpBanner from "../components/ModuleHelpBanner";
import { moduleThemes } from "../theme/moduleThemes";
import { FamilyStudentRequired } from "./FamilyStudentPicker";
import { useFamilyStudent } from "./FamilyStudentContext";

interface MyChildrenProps {
  onBack: () => void;
}

interface ChildRow {
  student: Student;
  courseLabel: string;
}

function activeCourseLabel(
  studentId: number,
  enrollments: Enrollment[],
  courses: Course[],
): string {
  const enrollment =
    enrollments.find(
      (e) => e.studentId === studentId && e.enrollmentStatus === "ACTIVO",
    ) ?? enrollments.find((e) => e.studentId === studentId);
  if (!enrollment?.courseId) return "Sin curso";
  const course = courses.find((c) => c.id === enrollment.courseId);
  return course ? formatCourseLabel(course) : `Curso ${enrollment.courseId}`;
}

export default function MyChildren({ onBack }: MyChildrenProps) {
  const theme = moduleThemes.myChildren;
  const { linked, refresh: refreshFamily } = useFamilyStudent();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [viewingChild, setViewingChild] = useState<ChildRow | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [studentsData, enrollmentsData, coursesData] = await Promise.all([
        getStudents(),
        getEnrollments(),
        getCourses(),
      ]);
      setStudents(studentsData);
      setEnrollments(enrollmentsData);
      setCourses(coursesData);
      await refreshFamily();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar hijos");
    } finally {
      setLoading(false);
    }
  }, [refreshFamily]);

  useEffect(() => {
    void load();
  }, [load]);

  const childrenRows: ChildRow[] = useMemo(
    () =>
      students.map((student) => ({
        student,
        courseLabel: activeCourseLabel(student.id, enrollments, courses),
      })),
    [students, enrollments, courses],
  );

  const filteredChildren = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return childrenRows;
    return childrenRows.filter(({ student, courseLabel }) => {
      const fullName = formatStudentFullName(student).toLowerCase();
      return (
        fullName.includes(q) ||
        (student.rut ?? "").toLowerCase().includes(q) ||
        (student.email ?? "").toLowerCase().includes(q) ||
        courseLabel.toLowerCase().includes(q)
      );
    });
  }, [childrenRows, searchTerm]);

  const detailFields = (row: ChildRow): DetailField[] => [
    { label: "RUT", value: row.student.rut },
    { label: "Primer nombre", value: row.student.firstName },
    { label: "Segundo nombre", value: row.student.secondName },
    { label: "Apellido paterno", value: row.student.lastName },
    { label: "Apellido materno", value: row.student.motherLastName },
    { label: "Email", value: row.student.email },
    { label: "Teléfono", value: row.student.phone },
    { label: "N° matrícula", value: row.student.enrollmentNumber },
    { label: "Estado", value: row.student.studentStatus },
    { label: "Curso", value: row.courseLabel },
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
        searchPlaceholder="Buscar por nombre, RUT, email o curso..."
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onRefresh={load}
        loading={loading}
        error={error}
      >
        <ModuleHelpBanner>
          Alumnos vinculados a tu cuenta de apoderado. Puedes buscar, cambiar entre tarjetas y
          tabla, y ver el detalle de cada hijo (solo consulta).
        </ModuleHelpBanner>

        {!loading && !linked && <FamilyStudentRequired theme={theme} onBack={onBack} />}

        {!loading && linked && childrenRows.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            <div className="mb-4 text-6xl">👪</div>
            <p>No hay alumnos vinculados a tu cuenta</p>
          </div>
        )}

        {!loading && linked && childrenRows.length > 0 && filteredChildren.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            <div className="mb-4 text-6xl">🔍</div>
            <p>No hay alumnos que coincidan con la búsqueda</p>
          </div>
        )}

        {!loading && filteredChildren.length > 0 && viewMode === "cards" && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredChildren.map((row) => (
              <div key={row.student.id} className={theme.cardClass}>
                <div className="mb-3 text-4xl">👨‍🎓</div>
                <h3 className="mb-2 text-lg font-semibold text-slate-800">
                  {formatStudentFullName(row.student)}
                </h3>
                <p className="text-sm text-slate-600">RUT: {row.student.rut ?? "—"}</p>
                <p className="text-sm text-slate-600">Email: {row.student.email ?? "—"}</p>
                <p className="text-sm text-slate-600">Teléfono: {row.student.phone ?? "—"}</p>
                <p className="text-sm text-slate-600">Curso: {row.courseLabel}</p>
                <p className="text-sm text-slate-600">
                  N° matrícula: {row.student.enrollmentNumber ?? "Pendiente"}
                </p>
                <p className="text-sm text-slate-600">Estado: {row.student.studentStatus ?? "—"}</p>
                <div className="mt-4">
                  <RecordActions
                    onView={() => setViewingChild(row)}
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

        {!loading && filteredChildren.length > 0 && viewMode === "table" && (
          <div className={theme.tableWrap}>
            <table className="w-full text-sm">
              <thead className={theme.tableHead}>
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Primer nombre</th>
                  <th className="px-4 py-3 text-left font-semibold">Segundo nombre</th>
                  <th className="px-4 py-3 text-left font-semibold">Apellido paterno</th>
                  <th className="px-4 py-3 text-left font-semibold">Apellido materno</th>
                  <th className="px-4 py-3 text-left font-semibold">RUT</th>
                  <th className="px-4 py-3 text-left font-semibold">Curso</th>
                  <th className="px-4 py-3 text-left font-semibold">Estado</th>
                  <th className="px-4 py-3 text-center font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredChildren.map((row) => (
                  <tr
                    key={row.student.id}
                    className={`border-t border-slate-100 ${theme.tableRowHover}`}
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-700">
                      {row.student.firstName || "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      {row.student.secondName || "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      {row.student.lastName || "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      {row.student.motherLastName || "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      {row.student.rut ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{row.courseLabel}</td>
                    <td className="px-4 py-3 text-gray-600">{row.student.studentStatus ?? "—"}</td>
                    <td className="px-4 py-3">
                      <RecordActions
                        onView={() => setViewingChild(row)}
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

      {viewingChild && (
        <ViewDetailModal
          title="Detalle del alumno"
          subtitle={formatStudentFullName(viewingChild.student)}
          theme={theme}
          fields={detailFields(viewingChild)}
          onClose={() => setViewingChild(null)}
        />
      )}
    </>
  );
}
