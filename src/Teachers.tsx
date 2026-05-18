// Valores iniciales para el formulario de profesor
const initialFormData: FormData = {
  rut: "",
  firstName: "",
  lastName: "",
  secondLastName: "",
  email: "",
  phone: "",
  specialization: "",
  teacherStatus: "",
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
  // --- HANDLERS Y STATE ---
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [teachers, setTeachers] = useState<TeacherFull[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
    if (!formData.rut || !formData.firstName || !formData.lastName) {
      setError("RUT, nombre y apellido son obligatorios");
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

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white rounded-xl shadow-md border border-gray-100 mt-8">
      {/* Botón Volver al Dashboard */}
      <div className="mb-4">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
        >
          ← Volver
        </button>
      </div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-700">👨‍🏫 Profesores</h2>
        <div className="flex gap-2">
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition font-medium shadow-sm"
          >
            ➕ Nuevo Profesor
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`px-3 py-2 rounded-lg font-medium text-sm ${
              viewMode === "table"
                ? "bg-purple-100 text-purple-700"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            Tabla
          </button>
          <button
            onClick={() => setViewMode("cards")}
            className={`px-3 py-2 rounded-lg font-medium text-sm ${
              viewMode === "cards"
                ? "bg-purple-100 text-purple-700"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            Tarjetas
          </button>
        </div>
      </div>
      {loading ? (
        <div className="text-center py-8 text-gray-500">Cargando profesores...</div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600">❌ {error}</p>
        </div>
      ) : teachers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No hay profesores registrados.</div>
      ) : viewMode === "table" ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-purple-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">ID</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Nombre</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Especialidad</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Estado</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Dirección</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Comuna</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Ciudad</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">N° Empleado</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Nivel Educacional</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Fecha Contrato</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Tipo Contrato</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {teachers.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-3 text-sm text-gray-700">{t.id}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{getNombreCompleto(t)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{t.email ?? "-"}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{t.specialization ?? "-"}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{t.teacherStatus ?? "-"}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{t.address ?? "-"}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{t.commune ?? "-"}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{t.city ?? "-"}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{t.employeeNumber ?? "-"}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{t.educationLevel ?? "-"}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{t.hireDate ? new Date(t.hireDate).toLocaleDateString() : "-"}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{t.contractType ?? "-"}</td>
                  <td className="px-4 py-3 text-sm text-center flex gap-2 justify-center">
                    <button
                      className="px-3 py-1 bg-yellow-400 text-white rounded-lg hover:bg-yellow-500 transition font-medium text-xs"
                      onClick={() => handleOpenEdit(t)}
                    >
                      Editar
                    </button>
                    <button
                      className="px-3 py-1 bg-red-400 text-white rounded-lg hover:bg-red-500 transition font-medium text-xs"
                      onClick={() => handleDelete(t.id)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        // Vista tipo tarjetas
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {teachers.map((t) => (
            <div
              key={t.id}
              className="bg-purple-50 rounded-xl shadow p-6 flex flex-col gap-2 border border-purple-100"
            >
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
              <div className="flex gap-2 mt-3">
                <button
                  className="flex-1 px-3 py-1 bg-yellow-400 text-white rounded-lg hover:bg-yellow-500 transition font-medium text-xs"
                  onClick={() => handleOpenEdit(t)}
                >
                  Editar
                </button>
                <button
                  className="flex-1 px-3 py-1 bg-red-400 text-white rounded-lg hover:bg-red-500 transition font-medium text-xs"
                  onClick={() => handleDelete(t.id)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal para crear/editar profesor */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 z-50 min-h-screen">
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-md p-4 sm:p-6"
            style={{
              maxHeight: '90vh',
              overflowY: 'auto',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
            }}
          >
            <h3 className="text-xl font-bold text-gray-700 mb-4">
              {editId ? "Editar Profesor" : "Nuevo Profesor"}
            </h3>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-red-600 text-sm">❌ {error}</p>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">RUT *</label>
                <input
                  type="text"
                  name="rut"
                  value={formData.rut}
                  onChange={e => setFormData(f => ({ ...f, rut: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Nombre *</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={e => setFormData(f => ({ ...f, firstName: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Apellido Paterno *</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={e => setFormData(f => ({ ...f, lastName: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Apellido Materno</label>
                <input
                  type="text"
                  name="secondLastName"
                  value={formData.secondLastName}
                  onChange={e => setFormData(f => ({ ...f, secondLastName: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={e => setFormData(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Teléfono</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={e => setFormData(f => ({ ...f, phone: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Especialidad</label>
                <input
                  type="text"
                  name="specialization"
                  value={formData.specialization}
                  onChange={e => setFormData(f => ({ ...f, specialization: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Estado</label>
                <input
                  type="text"
                  name="teacherStatus"
                  value={formData.teacherStatus}
                  onChange={e => setFormData(f => ({ ...f, teacherStatus: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                />
              </div>
              {/* Nuevos campos opcionales del DTO */}
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Dirección</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={e => setFormData(f => ({ ...f, address: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Comuna</label>
                <input
                  type="text"
                  name="commune"
                  value={formData.commune}
                  onChange={e => setFormData(f => ({ ...f, commune: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Ciudad</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={e => setFormData(f => ({ ...f, city: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">N° Empleado</label>
                <input
                  type="text"
                  name="employeeNumber"
                  value={formData.employeeNumber}
                  onChange={e => setFormData(f => ({ ...f, employeeNumber: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Nivel Educacional</label>
                <input
                  type="text"
                  name="educationLevel"
                  value={formData.educationLevel}
                  onChange={e => setFormData(f => ({ ...f, educationLevel: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Fecha Contrato</label>
                <input
                  type="date"
                  name="hireDate"
                  value={formData.hireDate ?? ""}
                  onChange={e => setFormData(f => ({ ...f, hireDate: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">Tipo Contrato</label>
                <input
                  type="text"
                  name="contractType"
                  value={formData.contractType}
                  onChange={e => setFormData(f => ({ ...f, contractType: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditId(null);
                    setFormData(initialFormData);
                  }}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition font-medium disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition font-medium disabled:opacity-50"
                >
                  {submitting ? "Guardando..." : editId ? "Actualizar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Teachers;