import { useEvents } from "../../hooks/useEvents";
import { DraggableSidebarItem } from "./DraggableSidebarItem";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export default function DraggableItemPanel() {
  const { eventTypes } = useEvents();
  const shiftTypes = eventTypes.filter((et) => et.category === "shift");
  const permissionTypes = eventTypes.filter(
    (et) => et.category === "permission"
  );
  // Podrías añadir otros tipos si los necesitas arrastrar (meeting, training)

  const getEventDetails = (eventType: (typeof eventTypes)[0]) => {
    // Puedes añadir lógica para duraciones default aquí si quieres
    let defaultDurationHours = 8; // Default shift duration
    if (eventType.category === "permission") {
      defaultDurationHours = 24; // Permissions often default to full day
    }
    // Puedes personalizar duraciones específicas por ID si es necesario
    // if (eventType.id === 'shift-s2') defaultDurationHours = 6;

    return {
      name: eventType.name,
      color: eventType.color,
      category: eventType.category,
      defaultDurationHours: defaultDurationHours,
    };
  };

  return (
    <div className="w-64 border-l border-border p-4 flex flex-col gap-4 overflow-y-auto">
      <Card>
        <CardHeader className="p-3 pb-1">
          <CardTitle className="text-base">Arrastrar Turnos</CardTitle>
        </CardHeader>
        <CardContent className="p-3 space-y-2">
          {shiftTypes.map((shift) => (
            <DraggableSidebarItem
              key={shift.id}
              id={`sidebar-${shift.id}`}
              itemType={shift.id}
              data={getEventDetails(shift)}
            >
              {/* Visualización del item arrastrable */}
              <div
                className="p-2 border rounded cursor-grab flex items-center gap-2"
                style={{ borderColor: shift.color }}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: shift.color }}
                ></div>
                <span className="text-sm">{shift.name}</span>
              </div>
            </DraggableSidebarItem>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-3 pb-1">
          <CardTitle className="text-base">Arrastrar Permisos</CardTitle>
        </CardHeader>
        <CardContent className="p-3 space-y-2">
          {permissionTypes.map((permission) => (
            <DraggableSidebarItem
              key={permission.id}
              id={`sidebar-${permission.id}`}
              itemType={permission.id}
              data={getEventDetails(permission)}
            >
              <div
                className="p-2 border rounded cursor-grab flex items-center gap-2"
                style={{ borderColor: permission.color }}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: permission.color }}
                ></div>
                <span className="text-sm">{permission.name}</span>
              </div>
            </DraggableSidebarItem>
          ))}
        </CardContent>
      </Card>

      {/* Puedes añadir una zona de Papelera aquí si quieres */}
      {/* <div className="mt-auto border-t pt-4">
                 <DroppableDeleteZone id="delete-zone">
                     <div className="p-4 border border-dashed border-destructive text-destructive rounded text-center">
                         Arrastra aquí para eliminar
                     </div>
                 </DroppableDeleteZone>
             </div> */}
    </div>
  );
}
