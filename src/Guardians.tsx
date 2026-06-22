import { useState, useEffect, useMemo } from "react";
import {
  getGuardians,
  createGuardian,
  updateGuardian,
  deleteGuardian,
} from "./api/guardians";
import type { Guardian, CreateGuardianDto } from "./api/guardians";
import { getStudents } from "./api/students";
import type { Student } from "./api/students";
import ViewDetailModal, { type DetailField } from "./components/ViewDetailModal";
import { moduleThemes } from "./theme/moduleThemes";
import ModuleLayout from "./components/ModuleLayout";
import RecordActions from "./components/RecordActions";
import FormModal, { FormField, formInputClass } from "./components/FormModal";
import PortalAccessSection from "./components/PortalAccessSection";
import { initialPortalAccessState, provisionPortalAccess } from "./utils/provisionPortalAccess";
import { useAuth } from "./auth/AuthContext";
import { formatStudentFullName } from "./utils/formatStudentFullName";
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

interface FormData {
  rut: string;
  firstName: string;
  lastName: string;
  secondLastName?: string;
  email: string;
  phone: string;
  emergencyPhone?: string;
  address?: string;
  commune?: string;
  city?: string;
  relationship: string;
  occupation?: string;
  workplace?: string;
  workPhone?: string;
  isPrimary: boolean;
}

const initialForm: FormData = {
  rut: "",
  firstName: "",
  lastName: "",
  secondLastName: "",
  email: "",
  phone: "",
  emergencyPhone: "",
  address: "",
  commune: "",
  city: "",
  relationship: "PADRE",
  occupation: "",
  workplace: "",
  workPhone: "",
  isPrimary: true,
};

interface GuardiansProps {
  onBack: () => void;
}

function Guardians({ onBack }: GuardiansProps) {
  const theme = moduleThemes.guardians;
  const auth = useAuth();
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Guardian | null>(null);
  const [formData, setFormData] = useState<FormData>(initialForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [viewingGuardian, setViewingGuardian] = useState<Guardian | null>(null);
  const [portalAccess, setPortalAccess] = useState(initialPortalAccessState);

  const getGuardianFullName = (g: Guardian) =>
    [g.firstName, g.lastName, g.secondLastName].filter(Boolean).join(" ");

  const studentsByGuardianId = useMemo(() => {
    const map = new Map<number, Student[]>();
    for (const student of students) {
      if (!student.guardianId) continue;
      const list = map.get(student.guardianId) ?? [];
      list.push(student);
      map.set(student.guardianId, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) =>
        formatStudentFullName(a).localeCompare(formatStudentFullName(b), "es"),
      );
    }
    return map;
  }, [students]);

  const getGuardianStudentsLabel = (guardianId: number) => {
    const linkedStudents = studentsByGuardianId.get(guardianId) ?? [];
    if (linkedStudents.length === 0) return "Sin estudiante asignado";
    return linkedStudents.map((student) => formatStudentFullName(student)).join(", ");
  };

  const getGuardianDetailFields = (g: Guardian): DetailField[] => [
    { label: "Estudiante(s)", value: getGuardianStudentsLabel(g.id), fullWidth: true },
    { label: "RUT", value: formatRutDisplay(g.rut) || g.rut },
    { label: "Nombre", value: g.firstName },
    { label: "Apellido paterno", value: g.lastName },
    { label: "Apellido materno", value: g.secondLastName },
    { label: "Email", value: g.email },
    { label: "Teléfono", value: g.phone },
    { label: "Teléfono emergencia", value: g.emergencyPhone },
    { label: "Relación", value: g.relationship },
    { label: "Dirección", value: g.address },
    { label: "Comuna", value: g.commune },
    { label: "Ciudad", value: g.city },
    { label: "Ocupación", value: g.occupation },
    { label: "Lugar de trabajo", value: g.workplace },
    { label: "Teléfono trabajo", value: g.workPhone },
    { label: "Tipo", value: g.isPrimary ? "Titular" : "Suplente" },
  ];

  const loadGuardians = async () => {
    try {
      setLoading(true);
      setError(null);
      const [guardiansData, studentsData] = await Promise.all([getGuardians(), getStudents()]);
      setGuardians(sortById(guardiansData));
      setStudents(sortById(studentsData));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar apoderados");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadGuardians();
  }, []);

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return guardians.filter((g) => {
      const studentNames = getGuardianStudentsLabel(g.id).toLowerCase();
      return (
        g.rut.toLowerCase().includes(q) ||
        g.firstName.toLowerCase().includes(q) ||
        g.lastName.toLowerCase().includes(q) ||
        g.email.toLowerCase().includes(q) ||
        studentNames.includes(q)
      );
    });
  }, [guardians, searchTerm, studentsByGuardianId]);

  const openCreate = () => {
    setEditing(null);
    setFormData(initialForm);
    setFormError(null);
    setPortalAccess(initialPortalAccessState);
    setShowModal(true);
  };

  const openEdit = (g: Guardian) => {
    setEditing(g);
    setFormData({
      rut: g.rut,
      firstName: g.firstName,
      lastName: g.lastName,
      secondLastName: g.secondLastName ?? "",
      email: g.email,
      phone: g.phone,
      emergencyPhone: g.emergencyPhone ?? "",
      address: g.address ?? "",
      commune: g.commune ?? "",
      city: g.city ?? "",
      relationship: g.relationship,
      occupation: g.occupation ?? "",
      workplace: g.workplace ?? "",
      workPhone: g.workPhone ?? "",
      isPrimary: g.isPrimary ?? true,
    });
    setFormError(null);
    setPortalAccess(initialPortalAccessState);
    setShowModal(true);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.phone.trim()) {
      setFormError("Nombre, apellido y teléfono son obligatorios");
      return;
    }

    const rutError = validateRutField(formData.rut);
    if (rutError) {
      setFormError(rutError);
      return;
    }

    const emailError = validateEmailField(formData.email);
    if (emailError) {
      setFormError(emailError);
      return;
    }

    const phoneError = validatePhoneField(formData.phone, true);
    if (phoneError) {
      setFormError(phoneError);
      return;
    }

    const emergencyPhoneError = validatePhoneField(formData.emergencyPhone ?? "", false);
    if (emergencyPhoneError) {
      setFormError(emergencyPhoneError);
      return;
    }

    setFormError(null);
    const payload: CreateGuardianDto = {
      rut: normalizeRut(formData.rut),
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      secondLastName: formData.secondLastName?.trim() || undefined,
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      emergencyPhone: formData.emergencyPhone?.trim() || undefined,
      address: formData.address?.trim() || undefined,
      commune: formData.commune?.trim() || undefined,
      city: formData.city?.trim() || undefined,
      relationship: formData.relationship,
      occupation: formData.occupation?.trim() || undefined,
      workplace: formData.workplace?.trim() || undefined,
      workPhone: formData.workPhone?.trim() || undefined,
      isPrimary: formData.isPrimary,
    };
    try {
      let userId = editing?.userId;
      if (auth.isAdmin) {
        userId = await provisionPortalAccess({
          enabled: portalAccess.enabled,
          username: portalAccess.username,
          password: portalAccess.password,
          passwordConfirm: portalAccess.passwordConfirm,
          email: formData.email.trim(),
          role: "APODERADO",
          existingUserId: editing?.userId,
        }) ?? userId;
      }
      if (userId) {
        payload.userId = userId;
      }
      if (editing) {
        await updateGuardian(editing.id, payload);
      } else {
        await createGuardian(payload);
      }
      await loadGuardians();
      setShowModal(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al guardar");
    }
  };

  const handleDelete = async (g: Guardian) => {
    if (!confirm(`¿Eliminar apoderado ${g.firstName} ${g.lastName}?`)) return;
    try {
      await deleteGuardian(g.id);
      await loadGuardians();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
    }
  };

  const inputClass = formInputClass(theme);

  return (
    <>
      <ModuleLayout
        theme={theme}
        onBack={onBack}
        createLabel="Nuevo Apoderado"
        onCreate={openCreate}
        canCreate={auth.canCreate("guardians")}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar por RUT, nombre, email o estudiante..."
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onRefresh={loadGuardians}
        loading={loading}
        error={error}
      >
        {guardians.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">👪</div>
            <p className="mb-4">No hay apoderados registrados</p>
            <button
              onClick={openCreate}
              className={`px-6 py-3 rounded-lg transition font-medium shadow-sm ${theme.primaryBtn}`}
            >
              Crear primer apoderado
            </button>
          </div>
        )}

        {guardians.length > 0 && filtered.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">🔍</div>
            <p>No se encontraron apoderados con ese criterio</p>
          </div>
        )}

        {filtered.length > 0 && viewMode === "cards" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((g) => (
              <div key={g.id} className={theme.cardClass}>
                <h3 className="font-bold">{g.firstName} {g.lastName}</h3>
                <p className="text-sm font-medium text-teal-800">
                  Estudiante: {getGuardianStudentsLabel(g.id)}
                </p>
                <p className={`text-sm ${RUT_TABLE_CELL_CLASS}`}>
                  RUT: {formatRutDisplay(g.rut) || "—"}
                </p>
                <p className="text-sm">Relación: {g.relationship}</p>
                <p className="text-sm">Email: {g.email}</p>
                <p className="text-sm">Tel: {g.phone}</p>
                <p className="text-sm">{g.isPrimary ? "Titular" : "Suplente"}</p>
                <div className="mt-3">
                  <RecordActions
                    onView={() => setViewingGuardian(g)}
                    onEdit={() => openEdit(g)}
                    onDelete={() => handleDelete(g)}
                    canEdit={auth.canEdit("guardians")}
                    canDelete={auth.canDelete("guardians")}
                    compact
                    stretch
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {filtered.length > 0 && viewMode === "table" && (
          <div className={theme.tableWrap}>
            <table className="w-full text-sm">
              <thead className={theme.tableHead}>
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Estudiante(s)</th>
                  <th className={`px-4 py-3 text-left font-semibold ${RUT_TABLE_CELL_CLASS}`}>RUT</th>
                  <th className="px-4 py-3 text-left font-semibold">Nombre</th>
                  <th className="px-4 py-3 text-left font-semibold">Apellido paterno</th>
                  <th className="px-4 py-3 text-left font-semibold">Apellido materno</th>
                  <th className="px-4 py-3 text-left font-semibold">Email</th>
                  <th className="px-4 py-3 text-left font-semibold">Teléfono</th>
                  <th className="px-4 py-3 text-left font-semibold">Tel. emergencia</th>
                  <th className="px-4 py-3 text-left font-semibold">Relación</th>
                  <th className="px-4 py-3 text-left font-semibold">Tipo</th>
                  <th className="px-4 py-3 text-left font-semibold">Comuna</th>
                  <th className="px-4 py-3 text-left font-semibold">Ciudad</th>
                  <th className="px-4 py-3 text-center font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((g) => (
                  <tr key={g.id} className={`border-t border-slate-100 ${theme.tableRowHover}`}>
                    <td
                      className="max-w-[220px] truncate px-4 py-3 font-medium text-teal-800"
                      title={getGuardianStudentsLabel(g.id)}
                    >
                      {getGuardianStudentsLabel(g.id)}
                    </td>
                    <td className={`px-4 py-3 text-gray-700 ${RUT_TABLE_CELL_CLASS}`}>
                      {formatRutDisplay(g.rut) || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{g.firstName}</td>
                    <td className="px-4 py-3 text-gray-600">{g.lastName}</td>
                    <td className="px-4 py-3 text-gray-600">{g.secondLastName || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{g.email}</td>
                    <td className="px-4 py-3 text-gray-600">{g.phone}</td>
                    <td className="px-4 py-3 text-gray-600">{g.emergencyPhone || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{g.relationship}</td>
                    <td className="px-4 py-3 text-gray-600">{g.isPrimary ? "Titular" : "Suplente"}</td>
                    <td className="px-4 py-3 text-gray-600">{g.commune || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{g.city || "—"}</td>
                    <td className="px-4 py-3">
                      <RecordActions
                        onView={() => setViewingGuardian(g)}
                        onEdit={() => openEdit(g)}
                        onDelete={() => handleDelete(g)}
                    canEdit={auth.canEdit("guardians")}
                    canDelete={auth.canDelete("guardians")}
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

      {viewingGuardian && (
        <ViewDetailModal
          title="Detalle del apoderado"
          subtitle={getGuardianFullName(viewingGuardian)}
          fields={getGuardianDetailFields(viewingGuardian)}
          onClose={() => setViewingGuardian(null)}
          theme={theme}
        />
      )}

      {showModal && (
        <FormModal
          title={editing ? "Editar Apoderado" : "Nuevo Apoderado"}
          subtitle={editing ? "Actualiza los datos del apoderado" : "Registra un nuevo apoderado o tutor"}
          theme={theme}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
          error={formError}
          submitLabel={editing ? "Guardar cambios" : "Crear apoderado"}
        >
          <FormField label="RUT" required>
            <input
              name="rut"
              value={formData.rut}
              onChange={handleChange}
              onBlur={() => {
                if (formData.rut.trim() && isValidRut(formData.rut)) {
                  setFormData((prev) => ({ ...prev, rut: normalizeRut(prev.rut) }));
                }
              }}
              placeholder="11.111.111-1"
              required
              className={inputClass}
            />
          </FormField>
          <FormField label="Nombre" required>
            <input name="firstName" value={formData.firstName} onChange={handleChange} required className={inputClass} />
          </FormField>
          <FormField label="Apellido paterno" required>
            <input name="lastName" value={formData.lastName} onChange={handleChange} required className={inputClass} />
          </FormField>
          <FormField label="Apellido materno">
            <input name="secondLastName" value={formData.secondLastName} onChange={handleChange} className={inputClass} />
          </FormField>
          <FormField label="Email" required>
            <input name="email" type="email" value={formData.email} onChange={handleChange} required className={inputClass} />
          </FormField>
          {auth.isAdmin && (
            <PortalAccessSection
              theme={theme}
              role="APODERADO"
              roleLabel="Apoderado"
              email={formData.email}
              rut={formData.rut}
              existingUserId={editing?.userId}
              value={portalAccess}
              onChange={setPortalAccess}
            />
          )}
          <FormField label="Teléfono" required>
            <input name="phone" value={formData.phone} onChange={handleChange} required className={inputClass} />
          </FormField>
          <FormField label="Teléfono emergencia">
            <input name="emergencyPhone" value={formData.emergencyPhone} onChange={handleChange} className={inputClass} />
          </FormField>
          <FormField label="Relación">
            <select name="relationship" value={formData.relationship} onChange={handleChange} className={`${inputClass} bg-white`}>
              <option value="PADRE">PADRE</option>
              <option value="MADRE">MADRE</option>
              <option value="TUTOR">TUTOR</option>
              <option value="ABUELO">ABUELO</option>
              <option value="ABUELA">ABUELA</option>
              <option value="TIO">TÍO</option>
              <option value="TIA">TÍA</option>
            </select>
          </FormField>
          <FormField label="Dirección" fullWidth>
            <input name="address" value={formData.address} onChange={handleChange} className={inputClass} />
          </FormField>
          <FormField label="Comuna">
            <input name="commune" value={formData.commune} onChange={handleChange} className={inputClass} />
          </FormField>
          <FormField label="Ciudad">
            <input name="city" value={formData.city} onChange={handleChange} className={inputClass} />
          </FormField>
          <FormField label="Tipo" fullWidth>
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-700">
              <input type="checkbox" name="isPrimary" checked={formData.isPrimary} onChange={handleChange} className="rounded border-slate-300" />
              Apoderado titular
            </label>
          </FormField>
        </FormModal>
      )}
    </>
  );
}

export default Guardians;
