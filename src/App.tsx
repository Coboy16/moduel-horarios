// src/App.tsx

import {
  BrowserRouter as Router, // Usamos el alias 'Router' como en tu código original
  Routes,
  Route,
  Navigate, // Importa Navigate para la redirección
} from "react-router-dom";
import { Toaster } from "react-hot-toast"; // Mantenemos Toaster

// Importa los componentes desde las rutas especificadas en tu código
import { Sidebar } from "./components/layout/Sidebar";
import SchedulerScreen from "./modules/scheduler/SchedulerScreen";
import DashboardScreen from "./modules/dashboard/DashboardScreen";

// Importa los estilos globales (si no lo hace main.tsx)
import "./index.css";

function App() {
  // Ya no necesitamos AppContent ni los hooks de estado/efecto para auth/transiciones

  return (
    // 1. Router envuelve toda la aplicación
    <Router>
      {/* Componente para mostrar notificaciones */}
      <Toaster position="top-right" />

      {/* 2. Contenedor principal con Flexbox */}
      {/* Usamos las clases base de tu AppContent y aseguramos h-screen */}
      <div className="flex h-screen bg-gray-50">
        {" "}
        {/* min-h-screen cambiado a h-screen para asegurar altura completa */}
        {/* 3. Renderizamos el Sidebar */}
        {/* Quitamos las props que ya no son necesarias (currentView, setCurrentView, onLogout) */}
        <Sidebar
          currentView={""}
          setCurrentView={function (): void {
            throw new Error("Function not implemented.");
          }}
          onLogout={function (): void {
            throw new Error("Function not implemented.");
          }}
        />
        {/* 4. Área de contenido principal */}
        {/* Añadimos flex-1, ml-64 (asumiendo sidebar w-64), p-8 y overflow-y-auto */}
        <main className="flex-1 ml-64 p-8 overflow-y-auto">
          {/* 5. Definición de Rutas */}
          <Routes>
            {/* Ruta para el Dashboard */}
            <Route path="/dashboard" element={<DashboardScreen />} />

            {/* Ruta para el Scheduler (usando la ruta de tu código) */}
            <Route path="/employees/schedule" element={<SchedulerScreen />} />

            {/* Redirección: Si alguien va a la raíz '/', lo mandamos a '/dashboard' */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Opcional: Ruta para páginas no encontradas (404) */}
            <Route
              path="*"
              element={
                <div>
                  <h1 className="text-2xl font-bold">
                    404 - Página no encontrada
                  </h1>
                  <p>La ruta que buscas no existe.</p>
                </div>
              }
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
