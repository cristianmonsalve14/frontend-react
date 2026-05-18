import { useState, useEffect } from "react";
import { getSubjects, createSubject, updateSubject, deleteSubject } from "./api/subjects";
import type { Subject } from "./api/subjects";
import { getCourses } from "./api/courses";
import type { Course } from "./api/courses";
import { getTeachers } from "./api/teachers";
import type { Teacher } from "./api/teachers";

interface FormData {
  subjectCode: string;
  subjectName: string;
  description?: string;
  teacherId?: string;
  weeklyHours?: string;
  subjectType?: string;
  courseId?: string;
}

interface SubjectsProps {
  onBack: () => void;
}

function Subjects({ onBack }: SubjectsProps) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [formData, setFormData] = useState<FormData>({
    subjectCode: "",
    subjectName: "",
    description: "",
    teacherId: "",
    weeklyHours: "",
    subjectType: "",
    courseId: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [searchTerm, setSearchTerm] = useState("");

  const loadSubjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const [subjectsData, coursesData, teachersData] = await Promise.all([
        getSubjects(),
        getCourses(),
        getTeachers()
      ]);
      setSubjects(subjectsData);
      setCourses(coursesData);
      setTeachers(teachersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar asignaturas");
      console.error("Error cargando asignaturas:", err);
    } finally {
      setLoading(false);
    }
  };
  // Devuelve el nombre del profesor por ID
  const getTeacherName = (teacherId?: number | string) => {
    if (!teacherId) return "Sin asignar";
    const id = typeof teacherId === "string" ? parseInt(teacherId) : teacherId;
    const teacher = teachers.find((t) => t.id === id);
    return teacher ? `${teacher.firstName} ${teacher.lastName}`.trim() : `ID: ${teacherId}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      await loadSubjects();
    };
    void fetchData();
  }, []);

  const getCourseDisplay = (courseId?: number): string => {
    if (courseId === undefined || courseId === null) return "Sin curso";
    const course = courses.find((c) => c.id === courseId);
    if (!course) return `ID: ${courseId}`;
    // Mostrar nombre y grado si existen
    return course.grade ? `${course.name} (${course.grade})` : course.name;
  };

  const filteredSubjects = subjects.filter((subject) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (subject.subjectCode ?? "").toLowerCase().includes(searchLower) ||
      (subject.subjectName ?? "").toLowerCase().includes(searchLower) ||
      (getCourseDisplay(subject.courseId) ?? "").toLowerCase().includes(searchLower)
    );
  });

  const openCreateModal = () => {
    setEditingSubject(null);
    setFormData({
      subjectCode: "",
      subjectName: "",
      description: "",
      teacherId: "",
      weeklyHours: "",
      subjectType: "",
      courseId: "",
    });
    setFormError(null);
    setShowModal(true);
    // Forzar limpieza de campos temporales
    setTimeout(() => {
      setFormData({
        subjectCode: "",
        subjectName: "",
        description: "",
        teacherId: "",
        weeklyHours: "",
        subjectType: "",
        courseId: "",
      });
    }, 0);
  };

  const openEditModal = (subject: Subject) => {
    setEditingSubject(subject);
    setFormData({
      subjectCode: subject.subjectCode ?? "",
      subjectName: subject.subjectName ?? "",
      description: subject.description ?? "",
        teacherId: subject.teacherId ? subject.teacherId.toString() : "",
      weeklyHours: subject.weeklyHours?.toString() ?? "",
      subjectType: subject.subjectType ?? "",
      courseId: subject.courseId?.toString() ?? "",
    });
    setFormError(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSubject(null);
    setFormData({
      subjectCode: "",
      subjectName: "",
      description: "",
      teacherId: "",
      weeklyHours: "",
      subjectType: "",
      courseId: "",
    });
    setFormError(null);
    // Forzar limpieza de campos temporales
    setTimeout(() => {
      setFormData({
        subjectCode: "",
        subjectName: "",
        description: "",
        teacherId: "",
        weeklyHours: "",
        subjectType: "",
        courseId: "",
      });
    }, 0);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subjectCode.trim() || !formData.subjectName.trim()) {
      setFormError("El código y nombre de la asignatura son obligatorios");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const subjectData = {
        subjectCode: formData.subjectCode.trim(),
        subjectName: formData.subjectName.trim(),
        description: formData.description?.trim() || undefined,
        teacherId: formData.teacherId ? parseInt(formData.teacherId) : undefined,
        weeklyHours: formData.weeklyHours ? parseInt(formData.weeklyHours) : undefined,
        subjectType: formData.subjectType?.trim() || undefined,
        courseId: formData.courseId ? parseInt(formData.courseId) : undefined,
      };
      // Validar que no quede texto temporal
      if (subjectData.subjectName === "TEMP") {
        setFormError("El nombre de la asignatura no puede ser 'TEMP'");
        setSubmitting(false);
        return;
      }
      if (editingSubject) {
        await updateSubject(editingSubject.id, subjectData);
      } else {
        await createSubject(subjectData);
      }
      await loadSubjects();
      closeModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al guardar la asignatura");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (subject: Subject) => {
    if (!confirm(`¿Estás seguro de eliminar la asignatura "${subject.subjectName}"?`)) {
      return;
    }
    try {
      await deleteSubject(subject.id);
      await loadSubjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar la asignatura");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 p-8">
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
                <h2 className="text-3xl font-bold text-gray-700 mb-2">📚 Asignaturas</h2>
                <p className="text-gray-500">Gestión de asignaturas</p>
              </div>
              <button
                onClick={openCreateModal}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition font-medium shadow-sm flex items-center gap-2"
              >
                <span>➕</span>
                Nueva Asignatura
              </button>
            </div>

            {/* Barra de herramientas */}
            <div className="flex gap-3 items-center flex-wrap">
              {/* Búsqueda */}
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="🔍 Buscar por nombre o curso..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                />
              </div>

              {/* Toggle Vista */}
              <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("cards")}
                  className={`px-4 py-2 rounded-lg transition font-medium flex items-center gap-2 ${
                    viewMode === "cards"
                      ? "bg-purple-500 text-white"
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
                      ? "bg-purple-500 text-white"
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
                onClick={loadSubjects}
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
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
              <p className="mt-4 text-gray-500">Cargando asignaturas...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-600">❌ {error}</p>
            </div>
          )}

          {!loading && !error && subjects.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">📚</div>
              <p className="mb-4">No hay asignaturas disponibles</p>
              <button
                onClick={openCreateModal}
                className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition font-medium shadow-sm"
              >
                Crear primera asignatura
              </button>
            </div>
          )}

          {!loading && !error && subjects.length > 0 && filteredSubjects.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">🔍</div>
              <p>No se encontraron asignaturas con ese criterio de búsqueda</p>
            </div>
          )}

          {!loading && !error && filteredSubjects.length > 0 && viewMode === "cards" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSubjects.map((subject) => (
                <div
                  key={subject.id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition bg-gradient-to-br from-purple-50 to-pink-50"
                >
                  <div className="text-4xl mb-4">📚</div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    {subject.subjectName} ({subject.subjectCode})
                  </h3>
                  <p className="text-sm text-gray-600 mb-1">Curso: {getCourseDisplay(subject.courseId)}</p>
                  <p className="text-sm text-gray-600 mb-1">Tipo: {subject.subjectType}</p>
                  <p className="text-sm text-gray-600 mb-1">Horas/Semana: {subject.weeklyHours}</p>
                  <p className="text-sm text-gray-600 mb-1">Profesor: {getTeacherName(subject.teacherId)}</p>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => openEditModal(subject)}
                      className="flex-1 px-3 py-2 bg-yellow-400 text-white rounded-lg hover:bg-yellow-500 transition font-medium text-sm"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => handleDelete(subject)}
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
          {!loading && !error && filteredSubjects.length > 0 && viewMode === "table" && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-purple-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Código</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Nombre</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Curso</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Tipo</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Horas/Semana</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Profesor</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredSubjects.map((subject) => (
                    <tr key={subject.id} className="hover:bg-purple-50 transition">
                      <td className="px-4 py-3 text-sm text-gray-700">{subject.subjectCode}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{subject.subjectName}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{getCourseDisplay(subject.courseId)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{subject.subjectType}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{subject.weeklyHours}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{getTeacherName(subject.teacherId)}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => openEditModal(subject)}
                            className="px-3 py-1 bg-yellow-400 text-white rounded-lg hover:bg-yellow-500 transition font-medium text-xs"
                          >
                            ✏️ Editar
                          </button>
                          <button
                            onClick={() => handleDelete(subject)}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 z-50 min-h-screen overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-4 sm:p-6 overflow-y-auto max-h-[95vh]">
            <h3 className="text-2xl font-bold text-gray-700 mb-4">
              {editingSubject ? "Editar Asignatura" : "Crear Nueva Asignatura"}
            </h3>
            {formError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-red-600 text-sm">❌ {formError}</p>
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Código *</label>
                <input
                  type="text"
                  name="subjectCode"
                  value={formData.subjectCode}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  placeholder="Ej: MAT101"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Nombre *</label>
                <input
                  type="text"
                  name="subjectName"
                  value={formData.subjectName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  placeholder="Ej: Matemáticas"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Descripción</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  placeholder="Descripción de la asignatura"
                  rows={2}
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Curso</label>
                <select
                  name="courseId"
                  value={formData.courseId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                >
                  <option value="">Sin curso asignado</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name}{course.grade ? ` (${course.grade})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Horas semanales</label>
                <input
                  type="number"
                  name="weeklyHours"
                  value={formData.weeklyHours}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  min="0"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Profesor (ID)</label>
                <input
                  type="number"
                  name="teacherId"
                  value={formData.teacherId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  min="0"
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">Tipo</label>
                <input
                  type="text"
                  name="subjectType"
                  value={formData.subjectType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent"
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
                  className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition font-medium disabled:opacity-50"
                >
                  {submitting ? "Guardando..." : editingSubject ? "Actualizar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Subjects;
