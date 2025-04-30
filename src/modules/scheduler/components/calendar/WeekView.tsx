/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/views/WeekView.tsx
"use client";

import React, { useState, useCallback } from "react";
import { cn } from "../../lib/utils"; // Asegúrate que esta ruta sea correcta
import { MapPin } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import {
  Employee,
  mockEmployees,
  mockMarkings,
  mockSchedules,
  mockWorkedTimes,
} from "../../tem/week_view"; // Ajusta ruta

// Importa los componentes personalizados de menú
import { CustomContextMenu } from "./menus/CustomContextMenu"; // Asegúrate que la ruta es correcta
import { WorkedBarContextMenuContent } from "./menus/WorkedBarContextMenu"; // Asegúrate que la ruta es correcta
import { GridCellContextMenuContent } from "./menus/GridCellContextMenu"; // Asegúrate que la ruta es correcta
import { EmployeeContextMenuContent } from "./menus/EmployeeContextMenu"; // Asegúrate que la ruta es correcta

// --- Constants for Layout ---
const EMPLOYEE_COL_WIDTH = 160;
const DAY_COL_WIDTH = 80;
const HEADER_HEIGHT = 40;
const HOUR_WIDTH = 80;
const ROW_HEIGHT = 65;
const TOTAL_LEFT_WIDTH = EMPLOYEE_COL_WIDTH + DAY_COL_WIDTH;

// --- Static Data for Days ---
const days = [
  { key: "lun", date: "28/04" },
  { key: "mar", date: "29/04" },
  { key: "mié", date: "30/04" },
  { key: "jue", date: "01/05" },
  { key: "vie", date: "02/05" },
  { key: "sáb", date: "03/05" },
];

// --- WeekView Props ---
interface WeekViewProps {
  employees?: Employee[];
}

// --- Estado para el menú contextual ---
interface MenuState {
  isOpen: boolean;
  position: { x: number; y: number };
  type: "worked" | "grid" | "employee" | null;
  data: any; // Para pasar datos relevantes (empId, dayKey, scheduleId, clickedTime, formattedDateTime etc.)
}

// --- Dynamic WeekView Component ---
export default function WeekView({ employees }: WeekViewProps) {
  const employeesToDisplay =
    employees && employees.length > 0 ? employees : mockEmployees;

  // --- Estado del Menú ---
  const [menuState, setMenuState] = useState<MenuState>({
    isOpen: false,
    position: { x: 0, y: 0 },
    type: null,
    data: null,
  });

  // --- Helper Functions ---
  const getRowIndex = (employeeId: string, dayKey: string): number => {
    const employeeIndex = employeesToDisplay.findIndex(
      (e) => e.id === employeeId
    );
    const dayIndex = days.findIndex((d) => d.key === dayKey);
    if (employeeIndex === -1 || dayIndex === -1) return -1;
    return employeeIndex * days.length + dayIndex;
  };

  const calculateTimeFromOffset = (
    offsetX: number,
    timelineWidth: number
  ): number => {
    if (timelineWidth <= 0) return 0;
    const hours = (offsetX / timelineWidth) * 24;
    return Math.round(hours * 4) / 4; // Redondea al cuarto de hora
  };

  const formatTime = (decimalTime: number): string => {
    const totalMinutes = Math.round(decimalTime * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
  };

  // --- Layout Calculations ---
  const totalNumberOfEmployees = employeesToDisplay.length;
  const totalNumberOfRows = totalNumberOfEmployees * days.length;
  const totalTimelineContentHeight = totalNumberOfRows * ROW_HEIGHT;
  const totalTimelineHeight = totalTimelineContentHeight + HEADER_HEIGHT;
  const totalTimelineContentWidth = 24 * HOUR_WIDTH;
  const hoursToDisplay = Array.from({ length: 24 }, (_, i) => i);

  // --- Handlers para abrir y cerrar menús ---
  const handleContextMenu = useCallback(
    (
      event: React.MouseEvent<HTMLDivElement>,
      type: "worked" | "grid" | "employee",
      data: any
    ) => {
      event.preventDefault();
      event.stopPropagation();

      let menuData = data;
      if (type === "grid") {
        const currentTarget = event.currentTarget as Element;
        const rect = currentTarget.getBoundingClientRect();
        const offsetX = event.clientX - rect.left;
        const clickedTime = calculateTimeFromOffset(
          offsetX,
          totalTimelineContentWidth
        );
        const formattedTime = formatTime(clickedTime);
        const dayInfo = days.find((d) => d.key === data.dayKey);
        const dateStr = dayInfo?.date
          ? dayInfo.date + (dayInfo.date.length <= 5 ? "/2024" : "")
          : "??/??";
        menuData = {
          ...data,
          clickedTime,
          formattedDateTime: `${dateStr} - ${formattedTime}`,
        };
      }

      setMenuState({
        isOpen: true,
        position: { x: event.clientX, y: event.clientY }, // Usa coordenadas del viewport
        type: type,
        data: menuData,
      });
    },
    [totalTimelineContentWidth]
  ); // Incluye dependencia

  const closeContextMenu = useCallback(() => {
    setMenuState((prev) => ({
      ...prev,
      isOpen: false,
      type: null,
      data: null,
    }));
  }, []);

  // --- Placeholder Handlers para acciones del menú (llama a closeContextMenu) ---
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
  const handleAddMarking = (empId: string, day: string, time: number) => {
    console.log("Agregar Marcaje:", empId, day, time);
    closeContextMenu();
  };
  const handleAddLeave = (empId: string, day: string, time: number) => {
    console.log("Agregar Licencia:", empId, day, time);
    closeContextMenu();
  };
  const handleAddShift = (empId: string, day: string, time: number) => {
    console.log("Agregar Turno:", empId, day, time);
    closeContextMenu();
  };
  const handleViewEmpMarkings = (empId: string) => {
    console.log("Ver Marcajes Emp:", empId);
    closeContextMenu();
  };
  const handleCopyEmpLeave = (empId: string) => {
    console.log("Copiar Licencias Emp:", empId);
    closeContextMenu();
  };
  const handleCopyEmpSchedules = (empId: string) => {
    console.log("Copiar Horarios Emp:", empId);
    closeContextMenu();
  };
  const handleCopyEmpAll = (empId: string) => {
    console.log("Copiar Todo Emp:", empId);
    closeContextMenu();
  };
  const handlePasteEmp = (empId: string) => {
    console.log("Pegar Emp:", empId);
    closeContextMenu();
  };

  // --- Render Checks ---
  if (totalNumberOfEmployees === 0) {
    return (
      <div className="flex justify-center items-center h-60 text-muted-foreground">
        No hay datos de empleados para mostrar.
      </div>
    );
  }

  // --- Embedded CSS ---
  const stripeCSS = `
        .bg-stripes-pattern {
           background-image: repeating-linear-gradient(
            -45deg,
            rgba(255, 255, 255, 0.7),
            rgba(255, 255, 255, 0.7) 4px,
            transparent 4px,
            transparent 8px
          );
           background-color: transparent;
        }
        /* .fallback-data { opacity: 0.6; } */
    `;

  return (
    <TooltipProvider>
      <style>{stripeCSS}</style>
      {/* Contenedor Principal con overflow y cierre de menú al hacer click */}
      <div
        className="h-[calc(100vh-100px)] w-full overflow-auto border border-border rounded-md bg-card text-card-foreground relative"
        onClick={() => menuState.isOpen && closeContextMenu()}
      >
        <div className="flex min-w-max">
          {" "}
          {/* Asegura scroll horizontal */}
          {/* Columna Izquierda Fija */}
          <div
            className="sticky left-0 z-30 shrink-0 border-r border-border shadow-sm flex flex-col bg-white"
            style={{
              width: `${TOTAL_LEFT_WIDTH}px`,
              height: `${totalTimelineHeight}px`,
            }}
          >
            {/* Header Esquina */}
            <div
              className="border-b border-border flex items-center sticky top-0 z-10 bg-white"
              style={{ height: `${HEADER_HEIGHT}px` }}
            >
              <div
                className="p-2 font-medium text-sm text-center border-r border-border"
                style={{ width: `${EMPLOYEE_COL_WIDTH}px` }}
              >
                Empleado
              </div>
              <div
                className="p-2 font-medium text-sm text-center"
                style={{ width: `${DAY_COL_WIDTH}px` }}
              >
                Día
              </div>
            </div>
            {/* Celdas Empleado/Día */}
            <div className="relative flex-1">
              {employeesToDisplay.map((employee, employeeIndex) => (
                <React.Fragment key={employee.id}>
                  {/* Celda Empleado con Context Menu */}
                  <div
                    onContextMenu={(e) =>
                      handleContextMenu(e, "employee", {
                        employeeId: employee.id,
                      })
                    }
                    className="absolute border-b border-r border-border bg-white hover:bg-gray-50 cursor-context-menu group"
                    style={{
                      top: `${employeeIndex * days.length * ROW_HEIGHT}px`,
                      left: 0,
                      height: `${days.length * ROW_HEIGHT}px`,
                      width: `${EMPLOYEE_COL_WIDTH}px`,
                    }}
                  >
                    <Tooltip delayDuration={150}>
                      <TooltipTrigger asChild>
                        <div className="flex flex-col justify-center h-full w-full p-2">
                          <div className="font-semibold text-sm truncate">
                            {employee.name}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {employee.department ?? "Sin Dept."}
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent
                        side="right"
                        align="start"
                        className="bg-slate-800 text-white p-3 rounded-md shadow-lg text-xs border border-slate-700 w-60"
                        sideOffset={5}
                      >
                        <div className="font-bold text-sm mb-2">
                          {employee.name}
                        </div>
                        <div className="space-y-1">
                          <div>
                            <span className="font-medium">Num. documento:</span>{" "}
                            {employee.documentNumber ?? "N/A"}
                          </div>
                          <div>
                            <span className="font-medium">
                              Tipo De Persona:
                            </span>{" "}
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
                  </div>

                  {/* Celdas Día */}
                  <div
                    className="absolute flex flex-col bg-white"
                    style={{
                      left: `${EMPLOYEE_COL_WIDTH}px`,
                      top: `${employeeIndex * days.length * ROW_HEIGHT}px`,
                      width: `${DAY_COL_WIDTH}px`,
                    }}
                  >
                    {days.map((day) => (
                      <div
                        key={`${employee.id}-${day.key}-day`}
                        className="border-b border-border p-2 flex items-center justify-center text-xs hover:bg-gray-50"
                        style={{ height: `${ROW_HEIGHT}px` }}
                      >
                        <span className="font-bold mr-1">{day.key}</span>
                        <span>{day.date}</span>
                      </div>
                    ))}
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
          {/* Area Timeline Scrollable */}
          <div className="flex-1 min-w-0 relative">
            {/* Contenedor Interno Timeline */}
            <div
              className="relative"
              style={{
                width: `${totalTimelineContentWidth}px`,
                height: `${totalTimelineHeight}px`,
              }}
            >
              {/* Header Horas */}
              <div
                className="sticky top-0 z-20 flex border-b border-border bg-blue-100"
                style={{
                  height: `${HEADER_HEIGHT}px`,
                  width: `${totalTimelineContentWidth}px`,
                }}
              >
                {hoursToDisplay.map((hour) => (
                  <div
                    key={`header-${hour}`}
                    className="shrink-0 border-r border-blue-200 px-2 text-center text-xs font-medium flex items-center justify-center text-blue-800"
                    style={{ width: `${HOUR_WIDTH}px` }}
                  >
                    {`${hour.toString().padStart(2, "0")}:00`}
                  </div>
                ))}
              </div>
              {/* Grid y Contenido */}
              <div className="absolute top-0 left-0 w-full h-full">
                {/* Fondo Grid con Context Menu */}
                {Array.from({ length: totalNumberOfRows }).map(
                  (_, localRowIndex) => {
                    const employeeIndex = Math.floor(
                      localRowIndex / days.length
                    );
                    const dayIndex = localRowIndex % days.length;
                    const employee = employeesToDisplay[employeeIndex];
                    const day = days[dayIndex];
                    if (!employee || !day) return null;
                    const top = localRowIndex * ROW_HEIGHT + HEADER_HEIGHT;

                    return (
                      <div
                        key={`row-bg-${localRowIndex}`}
                        onContextMenu={(e) =>
                          handleContextMenu(e, "grid", {
                            employeeId: employee.id,
                            dayKey: day.key,
                          })
                        }
                        className="absolute border-b border-gray-200 hover:bg-blue-50/30 cursor-context-menu"
                        style={{
                          top: `${top}px`,
                          left: 0,
                          height: `${ROW_HEIGHT}px`,
                          width: `${totalTimelineContentWidth}px`,
                          zIndex: 2,
                        }}
                      >
                        {/* Líneas Verticales */}
                        <div className="absolute inset-0 pointer-events-none z-0">
                          {hoursToDisplay.map((hour) => (
                            <React.Fragment
                              key={`hour-line-${localRowIndex}-${hour}`}
                            >
                              <div
                                className="absolute top-0 bottom-0 border-r border-gray-200"
                                style={{
                                  left: `${hour * HOUR_WIDTH}px`,
                                  width: "1px",
                                }}
                              />
                              {[15, 30, 45].map((minute) => (
                                <div
                                  key={`minute-line-${localRowIndex}-${hour}-${minute}`}
                                  className="absolute top-0 bottom-0 w-px bg-gray-100"
                                  style={{
                                    left: `${
                                      hour * HOUR_WIDTH +
                                      (minute / 60) * HOUR_WIDTH
                                    }px`,
                                  }}
                                />
                              ))}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    );
                  }
                )}
                {/* Capa Contenido (Barras/Marcajes) */}
                <div className="absolute top-0 left-0 w-full h-full z-10 pointer-events-none">
                  {" "}
                  {/* Capa sin eventos */}
                  {employeesToDisplay.map((employee) =>
                    days.map((day, dayIndex) => {
                      const rowIndex = getRowIndex(employee.id, day.key);
                      if (rowIndex === -1) return null;

                      // --- Búsqueda de Datos ---
                      const actualSchedule = mockSchedules.find(
                        (s) =>
                          s.employeeId === employee.id && s.dayKey === day.key
                      );
                      const actualWorked = mockWorkedTimes.find(
                        (w) =>
                          w.employeeId === employee.id && w.dayKey === day.key
                      );
                      const actualMarkings = mockMarkings.filter(
                        (m) =>
                          m.employeeId === employee.id && m.dayKey === day.key
                      );
                      let scheduleToRender = actualSchedule;
                      let workedToRender = actualWorked;
                      let markingsToRender = actualMarkings;
                      let isFallbackData = false;

                      if (
                        !actualSchedule &&
                        mockEmployees.length > 0 &&
                        days.length > 0
                      ) {
                        // isFallbackData = true;
                        const fallbackEmpId = mockEmployees[0].id;
                        const fallbackDayIndex = dayIndex % days.length;
                        const fallbackDayKey = days[fallbackDayIndex]?.key;
                        if (fallbackDayKey) {
                          scheduleToRender = mockSchedules.find(
                            (s) =>
                              s.employeeId === fallbackEmpId &&
                              s.dayKey === fallbackDayKey
                          );
                          workedToRender = mockWorkedTimes.find(
                            (w) =>
                              w.employeeId === fallbackEmpId &&
                              w.dayKey === fallbackDayKey
                          );
                          markingsToRender = mockMarkings.filter(
                            (m) =>
                              m.employeeId === fallbackEmpId &&
                              m.dayKey === fallbackDayKey
                          );
                        } else {
                          scheduleToRender = undefined;
                          workedToRender = undefined;
                          markingsToRender = [];
                        }
                      }

                      // --- Preparación de Layers ---
                      const barLayer: React.ReactNode[] = [];
                      const markingLayer: React.ReactNode[] = [];
                      const topOffset = rowIndex * ROW_HEIGHT + HEADER_HEIGHT;
                      const fallbackClass = isFallbackData
                        ? "fallback-data"
                        : "";

                      // --- Render Barras con Context Menu ---
                      if (scheduleToRender) {
                        const left = scheduleToRender.startTime * HOUR_WIDTH;
                        const width =
                          (scheduleToRender.endTime -
                            scheduleToRender.startTime) *
                          HOUR_WIDTH;
                        const verticalPosition = topOffset + ROW_HEIGHT * 0.5;
                        const barHeight = ROW_HEIGHT * 0.25;
                        if (width > 0.1) {
                          barLayer.push(
                            <div
                              key={`sched-${employee.id}-${day.key}`}
                              onContextMenu={(e) =>
                                handleContextMenu(e, "worked", {
                                  scheduleId: scheduleToRender.id,
                                  type: "schedule",
                                })
                              }
                              className={cn(
                                "absolute rounded-md overflow-hidden",
                                "bg-green-100 border border-green-300",
                                fallbackClass,
                                "pointer-events-auto cursor-context-menu"
                              )}
                              style={{
                                top: `${verticalPosition}px`,
                                left: `${left}px`,
                                width: `${width}px`,
                                height: `${barHeight}px`,
                                zIndex: 5,
                              }}
                            >
                              <span
                                className={cn(
                                  "absolute bottom-[-2px] left-1.5 text-[10px] font-medium pointer-events-none text-green-800"
                                )}
                              >
                                {scheduleToRender.label}
                              </span>
                            </div>
                          );
                        }
                        // Ausencia (Visual)
                        const absenceVerticalPosition =
                          topOffset + ROW_HEIGHT * 0.18;
                        const absenceHeight = ROW_HEIGHT * 0.25;
                        if (workedToRender) {
                          if (
                            workedToRender.startTime >
                            scheduleToRender.startTime
                          ) {
                            const aE = Math.min(
                              workedToRender.startTime,
                              scheduleToRender.endTime
                            );
                            const aW =
                              (aE - scheduleToRender.startTime) * HOUR_WIDTH;
                            if (aW > 0.1) {
                              barLayer.push(
                                <div
                                  key={`abs-start-${employee.id}-${day.key}`}
                                  className={cn(
                                    "absolute bg-red-200 R-sm O-h P-e-n",
                                    fallbackClass
                                  )}
                                  style={{
                                    top: `${absenceVerticalPosition}px`,
                                    left: `${
                                      scheduleToRender.startTime * HOUR_WIDTH
                                    }px`,
                                    width: `${aW}px`,
                                    height: `${absenceHeight}px`,
                                    zIndex: 16,
                                  }}
                                >
                                  <div className="absolute inset-0 bg-stripes-pattern opacity-70 P-e-n"></div>
                                </div>
                              );
                            }
                          }
                          if (
                            workedToRender.endTime < scheduleToRender.endTime
                          ) {
                            const aS = Math.max(
                              workedToRender.endTime,
                              scheduleToRender.startTime
                            );
                            const aW =
                              (scheduleToRender.endTime - aS) * HOUR_WIDTH;
                            if (aW > 0.1) {
                              barLayer.push(
                                <div
                                  key={`abs-end-${employee.id}-${day.key}`}
                                  className={cn(
                                    "absolute bg-red-200 R-sm O-h P-e-n",
                                    fallbackClass
                                  )}
                                  style={{
                                    top: `${absenceVerticalPosition}px`,
                                    left: `${aS * HOUR_WIDTH}px`,
                                    width: `${aW}px`,
                                    height: `${absenceHeight}px`,
                                    zIndex: 16,
                                  }}
                                >
                                  <div className="absolute inset-0 bg-stripes-pattern opacity-70 P-e-n"></div>
                                </div>
                              );
                            }
                          }
                        } else {
                          const aW =
                            (scheduleToRender.endTime -
                              scheduleToRender.startTime) *
                            HOUR_WIDTH;
                          if (aW > 0.1) {
                            barLayer.push(
                              <div
                                key={`abs-full-${employee.id}-${day.key}`}
                                className={cn(
                                  "absolute bg-red-200 R-sm O-h P-e-n",
                                  fallbackClass
                                )}
                                style={{
                                  top: `${absenceVerticalPosition}px`,
                                  left: `${
                                    scheduleToRender.startTime * HOUR_WIDTH
                                  }px`,
                                  width: `${aW}px`,
                                  height: `${absenceHeight}px`,
                                  zIndex: 16,
                                }}
                              >
                                <div className="absolute inset-0 bg-stripes-pattern opacity-70 P-e-n"></div>
                              </div>
                            );
                          }
                        }
                      }

                      if (workedToRender) {
                        const workedStart = workedToRender.startTime;
                        const workedEnd = workedToRender.endTime;
                        const scheduleStart =
                          scheduleToRender?.startTime ?? -Infinity;
                        const scheduleEnd =
                          scheduleToRender?.endTime ?? Infinity;
                        const regularStart = Math.max(
                          workedStart,
                          scheduleStart
                        );
                        const regularEnd = Math.min(workedEnd, scheduleEnd);
                        const regularWidth =
                          regularEnd > regularStart
                            ? (regularEnd - regularStart) * HOUR_WIDTH
                            : 0;
                        const overtimeStart = Math.max(
                          workedStart,
                          scheduleEnd
                        );
                        const overtimeEnd = workedEnd;
                        const overtimeWidth =
                          overtimeEnd > overtimeStart
                            ? (overtimeEnd - overtimeStart) * HOUR_WIDTH
                            : 0;
                        const verticalPosition = topOffset + ROW_HEIGHT * 0.18;
                        const barHeight = ROW_HEIGHT * 0.25;

                        if (regularWidth > 0.1) {
                          barLayer.push(
                            <div
                              key={`workR-${employee.id}-${day.key}`}
                              onContextMenu={(e) =>
                                handleContextMenu(e, "worked", {
                                  workedId: workedToRender.id,
                                  type: "regular",
                                })
                              }
                              className={cn(
                                "absolute bg-green-500 rounded-sm",
                                fallbackClass,
                                "pointer-events-auto cursor-context-menu"
                              )}
                              style={{
                                top: `${verticalPosition}px`,
                                left: `${regularStart * HOUR_WIDTH}px`,
                                width: `${regularWidth}px`,
                                height: `${barHeight}px`,
                                zIndex: 15,
                              }}
                            />
                          );
                        }
                        if (overtimeWidth > 0.1) {
                          barLayer.push(
                            <div
                              key={`workOT-${employee.id}-${day.key}`}
                              onContextMenu={(e) =>
                                handleContextMenu(e, "worked", {
                                  workedId: workedToRender.id,
                                  type: "overtime",
                                })
                              }
                              className={cn(
                                "absolute bg-yellow-400 rounded-sm",
                                fallbackClass,
                                "pointer-events-auto cursor-context-menu"
                              )}
                              style={{
                                top: `${verticalPosition}px`,
                                left: `${overtimeStart * HOUR_WIDTH}px`,
                                width: `${overtimeWidth}px`,
                                height: `${barHeight}px`,
                                zIndex: 14,
                              }}
                            />
                          );
                        }
                      }

                      // --- Render Marcajes ---
                      markingsToRender.forEach((mark, index) => {
                        const pinLeft = mark.time * HOUR_WIDTH;
                        const IconComponent = mark.icon || MapPin;
                        const pinTop =
                          topOffset + ROW_HEIGHT - ROW_HEIGHT * 0.15;
                        markingLayer.push(
                          <div
                            key={`mark-${employee.id}-${day.key}-${index}`}
                            className={cn(
                              "absolute z-30 flex items-center justify-center pointer-events-auto",
                              fallbackClass
                            )}
                            style={{
                              top: `${pinTop}px`,
                              left: `${pinLeft}px`,
                              transform: "translate(-50%, -50%)",
                            }}
                            title={`${mark.type} @ ${formatTime(mark.time)} ${
                              isFallbackData ? "(ejemplo)" : ""
                            }`}
                          >
                            <IconComponent
                              className={cn("w-3.5 h-3.5", mark.color)}
                            />
                          </div>
                        );
                      });

                      return (
                        <React.Fragment
                          key={`cell-content-${employee.id}-${day.key}`}
                        >
                          {barLayer}
                          {markingLayer}
                        </React.Fragment>
                      );
                    })
                  )}
                </div>{" "}
                {/* Fin Capa Contenido */}
              </div>{" "}
              {/* Fin Grid y Contenido */}
            </div>{" "}
            {/* Fin Contenedor Timeline Interno */}
          </div>{" "}
          {/* Fin Area Timeline Scrollable */}
        </div>{" "}
        {/* Fin Flex Container Principal */}
        {/* Renderiza el Menú Contextual Customizado */}
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
                handleAddMarking(
                  menuState.data.employeeId,
                  menuState.data.dayKey,
                  menuState.data.clickedTime
                )
              }
              onAddLeave={() =>
                handleAddLeave(
                  menuState.data.employeeId,
                  menuState.data.dayKey,
                  menuState.data.clickedTime
                )
              }
              onAddShift={() =>
                handleAddShift(
                  menuState.data.employeeId,
                  menuState.data.dayKey,
                  menuState.data.clickedTime
                )
              }
            />
          )}
          {menuState.type === "employee" && menuState.data && (
            <EmployeeContextMenuContent
              onViewMarkings={() =>
                handleViewEmpMarkings(menuState.data.employeeId)
              }
              onCopyLeave={() => handleCopyEmpLeave(menuState.data.employeeId)}
              onCopySchedules={() =>
                handleCopyEmpSchedules(menuState.data.employeeId)
              }
              onCopyAll={() => handleCopyEmpAll(menuState.data.employeeId)}
              onPaste={() => handlePasteEmp(menuState.data.employeeId)}
            />
          )}
        </CustomContextMenu>
      </div>{" "}
      {/* Fin Contenedor Principal */}
    </TooltipProvider>
  );
}
