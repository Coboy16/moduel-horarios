"use client";

import { useState, useEffect, useRef } from "react";
import { X, Search, FilterIcon } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { cn } from "../../lib/utils";

// Tipos de filtro
const FILTER_TYPES = {
  DEPARTMENT: "Departamento",
  NAME: "Nombre",
  POSITION: "Posición",
};

interface SearchFilterProps {
  onFilterChange: (filterData: {
    search: string[];
    departments: string[];
    positions: string[];
  }) => void;
  departments?: string[];
  positions?: string[];
}

export default function SearchFilter({
  onFilterChange,
  departments = [], // Lista de departamentos disponibles
  positions = [], // Lista de posiciones disponibles
}: SearchFilterProps) {
  // Definir interfaz para el tipo de filtro
  interface Filter {
    type: string;
    value: string;
  }

  // Estado para los filtros activos y el valor del input
  const [filters, setFilters] = useState<Filter[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Referencias para medir el ancho de contenedor del input
  const containerRef = useRef<HTMLDivElement>(null);

  // Efecto para notificar cambios en los filtros
  useEffect(() => {
    // Convertir filtros a un formato utilizable por el componente padre
    const filterData = {
      search: filters
        .filter((f) => f.type === FILTER_TYPES.NAME)
        .map((f) => f.value),
      departments: filters
        .filter((f) => f.type === FILTER_TYPES.DEPARTMENT)
        .map((f) => f.value),
      positions: filters
        .filter((f) => f.type === FILTER_TYPES.POSITION)
        .map((f) => f.value),
    };

    onFilterChange(filterData);
  }, [filters, onFilterChange]);

  // Añadir un nuevo filtro
  const addFilter = (type: string, value: string) => {
    // Evitar duplicados
    if (
      !filters.some((f) => f.type === type && f.value === value) &&
      value.trim()
    ) {
      setFilters([...filters, { type, value }]);
      setInputValue("");
    }
  };

  // Eliminar un filtro
  const removeFilter = (index: number) => {
    const newFilters = [...filters];
    newFilters.splice(index, 1);
    setFilters(newFilters);
  };

  // Limpiar todos los filtros
  const clearAllFilters = () => {
    setFilters([]);
    setInputValue("");
  };

  // Manejar la tecla Enter en el input
  const handleKeyDown = (e: { key: string; preventDefault: () => void }) => {
    if (e.key === "Enter" && inputValue.trim()) {
      addFilter(FILTER_TYPES.NAME, inputValue);
      e.preventDefault();
    }
  };

  // Determinar el color del badge según el tipo de filtro
  const getBadgeColor = (type: string) => {
    switch (type) {
      case FILTER_TYPES.DEPARTMENT:
        return "bg-indigo-100 text-indigo-800";
      case FILTER_TYPES.POSITION:
        return "bg-emerald-100 text-emerald-800";
      case FILTER_TYPES.NAME:
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const shouldShowPlaceholder = !inputValue && !isFocused;

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        className={cn(
          "flex flex-wrap items-center gap-2 p-2 border rounded-md bg-white",
          filters.length > 0 && "min-h-[40px]"
        )}
      >
        {/* Mostrar badges para cada filtro */}
        {filters.map((filter, index) => (
          <div
            key={index}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-md text-sm",
              getBadgeColor(filter.type)
            )}
          >
            <span className="font-medium">
              {filter.type === FILTER_TYPES.NAME ? "" : `${filter.type}: `}
            </span>
            <span>{filter.value}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 rounded-full hover:bg-blue-200"
              onClick={() => removeFilter(index)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}

        {/* Campo de búsqueda */}
        <div className="flex-1 flex items-center min-w-[150px] relative">
          <Search className="h-4 w-4 text-muted-foreground mr-2 flex-shrink-0" />
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={
              shouldShowPlaceholder ? "Buscar por nombre, departamento..." : ""
            }
            className="border-0 shadow-none p-0 h-7 focus-visible:ring-0"
          />
        </div>

        {/* Dropdown para filtros avanzados */}
        <DropdownMenu open={showDropdown} onOpenChange={setShowDropdown}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8 rounded-md", showDropdown && "bg-accent")}
            >
              <FilterIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            alignOffset={-8}
            className="bg-white border shadow-md max-h-[300px] overflow-y-auto"
            style={{
              width: containerRef.current
                ? `${containerRef.current.offsetWidth}px`
                : "100%",
              marginTop: "4px",
            }}
          >
            <DropdownMenuSeparator />
            {departments.map((dept) => (
              <DropdownMenuItem
                key={dept}
                onClick={() => addFilter(FILTER_TYPES.DEPARTMENT, dept)}
                className="hover:bg-accent"
              >
                {dept}
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator />
            <div className="p-2 text-sm font-medium sticky top-0 bg-white">
              Posiciones
            </div>
            <DropdownMenuSeparator />
            {positions.map((pos) => (
              <DropdownMenuItem
                key={pos}
                onClick={() => addFilter(FILTER_TYPES.POSITION, pos)}
                className="hover:bg-accent"
              >
                {pos}
              </DropdownMenuItem>
            ))}

            {filters.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={clearAllFilters}
                  className="text-red-500 hover:bg-red-50 sticky bottom-0 bg-white"
                >
                  <X className="mr-2 h-4 w-4" />
                  Limpiar filtros
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
