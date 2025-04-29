"use client";

import { useState, useMemo, SetStateAction, useEffect } from "react";
import { useEmployees } from "../../hooks/useEmployees";
import { useUI } from "../../hooks/useUI";
import { Button } from "../ui/button";

import {
  Users,
  ChevronLeft,
  ChevronRight,
  Menu,
  Check,
  X,
  Eye,
} from "lucide-react";
import EmployeeItem from "./EmployeeItem";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import SearchFilter from "../filters/SearchFilter";
import Pagination from "../filters/Pagination";

// Número de empleados por página
// CAMBIADO DE 5 a 10
const ITEMS_PER_PAGE = 10;

export default function EmployeeList() {
  const {
    employees,
    selectedEmployees,
    deselectEmployee,
    selectAllEmployees,
    deselectAllEmployees,
  } = useEmployees();

  const { openManageEmployeesModal } = useUI();

  const [searchFilters, setSearchFilters] = useState({
    search: [] as string[],
    departments: [] as string[],
    positions: [] as string[],
  });
  const [collapsed, setCollapsed] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Extraer departamentos y posiciones únicas de los empleados para los filtros
  const departments = useMemo(() => {
    const deptSet = new Set(employees.map((emp) => emp.department));
    return Array.from(deptSet);
  }, [employees]);

  const positions = useMemo(() => {
    const posSet = new Set(employees.map((emp) => emp.position));
    return Array.from(posSet);
  }, [employees]);

  // Filtrar empleados basado en los criterios de búsqueda
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      // Filtrar por términos de búsqueda (nombre u otros campos de texto)
      if (searchFilters.search.length > 0) {
        const matchesSearch = searchFilters.search.some((term) => {
          const termLower = term.toLowerCase();
          return (
            emp.name.toLowerCase().includes(termLower) ||
            emp.department.toLowerCase().includes(termLower) ||
            emp.position.toLowerCase().includes(termLower)
          );
        });

        if (!matchesSearch) return false;
      }

      // Filtrar por departamentos
      if (searchFilters.departments.length > 0) {
        if (!searchFilters.departments.includes(emp.department)) {
          return false;
        }
      }

      // Filtrar por posiciones
      if (searchFilters.positions.length > 0) {
        if (!searchFilters.positions.includes(emp.position)) {
          return false;
        }
      }

      return true;
    });
  }, [employees, searchFilters]);

  // Calcular el total de páginas
  const totalPages = Math.max(
    1,
    Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE)
  );

  // Resetear a página 1 cuando cambian los filtros

  // Obtener los empleados para la página actual
  const paginatedEmployees = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE; // Usa ITEMS_PER_PAGE aquí también
    return filteredEmployees.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredEmployees, currentPage]);

  // Asegurarnos de que currentPage es válido cuando cambia el número total de páginas
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // Manejar cambios en los filtros
  const handleFilterChange = (
    filters: SetStateAction<{
      search: string[];
      departments: string[];
      positions: string[];
    }>
  ) => {
    setSearchFilters(filters);
  };

  // Función para seleccionar todos los empleados filtrados
  const handleSelectPage = () => {
    // Asegúrate de pasar los empleados PAGINADOS a selectAllEmployees
    selectAllEmployees(paginatedEmployees);
  };

  // Función para deseleccionar todos los empleados filtrados
  const handleDeselectPage = () => {
    // Deseleccionar solo los empleados que están en la lista filtrada actual
    paginatedEmployees.forEach((emp) => {
      deselectEmployee(emp.id);
    });
  };

  // Manejar cambio de página
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (collapsed) {
    return (
      <div className="w-12 border-r border-border flex flex-col items-center py-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(false)}
          className="mb-4"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <div className="flex flex-col items-center gap-2">
          {selectedEmployees.map((employee) => (
            <div
              key={employee.id}
              className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium"
              title={employee.name}
            >
              {employee.name.charAt(0)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const hasActiveFilters =
    searchFilters.search.length > 0 ||
    searchFilters.departments.length > 0 ||
    searchFilters.positions.length > 0;

  return (
    <div className="w-[320px] border-r border-border flex flex-col">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <h2 className="font-medium">Empleados</h2>
          <div className="flex items-center justify-center w-5 h-5 bg-purple-600 text-white text-xs rounded-full">
            {selectedEmployees.length}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Dropdown de acciones para selección */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Menu className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 bg-white border-gray-200 shadow-lg"
            >
              <DropdownMenuItem
                onClick={handleSelectPage} // Esto ahora selecciona los 10 de la página actual
                className="hover:bg-gray-100"
              >
                <Check className="mr-2 h-4 w-4" />
                Seleccionar página
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDeselectPage} // Esto ahora deselecciona los 10 de la página actual
                className="hover:bg-gray-100"
              >
                <X className="mr-2 h-4 w-4" />
                Deseleccionar página
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-200" />
              <DropdownMenuItem
                onClick={deselectAllEmployees}
                className="hover:bg-gray-100"
              >
                <X className="mr-2 h-4 w-4" />
                Deseleccionar todo
              </DropdownMenuItem>
              {/* Ojo: "Ver todo el listado" con selectAllEmployees(employees) podría ser confuso si solo queremos verlos y no seleccionarlos todos. Si solo es para ver sin seleccionar, habría que manejar un estado de "mostrar todos" y ajustar la paginación/filtrado para ese caso especial, o cambiar el texto. Si la intención es SELECCIONAR todos, el código actual es correcto.*/}
              <DropdownMenuItem
                onClick={() => selectAllEmployees(employees)}
                className="hover:bg-gray-100"
              >
                <Eye className="mr-2 h-4 w-4" />
                Seleccionar todo el listado
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(true)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={openManageEmployeesModal}>
            Gestionar
          </Button>
        </div>
      </div>

      <div className="p-4">
        {/* Componente de búsqueda con filtros */}
        <SearchFilter
          onFilterChange={handleFilterChange}
          departments={departments}
          positions={positions}
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {paginatedEmployees.length > 0 ? (
          <div className="divide-y divide-border">
            {paginatedEmployees.map((employee) => (
              <EmployeeItem key={employee.id} employee={employee} />
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-muted-foreground">
            {hasActiveFilters
              ? "No se encontraron empleados con los filtros aplicados"
              : "No se encontraron empleados"}
          </div>
        )}
      </div>

      {/* Componente de paginación (siempre visible) */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        totalItems={filteredEmployees.length} // Cambiado a filteredEmployees.length para reflejar el total DENTRO de los filtros
        selectedItems={selectedEmployees.length}
      />
    </div>
  );
}
