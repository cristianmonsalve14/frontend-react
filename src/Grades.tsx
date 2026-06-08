import { useState, useEffect } from "react";
import { getGrades, createGrade, updateGrade, deleteGrade } from "./api/grades";
import type { Grade, CreateGradeDto } from "./api/grades";
import { getStudents } from "./api/students";
import { getEvaluations } from "./api/evaluations";
import { getSubjects } from "./api/subjects";
import { getTeachers } from "./api/teachers";
import type { Student } from "./api/students";
import type { Evaluation } from "./api/evaluations";
import type { Subject } from "./api/subjects";
import type { Teacher } from "./api/teachers";
import { moduleThemes } from "./theme/moduleThemes";
import ModuleLayout from "./components/ModuleLayout";
import RecordActions from "./components/RecordActions";
import FormModal, { FormField, formInputClass } from "./components/FormModal";

interface FormData {
  studentId: string;
  evaluationId: string;
  subjectId: string;
  score: string;
  gradeDate: string;
  gradeStatus: string;
  teacherComments: string;
  isAbsent: boolean;
  gradedByTeacherId: string;
}

const initialForm: FormData = {
  studentId: "",
  evaluationId: "",
  subjectId: "",
  score: "",
  gradeDate: new Date().toISOString().slice(0, 10),
  gradeStatus: "DEFINITIVA",
  teacherComments: "",
  isAbsent: false,
  gradedByTeacherId: "",
};

interface GradesProps {
  onBack: () => void;
}

function Grades({ onBack }: GradesProps) {
  const theme = moduleThemes.grades;
  const [grades, setGrades] = useState<Grade[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Grade | null>(null);
  const [formData, setFormData] = useState<FormData>(initialForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEvaluation, setFilterEvaluation] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [gradesData, studentsData, evaluationsData, subjectsData, teachersData] =
        await Promise.all([
          getGrades(),
          getStudents(),
          getEvaluations(),
          getSubjects(),
          getTeachers(),
        ]);
      setGrades(gradesData);
      setStudents(studentsData);
      setEvaluations(evaluationsData);
      setSubjects(subjectsData);
      setTeachers(teachersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar notas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const getStudentName = (id: number) => {
    const s = students.find((x) => x.id === id);
    return s ? `${s.firstName} ${s.lastName}` : `ID: ${id}`;
  };

  const getEvaluationName = (id: number) => {
    const e = evaluations.find((x) => x.id === id);
    return e?.name ?? `ID: ${id}`;
  };

  const getSubjectName = (id: number) => {
    const s = subjects.find((x) => x.id === id);
    return s?.subjectName ?? `ID: ${id}`;
  };

  const getTeacherName = (id?: number) => {
    if (!id) return "-";
    const t = teachers.find((x) => x.id === id);
    return t ? `${t.firstName} ${t.lastName}` : `ID: ${id}`;
  };

  const filtered = grades.filter((g) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      getStudentName(g.studentId).toLowerCase().includes(q) ||
      getEvaluationName(g.evaluationId).toLowerCase().includes(q) ||
      getSubjectName(g.subjectId).toLowerCase().includes(q);
    const matchEval = !filterEvaluation || g.evaluationId === parseInt(filterEvaluation);
    return matchSearch && matchEval;
  });

  const openCreate = () => {
    setEditing(null);
    setFormData(initialForm);
    setFormError(null);
    setShowModal(true);
  };

  const openEdit = (g: Grade) => {
    setEditing(g);
    setFormData({
      studentId: g.studentId.toString(),
      evaluationId: g.evaluationId.toString(),
      subjectId: g.subjectId.toString(),
      score: g.score.toString(),
      gradeDate: g.gradeDate?.slice(0, 10) ?? "",
      gradeStatus: g.gradeStatus ?? "DEFINITIVA",
      teacherComments: g.teacherComments ?? "",
      isAbsent: g.isAbsent ?? false,
      gradedByTeacherId: g.gradedByTeacherId?.toString() ?? "",
    });
    setFormError(null);
    setShowModal(true);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (name === "evaluationId") {
      const evaluation = evaluations.find((ev) => ev.id === parseInt(value));
      setFormData((prev) => ({
        ...prev,
        evaluationId: value,
        subjectId: evaluation?.subjectId?.toString() ?? prev.subjectId,
      }));
      return;
    }
    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentId || !formData.evaluationId || !formData.subjectId) {
      setFormError("Estudiante, evaluación y asignatura son obligatorios");
      return;
    }
    if (!formData.isAbsent) {
      const score = parseFloat(formData.score);
      if (isNaN(score) || score < 1 || score > 7) {
        setFormError("La nota debe estar entre 1.0 y 7.0 (escala chilena)");
        return;
      }
    }
    setSubmitting(true);
    setFormError(null);
    const payload: CreateGradeDto = {
      studentId: parseInt(formData.studentId),
      evaluationId: parseInt(formData.evaluationId),
      subjectId: parseInt(formData.subjectId),
      score: formData.isAbsent ? 1.0 : parseFloat(formData.score),
      gradeDate: formData.gradeDate || new Date().toISOString().slice(0, 10),
      gradeStatus: formData.isAbsent ? "AUSENTE" : formData.gradeStatus,
      teacherComments: formData.teacherComments?.trim() || undefined,
      isAbsent: formData.isAbsent,
      gradedByTeacherId: formData.gradedByTeacherId
        ? parseInt(formData.gradedByTeacherId)
        : undefined,
    };
    try {
      if (editing) {
        await updateGrade(editing.id, payload);
      } else {
        await createGrade(payload);
      }
      await loadData();
      setShowModal(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al guardar nota");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (g: Grade) => {
    if (!confirm(`¿Eliminar nota de ${getStudentName(g.studentId)}?`)) return;
    try {
      await deleteGrade(g.id);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
    }
  };

  const inputClass = formInputClass(theme);
  const toolbarExtra = (
    <select
      value={filterEvaluation}
      onChange={(e) => setFilterEvaluation(e.target.value)}
      className={`px-4 py-2 border border-slate-200 rounded-lg bg-white text-sm ${theme.focusRing}`}
    >
      <option value="">Todas las evaluaciones</option>
      {evaluations.map((ev) => (
        <option key={ev.id} value={ev.id}>
          {ev.name}
        </option>
      ))}
    </select>
  );

  return (
    <>
      <ModuleLayout
        theme={theme}
        onBack={onBack}
        createLabel="Nueva Nota"
        onCreate={openCreate}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar por estudiante, evaluación o asignatura..."
        onRefresh={loadData}
        loading={loading}
        error={error}
        toolbarExtra={toolbarExtra}
      >
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">📊</div>
            <p>No hay notas registradas</p>
            <button
              onClick={openCreate}
              className={`mt-4 px-6 py-3 rounded-lg ${theme.primaryBtn}`}
            >
              Registrar primera nota
            </button>
          </div>
        )}

        {filtered.length > 0 && (
          <div className={theme.tableWrap}>
            <table className="w-full text-sm">
              <thead className={theme.tableHead}>
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Estudiante</th>
                  <th className="px-4 py-3 text-left font-semibold">Evaluación</th>
                  <th className="px-4 py-3 text-left font-semibold">Asignatura</th>
                  <th className="px-4 py-3 text-left font-semibold">Nota</th>
                  <th className="px-4 py-3 text-left font-semibold">Estado</th>
                  <th className="px-4 py-3 text-left font-semibold">Fecha</th>
                  <th className="px-4 py-3 text-left font-semibold">Docente</th>
                  <th className="px-4 py-3 text-center font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((g) => (
                  <tr key={g.id} className={`border-t border-slate-100 ${theme.tableRowHover}`}>
                    <td className="px-4 py-3">{getStudentName(g.studentId)}</td>
                    <td className="px-4 py-3">{getEvaluationName(g.evaluationId)}</td>
                    <td className="px-4 py-3">{getSubjectName(g.subjectId)}</td>
                    <td className="px-4 py-3 font-bold">{g.isAbsent ? "AUSENTE" : g.score}</td>
                    <td className="px-4 py-3">{g.gradeStatus}</td>
                    <td className="px-4 py-3">{g.gradeDate}</td>
                    <td className="px-4 py-3">{getTeacherName(g.gradedByTeacherId)}</td>
                    <td className="px-4 py-3">
                      <RecordActions onEdit={() => openEdit(g)} onDelete={() => handleDelete(g)} compact />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ModuleLayout>

      {showModal && (
        <FormModal
          title={editing ? "Editar Nota" : "Nueva Nota"}
          subtitle={editing ? "Modifica la calificación registrada" : "Registra una nueva calificación"}
          theme={theme}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
          error={formError}
          submitting={submitting}
          submitLabel={editing ? "Guardar cambios" : "Registrar nota"}
        >
          <FormField label="Evaluación" required fullWidth>
            <select name="evaluationId" value={formData.evaluationId} onChange={handleChange} required className={`${inputClass} bg-white`}>
              <option value="">Seleccionar evaluación</option>
              {evaluations.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name} — {getSubjectName(ev.subjectId ?? 0)}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Asignatura" required>
            <select name="subjectId" value={formData.subjectId} onChange={handleChange} required className={`${inputClass} bg-white`}>
              <option value="">Seleccionar asignatura</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.subjectName} ({s.subjectCode})
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Estudiante" required>
            <select name="studentId" value={formData.studentId} onChange={handleChange} required className={`${inputClass} bg-white`}>
              <option value="">Seleccionar estudiante</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.firstName} {s.lastName} — {s.rut}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Docente calificador" fullWidth>
            <select name="gradedByTeacherId" value={formData.gradedByTeacherId} onChange={handleChange} className={`${inputClass} bg-white`}>
              <option value="">Sin asignar</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.firstName} {t.lastName}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Asistencia" fullWidth>
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-700">
              <input type="checkbox" name="isAbsent" checked={formData.isAbsent} onChange={handleChange} className="rounded border-slate-300" />
              Estudiante ausente en la evaluación
            </label>
          </FormField>
          {!formData.isAbsent && (
            <FormField label="Nota (1.0 – 7.0)" required>
              <input type="number" name="score" value={formData.score} onChange={handleChange} min="1" max="7" step="0.1" required className={inputClass} />
            </FormField>
          )}
          <FormField label="Estado">
            <select name="gradeStatus" value={formData.gradeStatus} onChange={handleChange} disabled={formData.isAbsent} className={`${inputClass} bg-white`}>
              <option value="DEFINITIVA">DEFINITIVA</option>
              <option value="PRELIMINAR">PRELIMINAR</option>
              <option value="EN_REVISION">EN REVISIÓN</option>
            </select>
          </FormField>
          <FormField label="Fecha">
            <input type="date" name="gradeDate" value={formData.gradeDate} onChange={handleChange} className={inputClass} />
          </FormField>
          <FormField label="Comentarios del docente" fullWidth>
            <textarea name="teacherComments" value={formData.teacherComments} onChange={handleChange} rows={3} className={inputClass} />
          </FormField>
        </FormModal>
      )}
    </>
  );
}

export default Grades;
