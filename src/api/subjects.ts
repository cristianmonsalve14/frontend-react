
export interface Subject {
  id: number;
  subjectCode: string;
  subjectName: string;
  description?: string;
  teacherId?: number;
  weeklyHours?: number;
  semesterCredits?: number;
  subjectType?: string;
  area?: string;
  courseId?: number;
  createdAt?: string;
  updatedAt?: string;
}


export interface CreateSubjectDto {
  subjectCode: string;
  subjectName: string;
  description?: string;
  teacherId?: number;
  weeklyHours?: number;
  semesterCredits?: number;
  subjectType?: string;
  area?: string;
  courseId?: number;
}

const API_URL = "http://localhost:8082/subjects";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("No hay token de autenticación");
  }
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  };
};

export const getSubjects = async (): Promise<Subject[]> => {
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
      throw new Error("No se puede conectar al servidor académico. Verifica que el academicService esté corriendo en http://localhost:8082");
    }
    throw error;
  }
};

export const createSubject = async (subjectData: CreateSubjectDto): Promise<Subject> => {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(subjectData),
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
      throw new Error("No se puede conectar al servidor académico");
    }
    throw error;
  }
};

export const updateSubject = async (id: number, subjectData: CreateSubjectDto): Promise<Subject> => {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(subjectData),
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
      throw new Error("No se puede conectar al servidor académico");
    }
    throw error;
  }
};

export const deleteSubject = async (id: number): Promise<void> => {
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
      throw new Error("No se puede conectar al servidor académico");
    }
    throw error;
  }
};
