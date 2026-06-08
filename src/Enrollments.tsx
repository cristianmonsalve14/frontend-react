import { useState, useEffect } from "react";
import { getEnrollments, createEnrollment, updateEnrollment, deleteEnrollment } from "./api/enrollments";
import { getCourses } from "./api/courses";
import { getStudents } from "./api/students";
import type { Enrollment } from "./api/enrollments";
import type { Course } from "./api/courses";
import type { Student } from "./api/students";
import { formatCourseLabel } from "./utils/formatCourseLabel";
import ViewDetailModal, { type DetailField } from "./components/ViewDetailModal";
import { moduleThemes } from "./theme/moduleThemes";
import ModuleLayout from "./components/ModuleLayout";
import RecordActions from "./components/RecordActions";
import FormModal, { FormField, formInputClass } from "./components/FormModal";

const ENROLLMENT_STATUSES = [
  { value: "ACTIVO", label: "Activo" },
  { value: "SUSPENDIDO", label: "Suspendido" },
  { value: "RETIRADO", label: "Retirado" },
] as const;

const defaultAcademicYearStart = () => {
  const year = new Date().getFullYear();
  return `${year}-03-01`;
};

const yearFromDate = (dateStr?: string) => {
  if (!dateStr) return undefined;
  const year = parseInt(dateStr.slice(0, 4), 10);
  return Number.isNaN(year) ? undefined : year;
};

interface FormData {
  studentId: string;
  courseId: string;
  academicYearStart?: string;
  enrollmentDate?: string;
  enrollmentStatus?: string;
  isRegular?: boolean;
  observations?: string;
}

interface EnrollmentsProps {
  onBack: () => void;
}

function Enrollments({ onBack }: EnrollmentsProps) {
  const theme = moduleThemes.enrollments;
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingEnrollment, setEditingEnrollment] = useState<Enrollment | null>(null);
  const [formData, setFormData] = useState<FormData>({
    studentId: "",
    courseId: "",
    academicYearStart: defaultAcademicYearStart(),
    enrollmentDate: "",
    enrollmentStatus: "ACTIVO",
    isRegular: true,
    observations: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewingEnrollment, setViewingEnrollment] = useState<Enrollment | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [enrollmentsData, coursesData, studentsData] = await Promise.all([
        getEnrollments(),
        getCourses(),
        getStudents(),
      ]);
      setEnrollments(enrollmentsData);
      setCourses(coursesData);
      setStudents(studentsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar datos");
      console.error("Error cargando datos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await loadData();
    };
    void fetchData();
  }, []);

  const getStudentName = (studentId: number) => {
    const student = students.find((s) => s.id === studentId);
    return student ? `${student.firstName} ${student.lastName}` : `ID: ${studentId}`;
  };

  const getCourseName = (courseId: number) => {
    const course = courses.find((c) => c.id === courseId);
    return course ? formatCourseLabel(course) : `ID: ${courseId}`;
  };

  const getEnrollmentStatusLabel = (status?: string) =>
    ENROLLMENT_STATUSES.find((s) => s.value === status)?.label ?? status;

  const getEnrollmentDetailFields = (enrollment: Enrollment): DetailField[] => [
    { label: "Estudiante", value: getStudentName(enrollment.studentId) },
    { label: "Curso", value: getCourseName(enrollment.courseId) },
    { label: "Año académico", value: enrollment.academicYear },
    { label: "Estado", value: getEnrollmentStatusLabel(enrollment.enrollmentStatus) },
    { label: "Tipo de alumno", value: enrollment.isRegular ? "Regular" : "No regular" },
    {
      label: "Fecha de matrícula",
      value: enrollment.enrollmentDate
        ? new Date(enrollment.enrollmentDate).toLocaleDateString("es-CL")
        : undefined,
    },
    { label: "Observaciones", value: enrollment.observations },
  ];

  const filteredEnrollments = enrollments.filter((enrollment) => {
    const searchLower = searchTerm.toLowerCase();
    const studentName = (getStudentName(enrollment.studentId) ?? "").toLowerCase();
    const courseName = (getCourseName(enrollment.courseId) ?? "").toLowerCase();
    return (
      studentName.includes(searchLower) ||
      courseName.includes(searchLower) ||
      (enrollment.enrollmentStatus ?? "").toLowerCase().includes(searchLower) ||
      (enrollment.observations ?? "").toLowerCase().includes(searchLower)
    );
  });

  const openCreateModal = () => {
    setEditingEnrollment(null);
    setFormData({
      studentId: "",
      courseId: "",
      academicYearStart: defaultAcademicYearStart(),
      enrollmentDate: "",
      enrollmentStatus: "ACTIVO",
      isRegular: true,
      observations: "",
    });
    setFormError(null);
    setShowModal(true);
  };

  const openEditModal = (enrollment: Enrollment) => {
    setEditingEnrollment(enrollment);
    const course = courses.find((c) => c.id === enrollment.courseId);
    const academicYearStart = course?.academicYear
      ?? (enrollment.academicYear ? `${enrollment.academicYear}-03-01` : defaultAcademicYearStart());
    setFormData({
      studentId: enrollment.studentId?.toString() ?? "",
      courseId: enrollment.courseId?.toString() ?? "",
      academicYearStart,
      enrollmentDate: enrollment.enrollmentDate ?? "",
      enrollmentStatus: enrollment.enrollmentStatus ?? "ACTIVO",
      isRegular: enrollment.isRegular ?? true,
      observations: enrollment.observations ?? "",
    });
    setFormError(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingEnrollment(null);
    setFormData({
      studentId: "",
      courseId: "",
      academicYearStart: defaultAcademicYearStart(),
      enrollmentDate: "",
      enrollmentStatus: "ACTIVO",
      isRegular: true,
      observations: "",
    });
    setFormError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let newValue: string | boolean = value;
    if (type === "checkbox") {
      newValue = (e.target as HTMLInputElement).checked;
    }

    setFormData((prev) => {
      const next = { ...prev, [name]: newValue };

      if (name === "studentId" && typeof newValue === "string" && newValue) {
        const student = students.find((s) => s.id === parseInt(newValue, 10));
        if (student?.admissionDate) {
          next.enrollmentDate = student.admissionDate;
        }
      }

      if (name === "courseId" && typeof newValue === "string" && newValue) {
        const course = courses.find((c) => c.id === parseInt(newValue, 10));
        if (course?.academicYear) {
          next.academicYearStart = course.academicYear;
        }
      }

      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentId || !formData.courseId) {
      setFormError("Debes seleccionar un estudiante y un curso");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const enrollmentData = {
        studentId: parseInt(formData.studentId),
        courseId: parseInt(formData.courseId),
        academicYear: yearFromDate(formData.academicYearStart),
        enrollmentDate: formData.enrollmentDate || undefined,
        enrollmentStatus: formData.enrollmentStatus || "ACTIVO",
        isRegular: formData.isRegular,
        observations: formData.observations?.trim() || undefined,
      };
      if (editingEnrollment) {
        await updateEnrollment(editingEnrollment.id, enrollmentData);
      } else {
        await createEnrollment(enrollmentData);
      }
      await loadData();
      closeModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al guardar la matrícula");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (enrollment: Enrollment) => {
    if (!confirm(`¿Estás seguro de eliminar esta matrícula?`)) {
      return;
    }
    try {
      await deleteEnrollment(enrollment.id);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar la matrícula");
    }
  };

  const inputClass = formInputClass(theme);

  return (
    <>
      <ModuleLayout
        theme={theme}
        onBack={onBack}
        createLabel="Nueva Matrícula"
        onCreate={openCreateModal}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar por estudiante o curso..."
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onRefresh={loadData}
        loading={loading}
        error={error}
      >
        {enrollments.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">📋</div>
            <p className="mb-4">No hay matrículas registradas</p>
            <button
              onClick={openCreateModal}
              className={`px-6 py-3 rounded-lg transition font-medium shadow-sm ${theme.primaryBtn}`}
            >
              Crear primera matrícula
            </button>
          </div>
        )}

        {enrollments.length > 0 && filteredEnrollments.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">🔍</div>
            <p>No se encontraron matrículas con ese criterio de búsqueda</p>
          </div>
        )}

        {filteredEnrollments.length > 0 && viewMode === "cards" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEnrollments.map((enrollment) => (
              <div key={enrollment.id} className={theme.cardClass}>
                <div className="text-4xl mb-4">📋</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Matrícula #{enrollment.id}</h3>
                <p className="text-sm text-gray-600 mb-1">{getStudentName(enrollment.studentId)}</p>
                <p className="text-sm text-gray-600 mb-1">{getCourseName(enrollment.courseId)}</p>
                <p className="text-sm text-gray-600 mb-1">Año académico: {enrollment.academicYear}</p>
                <p className="text-sm text-gray-600 mb-1">Estado: {enrollment.enrollmentStatus}</p>
                <p className="text-sm text-gray-600 mb-1">Tipo: {enrollment.isRegular ? "Regular" : "No regular"}</p>
                {enrollment.enrollmentDate && (
                  <p className="text-sm text-gray-500 mb-1">
                    Matrícula: {new Date(enrollment.enrollmentDate).toLocaleDateString()}
                  </p>
                )}
                {enrollment.observations && (
                  <p className="text-sm text-gray-500 mb-1">Obs: {enrollment.observations}</p>
                )}
                <div className="mt-4">
                  <RecordActions
                    onView={() => setViewingEnrollment(enrollment)}
                    onEdit={() => openEditModal(enrollment)}
                    onDelete={() => handleDelete(enrollment)}
                    compact
                    stretch
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredEnrollments.length > 0 && viewMode === "table" && (
          <div className={theme.tableWrap}>
            <table className="w-full text-sm">
              <thead className={theme.tableHead}>
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Estudiante</th>
                  <th className="px-4 py-3 text-left font-semibold">Curso</th>
                  <th className="px-4 py-3 text-left font-semibold">Año</th>
                  <th className="px-4 py-3 text-left font-semibold">Estado</th>
                  <th className="px-4 py-3 text-left font-semibold">Tipo</th>
                  <th className="px-4 py-3 text-left font-semibold">Matrícula</th>
                  <th className="px-4 py-3 text-left font-semibold">Obs.</th>
                  <th className="px-4 py-3 text-center font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredEnrollments.map((enrollment) => (
                  <tr key={enrollment.id} className={`border-t border-slate-100 ${theme.tableRowHover}`}>
                    <td className="px-4 py-3 text-gray-700">{getStudentName(enrollment.studentId)}</td>
                    <td className="px-4 py-3 text-gray-600">{getCourseName(enrollment.courseId)}</td>
                    <td className="px-4 py-3 text-gray-600">{enrollment.academicYear}</td>
                    <td className="px-4 py-3 text-gray-600">{enrollment.enrollmentStatus}</td>
                    <td className="px-4 py-3 text-gray-600">{enrollment.isRegular ? "Regular" : "No regular"}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {enrollment.enrollmentDate ? new Date(enrollment.enrollmentDate).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{enrollment.observations}</td>
                    <td className="px-4 py-3">
                      <RecordActions
                        onView={() => setViewingEnrollment(enrollment)}
                        onEdit={() => openEditModal(enrollment)}
                        onDelete={() => handleDelete(enrollment)}
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

      {viewingEnrollment && (
        <ViewDetailModal
          title="Detalle de la matrícula"
          subtitle={`Matrícula #${viewingEnrollment.id}`}
          fields={getEnrollmentDetailFields(viewingEnrollment)}
          onClose={() => setViewingEnrollment(null)}
          theme={theme}
        />
      )}

      {showModal && (
        <FormModal
          title={editingEnrollment ? "Editar Matrícula" : "Nueva Matrícula"}
          subtitle={editingEnrollment ? "Modifica los datos de la matrícula" : "Inscribe un estudiante en un curso"}
          theme={theme}
          onClose={closeModal}
          onSubmit={handleSubmit}
          error={formError}
          submitting={submitting}
          submitLabel={editingEnrollment ? "Guardar cambios" : "Crear matrícula"}
        >
          <FormField label="Estudiante" required fullWidth>
            <select name="studentId" value={formData.studentId} onChange={handleInputChange} className={`${inputClass} bg-white`} required>
              <option value="">Seleccionar estudiante</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.firstName} {student.lastName} - {student.email}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Curso" required fullWidth>
            <select name="courseId" value={formData.courseId} onChange={handleInputChange} className={`${inputClass} bg-white`} required>
              <option value="">Seleccionar curso</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>{formatCourseLabel(course)}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Inicio año académico" hint="Se completa al elegir el curso. Corresponde al inicio del año escolar (ej. marzo).">
            <input type="date" name="academicYearStart" value={formData.academicYearStart} onChange={handleInputChange} className={inputClass} />
          </FormField>
          <FormField label="Fecha de matrícula" hint="Se sugiere desde la fecha de admisión del estudiante; puedes cambiarla si hace falta.">
            <input type="date" name="enrollmentDate" value={formData.enrollmentDate} onChange={handleInputChange} className={inputClass} />
          </FormField>
          <FormField label="Estado">
            <select name="enrollmentStatus" value={formData.enrollmentStatus} onChange={handleInputChange} className={`${inputClass} bg-white`} required>
              {ENROLLMENT_STATUSES.map((status) => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Tipo de alumno" fullWidth>
            <select
              name="isRegular"
              value={formData.isRegular ? "true" : "false"}
              onChange={(e) => setFormData((prev) => ({ ...prev, isRegular: e.target.value === "true" }))}
              className={`${inputClass} bg-white`}
            >
              <option value="true">Regular (cursa el año completo en el curso)</option>
              <option value="false">No regular (reingreso, traslado u otra situación)</option>
            </select>
          </FormField>
          <FormField label="Observaciones" fullWidth>
            <textarea name="observations" value={formData.observations} onChange={handleInputChange} className={inputClass} rows={3} />
          </FormField>
        </FormModal>
      )}
    </>
  );
}

export default Enrollments;
