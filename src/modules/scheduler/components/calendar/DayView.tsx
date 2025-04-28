"use client";

import React, { useRef } from "react";
import { useDroppable } from "@dnd-kit/core"; // NUEVO
import { useUI } from "../../hooks/useUI";
import type { Employee } from "../../interfaces/Employee";
import type { Event } from "../../interfaces/Event";
import type { Marking } from "../../interfaces/Marking";
import { formatTime, isSameDay } from "../../utils/dateUtils";
import EventItem from "./EventItem";
import MarkingPin from "./MarkingPin";
import { useCalculatePosition } from "../../hooks/useCalculatePosition"; // NUEVO

interface DayViewProps {
  startDate: Date;
  endDate: Date; // Mantener por consistencia de props
  events: Event[];
  markings: Marking[];
  employees: Employee[];
  containerWidth: number; // Renombrado de width
  containerHeight: number; // Renombrado de height
}

// Constantes de la vista
const TIME_COL_WIDTH = 80; // Ancho de la columna de hora
const HEADER_HEIGHT = 50; // Alto de la cabecera (empleados/días)
const START_HOUR = 6; // Hora de inicio visible
const END_HOUR = 22; // Hora de fin visible (inclusive)

export default function DayView({
  startDate,
  // endDate, // No se usa directamente aquí, pero se recibe
  events,
  markings,
  employees,
  containerWidth,
  containerHeight,
}: DayViewProps) {
  const { openContextMenu } = useUI();
  const gridRef = useRef<HTMLDivElement>(null);

  const visibleHours = END_HOUR - START_HOUR + 1;
  const gridHeight = containerHeight - HEADER_HEIGHT; // Alto útil de la rejilla
  const hourHeight = gridHeight > 0 ? gridHeight / visibleHours : 60; // Alto de cada hora, fallback a 60px
  const gridWidth = containerWidth - TIME_COL_WIDTH;
  const employeeColWidth =
    employees.length > 0 ? gridWidth / employees.length : 0;

  // Hook para calcular posiciones
  const { getEventPosition, getMarkingPosition } = useCalculatePosition({
    view: "day",
    startDate,
    endDate: startDate, // Para DayView, end es igual a start
    employees,
    containerWidth,
    containerHeight,
    dayViewStartHour: START_HOUR,
    dayViewEndHour: END_HOUR,
    dayViewTimeColWidth: TIME_COL_WIDTH,
    dayViewHeaderHeight: HEADER_HEIGHT,
  });

  // Hacer que cada celda de empleado/hora sea un área droppable
  const { setNodeRef: setDroppableGridRef } = useDroppable({
    id: `day-grid-${startDate.toISOString()}`, // ID único para toda la rejilla del día
    data: {
      type: "grid", // Tipo general, la lógica de drop se basará en coordenadas
      date: startDate,
      // Podríamos pasar más info si fuera necesario
    },
  });

  // Horas a mostrar
  const hours = Array.from({ length: visibleHours }, (_, i) => i + START_HOUR);

  // Filtrar eventos y marcajes para el día actual
  const dayEvents = events.filter((event) => {
    const eventStart = new Date(event.startTime);
    // Considerar eventos que *cruzan* hacia este día también
    return (
      isSameDay(eventStart, startDate) ||
      (eventStart < startDate && new Date(event.endTime) > startDate)
    );
  });
  const dayMarkings = markings.filter((marking) =>
    isSameDay(new Date(marking.time), startDate)
  );

  // Manejar clic derecho en el fondo de la rejilla para añadir evento/marcaje
  const handleGridContextMenu = (e: React.MouseEvent, employeeId: string) => {
    e.preventDefault();
    e.stopPropagation(); // Detener propagación

    // Calcular la hora exacta basada en la posición Y relativa a la CELDA de la hora
    // const cellRect = (
    //   e.currentTarget as HTMLDivElement
    // ).getBoundingClientRect();

    const gridTopOffset = gridRef.current?.getBoundingClientRect().top ?? 0;
    const offsetYInGrid = e.clientY - gridTopOffset - HEADER_HEIGHT; // Ajustar por cabecera
    const hourFromY = Math.floor(offsetYInGrid / hourHeight) + START_HOUR;
    const minute = Math.floor((offsetYInGrid % hourHeight) / (hourHeight / 60));

    const exactHour = Math.max(START_HOUR, Math.min(END_HOUR, hourFromY));
    const exactMinute = Math.max(0, Math.min(59, minute));

    const clickTime = new Date(startDate);
    clickTime.setHours(exactHour, exactMinute, 0, 0);

    // Pasar la hora calculada al menú contextual
    openContextMenu({ x: e.clientX, y: e.clientY }, "cell", {
      date: clickTime,
      employeeId,
    });
  };

  // --- Componente Interno para Celda Droppable ---
  interface DroppableCellProps {
    employeeId: string;
    hour: number;
    children?: React.ReactNode;
  }
  const DroppableCell: React.FC<DroppableCellProps> = ({
    employeeId,
    hour,
    children,
  }) => {
    const cellTopOffset = (hour - START_HOUR) * hourHeight + HEADER_HEIGHT; // Calcular el offset top de esta celda específica
    const { setNodeRef, isOver } = useDroppable({
      id: `cell-${startDate.toISOString()}-${employeeId}-${hour}`,
      data: {
        type: "cell",
        date: startDate,
        employeeId: employeeId,
        gridInfo: {
          hourHeight: hourHeight,
          startHour: START_HOUR,
          cellTopOffset: cellTopOffset, // Pasar el offset top de esta celda
        },
      },
    });

    return (
      <div
        ref={setNodeRef}
        className={`h-[${hourHeight}px] border-b border-r border-border relative ${
          isOver ? "bg-blue-100/50" : ""
        }`} // Feedback visual al hacer hover con drag
        style={{ minHeight: `${hourHeight}px` }} // Asegurar altura mínima
        onContextMenu={(e) => handleGridContextMenu(e, employeeId)}
      >
        {/* Líneas de 15 minutos */}
        {[15, 30, 45].map((minute) => (
          <div
            key={minute}
            className="absolute w-full border-b border-dashed border-border/30 pointer-events-none"
            style={{ top: `${(minute / 60) * hourHeight}px`, left: 0 }}
          />
        ))}
        {/* Fondo de horas laborales (ejemplo) */}
        {hour >= 9 && hour < 17 && (
          <div className="absolute inset-0 bg-green-50 opacity-30 pointer-events-none" />
        )}
        {children}
      </div>
    );
  };
  // --- Fin Componente Interno ---

  return (
    <div className="h-full overflow-auto" ref={gridRef}>
      {" "}
      {/* Añadir ref aquí */}
      <div className="relative min-w-max">
        {" "}
        {/* Permitir que el contenido se expanda */}
        {/* Columna de Horas (Fija) */}
        <div
          className="absolute top-0 left-0 z-20 bg-white"
          style={{
            width: `${TIME_COL_WIDTH}px`,
            height: `${containerHeight}px`,
          }}
        >
          <div
            className="h-[50px] border-b border-r border-border flex items-center justify-center"
            style={{ height: `${HEADER_HEIGHT}px` }}
          >
            {/* Espacio vacío arriba a la izquierda */}
          </div>
          {hours.map((hour) => (
            <div
              key={`time-${hour}`}
              className="border-b border-r border-border p-2 text-sm text-right flex items-center justify-end"
              style={{ height: `${hourHeight}px` }}
            >
              {formatTime(hour, 0)}
            </div>
          ))}
        </div>
        {/* Rejilla Principal (Scrollable Horizontal si es necesario) */}
        <div
          className="relative"
          style={{
            marginLeft: `${TIME_COL_WIDTH}px`,
            width: `${gridWidth}px`,
            height: `${containerHeight}px`,
          }}
          ref={setDroppableGridRef} // Hacer toda la rejilla droppable (alternativa a celdas individuales)
        >
          {/* Cabecera de Empleados */}
          <div
            className="flex sticky top-0 z-10 bg-white"
            style={{ height: `${HEADER_HEIGHT}px` }}
          >
            {employees.map((employee) => (
              <div
                key={employee.id}
                className="border-b border-r border-border p-2 font-medium truncate flex items-center justify-center"
                style={{ width: `${employeeColWidth}px`, minWidth: "100px" }} // Asegurar ancho mínimo
              >
                {employee.name}
              </div>
            ))}
          </div>

          {/* Contenido de la Rejilla */}
          <div
            className="flex absolute top-[50px]"
            style={{ height: `${gridHeight}px` }}
          >
            {employees.map((employee) => (
              <div
                key={employee.id}
                className="flex flex-col" // Cambiado a flex-col
                style={{ width: `${employeeColWidth}px`, minWidth: "100px" }}
              >
                {hours.map((hour) => (
                  <DroppableCell
                    key={`cell-${hour}-${employee.id}`}
                    employeeId={employee.id}
                    hour={hour}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* --- Renderizar Eventos y Marcajes encima de la rejilla --- */}
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            {" "}
            {/* Contenedor para items */}
            {dayEvents.map((event) => {
              const position = getEventPosition(event);
              if (!position) return null;
              // Le quitamos position:absolute porque ya está dentro de un contenedor absoluto
              const itemStyle = {
                ...position,
                position: undefined,
                pointerEvents: "auto",
              } as React.CSSProperties;
              return (
                <EventItem key={event.id} event={event} style={itemStyle} />
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
                <MarkingPin
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
  );
}
