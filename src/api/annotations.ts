import { apiUrl, getAuthHeaders } from "./client";

export type AnnotationType = "POSITIVA" | "NEGATIVA";

export interface Annotation {
  id: number;
  studentId: number;
  teacherId: number;
  annotationDate: string;
  type: AnnotationType;
  description?: string;
  studentName?: string;
  teacherName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateAnnotationDto = Omit<
  Annotation,
  "id" | "createdAt" | "updatedAt" | "studentName" | "teacherName"
>;

const API_URL = apiUrl("/annotations");

export const getAnnotations = async (): Promise<Annotation[]> => {
  const response = await fetch(API_URL, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error(`Error ${response.status}`);
  return response.json();
};

export const createAnnotation = async (data: CreateAnnotationDto): Promise<Annotation> => {
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

export const updateAnnotation = async (
  id: number,
  data: CreateAnnotationDto,
): Promise<Annotation> => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `Error ${response.status}`);
  }
  return response.json();
};

export const getAnnotationsByStudent = async (studentId: number): Promise<Annotation[]> => {
  const response = await fetch(`${API_URL}/student/${studentId}`, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error(`Error ${response.status}`);
  return response.json();
};

export const deleteAnnotation = async (id: number): Promise<void> => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error(`Error ${response.status}`);
};
