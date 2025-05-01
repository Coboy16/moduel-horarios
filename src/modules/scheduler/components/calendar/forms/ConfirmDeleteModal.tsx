import { Modal } from "./Modal"; // Reutiliza tu Modal genérico
import { AlertTriangle, X } from "lucide-react";
import { Button } from "../../ui/button";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void; // Para cancelar o cerrar con 'X'
  onConfirm: () => void; // Para confirmar la eliminación
  title: string; // Título dinámico (ej: "Eliminar Horario")
  itemName: string; // Descripción del item (ej: "el horario 'Turno Mañana' del 15/07")
}

export function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirmar Eliminación", // Título por defecto
  itemName = "este elemento", // Item por defecto
}: ConfirmDeleteModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="md">
      {/* Quitamos el título del Modal genérico para poner el nuestro */}
      <div className="p-0">
        {" "}
        {/* Reset padding si Modal añade padding */}
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            {" "}
            {/* Alineación cambiada */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 ml-4 -mt-1" // Ajuste de margen
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-6 ml-13">
            {" "}
            {/* Añadido margen izquierdo para alinear con título */}
            ¿Está seguro que desea eliminar {itemName}? Esta acción no se puede
            deshacer.
          </p>

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              variant="destructive" // Usar variante destructiva si tu UI la tiene
              className="bg-red-600 hover:bg-red-700 text-white" // Clases por defecto si no hay variante
              onClick={onConfirm}
            >
              Eliminar
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
