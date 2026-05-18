import { useState } from "react";
import Login from "./Login";
import Courses from "./Courses";
import Students from "./Students";
import Subjects from "./Subjects";
import Enrollments from "./Enrollments";
import Evaluations from "./Evaluations";
import Teachers from "./Teachers";

type View = "dashboard" | "courses" | "students" | "subjects" | "enrollments" | "evaluations" | "teachers";

function App() {
  // Siempre inicia en false para mostrar el login
  const [isLogged, setIsLogged] = useState(false);
  const [currentView, setCurrentView] = useState<View>("dashboard");

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLogged(false);
    setCurrentView("dashboard");
  };

  const renderView = () => {
    switch (currentView) {
      case "courses":
        return <Courses onBack={() => setCurrentView("dashboard")} />;
      case "students":
        return <Students onBack={() => setCurrentView("dashboard")} />;
      case "subjects":
        return <Subjects onBack={() => setCurrentView("dashboard")} />;
      case "enrollments":
        return <Enrollments onBack={() => setCurrentView("dashboard")} />;
      case "evaluations":
        return <Evaluations onBack={() => setCurrentView("dashboard")} />;
      default:
        return (
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
            <nav className="bg-white shadow-sm border-b border-gray-100">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                  <div className="flex items-center">
                    <h1 className="text-2xl font-bold text-gray-700">📚 Libro Digital</h1>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-400 text-white rounded-lg hover:bg-red-500 transition font-medium shadow-sm"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-gray-700 mb-4">
                  Bienvenido al Sistema de Gestión Académica
                </h2>
                <p className="text-gray-500 text-lg">
                  Selecciona una opción para comenzar
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Cursos */}
                <button
                  onClick={() => setCurrentView("courses")}
                  className="bg-white rounded-xl shadow-md p-8 hover:shadow-xl transition transform hover:scale-105 border-2 border-transparent hover:border-blue-300"
                >
                  <div className="text-6xl mb-4">📖</div>
                  <h3 className="text-2xl font-bold text-gray-700 mb-2">Cursos</h3>
                  <p className="text-gray-500">Gestionar cursos académicos</p>
                </button>

                {/* Estudiantes */}
                <button
                  onClick={() => setCurrentView("students")}
                  className="bg-white rounded-xl shadow-md p-8 hover:shadow-xl transition transform hover:scale-105 border-2 border-transparent hover:border-green-300"
                >
                  <div className="text-6xl mb-4">👨‍🎓</div>
                  <h3 className="text-2xl font-bold text-gray-700 mb-2">Estudiantes</h3>
                  <p className="text-gray-500">Administrar estudiantes</p>
                </button>

                {/* Asignaturas */}
                <button
                  onClick={() => setCurrentView("subjects")}
                  className="bg-white rounded-xl shadow-md p-8 hover:shadow-xl transition transform hover:scale-105 border-2 border-transparent hover:border-purple-300"
                >
                  <div className="text-6xl mb-4">📚</div>
                  <h3 className="text-2xl font-bold text-gray-700 mb-2">Asignaturas</h3>
                  <p className="text-gray-500">Gestionar asignaturas</p>
                </button>

                {/* Matrículas */}
                <button
                  onClick={() => setCurrentView("enrollments")}
                  className="bg-white rounded-xl shadow-md p-8 hover:shadow-xl transition transform hover:scale-105 border-2 border-transparent hover:border-orange-300"
                >
                  <div className="text-6xl mb-4">📋</div>
                  <h3 className="text-2xl font-bold text-gray-700 mb-2">Matrículas</h3>
                  <p className="text-gray-500">Inscribir estudiantes</p>
                </button>

                {/* Evaluaciones */}
                <button
                  onClick={() => setCurrentView("evaluations")}
                  className="bg-white rounded-xl shadow-md p-8 hover:shadow-xl transition transform hover:scale-105 border-2 border-transparent hover:border-cyan-300"
                >
                  <div className="text-6xl mb-4">📝</div>
                  <h3 className="text-2xl font-bold text-gray-700 mb-2">Evaluaciones</h3>
                  <p className="text-gray-500">Crear evaluaciones</p>
                </button>

                {/* Profesores */}
                <button
                  onClick={() => setCurrentView("teachers")}
                  className="bg-white rounded-xl shadow-md p-8 hover:shadow-xl transition transform hover:scale-105 border-2 border-transparent hover:border-pink-300"
                >
                  <div className="text-6xl mb-4">👨‍🏫</div>
                  <h3 className="text-2xl font-bold text-gray-700 mb-2">Profesores</h3>
                  <p className="text-gray-500">Gestionar profesores</p>
                </button>
              </div>
            </main>
          </div>
        );
    }
  };

  if (!isLogged) {
    return <Login onLogin={() => setIsLogged(true)} />;
  }
  if (currentView === "teachers") {
    return <Teachers onBack={() => setCurrentView("dashboard")} />;
  }
  return renderView();
}

export default App;
