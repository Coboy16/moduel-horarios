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
import { formatDateForInput, formatTimeForInput } from "../../utils/dateUtils";
import type { Event } from "../../interfaces/Event";
import { useForm } from "react-hook-form";

type EditEventModalProps = {};

export default function EditEventModal({}: EditEventModalProps) {
  const { closeEditEventModal, editEventData } = useUI();
  const { updateEvent, deleteEvent, eventTypes } = useEvents();
  const { employees } = useEmployees();

  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");

  const form = useForm({
    defaultValues: {
      title: "",
      type: "",
      employeeId: "",
      location: "",
      description: "",
    },
  });

  // Set initial values based on event data
  useEffect(() => {
    if (editEventData) {
      const event = editEventData;
      const startDateTime = new Date(event.startTime);
      const endDateTime = new Date(event.endTime);

      form.reset({
        title: event.title,
        type: event.type,
        employeeId: event.employeeId,
        location: event.location || "",
        description: event.description || "",
      });

      setStartDate(formatDateForInput(startDateTime));
      setStartTime(formatTimeForInput(startDateTime));
      setEndDate(formatDateForInput(endDateTime));
      setEndTime(formatTimeForInput(endDateTime));
    }
  }, [editEventData, form]);

  const onSubmit = form.handleSubmit((data) => {
    if (!editEventData) return;

    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${endDate}T${endTime}`);

    const updatedEvent: Event = {
      ...editEventData,
      title: data.title,
      type: data.type,
      employeeId: data.employeeId,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      location: data.location,
      description: data.description,
    };

    updateEvent(updatedEvent);
    closeEditEventModal();
  });

  const handleDelete = () => {
    if (editEventData) {
      deleteEvent(editEventData.id);
      closeEditEventModal();
    }
  };

  if (!editEventData) return null;

  return (
    <Dialog open={true} onOpenChange={closeEditEventModal}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Evento</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              rules={{ required: "El título es requerido" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Título del evento" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* <FormField
              control={form.control}
              name="type"
              rules={{ required: "El tipo es requerido" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {eventTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: type.color }}
                            />
                            {type.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            /> */}

            <FormField
              control={form.control}
              name="employeeId"
              rules={{ required: "El empleado es requerido" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Empleado</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
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
                <FormLabel>Hora inicio</FormLabel>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <FormLabel>Fecha fin</FormLabel>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
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

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
              >
                Eliminar
              </Button>
              <div className="flex-1"></div>
              <Button
                type="button"
                variant="outline"
                onClick={closeEditEventModal}
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
