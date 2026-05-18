import { useState, useEffect } from "react";
import { getCourses, createCourse, updateCourse, deleteCourse } from "./api/courses";
import { getTeachers } from "./api/teachers";
import type { Course, CreateCourseDto } from "./api/courses";
import type { Teacher } from "./api/teachers";

interface FormData {
  name: string;
  grade: string;
  academicYear: string;
  headTeacherId?: string;
  classroom?: string;
  courseStatus?: string;
}

interface CoursesProps {
  onBack: () => void;
}

function Courses({ onBack }: CoursesProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    grade: "",
    academicYear: "",
    headTeacherId: "",
    classroom: "",
    courseStatus: "ACTIVO",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [searchTerm, setSearchTerm] = useState("");

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const coursesData = await getCourses();
      setCourses(coursesData);
      
      // Intentar cargar profesores, pero no fallar si no existe el endpoint
      try {
        const teachersData = await getTeachers();
        setTeachers(teachersData);
      } catch (teacherErr) {
        console.warn("No se pudieron cargar los profesores:", teacherErr);
        setTeachers([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar cursos");
      console.error("Error cargando cursos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await loadCourses();
    };
    void fetchData();
  }, []);

  const getTeacherName = (teacherId?: number) => {
    if (teacherId === undefined || teacherId === null) return "Sin profesor jefe";
    const teacher = teachers.find((t) => t.id === teacherId);
    if (!teacher) return `ID: ${teacherId}`;
    return [teacher.firstName, teacher.lastName].filter(Boolean).join(" ");
  };

  const filteredCourses = courses.filter((course) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (course.grade ?? "").toLowerCase().includes(searchLower) ||
      (course.section ?? "").toLowerCase().includes(searchLower) ||
      (course.shift ?? "").toLowerCase().includes(searchLower) ||
      (course.level ?? "").toLowerCase().includes(searchLower) ||
      (course.academicYear && course.academicYear.toString().includes(searchLower))
    );
  });

  const openCreateModal = () => {
    setEditingCourse(null);
    setFormData({
      name: "",
      grade: "",
      academicYear: "",
      headTeacherId: "",
      classroom: "",
      courseStatus: "ACTIVO",
    });
    setFormError(null);
    setShowModal(true);
  };

  const openEditModal = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      name: course.name ?? "",
      grade: course.grade ?? "",
      academicYear: course.academicYear ? course.academicYear.substring(0, 4) : "", // solo año
      headTeacherId: course.headTeacherId?.toString() ?? "",
      classroom: course.classroom ?? "",
      courseStatus: course.courseStatus ?? "ACTIVO",
    });
    setFormError(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCourse(null);
    setFormData({
      name: "",
      grade: "",
      academicYear: "",
      headTeacherId: "",
      classroom: "",
      courseStatus: "ACTIVO",
    });
    setFormError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.grade.trim() || !formData.academicYear.trim()) {
      setFormError("Nombre, grado y año académico son obligatorios");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      // Transforma el año a fecha yyyy-01-01
      const academicYearDate = formData.academicYear.match(/^\d{4}$/)
        ? `${formData.academicYear}-01-01`
        : formData.academicYear;
      const courseData: CreateCourseDto = {
        name: formData.name.trim(),
        grade: formData.grade.trim(),
        academicYear: academicYearDate,
        headTeacherId: formData.headTeacherId && formData.headTeacherId !== "" ? parseInt(formData.headTeacherId) : null,
        classroom: formData.classroom?.trim() || undefined,
        courseStatus: formData.courseStatus?.trim() || "ACTIVO",
      };
      if (editingCourse) {
        await updateCourse(editingCourse.id, courseData);
      } else {
        await createCourse(courseData);
      }
      await loadCourses();
      closeModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al guardar el curso");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (course: Course) => {
    if (!confirm(`¿Estás seguro de eliminar el curso "${course.name ?? course.grade}"?`)) {
      return;
    }

    try {
      await deleteCourse(course.id);
      await loadCourses();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar el curso");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
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
                <h2 className="text-3xl font-bold text-gray-700 mb-2">Mis Cursos</h2>
                <p className="text-gray-500">Bienvenido al sistema de gestión académica</p>
              </div>
              <button
                onClick={openCreateModal}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium shadow-sm flex items-center gap-2"
              >
                <span>➕</span>
                Nuevo Curso
              </button>
            </div>

            {/* Barra de herramientas */}
            <div className="flex gap-3 items-center flex-wrap">
              {/* Búsqueda */}
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="🔍 Buscar por nombre o año..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
              </div>

              {/* Toggle Vista */}
              <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("cards")}
                  className={`px-4 py-2 rounded-lg transition font-medium flex items-center gap-2 ${
                    viewMode === "cards"
                      ? "bg-blue-500 text-white"
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
                      ? "bg-blue-500 text-white"
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
                onClick={loadCourses}
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
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
              <p className="mt-4 text-gray-500">Cargando cursos...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-600">❌ {error}</p>
            </div>
          )}

          {!loading && !error && courses.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">📚</div>
              <p className="mb-4">No hay cursos disponibles</p>
              <button
                onClick={openCreateModal}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium shadow-sm"
              >
                Crear primer curso
              </button>
            </div>
          )}

          {!loading && !error && courses.length > 0 && filteredCourses.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">🔍</div>
              <p className="mb-2">No se encontraron cursos</p>
              <p className="text-sm">Intenta con otro término de búsqueda</p>
            </div>
          )}

          {!loading && !error && filteredCourses.length > 0 && viewMode === "cards" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <div
                  key={course.id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition bg-gradient-to-br from-blue-50 to-indigo-50"
                >
                  <div className="text-4xl mb-4">📖</div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    {`${course.name ? course.name + ' - ' : ''}${course.grade}`.trim()}
                  </h3>
                  <p className="text-sm text-gray-600 mb-1">Año: {course.academicYear ? course.academicYear.substring(0, 4) : ""}</p>
                  <p className="text-sm text-gray-600 mb-1">Profesor Jefe: {getTeacherName(course.headTeacherId)}</p>
                  <p className="text-sm text-gray-600 mb-1">Sala: {course.classroom}</p>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => openEditModal(course)}
                      className="flex-1 px-3 py-2 bg-yellow-400 text-white rounded-lg hover:bg-yellow-500 transition font-medium text-sm"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => handleDelete(course)}
                      className="flex-1 px-3 py-2 bg-red-400 text-white rounded-lg hover:bg-red-500 transition font-medium text-sm"
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && !error && filteredCourses.length > 0 && viewMode === "table" && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b-2 border-gray-300">
                    <th className="text-left p-4 font-semibold text-gray-700">Grado</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Año</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Profesor Jefe</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Sala</th>
                    <th className="text-center p-4 font-semibold text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCourses.map((course) => (
                    <tr key={course.id} className="border-b border-gray-200 hover:bg-blue-50 transition">
                      <td className="p-4 font-medium text-gray-700">{`${course.name ? course.name + ' - ' : ''}${course.grade}`.trim()}</td>
                      <td className="p-4 text-gray-600">{course.academicYear ? course.academicYear.substring(0, 4) : ""}</td>
                      <td className="p-4 text-gray-600">{getTeacherName(course.headTeacherId)}</td>
                      <td className="p-4 text-gray-600">{course.classroom}</td>
                      <td className="p-4">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => openEditModal(course)}
                            className="px-3 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500 transition text-sm font-medium"
                          >
                            ✏️ Editar
                          </button>
                          <button
                            onClick={() => handleDelete(course)}
                            className="px-3 py-1 bg-red-400 text-white rounded hover:bg-red-500 transition text-sm font-medium"
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
          {/* Modal de formulario de curso */}
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 overflow-y-auto">
              <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-lg mx-auto my-8 relative max-h-[90vh] overflow-y-auto">
                <button
                  onClick={closeModal}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold"
                  aria-label="Cerrar"
                >
                  ×
                </button>
                <h3 className="text-2xl font-bold mb-6 text-gray-700">{editingCourse ? "Editar Curso" : "Nuevo Curso"}</h3>
                {formError && (
                  <div className="bg-red-100 border border-red-300 text-red-700 rounded-lg p-3 mb-4">
                    {formError}
                  </div>
                )}
                <form onSubmit={handleSubmit}>
                                    <div className="mb-4">
                                      <label className="block text-gray-700 font-medium mb-2">Nombre del curso *</label>
                                      <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                                        required
                                      />
                                    </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2">Grado *</label>
                    <input
                      type="text"
                      name="grade"
                      value={formData.grade}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2">Fecha de inicio *</label>
                    <input
                      type="date"
                      name="academicYear"
                      value={formData.academicYear}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2">Profesor Jefe</label>
                    <select
                      name="headTeacherId"
                      value={formData.headTeacherId}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    >
                      <option value="">Sin profesor jefe</option>
                      {teachers.map((teacher) => (
                        <option key={teacher.id} value={teacher.id}>
                          {[teacher.firstName, teacher.lastName].filter(Boolean).join(" ")}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2">Sala</label>
                    <input
                      type="text"
                      name="classroom"
                      value={formData.classroom}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    />
                  </div>
                  <div className="flex justify-end gap-2 mt-6">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition font-medium"
                      disabled={submitting}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium"
                      disabled={submitting}
                    >
                      {editingCourse ? "Guardar cambios" : "Crear curso"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Courses;
