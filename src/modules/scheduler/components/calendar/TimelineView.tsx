"use client";

import React, { useRef } from "react";
import { useDroppable } from "@dnd-kit/core"; // NUEVO
import { useUI } from "../../hooks/useUI";
import type { Employee } from "../../interfaces/Employee";
import type { Event } from "../../interfaces/Event";
import type { Marking } from "../../interfaces/Marking";
import { formatTime, isSameDay, formatDate } from "../../utils/dateUtils";
import TimelineEventItem from "./TimelineEventItem";
import TimelineMarkingPin from "./TimelineMarkingPin";
import { useCalculatePosition } from "../../hooks/useCalculatePosition"; // NUEVO

interface TimelineViewProps {
  currentDate: Date; // Cambiado de dateRange a currentDate
  events: Event[];
  markings: Marking[];
  employees: Employee[];
  containerWidth: number; // Renombrado
  containerHeight: number; // Renombrado
}

// Constantes de la vista
const EMPLOYEE_COL_WIDTH = 200;
const HEADER_HEIGHT = 40; // Altura de la cabecera de horas
const HOUR_WIDTH = 80; // Ancho de cada hora
const ROW_HEIGHT = 60; // Altura de cada fila de empleado

export default function TimelineView({
  currentDate,
  events,
  markings,
  employees,
  containerWidth,
  containerHeight,
}: TimelineViewProps) {
  const { openContextMenu } = useUI();
  // const { dateRange } = useFilters() // Ya no se necesita aquí, usamos currentDate
  const gridRef = useRef<HTMLDivElement>(null);

  const gridHeight = containerHeight - HEADER_HEIGHT;
  const totalTimelineWidth = 24 * HOUR_WIDTH; // Ancho total de 24 horas

  // Hook para calcular posiciones
  const { getEventPosition, getMarkingPosition } = useCalculatePosition({
    view: "timeline",
    startDate: currentDate, // Usamos currentDate como referencia
    endDate: currentDate,
    employees,
    containerWidth,
    containerHeight,
    timelineHourWidth: HOUR_WIDTH,
    timelineHeaderHeight: HEADER_HEIGHT,
    timelineRowHeight: ROW_HEIGHT,
    timelineEmployeeColWidth: EMPLOYEE_COL_WIDTH,
  });

  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Filtrar eventos y marcajes para el día actual
  const dayEvents = events.filter((event) => {
    const eventStart = new Date(event.startTime);
    return (
      isSameDay(eventStart, currentDate) ||
      (eventStart < currentDate && new Date(event.endTime) > currentDate)
    );
  });
  const dayMarkings = markings.filter((marking) =>
    isSameDay(new Date(marking.time), currentDate)
  );

  // Manejar clic derecho en la fila de un empleado para añadir
  const handleTimelineContextMenu = (
    e: React.MouseEvent,
    employeeId: string
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const gridRect = gridRef.current?.getBoundingClientRect();
    if (!gridRect) return;

    const offsetX = e.clientX - gridRect.left - EMPLOYEE_COL_WIDTH; // Offset relativo al inicio de la timeline
    const hourDecimal = offsetX / HOUR_WIDTH;
    const hour = Math.floor(hourDecimal);
    const minute = Math.floor((hourDecimal % 1) * 60);

    if (hour < 0 || hour >= 24) return; // Click fuera del rango de horas

    const clickTime = new Date(currentDate);
    clickTime.setHours(hour, minute, 0, 0);

    openContextMenu(
      { x: e.clientX, y: e.clientY },
      "timeline", // O podría ser "cell" si la lógica del menú es la misma
      { date: clickTime, employeeId }
    );
  };

  // --- Componente Interno para Fila Droppable ---
  interface DroppableRowProps {
    employeeId: string;
    employeeIndex: number;
    children?: React.ReactNode;
  }
  const DroppableRow: React.FC<DroppableRowProps> = ({
    employeeId,
    children,
  }) => {
    const { setNodeRef, isOver } = useDroppable({
      id: `timeline-row-${currentDate.toISOString()}-${employeeId}`,
      data: {
        type: "timelineRow",
        employeeId: employeeId,
        date: currentDate, // Pasar la fecha actual
        gridInfo: {
          hourWidth: HOUR_WIDTH,
          rowLeftOffset: EMPLOYEE_COL_WIDTH, // El inicio del área droppable está después de la columna de empleados
        },
      },
    });

    return (
      <div
        ref={setNodeRef}
        className={`border-b border-border relative ${
          isOver ? "bg-blue-100/50" : ""
        }`}
        style={{ height: `${ROW_HEIGHT}px`, width: `${totalTimelineWidth}px` }} // Ancho total de 24h
        onContextMenu={(e) => handleTimelineContextMenu(e, employeeId)}
      >
        {/* Marcadores de Hora */}
        <div className="absolute inset-0 pointer-events-none">
          {hours.map((hour) => (
            <div
              key={`hour-line-${hour}`}
              className="absolute top-0 bottom-0 border-r border-border"
              style={{ left: `${hour * HOUR_WIDTH}px` }}
            >
              {/* Marcadores de 15 min */}
              {[15, 30, 45].map((minute) => (
                <div
                  key={`minute-line-${hour}-${minute}`}
                  className="absolute top-0 bottom-0 w-px bg-border/30"
                  style={{ left: `${(minute / 60) * HOUR_WIDTH}px` }}
                />
              ))}
            </div>
          ))}
        </div>
        {/* Fondo Horas Laborales (Ejemplo) */}
        <div
          className="absolute top-0 bottom-0 bg-green-50 opacity-30 pointer-events-none"
          style={{
            left: `${9 * HOUR_WIDTH}px`, // Inicia a las 9:00
            width: `${8 * HOUR_WIDTH}px`, // Dura 8 horas
          }}
        />
        {children}
      </div>
    );
  };
  // --- Fin Componente Interno ---

  return (
    <div className="h-full overflow-auto" ref={gridRef}>
      {" "}
      {/* Ref en el contenedor scrollable */}
      <div
        className="relative"
        style={{
          height: `${containerHeight}px`,
          width: `${EMPLOYEE_COL_WIDTH + totalTimelineWidth}px`,
        }}
      >
        {" "}
        {/* Ancho total */}
        {/* Cabecera Fija (Empleados y Horas) */}
        <div className="sticky top-0 z-30 flex bg-white">
          {/* Esquina superior izquierda */}
          <div
            className="shrink-0 border-b border-r border-border p-2 flex items-center justify-center"
            style={{
              width: `${EMPLOYEE_COL_WIDTH}px`,
              height: `${HEADER_HEIGHT}px`,
            }}
          >
            <div className="font-medium text-sm">
              {formatDate(currentDate, "medium")}
            </div>
          </div>
          {/* Cabecera de Horas */}
          <div
            className="flex overflow-hidden border-b border-border"
            style={{ width: `${containerWidth - EMPLOYEE_COL_WIDTH}px` }}
          >
            <div className="flex" style={{ width: `${totalTimelineWidth}px` }}>
              {hours.map((hour) => (
                <div
                  key={`header-${hour}`}
                  className="shrink-0 border-r border-border p-2 text-center text-xs flex items-center justify-center"
                  style={{
                    width: `${HOUR_WIDTH}px`,
                    height: `${HEADER_HEIGHT}px`,
                  }}
                >
                  {formatTime(hour, 0)}
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Contenido Principal (Scrollable) */}
        <div
          className="relative flex"
          style={{
            marginTop: `${HEADER_HEIGHT}px`,
            height: `calc(100% - ${HEADER_HEIGHT}px)`,
          }}
        >
          {/* Columna de Empleados (Fija Verticalmente) */}
          <div
            className="absolute top-0 left-0 z-20 bg-white"
            style={{
              width: `${EMPLOYEE_COL_WIDTH}px`,
              height: `${gridHeight}px`,
            }}
          >
            {employees.map((employee) => (
              <div
                key={employee.id}
                className="border-b border-r border-border p-2 flex flex-col justify-center"
                style={{ height: `${ROW_HEIGHT}px` }}
              >
                <div className="font-medium truncate text-sm">
                  {employee.name}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {employee.department}
                </div>
              </div>
            ))}
          </div>

          {/* Filas de Timeline (Scrollable Horizontalmente) */}
          <div
            className="absolute top-0 z-10" // Cambiado a z-10 para estar detrás de los items
            style={{
              left: `${EMPLOYEE_COL_WIDTH}px`,
              width: `${totalTimelineWidth}px`,
              height: `${gridHeight}px`,
            }}
          >
            {employees.map((employee, index) => (
              <DroppableRow
                key={`row-${employee.id}`}
                employeeId={employee.id}
                employeeIndex={index}
              />
            ))}

            {/* --- Renderizar Eventos y Marcajes encima de las filas --- */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-20">
              {" "}
              {/* Contenedor para items, Z-index mayor */}
              {dayEvents.map((event) => {
                const position = getEventPosition(event);
                if (!position) return null;
                // Quitamos position:absolute porque ya está en contenedor absoluto
                const itemStyle = {
                  ...position,
                  position: undefined,
                  pointerEvents: "auto",
                } as React.CSSProperties;
                return (
                  <TimelineEventItem
                    key={event.id}
                    event={event}
                    style={itemStyle}
                  />
                );
              })}
              {dayMarkings.map((marking) => {
                const position = getMarkingPosition(marking);
                if (!position) return null;
                const itemStyle = {
                  ...position,
                  position: undefined,
                  pointerEvents: "auto",
                } as React.CSSProperties;
                return (
                  <TimelineMarkingPin
                    key={marking.id}
                    marking={marking}
                    style={itemStyle}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
