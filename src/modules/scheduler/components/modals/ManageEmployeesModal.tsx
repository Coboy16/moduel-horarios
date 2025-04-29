"use client";

import { useState } from "react";
import { useUI } from "../../hooks/useUI";
import { useEmployees } from "../../hooks/useEmployees";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Checkbox } from "../ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { X, Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

type ManageEmployeesModalProps = {};

export default function ManageEmployeesModal({}: ManageEmployeesModalProps) {
  const { closeManageEmployeesModal } = useUI();
  const {
    employees,
    selectedEmployees,
    selectEmployee,
    deselectEmployee,
    selectAllEmployees,
    deselectAllEmployees,
    departments,
    positions,
  } = useEmployees();

  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [positionFilter, setPositionFilter] = useState("all");

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

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      selectAllEmployees(filteredEmployees);
    } else {
      deselectAllEmployees();
    }
  };

  const isAllSelected =
    filteredEmployees.length > 0 &&
    filteredEmployees.every((emp) =>
      selectedEmployees.some((sel) => sel.id === emp.id)
    );

  return (
    <Dialog open={true} onOpenChange={closeManageEmployeesModal}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Gestionar Empleados</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar empleados..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>

          <div className="flex gap-2">
            <Select
              value={departmentFilter}
              onValueChange={setDepartmentFilter}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los departamentos</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={positionFilter} onValueChange={setPositionFilter}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Posición" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las posiciones</SelectItem>
                {positions.map((pos) => (
                  <SelectItem key={pos} value={pos}>
                    {pos}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="selectAll"
              checked={isAllSelected}
              onCheckedChange={handleSelectAll}
            />
            <label htmlFor="selectAll" className="text-sm">
              Seleccionar todos
            </label>
          </div>

          <div className="border rounded-md h-[300px] overflow-y-auto">
            {filteredEmployees.length > 0 ? (
              <div className="divide-y divide-border">
                {filteredEmployees.map((employee) => {
                  const isSelected = selectedEmployees.some(
                    (e) => e.id === employee.id
                  );

                  return (
                    <div
                      key={employee.id}
                      className={`p-3 flex items-center hover:bg-accent transition-colors ${
                        isSelected ? "bg-accent/50" : ""
                      }`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            selectEmployee(employee);
                          } else {
                            deselectEmployee(employee.id);
                          }
                        }}
                        className="mr-3"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {employee.name}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {employee.department} • {employee.position}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                No se encontraron empleados
              </div>
            )}
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {selectedEmployees.length} empleados seleccionados
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeManageEmployeesModal}
              >
                Cancelar
              </Button>
              <Button onClick={closeManageEmployeesModal}>Aplicar</Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
