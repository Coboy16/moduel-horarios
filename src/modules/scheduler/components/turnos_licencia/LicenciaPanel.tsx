"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Search } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";

interface LicenciaItem {
  id: string;
  code: string;
  name: string;
  color: string;
  category: string;
  defaultDurationHours: number;
}

// Datos de ejemplo para licencias y permisos
const licenciasData: LicenciaItem[] = [
  {
    id: "l",
    code: "L",
    name: "Licencia médica",
    color: "#ec4899",
    category: "permission",
    defaultDurationHours: 24,
  },
  {
    id: "lpm",
    code: "LPM",
    name: "Permiso paternal",
    color: "#f97316",
    category: "permission",
    defaultDurationHours: 24,
  },
  {
    id: "lpte",
    code: "LPTE",
    name: "Permiso temporal",
    color: "#60a5fa",
    category: "permission",
    defaultDurationHours: 4,
  },
  {
    id: "e",
    code: "E",
    name: "Enfermedad",
    color: "#a855f7",
    category: "permission",
    defaultDurationHours: 24,
  },
  {
    id: "pr",
    code: "PR",
    name: "Permiso remunerado",
    color: "#22c55e",
    category: "permission",
    defaultDurationHours: 8,
  },
  {
    id: "nh",
    code: "NH",
    name: "No habilitado",
    color: "#ef4444",
    category: "permission",
    defaultDurationHours: 8,
  },
];

interface DraggableLicenciaProps {
  licencia: LicenciaItem;
}

interface LicenciasPanelProps {
  showTurnos?: boolean;
}

function DraggableLicencia({ licencia }: DraggableLicenciaProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `licencia-${licencia.id}`,
    data: {
      type: "sidebarItem",
      itemType: "permission",
      itemData: licencia,
    },
  });

  return (
    <div className="flex flex-col items-center">
      <Button
        ref={setNodeRef}
        variant="outline"
        size="sm"
        className={`flex items-center justify-center h-8 rounded-md cursor-grab text-white ${
          isDragging ? "opacity-50" : ""
        }`}
        style={{
          backgroundColor: licencia.color,
          minWidth: licencia.code.length > 2 ? "3rem" : "2.25rem",
          paddingLeft: "0.5rem",
          paddingRight: "0.5rem",
        }}
        {...listeners}
        {...attributes}
      >
        {licencia.code}
      </Button>
      <span className="text-xs text-muted-foreground mt-1">
        {licencia.name}
      </span>
    </div>
  );
}

export default function LicenciasPanel({
  showTurnos = false,
}: LicenciasPanelProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Filtrar licencias basadas en el término de búsqueda
  const filteredLicencias = licenciasData.filter(
    (licencia) =>
      licencia.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      licencia.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Determinar la clase de posición basada en si Turnos está activo
  // Si Turnos está activo, este panel va a la derecha (float-right)
  // Si Turnos NO está activo, este panel va a la izquierda (float-left)
  const positionClass = showTurnos ? "float-right" : "float-left";

  return (
    <div
      className={`border-t border-border bg-card p-3 w-1/2 ${positionClass}`}
    >
      <div className="flex flex-col">
        <div className="flex items-center gap-3 mb-2">
          <div className="font-medium text-sm">Licencias y permisos:</div>
          <div className="relative flex-1 max-w-[200px]">
            <Search className="absolute left-2 top-1.5 h-3 w-3 text-muted-foreground" />
            <Input
              placeholder="Buscar licencias..."
              className="pl-7 h-7 text-sm py-1"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-start gap-4 py-2 flex-wrap">
          {filteredLicencias.map((licencia) => (
            <DraggableLicencia key={licencia.id} licencia={licencia} />
          ))}
        </div>
      </div>
    </div>
  );
}
