import { useState, useEffect, useMemo } from "react";
import { getStudents, createStudent, updateStudent, deleteStudent } from "./api/students";
import type { Student, CreateStudentDto } from "./api/students";
import { getGuardians } from "./api/guardians";
import type { Guardian } from "./api/guardians";
import { getCourses } from "./api/courses";
import type { Course } from "./api/courses";
import {
  createEnrollment,
  getEnrollments,
  updateEnrollment,
  type Enrollment,
} from "./api/enrollments";
import { formatCourseLabel } from "./utils/formatCourseLabel";
import ViewDetailModal, { type DetailField } from "./components/ViewDetailModal";
import { moduleThemes } from "./theme/moduleThemes";
import ModuleLayout from "./components/ModuleLayout";
import RecordActions from "./components/RecordActions";
import FormModal, { FormField, formInputClass } from "./components/FormModal";
import PortalAccessSection from "./components/PortalAccessSection";
import { initialPortalAccessState, provisionPortalAccess } from "./utils/provisionPortalAccess";
import { useAuth } from "./auth/AuthContext";
import { sortById } from "./utils/sortById";
import {
  formatRutDisplay,
  isValidRut,
  normalizeRut,
  RUT_TABLE_CELL_CLASS,
  validateRutField,
} from "./utils/formatRut";
import { validateEmailField } from "./utils/validateEmail";
import { validatePhoneField } from "./utils/validatePhone";
import { validatePastDateField } from "./utils/validateDate";

const defaultAcademicYearStart = () => {
  const year = new Date().getFullYear();
  return `${year}-03-01`;
};

const yearFromDate = (dateStr?: string) => {
  if (!dateStr) return undefined;
  const year = parseInt(dateStr.slice(0, 4), 10);
  return Number.isNaN(year) ? undefined : year;
};

const NO_COURSE_KEY = "none";

const findActiveEnrollment = (enrollments: Enrollment[], studentId: number) =>
  enrollments
    .filter((e) => e.studentId === studentId && e.enrollmentStatus === "ACTIVO")
    .sort((a, b) => b.id - a.id)[0];

interface FormData {
  rut: string;
  firstName: string;
  secondName?: string;
  lastName: string;
  motherLastName: string;
  email: string;
  phone?: string;
  address?: string;
  commune?: string;
  city?: string;
  dateOfBirth?: string;
  admissionDate?: string;
  withdrawalDate?: string;
  studentStatus?: string;
  guardianId?: string;
  courseId?: string;
  enrollmentDate?: string;
}

interface StudentsProps {
  onBack: () => void;
}

function Students({ onBack }: StudentsProps) {
  const theme = moduleThemes.students;
  const auth = useAuth();

  // ===== STATE =====
  const [students, setStudents] = useState<Student[]>([]);
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editingEnrollment, setEditingEnrollment] = useState<Enrollment | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    rut: "",
    firstName: "",
    secondName: "",
    lastName: "",
    motherLastName: "",
    email: "",
    phone: "",
    address: "",
    commune: "",
    city: "",
    dateOfBirth: "",
    admissionDate: "",
    studentStatus: "ACTIVO",
    guardianId: "",
    courseId: "",
    enrollmentDate: "",
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<"rut" | "email" | "phone", string>>>({});
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [searchTerm, setSearchTerm] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [portalAccess, setPortalAccess] = useState(initialPortalAccessState);

  const formatDate = (dateStr?: string) =>
    dateStr ? new Date(dateStr).toLocaleDateString("es-CL") : undefined;

  // ===== LOAD DATA =====
  const loadStudents = async () => {
    try {
      setLoading(true);
      setError(null);

      const [data, guardiansData, coursesData, enrollmentsData] = await Promise.all([
        getStudents(),
        getGuardians().catch(() => []),
        getCourses().catch(() => []),
        getEnrollments().catch(() => []),
      ]);
      setStudents(sortById(data));
      setGuardians(sortById(guardiansData));
      setCourses(sortById(coursesData));
      setEnrollments(sortById(enrollmentsData));

    } catch (err) {
      setError("Error al cargar estudiantes");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ===== EFFECT =====
  useEffect(() => {
    const fetchData = async () => {
      await loadStudents();
    };
    fetchData();
  }, []);

  const getGuardianName = (guardianId?: number) => {
    if (!guardianId) return "-";
    const guardian = guardians.find((g) => g.id === guardianId);
    return guardian ? `${guardian.firstName} ${guardian.lastName}` : `ID: ${guardianId}`;
  };

  const getCourseName = (courseId?: number) => {
    if (!courseId) return "Sin curso";
    const course = courses.find((c) => c.id === courseId);
    return course ? formatCourseLabel(course) : `ID: ${courseId}`;
  };

  const activeEnrollmentByStudent = useMemo(() => {
    const map = new Map<number, Enrollment>();
    for (const student of students) {
      const active = findActiveEnrollment(enrollments, student.id);
      if (active) map.set(student.id, active);
    }
    return map;
  }, [students, enrollments]);

  const getStudentCourseLabel = (studentId: number) => {
    const enrollment = activeEnrollmentByStudent.get(studentId);
    return enrollment ? getCourseName(enrollment.courseId) : "Sin curso asignado";
  };

  const getStudentFullName = (student: Student) =>
    [student.firstName, student.secondName, student.lastName, student.motherLastName]
      .filter(Boolean)
      .join(" ");

  const getStudentDetailFields = (student: Student): DetailField[] => [
    { label: "RUT", value: formatRutDisplay(student.rut) || student.rut },
    { label: "Nombre", value: student.firstName },
    { label: "Segundo nombre", value: student.secondName },
    { label: "Apellido paterno", value: student.lastName },
    { label: "Apellido materno", value: student.motherLastName },
    { label: "Email", value: student.email },
    { label: "Teléfono", value: student.phone },
    { label: "Dirección", value: student.address },
    { label: "Comuna", value: student.commune },
    { label: "Ciudad", value: student.city },
    { label: "Fecha de nacimiento", value: formatDate(student.dateOfBirth) },
    { label: "Fecha de ingreso", value: formatDate(student.admissionDate) },
    { label: "N° matrícula", value: student.enrollmentNumber ?? "Se asigna al matricular" },
    { label: "Curso actual", value: getStudentCourseLabel(student.id) },
    { label: "Fecha de retiro", value: formatDate(student.withdrawalDate) },
    { label: "Estado", value: student.studentStatus },
    { label: "Apoderado", value: getGuardianName(student.guardianId) },
  ];

  // ===== FILTER =====
  const filteredStudents = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return students.filter((student) => {
      const activeEnrollment = activeEnrollmentByStudent.get(student.id);

      if (courseFilter === NO_COURSE_KEY) {
        if (activeEnrollment) return false;
      } else if (courseFilter) {
        if (String(activeEnrollment?.courseId) !== courseFilter) return false;
      }

      return (
        (student.rut ?? "").toLowerCase().includes(searchLower) ||
        (student.firstName ?? "").toLowerCase().includes(searchLower) ||
        (student.lastName ?? "").toLowerCase().includes(searchLower) ||
        (student.motherLastName ?? "").toLowerCase().includes(searchLower) ||
        (student.email ?? "").toLowerCase().includes(searchLower) ||
        getStudentCourseLabel(student.id).toLowerCase().includes(searchLower)
      );
    });
  }, [students, searchTerm, courseFilter, activeEnrollmentByStudent, courses]);

  // ===== MODAL =====
  const openCreateModal = () => {
    setEditingStudent(null);
    setEditingEnrollment(null);

    setFormData({
      rut: "",
      firstName: "",
      secondName: "",
      lastName: "",
      motherLastName: "",
      email: "",
      phone: "",
      address: "",
      commune: "",
      city: "",
      dateOfBirth: "",
      admissionDate: "",
      studentStatus: "ACTIVO",
      guardianId: "",
      courseId: "",
      enrollmentDate: "",
    });

    setFieldErrors({});
    setFormError(null);
    setPortalAccess(initialPortalAccessState);
    setShowModal(true);
  };

// ===== EDIT =====
  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    const activeEnrollment = findActiveEnrollment(enrollments, student.id) ?? null;
    setEditingEnrollment(activeEnrollment);

    setFormData({
      rut: student.rut ?? "",
      firstName: student.firstName ?? "",
      secondName: student.secondName ?? "",
      lastName: student.lastName ?? "",
      motherLastName: student.motherLastName ?? "",
      email: student.email ?? "",
      phone: student.phone ?? "",
      address: student.address ?? "",
      commune: student.commune ?? "",
      city: student.city ?? "",
      dateOfBirth: student.dateOfBirth ?? "",
      admissionDate: student.admissionDate ?? "",
      studentStatus: student.studentStatus ?? "ACTIVO",
      guardianId: student.guardianId?.toString() ?? "",
      withdrawalDate: student.withdrawalDate ?? "",
      courseId: activeEnrollment?.courseId?.toString() ?? "",
      enrollmentDate: activeEnrollment?.enrollmentDate ?? student.admissionDate ?? "",
    });

    setFieldErrors({});
    setFormError(null);
    setPortalAccess(initialPortalAccessState);
    setShowModal(true);
  };

  // ===== CLOSE MODAL =====
  const closeModal = () => {
    setShowModal(false);
    setEditingStudent(null);
    setEditingEnrollment(null);
    setFormError(null);
    setFieldErrors({});
    setPortalAccess(initialPortalAccessState);
  };

  const setFieldError = (field: "rut" | "email" | "phone", message: string | null) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (message) next[field] = message;
      else delete next[field];
      return next;
    });
  };

  const fieldInputClass = (field: "rut" | "email" | "phone") =>
    fieldErrors[field]
      ? `${inputClass} border-rose-300 bg-rose-50/30 focus:border-rose-400 focus:ring-rose-200`
      : inputClass;

  // ===== INPUT CHANGE =====
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === "rut" || name === "email" || name === "phone") {
      setFieldError(name, null);
      setFormError(null);
    }
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "admissionDate" && value && !prev.enrollmentDate) {
        next.enrollmentDate = value;
      }
      return next;
    });
  };

  const syncStudentEnrollment = async (studentId: number) => {
    const selectedCourseId = formData.courseId?.trim();
    if (!selectedCourseId) return;

    const courseId = parseInt(selectedCourseId, 10);
    const course = courses.find((c) => c.id === courseId);
    const enrollmentData = {
      studentId,
      courseId,
      academicYear: yearFromDate(course?.academicYear ?? defaultAcademicYearStart()),
      enrollmentDate: formData.enrollmentDate || formData.admissionDate || undefined,
      enrollmentStatus: "ACTIVO",
      isRegular: true,
    };

    if (editingEnrollment) {
      await updateEnrollment(editingEnrollment.id, enrollmentData);
      return;
    }

    await createEnrollment(enrollmentData);
  };

  // ===== SUBMIT =====
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.firstName.trim() ||
      !formData.lastName.trim() ||
      !formData.motherLastName.trim()
    ) {
      setFormError("Nombre y apellidos son obligatorios");
      return;
    }

    const rutError = validateRutField(formData.rut);
    if (rutError) {
      setFieldError("rut", rutError);
      setFormError(rutError);
      return;
    }

    const emailError = validateEmailField(formData.email);
    if (emailError) {
      setFieldError("email", emailError);
      setFormError(emailError);
      return;
    }

    const phoneError = validatePhoneField(formData.phone ?? "", false);
    if (phoneError) {
      setFieldError("phone", phoneError);
      setFormError(phoneError);
      return;
    }

    const birthError = validatePastDateField(formData.dateOfBirth ?? "", "La fecha de nacimiento");
    if (birthError) {
      setFormError(birthError);
      return;
    }

    if (!editingStudent && !formData.courseId) {
      setFormError("Debes asignar un curso para matricular al estudiante");
      return;
    }

    setFormError(null);
    setSubmitting(true);

    try {
      let userId = editingStudent?.userId;
      if (auth.isAdmin) {
        userId = await provisionPortalAccess({
          enabled: portalAccess.enabled,
          username: portalAccess.username,
          password: portalAccess.password,
          passwordConfirm: portalAccess.passwordConfirm,
          email: formData.email.trim(),
          role: "ESTUDIANTE",
          existingUserId: editingStudent?.userId,
        }) ?? userId;
      }

      const studentData: CreateStudentDto = {
        rut: normalizeRut(formData.rut),
        firstName: formData.firstName.trim(),
        secondName: formData.secondName?.trim() || undefined,
        lastName: formData.lastName.trim(),
        motherLastName: formData.motherLastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone?.trim() || undefined,
        address: formData.address?.trim() || undefined,
        commune: formData.commune?.trim() || undefined,
        city: formData.city?.trim() || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        admissionDate: formData.admissionDate || undefined,
        studentStatus: formData.studentStatus?.trim() || "ACTIVO",
        withdrawalDate: formData.withdrawalDate || undefined,
        guardianId: formData.guardianId ? parseInt(formData.guardianId) : undefined,
        userId,
      };

      let studentId: number;
      if (editingStudent) {
        await updateStudent(editingStudent.id, studentData);
        studentId = editingStudent.id;
        if (formData.courseId) {
          await syncStudentEnrollment(studentId);
        }
      } else {
        const created = await createStudent(studentData);
        studentId = created.id;
        await syncStudentEnrollment(studentId);
      }

      await loadStudents();
      closeModal();

    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al guardar el estudiante");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // ===== DELETE =====
  const handleDelete = async (student: Student) => {

    const nombreCompleto = `${student.firstName} ${
      student.secondName ?? ""
    } ${student.lastName} ${student.motherLastName}`.trim();

    if (!confirm(`¿Estás seguro de eliminar a "${nombreCompleto}"?`)) {
      return;
    }

    try {
      await deleteStudent(student.id);
      await loadStudents();
    } catch (err) {
      setError("Error al eliminar estudiante");
      console.error(err);
    }
  };

  const inputClass = formInputClass(theme);

// ===== RENDER =====
  return (
    <>
      <ModuleLayout
        theme={theme}
        onBack={onBack}
        createLabel="Nuevo Estudiante"
        onCreate={openCreateModal}
        canCreate={auth.canCreate("students")}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar por nombre, RUT, email o curso..."
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onRefresh={loadStudents}
        loading={loading}
        error={error}
        toolbarExtra={
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className={`min-w-[200px] rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:ring-2 ${theme.focusRing}`}
            aria-label="Filtrar por curso"
          >
            <option value="">Todos los cursos</option>
            {courses.map((course) => (
              <option key={course.id} value={String(course.id)}>
                {formatCourseLabel(course)}
              </option>
            ))}
            <option value={NO_COURSE_KEY}>Sin curso asignado</option>
          </select>
        }
      >
        {students.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">👨‍🎓</div>
            <p className="mb-4">No hay estudiantes disponibles</p>
            <button
              onClick={openCreateModal}
              className={`px-6 py-3 rounded-lg transition font-medium shadow-sm ${theme.primaryBtn}`}
            >
              Crear primer estudiante
            </button>
          </div>
        )}

        {students.length > 0 && filteredStudents.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">🔍</div>
            <p className="mb-2">No se encontraron estudiantes</p>
            <p className="text-sm">Intenta con otro término de búsqueda o curso</p>
          </div>
        )}

        {filteredStudents.length > 0 && viewMode === "cards" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudents.map((student) => (
              <div key={student.id} className={theme.cardClass}>
                <h3 className="font-bold text-lg">
                  {student.firstName} {student.secondName} {student.lastName} {student.motherLastName}
                </h3>
                <p>N° matrícula: {student.enrollmentNumber ?? "Pendiente"}</p>
                <p className={RUT_TABLE_CELL_CLASS}>RUT: {formatRutDisplay(student.rut) || "—"}</p>
                <p>Email: {student.email}</p>
                <p>Teléfono: {student.phone || "-"}</p>
                <p>Curso: {getStudentCourseLabel(student.id)}</p>
                <p>Apoderado: {getGuardianName(student.guardianId)}</p>
                <p>Estado: {student.studentStatus}</p>
                <div className="mt-3">
                  <RecordActions
                    onView={() => setViewingStudent(student)}
                    onEdit={() => openEditModal(student)}
                    onDelete={() => handleDelete(student)}
                    canEdit={auth.canEdit("students")}
                    canDelete={auth.canDelete("students")}
                    compact
                    stretch
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredStudents.length > 0 && viewMode === "table" && (
          <div className={theme.tableWrap}>
            <table className="w-full text-sm">
              <thead className={theme.tableHead}>
                <tr>
                  <th className={`p-2 text-left ${RUT_TABLE_CELL_CLASS}`}>RUT</th>
                  <th className="p-2 text-left">Nombre</th>
                  <th className="p-2 text-left">Segundo Nombre</th>
                  <th className="p-2 text-left">Apellido Paterno</th>
                  <th className="p-2 text-left">Apellido Materno</th>
                  <th className="p-2 text-left">Email</th>
                  <th className="p-2 text-left">Teléfono</th>
                  <th className="p-2 text-left">Dirección</th>
                  <th className="p-2 text-left">Comuna</th>
                  <th className="p-2 text-left">Ciudad</th>
                  <th className="p-2 text-left">Fecha Nac.</th>
                  <th className="p-2 text-left">Fecha Ingreso</th>
                  <th className="p-2 text-left">Matrícula</th>
                  <th className="p-2 text-left">Curso</th>
                  <th className="p-2 text-left">Retiro</th>
                  <th className="p-2 text-left">Estado</th>
                  <th className="p-2 text-left">Apoderado</th>
                  <th className="p-2 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.id} className={`border-t border-slate-100 ${theme.tableRowHover}`}>
                    <td className={`p-2 ${RUT_TABLE_CELL_CLASS}`}>
                      {formatRutDisplay(student.rut) || "—"}
                    </td>
                    <td className="p-2">{student.firstName}</td>
                    <td className="p-2">{student.secondName}</td>
                    <td className="p-2">{student.lastName}</td>
                    <td className="p-2">{student.motherLastName}</td>
                    <td className="p-2">{student.email}</td>
                    <td className="p-2">{student.phone}</td>
                    <td className="p-2">{student.address}</td>
                    <td className="p-2">{student.commune}</td>
                    <td className="p-2">{student.city}</td>
                    <td className="p-2">{student.dateOfBirth}</td>
                    <td className="p-2">{student.admissionDate}</td>
                    <td className="p-2">{student.enrollmentNumber ?? "Pendiente"}</td>
                    <td className="p-2">{getStudentCourseLabel(student.id)}</td>
                    <td className="p-2">{student.withdrawalDate ?? "-"}</td>
                    <td className="p-2">{student.studentStatus}</td>
                    <td className="p-2">{getGuardianName(student.guardianId)}</td>
                    <td className="p-2">
                      <RecordActions
                        onView={() => setViewingStudent(student)}
                        onEdit={() => openEditModal(student)}
                        onDelete={() => handleDelete(student)}
                    canEdit={auth.canEdit("students")}
                    canDelete={auth.canDelete("students")}
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

      {viewingStudent && (
        <ViewDetailModal
          title="Detalle del estudiante"
          subtitle={getStudentFullName(viewingStudent)}
          fields={getStudentDetailFields(viewingStudent)}
          onClose={() => setViewingStudent(null)}
          theme={theme}
        />
      )}

      {showModal && (
        <FormModal
          title={editingStudent ? "Editar Estudiante" : "Nuevo Estudiante"}
          subtitle={
            editingStudent
              ? "Modifica los datos del alumno y su curso asignado"
              : "Registra al estudiante y asígnalo a un curso en el mismo paso"
          }
          theme={theme}
          onClose={closeModal}
          onSubmit={handleSubmit}
          error={formError}
          submitting={submitting}
          submitLabel={editingStudent ? "Guardar cambios" : "Crear y matricular"}
          size="xl"
        >
          <FormField label="RUT" required error={fieldErrors.rut}>
            <input
              name="rut"
              value={formData.rut}
              onChange={handleInputChange}
              onBlur={() => {
                const rutError = validateRutField(formData.rut);
                if (rutError) {
                  setFieldError("rut", rutError);
                  return;
                }
                setFieldError("rut", null);
                if (formData.rut.trim() && isValidRut(formData.rut)) {
                  setFormData((prev) => ({ ...prev, rut: normalizeRut(prev.rut) }));
                }
              }}
              placeholder="11.111.111-1"
              required
              className={fieldInputClass("rut")}
            />
          </FormField>
          <FormField label="Nombre" required>
            <input name="firstName" value={formData.firstName} onChange={handleInputChange} required className={inputClass} />
          </FormField>
          <FormField label="Segundo nombre">
            <input name="secondName" value={formData.secondName} onChange={handleInputChange} className={inputClass} />
          </FormField>
          <FormField label="Apellido paterno" required>
            <input name="lastName" value={formData.lastName} onChange={handleInputChange} required className={inputClass} />
          </FormField>
          <FormField label="Apellido materno" required>
            <input name="motherLastName" value={formData.motherLastName} onChange={handleInputChange} required className={inputClass} />
          </FormField>
          <FormField label="Email" required error={fieldErrors.email}>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              onBlur={() => setFieldError("email", validateEmailField(formData.email))}
              required
              className={fieldInputClass("email")}
            />
          </FormField>
          {auth.isAdmin && (
            <PortalAccessSection
              theme={theme}
              role="ESTUDIANTE"
              roleLabel="Estudiante"
              email={formData.email}
              rut={formData.rut}
              existingUserId={editingStudent?.userId}
              value={portalAccess}
              onChange={setPortalAccess}
            />
          )}
          <FormField label="Teléfono" error={fieldErrors.phone}>
            <input
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              onBlur={() => setFieldError("phone", validatePhoneField(formData.phone ?? "", false))}
              placeholder="912345678"
              className={fieldInputClass("phone")}
            />
          </FormField>
          <FormField label="Dirección" fullWidth>
            <input name="address" value={formData.address} onChange={handleInputChange} className={inputClass} />
          </FormField>
          <FormField label="Comuna">
            <input name="commune" value={formData.commune} onChange={handleInputChange} className={inputClass} />
          </FormField>
          <FormField label="Ciudad">
            <input name="city" value={formData.city} onChange={handleInputChange} className={inputClass} />
          </FormField>
          <FormField label="Fecha de nacimiento">
            <input type="date" name="dateOfBirth" value={formData.dateOfBirth || ""} onChange={handleInputChange} className={inputClass} />
          </FormField>
          <FormField label="Fecha de ingreso">
            <input type="date" name="admissionDate" value={formData.admissionDate || ""} onChange={handleInputChange} className={inputClass} />
          </FormField>
          <FormField label="Apoderado" fullWidth>
            <select name="guardianId" value={formData.guardianId} onChange={handleInputChange} className={`${inputClass} bg-white`}>
              <option value="">Sin apoderado</option>
              {guardians.map((g) => (
                <option key={g.id} value={g.id}>{g.firstName} {g.lastName} ({g.relationship})</option>
              ))}
            </select>
          </FormField>
          <FormField label="Fecha de retiro">
            <input type="date" name="withdrawalDate" value={formData.withdrawalDate || ""} onChange={handleInputChange} className={inputClass} />
          </FormField>
          <FormField label="Estado">
            <select name="studentStatus" value={formData.studentStatus} onChange={handleInputChange} className={`${inputClass} bg-white`}>
              <option value="ACTIVO">ACTIVO</option>
              <option value="SUSPENDIDO">SUSPENDIDO</option>
              <option value="MATRICULA CANCELADA">MATRICULA CANCELADA</option>
              <option value="EGRESADO">EGRESADO</option>
              <option value="RETIRADO">RETIRADO</option>
            </select>
          </FormField>

          <div className="sm:col-span-2 mt-2 rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
            <p className="mb-3 text-sm font-semibold text-indigo-900">Matrícula en curso</p>
            <p className="mb-4 text-xs leading-relaxed text-indigo-700/80">
              Aquí vinculas al estudiante con su curso. El N° de matrícula (ej. 2026-1, 2026-2) se genera
              automáticamente al guardar. Solo el administrador puede hacer esta asignación.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                label="Curso"
                required={!editingStudent}
                hint={editingStudent ? "Puedes cambiar el curso del alumno desde aquí" : undefined}
              >
                <select
                  name="courseId"
                  value={formData.courseId}
                  onChange={handleInputChange}
                  required={!editingStudent}
                  className={`${inputClass} bg-white`}
                >
                  <option value="">Seleccionar curso</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {formatCourseLabel(course)}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Fecha de matrícula en curso">
                <input
                  type="date"
                  name="enrollmentDate"
                  value={formData.enrollmentDate || ""}
                  onChange={handleInputChange}
                  className={inputClass}
                />
              </FormField>
            </div>
          </div>
        </FormModal>
      )}
    </>
  );
}

export default Students; 