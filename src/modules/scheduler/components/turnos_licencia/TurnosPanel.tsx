"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Search } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";

interface TurnoItem {
  id: string;
  code: string;
  name: string;
  color: string;
  defaultDurationHours: number;
}

// Datos de ejemplo para turnos
const turnosData: TurnoItem[] = [
  {
    id: "s1",
    code: "S1",
    name: "Turno mañana",
    color: "#f97316",
    defaultDurationHours: 8,
  },
  {
    id: "s2",
    code: "S2",
    name: "Turno tarde",
    color: "#f97316",
    defaultDurationHours: 8,
  },
  {
    id: "s3",
    code: "S3",
    name: "Turno noche",
    color: "#f97316",
    defaultDurationHours: 8,
  },
  {
    id: "s4",
    code: "S4",
    name: "Turno especial",
    color: "#60a5fa",
    defaultDurationHours: 6,
  },
];

interface DraggableTurnoProps {
  turno: TurnoItem;
}

function DraggableTurno({ turno }: DraggableTurnoProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `turno-${turno.id}`,
    data: {
      type: "sidebarItem",
      itemType: "shift",
      itemData: turno,
    },
  });

  return (
    <div className="flex flex-col items-center">
      <Button
        ref={setNodeRef}
        variant="outline"
        size="sm"
        className={`flex items-center justify-center h-8 px-3 rounded-md cursor-grab text-white ${
          isDragging ? "opacity-50" : ""
        }`}
        style={{ backgroundColor: turno.color }}
        {...listeners}
        {...attributes}
      >
        {turno.code}
      </Button>
      <span className="text-xs text-muted-foreground mt-1">{turno.name}</span>
    </div>
  );
}

export default function TurnosPanel() {
  const [searchTerm, setSearchTerm] = useState("");

  // Filtrar turnos basados en el término de búsqueda
  const filteredTurnos = turnosData.filter(
    (turno) =>
      turno.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      turno.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="border-t border-border bg-card p-3 w-1/2 float-left">
      <div className="flex flex-col">
        <div className="flex items-center gap-3 mb-2">
          <div className="font-medium text-sm">Turnos de trabajo:</div>
          <div className="relative flex-1 max-w-[200px]">
            <Search className="absolute left-2 top-1.5 h-3 w-3 text-muted-foreground" />
            <Input
              placeholder="Buscar turnos..."
              className="pl-7 h-7 text-sm py-1"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-start gap-4 py-2 flex-wrap">
          {filteredTurnos.map((turno) => (
            <DraggableTurno key={turno.id} turno={turno} />
          ))}
        </div>
      </div>
    </div>
  );
}
