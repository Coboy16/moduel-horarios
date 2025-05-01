import { format } from "date-fns";
import { Clock, ArrowRight, Info, Edit, Trash2 } from "lucide-react";
import { Button } from "../../ui/button";
import { Marking } from "../../../interfaces/Marking";

interface EmployeeMarkingsTableProps {
  markings: Marking[];
  employeeName: string;
  onClose: () => void;
}

const getMarkingEventIcon = (type: string) => {
  if (type.toLowerCase().includes("entrada"))
    return <ArrowRight className="h-4 w-4 text-green-600" />;
  if (type.toLowerCase().includes("salida"))
    return <ArrowRight className="h-4 w-4 text-red-600 rotate-180" />;
  if (type.toLowerCase().includes("pausa"))
    return <Clock className="h-4 w-4 text-yellow-600" />;
  return <Clock className="h-4 w-4 text-gray-500" />;
};

// Definir altura de la fila para calcular el tamaño máximo del contenedor
const ROW_HEIGHT = 48; // altura aproximada de cada fila en píxeles
const MAX_VISIBLE_ROWS = 10; // número máximo de filas visibles antes del scroll

export function EmployeeMarkingsTable({
  markings,
  onClose,
}: EmployeeMarkingsTableProps) {
  const handleActionClick = (action: string, markingId: string | number) => {
    console.log(`Acción: ${action} en marcaje ID: ${markingId}`);
  };

  return (
    <div className="w-full flex flex-col">
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
                  <td className="px-4 py-2">
                    {mark.time != null
                      ? format(
                          new Date(0).setHours(
                            Math.floor(Number(mark.time)),
                            (Number(mark.time) % 1) * 60 * 60
                          ),
                          "HH:mm:ss"
                        )
                      : "N/A"}
                  </td>
                  <td className="px-4 py-2">{mark.site || "N/A"}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center space-x-1">
                      {getMarkingEventIcon(mark.type)}
                      <span>{mark.type}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => handleActionClick("details", mark.id)}
                      className="p-1 text-gray-500 hover:text-blue-600 mr-1"
                      title="Ver detalles"
                    >
                      <Info size={16} />
                    </button>
                    <button
                      onClick={() => handleActionClick("edit", mark.id)}
                      className="p-1 text-gray-500 hover:text-green-600 mr-1"
                      title="Editar"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleActionClick("delete", mark.id)}
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
    </div>
  );
}
