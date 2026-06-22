import { useState, useEffect } from "react";
import { getCourses, createCourse, updateCourse, deleteCourse } from "./api/courses";
import { getTeachers, getCurrentTeacher } from "./api/teachers";
import type { Course, CreateCourseDto } from "./api/courses";
import type { Teacher } from "./api/teachers";
import { formatCourseLabel } from "./utils/formatCourseLabel";
import ViewDetailModal, { type DetailField } from "./components/ViewDetailModal";
import { moduleThemes } from "./theme/moduleThemes";
import ModuleLayout from "./components/ModuleLayout";
import RecordActions from "./components/RecordActions";
import FormModal, { FormField, formInputClass } from "./components/FormModal";
import { useAuth } from "./auth/AuthContext";
import { sortById } from "./utils/sortById";
import { validatePositiveIntField } from "./utils/validateDate";

interface FormData {
  name: string;
  grade: string;
  academicYear: string;
  headTeacherId?: string;
  classroom?: string;
  shift?: string;
  maxCapacity?: string;
  level?: string;
  courseStatus?: string;
}

interface CoursesProps {
  onBack: () => void;
}

function Courses({ onBack }: CoursesProps) {
  const theme = moduleThemes.courses;
  const auth = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [currentTeacher, setCurrentTeacher] = useState<Teacher | null>(null);
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
    shift: "",
    maxCapacity: "",
    level: "",
    courseStatus: "ACTIVO",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewingCourse, setViewingCourse] = useState<Course | null>(null);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const coursesData = await getCourses();
      setCourses(sortById(coursesData));
      
      if (auth.isTeacher && !auth.isAdmin) {
        try {
          const me = await getCurrentTeacher();
          setCurrentTeacher(me);
          setTeachers(me ? [me] : []);
        } catch (teacherErr) {
          console.warn("No se pudo cargar el perfil docente:", teacherErr);
          setCurrentTeacher(null);
          setTeachers([]);
        }
      } else {
        try {
          const teachersData = await getTeachers();
          setTeachers(sortById(teachersData));
          setCurrentTeacher(null);
        } catch (teacherErr) {
          console.warn("No se pudieron cargar los profesores:", teacherErr);
          setTeachers([]);
          setCurrentTeacher(null);
        }
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

  const formatTeacherName = (teacher: Teacher) =>
    [teacher.firstName, teacher.lastName, teacher.secondLastName].filter(Boolean).join(" ");

  const getTeacherName = (teacherId?: number) => {
    if (teacherId === undefined || teacherId === null) return "Sin asignar";
    const teacher = teachers.find((t) => t.id === teacherId);
    if (!teacher) return "Sin asignar";
    return formatTeacherName(teacher);
  };

  const getCourseTeacherDisplay = (course: Course) => {
    if (auth.isTeacher && !auth.isAdmin && currentTeacher) {
      const isHeadTeacher = course.headTeacherId === currentTeacher.id;
      return {
        roleLabel: isHeadTeacher ? "Profesor jefe" : "Profesor asignado",
        name: formatTeacherName(currentTeacher),
      };
    }
    return {
      roleLabel: "Profesor jefe",
      name: getTeacherName(course.headTeacherId),
    };
  };

  const formatShift = (code?: string) => {
    if (!code) return "—";
    const key = code.toUpperCase().replace("Ñ", "N");
    const labels: Record<string, string> = {
      MANANA: "Mañana",
      TARDE: "Tarde",
      COMPLETA: "Jornada completa",
      JORNADA_COMPLETA: "Jornada completa",
      VESPERTINO: "Jornada completa",
    };
    return labels[key] ?? code;
  };

  const formatEducationLevel = (level?: string) => {
    if (!level) return "—";
    if (level === "BASICA") return "Básica";
    if (level === "MEDIA") return "Media";
    return level;
  };

  const formatCourseStatus = (status?: string) => {
    if (!status) return "—";
    if (status === "ACTIVO") return "Activo";
    if (status === "CERRADO") return "Cerrado";
    return status;
  };

  const formatStartDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    const date = new Date(`${dateStr.substring(0, 10)}T12:00:00`);
    return Number.isNaN(date.getTime()) ? dateStr.substring(0, 10) : date.toLocaleDateString("es-CL");
  };

  const startDateForInput = (dateStr?: string) => {
    if (!dateStr) return "";
    return dateStr.substring(0, 10);
  };

  const getCourseDetailFields = (course: Course): DetailField[] => [
    { label: "Curso", value: formatCourseLabel(course) },
    { label: "Nivel", value: course.grade },
    { label: "Grado", value: course.name },
    { label: "Fecha inicio", value: formatStartDate(course.academicYear) },
    {
      label: getCourseTeacherDisplay(course).roleLabel,
      value: getCourseTeacherDisplay(course).name,
    },
    { label: "Sala", value: course.classroom },
    { label: "Jornada", value: formatShift(course.shift) },
    { label: "Enseñanza", value: formatEducationLevel(course.level) },
    { label: "Capacidad máxima", value: course.maxCapacity },
    { label: "Estado", value: formatCourseStatus(course.courseStatus) },
  ];

  const filteredCourses = courses.filter((course) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (course.name ?? "").toLowerCase().includes(searchLower) ||
      (course.grade ?? "").toLowerCase().includes(searchLower) ||
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
      shift: "",
      maxCapacity: "",
      level: "",
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
      academicYear: startDateForInput(course.academicYear),
      headTeacherId: course.headTeacherId?.toString() ?? "",
      classroom: course.classroom ?? "",
      shift: course.shift ?? "",
      maxCapacity: course.maxCapacity?.toString() ?? "",
      level: course.level ?? "",
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
      shift: "",
      maxCapacity: "",
      level: "",
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
    if (formData.maxCapacity?.trim()) {
      const capacityError = validatePositiveIntField(formData.maxCapacity, "La capacidad máxima", 1);
      if (capacityError) {
        setFormError(capacityError);
        return;
      }
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
        headTeacherId: formData.headTeacherId && formData.headTeacherId !== "" ? parseInt(formData.headTeacherId) : undefined,
        classroom: formData.classroom?.trim() || undefined,
        shift: formData.shift?.trim() || undefined,
        maxCapacity: formData.maxCapacity ? parseInt(formData.maxCapacity) : undefined,
        level: formData.level?.trim() || undefined,
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
    if (!confirm(`¿Estás seguro de eliminar el curso "${formatCourseLabel(course)}"?`)) {
      return;
    }

    try {
      await deleteCourse(course.id);
      await loadCourses();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar el curso");
    }
  };

  const inputClass = formInputClass(theme);

  return (
    <>
      <ModuleLayout
        theme={theme}
        onBack={onBack}
        createLabel="Nuevo Curso"
        onCreate={openCreateModal}
        canCreate={auth.canCreate("courses")}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar por nombre, nivel o año..."
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onRefresh={loadCourses}
        loading={loading}
        error={error}
      >
        {courses.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">📚</div>
            <p className="mb-4">No hay cursos disponibles</p>
            <button
              onClick={openCreateModal}
              className={`px-6 py-3 rounded-lg transition font-medium shadow-sm ${theme.primaryBtn}`}
            >
              Crear primer curso
            </button>
          </div>
        )}

        {courses.length > 0 && filteredCourses.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">🔍</div>
            <p className="mb-2">No se encontraron cursos</p>
            <p className="text-sm">Intenta con otro término de búsqueda</p>
          </div>
        )}

        {filteredCourses.length > 0 && viewMode === "cards" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <div key={course.id} className={theme.cardClass}>
                <div className="text-4xl mb-4">📖</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">{formatCourseLabel(course)}</h3>
                <p className="text-sm text-gray-600 mb-1">Fecha inicio: {formatStartDate(course.academicYear)}</p>
                {(() => {
                  const { roleLabel, name } = getCourseTeacherDisplay(course);
                  return (
                    <p className="text-sm text-gray-600 mb-1">
                      {roleLabel}: {name}
                    </p>
                  );
                })()}
                <p className="text-sm text-gray-600 mb-1">Sala: {course.classroom}</p>
                <div className="mt-4">
                  <RecordActions
                    onView={() => setViewingCourse(course)}
                    onEdit={() => openEditModal(course)}
                    onDelete={() => handleDelete(course)}
                    canEdit={auth.canEdit("courses")}
                    canDelete={auth.canDelete("courses")}
                    compact
                    stretch
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredCourses.length > 0 && viewMode === "table" && (
          <div className={theme.tableWrap}>
            <table className="w-full text-sm">
              <thead className={theme.tableHead}>
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Curso</th>
                  <th className="text-left px-4 py-3 font-semibold">Fecha inicio</th>
                  <th className="text-left px-4 py-3 font-semibold">
                    {auth.isTeacher && !auth.isAdmin ? "Tu rol" : "Profesor jefe"}
                  </th>
                  <th className="text-left px-4 py-3 font-semibold">Sala</th>
                  <th className="text-left px-4 py-3 font-semibold">Jornada</th>
                  <th className="text-left px-4 py-3 font-semibold">Enseñanza</th>
                  <th className="text-left px-4 py-3 font-semibold">Capacidad</th>
                  <th className="text-left px-4 py-3 font-semibold">Estado</th>
                  <th className="text-center px-4 py-3 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredCourses.map((course) => (
                  <tr key={course.id} className={`border-t border-slate-100 ${theme.tableRowHover}`}>
                    <td className="px-4 py-3 font-medium text-gray-700">{formatCourseLabel(course)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatStartDate(course.academicYear)}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {(() => {
                        const { roleLabel, name } = getCourseTeacherDisplay(course);
                        return auth.isTeacher && !auth.isAdmin
                          ? `${roleLabel}: ${name}`
                          : name;
                      })()}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{course.classroom || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{formatShift(course.shift)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatEducationLevel(course.level)}</td>
                    <td className="px-4 py-3 text-gray-600">{course.maxCapacity ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{formatCourseStatus(course.courseStatus)}</td>
                    <td className="px-4 py-3">
                      <RecordActions
                        onView={() => setViewingCourse(course)}
                        onEdit={() => openEditModal(course)}
                        onDelete={() => handleDelete(course)}
                        canEdit={auth.canEdit("courses")}
                        canDelete={auth.canDelete("courses")}
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

      {viewingCourse && (
        <ViewDetailModal
          title="Detalle del curso"
          subtitle={formatCourseLabel(viewingCourse)}
          fields={getCourseDetailFields(viewingCourse)}
          onClose={() => setViewingCourse(null)}
          theme={theme}
        />
      )}

      {showModal && (
        <FormModal
          title={editingCourse ? "Editar Curso" : "Nuevo Curso"}
          subtitle={editingCourse ? "Modifica los datos del curso" : "Registra un nuevo curso académico"}
          theme={theme}
          onClose={closeModal}
          onSubmit={handleSubmit}
          error={formError}
          submitting={submitting}
          submitLabel={editingCourse ? "Guardar cambios" : "Crear curso"}
        >
          <FormField label="Nivel" required>
            <input type="text" name="grade" value={formData.grade} onChange={handleInputChange} placeholder="Ej: 1° Medio" className={inputClass} required />
          </FormField>
          <FormField label="Grado" required hint="En listas se verá como: 1° Medio A">
            <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Ej: A, B o C" className={inputClass} required />
          </FormField>
          <FormField label="Fecha de inicio" required>
            <input type="date" name="academicYear" value={formData.academicYear} onChange={handleInputChange} className={inputClass} required />
          </FormField>
          <FormField label="Profesor jefe">
            <select name="headTeacherId" value={formData.headTeacherId} onChange={handleInputChange} className={`${inputClass} bg-white`}>
              <option value="">Sin profesor jefe</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {[teacher.firstName, teacher.lastName].filter(Boolean).join(" ")}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Sala">
            <input type="text" name="classroom" value={formData.classroom} onChange={handleInputChange} className={inputClass} />
          </FormField>
          <FormField label="Jornada">
            <select name="shift" value={formData.shift} onChange={handleInputChange} className={`${inputClass} bg-white`}>
              <option value="">Seleccionar</option>
              <option value="MANANA">Mañana</option>
              <option value="TARDE">Tarde</option>
              <option value="COMPLETA">Jornada completa</option>
            </select>
          </FormField>
          <FormField label="Nivel educacional">
            <select name="level" value={formData.level} onChange={handleInputChange} className={`${inputClass} bg-white`}>
              <option value="">Seleccionar</option>
              <option value="BASICA">BÁSICA</option>
              <option value="MEDIA">MEDIA</option>
            </select>
          </FormField>
          <FormField label="Capacidad máxima">
            <input type="number" name="maxCapacity" value={formData.maxCapacity} onChange={handleInputChange} min="1" className={inputClass} />
          </FormField>
          <FormField label="Estado">
            <select name="courseStatus" value={formData.courseStatus} onChange={handleInputChange} className={`${inputClass} bg-white`}>
              <option value="ACTIVO">ACTIVO</option>
              <option value="CERRADO">CERRADO</option>
            </select>
          </FormField>
        </FormModal>
      )}
    </>
  );
}

export default Courses;
