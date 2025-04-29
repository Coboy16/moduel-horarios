"use client";

import { useState, useEffect, useRef } from "react";
import { useFilters } from "../../hooks/useFilters";
import { Button } from "../ui/button";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { ChevronLeft, ChevronRight } from "lucide-react";
// import WeekView from "./WeekView";
import MonthView from "./MonthView";
import TimelineView from "./TimelineView";
import CalendarHeader from "./CalendarHeader";
import { useEmployees } from "../../hooks/useEmployees";
import { useEvents } from "../../hooks/useEvents";
import { useMarkings } from "../../hooks/useMarkings";
import {
  addDays,
  addMonths,
  addWeeks,
  subDays,
  subMonths,
  subWeeks,
  startOfWeek,
  endOfWeek,
} from "date-fns";

export default function SchedulerCalendar() {
  const { currentView, dateRange, setDateRange, setCurrentView } = useFilters();
  const { selectedEmployees } = useEmployees();
  const { events } = useEvents();
  const { markings } = useMarkings();
  const calendarContainerRef = useRef<HTMLDivElement>(null);
  const [calendarWidth, setCalendarWidth] = useState(0);
  const [calendarHeight, setCalendarHeight] = useState(0);

  // Update calendar dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (calendarContainerRef.current) {
        setCalendarWidth(calendarContainerRef.current.offsetWidth);
        // Restamos la altura del header del calendario (aprox 65px) u otros elementos fijos si los hay
        const headerHeight =
          calendarContainerRef.current.querySelector("[data-calendar-header]")
            ?.clientHeight ?? 65;
        setCalendarHeight(
          calendarContainerRef.current.offsetHeight - headerHeight
        );
      } else {
        // Fallback a dimensiones de ventana si el ref no está listo
        setCalendarWidth(window.innerWidth * 0.7); // Asumiendo que ocupa ~70%
        setCalendarHeight(window.innerHeight - 150); // Estimando altura de otros elementos
      }
    };

    // Llama una vez al montar y en resize
    updateDimensions();
    window.addEventListener("resize", updateDimensions);

    // Observer para cambios de tamaño del contenedor si la ventana no cambia
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (calendarContainerRef.current) {
      resizeObserver.observe(calendarContainerRef.current);
    }

    return () => {
      window.removeEventListener("resize", updateDimensions);
      if (calendarContainerRef.current) {
        resizeObserver.unobserve(calendarContainerRef.current);
      }
    };
  }, []);

  // Ajustar el cálculo de la fecha de inicio/fin de semana
  const getWeekRange = (date: Date): { start: Date; end: Date } => {
    const start = startOfWeek(date, { weekStartsOn: 1 }); // Lunes como inicio de semana
    const end = endOfWeek(date, { weekStartsOn: 1 });
    return { start, end };
  };

  // Navigation functions
  const navigatePrevious = () => {
    const { start } = dateRange; // Solo necesitamos start para calcular el nuevo rango
    let newStart: Date;
    let newEnd: Date;

    switch (currentView) {
      case "day":
        newStart = subDays(start, 1);
        newEnd = newStart;
        break;
      case "week": {
        const prevWeek = getWeekRange(subWeeks(start, 1));
        newStart = prevWeek.start;
        newEnd = prevWeek.end;
        break;
      }
      case "month": {
        const prevMonth = subMonths(start, 1);
        newStart = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), 1);
        newEnd = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0);
        break;
      }
      case "timeline": // Timeline navega por día
        newStart = subDays(start, 1);
        newEnd = newStart;
        break;
      default:
        return; // No hacer nada si la vista no es válida
    }
    setDateRange(newStart, newEnd);
  };

  const navigateNext = () => {
    const { start } = dateRange;
    let newStart: Date;
    let newEnd: Date;

    switch (currentView) {
      case "day":
        newStart = addDays(start, 1);
        newEnd = newStart;
        break;
      case "week": {
        const nextWeek = getWeekRange(addWeeks(start, 1));
        newStart = nextWeek.start;
        newEnd = nextWeek.end;
        break;
      }
      case "month": {
        const nextMonth = addMonths(start, 1);
        newStart = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1);
        newEnd = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0);
        break;
      }
      case "timeline":
        newStart = addDays(start, 1);
        newEnd = newStart;
        break;
      default:
        return;
    }
    setDateRange(newStart, newEnd);
  };

  const navigateToday = () => {
    const today = new Date();
    let newStart: Date;
    let newEnd: Date;

    switch (currentView) {
      case "day":
        newStart = today;
        newEnd = today;
        break;
      case "week": {
        const currentWeek = getWeekRange(today);
        newStart = currentWeek.start;
        newEnd = currentWeek.end;
        break;
      }
      case "month": {
        newStart = new Date(today.getFullYear(), today.getMonth(), 1);
        newEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      }
      case "timeline":
        newStart = today;
        newEnd = today;
        break;
      default:
        return;
    }
    setDateRange(newStart, newEnd);
  };

  // Determinar el texto del botón según la vista actual
  const getTodayButtonText = () => {
    switch (currentView) {
      case "month":
        return "Mes actual";
      case "week":
        return "Semana actual";
      case "timeline":
        return "Día actual";
      default:
        return "Hoy";
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* --- Header --- */}
      <div
        data-calendar-header
        className="p-4 border-b border-border flex items-center justify-between flex-shrink-0"
      >
        {/* Controles de Navegación */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={navigatePrevious}
            aria-label={
              currentView === "timeline" ? "Día anterior" : "Mes anterior"
            }
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={navigateToday}>
            {getTodayButtonText()}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={navigateNext}
            aria-label={
              currentView === "timeline" ? "Día siguiente" : "Mes siguiente"
            }
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Título del Calendario */}
        <CalendarHeader />

        {/* Selector de Vistas */}
        <Tabs
          value={currentView}
          onValueChange={(value: string) =>
            setCurrentView(value as "day" | "week" | "month" | "timeline")
          }
          className="w-auto"
          defaultValue="timeline"
        >
          <TabsList>
            {/* <TabsTrigger value="day">Día</TabsTrigger> */}
            {/* <TabsTrigger value="week">Semana</TabsTrigger> */}
            <TabsTrigger value="month">Mes</TabsTrigger>
            <TabsTrigger value="timeline">Línea de tiempo</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* --- Contenedor del Calendario (para medir tamaño) --- */}
      <div
        ref={calendarContainerRef}
        className="flex-1 overflow-hidden relative"
      >
        {/* Renderizar la vista activa solo si las dimensiones son válidas */}
        {calendarWidth > 0 && calendarHeight > 0 && (
          <>
            {/* {currentView === "day" && selectedEmployees.length > 0 && (
              <DayView
                startDate={dateRange.start}
                endDate={dateRange.end}
                events={events}
                markings={markings}
                employees={selectedEmployees}
                containerWidth={calendarWidth}
                containerHeight={calendarHeight}
              />
            )} */}
            {/* {currentView === "week" && selectedEmployees.length > 0 && (
              <WeekView
                startDate={dateRange.start}
                endDate={dateRange.end}
                events={events}
                markings={markings}
                employees={selectedEmployees}
                containerWidth={calendarWidth}
                containerHeight={calendarHeight}
              />
            )} */}
            {currentView === "month" && selectedEmployees.length > 0 && (
              <MonthView startDate={dateRange.start} endDate={dateRange.end} />
            )}
            {currentView === "timeline" && (
              <TimelineView
                currentDate={dateRange.start}
                events={events}
                markings={markings}
                employees={selectedEmployees}
                containerWidth={calendarWidth}
                containerHeight={calendarHeight}
              />
            )}
            {/* Mensaje si no hay empleados seleccionados y no estamos en timeline */}
            {selectedEmployees.length === 0 && currentView !== "timeline" && (
              <div className="p-10 text-center text-muted-foreground">
                Selecciona al menos un empleado para ver el calendario.
              </div>
            )}
          </>
        )}
        {/* Indicador de carga o tamaño inválido */}
        {(calendarWidth <= 0 || calendarHeight <= 0) && (
          <div className="p-10 text-center text-muted-foreground">
            Cargando calendario...
          </div>
        )}
      </div>
    </div>
  );
}
