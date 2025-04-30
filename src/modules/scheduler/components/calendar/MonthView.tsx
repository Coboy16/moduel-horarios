/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { useState, useCallback } from "react";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  getDay,
  isBefore,
  startOfDay,
  isAfter, // Importar isAfter
} from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "../../utils/formatters"; // Ajusta la ruta

// Tooltip
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip"; // Ajusta la ruta

// Componentes Menú y Timeline
import { CustomContextMenu } from "./menus/CustomContextMenu"; // Ajusta ruta
import { WorkedBarContextMenuContent } from "./menus/WorkedBarContextMenu"; // Ajusta ruta
import { GridCellContextMenuContent } from "./menus/GridCellContextMenu"; // Ajusta ruta
import { DayTimeline } from "./DayTimeline"; // Importa DayTimeline

// Mock Data
import {
  Employee,
  mockEmployees,
  mockMarkings,
  mockSchedules,
  mockWorkedTimes,
} from "../../tem/week_view"; // Ajusta ruta

// Hook Filtros
const useFilters = () => ({
  dateRange: { start: new Date(), end: endOfMonth(new Date()) },
});

// Props
interface MonthViewProps {
  employees?: Employee[];
}

// Estado Menú
interface MenuState {
  isOpen: boolean;
  position: { x: number; y: number };
  type: "worked" | "grid" | null;
  data: any;
}
const initialMenuState: MenuState = {
  isOpen: false,
  position: { x: 0, y: 0 },
  type: null,
  data: null,
};

// Mapeo día
const dayKeyMap: { [key: number]: string } = {
  1: "lun",
  2: "mar",
  3: "mié",
  4: "jue",
  5: "vie",
  6: "sáb",
  0: "dom",
};

// Componente Principal
export default function MonthView({ employees }: MonthViewProps) {
  const { dateRange } = useFilters();
  const [menuState, setMenuState] = useState<MenuState>(initialMenuState);

  const employeesToDisplay =
    employees && employees.length > 0 ? employees : mockEmployees;

  // Lógica Un Mes
  const displayMonthDate = startOfMonth(dateRange.start);
  const monthStart = startOfMonth(displayMonthDate);
  const monthEnd = endOfMonth(displayMonthDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const allDaysInMonthView = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });
  const monthWeeks: Date[][] = [];
  let week: Date[] = [];
  allDaysInMonthView.forEach((day, i) => {
    week.push(day);
    if ((i + 1) % 7 === 0) {
      monthWeeks.push(week);
      week = [];
    }
  });

  const todayDate = startOfDay(new Date());

  // Handlers Menú y Acciones (sin cambios funcionales)
  const handleContextMenu = useCallback(
    /* ... */ (
      event: React.MouseEvent<HTMLDivElement>,
      type: "worked" | "grid",
      data: any
    ) => {
      event.preventDefault();
      event.stopPropagation();
      let menuData = data;
      if (type === "grid") {
        const date = data.date as Date;
        const clickedTime = 12.0;
        const formattedTime = formatTime(clickedTime);
        const dateStr = format(date, "P", { locale: es });
        menuData = {
          ...data,
          clickedTime,
          formattedDateTime: `${dateStr} - ${formattedTime}`,
        };
      }
      setMenuState({
        isOpen: true,
        position: { x: event.clientX, y: event.clientY },
        type: type,
        data: menuData,
      });
    },
    []
  );
  const closeContextMenu = useCallback(() => {
    setMenuState(initialMenuState);
  }, []);
  const handleViewDetails = (id: string) => {
    console.log("Ver detalle:", id);
    closeContextMenu();
  };
  const handleCopy = (type: string, id: string) => {
    console.log("Copiar", type, id);
    closeContextMenu();
  };
  const handleDelete = (id: string) => {
    console.log("Eliminar:", id);
    closeContextMenu();
  };
  const handleAddMarking = (empId: string, date: Date) => {
    console.log("Agregar Marcaje:", empId, format(date, "yyyy-MM-dd"));
    closeContextMenu();
  };
  const handleAddLeave = (empId: string, date: Date) => {
    console.log("Agregar Licencia:", empId, format(date, "yyyy-MM-dd"));
    closeContextMenu();
  };
  const handleAddShift = (empId: string, date: Date) => {
    console.log("Agregar Turno:", empId, format(date, "yyyy-MM-dd"));
    closeContextMenu();
  };

  // Helpers
  const getDayKeyFromDate = (date: Date): string => {
    const d = getDay(date);
    return dayKeyMap[d] || "unknown";
  };
  const formatTime = (decimalTime: number): string => {
    const tM = Math.round(decimalTime * 60);
    const h = Math.floor(tM / 60);
    const m = tM % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  };

  // Render Checks
  if (employeesToDisplay.length === 0) {
    return (
      <div className="flex justify-center items-center h-60 text-gray-500">
        No hay empleados para mostrar.
      </div>
    );
  }

  // Estilos
  const headerBgColor = "bg-blue-100";
  const headerTextColor = "text-blue-800";
  const borderColor = "border-blue-200";
  const todayBgColor = "bg-blue-50";
  const otherMonthBgColor = "bg-gray-50";
  const otherMonthTextColor = "text-gray-400";
  const mainBgColor = "bg-white";
  const employeeHeaderBg = "bg-gray-100";
  // const fallbackOpacity = "opacity-60"; // Variable ya no se usa para aplicar clase

  // Dimensiones
  const estimatedCellWidth =
    typeof window !== "undefined" ? Math.max(100, window.innerWidth / 8) : 150;
  const estimatedTimelineHeight = 28;

  return (
    <TooltipProvider>
      <div
        className={`h-full overflow-auto ${mainBgColor}`}
        onClick={() => menuState.isOpen && closeContextMenu()}
      >
        {/* Header General Rango */}
        <div
          className={cn(
            "w-full text-center text-sm font-medium py-2 border-b sticky top-0 z-20",
            headerBgColor,
            headerTextColor,
            borderColor
          )}
        >
          {format(dateRange.start, "d 'de' MMMM", { locale: es })} -{" "}
          {format(dateRange.end, "d 'de' MMMM 'de' yyyy", { locale: es })}
        </div>

        {employeesToDisplay.map((employee) => (
          <div key={employee.id} className={`mb-0 border-b-4 ${borderColor}`}>
            {/* Header Empleado con Tooltip */}
            <Tooltip delayDuration={150}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "px-4 py-1.5 font-semibold text-sm sticky z-10 border-b cursor-default",
                    employeeHeaderBg,
                    borderColor,
                    "top-[40px]"
                  )}
                >
                  {employee.name} - {employee.department}
                </div>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                align="start"
                className="bg-slate-800 text-white p-3 rounded-md shadow-lg text-xs border border-slate-700 w-60"
              >
                {/* ... Contenido Tooltip ... */}
                <div className="font-bold text-sm mb-2">{employee.name}</div>
                <div className="space-y-1">
                  <div>
                    <span className="font-medium">Num. documento:</span>{" "}
                    {employee.documentNumber ?? "N/A"}
                  </div>
                  <div>
                    <span className="font-medium">Tipo Persona:</span>{" "}
                    {employee.personType ?? "N/A"}
                  </div>
                  <div>
                    <span className="font-medium">Contrato:</span>{" "}
                    {employee.contractInfo ?? "N/A"}
                  </div>
                  <div>
                    <span className="font-medium">Sede:</span>{" "}
                    {employee.site ?? "N/A"}
                  </div>
                  <div>
                    <span className="font-medium">Departamento:</span>{" "}
                    {employee.department ?? "N/A"}
                  </div>
                  <div>
                    <span className="font-medium">Cargo:</span>{" "}
                    {employee.position ?? "N/A"}
                  </div>
                  <hr className="border-slate-600 my-2" />
                  <div>
                    <span className="font-medium">Trabajadas:</span>{" "}
                    {employee.workedHours ?? "N/A"}
                  </div>
                  <div>
                    <span className="font-medium">Ordinarias:</span>{" "}
                    {employee.ordinaryHours ?? "N/A"}
                  </div>
                  <div>
                    <span className="font-medium">Ausencias:</span>{" "}
                    {employee.absenceHours ?? "N/A"}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>

            {/* Renderizar SOLO el mes */}
            <div key={format(displayMonthDate, "yyyy-MM")} className="mb-0">
              {/* Header Mes */}
              <div
                className={cn(
                  "px-4 py-2 font-medium sticky z-10 text-center border-b",
                  headerBgColor,
                  headerTextColor,
                  borderColor,
                  "top-[68px]"
                )}
              >
                {format(displayMonthDate, "MMMM yyyy", { locale: es })}
              </div>
              {/* Header Días Semana */}
              <div className="grid grid-cols-7 border-b bg-gray-50">
                {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map(
                  (dayName) => (
                    <div
                      key={dayName}
                      className={cn(
                        "h-8 flex items-center justify-center text-xs font-medium text-gray-500",
                        borderColor,
                        "border-r last:border-r-0"
                      )}
                    >
                      {dayName}
                    </div>
                  )
                )}
              </div>
              {/* Grid Calendario */}
              <div className="grid grid-cols-7">
                {monthWeeks.map((weekData, weekIndex) => (
                  <React.Fragment key={weekIndex}>
                    {weekData.map((day, dayIndex) => {
                      const isCurrentMonth = isSameMonth(day, displayMonthDate);
                      const isTodayDate = isToday(day);
                      const dayKey = getDayKeyFromDate(day);
                      const isPastOrToday =
                        isBefore(day, todayDate) || isTodayDate;
                      const isFutureDay = isAfter(day, todayDate); // <- Verifica si es futuro

                      // --- Búsqueda Datos + Fallback ---
                      let scheduleToRender: any;
                      let workedToRender: any;
                      let markingsToRender: any[] = [];
                      let isFallbackData = false;
                      const actualSchedule = mockSchedules.find(
                        (s) =>
                          s.employeeId === employee.id && s.dayKey === dayKey
                      );
                      const actualWorked = mockWorkedTimes.find(
                        (w) =>
                          w.employeeId === employee.id && w.dayKey === dayKey
                      );
                      const actualMarkings = mockMarkings.filter(
                        (m) =>
                          m.employeeId === employee.id && m.dayKey === dayKey
                      );
                      const requiresFallback =
                        !(
                          actualSchedule ||
                          actualWorked ||
                          actualMarkings.length > 0
                        ) &&
                        employees &&
                        employees.length > 0 &&
                        mockEmployees.length > 0;

                      if (requiresFallback) {
                        isFallbackData = true;
                        const fallbackEmpId = mockEmployees[0].id;
                        scheduleToRender = mockSchedules.find(
                          (s) =>
                            s.employeeId === fallbackEmpId &&
                            s.dayKey === dayKey
                        );
                        workedToRender = isPastOrToday
                          ? mockWorkedTimes.find(
                              (w) =>
                                w.employeeId === fallbackEmpId &&
                                w.dayKey === dayKey
                            )
                          : undefined;
                        markingsToRender = mockMarkings.filter(
                          (m) =>
                            m.employeeId === fallbackEmpId &&
                            m.dayKey === dayKey
                        );
                      } else {
                        scheduleToRender = actualSchedule;
                        workedToRender = isPastOrToday
                          ? actualWorked
                          : undefined;
                        markingsToRender = actualMarkings;
                      }
                      // --- Fin Búsqueda ---

                      return (
                        <div
                          key={dayIndex}
                          onContextMenu={(e) =>
                            handleContextMenu(e, "grid", {
                              employeeId: employee.id,
                              date: day,
                            })
                          }
                          className={cn(
                            "relative min-h-[100px] border-r border-b p-1 flex flex-col cursor-context-menu",
                            borderColor,
                            isCurrentMonth ? mainBgColor : otherMonthBgColor,
                            isTodayDate ? todayBgColor : "",
                            // Quitar aplicación de fallbackOpacity
                            // isFallbackData ? fallbackOpacity : "",
                            !isCurrentMonth
                              ? otherMonthTextColor
                              : "text-gray-800"
                          )}
                        >
                          {/* Número día */}
                          <div className="text-right text-xs font-medium p-0.5 self-end select-none">
                            {format(day, "d")}
                          </div>
                          {/* Timeline */}
                          <div className="flex-grow relative mt-1 min-h-[30px]">
                            {(scheduleToRender ||
                              workedToRender ||
                              markingsToRender.length > 0) && (
                              <DayTimeline
                                schedule={scheduleToRender}
                                worked={workedToRender} // Ya filtrado por isPastOrToday
                                markings={markingsToRender}
                                width={estimatedCellWidth - 10}
                                height={estimatedTimelineHeight}
                                onContextMenu={handleContextMenu}
                                isFallbackData={isFallbackData} // Se pasa por si acaso
                                isFuture={isFutureDay} // <- Pasa la nueva prop
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
            {/* Fin render mes */}
          </div>
        ))}

        {/* Menú Contextual */}
        <CustomContextMenu
          isOpen={menuState.isOpen}
          position={menuState.position}
          onClose={closeContextMenu}
        >
          {menuState.type === "worked" && menuState.data && (
            <WorkedBarContextMenuContent
              onViewDetails={() =>
                handleViewDetails(
                  menuState.data?.scheduleId || menuState.data?.workedId || ""
                )
              }
              onCopy={() =>
                handleCopy(
                  menuState.data?.type || "unknown",
                  menuState.data?.scheduleId || menuState.data?.workedId || ""
                )
              }
              onDelete={() =>
                handleDelete(
                  menuState.data?.scheduleId || menuState.data?.workedId || ""
                )
              }
            />
          )}
          {menuState.type === "grid" && menuState.data && (
            <GridCellContextMenuContent
              formattedDateTime={
                menuState.data.formattedDateTime || "??/?? - ??:??"
              }
              onAddMarking={() =>
                handleAddMarking(menuState.data.employeeId, menuState.data.date)
              }
              onAddLeave={() =>
                handleAddLeave(menuState.data.employeeId, menuState.data.date)
              }
              onAddShift={() =>
                handleAddShift(menuState.data.employeeId, menuState.data.date)
              }
            />
          )}
        </CustomContextMenu>
      </div>
    </TooltipProvider>
  );
}
