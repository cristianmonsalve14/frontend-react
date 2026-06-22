import { useState, useEffect } from "react";
import { login } from "./api/auth";
import { applyLoginSession, useAuth } from "./auth/AuthContext";

function Login() {
  const auth = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    auth.clearSession();
  }, [auth.clearSession]);

  const handleLogin = async () => {
    if (!username || !password) {
      setError("Por favor ingresa usuario y contraseña");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await login(username, password);
      applyLoginSession(data, auth.setSession);
    } catch (error) {
      console.error("Error en login:", error);
      const errorMessage = error instanceof Error ? error.message : "Error al iniciar sesión";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md border border-gray-100">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-700 mb-2">Bienvenido</h2>
          <p className="text-gray-500">Libro Digital - Ingresa a tu cuenta</p>
        </div>

        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
              ❌ {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Usuario
            </label>
            <input
              type="text"
              placeholder="Ingresa tu usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-transparent outline-none transition bg-gray-50 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Contraseña
            </label>
            <input
              type="password"
              placeholder="Ingresa tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-transparent outline-none transition bg-gray-50 disabled:opacity-50"
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-400 to-indigo-400 text-white font-semibold py-3 rounded-lg hover:from-blue-500 hover:to-indigo-500 transition transform hover:scale-[1.02] active:scale-[0.98] shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? "Iniciando sesión..." : "Ingresar"}
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500 space-y-1">
          <p>Sistema de Gestión Académica</p>
          <p className="text-xs text-gray-400">
            Demo: admin_colegio / prof_castillo — contraseña test1234
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
