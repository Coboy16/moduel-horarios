// src/components/forms/AddMarkingForm.tsx
"use client";
import React, { useState } from "react";
import { MapPin as FileText, Tag, Navigation } from "lucide-react"; // Renombrado para evitar conflicto
import { Label } from "../../ui/label"; // Asumiendo que tienes un componente Label
import { Textarea } from "../../ui/textarea"; // Asumiendo Textarea
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select"; // Asumiendo Select
import { Button } from "../../ui/button"; // Asumiendo Button
import { Input } from "../../ui/input";

// --- Mock Data Interna ---
const mockMarkingTypes = [
  "Turno Mañana M1",
  "Turno Tarde T1",
  "Turno Noche N1",
  "Entrada General",
  "Salida General",
];
const mockLocations = [
  "Sede Hotel Dep. Sucursal Piura",
  "Oficina Principal Lima",
  "Almacén Arequipa",
  "Cliente Corp. XYZ",
  "Remoto",
];
// --- Fin Mock Data ---

interface AddMarkingFormProps {
  initialDate: string;
  initialTime: string;
  // Ya no se necesitan como props si usamos mock data interna
  // locations?: string[];
  // markingTypes?: string[];
  onClose: () => void;
  onSubmitSuccess: (message: string) => void;
}

export function AddMarkingForm({
  initialDate,
  initialTime,
  onClose,
  onSubmitSuccess,
}: AddMarkingFormProps) {
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState(initialTime);
  const [markingType, setMarkingType] = useState(mockMarkingTypes[0] || ""); // Usa mock data
  const [location, setLocation] = useState(mockLocations[0] || ""); // Usa mock data
  const [details, setDetails] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!date) newErrors.date = "La fecha es requerida.";
    if (!time) {
      newErrors.time = "La hora es requerida.";
    } else {
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(time)) {
        newErrors.time = "Formato de hora inválido (HH:MM).";
      }
    }
    if (!markingType) newErrors.markingType = "Seleccione un tipo de marcaje.";
    if (!location) newErrors.location = "Seleccione una ubicación.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    console.log("Enviando datos de marcaje:", {
      date,
      time,
      markingType,
      location,
      details,
    });
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    onSubmitSuccess("Marcaje agregado correctamente.");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="date">Día</Label>
          <Input
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          {errors.date && (
            <p className="text-red-500 text-xs mt-1">{errors.date}</p>
          )}
        </div>
        <div>
          <Label htmlFor="time">Hora</Label>
          <div className="relative">
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="pr-8"
            />
          </div>
          {errors.time && (
            <p className="text-red-500 text-xs mt-1">{errors.time}</p>
          )}
        </div>
      </div>
      <div>
        <Label htmlFor="markingType">Marcaje</Label>
        <Select value={markingType} onValueChange={setMarkingType}>
          <SelectTrigger id="markingType">
            <SelectValue placeholder="Seleccione tipo..." />
          </SelectTrigger>
          <SelectContent className="bg-white">
            {mockMarkingTypes.map((type) => (
              <SelectItem key={type} value={type}>
                <Tag className="inline-block mr-2 h-3 w-3 text-gray-500" />
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.markingType && (
          <p className="text-red-500 text-xs mt-1">{errors.markingType}</p>
        )}
      </div>
      <div>
        <Label htmlFor="location">Ubicación</Label>
        <Select value={location} onValueChange={setLocation}>
          <SelectTrigger id="location">
            <SelectValue placeholder="Seleccione ubicación..." />
          </SelectTrigger>
          <SelectContent className="bg-white">
            {mockLocations.map((loc) => (
              <SelectItem key={loc} value={loc}>
                <Navigation className="inline-block mr-2 h-3 w-3 text-gray-500" />
                {loc}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.location && (
          <p className="text-red-500 text-xs mt-1">{errors.location}</p>
        )}
      </div>
      <div>
        <Label htmlFor="details">Detalles</Label>
        <div className="relative">
          <Textarea
            id="details"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Detalles adicionales (opcional)"
            className="pl-8"
          />
          <FileText className="absolute left-2 top-3 h-4 w-4 text-gray-400" />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          className="bg-green-600 hover:bg-green-700"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </form>
  );
}
