"use client";

import { useState, useEffect } from "react";
import { useUI } from "../../hooks/useUI";
import { useEvents } from "../../hooks/useEvents";
import { useEmployees } from "../../hooks/useEmployees";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { formatDateForInput } from "../../utils/dateUtils";
import type { Event } from "../../interfaces/Event";
import { useForm } from "react-hook-form";

type AddPermissionModalProps = {};

export default function AddPermissionModal({}: AddPermissionModalProps) {
  const { closeAddPermissionModal, addPermissionData } = useUI();
  const { addEvent, getPermissionEventType } = useEvents();
  const { employees, selectedEmployees } = useEmployees();

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const form = useForm({
    defaultValues: {
      title: "",
      reason: "",
      employeeId: "",
      description: "",
    },
  });

  // Set initial values based on context data
  useEffect(() => {
    if (addPermissionData) {
      const date = addPermissionData.date || new Date();
      const employeeId =
        addPermissionData.employeeId ||
        (selectedEmployees.length > 0 ? selectedEmployees[0].id : "");

      setStartDate(formatDateForInput(date));

      // Set end date to same day by default
      setEndDate(formatDateForInput(date));

      form.setValue("employeeId", employeeId);
    }
  }, [addPermissionData, selectedEmployees, form]);

  const onSubmit = form.handleSubmit((data) => {
    const permissionType = getPermissionEventType();
    if (!permissionType) return;

    const startDateTime = new Date(`${startDate}T00:00:00`);
    const endDateTime = new Date(`${endDate}T23:59:59`);

    const newPermission: Omit<Event, "id"> = {
      title: data.title || `Permiso: ${data.reason}`,
      type: permissionType.id,
      employeeId: data.employeeId,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      description: data.description,
      isAllDay: true,
      location: "",
    };

    addEvent(newPermission);
    closeAddPermissionModal();
  });

  return (
    <Dialog open={true} onOpenChange={closeAddPermissionModal}>
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle>Agregar Permiso</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="employeeId"
              rules={{ required: "El empleado es requerido" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Empleado</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar empleado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white">
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              rules={{ required: "El motivo es requerido" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar motivo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white">
                      <SelectItem value="LIBRE">Día libre</SelectItem>
                      <SelectItem value="VACACIONES">Vacaciones</SelectItem>
                      <SelectItem value="ENFERMEDAD">Enfermedad</SelectItem>
                      <SelectItem value="MATERNIDAD">
                        Licencia por maternidad
                      </SelectItem>
                      <SelectItem value="PATERNIDAD">
                        Licencia por paternidad
                      </SelectItem>
                      <SelectItem value="PERSONAL">Asunto personal</SelectItem>
                      <SelectItem value="OTRO">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Título personalizado" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <FormLabel>Fecha inicio</FormLabel>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <FormLabel>Fecha fin</FormLabel>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descripción (opcional)"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeAddPermissionModal}
              >
                Cancelar
              </Button>
              <Button type="submit">Guardar</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
