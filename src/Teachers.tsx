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

import { useState, useEffect, useMemo } from "react";

import { getTeachers, createTeacher, updateTeacher, deleteTeacher } from "./api/teachers";

import type { Teacher, TeacherFormData } from "./api/teachers";

import { getSubjects } from "./api/subjects";

import type { Subject } from "./api/subjects";

import { getCourses } from "./api/courses";

import type { Course } from "./api/courses";

import { moduleThemes } from "./theme/moduleThemes";

import ModuleLayout from "./components/ModuleLayout";

import RecordActions from "./components/RecordActions";

import FormModal, { FormField, formInputClass } from "./components/FormModal";

import PortalAccessSection from "./components/PortalAccessSection";

import { initialPortalAccessState, provisionPortalAccess } from "./utils/provisionPortalAccess";

import TeacherWorkloadModal from "./components/TeacherWorkloadModal";

import { useAuth } from "./auth/AuthContext";

import {

  CONTRACT_TYPE_OPTIONS,

  TEACHER_EDUCATION_LEVEL_OPTIONS,

  TEACHER_SPECIALIZATION_OPTIONS,

  catalogOptionLabel,

} from "./constants/teacherCatalogOptions";

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



type TeacherFull = Teacher & {

  address?: string;

  commune?: string;

  city?: string;

  employeeNumber?: string;

  educationLevel?: string;

  hireDate?: string;

  contractType?: string;

  userId?: number;

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



type TeachersProps = {

  onBack?: () => void;

};



function orphanCatalogOption(value: string | undefined, options: { value: string; label: string }[]) {

  if (!value || options.some((option) => option.value === value)) return null;

  return (

    <option key={`legacy-${value}`} value={value}>

      {value} (registro anterior)

    </option>

  );

}



function Teachers({ onBack }: TeachersProps) {

  const theme = moduleThemes.teachers;

  const auth = useAuth();

  const [formData, setFormData] = useState<FormData>(initialFormData);

  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  const [searchTerm, setSearchTerm] = useState("");

  const [teacherFilter, setTeacherFilter] = useState("");

  const [teachers, setTeachers] = useState<TeacherFull[]>([]);

  const [subjects, setSubjects] = useState<Subject[]>([]);

  const [courses, setCourses] = useState<Course[]>([]);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);

  const [editId, setEditId] = useState<number | null>(null);

  const [submitting, setSubmitting] = useState(false);

  const [viewingTeacher, setViewingTeacher] = useState<TeacherFull | null>(null);

  const [portalAccess, setPortalAccess] = useState(initialPortalAccessState);

  const editingTeacher = editId ? teachers.find((teacher) => teacher.id === editId) ?? null : null;



  const getTeacherFullName = (t: TeacherFull) =>

    [t.firstName, t.lastName, t.secondLastName].filter(Boolean).join(" ");



  const loadTeachers = async () => {

    setLoading(true);

    setError(null);

    try {

      const [teachersData, subjectsData, coursesData] = await Promise.all([

        getTeachers(),

        getSubjects(),

        getCourses(),

      ]);

      const unique = teachersData.filter((teacher, idx, arr) =>

        arr.findIndex((t) => t.id === teacher.id) === idx,

      );

      setTeachers(sortById(unique));

      setSubjects(sortById(subjectsData));

      setCourses(sortById(coursesData));

    } catch (err) {

      setError(err instanceof Error ? err.message : "Error al cargar profesores");

    } finally {

      setLoading(false);

    }

  };



  useEffect(() => {

    void loadTeachers();

  }, []);



  const handleOpenCreate = () => {

    setFormData(initialFormData);

    setEditId(null);

    setPortalAccess(initialPortalAccessState);

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

    setPortalAccess(initialPortalAccessState);

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

    if (!formData.firstName || !formData.lastName) {

      setError("Nombre y apellido son obligatorios");

      setSubmitting(false);

      return;

    }

    const rutError = validateRutField(formData.rut);

    if (rutError) {

      setError(rutError);

      setSubmitting(false);

      return;

    }

    const emailError = validateEmailField(formData.email ?? "");

    if (emailError) {

      setError(emailError);

      setSubmitting(false);

      return;

    }

    const phoneError = validatePhoneField(formData.phone ?? "", false);

    if (phoneError) {

      setError(phoneError);

      setSubmitting(false);

      return;

    }

    const payload: TeacherFormData = {

      ...formData,

      rut: normalizeRut(formData.rut),

      email: formData.email?.trim(),

    };

    try {

      let userId = editingTeacher?.userId;
      if (auth.isAdmin) {
        userId = await provisionPortalAccess({
          enabled: portalAccess.enabled,
          username: portalAccess.username,
          password: portalAccess.password,
          passwordConfirm: portalAccess.passwordConfirm,
          email: formData.email?.trim() ?? "",
          role: "DOCENTE",
          existingUserId: editingTeacher?.userId,
        }) ?? userId;
      }
      if (userId) {
        payload.userId = userId;
      }

      if (editId) {

        await updateTeacher(editId, payload);

      } else {

        await createTeacher(payload);

      }

      await loadTeachers();

      setShowModal(false);

      setFormData(initialFormData);

      setEditId(null);

      setPortalAccess(initialPortalAccessState);

    } catch (err) {

      setError(err instanceof Error ? err.message : "Error al guardar profesor");

    } finally {

      setSubmitting(false);

    }

  };



  const getNombreCompleto = (t: Teacher) => [t.firstName, t.lastName].filter(Boolean).join(" ");



  const filteredTeachers = useMemo(() => {

    const query = searchTerm.toLowerCase();

    return teachers.filter((teacher) => {

      if (teacherFilter && String(teacher.id) !== teacherFilter) return false;

      return (

        (teacher.rut ?? "").toLowerCase().includes(query) ||

        (teacher.firstName ?? "").toLowerCase().includes(query) ||

        (teacher.lastName ?? "").toLowerCase().includes(query) ||

        (teacher.email ?? "").toLowerCase().includes(query) ||

        (teacher.specialization ?? "").toLowerCase().includes(query)

      );

    });

  }, [teachers, searchTerm, teacherFilter]);



  const openTeacherDetail = (teacher: TeacherFull) => {

    setViewingTeacher(teacher);

  };



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

        canCreate={auth.canCreate("teachers")}

        searchTerm={searchTerm}

        onSearchChange={setSearchTerm}

        searchPlaceholder="Buscar por nombre, RUT o especialidad..."

        viewMode={viewMode}

        onViewModeChange={setViewMode}

        onRefresh={loadTeachers}

        loading={loading}

        error={error}

        toolbarExtra={

          teachers.length > 0 ? (

            <select

              value={teacherFilter}

              onChange={(e) => setTeacherFilter(e.target.value)}

              className={`min-w-[220px] rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:ring-2 ${theme.focusRing}`}

              aria-label="Filtrar por profesor"

            >

              <option value="">Todos los profesores</option>

              {teachers.map((teacher) => (

                <option key={teacher.id} value={teacher.id}>

                  {getTeacherFullName(teacher)}

                </option>

              ))}

            </select>

          ) : undefined

        }

      >

        {teachers.length === 0 && (

          <div className="text-center py-8 text-gray-500">No hay profesores registrados.</div>

        )}



        {teachers.length > 0 && filteredTeachers.length === 0 && (

          <div className="text-center py-8 text-gray-500">

            No se encontraron profesores con ese criterio.

          </div>

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

                    <td className="px-4 py-3 text-gray-700">

                      <button

                        type="button"

                        onClick={() => openTeacherDetail(t)}

                        className="font-medium text-left text-slate-800 underline-offset-2 hover:text-teal-700 hover:underline"

                      >

                        {getNombreCompleto(t)}

                      </button>

                    </td>

                    <td className="px-4 py-3 text-gray-700">{t.email ?? "-"}</td>

                    <td className="px-4 py-3 text-gray-700">

                      {catalogOptionLabel(TEACHER_SPECIALIZATION_OPTIONS, t.specialization)}

                    </td>

                    <td className="px-4 py-3 text-gray-700">{t.teacherStatus ?? "-"}</td>

                    <td className="px-4 py-3 text-gray-700">{t.address ?? "-"}</td>

                    <td className="px-4 py-3 text-gray-700">{t.commune ?? "-"}</td>

                    <td className="px-4 py-3 text-gray-700">{t.city ?? "-"}</td>

                    <td className="px-4 py-3 text-gray-700">{t.employeeNumber ?? "-"}</td>

                    <td className="px-4 py-3 text-gray-700">

                      {catalogOptionLabel(TEACHER_EDUCATION_LEVEL_OPTIONS, t.educationLevel)}

                    </td>

                    <td className="px-4 py-3 text-gray-700">

                      {t.hireDate ? new Date(t.hireDate).toLocaleDateString() : "-"}

                    </td>

                    <td className="px-4 py-3 text-gray-700">

                      {catalogOptionLabel(CONTRACT_TYPE_OPTIONS, t.contractType)}

                    </td>

                    <td className="px-4 py-3">

                      <RecordActions

                        onView={() => openTeacherDetail(t)}

                        onEdit={() => handleOpenEdit(t)}

                        onDelete={() => handleDelete(t.id)}

                        canEdit={auth.canEdit("teachers")}

                        canDelete={auth.canDelete("teachers")}

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

                  <button

                    type="button"

                    onClick={() => openTeacherDetail(t)}

                    className="font-bold text-lg text-gray-700 text-left hover:text-teal-700 hover:underline"

                  >

                    {getNombreCompleto(t)}

                  </button>

                </div>

                <div className="text-sm text-gray-600">

                  <span className="font-semibold">RUT:</span>{" "}
                  <span className={RUT_TABLE_CELL_CLASS}>{formatRutDisplay(t.rut) || "—"}</span>

                </div>

                <div className="text-sm text-gray-600">

                  <span className="font-semibold">Email:</span> {t.email ?? "-"}

                </div>

                <div className="text-sm text-gray-600">

                  <span className="font-semibold">Especialidad:</span>{" "}

                  {catalogOptionLabel(TEACHER_SPECIALIZATION_OPTIONS, t.specialization)}

                </div>

                <div className="text-sm text-gray-600">

                  <span className="font-semibold">Estado:</span> {t.teacherStatus ?? "-"}

                </div>

                <div className="mt-3">

                  <RecordActions

                    onView={() => openTeacherDetail(t)}

                    onEdit={() => handleOpenEdit(t)}

                    onDelete={() => handleDelete(t.id)}

                    canEdit={auth.canEdit("teachers")}

                    canDelete={auth.canDelete("teachers")}

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

        <TeacherWorkloadModal

          teacher={viewingTeacher}

          subjects={subjects}

          courses={courses}

          theme={theme}

          specializationLabel={catalogOptionLabel(

            TEACHER_SPECIALIZATION_OPTIONS,

            viewingTeacher.specialization,

          )}

          contractTypeLabel={catalogOptionLabel(

            CONTRACT_TYPE_OPTIONS,

            viewingTeacher.contractType,

          )}

          onClose={() => setViewingTeacher(null)}

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

            <input
              type="text"
              name="rut"
              value={formData.rut}
              onChange={(e) => setFormData((f) => ({ ...f, rut: e.target.value }))}
              onBlur={() => {
                if (formData.rut.trim() && isValidRut(formData.rut)) {
                  setFormData((f) => ({ ...f, rut: normalizeRut(f.rut) }));
                }
              }}
              placeholder="11.111.111-1"
              className={inputClass}
              required
            />

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

          {auth.isAdmin && (
            <PortalAccessSection
              theme={theme}
              role="DOCENTE"
              roleLabel="Docente"
              email={formData.email ?? ""}
              rut={formData.rut}
              existingUserId={editingTeacher?.userId}
              value={portalAccess}
              onChange={setPortalAccess}
            />
          )}

          <FormField label="Teléfono">

            <input type="text" name="phone" value={formData.phone} onChange={(e) => setFormData((f) => ({ ...f, phone: e.target.value }))} className={inputClass} />

          </FormField>

          <FormField label="Especialidad">

            <select

              name="specialization"

              value={formData.specialization ?? ""}

              onChange={(e) => setFormData((f) => ({ ...f, specialization: e.target.value }))}

              className={`${inputClass} bg-white`}

            >

              <option value="">Seleccionar especialidad</option>

              {orphanCatalogOption(formData.specialization, TEACHER_SPECIALIZATION_OPTIONS)}

              {TEACHER_SPECIALIZATION_OPTIONS.map((option) => (

                <option key={option.value} value={option.value}>

                  {option.label}

                </option>

              ))}

            </select>

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

            <select

              name="educationLevel"

              value={formData.educationLevel ?? ""}

              onChange={(e) => setFormData((f) => ({ ...f, educationLevel: e.target.value }))}

              className={`${inputClass} bg-white`}

            >

              <option value="">Seleccionar nivel educacional</option>

              {orphanCatalogOption(formData.educationLevel, TEACHER_EDUCATION_LEVEL_OPTIONS)}

              {TEACHER_EDUCATION_LEVEL_OPTIONS.map((option) => (

                <option key={option.value} value={option.value}>

                  {option.label}

                </option>

              ))}

            </select>

          </FormField>

          <FormField label="Fecha contrato">

            <input type="date" name="hireDate" value={formData.hireDate ?? ""} onChange={(e) => setFormData((f) => ({ ...f, hireDate: e.target.value }))} className={inputClass} />

          </FormField>

          <FormField label="Tipo contrato">

            <select

              name="contractType"

              value={formData.contractType ?? ""}

              onChange={(e) => setFormData((f) => ({ ...f, contractType: e.target.value }))}

              className={`${inputClass} bg-white`}

            >

              <option value="">Seleccionar tipo de contrato</option>

              {CONTRACT_TYPE_OPTIONS.map((option) => (

                <option key={option.value} value={option.value}>

                  {option.label}

                </option>

              ))}

            </select>

          </FormField>

        </FormModal>

      )}

    </>

  );

}



export default Teachers;

