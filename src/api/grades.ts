import { apiUrl, getAuthHeaders } from "./client";

export interface Grade {
  id: number;
  studentId: number;
  evaluationId: number;
  subjectId: number;
  score: number;
  gradeDate: string;
  gradeStatus: string;
  teacherComments?: string;
  isAbsent?: boolean;
  gradedByTeacherId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateGradeDto = Omit<Grade, "id" | "createdAt" | "updatedAt">;

const API_URL = apiUrl("/grades");

export const getGrades = async (): Promise<Grade[]> => {
  const response = await fetch(API_URL, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }
  return response.json();
};

export const getGradesByEvaluation = async (evaluationId: number): Promise<Grade[]> => {
  const response = await fetch(`${API_URL}/evaluation/${evaluationId}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }
  return response.json();
};

export const createGrade = async (data: CreateGradeDto): Promise<Grade> => {
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

export const updateGrade = async (id: number, data: CreateGradeDto): Promise<Grade> => {
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

export const deleteGrade = async (id: number): Promise<void> => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }
};
