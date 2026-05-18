
import { useState, useEffect } from "react";
import { getEvaluations, createEvaluation, updateEvaluation, deleteEvaluation } from "./api/evaluations";
import { getSubjects } from "./api/subjects";
import type { Evaluation, CreateEvaluationDto } from "./api/evaluations";
import type { Subject } from "./api/subjects";

type EvaluationUI = {
  id: number;
  name: string;
  date?: string;
  subjectId?: number;
  evaluationType?: string;
  evaluationStatus?: string;
  weight?: number;
  maxScore?: number;
  description?: string;
  grade?: number;
};

type FormData = {
  name: string;
  date?: string;
  subjectId: string;
  evaluationType?: string;
  evaluationStatus?: string;
  weight?: string;
  maxScore?: string;
  description?: string;
  grade?: string;
};

interface EvaluationsProps {
  onBack: () => void;
}

function Evaluations({ onBack }: EvaluationsProps) {
  const [evaluations, setEvaluations] = useState<EvaluationUI[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingEvaluation, setEditingEvaluation] = useState<Evaluation | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    date: "",
    subjectId: "",
    evaluationType: "",
    evaluationStatus: "",
    weight: "",
    maxScore: "",
    description: "",
    grade: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [searchTerm, setSearchTerm] = useState("");


  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [evaluationsData, subjectsData] = await Promise.all([
        getEvaluations(),
        getSubjects(),
      ]);
      // Usar solo camelCase (ya mapeado por el backend/api)
      const mappedEvaluations: EvaluationUI[] = evaluationsData.map(ev => ({
        id: ev.id,
        name: ev.name,
        date: ev.date,
        subjectId: ev.subjectId,
        evaluationType: ev.evaluationType,
        evaluationStatus: ev.evaluationStatus,
        weight: ev.weight,
        maxScore: ev.maxScore,
        description: ev.description,
        grade: ev.grade,
      }));
      setEvaluations(mappedEvaluations);
      setSubjects(subjectsData);
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
      evaluationType: "",
      evaluationStatus: "",
      weight: "",
      maxScore: "",
      description: "",
      grade: "",
    });
    setFormError(null);
    setShowModal(true);
  };


  // Recibe Evaluation (snake_case) o EvaluationUI (camelCase)
  const openEditModal = (evaluation: Evaluation | EvaluationUI) => {
    setEditingEvaluation(evaluation as Evaluation);
    setFormData({
      name: (evaluation as EvaluationUI).name ?? "",
      date: (evaluation as EvaluationUI).date ?? "",
      subjectId: (evaluation as EvaluationUI).subjectId?.toString() ?? "",
      evaluationType: (evaluation as EvaluationUI).evaluationType ?? "",
      evaluationStatus: (evaluation as EvaluationUI).evaluationStatus ?? "",
      weight: (evaluation as EvaluationUI).weight?.toString() ?? "",
      maxScore: (evaluation as EvaluationUI).maxScore?.toString() ?? "",
      description: (evaluation as EvaluationUI).description ?? "",
      grade: (evaluation as EvaluationUI).grade?.toString() ?? "",
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
      evaluationType: "",
      evaluationStatus: "",
      weight: "",
      maxScore: "",
      description: "",
      grade: "",
    });
    setFormError(null);
  };


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
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
      const evaluationData: CreateEvaluationDto & { nota?: number } = {
        name: formData.name.trim(),
        date: formData.date || undefined,
        subjectId: formData.subjectId ? parseInt(formData.subjectId) : undefined,
        evaluationType: formData.evaluationType?.trim() || undefined,
        evaluationStatus: formData.evaluationStatus?.trim() || undefined,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        maxScore: formData.maxScore ? parseFloat(formData.maxScore) : undefined,
        description: formData.description?.trim() || undefined,
        // Solo incluir 'nota' si está presente y es un número válido
        ...(formData.grade && !isNaN(Number(formData.grade)) ? { nota: parseFloat(formData.grade) } : {}),
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


  // Puede recibir Evaluation (snake_case) o EvaluationUI (camelCase)
  const handleDelete = async (evaluation: Evaluation | EvaluationUI) => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-sky-50 to-blue-50 p-8">
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
                <h2 className="text-3xl font-bold text-gray-700 mb-2">📝 Evaluaciones</h2>
                <p className="text-gray-500">Gestión de evaluaciones</p>
              </div>
              <button
                onClick={openCreateModal}
                className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition font-medium shadow-sm flex items-center gap-2"
              >
                <span>➕</span>
                Nueva Evaluación
              </button>
            </div>

            {/* Barra de herramientas */}
            <div className="flex gap-3 items-center flex-wrap">
              {/* Búsqueda */}
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="🔍 Buscar por nombre o asignatura..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                />
              </div>

              {/* Toggle Vista */}
              <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("cards")}
                  className={`px-4 py-2 rounded-lg transition font-medium flex items-center gap-2 ${
                    viewMode === "cards"
                      ? "bg-cyan-500 text-white"
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
                      ? "bg-cyan-500 text-white"
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
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
              <p className="mt-4 text-gray-500">Cargando evaluaciones...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-600">❌ {error}</p>
            </div>
          )}

          {!loading && !error && evaluations.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">📝</div>
              <p className="mb-4">No hay evaluaciones registradas</p>
              <button
                onClick={openCreateModal}
                className="px-6 py-3 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition font-medium shadow-sm"
              >
                Crear primera evaluación
              </button>
            </div>
          )}

          {!loading && !error && evaluations.length > 0 && filteredEvaluations.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">🔍</div>
              <p>No se encontraron evaluaciones con ese criterio de búsqueda</p>
            </div>
          )}

          {!loading && !error && filteredEvaluations.length > 0 && viewMode === "cards" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvaluations.map((evaluation) => (
                <div
                  key={evaluation.id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition bg-gradient-to-br from-cyan-50 to-sky-50"
                >
                  <div className="text-4xl mb-4">📝</div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    {evaluation.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-1">Tipo: {evaluation.evaluationType}</p>
                  <p className="text-sm text-gray-600 mb-1">Estado: {evaluation.evaluationStatus}</p>
                  <p className="text-sm text-gray-600 mb-1">Nota: {evaluation.grade ?? '-'}</p>
                  <p className="text-sm text-gray-600 mb-1">Ponderación: {evaluation.weight}</p>
                  <p className="text-sm text-gray-600 mb-1">Nota máxima: {evaluation.maxScore}</p>
                  {evaluation.date && (
                    <p className="text-sm text-gray-500 mb-1">📅 {new Date(evaluation.date).toLocaleDateString()}</p>
                  )}
                  <p className="text-sm text-gray-500 mb-1">📚 {getSubjectName(evaluation.subjectId)}</p>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => openEditModal(evaluation)}
                      className="flex-1 px-3 py-2 bg-yellow-400 text-white rounded-lg hover:bg-yellow-500 transition font-medium text-sm"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => handleDelete(evaluation)}
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
          {!loading && !error && filteredEvaluations.length > 0 && viewMode === "table" && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-cyan-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Nombre</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Tipo</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Estado</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Nota</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Ponderación</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Nota Máx.</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Fecha</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Asignatura</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredEvaluations.map((evaluation) => (
                    <tr key={evaluation.id} className="hover:bg-cyan-50 transition">
                      <td className="px-4 py-3 text-sm text-gray-700">{evaluation.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{evaluation.evaluationType}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{evaluation.evaluationStatus}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{evaluation.grade ?? '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{evaluation.weight}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{evaluation.maxScore}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{evaluation.date ? new Date(evaluation.date).toLocaleDateString() : "-"}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{getSubjectName(evaluation.subjectId)}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => openEditModal(evaluation)}
                            className="px-3 py-1 bg-yellow-400 text-white rounded-lg hover:bg-yellow-500 transition font-medium text-xs"
                          >
                            ✏️ Editar
                          </button>
                          <button
                            onClick={() => handleDelete(evaluation)}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 z-50 overflow-y-auto min-h-screen">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-4 sm:p-6 overflow-y-auto max-h-[95vh]">
            <h3 className="text-xl font-bold text-gray-700 mb-4">
              {editingEvaluation ? "Editar Evaluación" : "Nueva Evaluación"}
            </h3>
            {formError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-red-600 text-sm">❌ {formError}</p>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Nombre *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Tipo</label>
                <input
                  type="text"
                  name="evaluationType"
                  value={formData.evaluationType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Estado</label>
                <input
                  type="text"
                  name="evaluationStatus"
                  value={formData.evaluationStatus}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Descripción</label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Ponderación</label>
                <input
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                  min="0"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Nota máxima</label>
                <input
                  type="number"
                  name="maxScore"
                  value={formData.maxScore}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                  min="0"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Nota chilena</label>
                <input
                  type="number"
                  name="grade"
                  min="1"
                  max="7"
                  step="0.1"
                  value={formData.grade}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Fecha</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">Asignatura</label>
                <select
                  name="subjectId"
                  value={formData.subjectId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                >
                  <option value="">Sin asignatura</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.subjectName} {subject.subjectCode ? `(${subject.subjectCode})` : ""}
                    </option>
                  ))}
                </select>
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
                  className="flex-1 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition font-medium disabled:opacity-50"
                >
                  {submitting ? "Guardando..." : editingEvaluation ? "Actualizar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Evaluations;
