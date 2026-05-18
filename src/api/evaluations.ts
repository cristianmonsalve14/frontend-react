const API_URL = "http://localhost:8082/evaluations";

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
  grade?: number;
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
  grade?: number;
};

// ===== AUTH HEADERS =====
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");

  if (!token) {
    console.error("❌ No hay token en localStorage");
  }

  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  };
};

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
