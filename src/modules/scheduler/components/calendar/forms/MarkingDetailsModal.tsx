import {
  X,
  Clock,
  MapPin,
  User,
  Calendar,
  Activity,
  Info,
  Bookmark,
} from "lucide-react";
import { Marking } from "../../../interfaces/Marking";

interface MarkingDetailsModalProps {
  marking: Marking;
  onClose: () => void;
}

export function MarkingDetailsModal({
  marking,
  onClose,
}: MarkingDetailsModalProps) {
  // Función para formatear la hora desde un string a formato HH:MM:SS
  const formatTime = (timeStr: string) => {
    try {
      const timeNum = parseFloat(timeStr);
      const hours = Math.floor(timeNum);
      const minutes = Math.floor((timeNum % 1) * 60);
      const seconds = Math.floor((((timeNum % 1) * 60) % 1) * 60);
      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    } catch (e) {
      console.error("Error al formatear la hora:", e);
      return timeStr || "N/A";
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-blue-500 text-white rounded-t-lg">
          <h2 className="text-xl font-semibold">Detalles del Marcaje</h2>
          <button
            onClick={onClose}
            className="text-blue-100 hover:text-white transition-colors rounded-full p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-gray-500">Fecha</p>
                  <p className="text-gray-900">{marking.dateStr}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-gray-500">Hora</p>
                  <p className="text-gray-900">{formatTime(marking.time)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-gray-500">Sede</p>
                  <p className="text-gray-900">
                    {marking.site || "No especificada"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Bookmark className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-gray-500">
                    Tipo de Marcaje
                  </p>
                  <p className="text-gray-900">
                    {marking.markingType || "No especificado"}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Activity className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-gray-500">
                    Tipo/Evento
                  </p>
                  <p
                    className={`font-medium ${
                      marking.type.includes("ENTRADA")
                        ? "text-green-600"
                        : marking.type.includes("SALIDA")
                        ? "text-red-600"
                        : "text-gray-900"
                    }`}
                  >
                    {marking.type}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-gray-500">
                    Ubicación
                  </p>
                  <p className="text-gray-900">
                    {marking.location || "No especificada"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-gray-500">
                    Creado por
                  </p>
                  <p className="text-gray-900">
                    {marking.createdBy || "No especificado"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-gray-500">Estado</p>
                  <p
                    className={`font-medium ${
                      marking.status === "APPROVED"
                        ? "text-green-600"
                        : marking.status === "PENDING"
                        ? "text-yellow-600"
                        : marking.status === "REJECTED"
                        ? "text-red-600"
                        : "text-gray-900"
                    }`}
                  >
                    {marking.status === "APPROVED"
                      ? "Aprobado"
                      : marking.status === "PENDING"
                      ? "Pendiente"
                      : marking.status === "REJECTED"
                      ? "Rechazado"
                      : "No definido"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Detalles - Abarca ambas columnas */}
          <div className="mt-5">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-500">Detalles</p>
                <p className="text-gray-700 mt-1 bg-gray-50 p-3 rounded-md">
                  {marking.details || "Sin detalles adicionales"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end p-5 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

export default MarkingDetailsModal;
