"use client";

import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import {
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  isSameDay,
  isWithinInterval,
  differenceInDays,
  isBefore,
  isAfter,
} from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarNewProps {
  mode?: "single" | "range";
  selected?: {
    from: Date;
    to?: Date;
  };
  onSelect?: (range: { from: Date; to?: Date } | undefined) => void;
  defaultMonth?: Date;
  numberOfMonths?: number;
  className?: string;
  showFooter?: boolean;
}

export default function CalendarNew({
  mode = "range",
  selected,
  onSelect,
  defaultMonth = new Date(),
  numberOfMonths = 2,
  className = "",
  showFooter = true,
}: CalendarNewProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(defaultMonth);
  // Inicialmente no seleccionamos ninguna fecha, solo mostramos el día actual
  const [rangeStart, setRangeStart] = useState<Date | null>(null);
  const [rangeEnd, setRangeEnd] = useState<Date | null>(null);
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

  // Actualizamos las fechas seleccionadas solo cuando el componente se monta o cuando cambia el prop selected
  useEffect(() => {
    // Solo establecemos valores desde props cuando hacemos un reset o cuando ya tenemos un rango seleccionado
    // Si es la primera vez que se abre el calendario, no preseleccionamos nada
    if (selected?.from && selected?.to) {
      setRangeStart(selected.from);
      setRangeEnd(selected.to);
    } else {
      // Si no hay un rango completo, reiniciamos la selección
      setRangeStart(null);
      setRangeEnd(null);
    }
  }, [selected]);

  const handlePreviousMonth = () => {
    setCurrentMonth((prev) => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => addMonths(prev, 1));
  };

  const handleDateClick = (date: Date) => {
    if (mode === "single") {
      setRangeStart(date);
      setRangeEnd(null);
      onSelect?.({ from: date });
      return;
    }

    // Range selection logic
    if (!rangeStart || (rangeStart && rangeEnd)) {
      setRangeStart(date);
      setRangeEnd(null);
      onSelect?.({ from: date });
    } else {
      // If clicked date is before range start, swap them
      if (date < rangeStart) {
        setRangeEnd(rangeStart);
        setRangeStart(date);
        onSelect?.({ from: date, to: rangeStart });
      } else {
        setRangeEnd(date);
        onSelect?.({ from: rangeStart, to: date });
      }
    }
  };

  const handleDateHover = (date: Date) => {
    setHoveredDate(date);
  };

  const renderMonth = (monthOffset: number) => {
    const month = addMonths(currentMonth, monthOffset);
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const allDays = eachDayOfInterval({
      start: calendarStart,
      end: calendarEnd,
    });

    // Group days into weeks
    const weeks: Date[][] = [];
    let week: Date[] = [];

    allDays.forEach((day, i) => {
      week.push(day);
      if (week.length === 7 || i === allDays.length - 1) {
        weeks.push(week);
        week = [];
      }
    });

    const isDateInSelectedRange = (date: Date) => {
      if (!rangeStart) return false;

      if (rangeEnd) {
        // Aseguramos que start sea siempre la fecha anterior
        const start = isBefore(rangeStart, rangeEnd) ? rangeStart : rangeEnd;
        const end = isAfter(rangeEnd, rangeStart) ? rangeEnd : rangeStart;

        return isWithinInterval(date, { start, end });
      }

      if (hoveredDate && rangeStart) {
        const tempStart = isBefore(rangeStart, hoveredDate)
          ? rangeStart
          : hoveredDate;
        const tempEnd = isAfter(hoveredDate, rangeStart)
          ? hoveredDate
          : rangeStart;

        return isWithinInterval(date, {
          start: tempStart,
          end: tempEnd,
        });
      }

      return isSameDay(date, rangeStart);
    };

    const isRangeStartDate = (date: Date) =>
      rangeStart && isSameDay(date, rangeStart);

    const isRangeEndDate = (date: Date) =>
      rangeEnd && isSameDay(date, rangeEnd);

    return (
      <div className="month-container">
        <div className="p-2 text-center font-medium">
          {format(month, "MMMM yyyy", { locale: es })}
        </div>
        <div className="grid grid-cols-7 mb-1 text-center text-xs">
          {["lu", "ma", "mi", "ju", "vi", "sá", "do"].map((day, i) => (
            <div
              key={i}
              className="h-8 flex items-center justify-center font-medium"
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {weeks.map((week, weekIndex) => (
            <React.Fragment key={weekIndex}>
              {week.map((day, dayIndex) => {
                const isSelected = isDateInSelectedRange(day);
                const isStart = isRangeStartDate(day);
                const isEnd = isRangeEndDate(day);
                const isCurrentMonth = isSameMonth(day, month);
                const isTodayDate = isToday(day);

                let dayClassNames =
                  "h-10 w-10 p-0 relative flex items-center justify-center ";

                if (!isCurrentMonth) {
                  dayClassNames += "text-muted-foreground ";
                }

                // Aplicar estilo a días seleccionados en el rango (pero no los extremos)
                if (isSelected && !isStart && !isEnd) {
                  dayClassNames += "bg-blue-100 ";
                }

                // Aplicar bordes redondeados a los extremos del rango
                if (isStart && rangeEnd) {
                  dayClassNames += "rounded-l-full ";
                }

                if (isEnd && rangeStart) {
                  dayClassNames += "rounded-r-full ";
                }

                // Destacar días de inicio y fin con círculos azules
                if (isStart && rangeStart) {
                  dayClassNames += "bg-blue-500 text-white rounded-full ";
                } else if (isEnd && rangeEnd) {
                  dayClassNames += "bg-blue-500 text-white rounded-full ";
                }

                // Resaltar día actual cuando no es inicio ni fin del rango
                if (isTodayDate && !isStart && !isEnd) {
                  dayClassNames += "border border-blue-500 ";
                }

                return (
                  <div
                    key={dayIndex}
                    className="p-0 relative flex items-center justify-center"
                  >
                    <button
                      type="button"
                      className={dayClassNames}
                      onClick={() => handleDateClick(day)}
                      onMouseEnter={() => handleDateHover(day)}
                      disabled={!isCurrentMonth}
                    >
                      {format(day, "d")}
                    </button>
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  const formatSelectedRange = () => {
    if (!rangeStart) return "Selecciona un rango de fechas";

    const startFormatted = format(rangeStart, "d 'de' MMMM yyyy", {
      locale: es,
    });

    if (!rangeEnd) return `Seleccionado: ${startFormatted}`;

    const endFormatted = format(rangeEnd, "d 'de' MMMM yyyy", { locale: es });
    const dayDiff = differenceInDays(rangeEnd, rangeStart) + 1;

    return `${startFormatted} - ${endFormatted} (${dayDiff} días)`;
  };

  return (
    <div className={`calendar-new ${className}`}>
      <div className="p-4">
        <p className="font-medium mb-1">Seleccionar rango de fechas</p>
        <p className="text-sm text-muted-foreground mb-4">
          Selecciona cualquier rango de fechas que desees visualizar
        </p>

        <div className="flex items-center justify-between mb-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePreviousMonth}
            aria-label="Mes anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextMonth}
            aria-label="Mes siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {Array.from({ length: numberOfMonths }, (_, i) => (
            <div key={i} className="flex-1">
              {renderMonth(i)}
            </div>
          ))}
        </div>
      </div>

      {showFooter && (
        <div className="mt-4 p-4 flex items-center justify-between border-t">
          <Button
            variant="outline"
            onClick={() => {
              setRangeStart(null);
              setRangeEnd(null);
              onSelect?.(undefined);
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => {
              if (rangeStart && rangeEnd) {
                onSelect?.({ from: rangeStart, to: rangeEnd });
              }
            }}
            disabled={!rangeStart || !rangeEnd}
          >
            Aplicar
          </Button>
        </div>
      )}
    </div>
  );
}
