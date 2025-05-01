"use client";
import React, { useState, useEffect } from "react";
import { MapPin, Tag, Navigation, FileText } from "lucide-react";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import {
  mockMarkingTypes,
  mockLocations,
  mockSites,
} from "../../../tem/mockData";
import { Marking } from "../../../interfaces/Marking";

interface AddMarkingFormProps {
  initialDate?: string;
  initialTime?: string;
  markingToEdit?: Marking | null; // Para edición
  isEditing?: boolean;
  onClose: () => void;
  onSubmitSuccess: (message: string) => void;
}

export function AddMarkingForm({
  initialDate = new Date().toISOString().split("T")[0],
  initialTime = new Date().toTimeString().slice(0, 5),
  markingToEdit = null,
  isEditing = false,
  onClose,
  onSubmitSuccess,
}: AddMarkingFormProps) {
  // Estados para los campos del formulario
  const [date, setDate] = useState<string>(initialDate);
  const [time, setTime] = useState<string>(initialTime);
  const [markingType, setMarkingType] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [site, setSite] = useState<string>("");
  const [details, setDetails] = useState<string>("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Función para formatear la hora en función del formato
  const formatTimeForDisplay = (timeStr: string) => {
    try {
      const timeNum = parseFloat(timeStr);
      const hours = Math.floor(timeNum);
      const minutes = Math.floor((timeNum % 1) * 60);
      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}`;
    } catch (e) {
      console.error("Error al formatear la hora:", e);
      return timeStr.includes(":") ? timeStr : `${timeStr}:00`;
    }
  };

  // Si hay un marcaje para editar, inicializar los campos con sus valores
  useEffect(() => {
    if (markingToEdit) {
      setDate(markingToEdit.dateStr || initialDate);
      setTime(formatTimeForDisplay(markingToEdit.time));
      setMarkingType(markingToEdit.markingType || "");
      setLocation(markingToEdit.location || "");
      setSite(markingToEdit.site || "");
      setDetails(markingToEdit.details || "");
    }
  }, [markingToEdit, initialDate]);

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
    if (!site) newErrors.site = "Seleccione una sede.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);

    // Convertir hora HH:MM a formato string (para mantener consistencia con el modelo)
    const [hours, minutes] = time.split(":").map(Number);
    const timeDecimal = hours + minutes / 60;

    const markingData: Marking = {
      id: markingToEdit?.id || `mark-${Date.now()}`,
      dateStr: date,
      time: timeDecimal.toString(),
      markingType,
      location,
      site,
      details,
      // Determinar el tipo basado en el tipo de marcaje seleccionado
      type:
        markingType.includes("Entrada") || markingType.includes("Mañana")
          ? "ENTRADA"
          : markingType.includes("Salida") ||
            markingType.includes("Tarde") ||
            markingType.includes("Noche")
          ? "SALIDA"
          : markingType.includes("Pausa")
          ? "INICIO_DESCANSO"
          : "FIN_DESCANSO",
      createdBy: markingToEdit?.createdBy || "Usuario manual",
      employeeId: markingToEdit?.employeeId || "emp-123",
      status: markingToEdit?.status || "PENDING",
    };

    console.log(
      `${isEditing ? "Actualizando" : "Creando"} marcaje:`,
      markingData
    );

    // Simular una petición al servidor
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsSubmitting(false);
    onSubmitSuccess(
      `Marcaje ${isEditing ? "actualizado" : "agregado"} correctamente.`
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="date">Día</Label>
          <Input
            id="date"
            type="date"
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
        <Label htmlFor="site">Sede</Label>
        <Select value={site} onValueChange={setSite}>
          <SelectTrigger id="site">
            <SelectValue placeholder="Seleccione sede..." />
          </SelectTrigger>
          <SelectContent className="bg-white">
            {mockSites.map((siteOption) => (
              <SelectItem key={siteOption} value={siteOption}>
                <MapPin className="inline-block mr-2 h-3 w-3 text-gray-500" />
                {siteOption}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.site && (
          <p className="text-red-500 text-xs mt-1">{errors.site}</p>
        )}
      </div>

      <div>
        <Label htmlFor="markingType">Tipo de Marcaje</Label>
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
          {isSubmitting ? "Guardando..." : isEditing ? "Actualizar" : "Guardar"}
        </Button>
      </div>
    </form>
  );
}

export default AddMarkingForm;
