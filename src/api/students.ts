
import { apiUrl, getAuthHeaders } from "./client";

export interface Student {
  id: number;
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
  guardianId?: number;
  userId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateStudentDto = Omit<Student, "id" | "createdAt" | "updatedAt">;

const API_URL = apiUrl("/students");

export const getStudents = async (): Promise<Student[]> => {
  const response = await fetch(API_URL, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Error ${response.status}`);
  }
  return response.json();
};

export const getCurrentStudent = async (): Promise<Student | null> => {
  const response = await fetch(`${API_URL}/me`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Error ${response.status}`);
  }
  return response.json();
};

export const createStudent = async (studentData: CreateStudentDto): Promise<Student> => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(studentData),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Error ${response.status}`);
  }
  return response.json();
};

export const updateStudent = async (id: number, studentData: CreateStudentDto): Promise<Student> => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(studentData),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Error ${response.status}`);
  }
  return response.json();
};

export const deleteStudent = async (id: number): Promise<void> => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Error ${response.status}`);
  }
};
