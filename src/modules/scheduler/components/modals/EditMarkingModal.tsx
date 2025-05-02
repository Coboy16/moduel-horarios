"use client";

import { useState, useEffect } from "react";
import { useUI } from "../../hooks/useUI";
import { useMarkings } from "../../hooks/useMarkings";
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
import { X } from "lucide-react";
import { formatDateForInput, formatTimeForInput } from "../../utils/dateUtils";
import type { Marking } from "../../interfaces/Marking";
import { useForm } from "react-hook-form";

type EditMarkingModalProps = {};

export default function EditMarkingModal({}: EditMarkingModalProps) {
  const { closeEditMarkingModal, editMarkingData } = useUI();
  const { updateMarking, deleteMarking, markingTypes, markingStatuses } =
    useMarkings();
  const { employees } = useEmployees();

  const [markingDate, setMarkingDate] = useState("");
  const [markingTime, setMarkingTime] = useState("");

  const form = useForm({
    defaultValues: {
      type: "",
      employeeId: "",
      status: "",
      location: "",
    },
  });

  // Set initial values based on marking data
  useEffect(() => {
    if (editMarkingData) {
      const marking = editMarkingData;
      const markingDateTime = new Date(marking.time);

      form.reset({
        type: marking.type,
        employeeId: marking.employeeId,
        status: marking.status,
        location: marking.location || "",
      });

      setMarkingDate(formatDateForInput(markingDateTime));
      setMarkingTime(formatTimeForInput(markingDateTime));
    }
  }, [editMarkingData, form]);

  const onSubmit = form.handleSubmit((data) => {
    if (!editMarkingData) return;

    const markingDateTime = new Date(`${markingDate}T${markingTime}`);

    const updatedMarking: Marking = {
      ...editMarkingData,
      type: data.type,
      employeeId: data.employeeId,
      time: markingDateTime.toISOString(),
      status: data.status,
      location: data.location,
    };

    updateMarking(updatedMarking);
    closeEditMarkingModal();
  });

  const handleDelete = () => {
    if (editMarkingData) {
      deleteMarking(editMarkingData.id);
      closeEditMarkingModal();
    }
  };

  if (!editMarkingData) return null;

  return (
    <Dialog open={true} onOpenChange={closeEditMarkingModal}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Marcaje</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              rules={{ required: "El tipo es requerido" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Marcaje</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white">
                      {markingTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
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
                <FormLabel>Fecha</FormLabel>
                <Input
                  type="date"
                  value={markingDate}
                  onChange={(e) => setMarkingDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <FormLabel>Hora</FormLabel>
                <Input
                  type="time"
                  value={markingTime}
                  onChange={(e) => setMarkingTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="status"
              rules={{ required: "El estado es requerido" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {markingStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
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
                onClick={closeEditMarkingModal}
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
