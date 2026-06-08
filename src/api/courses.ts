

import { apiUrl, getAuthHeaders } from "./client";

export interface Course {
  id: number;
  name: string; // Nombre del curso
  grade: string;
  academicYear: string; // yyyy-MM-dd
  shift?: string;
  headTeacherId?: number;
  maxCapacity?: number;
  classroom?: string;
  level?: string;
  courseStatus: string;
  createdAt?: string;
  updatedAt?: string;
}



export interface CreateCourseDto {
  name: string; // Nombre del curso
  grade: string;
  academicYear: string; // yyyy-MM-dd
  shift?: string;
  headTeacherId?: number;
  maxCapacity?: number;
  classroom?: string;
  level?: string;
  courseStatus?: string;
}

const API_URL = apiUrl("/courses");

export const getCourses = async (): Promise<Course[]> => {
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

export const createCourse = async (courseData: CreateCourseDto): Promise<Course> => {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(courseData),
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
      throw new Error("No se puede conectar al servidor académico", { cause: error });
    }
    throw error;
  }
};

export const updateCourse = async (id: number, courseData: CreateCourseDto): Promise<Course> => {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(courseData),
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
      throw new Error("No se puede conectar al servidor académico", { cause: error });
    }
    throw error;
  }
};

export const deleteCourse = async (id: number): Promise<void> => {
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
      throw new Error("No se puede conectar al servidor académico", { cause: error });
    }
    throw error;
  }
};
