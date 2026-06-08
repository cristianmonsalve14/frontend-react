import { apiUrl } from "./client";

export const login = async (username: string, password: string) => {
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

    const data = await response.json();

    localStorage.setItem("token", data.accessToken);

    return data;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(
        "No se puede conectar al API Gateway. Verifica que apiGetaway esté corriendo en http://localhost:8090",
        { cause: error }
      );
    }
    throw error;
  }
};
