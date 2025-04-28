// src/components/layout/Sidebar.tsx (Versión Simplificada con <Link>)

import { Link, useLocation } from "react-router-dom";
import { RxDashboard } from "react-icons/rx";
import { SlCalender } from "react-icons/sl";

function Sidebar(): JSX.Element {
  const location = useLocation();

  const isActive = (path: string): boolean => {
    return location.pathname.startsWith(path);
  };

  return (
    <div className="w-64 h-screen bg-gray-800 text-white flex flex-col fixed top-0 left-0">
      {" "}
      {/* Ajusta colores/estilos si es necesario */}
      <div className="p-5 text-2xl font-semibold border-b border-gray-700">
        Mi Proyecto
      </div>
      <nav className="mt-5 flex-1">
        <ul>
          <li className="mb-2 px-4">
            <Link
              to="/dashboard" // Ruta del Dashboard
              className={`flex items-center py-2 px-2 text-gray-300 hover:bg-gray-700 hover:text-white rounded-md transition duration-150 ease-in-out ${
                isActive("/dashboard")
                  ? "bg-gray-900 text-white font-semibold"
                  : ""
              }`}
            >
              <RxDashboard className="mr-3 flex-shrink-0" />
              <span className="flex-grow">Dashboard</span>
            </Link>
          </li>
          <li className="mb-2 px-4">
            <Link
              to="/employees/schedule" // Ruta del Scheduler
              className={`flex items-center py-2 px-2 text-gray-300 hover:bg-gray-700 hover:text-white rounded-md transition duration-150 ease-in-out ${
                isActive("/employees/schedule")
                  ? "bg-gray-900 text-white font-semibold"
                  : ""
              }`}
            >
              <SlCalender className="mr-3 flex-shrink-0" />
              <span className="flex-grow">Scheduler</span>
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}

// Asegúrate que la exportación coincida con cómo lo importas en App.tsx
export { Sidebar }; // o export default Sidebar;
