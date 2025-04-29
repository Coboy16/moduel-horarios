"use client";

import { useState, useMemo, SetStateAction, useEffect } from "react";
import { useEmployees } from "../../hooks/useEmployees";
import { useUI } from "../../hooks/useUI";
import { Button } from "../ui/button";

import {
  Users,
  Menu,
  Check,
  X,
  Eye,
  Cog, // Importamos el icono Cog para "Gestionar"
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
  const [collapsed] = useState(false);
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
  useEffect(() => {
    // Si el problema persiste, la depuración en SearchFilter sigue siendo necesaria.
    const areFiltersActive =
      searchFilters.search.length > 0 ||
      searchFilters.departments.length > 0 ||
      searchFilters.positions.length > 0;
    setCurrentPage(1);
  }, [searchFilters]);

  const paginatedEmployees = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
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

  // Función para seleccionar los empleados de la página actual
  const handleSelectPage = () => {
    selectAllEmployees(paginatedEmployees);
  };

  // Función para deseleccionar los empleados de la página actual
  const handleDeselectPage = () => {
    paginatedEmployees.forEach((emp) => {
      deselectEmployee(emp.id);
    });
  };

  // Función para deseleccionar TODOS los empleados (sin importar filtro/página)
  const handleDeseectAll = () => {
    deselectAllEmployees();
  };

  // Función para seleccionar TODOS los empleados (sin importar filtro/página)
  const handleSelectAll = () => {
    selectAllEmployees(employees); // Pasar la lista completa de empleados
  };

  // Manejar cambio de página
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // --- RENDERIZADO DEL ESTADO COLAPSADO ---
  if (collapsed) {
    return (
      // Contenedor principal colapsado con ancho fijo
      <div className="w-12 border-r border-border flex flex-col">
        {/* Encabezado colapsado */}
        <div className="flex items-center justify-between p-2">
          {/* Lado izquierdo: Menu y Users */}
          <div className="flex items-center gap-1">
            {/* Dropdown de acciones (solo trigger visible) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                {/* Botón más pequeño para el estado colapsado */}
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <Menu className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              {/* Contenido del Dropdown (igual que en estado expandido) */}
              <DropdownMenuContent
                align="end"
                className="w-56 bg-white border-gray-200 shadow-lg"
              >
                {/* Acciones de selección/deselección por página */}
                <DropdownMenuItem
                  onClick={handleSelectPage}
                  className="hover:bg-gray-100"
                >
                  <Check className="mr-2 h-4 w-4" />
                  Seleccionar página
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDeselectPage}
                  className="hover:bg-gray-100"
                >
                  <X className="mr-2 h-4 w-4" />
                  Deseleccionar página
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-gray-200" />

                {/* Acciones de selección/deselección de todo */}
                <DropdownMenuItem
                  onClick={handleDeseectAll} // Usar la nueva función si es diferente la lógica
                  className="hover:bg-gray-100"
                >
                  <X className="mr-2 h-4 w-4" />
                  Deseleccionar todo
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleSelectAll} // Usar la nueva función si es diferente la lógica
                  className="hover:bg-gray-100"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Seleccionar todo el listado
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-gray-200" />

                {/* Botón "Gestionar" movido al Dropdown */}
                <DropdownMenuItem
                  onClick={openManageEmployeesModal}
                  className="hover:bg-gray-100"
                >
                  <Cog className="mr-2 h-4 w-4" /> {/* Icono de Cog */}
                  Gestionar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {/* Icono de Usuarios */}
            <Users className="h-4 w-4 text-muted-foreground" />{" "}
            {/* Texto gris sutil */}
          </div>
          {/* Lado derecho: Botón para expandir */}
          {/* <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(false)}
            className="h-7 w-7" // Mismo tamaño que el botón del menú
          >
            <ChevronRight className="h-4 w-4" />
          </Button> */}
        </div>
        {/* Área de avatares de empleados seleccionados (scrollable si hay muchos) */}
        <div className="flex flex-col items-center gap-2 py-2 overflow-y-auto flex-1">
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

  // --- RENDERIZADO DEL ESTADO EXPANDIDO ---
  const hasActiveFilters =
    searchFilters.search.length > 0 ||
    searchFilters.departments.length > 0 ||
    searchFilters.positions.length > 0;

  return (
    <div className="w-[320px] border-r border-border flex flex-col">
      {/* Encabezado expandido */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        {/* Lado izquierdo: Menu, Users, Empleados (texto), Contador */}
        <div className="flex items-center gap-2">
          {/* Dropdown de acciones */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Menu className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            {/* Contenido del Dropdown (igual que en estado colapsado) */}
            <DropdownMenuContent
              align="end"
              className="w-56 bg-white border-gray-200 shadow-lg"
            >
              {/* Acciones de selección/deselección por página */}
              <DropdownMenuItem
                onClick={handleSelectPage}
                className="hover:bg-gray-100"
              >
                <Check className="mr-2 h-4 w-4" />
                Seleccionar página
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDeselectPage}
                className="hover:bg-gray-100"
              >
                <X className="mr-2 h-4 w-4" />
                Deseleccionar página
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-gray-200" />

              {/* Acciones de selección/deselección de todo */}
              <DropdownMenuItem
                onClick={handleDeseectAll} // Usar la nueva función si es diferente la lógica
                className="hover:bg-gray-100"
              >
                <X className="mr-2 h-4 w-4" />
                Deseleccionar todo
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleSelectAll} // Usar la nueva función si es diferente la lógica
                className="hover:bg-gray-100"
              >
                <Eye className="mr-2 h-4 w-4" />
                Seleccionar todo el listado
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-gray-200" />

              {/* Botón "Gestionar" movido al Dropdown */}
              <DropdownMenuItem
                onClick={openManageEmployeesModal}
                className="hover:bg-gray-100"
              >
                <Cog className="mr-2 h-4 w-4" /> {/* Icono de Cog */}
                Gestionar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {/* Icono de Usuarios */}
          <Users className="h-4 w-4" />
          {/* Texto "Empleados" */}
          <h2 className="font-medium">Empleados</h2>
          {/* Contador de seleccionados */}
          <div className="flex items-center justify-center w-5 h-5 bg-blue-600 text-white text-xs rounded-full">
            {selectedEmployees.length}
          </div>
        </div>

        {/* Lado derecho: Botón para colapsar */}
        <div className="flex items-center gap-1">
          {/* Botón para colapsar */}
          {/* <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(true)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button> */}
        </div>
      </div>

      {/* Área de filtros (igual que antes) */}
      <div className="p-4">
        <SearchFilter
          onFilterChange={handleFilterChange}
          departments={departments}
          positions={positions}
        />
      </div>

      {/* Lista de empleados paginados/filtrados (scrollable) */}
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

      {/* Componente de paginación (igual que antes, ahora de 2 filas) */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        totalItems={filteredEmployees.length}
        selectedItems={selectedEmployees.length}
      />
    </div>
  );
}
