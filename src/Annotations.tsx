import { useEffect, useMemo, useState } from "react";
import {
  getAnnotations,
  createAnnotation,
  updateAnnotation,
  deleteAnnotation,
  type AnnotationType,
} from "./api/annotations";
import type { Annotation } from "./api/annotations";
import { getStudents } from "./api/students";
import type { Student } from "./api/students";
import { getCourses } from "./api/courses";
import type { Course } from "./api/courses";
import { getEnrollments } from "./api/enrollments";
import type { Enrollment } from "./api/enrollments";
import { getCurrentTeacher } from "./api/teachers";
import { formatCourseLabel } from "./utils/formatCourseLabel";
import { formatStudentFullName } from "./utils/formatStudentFullName";
import { moduleThemes } from "./theme/moduleThemes";
import ModuleLayout from "./components/ModuleLayout";
import FormModal, { FormField, formInputClass } from "./components/FormModal";
import RecordActions from "./components/RecordActions";
import ViewDetailModal, { type DetailField } from "./components/ViewDetailModal";
import TeacherContextBar from "./components/TeacherContextBar";
import TeacherCourseRequired from "./components/TeacherCourseRequired";
import ModuleHelpBanner from "./components/ModuleHelpBanner";
import { validateNotFutureDateField } from "./utils/validateDate";
import { useAuth } from "./auth/AuthContext";
import { useTeacherCourse } from "./teacher/TeacherCourseContext";
import { sortById } from "./utils/sortById";

const NO_COURSE_KEY = "none";

const findActiveEnrollment = (enrollments: Enrollment[], studentId: number) =>
  enrollments
    .filter((e) => e.studentId === studentId && e.enrollmentStatus === "ACTIVO")
    .sort((a, b) => b.id - a.id)[0];

interface AnnotationsProps {
  onBack: () => void;
}

function Annotations({ onBack }: AnnotationsProps) {
  const theme = moduleThemes.annotations;
  const auth = useAuth();
  const isTeacherPanel = auth.isTeacher && !auth.isAdmin;
  const { selectedCourse, selectedCourseId, courseStudents } = useTeacherCourse();
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [teacherId, setTeacherId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [adminCourseFilter, setAdminCourseFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingAnnotation, setEditingAnnotation] = useState<Annotation | null>(null);
  const [viewingAnnotation, setViewingAnnotation] = useState<Annotation | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    studentId: "",
    type: "POSITIVA" as AnnotationType,
    description: "",
    annotationDate: new Date().toISOString().slice(0, 10),
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [annotationsData, studentsData, coursesData, enrollmentsData] = await Promise.all([
        getAnnotations(),
        getStudents(),
        getCourses(),
        getEnrollments(),
      ]);
      setAnnotations(sortById(annotationsData));
      setStudents(sortById(studentsData));
      setCourses(sortById(coursesData));
      setEnrollments(sortById(enrollmentsData));
      if (auth.isTeacher && !auth.isAdmin) {
        const me = await getCurrentTeacher();
        setTeacherId(me?.id ?? null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar anotaciones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const studentMap = useMemo(() => new Map(students.map((s) => [s.id, s])), [students]);

  const activeEnrollmentByStudent = useMemo(() => {
    const map = new Map<number, Enrollment>();
    for (const student of students) {
      const active = findActiveEnrollment(enrollments, student.id);
      if (active) map.set(student.id, active);
    }
    return map;
  }, [students, enrollments]);

  const getStudentCourseId = (studentId: number): number | undefined =>
    activeEnrollmentByStudent.get(studentId)?.courseId;

  const getCourseName = (courseId?: number) => {
    if (!courseId) return "Sin curso asignado";
    const course = courses.find((c) => c.id === courseId);
    return course ? formatCourseLabel(course) : `ID: ${courseId}`;
  };

  const getStudentCourseLabel = (studentId: number) =>
    getCourseName(getStudentCourseId(studentId));

  const studentName = (annotation: Annotation) => {
    if (annotation.studentName) return annotation.studentName;
    const student = studentMap.get(annotation.studentId);
    return student ? formatStudentFullName(student) : "Estudiante no disponible";
  };

  const annotationTypeLabel = (type: AnnotationType) =>
    type === "POSITIVA" ? "Positiva" : "Negativa";

  const detailFields = (annotation: Annotation): DetailField[] => {
    const student = studentMap.get(annotation.studentId);
    return [
      { label: "Estudiante", value: studentName(annotation) },
      ...(student
        ? [
            { label: "Primer nombre", value: student.firstName },
            { label: "Segundo nombre", value: student.secondName },
            { label: "Apellido paterno", value: student.lastName },
            { label: "Apellido materno", value: student.motherLastName },
            { label: "RUT", value: student.rut },
          ]
        : []),
      { label: "Curso", value: getStudentCourseLabel(annotation.studentId) },
      { label: "Tipo", value: annotationTypeLabel(annotation.type) },
      { label: "Fecha", value: annotation.annotationDate },
      { label: "Descripción", value: annotation.description, fullWidth: true },
    ];
  };

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return annotations.filter((annotation) => {
      const courseId = getStudentCourseId(annotation.studentId);

      if (isTeacherPanel) {
        if (!selectedCourseId || courseId !== selectedCourseId) return false;
      } else if (adminCourseFilter === NO_COURSE_KEY) {
        if (courseId != null) return false;
      } else if (adminCourseFilter) {
        if (String(courseId) !== adminCourseFilter) return false;
      }

      const courseName = getStudentCourseLabel(annotation.studentId).toLowerCase();
      return (
        studentName(annotation).toLowerCase().includes(q) ||
        (annotation.description ?? "").toLowerCase().includes(q) ||
        annotation.type.toLowerCase().includes(q) ||
        courseName.includes(q)
      );
    });
  }, [annotations, searchTerm, isTeacherPanel, selectedCourseId, adminCourseFilter, students, enrollments, courses]);

  const studentsForForm = isTeacherPanel && selectedCourse ? courseStudents : students;

  const openCreateModal = () => {
    setEditingAnnotation(null);
    setForm({
      studentId: "",
      type: "POSITIVA",
      description: "",
      annotationDate: new Date().toISOString().slice(0, 10),
    });
    setFormError(null);
    setShowModal(true);
  };

  const openEditModal = (annotation: Annotation) => {
    setEditingAnnotation(annotation);
    setForm({
      studentId: String(annotation.studentId),
      type: annotation.type,
      description: annotation.description ?? "",
      annotationDate: annotation.annotationDate,
    });
    setFormError(null);
    setShowModal(true);
  };

  const closeFormModal = () => {
    setShowModal(false);
    setEditingAnnotation(null);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.studentId) {
      setFormError("Selecciona un estudiante");
      return;
    }
    if (!form.description.trim()) {
      setFormError("La descripción de la anotación es obligatoria");
      return;
    }
    const dateError = validateNotFutureDateField(form.annotationDate, "La fecha de la anotación");
    if (dateError) {
      setFormError(dateError);
      return;
    }
    if (!editingAnnotation && !teacherId) {
      setFormError("No se pudo identificar al docente para registrar la anotación");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    const payload = {
      studentId: parseInt(form.studentId),
      teacherId: editingAnnotation?.teacherId ?? teacherId!,
      type: form.type,
      description: form.description.trim() || undefined,
      annotationDate: form.annotationDate,
    };
    try {
      if (editingAnnotation) {
        await updateAnnotation(editingAnnotation.id, payload);
      } else {
        await createAnnotation(payload);
      }
      closeFormModal();
      await loadData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al guardar anotación");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = formInputClass(theme);

  return (
    <>
      <ModuleLayout
        theme={theme}
        onBack={onBack}
        createLabel="Dejar anotación"
        onCreate={openCreateModal}
        canCreate={auth.canCreate("annotations")}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar por alumno, curso, tipo o descripción..."
        onRefresh={loadData}
        loading={loading}
        error={error}
        toolbarExtra={
          !isTeacherPanel && courses.length > 0 ? (
            <select
              value={adminCourseFilter}
              onChange={(e) => setAdminCourseFilter(e.target.value)}
              className={`min-w-[200px] rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:ring-2 ${theme.focusRing}`}
              aria-label="Filtrar por curso"
            >
              <option value="">Todos los cursos</option>
              {sortById(courses).map((course) => (
                <option key={course.id} value={course.id}>
                  {formatCourseLabel(course)}
                </option>
              ))}
              <option value={NO_COURSE_KEY}>Sin curso asignado</option>
            </select>
          ) : undefined
        }
      >
        {isTeacherPanel && !selectedCourse && !loading && (
          <TeacherCourseRequired theme={theme} onBack={onBack} />
        )}

        {isTeacherPanel && selectedCourse && (
          <ModuleHelpBanner>
            Solo verás anotaciones de alumnos de <strong>{selectedCourse.courseLabel}</strong>.
          </ModuleHelpBanner>
        )}

        {auth.isReadOnlyModule("annotations") && (
          <ModuleHelpBanner>
            Solo consulta. Las anotaciones las registran los docentes sobre sus alumnos.
          </ModuleHelpBanner>
        )}

        {isTeacherPanel && selectedCourse && (
          <TeacherContextBar theme={theme} course={selectedCourse} />
        )}

        {(!isTeacherPanel || selectedCourse) && filtered.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">📌</div>
            <p>
              {searchTerm || adminCourseFilter
                ? "No hay anotaciones con ese criterio o curso"
                : "No hay anotaciones registradas"}
            </p>
          </div>
        )}

        {(!isTeacherPanel || selectedCourse) && filtered.length > 0 && (
          <div className={theme.tableWrap}>
            <table className="w-full text-sm">
              <thead className={theme.tableHead}>
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Estudiante</th>
                  {!isTeacherPanel && (
                    <th className="px-4 py-3 text-left font-semibold">Curso</th>
                  )}
                  <th className="px-4 py-3 text-left font-semibold">Tipo</th>
                  <th className="px-4 py-3 text-left font-semibold">Fecha</th>
                  <th className="px-4 py-3 text-left font-semibold">Descripción</th>
                  <th className="px-4 py-3 text-center font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((annotation) => (
                  <tr key={annotation.id} className={`border-t border-slate-100 ${theme.tableRowHover}`}>
                    <td className="px-4 py-3">{studentName(annotation)}</td>
                    {!isTeacherPanel && (
                      <td className="px-4 py-3">{getStudentCourseLabel(annotation.studentId)}</td>
                    )}
                    <td className="px-4 py-3">
                      <span
                        className={
                          annotation.type === "POSITIVA"
                            ? "text-emerald-700 font-medium"
                            : "text-rose-700 font-medium"
                        }
                      >
                        {annotation.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">{annotation.annotationDate}</td>
                    <td className="px-4 py-3">{annotation.description || "—"}</td>
                    <td className="px-4 py-3">
                      <RecordActions
                        onView={() => setViewingAnnotation(annotation)}
                        onEdit={() => openEditModal(annotation)}
                        onDelete={async () => {
                          if (!confirm("¿Eliminar esta anotación?")) return;
                          await deleteAnnotation(annotation.id);
                          await loadData();
                        }}
                        canEdit={auth.canEdit("annotations")}
                        canDelete={auth.canDelete("annotations")}
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
          subtitle={annotationTypeLabel(viewingAnnotation.type)}
          theme={theme}
          fields={detailFields(viewingAnnotation)}
          onClose={() => setViewingAnnotation(null)}
        />
      )}

      {showModal && (
        <FormModal
          title={editingAnnotation ? "Editar anotación" : "Nueva anotación"}
          subtitle={
            editingAnnotation
              ? "Modifica la observación de conducta"
              : "Registra una observación de conducta"
          }
          theme={theme}
          onClose={closeFormModal}
          onSubmit={handleSubmit}
          error={formError}
          submitting={submitting}
          submitLabel={editingAnnotation ? "Guardar cambios" : "Guardar anotación"}
        >
          <FormField label="Estudiante" required fullWidth>
            <select
              value={form.studentId}
              onChange={(e) => setForm((prev) => ({ ...prev, studentId: e.target.value }))}
              className={`${inputClass} bg-white`}
              required
            >
              <option value="">Seleccionar estudiante</option>
              {studentsForForm.map((student) => (
                <option key={student.id} value={student.id}>
                  {formatStudentFullName(student)} — {student.rut}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Tipo" required>
            <select
              value={form.type}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, type: e.target.value as AnnotationType }))
              }
              className={`${inputClass} bg-white`}
            >
              <option value="POSITIVA">Positiva</option>
              <option value="NEGATIVA">Negativa</option>
            </select>
          </FormField>
          <FormField label="Fecha" required>
            <input
              type="date"
              value={form.annotationDate}
              onChange={(e) => setForm((prev) => ({ ...prev, annotationDate: e.target.value }))}
              className={inputClass}
            />
          </FormField>
          <FormField label="Descripción" fullWidth>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              className={inputClass}
              placeholder="Describe la observación..."
            />
          </FormField>
        </FormModal>
      )}
    </>
  );
}

export default Annotations;
