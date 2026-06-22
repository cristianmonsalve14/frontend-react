import { apiUrl, getAuthHeaders } from "./client";

export type AttendanceStatus = "PRESENTE" | "AUSENTE" | "ATRASADO" | "JUSTIFICADO";

export interface AttendanceRecord {
  id: number;
  sessionId: number;
  studentId: number;
  status: AttendanceStatus;
  observations?: string;
  studentName?: string;
  sessionDate?: string;
  subjectName?: string;
  topic?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateAttendanceDto = Omit<AttendanceRecord, "id" | "createdAt" | "updatedAt" | "studentName">;

const API_URL = apiUrl("/attendances");

export const getAttendancesBySession = async (sessionId: number): Promise<AttendanceRecord[]> => {
  const response = await fetch(`${API_URL}/session/${sessionId}`, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error(`Error ${response.status}`);
  return response.json();
};

export const createAttendance = async (data: CreateAttendanceDto): Promise<AttendanceRecord> => {
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

export const getAttendancesByStudent = async (studentId: number): Promise<AttendanceRecord[]> => {
  const response = await fetch(`${API_URL}/student/${studentId}`, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error(`Error ${response.status}`);
  return response.json();
};

export const updateAttendance = async (id: number, data: CreateAttendanceDto): Promise<AttendanceRecord> => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error(`Error ${response.status}`);
  return response.json();
};
