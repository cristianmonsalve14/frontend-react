import { useMemo, useState } from "react";
import type { Student } from "./api/students";
import { formatStudentFullName } from "./utils/formatStudentFullName";
import ViewDetailModal, { type DetailField } from "./components/ViewDetailModal";
import TeacherContextBar from "./components/TeacherContextBar";
import TeacherCourseRequired from "./components/TeacherCourseRequired";
import ModuleHelpBanner from "./components/ModuleHelpBanner";
import { moduleThemes } from "./theme/moduleThemes";
import ModuleLayout from "./components/ModuleLayout";
import { useTeacherCourse } from "./teacher/TeacherCourseContext";

interface MyStudentsProps {
  onBack: () => void;
}

interface ViewingStudent {
  student: Student;
  courseLabel: string;
}

function MyStudents({ onBack }: MyStudentsProps) {
  const theme = moduleThemes.myStudents;
  const teacherCourse = useTeacherCourse();
  const {
    loading,
    courseOptions,
    selectedCourse,
    courseStudents,
    refresh,
  } = teacherCourse;
  const [error] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewingStudent, setViewingStudent] = useState<ViewingStudent | null>(null);

  const filteredStudents = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return courseStudents;
    return courseStudents.filter((student) => {
      const fullName = formatStudentFullName(student).toLowerCase();
      return fullName.includes(q) || (student.rut ?? "").toLowerCase().includes(q);
    });
  }, [courseStudents, searchTerm]);

  const detailFields = (view: ViewingStudent): DetailField[] => [
    { label: "RUT", value: view.student.rut },
    { label: "Primer nombre", value: view.student.firstName },
    { label: "Segundo nombre", value: view.student.secondName },
    { label: "Apellido paterno", value: view.student.lastName },
    { label: "Apellido materno", value: view.student.motherLastName },
    { label: "Email", value: view.student.email },
    { label: "Teléfono", value: view.student.phone },
    { label: "Estado", value: view.student.studentStatus },
    { label: "Curso", value: view.courseLabel },
  ];

  return (
    <>
      <ModuleLayout
        theme={theme}
        onBack={onBack}
        createLabel=""
        onCreate={() => undefined}
        canCreate={false}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar por nombre o RUT..."
        onRefresh={refresh}
        loading={loading}
        error={error}
      >
        <ModuleHelpBanner>
          Aquí puedes consultar la lista de alumnos de tu curso. Usa la búsqueda si necesitas
          encontrar a alguien por nombre o RUT.
        </ModuleHelpBanner>

        {!loading && !selectedCourse && courseOptions.length > 0 && (
          <TeacherCourseRequired theme={theme} onBack={onBack} />
        )}

        {!loading && courseOptions.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">🎒</div>
            <p>No hay alumnos en tus cursos asignados</p>
          </div>
        )}

        {!loading && selectedCourse && (
          <>
            <TeacherContextBar theme={theme} course={selectedCourse} />

            {filteredStudents.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No hay alumnos que coincidan con la búsqueda</p>
              </div>
            ) : (
              <div className={theme.tableWrap}>
                <table className="w-full text-sm">
                  <thead className={theme.tableHead}>
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Primer nombre</th>
                      <th className="px-4 py-3 text-left font-semibold">Segundo nombre</th>
                      <th className="px-4 py-3 text-left font-semibold">Apellido paterno</th>
                      <th className="px-4 py-3 text-left font-semibold">Apellido materno</th>
                      <th className="px-4 py-3 text-left font-semibold">RUT</th>
                      <th className="px-4 py-3 text-left font-semibold">Estado</th>
                      <th className="px-4 py-3 text-center font-semibold">Detalle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student) => (
                      <tr
                        key={student.id}
                        className={`border-t border-slate-100 ${theme.tableRowHover}`}
                      >
                        <td className="px-4 py-3 font-medium text-gray-700 whitespace-nowrap">
                          {student.firstName || "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                          {student.secondName || "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                          {student.lastName || "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                          {student.motherLastName || "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{student.rut}</td>
                        <td className="px-4 py-3 text-gray-600">{student.studentStatus ?? "—"}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              setViewingStudent({
                                student,
                                courseLabel: selectedCourse.courseLabel,
                              })
                            }
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                          >
                            Ver
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </ModuleLayout>

      {viewingStudent && (
        <ViewDetailModal
          title="Detalle del alumno"
          subtitle={viewingStudent.courseLabel}
          theme={theme}
          fields={detailFields(viewingStudent)}
          onClose={() => setViewingStudent(null)}
        />
      )}
    </>
  );
}

export default MyStudents;
