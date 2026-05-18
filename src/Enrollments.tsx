import { useState, useEffect } from "react";
import { getEnrollments, createEnrollment, updateEnrollment, deleteEnrollment } from "./api/enrollments";
import { getCourses } from "./api/courses";
import { getStudents } from "./api/students";
import type { Enrollment } from "./api/enrollments";
import type { Course } from "./api/courses";
import type { Student } from "./api/students";

interface FormData {
  studentId: string;
  courseId: string;
  academicYear?: string;
  enrollmentDate?: string;
  enrollmentStatus?: string;
  isRegular?: boolean;
  observations?: string;
}

interface EnrollmentsProps {
  onBack: () => void;
}

function Enrollments({ onBack }: EnrollmentsProps) {
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
    academicYear: "",
    enrollmentDate: "",
    enrollmentStatus: "",
    isRegular: true,
    observations: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [searchTerm, setSearchTerm] = useState("");

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
    return course?.name || `ID: ${courseId}`;
  };

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
      academicYear: "",
      enrollmentDate: "",
      enrollmentStatus: "",
      isRegular: true,
      observations: "",
    });
    setFormError(null);
    setShowModal(true);
  };

  const openEditModal = (enrollment: Enrollment) => {
    setEditingEnrollment(enrollment);
    setFormData({
      studentId: enrollment.studentId?.toString() ?? "",
      courseId: enrollment.courseId?.toString() ?? "",
      academicYear: enrollment.academicYear?.toString() ?? "",
      enrollmentDate: enrollment.enrollmentDate ?? "",
      enrollmentStatus: enrollment.enrollmentStatus ?? "",
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
      academicYear: "",
      enrollmentDate: "",
      enrollmentStatus: "",
      isRegular: true,
      observations: "",
    });
    setFormError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let newValue: string | boolean = value;
    if (type === "checkbox") {
      // Solo los input checkbox tienen la propiedad checked
      newValue = (e.target as HTMLInputElement).checked;
    }
    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));
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
        academicYear: formData.academicYear ? parseInt(formData.academicYear) : undefined,
        enrollmentDate: formData.enrollmentDate || undefined,
        enrollmentStatus: formData.enrollmentStatus?.trim() || undefined,
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition font-medium shadow-sm"
          >
            ← Volver
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-md p-8 border border-gray-100">
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-700 mb-2">📋 Matrículas</h2>
                <p className="text-gray-500">Gestión de matrículas de estudiantes</p>
              </div>
              <button
                onClick={openCreateModal}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium shadow-sm flex items-center gap-2"
              >
                <span>➕</span>
                Nueva Matrícula
              </button>
            </div>

            {/* Barra de herramientas */}
            <div className="flex gap-3 items-center flex-wrap">
              {/* Búsqueda */}
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="🔍 Buscar por estudiante o curso..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                />
              </div>

              {/* Toggle Vista */}
              <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("cards")}
                  className={`px-4 py-2 rounded-lg transition font-medium flex items-center gap-2 ${
                    viewMode === "cards"
                      ? "bg-orange-500 text-white"
                      : "text-gray-600 hover:bg-gray-200"
                  }`}
                  title="Vista de tarjetas"
                >
                  <span>🔲</span>
                  Tarjetas
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`px-4 py-2 rounded-lg transition font-medium flex items-center gap-2 ${
                    viewMode === "table"
                      ? "bg-orange-500 text-white"
                      : "text-gray-600 hover:bg-gray-200"
                  }`}
                  title="Vista de tabla"
                >
                  <span>📋</span>
                  Tabla
                </button>
              </div>

              {/* Botón Refrescar */}
              <button
                onClick={loadData}
                disabled={loading}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition font-medium shadow-sm disabled:opacity-50 flex items-center gap-2"
                title="Actualizar listado"
              >
                <span>🔄</span>
                Actualizar
              </button>
            </div>
          </div>
          
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400"></div>
              <p className="mt-4 text-gray-500">Cargando matrículas...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-600">❌ {error}</p>
            </div>
          )}

          {!loading && !error && enrollments.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">📋</div>
              <p className="mb-4">No hay matrículas registradas</p>
              <button
                onClick={openCreateModal}
                className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium shadow-sm"
              >
                Crear primera matrícula
              </button>
            </div>
          )}

          {!loading && !error && enrollments.length > 0 && filteredEnrollments.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">🔍</div>
              <p>No se encontraron matrículas con ese criterio de búsqueda</p>
            </div>
          )}

          {!loading && !error && filteredEnrollments.length > 0 && viewMode === "cards" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEnrollments.map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition bg-gradient-to-br from-orange-50 to-amber-50"
                >
                  <div className="text-4xl mb-4">📋</div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    Matrícula #{enrollment.id}
                  </h3>
                  <p className="text-sm text-gray-600 mb-1">👨‍🎓 {getStudentName(enrollment.studentId)}</p>
                  <p className="text-sm text-gray-600 mb-1">📖 {getCourseName(enrollment.courseId)}</p>
                  <p className="text-sm text-gray-600 mb-1">Año académico: {enrollment.academicYear}</p>
                  <p className="text-sm text-gray-600 mb-1">Estado: {enrollment.enrollmentStatus}</p>
                  <p className="text-sm text-gray-600 mb-1">Regular: {enrollment.isRegular ? "Sí" : "No"}</p>
                  {enrollment.enrollmentDate && (
                    <p className="text-sm text-gray-500 mb-1">📅 Matrícula: {new Date(enrollment.enrollmentDate).toLocaleDateString()}</p>
                  )}
                  {enrollment.observations && (
                    <p className="text-sm text-gray-500 mb-1">Obs: {enrollment.observations}</p>
                  )}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => openEditModal(enrollment)}
                      className="flex-1 px-3 py-2 bg-yellow-400 text-white rounded-lg hover:bg-yellow-500 transition font-medium text-sm"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => handleDelete(enrollment)}
                      className="flex-1 px-3 py-2 bg-red-400 text-white rounded-lg hover:bg-red-500 transition font-medium text-sm"
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Vista de Tabla */}
          {!loading && !error && filteredEnrollments.length > 0 && viewMode === "table" && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-orange-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Estudiante</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Curso</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Año</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Estado</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Regular</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Matrícula</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Obs.</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredEnrollments.map((enrollment) => (
                    <tr key={enrollment.id} className="hover:bg-orange-50 transition">
                      <td className="px-4 py-3 text-sm text-gray-700">{getStudentName(enrollment.studentId)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{getCourseName(enrollment.courseId)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{enrollment.academicYear}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{enrollment.enrollmentStatus}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{enrollment.isRegular ? "Sí" : "No"}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{enrollment.enrollmentDate ? new Date(enrollment.enrollmentDate).toLocaleDateString() : "-"}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{enrollment.observations}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => openEditModal(enrollment)}
                            className="px-3 py-1 bg-yellow-400 text-white rounded-lg hover:bg-yellow-500 transition font-medium text-xs"
                          >
                            ✏️ Editar
                          </button>
                          <button
                            onClick={() => handleDelete(enrollment)}
                            className="px-3 py-1 bg-red-400 text-white rounded-lg hover:bg-red-500 transition font-medium text-xs"
                          >
                            🗑️ Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Formulario */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 z-50 min-h-screen">
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-lg p-4 sm:p-6"
            style={{
              maxHeight: '90vh',
              overflowY: 'auto',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
            }}
          >
            <h3 className="text-2xl font-bold text-gray-700 mb-4">
              {editingEnrollment ? "Editar Matrícula" : "Crear Nueva Matrícula"}
            </h3>
            {formError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-red-600 text-sm">❌ {formError}</p>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Estudiante *</label>
                <select
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                  required
                >
                  <option value="">Seleccionar estudiante</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.firstName} {student.lastName} - {student.email}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Curso *</label>
                <select
                  name="courseId"
                  value={formData.courseId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                  required
                >
                  <option value="">Seleccionar curso</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Año académico</label>
                <input
                  type="number"
                  name="academicYear"
                  value={formData.academicYear}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                  min="0"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Fecha de Matrícula</label>
                <input
                  type="date"
                  name="enrollmentDate"
                  value={formData.enrollmentDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Estado</label>
                <input
                  type="text"
                  name="enrollmentStatus"
                  value={formData.enrollmentStatus}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                />
              </div>
              <div className="mb-4 flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="isRegular"
                    checked={!!formData.isRegular}
                    onChange={handleInputChange}
                  />
                  Regular
                </label>
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">Observaciones</label>
                <textarea
                  name="observations"
                  value={formData.observations}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                  rows={2}
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition font-medium disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium disabled:opacity-50"
                >
                  {submitting ? "Guardando..." : editingEnrollment ? "Actualizar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Enrollments;
