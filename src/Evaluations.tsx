
import { useState, useEffect } from "react";
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

interface EvaluationsProps {
  onBack: () => void;
}

function Evaluations({ onBack }: EvaluationsProps) {
  const theme = moduleThemes.evaluations;
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
  const [viewingEvaluation, setViewingEvaluation] = useState<Evaluation | null>(null);


  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [evaluationsData, subjectsData, coursesData] = await Promise.all([
        getEvaluations(),
        getSubjects(),
        getCourses(),
      ]);
      setEvaluations(evaluationsData);
      setSubjects(subjectsData);
      setCourses(coursesData);
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


  const getSubjectName = (subjectId?: number) => {
    if (!subjectId) return "Sin asignatura";
    const subject = subjects.find((s) => s.id === subjectId);
    return subject?.subjectName || `ID: ${subjectId}`;
  };

  const getCourseName = (courseId?: number) => {
    if (!courseId) return "Sin curso";
    const course = courses.find((c) => c.id === courseId);
    return course ? formatCourseLabel(course) : `ID: ${courseId}`;
  };

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
    { label: "Curso", value: getCourseName(evaluation.courseId) },
  ];

  const filteredEvaluations = evaluations.filter((evaluation) => {
    const searchLower = searchTerm.toLowerCase();
    const subjectName = (getSubjectName(evaluation.subjectId) ?? "").toLowerCase();
    return (
      (evaluation.name ?? "").toLowerCase().includes(searchLower) ||
      subjectName.includes(searchLower) ||
      (evaluation.evaluationType ?? "").toLowerCase().includes(searchLower)
    );
  });


  const openCreateModal = () => {
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
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar por nombre o asignatura..."
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onRefresh={loadData}
        loading={loading}
        error={error}
      >
        {evaluations.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">📝</div>
            <p className="mb-4">No hay evaluaciones registradas</p>
            <button
              onClick={openCreateModal}
              className={`px-6 py-3 rounded-lg transition font-medium shadow-sm ${theme.primaryBtn}`}
            >
              Crear primera evaluación
            </button>
          </div>
        )}

        {evaluations.length > 0 && filteredEvaluations.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">🔍</div>
            <p>No se encontraron evaluaciones con ese criterio de búsqueda</p>
          </div>
        )}

        {filteredEvaluations.length > 0 && viewMode === "cards" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvaluations.map((evaluation) => (
              <div key={evaluation.id} className={theme.cardClass}>
                <div className="text-4xl mb-4">📝</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">{evaluation.name}</h3>
                <p className="text-sm text-gray-600 mb-1">Tipo: {evaluation.evaluationType}</p>
                <p className="text-sm text-gray-600 mb-1">Estado: {evaluation.evaluationStatus}</p>
                <p className="text-sm text-gray-600 mb-1">Curso: {getCourseName(evaluation.courseId)}</p>
                <p className="text-sm text-gray-600 mb-1">Ponderación: {evaluation.weight}%</p>
                <p className="text-sm text-gray-600 mb-1">Nota máxima: {evaluation.maxScore}</p>
                {evaluation.date && (
                  <p className="text-sm text-gray-500 mb-1">{new Date(evaluation.date).toLocaleDateString()}</p>
                )}
                <p className="text-sm text-gray-500 mb-1">{getSubjectName(evaluation.subjectId)}</p>
                <div className="mt-4">
                  <RecordActions
                    onView={() => setViewingEvaluation(evaluation)}
                    onEdit={() => openEditModal(evaluation)}
                    onDelete={() => handleDelete(evaluation)}
                    compact
                    stretch
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredEvaluations.length > 0 && viewMode === "table" && (
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
                  <th className="px-4 py-3 text-left font-semibold">Curso</th>
                  <th className="px-4 py-3 text-center font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvaluations.map((evaluation) => (
                  <tr key={evaluation.id} className={`border-t border-slate-100 ${theme.tableRowHover}`}>
                    <td className="px-4 py-3 font-medium text-gray-700">{evaluation.name}</td>
                    <td className="px-4 py-3 text-gray-600">{evaluation.evaluationType || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{evaluation.evaluationStatus || "—"}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate" title={evaluation.description ?? undefined}>
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
                    <td className="px-4 py-3 text-gray-600">{getCourseName(evaluation.courseId)}</td>
                    <td className="px-4 py-3">
                      <RecordActions
                        onView={() => setViewingEvaluation(evaluation)}
                        onEdit={() => openEditModal(evaluation)}
                        onDelete={() => handleDelete(evaluation)}
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
          <FormField label="Asignatura" fullWidth>
            <select name="subjectId" value={formData.subjectId} onChange={handleInputChange} className={`${inputClass} bg-white`}>
              <option value="">Sin asignatura</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.subjectName} {subject.subjectCode ? `(${subject.subjectCode})` : ""}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Curso" fullWidth>
            <select name="courseId" value={formData.courseId} onChange={handleInputChange} className={`${inputClass} bg-white`}>
              <option value="">Sin curso</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>{formatCourseLabel(course)}</option>
              ))}
            </select>
          </FormField>
        </FormModal>
      )}
    </>
  );
}

export default Evaluations;
