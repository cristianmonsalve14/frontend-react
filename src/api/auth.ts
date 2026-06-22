import { apiUrl, getAuthHeaders } from "./client";

export interface UserProfile {
  userId?: number;
  username?: string;
  email?: string;
  roles: string[];
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  userId?: number;
  username?: string;
  email?: string;
  roles?: string[] | Set<string>;
}

export const login = async (username: string, password: string): Promise<AuthResponse> => {
  try {
    const response = await fetch(apiUrl("/auth/login"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Credenciales incorrectas");
    }

    const data: AuthResponse = await response.json();
    localStorage.setItem("token", data.accessToken);
    return data;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(
        "No se puede conectar al API Gateway. Verifica que apiGetaway esté corriendo en http://localhost:8090",
        { cause: error },
      );
    }
    throw error;
  }
};

export const fetchProfile = async (): Promise<UserProfile> => {
  const response = await fetch(apiUrl("/auth/me"), {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("No se pudo obtener el perfil del usuario");
  }

  const data = await response.json();
  return {
    userId: data.userId,
    username: data.username,
    email: data.email,
    roles: Array.isArray(data.roles) ? data.roles : data.roles ? Array.from(data.roles) : [],
  };
};
