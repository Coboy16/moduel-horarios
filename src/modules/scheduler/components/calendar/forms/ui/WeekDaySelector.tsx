"use client";
import React, { useState, useRef, useEffect } from "react";
import { X, ChevronDown } from "lucide-react";

interface WeekDaySelectorProps {
  selectedDays: string[];
  onChange: (days: string[]) => void;
  availableDays?: string[];
  className?: string;
  errorMessage?: string;
}

export const WeekDaySelector: React.FC<WeekDaySelectorProps> = ({
  selectedDays,
  onChange,
  availableDays = [
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
    "Domingo",
  ],
  className = "",
  errorMessage,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Manejador para cerrar el dropdown cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Alternar día seleccionado
  const toggleDay = (day: string) => {
    const updatedDays = selectedDays.includes(day)
      ? selectedDays.filter((d) => d !== day)
      : [...selectedDays, day];
    onChange(updatedDays);
  };

  // Eliminar día de la selección
  const removeDay = (day: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar que se abra el dropdown
    onChange(selectedDays.filter((d) => d !== day));
  };

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      <div
        className={`flex min-h-10 flex-wrap gap-1 rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer ${
          errorMessage ? "border-red-500" : ""
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedDays.length > 0 ? (
          selectedDays.map((day) => (
            <span
              key={day}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
            >
              {day}
              <button
                type="button"
                onClick={(e) => removeDay(day, e)}
                className="ml-1 text-blue-600 hover:text-blue-800"
              >
                <X size={14} />
              </button>
            </span>
          ))
        ) : (
          <span className="text-muted-foreground">Seleccionar días...</span>
        )}
        <span className="ml-auto self-center">
          <ChevronDown
            size={16}
            className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </span>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
          <div className="py-1">
            {availableDays.map((day) => (
              <div
                key={day}
                className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 ${
                  selectedDays.includes(day) ? "bg-gray-50" : ""
                }`}
                onClick={() => toggleDay(day)}
              >
                {day}
              </div>
            ))}
          </div>
        </div>
      )}

      {errorMessage && (
        <p className="text-red-500 text-xs mt-1">{errorMessage}</p>
      )}
    </div>
  );
};

export default WeekDaySelector;
