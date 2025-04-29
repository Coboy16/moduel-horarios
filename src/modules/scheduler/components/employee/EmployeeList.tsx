"use client";

import { useState } from "react";
import { useEmployees } from "../../hooks/useEmployees";
import { useUI } from "../../hooks/useUI";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

import {
  Search,
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

export default function EmployeeList() {
  const {
    employees,
    selectedEmployees,
    deselectEmployee,
    selectAllEmployees,
    deselectAllEmployees,
  } = useEmployees();

  const { openManageEmployeesModal } = useUI();

  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [positionFilter, setPositionFilter] = useState("all");
  const [collapsed, setCollapsed] = useState(false);

  // Filter employees based on search term and filters
  const filteredEmployees = employees.filter((emp) => {
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (
        !emp.name.toLowerCase().includes(term) &&
        !emp.department.toLowerCase().includes(term)
      ) {
        return false;
      }
    }

    // Apply department filter
    if (departmentFilter !== "all" && emp.department !== departmentFilter) {
      return false;
    }

    // Apply position filter
    if (positionFilter !== "all" && emp.position !== positionFilter) {
      return false;
    }

    return true;
  });

  // Función para seleccionar todos los empleados filtrados
  const handleSelectPage = () => {
    selectAllEmployees(filteredEmployees);
  };

  // Función para deseleccionar todos los empleados filtrados
  const handleDeselectPage = () => {
    // Deseleccionar solo los empleados que están en la lista filtrada actual
    filteredEmployees.forEach((emp) => {
      deselectEmployee(emp.id);
    });
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

  return (
    <div className="w-[300px] border-r border-border flex flex-col">
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
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={handleSelectPage}>
                <Check className="mr-2 h-4 w-4" />
                Seleccionar página
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDeselectPage}>
                <X className="mr-2 h-4 w-4" />
                Deseleccionar página
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={deselectAllEmployees}>
                <X className="mr-2 h-4 w-4" />
                Deseleccionar todo
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => selectAllEmployees(employees)}>
                <Eye className="mr-2 h-4 w-4" />
                Ver todo el listado
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

      <div className="p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar empleados..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredEmployees.length > 0 ? (
          <div className="divide-y divide-border">
            {filteredEmployees.map((employee) => (
              <EmployeeItem key={employee.id} employee={employee} />
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-muted-foreground">
            No se encontraron empleados
          </div>
        )}
      </div>

      <div className="p-3 border-t border-border text-xs text-muted-foreground">
        {selectedEmployees.length} empleados seleccionados
      </div>
    </div>
  );
}
