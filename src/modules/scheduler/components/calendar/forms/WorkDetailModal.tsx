import { Button } from "../../ui/button";
import { Modal } from "./Modal"; // Reutiliza tu componente Modal genérico
import { Calendar, Clock, User, Tag, Info, Briefcase } from "lucide-react";

interface DetailData {
  id: string;
  type: "schedule" | "worked" | "overtime" | "regular" | string; // Tipo de barra
  employeeName: string;
  employeeDept?: string; // Departamento opcional
  date: string; // Fecha formateada (ej: 'lun 15/07/2024')
  startTime: string; // Hora inicio formateada (ej: '09:00')
  endTime: string; // Hora fin formateada (ej: '18:00')
  duration?: string; // Duración opcional (ej: '8h 0m')
  label?: string; // Etiqueta del horario (ej: 'Turno Mañana')
  status?: string; // Estado mock (ej: 'Validado', 'Pendiente')
  details?: string; // Detalles adicionales mock
}

interface WorkDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  detailData: DetailData | null;
}

// Datos mock para cuando no se pasan detalles específicos
const mockDetail: DetailData = {
  id: "mock-123",
  type: "schedule",
  employeeName: "Empleado Ejemplo",
  employeeDept: "Departamento Mock",
  date: "lun 01/01/2024",
  startTime: "08:00",
  endTime: "17:00",
  duration: "8h 0m",
  label: "Horario Estándar Mock",
  status: "Validado",
  details: "Este es un detalle de ejemplo generado automáticamente.",
};

export function WorkDetailModal({
  isOpen,
  onClose,
  detailData,
}: WorkDetailModalProps) {
  const data = detailData || mockDetail; // Usa datos pasados o mock

  const typeLabels = {
    schedule: "Horario Planificado",
    worked: "Tiempo Trabajado",
    regular: "Tiempo Trabajado (Regular)",
    overtime: "Tiempo Trabajado (Horas Extra)",
    default: "Detalle del Evento",
  };

  const typeColors = {
    schedule: "border-blue-500 bg-blue-50 text-blue-700",
    worked: "border-green-500 bg-green-50 text-green-700",
    regular: "border-green-500 bg-green-50 text-green-700",
    overtime: "border-yellow-500 bg-yellow-50 text-yellow-700",
    default: "border-gray-500 bg-gray-50 text-gray-700",
  };

  const getTypeValue = (type: string): keyof typeof typeLabels => {
    return (type as keyof typeof typeLabels) in typeLabels
      ? (type as keyof typeof typeLabels)
      : "default";
  };

  const currentTypeKey = getTypeValue(data.type);
  const title = typeLabels[currentTypeKey];
  const badgeClasses = `inline-block px-2 py-0.5 rounded text-xs font-medium border ${typeColors[currentTypeKey]}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <div className="p-6 space-y-4">
        {/* Tipo de Evento */}
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <span className={badgeClasses}>
            {data.label ||
              data.type.charAt(0).toUpperCase() + data.type.slice(1)}
          </span>
        </div>

        <hr className="border-gray-200" />

        {/* Información del Empleado */}
        <div className="space-y-2">
          <div className="flex items-center text-gray-600">
            <User className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>{data.employeeName}</span>
          </div>
          {data.employeeDept && (
            <div className="flex items-center text-gray-600">
              <Briefcase className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>{data.employeeDept}</span>
            </div>
          )}
        </div>

        {/* Fecha y Hora */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center text-gray-600 bg-gray-50 p-2 rounded">
            <Calendar className="w-4 h-4 mr-2 flex-shrink-0 text-blue-500" />
            <span>{data.date}</span>
          </div>
          <div className="flex items-center text-gray-600 bg-gray-50 p-2 rounded">
            <Clock className="w-4 h-4 mr-2 flex-shrink-0 text-green-500" />
            <span>
              {data.startTime} - {data.endTime}{" "}
              {data.duration ? `(${data.duration})` : ""}
            </span>
          </div>
        </div>

        {/* Estado y Detalles Mock */}
        {data.status && (
          <div className="flex items-center text-gray-600">
            <Tag className="w-4 h-4 mr-2 flex-shrink-0 text-purple-500" />
            <span>
              Estado: <span className="font-medium">{data.status}</span>
            </span>
          </div>
        )}
        {data.details && (
          <div className="flex items-start text-gray-600">
            <Info className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-orange-500" />
            <p className="text-sm">{data.details}</p>
          </div>
        )}

        {/* Botón Cerrar */}
        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
