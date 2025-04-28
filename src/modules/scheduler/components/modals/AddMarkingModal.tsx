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
import { formatDateForInput, formatTimeForInput } from "../../utils/dateUtils";
import type { Marking } from "../../interfaces/Marking";
import { useForm } from "react-hook-form";

type AddMarkingModalProps = {};

export default function AddMarkingModal({}: AddMarkingModalProps) {
  const { closeAddMarkingModal, addMarkingData } = useUI();
  const { addMarking, markingTypes, markingStatuses } = useMarkings();
  const { employees, selectedEmployees } = useEmployees();

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

  // Set initial values based on context data
  useEffect(() => {
    if (addMarkingData) {
      const date = addMarkingData.date || new Date();
      const employeeId =
        addMarkingData.employeeId ||
        (selectedEmployees.length > 0 ? selectedEmployees[0].id : "");

      setMarkingDate(formatDateForInput(date));
      setMarkingTime(formatTimeForInput(date));

      form.setValue("employeeId", employeeId);
    }
  }, [addMarkingData, selectedEmployees, form]);

  const onSubmit = form.handleSubmit((data) => {
    const markingDateTime = new Date(`${markingDate}T${markingTime}`);

    const newMarking: Omit<Marking, "id"> = {
      type: data.type,
      employeeId: data.employeeId,
      time: markingDateTime.toISOString(),
      status: data.status,
      location: data.location,
    };

    addMarking(newMarking);
    closeAddMarkingModal();
  });

  return (
    <Dialog open={true} onOpenChange={closeAddMarkingModal}>
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle>Agregar Marcaje</DialogTitle>
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
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
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
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white">
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

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeAddMarkingModal}
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
