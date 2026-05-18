import { useState, useEffect } from "react";
import { getStudents, createStudent, updateStudent, deleteStudent } from "./api/students";
import type { Student, CreateStudentDto } from "./api/students";

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
  enrollmentNumber?: string;
  studentStatus?: string;
  guardianId?: number;
  userId?: number;
}

interface StudentsProps {
  onBack: () => void;
}

function Students({ onBack }: StudentsProps) {

  // ===== STATE =====
  const [students, setStudents] = useState<Student[]>([]);
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
    studentStatus: "",
    guardianId: undefined,
    userId: undefined,
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [searchTerm, setSearchTerm] = useState("");

  // ===== LOAD DATA =====
  const loadStudents = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getStudents();
      setStudents(data);

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
      studentStatus: "",
      guardianId: undefined,
      userId: undefined,
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
      studentStatus: student.studentStatus ?? "",
      guardianId: student.guardianId ?? undefined,
      userId: student.userId ?? undefined,
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
        studentStatus: formData.studentStatus?.trim() || undefined,
        guardianId: formData.guardianId || undefined,
        userId: formData.userId || undefined,
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

// ===== RENDER =====
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-teal-50 to-cyan-50 p-8">
      <div className="max-w-7xl mx-auto">

        {/* BOTÓN VOLVER */}
        <div className="mb-6">
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition font-medium"
          >
            ← Volver
          </button>
        </div>

        {/* CONTENEDOR PRINCIPAL */}
        <div className="bg-white rounded-xl shadow-md p-8">

          {/* HEADER */}
          <div className="flex flex-col gap-4 mb-6">

            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-700">👨‍🎓 Estudiantes</h2>
                <p className="text-gray-500">Gestión de estudiantes</p>
              </div>

              <button
                onClick={openCreateModal}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                ➕ Nuevo Estudiante
              </button>
            </div>

            {/* BUSCADOR */}
            <input
              type="text"
              placeholder="Buscar por nombre, rut o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            />

            {/* CAMBIO DE VISTA */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("cards")}
                className={`px-3 py-2 rounded ${
                  viewMode === "cards" ? "bg-green-500 text-white" : "bg-gray-200"
                }`}
              >
                Tarjetas
              </button>

              <button
                onClick={() => setViewMode("table")}
                className={`px-3 py-2 rounded ${
                  viewMode === "table" ? "bg-green-500 text-white" : "bg-gray-200"
                }`}
              >
                Tabla
              </button>
            </div>
          </div>

          {/* LOADING */}
          {loading && (
            <div className="text-center py-6">
              <p>Cargando estudiantes...</p>
            </div>
          )}

          {/* ERROR */}
          {error && (
            <div className="bg-red-100 text-red-600 p-4 mb-4 rounded">
              {error}
            </div>
          )}

          {/* LISTA EN TARJETAS */}
          {!loading && viewMode === "cards" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStudents.map((student) => (
                <div
                  key={student.id}
                  className="border p-4 rounded-lg shadow-sm bg-green-50"
                >
                  <h3 className="font-bold text-lg">
                    {student.firstName} {student.secondName} {student.lastName} {student.motherLastName}
                  </h3>

                  <p>RUT: {student.rut}</p>
                  <p>Email: {student.email}</p>
                  <p>Teléfono: {student.phone || '-'}</p>
                  <p>Apoderado: {student.guardianId ? 'Apoderado' : '-'}</p>
                  <p>Estado: {student.studentStatus}</p>

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => openEditModal(student)}
                      className="bg-yellow-400 px-3 py-1 rounded text-white"
                    >
                      Editar
                    </button>

                    <button
                      onClick={() => handleDelete(student)}
                      className="bg-red-500 px-3 py-1 rounded text-white"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

{/* TABLA */}
          {!loading && viewMode === "table" && (
            <div className="overflow-x-auto mt-6">
              <table className="w-full border text-xs md:text-sm">
                <thead className="bg-green-100">
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
                    <th className="p-2 text-left">Año Ingreso</th>
                    <th className="p-2 text-left">Nacionalidad</th>
                    <th className="p-2 text-left">Estado</th>
                    <th className="p-2 text-left">Apoderado</th>
                    <th className="p-2 text-left">User ID</th>
                    <th className="p-2 text-center">Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="border-t">
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

                      <td className="p-2">{student.studentStatus}</td>
                      <td className="p-2">{student.guardianId ? 'Apoderado' : '-'}</td>
                      <td className="p-2">{student.userId}</td>
                      <td className="p-2 text-center">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => openEditModal(student)}
                            className="bg-yellow-400 text-white px-2 py-1 rounded"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(student)}
                            className="bg-red-500 text-white px-2 py-1 rounded"
                          >
                            Eliminar
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

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-lg mx-auto my-8 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold"
              aria-label="Cerrar"
            >
              ×
            </button>
            <h3 className="text-2xl font-bold mb-6 text-gray-700">{editingStudent ? "Editar Estudiante" : "Nuevo Estudiante"}</h3>
            {formError && (
              <div className="bg-red-100 border border-red-300 text-red-700 rounded-lg p-3 mb-4">
                {formError}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">RUT *</label>
                <input
                  name="rut"
                  value={formData.rut}
                  onChange={handleInputChange}
                  placeholder="RUT"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Nombre *</label>
                <input
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="Nombre"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Segundo Nombre</label>
                <input
                  name="secondName"
                  value={formData.secondName}
                  onChange={handleInputChange}
                  placeholder="Segundo Nombre"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Apellido Paterno *</label>
                <input
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Apellido Paterno"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Apellido Materno *</label>
                <input
                  name="motherLastName"
                  value={formData.motherLastName}
                  onChange={handleInputChange}
                  placeholder="Apellido Materno"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Email *</label>
                <input
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Email"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Teléfono</label>
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Teléfono"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Dirección</label>
                <input
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Dirección"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Comuna</label>
                <input
                  name="commune"
                  value={formData.commune}
                  onChange={handleInputChange}
                  placeholder="Comuna"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Ciudad</label>
                <input
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="Ciudad"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Fecha de Nacimiento</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth || ""}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Fecha de Ingreso</label>
                <input
                  type="date"
                  name="admissionDate"
                  value={formData.admissionDate || ""}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Matrícula</label>
                <input
                  name="enrollmentNumber"
                  value={formData.enrollmentNumber}
                  onChange={handleInputChange}
                  placeholder="Matrícula"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Estado</label>
                <select
                  name="studentStatus"
                  value={formData.studentStatus}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent bg-white"
                >
                  <option value="">Seleccione estado</option>
                  <option value="ACTIVO">ACTIVO</option>
                  <option value="SUSPENDIDO">SUSPENDIDO</option>
                  <option value="MATRICULA CANCELADA">MATRICULA CANCELADA</option>
                  <option value="EGRESADO">EGRESADO</option>
                  <option value="RETIRADO">RETIRADO</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium"
                >
                  {editingStudent ? "Actualizar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Students; 