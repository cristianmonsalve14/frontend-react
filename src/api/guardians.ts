import { apiUrl, getAuthHeaders } from "./client";
import type { Student } from "./students";

export interface Guardian {
  id: number;
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
  isPrimary?: boolean;
  userId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateGuardianDto = Omit<Guardian, "id" | "createdAt" | "updatedAt">;

const API_URL = apiUrl("/guardians");

export const getGuardians = async (): Promise<Guardian[]> => {
  const response = await fetch(API_URL, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }
  return response.json();
};

export const createGuardian = async (data: CreateGuardianDto): Promise<Guardian> => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Error ${response.status}`);
  }
  return response.json();
};

export const updateGuardian = async (id: number, data: CreateGuardianDto): Promise<Guardian> => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Error ${response.status}`);
  }
  return response.json();
};

export const deleteGuardian = async (id: number): Promise<void> => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }
};

export const getCurrentGuardian = async (): Promise<Guardian | null> => {
  const response = await fetch(`${API_URL}/me`, {
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

export const getGuardianStudents = async (): Promise<Student[]> => {
  const response = await fetch(`${API_URL}/me/students`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Error ${response.status}`);
  }
  return response.json();
};
