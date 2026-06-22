import { apiUrl, getAuthHeaders } from "./client";

export interface ClassSession {
  id: number;
  courseId: number;
  subjectId: number;
  teacherId: number;
  sessionDate: string;
  topic?: string;
  sessionStatus?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateSessionDto = Omit<ClassSession, "id" | "createdAt" | "updatedAt" | "sessionStatus">;

const API_URL = apiUrl("/sessions");

export const getSessions = async (): Promise<ClassSession[]> => {
  const response = await fetch(API_URL, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error(`Error ${response.status}`);
  return response.json();
};

export const createSession = async (data: CreateSessionDto): Promise<ClassSession> => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `Error ${response.status}`);
  }
  return response.json();
};

export const deleteSession = async (id: number): Promise<void> => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error(`Error ${response.status}`);
};
