/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  isWithinInterval,
} from "date-fns";
import { useEmployees } from "../../hooks/useEmployees";
import { useEvents } from "../../hooks/useEvents";
import { useUI } from "../../hooks/useUI";
import { useFilters } from "../../hooks/useFilters"; // Añadido para acceder al dateRange
import MonthEventItem from "./MonthEventItem";
import { es } from "date-fns/locale";

interface MonthViewProps {
  startDate: Date;
  endDate: Date;
}

export default function MonthView({ startDate }: MonthViewProps) {
  const { selectedEmployees } = useEmployees();
  const { getEventsByEmployeeAndDateRange } = useEvents();
  const { openContextMenu, openAddEventModal } = useUI();
  const { dateRange } = useFilters(); // Obtenemos el rango de fechas seleccionado

  // Get all days in the month view (including days from prev/next months to fill the grid)
  // Si el rango de fechas abarca más de un mes, necesitamos mostrar varios meses
  const firstMonthStart = startOfMonth(dateRange.start);
  const lastMonthEnd = endOfMonth(dateRange.end);

  // Determinar cuántos meses necesitamos mostrar
  const diffMonths =
    (lastMonthEnd.getFullYear() - firstMonthStart.getFullYear()) * 12 +
    lastMonthEnd.getMonth() -
    firstMonthStart.getMonth() +
    1;

  // Calcular todos los meses en el rango
  const monthsInRange: Date[] = [];
  for (let i = 0; i < diffMonths; i++) {
    const currentMonth = new Date(firstMonthStart);
    currentMonth.setMonth(firstMonthStart.getMonth() + i);
    monthsInRange.push(currentMonth);
  }

  // Para la vista actual del mes seleccionado
  const monthStart = startOfMonth(startDate);
  const monthEnd = endOfMonth(startDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const allDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

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

  const handleCellContextMenu = (e: React.MouseEvent, date: Date) => {
    e.preventDefault();
    openContextMenu({ x: e.clientX, y: e.clientY }, "cell", {
      date,
      employeeId:
        selectedEmployees.length > 0 ? selectedEmployees[0].id : undefined,
    });
  };

  const handleCellDoubleClick = (e: React.MouseEvent, date: Date) => {
    e.preventDefault();
    openAddEventModal(
      date,
      selectedEmployees.length > 0 ? selectedEmployees[0].id : undefined
    );
  };

  // Verificar si una fecha está dentro del rango seleccionado
  const isDateInSelectedRange = (date: Date) => {
    return isWithinInterval(date, {
      start: dateRange.start,
      end: dateRange.end,
    });
  };

  // Función para renderizar un mes
  const renderMonth = (monthDate: Date, employee: any) => {
    const currentMonthStart = startOfMonth(monthDate);
    const currentMonthEnd = endOfMonth(monthDate);
    const currentCalendarStart = startOfWeek(currentMonthStart, {
      weekStartsOn: 1,
    });
    const currentCalendarEnd = endOfWeek(currentMonthEnd, { weekStartsOn: 1 });

    const allDaysInMonth = eachDayOfInterval({
      start: currentCalendarStart,
      end: currentCalendarEnd,
    });

    // Agrupar días en semanas
    const monthWeeks: Date[][] = [];
    let week: Date[] = [];

    allDaysInMonth.forEach((day, i) => {
      week.push(day);
      if (week.length === 7 || i === allDaysInMonth.length - 1) {
        monthWeeks.push(week);
        week = [];
      }
    });

    return (
      <div className="mb-6">
        <div className="px-4 py-2 bg-blue-50 font-medium sticky top-0 z-10 text-center">
          {format(monthDate, "MMMM yyyy", { locale: es })}
        </div>

        <div className="grid grid-cols-7 border-b border-border">
          {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day, i) => (
            <div
              key={i}
              className="h-10 flex items-center justify-center text-sm font-medium"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 border-b border-border">
          {monthWeeks.map((week, weekIndex) => (
            <React.Fragment key={weekIndex}>
              {week.map((day, dayIndex) => {
                const isCurrentMonth = isSameMonth(day, monthDate);
                const isTodayDate = isToday(day);
                const isInSelectedRange = isDateInSelectedRange(day);
                const dayEvents = getEventsByEmployeeAndDateRange(
                  employee.id,
                  day,
                  day
                );

                return (
                  <div
                    key={dayIndex}
                    className={`min-h-[100px] border-r border-b border-border p-1 ${
                      isCurrentMonth ? "" : "bg-muted/20 text-muted-foreground"
                    } ${isTodayDate ? "bg-accent/20" : ""} ${
                      isInSelectedRange ? "bg-blue-100" : ""
                    }`}
                    onContextMenu={(e) => handleCellContextMenu(e, day)}
                    onDoubleClick={(e) => handleCellDoubleClick(e, day)}
                  >
                    <div className="text-right text-sm p-1">
                      {format(day, "d")}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map((event) => (
                        <MonthEventItem key={event.id} event={event} />
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-muted-foreground text-center">
                          +{dayEvents.length - 3} más
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full overflow-auto">
      {/* Header con rango de fechas */}
      <div className="w-full text-center font-medium py-3 border-b border-border bg-blue-50 sticky top-0 z-20">
        {format(dateRange.start, "d 'de' MMMM", { locale: es })} -{" "}
        {format(dateRange.end, "d 'de' MMMM 'de' yyyy", { locale: es })}
      </div>

      {selectedEmployees.map((employee) => (
        <div key={employee.id} className="mb-8">
          <div className="px-4 py-2 bg-muted/30 font-medium sticky top-12 z-10">
            {employee.name} - {employee.department}
          </div>

          {/* Si hay más de un mes en el rango, renderizamos todos los meses */}
          {diffMonths > 1
            ? monthsInRange.map((month, index) => (
                <div key={index}>{renderMonth(month, employee)}</div>
              ))
            : // Si solo hay un mes, renderizamos el mes actual
              renderMonth(startDate, employee)}
        </div>
      ))}
    </div>
  );
}
