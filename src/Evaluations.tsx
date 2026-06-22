
import { Fragment, useState, useEffect, useMemo } from "react";
import { getEvaluations, createEvaluation, updateEvaluation, deleteEvaluation } from "./api/evaluations";
import { getSubjects } from "./api/subjects";
import { getCourses } from "./api/courses";
import type { Evaluation, CreateEvaluationDto } from "./api/evaluations";
import type { Subject } from "./api/subjects";
import type { Course } from "./api/courses";
import { formatCourseLabel } from "./utils/formatCourseLabel";
import ViewDetailModal, { type DetailField } from "./components/ViewDetailModal";
import { moduleThemes } from "./theme/moduleThemes";
import ModuleLayout from "./components/ModuleLayout";
import RecordActions from "./components/RecordActions";
import FormModal, { FormField, formInputClass } from "./components/FormModal";
import ModuleHelpBanner from "./components/ModuleHelpBanner";
import { useAuth } from "./auth/AuthContext";
import { sortById } from "./utils/sortById";
import { validateNotFutureDateField, validateWeightField } from "./utils/validateDate";
import TeacherContextBar from "./components/TeacherContextBar";
import TeacherCourseRequired from "./components/TeacherCourseRequired";
import { useTeacherCourse } from "./teacher/TeacherCourseContext";

type FormData = {
  name: string;
  date?: string;
  subjectId: string;
  courseId: string;
  evaluationType?: string;
  evaluationStatus?: string;
  weight?: string;
  maxScore?: string;
  description?: string;
};

const NO_COURSE_KEY = "none";

interface EvaluationGroup {
  key: string;
  label: string;
  evaluations: Evaluation[];
}

interface EvaluationsProps {
  onBack: () => void;
}

function Evaluations({ onBack }: EvaluationsProps) {
  const theme = moduleThemes.evaluations;
  const auth = useAuth();
  const isTeacherPanel = auth.isTeacher && !auth.isAdmin;
  const teacherCourse = useTeacherCourse();
  const {
    selectedCourseId,
    selectedCourse,
    courseSubjects,
    courseOptions,
  } = teacherCourse;
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingEvaluation, setEditingEvaluation] = useState<Evaluation | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    date: "",
    subjectId: "",
    courseId: "",
    evaluationType: "",
    evaluationStatus: "ACTIVO",
    weight: "",
    maxScore: "7",
    description: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [searchTerm, setSearchTerm] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [viewingEvaluation, setViewingEvaluation] = useState<Evaluation | null>(null);

  const subjectById = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);

  const teacherSubjects = useMemo(() => {
    if (!isTeacherPanel || !teacherCourse.teacherId) return subjects;
    return subjects.filter((subject) => subject.teacherId === teacherCourse.teacherId);
  }, [isTeacherPanel, subjects, teacherCourse.teacherId]);

  const formSubjects = useMemo(() => {
    if (!isTeacherPanel) return subjects;
    if (selectedCourseId) return courseSubjects;
    return teacherSubjects;
  }, [isTeacherPanel, subjects, selectedCourseId, courseSubjects, teacherSubjects]);

  const filterCourseOptions = useMemo(() => {
    if (isTeacherPanel) {
      return courseOptions.map((option) => ({
        id: option.courseId,
        label: option.courseLabel,
      }));
    }
    return courses.map((course) => ({
      id: course.id,
      label: formatCourseLabel(course),
    }));
  }, [isTeacherPanel, courseOptions, courses]);


  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [evaluationsData, subjectsData, coursesData] = await Promise.all([
        getEvaluations(),
        getSubjects(),
        getCourses(),
      ]);
      setEvaluations(sortById(evaluationsData));
      setSubjects(sortById(subjectsData));
      setCourses(sortById(coursesData));
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

  useEffect(() => {
    if (isTeacherPanel && selectedCourseId) {
      setCourseFilter(String(selectedCourseId));
    } else if (isTeacherPanel) {
      setCourseFilter("");
    }
  }, [isTeacherPanel, selectedCourseId]);


  const getSubjectName = (subjectId?: number) => {
    if (!subjectId) return "Sin asignatura";
    const subject = subjectById.get(subjectId);
    return subject?.subjectName || `ID: ${subjectId}`;
  };

  const getEvaluationCourseId = (evaluation: Evaluation): number | undefined => {
    if (evaluation.courseId) return evaluation.courseId;
    const subject = evaluation.subjectId ? subjectById.get(evaluation.subjectId) : undefined;
    return subject?.courseId;
  };

  const getCourseName = (courseId?: number) => {
    if (!courseId) return "Sin curso";
    const course = courses.find((c) => c.id === courseId);
    return course ? formatCourseLabel(course) : `ID: ${courseId}`;
  };

  const getEvaluationCourseLabel = (evaluation: Evaluation) =>
    getCourseName(getEvaluationCourseId(evaluation));

  const formatEvaluationDate = (dateStr?: string) =>
    dateStr ? new Date(dateStr).toLocaleDateString("es-CL") : undefined;

  const getEvaluationDetailFields = (evaluation: Evaluation): DetailField[] => [
    { label: "Nombre", value: evaluation.name },
    { label: "Tipo", value: evaluation.evaluationType },
    { label: "Estado", value: evaluation.evaluationStatus },
    { label: "Descripción", value: evaluation.description },
    {
      label: "Ponderación",
      value: evaluation.weight != null ? `${evaluation.weight}%` : undefined,
    },
    { label: "Nota máxima", value: evaluation.maxScore },
    { label: "Fecha", value: formatEvaluationDate(evaluation.date) },
    { label: "Asignatura", value: getSubjectName(evaluation.subjectId) },
    { label: "Curso", value: getEvaluationCourseLabel(evaluation) },
  ];

  const filteredEvaluations = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return evaluations.filter((evaluation) => {
      const courseId = getEvaluationCourseId(evaluation);

      if (isTeacherPanel) {
        if (!selectedCourseId || courseId !== selectedCourseId) return false;
      } else if (courseFilter === NO_COURSE_KEY) {
        if (courseId != null) return false;
      } else if (courseFilter) {
        if (String(courseId) !== courseFilter) return false;
      }

      const subject = evaluation.subjectId ? subjectById.get(evaluation.subjectId) : undefined;
      const subjectName = (getSubjectName(evaluation.subjectId) ?? "").toLowerCase();
      const courseName = getEvaluationCourseLabel(evaluation).toLowerCase();

      return (
        (evaluation.name ?? "").toLowerCase().includes(searchLower) ||
        subjectName.includes(searchLower) ||
        (subject?.subjectCode ?? "").toLowerCase().includes(searchLower) ||
        courseName.includes(searchLower) ||
        (evaluation.evaluationType ?? "").toLowerCase().includes(searchLower) ||
        (evaluation.evaluationStatus ?? "").toLowerCase().includes(searchLower) ||
        (evaluation.description ?? "").toLowerCase().includes(searchLower)
      );
    });
  }, [evaluations, searchTerm, courseFilter, isTeacherPanel, selectedCourseId, subjectById, courses]);

  const evaluationGroups = useMemo((): EvaluationGroup[] => {
    if (courseFilter) {
      const course = courses.find((c) => String(c.id) === courseFilter);
      const label =
        courseFilter === NO_COURSE_KEY
          ? "Sin curso asignado"
          : course
            ? formatCourseLabel(course)
            : getCourseName(Number(courseFilter));
      return filteredEvaluations.length
        ? [{ key: courseFilter, label, evaluations: sortById(filteredEvaluations) }]
        : [];
    }

    const byKey = new Map<string, Evaluation[]>();
    for (const evaluation of filteredEvaluations) {
      const courseId = getEvaluationCourseId(evaluation);
      const key = courseId != null ? String(courseId) : NO_COURSE_KEY;
      const list = byKey.get(key) ?? [];
      list.push(evaluation);
      byKey.set(key, list);
    }

    const groups: EvaluationGroup[] = [];
    const seen = new Set<string>();

    for (const course of courses) {
      const key = String(course.id);
      const groupEvaluations = byKey.get(key);
      if (groupEvaluations?.length) {
        groups.push({
          key,
          label: formatCourseLabel(course),
          evaluations: sortById(groupEvaluations),
        });
        seen.add(key);
      }
    }

    for (const [key, groupEvaluations] of byKey) {
      if (seen.has(key) || key === NO_COURSE_KEY) continue;
      groups.push({
        key,
        label: getCourseName(Number(key)),
        evaluations: sortById(groupEvaluations),
      });
    }

    const unassigned = byKey.get(NO_COURSE_KEY);
    if (unassigned?.length) {
      groups.push({
        key: NO_COURSE_KEY,
        label: "Sin curso asignado",
        evaluations: sortById(unassigned),
      });
    }

    return groups;
  }, [filteredEvaluations, courseFilter, courses, subjectById]);

  const showGroupHeaders = !courseFilter;


  const openCreateModal = () => {
    setEditingEvaluation(null);
    setFormData({
      name: "",
      date: "",
      subjectId: "",
      courseId: selectedCourseId?.toString() ?? "",
      evaluationType: "",
      evaluationStatus: "ACTIVO",
      weight: "",
      maxScore: "7",
      description: "",
    });
    setFormError(null);
    setShowModal(true);
  };


  const openEditModal = (evaluation: Evaluation) => {
    setEditingEvaluation(evaluation);
    setFormData({
      name: evaluation.name ?? "",
      date: evaluation.date ?? "",
      subjectId: evaluation.subjectId?.toString() ?? "",
      courseId: evaluation.courseId?.toString() ?? "",
      evaluationType: evaluation.evaluationType ?? "",
      evaluationStatus: evaluation.evaluationStatus ?? "ACTIVO",
      weight: evaluation.weight?.toString() ?? "",
      maxScore: evaluation.maxScore?.toString() ?? "7",
      description: evaluation.description ?? "",
    });
    setFormError(null);
    setShowModal(true);
  };


  const closeModal = () => {
    setShowModal(false);
    setEditingEvaluation(null);
    setFormData({
      name: "",
      date: "",
      subjectId: "",
      courseId: "",
      evaluationType: "",
      evaluationStatus: "ACTIVO",
      weight: "",
      maxScore: "7",
      description: "",
    });
    setFormError(null);
  };


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "subjectId") {
      const subject = subjects.find((s) => s.id === parseInt(value));
      setFormData((prev) => ({
        ...prev,
        subjectId: value,
        courseId: subject?.courseId?.toString() ?? prev.courseId,
      }));
      return;
    }
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError("El nombre de la evaluación es obligatorio");
      return;
    }
    if (!formData.subjectId) {
      setFormError("Debes seleccionar una asignatura");
      return;
    }
    if (!formData.date?.trim()) {
      setFormError("La fecha de la evaluación es obligatoria");
      return;
    }
    const dateError = validateNotFutureDateField(formData.date, "La fecha de la evaluación");
    if (dateError) {
      setFormError(dateError);
      return;
    }
    const weightError = validateWeightField(formData.weight ?? "");
    if (weightError) {
      setFormError(weightError);
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const evaluationData: CreateEvaluationDto = {
        name: formData.name.trim(),
        date: formData.date || undefined,
        subjectId: formData.subjectId ? parseInt(formData.subjectId) : undefined,
        courseId: formData.courseId ? parseInt(formData.courseId) : undefined,
        evaluationType: formData.evaluationType?.trim() || undefined,
        evaluationStatus: formData.evaluationStatus?.trim() || "ACTIVO",
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        maxScore: formData.maxScore ? parseFloat(formData.maxScore) : 7,
        description: formData.description?.trim() || undefined,
      };
      if (editingEvaluation) {
        await updateEvaluation(editingEvaluation.id, evaluationData);
      } else {
        await createEvaluation(evaluationData);
      }
      await loadData();
      closeModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al guardar la evaluación");
    } finally {
      setSubmitting(false);
    }
  };


  const handleDelete = async (evaluation: Evaluation) => {
    const evalName = evaluation.name;
    if (!confirm(`¿Estás seguro de eliminar la evaluación "${evalName}"?`)) {
      return;
    }
    try {
      await deleteEvaluation(evaluation.id);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar la evaluación");
    }
  };

  const inputClass = formInputClass(theme);

  return (
    <>
      <ModuleLayout
        theme={theme}
        onBack={onBack}
        createLabel="Nueva Evaluación"
        onCreate={openCreateModal}
        canCreate={auth.canCreate("evaluations")}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar por nombre, asignatura o curso..."
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onRefresh={loadData}
        loading={loading}
        error={error}
        toolbarExtra={
          !isTeacherPanel ? (
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className={`min-w-[220px] rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:ring-2 ${theme.focusRing}`}
              aria-label="Filtrar por curso"
            >
              <option value="">Todos los cursos</option>
              {filterCourseOptions.map((course) => (
                <option key={course.id} value={String(course.id)}>
                  {course.label}
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
            Solo evaluaciones de <strong>{selectedCourse.courseLabel}</strong>. Luego califica en{" "}
            <strong>Poner notas</strong>.
          </ModuleHelpBanner>
        )}

        {isTeacherPanel && selectedCourse && (
          <TeacherContextBar theme={theme} course={selectedCourse} />
        )}

        {auth.isReadOnlyModule("evaluations") && (
          <ModuleHelpBanner>
            Solo consulta. Las pruebas y controles las crean y gestionan los docentes de cada
            materia.
          </ModuleHelpBanner>
        )}

        {(!isTeacherPanel || selectedCourse) && evaluations.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">📝</div>
            <p className="mb-4">No hay evaluaciones registradas</p>
            {auth.canCreate("evaluations") && (
              <button
                onClick={openCreateModal}
                className={`px-6 py-3 rounded-lg transition font-medium shadow-sm ${theme.primaryBtn}`}
              >
                Crear primera evaluación
              </button>
            )}
          </div>
        )}

        {(!isTeacherPanel || selectedCourse) && evaluations.length > 0 && filteredEvaluations.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">🔍</div>
            <p>No se encontraron evaluaciones con ese criterio de búsqueda o curso</p>
          </div>
        )}

        {(!isTeacherPanel || selectedCourse) && evaluationGroups.length > 0 && viewMode === "cards" && (
          <div className="space-y-8">
            {evaluationGroups.map((group) => (
              <section key={group.key}>
                {showGroupHeaders && (
                  <div className="mb-4 flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-slate-800">{group.label}</h3>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                      {group.evaluations.length}{" "}
                      {group.evaluations.length === 1 ? "evaluación" : "evaluaciones"}
                    </span>
                  </div>
                )}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {group.evaluations.map((evaluation) => (
                    <div key={evaluation.id} className={theme.cardClass}>
                      <div className="mb-4 text-4xl">📝</div>
                      <h3 className="mb-2 text-xl font-semibold text-gray-700">{evaluation.name}</h3>
                      <p className="mb-1 text-sm text-gray-600">Tipo: {evaluation.evaluationType}</p>
                      <p className="mb-1 text-sm text-gray-600">Estado: {evaluation.evaluationStatus}</p>
                      {!showGroupHeaders && (
                        <p className="mb-1 text-sm text-gray-600">
                          Curso: {getEvaluationCourseLabel(evaluation)}
                        </p>
                      )}
                      <p className="mb-1 text-sm text-gray-600">Ponderación: {evaluation.weight}%</p>
                      <p className="mb-1 text-sm text-gray-600">Nota máxima: {evaluation.maxScore}</p>
                      {evaluation.date && (
                        <p className="mb-1 text-sm text-gray-500">
                          {new Date(evaluation.date).toLocaleDateString()}
                        </p>
                      )}
                      <p className="mb-1 text-sm text-gray-500">{getSubjectName(evaluation.subjectId)}</p>
                      <div className="mt-4">
                        <RecordActions
                          onView={() => setViewingEvaluation(evaluation)}
                          onEdit={() => openEditModal(evaluation)}
                          onDelete={() => handleDelete(evaluation)}
                          canEdit={auth.canEdit("evaluations")}
                          canDelete={auth.canDelete("evaluations")}
                          compact
                          stretch
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {(!isTeacherPanel || selectedCourse) && evaluationGroups.length > 0 && viewMode === "table" && (
          <div className={theme.tableWrap}>
            <table className="w-full text-sm">
              <thead className={theme.tableHead}>
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Nombre</th>
                  <th className="px-4 py-3 text-left font-semibold">Tipo</th>
                  <th className="px-4 py-3 text-left font-semibold">Estado</th>
                  <th className="px-4 py-3 text-left font-semibold">Descripción</th>
                  <th className="px-4 py-3 text-left font-semibold">Ponderación</th>
                  <th className="px-4 py-3 text-left font-semibold">Nota máx.</th>
                  <th className="px-4 py-3 text-left font-semibold">Fecha</th>
                  <th className="px-4 py-3 text-left font-semibold">Asignatura</th>
                  {!showGroupHeaders && (
                    <th className="px-4 py-3 text-left font-semibold">Curso</th>
                  )}
                  <th className="px-4 py-3 text-center font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {evaluationGroups.map((group) => (
                  <Fragment key={group.key}>
                    {showGroupHeaders && (
                      <tr className="bg-slate-50">
                        <td
                          colSpan={showGroupHeaders ? 9 : 10}
                          className="px-4 py-3 text-sm font-semibold text-slate-700"
                        >
                          {group.label}
                          <span className="ml-2 font-normal text-slate-500">
                            ({group.evaluations.length}{" "}
                            {group.evaluations.length === 1 ? "evaluación" : "evaluaciones"})
                          </span>
                        </td>
                      </tr>
                    )}
                    {group.evaluations.map((evaluation) => (
                      <tr key={evaluation.id} className={`border-t border-slate-100 ${theme.tableRowHover}`}>
                        <td className="px-4 py-3 font-medium text-gray-700">{evaluation.name}</td>
                        <td className="px-4 py-3 text-gray-600">{evaluation.evaluationType || "—"}</td>
                        <td className="px-4 py-3 text-gray-600">{evaluation.evaluationStatus || "—"}</td>
                        <td
                          className="max-w-[200px] truncate px-4 py-3 text-gray-600"
                          title={evaluation.description ?? undefined}
                        >
                          {evaluation.description || "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {evaluation.weight != null ? `${evaluation.weight}%` : "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{evaluation.maxScore ?? "—"}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {evaluation.date ? new Date(evaluation.date).toLocaleDateString("es-CL") : "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{getSubjectName(evaluation.subjectId)}</td>
                        {!showGroupHeaders && (
                          <td className="px-4 py-3 text-gray-600">
                            {getEvaluationCourseLabel(evaluation)}
                          </td>
                        )}
                        <td className="px-4 py-3">
                          <RecordActions
                            onView={() => setViewingEvaluation(evaluation)}
                            onEdit={() => openEditModal(evaluation)}
                            onDelete={() => handleDelete(evaluation)}
                            canEdit={auth.canEdit("evaluations")}
                            canDelete={auth.canDelete("evaluations")}
                            compact
                          />
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ModuleLayout>

      {viewingEvaluation && (
        <ViewDetailModal
          title="Detalle de la evaluación"
          subtitle={viewingEvaluation.name}
          fields={getEvaluationDetailFields(viewingEvaluation)}
          onClose={() => setViewingEvaluation(null)}
          theme={theme}
        />
      )}

      {showModal && (
        <FormModal
          title={editingEvaluation ? "Editar Evaluación" : "Nueva Evaluación"}
          subtitle={editingEvaluation ? "Modifica los datos de la evaluación" : "Crea una nueva evaluación académica"}
          theme={theme}
          onClose={closeModal}
          onSubmit={handleSubmit}
          error={formError}
          submitting={submitting}
          submitLabel={editingEvaluation ? "Guardar cambios" : "Crear evaluación"}
        >
          <FormField label="Nombre" required fullWidth>
            <input type="text" name="name" value={formData.name} onChange={handleInputChange} className={inputClass} required />
          </FormField>
          <FormField label="Tipo">
            <select name="evaluationType" value={formData.evaluationType} onChange={handleInputChange} className={`${inputClass} bg-white`}>
              <option value="">Seleccionar</option>
              <option value="PRUEBA">PRUEBA</option>
              <option value="TRABAJO">TRABAJO</option>
              <option value="CONTROL">CONTROL</option>
              <option value="EXAMEN">EXAMEN</option>
            </select>
          </FormField>
          <FormField label="Estado">
            <select name="evaluationStatus" value={formData.evaluationStatus} onChange={handleInputChange} className={`${inputClass} bg-white`}>
              <option value="ACTIVO">ACTIVO</option>
              <option value="CERRADA">CERRADA</option>
              <option value="CANCELADA">CANCELADA</option>
            </select>
          </FormField>
          <FormField label="Descripción" fullWidth>
            <input type="text" name="description" value={formData.description} onChange={handleInputChange} className={inputClass} />
          </FormField>
          <FormField
            label="Ponderación (%)"
            fullWidth
            hint="Porcentaje de importancia en la nota final. Ej: Prueba 30%, Trabajo 20%. Las evaluaciones de una asignatura deberían sumar 100%."
          >
            <input type="number" name="weight" value={formData.weight} onChange={handleInputChange} placeholder="Ej: 30" className={inputClass} min={0} max={100} />
          </FormField>
          <FormField label="Nota máxima">
            <input type="number" name="maxScore" value={formData.maxScore} onChange={handleInputChange} className={inputClass} min="0" />
          </FormField>
          <FormField label="Fecha">
            <input type="date" name="date" value={formData.date} onChange={handleInputChange} className={inputClass} />
          </FormField>
          <FormField label="Asignatura" required fullWidth>
            <select
              name="subjectId"
              value={formData.subjectId}
              onChange={handleInputChange}
              className={`${inputClass} bg-white`}
              required
            >
              <option value="">Seleccionar asignatura</option>
              {formSubjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.subjectName} {subject.subjectCode ? `(${subject.subjectCode})` : ""}
                </option>
              ))}
            </select>
          </FormField>
          {!isTeacherPanel && (
            <FormField label="Curso" fullWidth>
              <select name="courseId" value={formData.courseId} onChange={handleInputChange} className={`${inputClass} bg-white`}>
                <option value="">Sin curso</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>{formatCourseLabel(course)}</option>
                ))}
              </select>
            </FormField>
          )}
        </FormModal>
      )}

    </>
  );
}

export default Evaluations;
