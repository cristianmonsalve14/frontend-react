const API_URL = "http://localhost:8082/teachers";

// ===== TIPOS =====
export interface Teacher {
  id: number;
  rut: string;
  firstName: string;
  lastName: string;
  secondLastName?: string;
  email?: string;
  phone?: string;
  specialization?: string;
  teacherStatus?: string;
}

// FormData para crear/editar
export type TeacherFormData = {
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

// ===== HEADERS CON TOKEN =====
function getAuthHeaders() {
  const token = localStorage.getItem("token");
  if (!token) {
    console.error("No JWT token found in localStorage. Debes iniciar sesión.");
  }
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token || ""}`
  };
}

// ===== CREATE =====
export const createTeacher = async (teacher: TeacherFormData): Promise<Teacher> => {
  const body = {
    rut: teacher.rut,
    firstName: teacher.firstName,
    lastName: teacher.lastName,
    secondLastName: teacher.secondLastName ?? null,
    email: teacher.email ?? null,
    phone: teacher.phone ?? null,
    specialization: teacher.specialization ?? null,
    teacherStatus: teacher.teacherStatus ?? "ACTIVO",
    address: teacher.address ?? null,
    commune: teacher.commune ?? null,
    city: teacher.city ?? null,
    employeeNumber: teacher.employeeNumber ?? null,
    educationLevel: teacher.educationLevel ?? null,
    hireDate: teacher.hireDate ?? null,
    contractType: teacher.contractType ?? null,
  };

  const response = await fetch(API_URL, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.message || `Error ${response.status}: ${response.statusText}`;
    throw new Error(errorMessage);
  }

  return await response.json();
};

// ===== UPDATE =====
export const updateTeacher = async (id: number, teacher: TeacherFormData): Promise<Teacher> => {
  const body = {
    rut: teacher.rut,
    firstName: teacher.firstName,
    lastName: teacher.lastName,
    secondLastName: teacher.secondLastName ?? null,
    email: teacher.email ?? null,
    phone: teacher.phone ?? null,
    specialization: teacher.specialization ?? null,
    teacherStatus: teacher.teacherStatus ?? "ACTIVO",
    address: teacher.address ?? null,
    commune: teacher.commune ?? null,
    city: teacher.city ?? null,
    employeeNumber: teacher.employeeNumber ?? null,
    educationLevel: teacher.educationLevel ?? null,
    hireDate: teacher.hireDate ?? null,
    contractType: teacher.contractType ?? null,
  };

  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.message || `Error ${response.status}: ${response.statusText}`;
    throw new Error(errorMessage);
  }

  return await response.json();
};

// ===== GET ALL =====
export const getTeachers = async (): Promise<Teacher[]> => {
  const response = await fetch(API_URL, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }
  return await response.json();
};

// ===== DELETE =====
export const deleteTeacher = async (id: number): Promise<void> => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }
};