import { useState, useEffect } from "react";
import {
  getGuardians,
  createGuardian,
  updateGuardian,
  deleteGuardian,
} from "./api/guardians";
import type { Guardian, CreateGuardianDto } from "./api/guardians";
import ViewDetailModal, { type DetailField } from "./components/ViewDetailModal";
import { moduleThemes } from "./theme/moduleThemes";
import ModuleLayout from "./components/ModuleLayout";
import RecordActions from "./components/RecordActions";
import FormModal, { FormField, formInputClass } from "./components/FormModal";

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
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Guardian | null>(null);
  const [formData, setFormData] = useState<FormData>(initialForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [viewingGuardian, setViewingGuardian] = useState<Guardian | null>(null);

  const getGuardianFullName = (g: Guardian) =>
    [g.firstName, g.lastName, g.secondLastName].filter(Boolean).join(" ");

  const getGuardianDetailFields = (g: Guardian): DetailField[] => [
    { label: "RUT", value: g.rut },
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
      setGuardians(await getGuardians());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar apoderados");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadGuardians();
  }, []);

  const filtered = guardians.filter((g) => {
    const q = searchTerm.toLowerCase();
    return (
      g.rut.toLowerCase().includes(q) ||
      g.firstName.toLowerCase().includes(q) ||
      g.lastName.toLowerCase().includes(q) ||
      g.email.toLowerCase().includes(q)
    );
  });

  const openCreate = () => {
    setEditing(null);
    setFormData(initialForm);
    setFormError(null);
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
    if (!formData.rut.trim() || !formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim() || !formData.phone.trim()) {
      setFormError("RUT, nombre, apellido, email y teléfono son obligatorios");
      return;
    }
    setFormError(null);
    const payload: CreateGuardianDto = {
      rut: formData.rut.trim(),
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
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar por RUT, nombre o email..."
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
                <p className="text-sm">RUT: {g.rut}</p>
                <p className="text-sm">Relación: {g.relationship}</p>
                <p className="text-sm">Email: {g.email}</p>
                <p className="text-sm">Tel: {g.phone}</p>
                <p className="text-sm">{g.isPrimary ? "Titular" : "Suplente"}</p>
                <div className="mt-3">
                  <RecordActions
                    onView={() => setViewingGuardian(g)}
                    onEdit={() => openEdit(g)}
                    onDelete={() => handleDelete(g)}
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
                  <th className="px-4 py-3 text-left font-semibold">RUT</th>
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
                    <td className="px-4 py-3 text-gray-700">{g.rut}</td>
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
            <input name="rut" value={formData.rut} onChange={handleChange} required className={inputClass} />
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
