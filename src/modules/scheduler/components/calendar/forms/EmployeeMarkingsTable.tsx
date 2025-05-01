"use client";
import { useState } from "react";
import {
  Clock,
  ArrowRight,
  Info,
  Edit,
  Trash2,
  CheckCircle,
} from "lucide-react";
import { Button } from "../../ui/button";
import { AddMarkingForm } from "../forms/AddMarkingForm";
import { MarkingDetailsModal } from "./MarkingDetailsModal";
import { DeleteMarkingModal } from "./DeleteMarkingModal";
import { mockMarkings } from "../../../tem/mockData";
import { Marking } from "../../../interfaces/Marking";
import { Modal } from "./Modal";

interface EmployeeMarkingsTableProps {
  markings: Marking[];
  employeeName: string;
  onClose: () => void;
}

// Altura aproximada de cada fila para calcular scroll
const ROW_HEIGHT = 48;
const MAX_VISIBLE_ROWS = 10;

export function EmployeeMarkingsTable({
  markings: initialMarkings = mockMarkings,
  onClose,
}: EmployeeMarkingsTableProps) {
  // Estado para los marcajes (para poder modificarlos localmente)
  const [markings, setMarkings] = useState<Marking[]>(initialMarkings);

  // Estados para controlar modales
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedMarking, setSelectedMarking] = useState<Marking | null>(null);

  // Estado para mensajes de éxito/error
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  // Funciones para manejar acciones en los marcajes
  const handleAction = (action: string, markingId: string | number) => {
    // Encontrar el marcaje seleccionado
    const marking = markings.find((m) => m.id === markingId);
    if (!marking) return;

    setSelectedMarking(marking);

    // Ejecutar acción correspondiente
    switch (action) {
      case "details":
        setIsDetailsModalOpen(true);
        break;
      case "edit":
        setIsEditModalOpen(true);
        break;
      case "delete":
        setIsDeleteModalOpen(true);
        break;
      default:
        console.log("Acción no reconocida:", action);
    }
  };

  // Manejar eliminación de marcaje
  const handleDeleteMarking = (markingId: string | number) => {
    setMarkings((prev) => prev.filter((marking) => marking.id !== markingId));
    setIsDeleteModalOpen(false);
    showSuccessMessage("Marcaje eliminado correctamente");
  };

  // Manejar cierre de modales
  const closeAllModals = () => {
    setIsDetailsModalOpen(false);
    setIsEditModalOpen(false);
    setIsDeleteModalOpen(false);
    setSelectedMarking(null);
  };

  // Mostrar mensaje de éxito temporalmente
  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
  };

  // Obtener información resumida del marcaje para el modal de eliminación
  const getMarkingInfo = (marking: Marking | null) => {
    if (!marking) return "";
    return `${marking.dateStr} (${formatTime(marking.time).substring(0, 5)})`;
  };

  // Genera el icono correcto según el tipo de marcaje
  const getMarkingEventIcon = (type: string) => {
    if (type.toLowerCase().includes("entrada"))
      return <ArrowRight className="h-4 w-4 text-green-600" />;
    if (type.toLowerCase().includes("salida"))
      return <ArrowRight className="h-4 w-4 text-red-600 rotate-180" />;
    if (type.toLowerCase().includes("pausa"))
      return <Clock className="h-4 w-4 text-yellow-600" />;
    return <Clock className="h-4 w-4 text-gray-500" />;
  };

  return (
    <div className="w-full flex flex-col">
      {/* Mensaje de éxito */}
      {successMessage && (
        <div className="mb-3 flex items-center bg-green-100 p-3 rounded-md text-green-700">
          <CheckCircle className="h-4 w-4 mr-2" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Tabla con altura fija y scroll vertical después de 10 filas */}
      <div
        className="overflow-y-auto w-full"
        style={{
          maxHeight: `${ROW_HEIGHT * MAX_VISIBLE_ROWS}px`,
        }}
      >
        <table className="w-full text-sm text-left text-gray-600">
          <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0 z-10">
            <tr>
              <th scope="col" className="px-4 py-3 whitespace-nowrap">
                DÍA
              </th>
              <th scope="col" className="px-4 py-3 whitespace-nowrap">
                HORA
              </th>
              <th scope="col" className="px-4 py-3">
                SEDE
              </th>
              <th scope="col" className="px-4 py-3 whitespace-nowrap">
                TIPO/EVENTO
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-center whitespace-nowrap"
              >
                ACCIONES
              </th>
            </tr>
          </thead>
          <tbody>
            {markings.length > 0 ? (
              markings.map((mark, index) => (
                <tr
                  key={mark.id || index}
                  className="border-b hover:bg-gray-50"
                >
                  <td className="px-4 py-2">{mark.dateStr || "N/A"}</td>
                  <td className="px-4 py-2">{formatTime(mark.time)}</td>
                  <td className="px-4 py-2">{mark.site!}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center space-x-1">
                      {getMarkingEventIcon(mark.type)}
                      <span>{mark.type}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => handleAction("details", mark.id)}
                      className="p-1 text-gray-500 hover:text-blue-600 mr-1"
                      title="Ver detalles"
                    >
                      <Info size={16} />
                    </button>
                    <button
                      onClick={() => handleAction("edit", mark.id)}
                      className="p-1 text-gray-500 hover:text-green-600 mr-1"
                      title="Editar"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleAction("delete", mark.id)}
                      className="p-1 text-gray-500 hover:text-red-600"
                      title="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-center py-10 text-gray-500">
                  No hay marcajes para mostrar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer con el botón */}
      <div className="flex justify-end p-4 mt-2 border-t bg-gray-50">
        <Button variant="outline" onClick={onClose}>
          Cerrar
        </Button>
      </div>

      {/* Modal de detalles del marcaje */}
      {isDetailsModalOpen && selectedMarking && (
        <MarkingDetailsModal
          marking={selectedMarking}
          onClose={closeAllModals}
        />
      )}

      {/* Modal de edición del marcaje */}
      {isEditModalOpen && selectedMarking && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={closeAllModals}
          title="Editar Marcaje"
          size="md"
        >
          <AddMarkingForm
            markingToEdit={selectedMarking}
            isEditing={true}
            onClose={closeAllModals}
            onSubmitSuccess={(message) => {
              closeAllModals();
              showSuccessMessage(message);
            }}
          />
        </Modal>
      )}

      {/* Modal de confirmación para eliminar */}
      {isDeleteModalOpen && selectedMarking && (
        <DeleteMarkingModal
          markingId={selectedMarking.id}
          markingInfo={getMarkingInfo(selectedMarking)}
          onDelete={handleDeleteMarking}
          onCancel={closeAllModals}
        />
      )}
    </div>
  );
}
