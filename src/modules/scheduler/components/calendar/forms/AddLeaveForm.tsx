// src/components/forms/AddLeaveForm.tsx
"use client";
import React, { useState } from "react";
import { Repeat, Tag, UserCheck } from "lucide-react";
import { Input } from "../../ui/input";
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
import { Switch } from "../../ui/switch"; // Asumiendo Switch
import { Checkbox } from "../../ui/checkbox"; // Asumiendo Checkbox
import FileUploader from "./ui/FileUploader";

// --- Mock Data Interna ---
const mockLeaveTypes = [
  "Vacaciones Anuales",
  "Enfermedad Común",
  "Permiso Personal",
  "Cita Médica",
  "Licencia Paternidad",
];
const mockApprovalLevels = [
  "Nivel 1 - Supervisor Directo",
  "Nivel 2 - RRHH",
  "Nivel 3 - Gerencia",
];
const mockRecurrencePatterns = ["No se repite", "Diario", "Semanal", "Mensual"];
const weekDays = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];
// --- Fin Mock Data ---

interface AddLeaveFormProps {
  initialStartDate: string;
  initialStartTime: string;
  // leaveTypes?: string[]; // Ya no se usan como props
  // approvalLevels?: string[];
  // recurrencePatterns?: string[];
  onClose: () => void;
  onSubmitSuccess: (message: string) => void;
}

export function AddLeaveForm({
  initialStartDate,
  initialStartTime,
  onClose,
  onSubmitSuccess,
}: AddLeaveFormProps) {
  const [leaveType, setLeaveType] = useState(""); // Inicia vacío para placeholder
  const [description, setDescription] = useState("");
  const [approvalLevel, setApprovalLevel] = useState(""); // Inicia vacío
  const [startDate, setStartDate] = useState(initialStartDate);
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endDate, setEndDate] = useState(initialStartDate);
  const [endTime, setEndTime] = useState("12:00");
  const [recurrencePattern, setRecurrencePattern] = useState(
    mockRecurrencePatterns[0]
  ); // Asegura valor inicial
  const [recurrenceValue, setRecurrenceValue] = useState("1");
  const [selectedWeekDays, setSelectedWeekDays] = useState<string[]>([]);
  const [overwrite, setOverwrite] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleWeekDayChange = (day: string, checked: boolean | string) => {
    setSelectedWeekDays((prev) =>
      checked === true ? [...prev, day] : prev.filter((d) => d !== day)
    );
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!leaveType) newErrors.leaveType = "Seleccione un tipo de licencia.";
    if (!description.trim())
      newErrors.description = "La descripción es requerida.";
    if (!startDate) newErrors.startDate = "Fecha inicio requerida.";
    if (!startTime) newErrors.startTime = "Hora inicio requerida.";
    if (!endDate) newErrors.endDate = "Fecha final requerida.";
    if (!endTime) newErrors.endTime = "Hora final requerida.";

    // *** CORRECCIÓN: Verifica que recurrencePattern exista antes de usar '===' o '.includes()' ***
    if (
      recurrencePattern &&
      recurrencePattern === "Semanal" &&
      selectedWeekDays.length === 0
    ) {
      newErrors.weekDays =
        "Seleccione al menos un día si la recurrencia es semanal.";
    }
    if (
      recurrencePattern &&
      recurrencePattern !== "No se repite" &&
      (!recurrenceValue || parseInt(recurrenceValue, 10) < 1)
    ) {
      newErrors.recurrenceValue = "El valor de recurrencia debe ser mayor a 0.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    console.log("Enviando datos de licencia/permiso:", {
      leaveType,
      description,
      approvalLevel,
      startDate,
      startTime,
      endDate,
      endTime,
      recurrencePattern,
      recurrenceValue,
      selectedWeekDays,
      overwrite,
    });
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    onSubmitSuccess("Licencia/Permiso agregado correctamente.");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="leaveType">Licencia o permiso</Label>
          <Select value={leaveType} onValueChange={setLeaveType}>
            <SelectTrigger id="leaveType">
              <SelectValue placeholder="Buscar..." />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {mockLeaveTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  <Tag className="inline-block mr-2 h-4 w-4 text-gray-500" />
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.leaveType && (
            <p className="text-red-500 text-xs mt-1">{errors.leaveType}</p>
          )}
        </div>
        <div>
          <Label htmlFor="approvalLevel">Nivel de aprobación</Label>
          <Select value={approvalLevel} onValueChange={setApprovalLevel}>
            <SelectTrigger id="approvalLevel">
              <SelectValue placeholder="Seleccione nivel..." />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {mockApprovalLevels.map((level) => (
                <SelectItem key={level} value={level}>
                  <UserCheck className="inline-block mr-2 h-4 w-4 text-gray-500" />
                  {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descripción detallada..."
          rows={3}
        />
        {errors.description && (
          <p className="text-red-500 text-xs mt-1">{errors.description}</p>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <Label htmlFor="startDate">Fecha inicio</Label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          {errors.startDate && (
            <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>
          )}
        </div>
        <div>
          <Label htmlFor="startTime">Hora inicio</Label>
          <Input
            id="startTime"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
          {errors.startTime && (
            <p className="text-red-500 text-xs mt-1">{errors.startTime}</p>
          )}
        </div>
        <div>
          <Label htmlFor="endDate">Fecha final</Label>
          <Input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          {errors.endDate && (
            <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>
          )}
        </div>
        <div>
          <Label htmlFor="endTime">Hora final</Label>
          <Input
            id="endTime"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
          {errors.endTime && (
            <p className="text-red-500 text-xs mt-1">{errors.endTime}</p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div>
          <Label htmlFor="recurrencePattern">Patrón de recurrencia</Label>
          <Select
            value={recurrencePattern}
            onValueChange={setRecurrencePattern}
          >
            <SelectTrigger id="recurrencePattern">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {mockRecurrencePatterns.map((pattern) => (
                <SelectItem key={pattern} value={pattern}>
                  <Repeat className="inline-block mr-2 h-4 w-4 text-gray-500" />
                  {pattern}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="recurrenceValue">Valor</Label>
          <Input
            id="recurrenceValue"
            type="number"
            min="1"
            value={recurrenceValue}
            onChange={(e) => setRecurrenceValue(e.target.value)}
            disabled={
              !recurrencePattern || recurrencePattern === "No se repite"
            }
          />
          {errors.recurrenceValue && (
            <p className="text-red-500 text-xs mt-1">
              {errors.recurrenceValue}
            </p>
          )}
        </div>
        {/* Conditional rendering for week days based on corrected check */}
        {recurrencePattern && recurrencePattern === "Semanal" && (
          <div className="md:col-span-3">
            <Label>Días de la semana</Label>
            <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 p-2 border rounded-md">
              {weekDays.map((day) => (
                <div key={day} className="flex items-center space-x-2">
                  <Checkbox
                    id={`day-${day}`}
                    checked={selectedWeekDays.includes(day)}
                    onCheckedChange={(checked) =>
                      handleWeekDayChange(day, checked)
                    }
                  />
                  <Label
                    htmlFor={`day-${day}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {day}
                  </Label>
                </div>
              ))}
            </div>
            {errors.weekDays && (
              <p className="text-red-500 text-xs mt-1">{errors.weekDays}</p>
            )}
          </div>
        )}
        {/* Placeholder div if not weekly to maintain grid alignment */}
        {(!recurrencePattern || recurrencePattern !== "Semanal") && (
          <div className="md:col-span-1"></div>
        )}
      </div>
      <div className="flex items-center justify-between flex-wrap gap-4 pt-2">
        <FileUploader
          onFileSelect={(file) => {
            console.log("Archivo seleccionado:", file?.name);
            // Puedes guardar el archivo en el estado si es necesario
          }}
          acceptedFileTypes=".pdf,.doc,.docx,.jpg,.png"
          maxFileSize={10 * 1024 * 1024} // 10MB
        />
        <div className="flex items-center space-x-2">
          <Switch
            id="overwrite"
            checked={overwrite}
            onCheckedChange={setOverwrite}
            className="data-[state=checked]:bg-blue-500"
          />
          <Label htmlFor="overwrite">Sobreescribir</Label>
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
