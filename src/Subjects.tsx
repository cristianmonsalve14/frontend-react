import { useState, useEffect } from "react";
import { getSubjects, createSubject, updateSubject, deleteSubject } from "./api/subjects";
import type { Subject } from "./api/subjects";
import { getCourses } from "./api/courses";
import type { Course } from "./api/courses";
import { getTeachers } from "./api/teachers";
import type { Teacher } from "./api/teachers";
import { formatCourseLabel } from "./utils/formatCourseLabel";
import ViewDetailModal, { type DetailField } from "./components/ViewDetailModal";
import { moduleThemes } from "./theme/moduleThemes";
import ModuleLayout from "./components/ModuleLayout";
import RecordActions from "./components/RecordActions";
import FormModal, { FormField, formInputClass } from "./components/FormModal";

const MAX_WEEKLY_ACADEMIC_HOURS = 12;

const formatAcademicHours = (hours?: number) => {
  if (hours === undefined || hours === null || hours < 1 || hours > MAX_WEEKLY_ACADEMIC_HOURS) return "—";
  return `${hours}`;
};

const normalizeWeeklyHours = (hours?: number) =>
  hours !== undefined && hours >= 1 && hours <= MAX_WEEKLY_ACADEMIC_HOURS ? hours.toString() : "";

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
  const theme = moduleThemes.subjects;
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
  const [viewingSubject, setViewingSubject] = useState<Subject | null>(null);

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
    return formatCourseLabel(course);
  };

  const getSubjectDetailFields = (subject: Subject): DetailField[] => [
    { label: "Código", value: subject.subjectCode },
    { label: "Nombre", value: subject.subjectName },
    { label: "Descripción", value: subject.description },
    { label: "Curso", value: getCourseDisplay(subject.courseId) },
    { label: "Tipo", value: subject.subjectType },
    { label: "Horas académicas por semana", value: formatAcademicHours(subject.weeklyHours) },
    { label: "Profesor", value: getTeacherName(subject.teacherId) },
  ];

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
      weeklyHours: normalizeWeeklyHours(subject.weeklyHours),
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
        weeklyHours: formData.weeklyHours
          ? Math.min(MAX_WEEKLY_ACADEMIC_HOURS, Math.max(1, parseInt(formData.weeklyHours, 10)))
          : undefined,
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

  const inputClass = formInputClass(theme);

  return (
    <>
      <ModuleLayout
        theme={theme}
        onBack={onBack}
        createLabel="Nueva Asignatura"
        onCreate={openCreateModal}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar por nombre, código o curso..."
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onRefresh={loadSubjects}
        loading={loading}
        error={error}
      >
        {subjects.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">📚</div>
            <p className="mb-4">No hay asignaturas disponibles</p>
            <button
              onClick={openCreateModal}
              className={`px-6 py-3 rounded-lg transition font-medium shadow-sm ${theme.primaryBtn}`}
            >
              Crear primera asignatura
            </button>
          </div>
        )}

        {subjects.length > 0 && filteredSubjects.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">🔍</div>
            <p>No se encontraron asignaturas con ese criterio de búsqueda</p>
          </div>
        )}

        {filteredSubjects.length > 0 && viewMode === "cards" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSubjects.map((subject) => (
              <div key={subject.id} className={theme.cardClass}>
                <div className="text-4xl mb-4">📚</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  {subject.subjectName} ({subject.subjectCode})
                </h3>
                <p className="text-sm text-gray-600 mb-1">Curso: {getCourseDisplay(subject.courseId)}</p>
                <p className="text-sm text-gray-600 mb-1">Tipo: {subject.subjectType}</p>
                <p className="text-sm text-gray-600 mb-1">
                  Horas académicas/semana: {formatAcademicHours(subject.weeklyHours)}
                </p>
                <p className="text-sm text-gray-600 mb-1">Profesor: {getTeacherName(subject.teacherId)}</p>
                <div className="mt-4">
                  <RecordActions
                    onView={() => setViewingSubject(subject)}
                    onEdit={() => openEditModal(subject)}
                    onDelete={() => handleDelete(subject)}
                    compact
                    stretch
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredSubjects.length > 0 && viewMode === "table" && (
          <div className={theme.tableWrap}>
            <table className="w-full text-sm">
              <thead className={theme.tableHead}>
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Código</th>
                  <th className="px-4 py-3 text-left font-semibold">Nombre</th>
                  <th className="px-4 py-3 text-left font-semibold">Descripción</th>
                  <th className="px-4 py-3 text-left font-semibold">Curso</th>
                  <th className="px-4 py-3 text-left font-semibold">Tipo</th>
                  <th className="px-4 py-3 text-left font-semibold">H. acad./sem.</th>
                  <th className="px-4 py-3 text-left font-semibold">Profesor</th>
                  <th className="px-4 py-3 text-center font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubjects.map((subject) => (
                  <tr key={subject.id} className={`border-t border-slate-100 ${theme.tableRowHover}`}>
                    <td className="px-4 py-3 text-gray-700">{subject.subjectCode}</td>
                    <td className="px-4 py-3 text-gray-700">{subject.subjectName}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate" title={subject.description ?? undefined}>
                      {subject.description || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{getCourseDisplay(subject.courseId)}</td>
                    <td className="px-4 py-3 text-gray-600">{subject.subjectType}</td>
                    <td className="px-4 py-3 text-gray-600">{formatAcademicHours(subject.weeklyHours)}</td>
                    <td className="px-4 py-3 text-gray-600">{getTeacherName(subject.teacherId)}</td>
                    <td className="px-4 py-3">
                      <RecordActions
                        onView={() => setViewingSubject(subject)}
                        onEdit={() => openEditModal(subject)}
                        onDelete={() => handleDelete(subject)}
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

      {viewingSubject && (
        <ViewDetailModal
          title="Detalle de la asignatura"
          subtitle={`${viewingSubject.subjectName} (${viewingSubject.subjectCode})`}
          fields={getSubjectDetailFields(viewingSubject)}
          onClose={() => setViewingSubject(null)}
          theme={theme}
        />
      )}

      {showModal && (
        <FormModal
          title={editingSubject ? "Editar Asignatura" : "Nueva Asignatura"}
          subtitle={editingSubject ? "Modifica los datos de la asignatura" : "Registra una nueva asignatura"}
          theme={theme}
          onClose={closeModal}
          onSubmit={handleSubmit}
          error={formError}
          submitting={submitting}
          submitLabel={editingSubject ? "Guardar cambios" : "Crear asignatura"}
        >
          <FormField label="Código" required>
            <input type="text" name="subjectCode" value={formData.subjectCode} onChange={handleInputChange} placeholder="Ej: MAT101" className={inputClass} required />
          </FormField>
          <FormField label="Nombre" required>
            <input type="text" name="subjectName" value={formData.subjectName} onChange={handleInputChange} placeholder="Ej: Matemáticas" className={inputClass} required />
          </FormField>
          <FormField label="Descripción" fullWidth>
            <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Descripción de la asignatura" rows={3} className={inputClass} />
          </FormField>
          <FormField label="Curso" fullWidth>
            <select name="courseId" value={formData.courseId} onChange={handleInputChange} className={`${inputClass} bg-white`}>
              <option value="">Sin curso asignado</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>{formatCourseLabel(course)}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Horas académicas por semana">
            <input type="number" name="weeklyHours" value={formData.weeklyHours} onChange={handleInputChange} min={1} max={MAX_WEEKLY_ACADEMIC_HOURS} placeholder="Ej: 6" className={inputClass} />
          </FormField>
          <FormField label="Profesor">
            <select name="teacherId" value={formData.teacherId} onChange={handleInputChange} className={`${inputClass} bg-white`}>
              <option value="">Sin profesor asignado</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>{teacher.firstName} {teacher.lastName}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Tipo">
            <select name="subjectType" value={formData.subjectType} onChange={handleInputChange} className={`${inputClass} bg-white`}>
              <option value="">Seleccionar</option>
              <option value="OBLIGATORIA">OBLIGATORIA</option>
              <option value="ELECTIVA">ELECTIVA</option>
              <option value="COMPLEMENTARIA">COMPLEMENTARIA</option>
            </select>
          </FormField>
        </FormModal>
      )}
    </>
  );
}

export default Subjects;
