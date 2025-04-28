"use client";

import { useState, useEffect } from "react";
import { useUI } from "../../hooks/useUI";
import { useEvents } from "../../hooks/useEvents";
import { useEmployees } from "../../hooks/useEmployees";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
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

type AddScheduleModalProps = {};

export default function AddScheduleModal({}: AddScheduleModalProps) {
  const { closeAddScheduleModal, addScheduleData } = useUI();
  const { addEvent, getShiftEventTypes } = useEvents();
  const { employees, selectedEmployees } = useEmployees();

  const [scheduleDate, setScheduleDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const form = useForm({
    defaultValues: {
      shiftType: "",
      employeeId: "",
      location: "",
      description: "",
    },
  });

  // Set initial values based on context data
  useEffect(() => {
    if (addScheduleData) {
      const date = addScheduleData.date || new Date();
      const employeeId =
        addScheduleData.employeeId ||
        (selectedEmployees.length > 0 ? selectedEmployees[0].id : "");

      setScheduleDate(formatDateForInput(date));
      setStartTime("09:00");
      setEndTime("17:00");

      form.setValue("employeeId", employeeId);
    }
  }, [addScheduleData, selectedEmployees, form]);

  const onSubmit = form.handleSubmit((data) => {
    const shiftTypes = getShiftEventTypes();
    const selectedShift = shiftTypes.find(
      (shift) => shift.id === data.shiftType
    );

    if (!selectedShift) return;

    const startDateTime = new Date(`${scheduleDate}T${startTime}`);
    const endDateTime = new Date(`${scheduleDate}T${endTime}`);

    // If end time is before start time, assume it's the next day
    if (endDateTime < startDateTime) {
      endDateTime.setDate(endDateTime.getDate() + 1);
    }

    const newSchedule: Omit<Event, "id"> = {
      title: selectedShift.name,
      type: selectedShift.id,
      employeeId: data.employeeId,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      location: data.location,
      description: data.description,
      isAllDay: false,
    };

    addEvent(newSchedule);
    closeAddScheduleModal();
  });

  return (
    <Dialog open={true} onOpenChange={closeAddScheduleModal}>
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle>Agregar Horario</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="shiftType"
              rules={{ required: "El turno es requerido" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Turno</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar turno" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white">
                      {getShiftEventTypes().map((shift) => (
                        <SelectItem key={shift.id} value={shift.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: shift.color }}
                            />
                            {shift.name}
                          </div>
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

            <div className="space-y-2">
              <FormLabel>Fecha</FormLabel>
              <Input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <FormLabel>Hora inicio</FormLabel>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <FormLabel>Hora fin</FormLabel>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ubicación</FormLabel>
                  <FormControl>
                    <Input placeholder="Ubicación (opcional)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Input placeholder="Descripción (opcional)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeAddScheduleModal}
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
