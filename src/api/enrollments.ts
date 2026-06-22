import { apiUrl, getAuthHeaders } from "./client";

export interface Enrollment {
  id: number;
  studentId: number;
  courseId: number;
  enrollmentNumber?: string;
  academicYear?: number;
  enrollmentDate?: string;
  enrollmentStatus?: string;
  isRegular?: boolean;
  observations?: string;
}

export interface CreateEnrollmentDto {
  studentId: number;
  courseId: number;
  academicYear?: number;
  enrollmentDate?: string;
  enrollmentStatus?: string;
  isRegular?: boolean;
  observations?: string;
}

const API_URL = apiUrl("/enrollments");

export const getEnrollments = async (): Promise<Enrollment[]> => {
  try {
    const response = await fetch(API_URL, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || `Error ${response.status}: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error("No se puede conectar al API Gateway. Verifica que apiGetaway esté corriendo en http://localhost:8090");
    }
    throw error;
  }
};

export const createEnrollment = async (enrollmentData: CreateEnrollmentDto): Promise<Enrollment> => {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(enrollmentData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || `Error ${response.status}: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error("No se puede conectar al servidor académico");
    }
    throw error;
  }
};

export const updateEnrollment = async (id: number, enrollmentData: CreateEnrollmentDto): Promise<Enrollment> => {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(enrollmentData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || `Error ${response.status}: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error("No se puede conectar al servidor académico");
    }
    throw error;
  }
};

export const getEnrollmentsByStudent = async (studentId: number): Promise<Enrollment[]> => {
  const response = await fetch(`${API_URL}/student/${studentId}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Error ${response.status}`);
  }
  return response.json();
};

export const deleteEnrollment = async (id: number): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || `Error ${response.status}: ${response.statusText}`;
      throw new Error(errorMessage);
    }
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error("No se puede conectar al servidor académico");
    }
    throw error;
  }
};
