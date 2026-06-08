import { apiUrl, getJsonAuthHeaders } from "./client";

const API_URL = apiUrl("/evaluations");

// ===== TYPES =====
export interface Evaluation {
  id: number;
  subjectId?: number;
  courseId?: number;
  name: string;
  date?: string;
  evaluationType?: string;
  evaluationStatus?: string;
  maxScore?: number;
  weight?: number;
  description?: string;
}

export type CreateEvaluationDto = {
  subjectId?: number;
  courseId?: number;
  name: string;
  date?: string;
  evaluationType?: string;
  evaluationStatus?: string;
  maxScore?: number;
  weight?: number;
  description?: string;
};

// ===== AUTH HEADERS =====
const getAuthHeaders = () => getJsonAuthHeaders();

// ===== GET ALL =====
export const getEvaluations = async (): Promise<Evaluation[]> => {
  const response = await fetch(API_URL, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }

  return await response.json();
};

// ===== CREATE =====
export const createEvaluation = async (data: CreateEvaluationDto): Promise<Evaluation> => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }

  return await response.json();
};

// ===== UPDATE =====
export const updateEvaluation = async (id: number, data: CreateEvaluationDto): Promise<Evaluation> => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }

  return await response.json();
};

// ===== DELETE =====
export const deleteEvaluation = async (id: number): Promise<void> => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }
};
