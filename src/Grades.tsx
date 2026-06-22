import { useState, useEffect, useMemo } from "react";
import { getGrades, createGrade, updateGrade, deleteGrade } from "./api/grades";
import type { Grade, CreateGradeDto } from "./api/grades";
import { getStudents } from "./api/students";
import { getEvaluations } from "./api/evaluations";
import { getSubjects } from "./api/subjects";
import { getTeachers, getCurrentTeacher } from "./api/teachers";
import type { Student } from "./api/students";
import type { Evaluation } from "./api/evaluations";
import type { Subject } from "./api/subjects";
import type { Teacher } from "./api/teachers";
import { moduleThemes } from "./theme/moduleThemes";
import ModuleLayout from "./components/ModuleLayout";
import RecordActions from "./components/RecordActions";
import FormModal, { FormField, formInputClass } from "./components/FormModal";
import ViewDetailModal, { type DetailField } from "./components/ViewDetailModal";
import { formatStudentFullName, STUDENT_NAME_COLUMNS } from "./utils/formatStudentFullName";
import { useAuth } from "./auth/AuthContext";
import { useTeacherCourse } from "./teacher/TeacherCourseContext";
import { sortById } from "./utils/sortById";
import { formatRutDisplay, RUT_TABLE_CELL_CLASS } from "./utils/formatRut";
import { formatCourseLabel } from "./utils/formatCourseLabel";
import TeacherContextBar from "./components/TeacherContextBar";
import TeacherCourseRequired from "./components/TeacherCourseRequired";
import ModuleHelpBanner from "./components/ModuleHelpBanner";
import { validateNotFutureDateField } from "./utils/validateDate";

type GradesViewMode = "grading" | "overview" | "individual";

interface GradingDraftEntry {
  score: string;
  isAbsent: boolean;
  gradeId?: number;
}

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
  const auth = useAuth();
  const isTeacherPanel = auth.isTeacher && !auth.isAdmin;
  const teacherCourse = useTeacherCourse();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [currentTeacher, setCurrentTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [viewingGrade, setViewingGrade] = useState<Grade | null>(null);
  const [editing, setEditing] = useState<Grade | null>(null);
  const [formData, setFormData] = useState<FormData>(initialForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEvaluation, setFilterEvaluation] = useState("");
  const [viewMode, setViewMode] = useState<GradesViewMode>(
    isTeacherPanel ? "grading" : "overview",
  );
  const [filterSubject, setFilterSubject] = useState("");
  const [gradingSubjectId, setGradingSubjectId] = useState("");
  const [gradingEvaluationId, setGradingEvaluationId] = useState("");
  const [gradingDraft, setGradingDraft] = useState<Record<number, GradingDraftEntry>>({});
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [gradesData, studentsData, evaluationsData, subjectsData] = await Promise.all([
        getGrades(),
        getStudents(),
        getEvaluations(),
        getSubjects(),
      ]);
      setGrades(sortById(gradesData));
      setStudents(sortById(studentsData));
      setEvaluations(sortById(evaluationsData));
      setSubjects(sortById(subjectsData));

      if (auth.isTeacher && !auth.isAdmin) {
        const me = await getCurrentTeacher();
        setCurrentTeacher(me);
        setTeachers(me ? [me] : []);
      } else {
        const teachersData = await getTeachers();
        setTeachers(sortById(teachersData));
        setCurrentTeacher(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar notas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const teacherId = currentTeacher?.id ?? teacherCourse.teacherId;

  const subjectById = useMemo(
    () => new Map(subjects.map((subject) => [subject.id, subject])),
    [subjects],
  );

  const {
    selectedCourseId,
    selectedCourse,
    courseSubjects,
    courseStudents,
    courseOptions,
    courses: allCourses,
  } = teacherCourse;

  const courseFilterOptions = useMemo(() => {
    if (isTeacherPanel) return courseOptions;
    return sortById(allCourses).map((course) => ({
      courseId: course.id,
      courseLabel: formatCourseLabel(course),
    }));
  }, [isTeacherPanel, courseOptions, allCourses]);

  const matrixEvaluations = useMemo(() => {
    const subjectIds = new Set(
      courseSubjects
        .filter((s) => !filterSubject || s.id === parseInt(filterSubject))
        .map((s) => s.id),
    );
    return evaluations
      .filter((ev) => ev.subjectId && subjectIds.has(ev.subjectId))
      .sort((a, b) => {
        const subA = subjectById.get(a.subjectId ?? 0)?.subjectName ?? "";
        const subB = subjectById.get(b.subjectId ?? 0)?.subjectName ?? "";
        if (subA !== subB) return subA.localeCompare(subB, "es");
        return (a.name ?? "").localeCompare(b.name ?? "es");
      });
  }, [evaluations, courseSubjects, filterSubject, subjectById]);

  const gradeByStudentEvaluation = useMemo(() => {
    const map = new Map<string, Grade>();
    grades.forEach((grade) => {
      map.set(`${grade.studentId}-${grade.evaluationId}`, grade);
    });
    return map;
  }, [grades]);

  const subjectEvaluations = useMemo(() => {
    if (!gradingSubjectId) return [];
    const subjectId = parseInt(gradingSubjectId);
    return evaluations
      .filter((ev) => ev.subjectId === subjectId)
      .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "es"));
  }, [evaluations, gradingSubjectId]);

  useEffect(() => {
    if (!gradingEvaluationId) {
      setGradingDraft({});
      return;
    }
    const evalId = parseInt(gradingEvaluationId);
    const draft: Record<number, GradingDraftEntry> = {};
    courseStudents.forEach((student) => {
      const existing = gradeByStudentEvaluation.get(`${student.id}-${evalId}`);
      draft[student.id] = {
        score: existing && !existing.isAbsent ? String(existing.score) : "",
        isAbsent: existing?.isAbsent ?? false,
        gradeId: existing?.id,
      };
    });
    setGradingDraft(draft);
  }, [gradingEvaluationId, courseStudents, gradeByStudentEvaluation]);

  const formatGradeCell = (grade: Grade | undefined) => {
    if (!grade) return null;
    if (grade.isAbsent) return "AUS";
    return grade.score.toFixed(1);
  };

  const computeStudentAverage = (studentId: number) => {
    const scores = matrixEvaluations
      .map((ev) => gradeByStudentEvaluation.get(`${studentId}-${ev.id}`))
      .filter((g): g is Grade => g !== undefined && !g.isAbsent)
      .map((g) => g.score);
    if (scores.length === 0) return null;
    const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    return avg.toFixed(1);
  };

  const getStudentName = (grade: Grade) => {
    if (grade.studentName) return grade.studentName;
    const s = students.find((x) => x.id === grade.studentId);
    return s ? formatStudentFullName(s) : "Estudiante no disponible";
  };

  const detailFields = (grade: Grade): DetailField[] => {
    const student = students.find((x) => x.id === grade.studentId);
    return [
      { label: "Estudiante", value: getStudentName(grade) },
      ...(student
        ? [
            { label: "Primer nombre", value: student.firstName },
            { label: "Segundo nombre", value: student.secondName },
            { label: "Apellido paterno", value: student.lastName },
            { label: "Apellido materno", value: student.motherLastName },
            { label: "RUT", value: formatRutDisplay(student.rut) || student.rut },
          ]
        : []),
      { label: "Evaluación", value: getEvaluationName(grade) },
      { label: "Asignatura", value: getSubjectName(grade) },
      { label: "Nota", value: grade.isAbsent ? "AUSENTE" : grade.score },
      { label: "Estado", value: grade.gradeStatus },
      { label: "Fecha", value: grade.gradeDate },
      { label: "Docente calificador", value: getTeacherName(grade) },
      {
        label: "Ausente en evaluación",
        value: grade.isAbsent ? "Sí" : "No",
      },
      { label: "Comentarios del docente", value: grade.teacherComments, fullWidth: true },
    ];
  };

  const getEvaluationName = (grade: Grade) => {
    if (grade.evaluationName) return grade.evaluationName;
    const e = evaluations.find((x) => x.id === grade.evaluationId);
    return e?.name ?? "Evaluación no disponible";
  };

  const getSubjectName = (grade: Grade) => {
    if (grade.subjectName) return grade.subjectName;
    const s = subjects.find((x) => x.id === grade.subjectId);
    return s?.subjectName ?? "Asignatura no disponible";
  };

  const getTeacherName = (grade: Grade) => {
    if (grade.gradedByTeacherName) return grade.gradedByTeacherName;
    if (grade.gradedByTeacherId && currentTeacher?.id === grade.gradedByTeacherId) {
      return [currentTeacher.firstName, currentTeacher.lastName].filter(Boolean).join(" ");
    }
    if (!grade.gradedByTeacherId) return "—";
    const t = teachers.find((x) => x.id === grade.gradedByTeacherId);
    return t ? `${t.firstName} ${t.lastName}` : "Docente no disponible";
  };

  const getGradeCourseId = (grade: Grade): number | undefined =>
    subjectById.get(grade.subjectId)?.courseId;

  const evaluationsForFilter = useMemo(() => {
    if (!selectedCourseId) return evaluations;
    const subjectIds = new Set(
      subjects.filter((s) => s.courseId === selectedCourseId).map((s) => s.id),
    );
    return evaluations.filter((ev) => ev.subjectId && subjectIds.has(ev.subjectId));
  }, [evaluations, subjects, selectedCourseId]);

  useEffect(() => {
    if (!filterEvaluation) return;
    const evalId = parseInt(filterEvaluation, 10);
    if (!evaluationsForFilter.some((ev) => ev.id === evalId)) {
      setFilterEvaluation("");
    }
  }, [selectedCourseId, evaluationsForFilter, filterEvaluation]);

  const filtered = grades.filter((g) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      getStudentName(g).toLowerCase().includes(q) ||
      getEvaluationName(g).toLowerCase().includes(q) ||
      getSubjectName(g).toLowerCase().includes(q);
    const matchEval = !filterEvaluation || g.evaluationId === parseInt(filterEvaluation);
    const matchCourse =
      !selectedCourseId || getGradeCourseId(g) === selectedCourseId;
    return matchSearch && matchEval && matchCourse;
  });

  const filteredMatrixStudents = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return courseStudents;
    return courseStudents.filter((student) => {
      const fullName = formatStudentFullName(student).toLowerCase();
      return fullName.includes(q) || (student.rut ?? "").toLowerCase().includes(q);
    });
  }, [courseStudents, searchTerm]);

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
    const selectedEvaluation = evaluations.find((ev) => ev.id === parseInt(formData.evaluationId));
    if (selectedEvaluation?.subjectId && selectedEvaluation.subjectId !== parseInt(formData.subjectId)) {
      setFormError("La asignatura no coincide con la evaluación seleccionada");
      return;
    }
    if (formData.gradeDate?.trim()) {
      const dateError = validateNotFutureDateField(formData.gradeDate, "La fecha de la nota");
      if (dateError) {
        setFormError(dateError);
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
    if (!confirm(`¿Eliminar la nota de ${getStudentName(g)}?`)) return;
    try {
      await deleteGrade(g.id);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
    }
  };

  const updateGradingDraft = (
    studentId: number,
    patch: Partial<GradingDraftEntry>,
  ) => {
    setGradingDraft((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], ...patch },
    }));
  };

  const handleBulkSave = async () => {
    if (!gradingSubjectId || !gradingEvaluationId) {
      setError("Primero elige la materia y la prueba");
      return;
    }
    const subjectId = parseInt(gradingSubjectId);
    const evaluationId = parseInt(gradingEvaluationId);
    const toSave = courseStudents.filter((student) => {
      const entry = gradingDraft[student.id];
      if (!entry) return false;
      return entry.isAbsent || entry.score.trim() !== "" || entry.gradeId;
    });

    if (toSave.length === 0) {
      setError("Ingresa al menos una nota o marca un alumno como ausente");
      return;
    }

    for (const student of toSave) {
      const entry = gradingDraft[student.id];
      if (!entry.isAbsent) {
        const score = parseFloat(entry.score);
        if (entry.score.trim() === "" && entry.gradeId) continue;
        if (isNaN(score) || score < 1 || score > 7) {
          setError(`La nota de ${formatStudentFullName(student)} debe estar entre 1.0 y 7.0`);
          return;
        }
      }
    }

    if (!confirm(`¿Guardar las notas de ${toSave.length} alumno${toSave.length !== 1 ? "s" : ""}?`)) {
      return;
    }

    setSubmitting(true);
    setError(null);
    setSaveMessage(null);
    try {
      for (const student of toSave) {
        const entry = gradingDraft[student.id];
        const payload: CreateGradeDto = {
          studentId: student.id,
          evaluationId,
          subjectId,
          score: entry.isAbsent ? 1.0 : parseFloat(entry.score),
          gradeDate: new Date().toISOString().slice(0, 10),
          gradeStatus: entry.isAbsent ? "AUSENTE" : "DEFINITIVA",
          isAbsent: entry.isAbsent,
          gradedByTeacherId: teacherId ?? undefined,
        };
        if (entry.gradeId) {
          await updateGrade(entry.gradeId, payload);
        } else if (entry.isAbsent || entry.score.trim() !== "") {
          await createGrade(payload);
        }
      }
      await loadData();
      setSaveMessage(`Notas guardadas correctamente (${toSave.length} alumno${toSave.length !== 1 ? "s" : ""})`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar las notas");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = formInputClass(theme);
  const toolbarExtra = (
    <>
      <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
        {(isTeacherPanel
          ? [
              { mode: "grading" as const, label: "Poner notas" },
              { mode: "overview" as const, label: "Ver todas las notas" },
            ]
          : [
              { mode: "overview" as const, label: "Resumen por curso" },
              { mode: "individual" as const, label: "Lista detallada" },
            ]
        ).map(({ mode, label }) => (
          <button
            key={mode}
            type="button"
            onClick={() => setViewMode(mode)}
            className={`rounded-md px-3 py-2.5 text-sm font-medium transition ${
              viewMode === mode
                ? theme.toggleActive
                : "text-slate-600 hover:bg-white hover:text-slate-800"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {!isTeacherPanel &&
        (viewMode === "overview" || viewMode === "individual") &&
        courseFilterOptions.length > 0 && (
        <select
          value={selectedCourseId ?? ""}
          onChange={(e) => {
            const value = e.target.value;
            if (value) {
              teacherCourse.selectCourse(parseInt(value, 10));
            }
          }}
          className={`min-w-[200px] rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:ring-2 ${theme.focusRing}`}
          aria-label="Filtrar por curso"
        >
          <option value="">Seleccionar curso...</option>
          {courseFilterOptions.map((option) => (
            <option key={option.courseId} value={option.courseId}>
              {option.courseLabel}
            </option>
          ))}
        </select>
      )}

      {viewMode === "individual" && (
        <select
          value={filterEvaluation}
          onChange={(e) => setFilterEvaluation(e.target.value)}
          className={`px-4 py-2 border border-slate-200 rounded-lg bg-white text-sm ${theme.focusRing}`}
        >
          <option value="">Todas las pruebas</option>
          {evaluationsForFilter.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.name}
            </option>
          ))}
        </select>
      )}

      {viewMode === "overview" && selectedCourseId && courseSubjects.length > 1 && (
        <select
          value={filterSubject}
          onChange={(e) => setFilterSubject(e.target.value)}
          className={`px-4 py-2 border border-slate-200 rounded-lg bg-white text-sm ${theme.focusRing}`}
        >
          <option value="">Todas las materias</option>
          {courseSubjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.subjectName}
            </option>
          ))}
        </select>
      )}
    </>
  );

  return (
    <>
      <ModuleLayout
        theme={theme}
        onBack={onBack}
        createLabel="Agregar una nota"
        onCreate={openCreate}
        canCreate={auth.canCreate("grades") && viewMode === "individual"}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={
          viewMode === "grading" || viewMode === "overview"
            ? "Buscar alumno por nombre o RUT..."
            : "Buscar por estudiante, prueba o materia..."
        }
        toolbarExtra={toolbarExtra}
        onRefresh={loadData}
        loading={loading}
        error={error}
      >
        {isTeacherPanel && !selectedCourse && !loading && (
          <TeacherCourseRequired theme={theme} onBack={onBack} />
        )}

        {isTeacherPanel && viewMode === "grading" && selectedCourse && (
          <ModuleHelpBanner>
            Solo alumnos y evaluaciones de <strong>{selectedCourse.courseLabel}</strong>. Elige
            materia y prueba, escribe las notas y presiona <strong>Guardar todas las notas</strong>.
          </ModuleHelpBanner>
        )}

        {!isTeacherPanel && auth.isReadOnlyModule("grades") && (
          <ModuleHelpBanner>
            Como administración puedes <strong>consultar</strong> las notas del colegio. Registrar o
            modificar calificaciones es responsabilidad de cada docente.
          </ModuleHelpBanner>
        )}

        {saveMessage && (
          <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
            {saveMessage}
          </div>
        )}

        {isTeacherPanel && selectedCourse && (viewMode === "grading" || viewMode === "overview") && (
          <TeacherContextBar theme={theme} course={selectedCourse} />
        )}

        {viewMode === "grading" && isTeacherPanel && selectedCourse && (
          <>
            <div className="mb-6 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">
                  1. Materia
                </span>
                <select
                  value={gradingSubjectId}
                  onChange={(e) => {
                    setGradingSubjectId(e.target.value);
                    setGradingEvaluationId("");
                  }}
                  className={`w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-base ${theme.focusRing}`}
                >
                  <option value="">Selecciona la materia</option>
                  {courseSubjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.subjectName}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">
                  2. Prueba o control
                </span>
                <select
                  value={gradingEvaluationId}
                  onChange={(e) => setGradingEvaluationId(e.target.value)}
                  disabled={!gradingSubjectId}
                  className={`w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-base disabled:opacity-50 ${theme.focusRing}`}
                >
                  <option value="">
                    {gradingSubjectId ? "Selecciona la prueba" : "Primero elige la materia"}
                  </option>
                  {subjectEvaluations.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {!gradingEvaluationId ? (
              <div className="text-center py-10 text-slate-500">
                <p className="text-base">
                  {gradingSubjectId
                    ? "Elige la prueba para ver la lista de alumnos"
                    : "Comienza seleccionando la materia y la prueba"}
                </p>
              </div>
            ) : filteredMatrixStudents.length === 0 ? (
              <div className="text-center py-10 text-slate-500">
                <p>No hay alumnos que coincidan con la búsqueda</p>
              </div>
            ) : (
              <>
                <div className={`${theme.tableWrap} max-h-[min(28rem,55vh)] overflow-y-auto`}>
                  <table className="w-full text-sm">
                    <thead className={`${theme.tableHead} sticky top-0 z-10`}>
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold bg-slate-50">Alumno</th>
                        <th className={`px-4 py-3 text-left font-semibold bg-slate-50 ${RUT_TABLE_CELL_CLASS}`}>
                          RUT
                        </th>
                        <th className="px-4 py-3 text-center font-semibold bg-slate-50 w-36">
                          Nota (1 a 7)
                        </th>
                        <th className="px-4 py-3 text-center font-semibold bg-slate-50 w-32">
                          Ausente
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMatrixStudents.map((student) => {
                        const entry = gradingDraft[student.id] ?? {
                          score: "",
                          isAbsent: false,
                        };
                        return (
                          <tr
                            key={student.id}
                            className={`border-t border-slate-100 ${theme.tableRowHover} ${
                              entry.isAbsent ? "bg-amber-50/40" : ""
                            }`}
                          >
                            <td className="px-4 py-3 font-medium text-slate-800">
                              {formatStudentFullName(student)}
                            </td>
                            <td className={`px-4 py-3 text-slate-600 ${RUT_TABLE_CELL_CLASS}`}>
                              {formatRutDisplay(student.rut) || "—"}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <input
                                type="number"
                                min="1"
                                max="7"
                                step="0.1"
                                disabled={entry.isAbsent}
                                value={entry.isAbsent ? "" : entry.score}
                                onChange={(e) =>
                                  updateGradingDraft(student.id, { score: e.target.value })
                                }
                                placeholder="—"
                                className={`w-24 rounded-lg border border-slate-200 px-3 py-2.5 text-center text-base font-bold disabled:bg-slate-100 ${theme.focusRing}`}
                              />
                            </td>
                            <td className="px-4 py-3 text-center">
                              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
                                <input
                                  type="checkbox"
                                  checked={entry.isAbsent}
                                  onChange={(e) =>
                                    updateGradingDraft(student.id, {
                                      isAbsent: e.target.checked,
                                      score: e.target.checked ? "" : entry.score,
                                    })
                                  }
                                  className="h-5 w-5 rounded border-slate-300"
                                />
                                <span className="text-sm text-slate-600">Ausente</span>
                              </label>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() => void handleBulkSave()}
                    disabled={submitting}
                    className={`px-8 py-3.5 rounded-xl text-base font-bold transition disabled:opacity-50 ${theme.primaryBtn}`}
                  >
                    {submitting ? "Guardando..." : "Guardar todas las notas"}
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {viewMode === "individual" && filtered.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">📊</div>
            <p>
              {selectedCourseId
                ? "No hay notas registradas para este curso"
                : "No hay notas registradas"}
            </p>
            {auth.canCreate("grades") && (
              <button
                onClick={openCreate}
                className={`mt-4 px-6 py-3 rounded-lg ${theme.primaryBtn}`}
              >
                Registrar primera nota
              </button>
            )}
          </div>
        )}

        {viewMode === "individual" && filtered.length > 0 && (
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
                    <td className="px-4 py-3">{getStudentName(g)}</td>
                    <td className="px-4 py-3">{getEvaluationName(g)}</td>
                    <td className="px-4 py-3">{getSubjectName(g)}</td>
                    <td className="px-4 py-3 font-bold">{g.isAbsent ? "AUSENTE" : g.score}</td>
                    <td className="px-4 py-3">{g.gradeStatus}</td>
                    <td className="px-4 py-3">{g.gradeDate}</td>
                    <td className="px-4 py-3">{getTeacherName(g)}</td>
                    <td className="px-4 py-3">
                      <RecordActions
                        onView={() => setViewingGrade(g)}
                        onEdit={() => openEdit(g)}
                        onDelete={() => handleDelete(g)}
                        canEdit={auth.canEdit("grades")}
                        canDelete={auth.canDelete("grades")}
                        compact
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {viewMode === "overview" && !loading && courseOptions.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">📊</div>
            <p>No hay cursos con alumnos asignados</p>
          </div>
        )}

        {viewMode === "overview" && !selectedCourse && !loading && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">📊</div>
            <p>Selecciona un curso en el filtro superior para ver el resumen de notas</p>
          </div>
        )}

        {viewMode === "overview" && selectedCourse && (
          <>
            {isTeacherPanel && (
              <ModuleHelpBanner>
                Aquí puedes consultar todas las notas del curso en una sola tabla. Haz clic en una
                nota para ver el detalle.
              </ModuleHelpBanner>
            )}

            {!isTeacherPanel && selectedCourse && (
              <TeacherContextBar
                theme={theme}
                course={selectedCourse}
                showChangeButton={false}
              />
            )}

            {matrixEvaluations.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No hay pruebas registradas para las materias de este curso</p>
              </div>
            ) : filteredMatrixStudents.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No hay alumnos que coincidan con la búsqueda</p>
              </div>
            ) : (
              <div className={`${theme.tableWrap} max-h-[min(32rem,65vh)] overflow-y-auto`}>
                <table className="w-full text-sm min-w-max">
                  <thead className={`${theme.tableHead} sticky top-0 z-10`}>
                    <tr>
                      {STUDENT_NAME_COLUMNS.map((col) => (
                        <th
                          key={col.key}
                          className="px-3 py-3 text-left font-semibold whitespace-nowrap bg-slate-50"
                        >
                          {col.label}
                        </th>
                      ))}
                      <th className={`px-3 py-3 text-left font-semibold bg-slate-50 ${RUT_TABLE_CELL_CLASS}`}>
                        RUT
                      </th>
                      {matrixEvaluations.map((ev) => {
                        const subject = subjectById.get(ev.subjectId ?? 0);
                        return (
                          <th
                            key={ev.id}
                            className="px-3 py-3 text-center font-semibold whitespace-nowrap bg-slate-50 min-w-[5rem]"
                            title={`${ev.name ?? "Evaluación"} — ${subject?.subjectName ?? ""}`}
                          >
                            <span className="block text-xs text-slate-500">
                              {subject?.subjectCode ?? subject?.subjectName?.slice(0, 8)}
                            </span>
                            <span className="block">{ev.name}</span>
                          </th>
                        );
                      })}
                      <th className="px-3 py-3 text-center font-semibold whitespace-nowrap bg-slate-50">
                        Promedio
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMatrixStudents.map((student) => {
                      const average = computeStudentAverage(student.id);
                      return (
                        <tr
                          key={student.id}
                          className={`border-t border-slate-100 ${theme.tableRowHover}`}
                        >
                          {STUDENT_NAME_COLUMNS.map((col) => (
                            <td
                              key={col.key}
                              className="px-3 py-2.5 text-gray-700 whitespace-nowrap"
                            >
                              {student[col.key] || "—"}
                            </td>
                          ))}
                          <td className={`px-3 py-2.5 text-gray-600 ${RUT_TABLE_CELL_CLASS}`}>
                            {formatRutDisplay(student.rut) || "—"}
                          </td>
                          {matrixEvaluations.map((ev) => {
                            const grade = gradeByStudentEvaluation.get(
                              `${student.id}-${ev.id}`,
                            );
                            const cell = formatGradeCell(grade);
                            return (
                              <td key={ev.id} className="px-3 py-2.5 text-center">
                                {grade ? (
                                  <button
                                    type="button"
                                    onClick={() => setViewingGrade(grade)}
                                    className={`inline-flex min-w-[2.5rem] justify-center rounded-md px-2 py-1 text-sm font-bold transition hover:ring-2 hover:ring-teal-300 ${
                                      grade.isAbsent
                                        ? "bg-amber-50 text-amber-800"
                                        : "bg-teal-50 text-teal-800"
                                    }`}
                                    title="Ver detalle de la nota"
                                  >
                                    {cell}
                                  </button>
                                ) : (
                                  <span className="text-slate-300">—</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="px-3 py-2.5 text-center font-bold text-slate-700">
                            {average ?? "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </ModuleLayout>


      {viewingGrade && (
        <ViewDetailModal
          title="Detalle de nota"
          subtitle={getEvaluationName(viewingGrade)}
          theme={theme}
          fields={detailFields(viewingGrade)}
          onClose={() => setViewingGrade(null)}
        />
      )}

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
                  {ev.name} — {subjects.find((s) => s.id === ev.subjectId)?.subjectName ?? "Asignatura"}
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
                  {formatStudentFullName(s)} — {s.rut}
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
