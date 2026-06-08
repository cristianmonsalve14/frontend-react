// Valores iniciales para el formulario de profesor
const initialFormData: FormData = {
  rut: "",
  firstName: "",
  lastName: "",
  secondLastName: "",
  email: "",
  phone: "",
  specialization: "",
  teacherStatus: "ACTIVO",
  address: "",
  commune: "",
  city: "",
  employeeNumber: "",
  educationLevel: "",
  hireDate: "",
  contractType: "",
};
import { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
import { getTeachers, createTeacher, updateTeacher, deleteTeacher } from "./api/teachers";
import type { Teacher } from "./api/teachers";
import ViewDetailModal, { type DetailField } from "./components/ViewDetailModal";
import { moduleThemes } from "./theme/moduleThemes";
import ModuleLayout from "./components/ModuleLayout";
import RecordActions from "./components/RecordActions";
import FormModal, { FormField, formInputClass } from "./components/FormModal";
type TeacherFull = Teacher & {
  address?: string;
  commune?: string;
  city?: string;
  employeeNumber?: string;
  educationLevel?: string;
  hireDate?: string;
  contractType?: string;
};


type FormData = {
  rut: string;
  firstName: string;
  lastName: string;
  secondLastName?: string;
  email?: string;
  phone?: string;
  specialization?: string;
  teacherStatus?: string;
  address?: string;
  commune?: string;
  city?: string;
  employeeNumber?: string;
  educationLevel?: string;
  hireDate?: string | null;
  contractType?: string;
};
// ...existing code...


type TeachersProps = {
  onBack?: () => void;
};

function Teachers({ onBack }: TeachersProps) {
  const theme = moduleThemes.teachers;
  // --- HANDLERS Y STATE ---
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [searchTerm, setSearchTerm] = useState("");
  const [teachers, setTeachers] = useState<TeacherFull[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [viewingTeacher, setViewingTeacher] = useState<TeacherFull | null>(null);

  const formatDate = (dateStr?: string | null) =>
    dateStr ? new Date(dateStr).toLocaleDateString("es-CL") : undefined;

  const getTeacherFullName = (t: TeacherFull) =>
    [t.firstName, t.lastName, t.secondLastName].filter(Boolean).join(" ");

  const getTeacherDetailFields = (t: TeacherFull): DetailField[] => [
    { label: "RUT", value: t.rut },
    { label: "Nombre", value: t.firstName },
    { label: "Apellido paterno", value: t.lastName },
    { label: "Apellido materno", value: t.secondLastName },
    { label: "Email", value: t.email },
    { label: "Teléfono", value: t.phone },
    { label: "Especialidad", value: t.specialization },
    { label: "Estado", value: t.teacherStatus },
    { label: "Dirección", value: t.address },
    { label: "Comuna", value: t.commune },
    { label: "Ciudad", value: t.city },
    { label: "N° empleado", value: t.employeeNumber },
    { label: "Nivel educacional", value: t.educationLevel },
    { label: "Fecha contrato", value: formatDate(t.hireDate) },
    { label: "Tipo contrato", value: t.contractType },
  ];

  // --- HANDLERS ---
  const loadTeachers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTeachers();
      // Filtrar profesores duplicados por id
      const unique = data.filter((teacher, idx, arr) =>
        arr.findIndex(t => t.id === teacher.id) === idx
      );
      setTeachers(unique);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar profesores");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Evita llamar setState directamente en el cuerpo del efecto
    const fetch = async () => {
      await loadTeachers();
    };
    fetch();
  }, []);

  const handleOpenCreate = () => {
    setFormData(initialFormData);
    setEditId(null);
    setShowModal(true);
    setError(null);
  };

  const handleOpenEdit = (teacher: TeacherFull) => {
    setFormData({
      rut: teacher.rut ?? "",
      firstName: teacher.firstName ?? "",
      lastName: teacher.lastName ?? "",
      secondLastName: teacher.secondLastName ?? "",
      email: teacher.email ?? "",
      phone: teacher.phone ?? "",
      specialization: teacher.specialization ?? "",
      teacherStatus: teacher.teacherStatus ?? "",
      address: teacher.address ?? "",
      commune: teacher.commune ?? "",
      city: teacher.city ?? "",
      employeeNumber: teacher.employeeNumber ?? "",
      educationLevel: teacher.educationLevel ?? "",
      hireDate: teacher.hireDate ?? "",
      contractType: teacher.contractType ?? "",
    });
    setEditId(teacher.id);
    setShowModal(true);
    setError(null);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Seguro que deseas eliminar este profesor?")) return;
    setLoading(true);
    setError(null);
    try {
      await deleteTeacher(id);
      await loadTeachers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar profesor");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    // Validación mínima
    if (!formData.rut || !formData.firstName || !formData.lastName || !formData.email?.trim()) {
      setError("RUT, nombre, apellido y email son obligatorios");
      setSubmitting(false);
      return;
    }
    try {
      if (editId) {
        await updateTeacher(editId, formData);
      } else {
        await createTeacher(formData);
      }
      await loadTeachers();
      setShowModal(false);
      setFormData(initialFormData);
      setEditId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar profesor");
    } finally {
      setSubmitting(false);
    }
  };

  const getNombreCompleto = (t: Teacher) => [t.firstName, t.lastName].filter(Boolean).join(" ");
  const filteredTeachers = teachers.filter((t) => {
    const query = searchTerm.toLowerCase();
    return (
      (t.rut ?? "").toLowerCase().includes(query) ||
      (t.firstName ?? "").toLowerCase().includes(query) ||
      (t.lastName ?? "").toLowerCase().includes(query) ||
      (t.email ?? "").toLowerCase().includes(query) ||
      (t.specialization ?? "").toLowerCase().includes(query)
    );
  });
  const inputClass = formInputClass(theme);

  const closeTeacherModal = () => {
    setShowModal(false);
    setEditId(null);
    setFormData(initialFormData);
  };

  return (
    <>
      <ModuleLayout
        theme={theme}
        onBack={onBack ?? (() => {})}
        createLabel="Nuevo Profesor"
        onCreate={handleOpenCreate}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar por nombre, RUT o especialidad..."
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onRefresh={loadTeachers}
        loading={loading}
        error={error}
      >
        {teachers.length === 0 && (
          <div className="text-center py-8 text-gray-500">No hay profesores registrados.</div>
        )}

        {teachers.length > 0 && filteredTeachers.length === 0 && (
          <div className="text-center py-8 text-gray-500">No se encontraron profesores con ese criterio.</div>
        )}

        {filteredTeachers.length > 0 && viewMode === "table" && (
          <div className={theme.tableWrap}>
            <table className="w-full text-sm">
              <thead className={theme.tableHead}>
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">ID</th>
                  <th className="px-4 py-3 text-left font-semibold">Nombre</th>
                  <th className="px-4 py-3 text-left font-semibold">Email</th>
                  <th className="px-4 py-3 text-left font-semibold">Especialidad</th>
                  <th className="px-4 py-3 text-left font-semibold">Estado</th>
                  <th className="px-4 py-3 text-left font-semibold">Dirección</th>
                  <th className="px-4 py-3 text-left font-semibold">Comuna</th>
                  <th className="px-4 py-3 text-left font-semibold">Ciudad</th>
                  <th className="px-4 py-3 text-left font-semibold">N° Empleado</th>
                  <th className="px-4 py-3 text-left font-semibold">Nivel Educacional</th>
                  <th className="px-4 py-3 text-left font-semibold">Fecha Contrato</th>
                  <th className="px-4 py-3 text-left font-semibold">Tipo Contrato</th>
                  <th className="px-4 py-3 text-center font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeachers.map((t) => (
                  <tr key={t.id} className={`border-t border-slate-100 ${theme.tableRowHover}`}>
                    <td className="px-4 py-3 text-gray-700">{t.id}</td>
                    <td className="px-4 py-3 text-gray-700">{getNombreCompleto(t)}</td>
                    <td className="px-4 py-3 text-gray-700">{t.email ?? "-"}</td>
                    <td className="px-4 py-3 text-gray-700">{t.specialization ?? "-"}</td>
                    <td className="px-4 py-3 text-gray-700">{t.teacherStatus ?? "-"}</td>
                    <td className="px-4 py-3 text-gray-700">{t.address ?? "-"}</td>
                    <td className="px-4 py-3 text-gray-700">{t.commune ?? "-"}</td>
                    <td className="px-4 py-3 text-gray-700">{t.city ?? "-"}</td>
                    <td className="px-4 py-3 text-gray-700">{t.employeeNumber ?? "-"}</td>
                    <td className="px-4 py-3 text-gray-700">{t.educationLevel ?? "-"}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {t.hireDate ? new Date(t.hireDate).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{t.contractType ?? "-"}</td>
                    <td className="px-4 py-3">
                      <RecordActions
                        onView={() => setViewingTeacher(t)}
                        onEdit={() => handleOpenEdit(t)}
                        onDelete={() => handleDelete(t.id)}
                        compact
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredTeachers.length > 0 && viewMode === "cards" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {filteredTeachers.map((t) => (
              <div key={t.id} className={theme.cardClass}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-3xl">👨‍🏫</span>
                  <span className="font-bold text-lg text-gray-700">{getNombreCompleto(t)}</span>
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-semibold">RUT:</span> {t.rut ?? "-"}
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-semibold">Email:</span> {t.email ?? "-"}
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-semibold">Especialidad:</span> {t.specialization ?? "-"}
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-semibold">Estado:</span> {t.teacherStatus ?? "-"}
                </div>
                <div className="mt-3">
                  <RecordActions
                    onView={() => setViewingTeacher(t)}
                    onEdit={() => handleOpenEdit(t)}
                    onDelete={() => handleDelete(t.id)}
                    compact
                    stretch
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </ModuleLayout>

      {viewingTeacher && (
        <ViewDetailModal
          title="Detalle del profesor"
          subtitle={getTeacherFullName(viewingTeacher)}
          fields={getTeacherDetailFields(viewingTeacher)}
          onClose={() => setViewingTeacher(null)}
          theme={theme}
        />
      )}

      {showModal && (
        <FormModal
          title={editId ? "Editar Profesor" : "Nuevo Profesor"}
          subtitle={editId ? "Modifica los datos del docente" : "Registra un nuevo profesor"}
          theme={theme}
          onClose={closeTeacherModal}
          onSubmit={handleSubmit}
          error={error}
          submitting={submitting}
          submitLabel={editId ? "Guardar cambios" : "Crear profesor"}
          size="xl"
        >
          <FormField label="RUT" required>
            <input type="text" name="rut" value={formData.rut} onChange={(e) => setFormData((f) => ({ ...f, rut: e.target.value }))} className={inputClass} required />
          </FormField>
          <FormField label="Nombre" required>
            <input type="text" name="firstName" value={formData.firstName} onChange={(e) => setFormData((f) => ({ ...f, firstName: e.target.value }))} className={inputClass} required />
          </FormField>
          <FormField label="Apellido paterno" required>
            <input type="text" name="lastName" value={formData.lastName} onChange={(e) => setFormData((f) => ({ ...f, lastName: e.target.value }))} className={inputClass} required />
          </FormField>
          <FormField label="Apellido materno">
            <input type="text" name="secondLastName" value={formData.secondLastName} onChange={(e) => setFormData((f) => ({ ...f, secondLastName: e.target.value }))} className={inputClass} />
          </FormField>
          <FormField label="Email" required>
            <input type="email" name="email" value={formData.email} onChange={(e) => setFormData((f) => ({ ...f, email: e.target.value }))} className={inputClass} required />
          </FormField>
          <FormField label="Teléfono">
            <input type="text" name="phone" value={formData.phone} onChange={(e) => setFormData((f) => ({ ...f, phone: e.target.value }))} className={inputClass} />
          </FormField>
          <FormField label="Especialidad">
            <input type="text" name="specialization" value={formData.specialization} onChange={(e) => setFormData((f) => ({ ...f, specialization: e.target.value }))} className={inputClass} />
          </FormField>
          <FormField label="Estado">
            <select name="teacherStatus" value={formData.teacherStatus} onChange={(e) => setFormData((f) => ({ ...f, teacherStatus: e.target.value }))} className={`${inputClass} bg-white`}>
              <option value="ACTIVO">ACTIVO</option>
              <option value="INACTIVO">INACTIVO</option>
              <option value="LICENCIA">LICENCIA</option>
            </select>
          </FormField>
          <FormField label="Dirección" fullWidth>
            <input type="text" name="address" value={formData.address} onChange={(e) => setFormData((f) => ({ ...f, address: e.target.value }))} className={inputClass} />
          </FormField>
          <FormField label="Comuna">
            <input type="text" name="commune" value={formData.commune} onChange={(e) => setFormData((f) => ({ ...f, commune: e.target.value }))} className={inputClass} />
          </FormField>
          <FormField label="Ciudad">
            <input type="text" name="city" value={formData.city} onChange={(e) => setFormData((f) => ({ ...f, city: e.target.value }))} className={inputClass} />
          </FormField>
          <FormField label="N° empleado">
            <input type="text" name="employeeNumber" value={formData.employeeNumber} onChange={(e) => setFormData((f) => ({ ...f, employeeNumber: e.target.value }))} className={inputClass} />
          </FormField>
          <FormField label="Nivel educacional">
            <input type="text" name="educationLevel" value={formData.educationLevel} onChange={(e) => setFormData((f) => ({ ...f, educationLevel: e.target.value }))} className={inputClass} />
          </FormField>
          <FormField label="Fecha contrato">
            <input type="date" name="hireDate" value={formData.hireDate ?? ""} onChange={(e) => setFormData((f) => ({ ...f, hireDate: e.target.value }))} className={inputClass} />
          </FormField>
          <FormField label="Tipo contrato">
            <input type="text" name="contractType" value={formData.contractType} onChange={(e) => setFormData((f) => ({ ...f, contractType: e.target.value }))} className={inputClass} />
          </FormField>
        </FormModal>
      )}
    </>
  );
}

export default Teachers;