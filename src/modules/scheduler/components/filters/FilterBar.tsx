"use client";

import { useState } from "react";
import { useFilters } from "../../hooks/useFilters";
import { useEvents } from "../../hooks/useEvents";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { CalendarIcon, Filter, X } from "lucide-react";
import { formatDateRange } from "../../utils/dateUtils";
import CalendarNew from "../calendar/CalendarNew";

export default function FilterBar() {
  const {
    currentView,
    dateRange,
    setDateRange,
    eventTypeFilters,
    toggleEventTypeFilter,
    resetFilters,
    setCurrentView,
  } = useFilters();

  const { eventTypes } = useEvents();

  const [showFilters, setShowFilters] = useState(false);

  // Función para manejar el cambio de rango de fechas
  const handleDateRangeChange = (
    range: { from: Date; to?: Date } | undefined
  ) => {
    if (range?.from && range?.to) {
      // Actualizar el rango de fechas primero
      setDateRange(range.from, range.to);

      // Usar un timeout para evitar el cambio inmediato de vista que puede causar bucles
      setTimeout(() => {
        // Determinar automáticamente la vista según el rango de fechas seleccionado
        const diffInDays = Math.round(
          Math.abs(
            ((range.to?.getTime() ?? range.from.getTime()) -
              range.from.getTime()) /
              (1000 * 60 * 60 * 24)
          )
        );

        if (diffInDays <= 7) {
          // Para periodos de una semana o menos, usar vista semanal
          setCurrentView("week");
        } else {
          // Para periodos más largos, usar vista mensual
          setCurrentView("month");
        }
      }, 50);
    }
  };

  return (
    <div className="p-4 border-b border-border bg-card">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                <span>
                  {formatDateRange(dateRange.start, dateRange.end, currentView)}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarNew
                mode="range"
                defaultMonth={dateRange.start}
                selected={{
                  from: dateRange.start,
                  to: dateRange.end,
                }}
                onSelect={handleDateRangeChange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? "bg-accent" : ""}
          >
            <Filter className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="text-muted-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Limpiar filtros
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="mt-4 flex flex-wrap gap-2">
          <div>
            <span className="text-sm font-medium mr-2">Tipos de eventos:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {eventTypes.map((type) => (
                <Button
                  key={type.id}
                  variant="outline"
                  size="sm"
                  className={`flex items-center gap-1 ${
                    eventTypeFilters.includes(type.id) ? "bg-accent" : ""
                  }`}
                  onClick={() => toggleEventTypeFilter(type.id)}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: type.color }}
                  />
                  {type.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
