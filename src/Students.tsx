import { useState, useEffect } from "react";
import { getStudents, createStudent, updateStudent, deleteStudent } from "./api/students";
import type { Student, CreateStudentDto } from "./api/students";
import { getGuardians } from "./api/guardians";
import type { Guardian } from "./api/guardians";
import ViewDetailModal, { type DetailField } from "./components/ViewDetailModal";
import { moduleThemes } from "./theme/moduleThemes";
import ModuleLayout from "./components/ModuleLayout";
import RecordActions from "./components/RecordActions";
import FormModal, { FormField, formInputClass } from "./components/FormModal";

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
  enrollmentNumber?: string;
  studentStatus?: string;
  guardianId?: string;
}

interface StudentsProps {
  onBack: () => void;
}

function Students({ onBack }: StudentsProps) {
  const theme = moduleThemes.students;

  // ===== STATE =====
  const [students, setStudents] = useState<Student[]>([]);
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

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
    enrollmentNumber: "",
    studentStatus: "ACTIVO",
    guardianId: "",
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);

  const formatDate = (dateStr?: string) =>
    dateStr ? new Date(dateStr).toLocaleDateString("es-CL") : undefined;

  // ===== LOAD DATA =====
  const loadStudents = async () => {
    try {
      setLoading(true);
      setError(null);

      const [data, guardiansData] = await Promise.all([
        getStudents(),
        getGuardians().catch(() => []),
      ]);
      setStudents(data);
      setGuardians(guardiansData);

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

  const getStudentFullName = (student: Student) =>
    [student.firstName, student.secondName, student.lastName, student.motherLastName]
      .filter(Boolean)
      .join(" ");

  const getStudentDetailFields = (student: Student): DetailField[] => [
    { label: "RUT", value: student.rut },
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
    { label: "N° matrícula", value: student.enrollmentNumber },
    { label: "Fecha de retiro", value: formatDate(student.withdrawalDate) },
    { label: "Estado", value: student.studentStatus },
    { label: "Apoderado", value: getGuardianName(student.guardianId) },
  ];

  // ===== FILTER =====
  const filteredStudents = students.filter((student) => {
    const searchLower = searchTerm.toLowerCase();

    return (
      (student.rut ?? "").toLowerCase().includes(searchLower) ||
      (student.firstName ?? "").toLowerCase().includes(searchLower) ||
      (student.lastName ?? "").toLowerCase().includes(searchLower) ||
      (student.motherLastName ?? "").toLowerCase().includes(searchLower) ||
      (student.email ?? "").toLowerCase().includes(searchLower)
    );
  });

  // ===== MODAL =====
  const openCreateModal = () => {
    setEditingStudent(null);

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
      enrollmentNumber: "",
      studentStatus: "ACTIVO",
      guardianId: "",
    });

    setShowModal(true);
  };

// ===== EDIT =====
  const openEditModal = (student: Student) => {
    setEditingStudent(student);

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
      enrollmentNumber: student.enrollmentNumber ?? "",
      studentStatus: student.studentStatus ?? "ACTIVO",
      guardianId: student.guardianId?.toString() ?? "",
      withdrawalDate: student.withdrawalDate ?? "",
    });

    setShowModal(true);
  };

  // ===== CLOSE MODAL =====
  const closeModal = () => {
    setShowModal(false);
    setEditingStudent(null);
    setFormError(null);
  };

  // ===== INPUT CHANGE =====
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ===== SUBMIT =====
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.firstName.trim() ||
      !formData.lastName.trim() ||
      !formData.motherLastName.trim() ||
      !formData.rut.trim() ||
      !formData.email.trim()
    ) {
      setFormError("RUT, nombre, apellidos y email son obligatorios");
      return;
    }

    setFormError(null);

    try {
      const studentData: CreateStudentDto = {
        rut: formData.rut.trim(),
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
        enrollmentNumber: formData.enrollmentNumber?.trim() || undefined,
        studentStatus: formData.studentStatus?.trim() || "ACTIVO",
        withdrawalDate: formData.withdrawalDate || undefined,
        guardianId: formData.guardianId ? parseInt(formData.guardianId) : undefined,
      };

      if (editingStudent) {
        await updateStudent(editingStudent.id, studentData);
      } else {
        await createStudent(studentData);
      }

      await loadStudents();
      closeModal();

    } catch (err) {
      setFormError("Error al guardar el estudiante");
      console.error(err);
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
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar por nombre, RUT o email..."
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onRefresh={loadStudents}
        loading={loading}
        error={error}
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
            <p className="text-sm">Intenta con otro término de búsqueda</p>
          </div>
        )}

        {filteredStudents.length > 0 && viewMode === "cards" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudents.map((student) => (
              <div key={student.id} className={theme.cardClass}>
                <h3 className="font-bold text-lg">
                  {student.firstName} {student.secondName} {student.lastName} {student.motherLastName}
                </h3>
                <p>RUT: {student.rut}</p>
                <p>Email: {student.email}</p>
                <p>Teléfono: {student.phone || "-"}</p>
                <p>Apoderado: {getGuardianName(student.guardianId)}</p>
                <p>Estado: {student.studentStatus}</p>
                <div className="mt-3">
                  <RecordActions
                    onView={() => setViewingStudent(student)}
                    onEdit={() => openEditModal(student)}
                    onDelete={() => handleDelete(student)}
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
                  <th className="p-2 text-left">RUT</th>
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
                  <th className="p-2 text-left">Retiro</th>
                  <th className="p-2 text-left">Estado</th>
                  <th className="p-2 text-left">Apoderado</th>
                  <th className="p-2 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.id} className={`border-t border-slate-100 ${theme.tableRowHover}`}>
                    <td className="p-2">{student.rut}</td>
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
                    <td className="p-2">{student.enrollmentNumber}</td>
                    <td className="p-2">{student.withdrawalDate ?? "-"}</td>
                    <td className="p-2">{student.studentStatus}</td>
                    <td className="p-2">{getGuardianName(student.guardianId)}</td>
                    <td className="p-2">
                      <RecordActions
                        onView={() => setViewingStudent(student)}
                        onEdit={() => openEditModal(student)}
                        onDelete={() => handleDelete(student)}
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
          subtitle={editingStudent ? "Modifica los datos del alumno" : "Registra un nuevo estudiante"}
          theme={theme}
          onClose={closeModal}
          onSubmit={handleSubmit}
          error={formError}
          submitLabel={editingStudent ? "Guardar cambios" : "Crear estudiante"}
          size="xl"
        >
          <FormField label="RUT" required>
            <input name="rut" value={formData.rut} onChange={handleInputChange} required className={inputClass} />
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
          <FormField label="Email" required>
            <input name="email" value={formData.email} onChange={handleInputChange} required className={inputClass} />
          </FormField>
          <FormField label="Teléfono">
            <input name="phone" value={formData.phone} onChange={handleInputChange} className={inputClass} />
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
          <FormField label="N° matrícula">
            <input name="enrollmentNumber" value={formData.enrollmentNumber} onChange={handleInputChange} className={inputClass} />
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
        </FormModal>
      )}
    </>
  );
}

export default Students; 