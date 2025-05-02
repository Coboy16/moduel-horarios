"use client";

import type * as React from "react";
import { useEmployees } from "../../hooks/useEmployees";
import { useUI } from "../../hooks/useUI";
import { Check } from "lucide-react"; // Añadimos el ícono Check
import { cn } from "../../lib/utils";

// Define una interfaz más completa si es posible, basada en tu Employee original
interface Employee {
  id: string;
  name: string;
  department: string;
  position: string;
  location?: string;
  email?: string;
  phone?: string;
  avatar?: string;
}

interface EmployeeItemProps {
  employee: Employee;
}

export default function EmployeeItem({ employee }: EmployeeItemProps) {
  const { selectedEmployees, selectEmployee, deselectEmployee } =
    useEmployees();
  const { openContextMenu } = useUI();

  // Verifica si el empleado actual está seleccionado comparando IDs
  const isSelected = selectedEmployees.some((e) => e.id === employee.id);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    openContextMenu(
      {
        x: e.clientX,
        y: e.clientY,
      },
      "employee",
      employee
    );
  };

  // Llama a las funciones correctas del hook para seleccionar/deseleccionar
  const handleToggleSelect = () => {
    if (isSelected) {
      deselectEmployee(employee.id);
    } else {
      selectEmployee(employee);
    }
  };

  return (
    <div
      className={cn(
        "p-3 flex items-center gap-3 hover:bg-accent transition-colors cursor-pointer",
        isSelected && "bg-accent/50"
      )}
      onContextMenu={handleContextMenu}
      onClick={handleToggleSelect}
      role="checkbox"
      aria-checked={isSelected}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleToggleSelect();
        }
      }}
    >
      {/* Indicador de Selección Modificado con Check */}
      <div
        className={cn(
          "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0",
          isSelected
            ? "bg-primary border-primary bg-blue" // Seleccionado: Fondo y borde azul (o tu variable primary)
            : "border-gray-300 bg-white" // No seleccionado: Borde gris, fondo blanco
        )}
        aria-hidden="true"
      >
        {/* Reemplazamos el círculo por un ícono de check cuando está seleccionado */}
        {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
      </div>

      {/* Contenido del empleado */}
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate text-sm">{employee.name}</div>
        <div className="text-xs text-muted-foreground truncate">
          {employee.department} • {employee.position}
        </div>
      </div>
    </div>
  );
}
