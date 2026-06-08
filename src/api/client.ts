// En desarrollo: URL vacía → rutas relativas → proxy de Vite → gateway :8090
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? "";

export function apiUrl(path: string): string {
  const base = API_BASE_URL.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

export function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("No hay token de autenticación");
  }
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export function getJsonAuthHeaders(): Record<string, string> {
  return getAuthHeaders() as Record<string, string>;
}
