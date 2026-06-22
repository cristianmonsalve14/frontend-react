import { apiUrl, getAuthHeaders } from "./client";

export type PortalRole = "DOCENTE" | "APODERADO" | "ESTUDIANTE";

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  enabled: boolean;
  roles: string[];
}

export interface CreateAdminUserDto {
  username: string;
  email: string;
  password: string;
  role: PortalRole;
}

const API_URL = apiUrl("/admin/users");

export const createAdminUser = async (data: CreateAdminUserDto): Promise<AdminUser> => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `Error ${response.status} al crear la cuenta de acceso`);
  }
  return response.json();
};

export const getAdminUser = async (id: number): Promise<AdminUser> => {
  const response = await fetch(`${API_URL}/${id}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Error ${response.status} al consultar la cuenta`);
  }
  return response.json();
};
