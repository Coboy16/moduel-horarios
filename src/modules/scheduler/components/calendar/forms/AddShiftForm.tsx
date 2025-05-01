// src/components/forms/AddShiftForm.tsx
"use client";
import React, { useState } from "react";
import { Briefcase, Building, Cog, Repeat, Moon, Sun } from "lucide-react";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Button } from "../../ui/button";
import { Switch } from "../../ui/switch";
import { Checkbox } from "../../ui/checkbox";

// --- Mock Data Interna ---
const mockWorkShifts = [
  "Turno Mañana (08-16)",
  "Turno Tarde (16-00)",
  "Turno Noche (00-08)",
  "Administrativo (09-17)",
  "Rotativo Semanal",
];
const mockSites = [
  "Sede Central - Lima",
  "Planta Producción - Arequipa",
  "Almacén Logístico - Callao",
  "Sucursal Piura",
];
const mockJobs = [
  "Operario de Producción",
  "Supervisor de Turno",
  "Asistente Administrativo",
  "Jefe de Logística",
  "Técnico Mantenimiento",
];
const mockRecurrencePatterns = ["Diario", "Semanal", "Mensual"]; // Ajustado según petición

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

interface AddShiftFormProps {
  initialStartDate: string;
  // workShifts?: string[]; // Ya no se usan como props
  // sites?: string[];
  // jobs?: string[];
  // recurrencePatterns?: string[];
  onClose: () => void;
  onSubmitSuccess: (message: string) => void;
}

export function AddShiftForm({
  initialStartDate,
  onClose,
  onSubmitSuccess,
}: AddShiftFormProps) {
  const [workShift, setWorkShift] = useState("");
  const [site, setSite] = useState("");
  const [job, setJob] = useState("");
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialStartDate);
  const [recurrencePattern, setRecurrencePattern] = useState(
    mockRecurrencePatterns[0]
  );
  const [recurrenceValue, setRecurrenceValue] = useState("1");
  const [selectedWeekDays, setSelectedWeekDays] = useState<string[]>([]);
  const [overwrite, setOverwrite] = useState(false);
  const [restDays, setRestDays] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleWeekDayChange = (day: string, checked: boolean | string) => {
    setSelectedWeekDays((prev) =>
      checked === true ? [...prev, day] : prev.filter((d) => d !== day)
    );
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!workShift) newErrors.workShift = "Seleccione un turno de trabajo.";
    if (!site) newErrors.site = "Seleccione una sede.";
    if (!startDate) newErrors.startDate = "Fecha inicio requerida.";
    if (!endDate) newErrors.endDate = "Fecha final requerida.";
    if (recurrencePattern === "Semanal" && selectedWeekDays.length === 0) {
      newErrors.weekDays =
        "Seleccione al menos un día si la recurrencia es semanal.";
    }
    if (
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
    console.log("Enviando datos de horario:", {
      workShift,
      site,
      job,
      startDate,
      endDate,
      recurrencePattern,
      recurrenceValue,
      selectedWeekDays,
      overwrite,
      restDays,
    });
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    onSubmitSuccess("Horario agregado correctamente.");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="workShift">Turno de trabajo</Label>
          <Select value={workShift} onValueChange={setWorkShift}>
            <SelectTrigger id="workShift">
              <SelectValue placeholder="Buscar..." />
            </SelectTrigger>
            <SelectContent>
              {mockWorkShifts.map((shift) => (
                <SelectItem key={shift} value={shift}>
                  <Briefcase className="inline-block mr-2 h-4 w-4 text-gray-500" />
                  {shift}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.workShift && (
            <p className="text-red-500 text-xs mt-1">{errors.workShift}</p>
          )}
        </div>
        <div>
          <Label htmlFor="site">Sede</Label>
          <Select value={site} onValueChange={setSite}>
            <SelectTrigger id="site">
              <SelectValue placeholder="Sede..." />
            </SelectTrigger>
            <SelectContent>
              {mockSites.map((s) => (
                <SelectItem key={s} value={s}>
                  <Building className="inline-block mr-2 h-4 w-4 text-gray-500" />
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.site && (
            <p className="text-red-500 text-xs mt-1">{errors.site}</p>
          )}
        </div>
        <div>
          <Label htmlFor="job">Trabajo</Label>
          <Select value={job} onValueChange={setJob}>
            <SelectTrigger id="job">
              <SelectValue placeholder="Buscar..." />
            </SelectTrigger>
            <SelectContent>
              {mockJobs.map((j) => (
                <SelectItem key={j} value={j}>
                  <Cog className="inline-block mr-2 h-4 w-4 text-gray-500" />
                  {j}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <div className="flex items-center space-x-2">
          {" "}
          <Switch
            id="overwrite-shift"
            checked={overwrite}
            onCheckedChange={setOverwrite}
            className="data-[state=checked]:bg-blue-500"
          />{" "}
          <Label htmlFor="overwrite-shift">Sobreescribir</Label>{" "}
        </div>
        <div className="flex items-center space-x-2">
          {" "}
          <Switch
            id="restDays"
            checked={restDays}
            onCheckedChange={setRestDays}
            className="data-[state=checked]:bg-blue-500"
          />{" "}
          <Label htmlFor="restDays">Días de descanso</Label>{" "}
          {restDays ? (
            <Moon className="h-4 w-4 text-blue-500" />
          ) : (
            <Sun className="h-4 w-4 text-yellow-500" />
          )}{" "}
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t mt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cerrar
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
