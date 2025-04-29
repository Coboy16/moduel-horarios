"use client";

import React, { forwardRef } from "react"; // Import forwardRef
import { useDroppable } from "@dnd-kit/core";
import { useUI } from "../../hooks/useUI";
import type { Employee } from "../../interfaces/Employee";
import type { Event } from "../../interfaces/Event";
import type { Marking } from "../../interfaces/Marking";
import { formatTime, isSameDay, formatDate } from "../../utils/dateUtils";
import TimelineMarkingPin from "./TimelineMarkingPin";
import WorkedTimeBar from "./WorkedTimeBar";
import TimelineEventItem from "./TimelineEventItem";
import { useEmployees } from "../../hooks/useEmployees";
import { differenceInMinutes, set } from "date-fns"; // Importar set
import { calculateTimeFromTimelineOffset } from "../../utils/dndUtils"; // Importar helper
import { cn } from "../../lib/utils"; // Para clases condicionales

interface TimelineViewProps {
  currentDate: Date;
  events: Event[];
  markings: Marking[];
  employees: Employee[];
  containerWidth: number;
  containerHeight: number;
  // --- Refs recibidas del padre ---
  timelineContentRef: React.RefObject<HTMLDivElement>;
  timelineMainScrollContainerRef: React.RefObject<HTMLDivElement>;
}

const EMPLOYEE_COL_WIDTH = 200;
const HEADER_HEIGHT = 40;
const HOUR_WIDTH = 80;
const ROW_HEIGHT = 50;
const STANDARD_WORK_MINUTES = 8 * 60;

// --- Droppable Row Component ---
interface DroppableRowProps {
  employeeId: string;
  employeeIndex: number;
  currentDateISO: string;
  rowWidth: number;
  onContextMenu: (
    e: React.MouseEvent,
    employeeId: string,
    calculatedTime: Date
  ) => void;
  onDoubleClick: (
    e: React.MouseEvent,
    employeeId: string,
    calculatedTime: Date
  ) => void;
  // Pasamos refs necesarios para cálculo de tiempo en el propio componente
  containerRef: React.RefObject<HTMLDivElement>;
  scrollContainerRef: React.RefObject<HTMLDivElement>;
}
const DroppableRow: React.FC<DroppableRowProps> = ({
  employeeId,
  employeeIndex,
  currentDateISO,
  rowWidth,
  onContextMenu,
  onDoubleClick,
  containerRef, // Ref del contenido
  scrollContainerRef, // Ref del scroll
}) => {
  const dropDate = new Date(currentDateISO + "T00:00:00"); // Fecha base de la fila

  const { setNodeRef, isOver } = useDroppable({
    id: `timeline-row-${currentDateISO}-${employeeId}`,
    data: {
      type: "timelineRow",
      employeeId: employeeId,
      date: dropDate, // Usar la fecha reconstruida
      gridInfo: {
        hourWidth: HOUR_WIDTH,
        rowLeftOffset: 0, // El offset es 0 dentro del área de contenido
      },
    },
  });

  // --- Función para calcular la hora del evento del mouse ---
  const getTimeFromMouseEvent = (e: React.MouseEvent): Date => {
    const containerRect = containerRef.current?.getBoundingClientRect();
    const scrollLeft = scrollContainerRef.current?.scrollLeft || 0;

    if (!containerRect) {
      console.warn(
        "[DroppableRow] Cannot calculate time: containerRect missing."
      );
      return dropDate; // Devuelve la fecha base como fallback
    }

    // Usa la función de utilidad
    const calculatedTime = calculateTimeFromTimelineOffset(
      e.clientX,
      containerRect,
      scrollLeft,
      { hourWidth: HOUR_WIDTH, rowLeftOffset: 0 } // gridInfo simplificado
    );

    // Combina la fecha de la fila con la hora calculada
    const finalDateTime = set(dropDate, {
      hours: calculatedTime.getHours(),
      minutes: calculatedTime.getMinutes(),
      seconds: 0,
      milliseconds: 0,
    });

    return finalDateTime;
  };

  // --- Manejadores de eventos que usan la función de cálculo ---
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const calculatedTime = getTimeFromMouseEvent(e);
    onContextMenu(e, employeeId, calculatedTime);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const calculatedTime = getTimeFromMouseEvent(e);
    onDoubleClick(e, employeeId, calculatedTime);
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "absolute border-b border-border cursor-default", // Quitar cursor-pointer si no es necesario
        isOver ? "bg-blue-100/50 transition-colors duration-150" : "" // Feedback visual mejorado
      )}
      style={{
        top: `${employeeIndex * ROW_HEIGHT + HEADER_HEIGHT}px`,
        left: 0,
        height: `${ROW_HEIGHT}px`,
        width: `${rowWidth}px`,
        zIndex: 1, // Detrás de los elementos
      }}
      onContextMenu={handleContextMenu} // Pasar el manejador interno
      onDoubleClick={handleDoubleClick} // Pasar el manejador interno
    >
      {/* Líneas de la cuadrícula horaria */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
          <React.Fragment key={`hour-line-${hour}`}>
            {/* Línea principal de la hora */}
            <div
              className="absolute top-0 bottom-0 border-r border-border/30"
              style={{ left: `${hour * HOUR_WIDTH}px`, width: "1px" }}
            />
            {/* Líneas de 15, 30, 45 minutos */}
            {[15, 30, 45].map((minute) => (
              <div
                key={`minute-line-${hour}-${minute}`}
                className="absolute top-0 bottom-0 w-px bg-border/15" // Más sutil
                style={{
                  left: `${hour * HOUR_WIDTH + (minute / 60) * HOUR_WIDTH}px`,
                }}
              />
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
// --- Fin Droppable Row ---

const TimelineView = forwardRef<HTMLDivElement, TimelineViewProps>(
  (
    {
      currentDate,
      events,
      markings,
      employees: selectedEmployees,
      containerWidth, // Ancho del área scrollable (después de la columna de empleados)
      containerHeight, // Alto total disponible
      // Refs recibidos
      timelineContentRef,
      timelineMainScrollContainerRef,
    },
    ref // Ref interno (no se usa directamente aquí, pero se mantiene por forwardRef)
  ) => {
    const { openContextMenu, openAddMarkingModal } = useUI();
    const { employees: allEmployees } = useEmployees();

    const displayEmployees =
      selectedEmployees.length > 0
        ? selectedEmployees
        : allEmployees.slice(0, 15);

    const totalTimelineContentWidth = 24 * HOUR_WIDTH;
    const totalTimelineContentHeight =
      displayEmployees.length * ROW_HEIGHT + HEADER_HEIGHT;
    const currentDateISO = currentDate.toISOString().split("T")[0];

    // Context Menu Handler (ahora recibe la hora calculada desde DroppableRow)
    const handleTimelineContextMenu = (
      e: React.MouseEvent,
      employeeId: string,
      calculatedTime: Date // Recibe la hora calculada
    ) => {
      console.log("[TimelineView] Context Menu Triggered:", {
        clientX: e.clientX,
        clientY: e.clientY,
        employeeId,
        calculatedTime: calculatedTime.toISOString(),
      });

      openContextMenu({ x: e.clientX, y: e.clientY }, "timeline", {
        date: calculatedTime, // Usar la hora calculada
        employeeId,
      });
    };

    // Double Click Handler (ahora recibe la hora calculada desde DroppableRow)
    const handleTimelineDoubleClick = (
      e: React.MouseEvent,
      employeeId: string,
      calculatedTime: Date // Recibe la hora calculada
    ) => {
      console.log("[TimelineView] Double Click Triggered:", {
        clientX: e.clientX,
        clientY: e.clientY,
        employeeId,
        calculatedTime: calculatedTime.toISOString(),
      });
      openAddMarkingModal(calculatedTime, employeeId); // Abrir modal con la hora precisa
    };

    return (
      // Contenedor principal que permite el scroll
      <div
        className="h-full w-full overflow-auto flex"
        // Asignar la ref del contenedor scrollable principal
        ref={timelineMainScrollContainerRef}
      >
        {/* Columna Fija de Empleados */}
        <div
          className="sticky left-0 z-30 bg-white bg-card shrink-0 border-r border-border shadow-sm"
          style={{ width: `${EMPLOYEE_COL_WIDTH}px` }}
        >
          {/* Header Esquina */}
          <div
            className="border-b border-border p-2 flex items-center justify-center font-medium text-sm sticky top-0 bg-card z-10"
            style={{ height: `${HEADER_HEIGHT}px` }}
          >
            {formatDate(currentDate, "medium")}
          </div>
          {/* Lista de Nombres */}
          {displayEmployees.map((employee) => (
            <div
              key={employee.id}
              className="border-b border-border p-2 flex flex-col justify-center hover:bg-muted/50 cursor-default"
              style={{ height: `${ROW_HEIGHT}px` }}
              title={`${employee.name} - ${employee.department}`}
            >
              <div className="font-medium truncate text-sm">
                {employee.name}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {employee.department}
              </div>
            </div>
          ))}
          <div style={{ height: "20px" }}></div> {/* Espacio extra */}
        </div>
        {/* Área de Timeline Scrollable (Contenido Principal) */}
        <div className="flex-1 min-w-0 relative">
          {/* Contenedor interno que define el tamaño total y usa la ref de contenido */}
          <div
            // Asignar la ref del contenido interno
            ref={timelineContentRef}
            className="relative"
            style={{
              width: `${totalTimelineContentWidth}px`,
              height: `${totalTimelineContentHeight}px`,
            }}
          >
            {/* Cabecera de Horas (Fija arriba) */}
            <div
              className="sticky top-0 z-20 flex border-b border-border bg-blue-100"
              style={{ height: `${HEADER_HEIGHT}px`, width: "100%" }}
            >
              {[
                ...Array.from({ length: 18 }, (_, i) => i + 6), // 6-23
                ...Array.from({ length: 6 }, (_, i) => i), // 0-5
              ].map((hour) => (
                <div
                  key={`header-${hour}`}
                  className="shrink-0 border-r border-border p-2 text-center text-xs font-medium flex items-center justify-center text-muted-foreground"
                  style={{ width: `${HOUR_WIDTH}px` }}
                >
                  {formatTime(hour, 0)}
                </div>
              ))}
            </div>
            {/* Renderizar Filas Droppables (Fondo y Grid) */}
            {displayEmployees.map((employee, index) => (
              <DroppableRow
                key={`${currentDateISO}-${employee.id}-row`}
                employeeId={employee.id}
                employeeIndex={index}
                currentDateISO={currentDateISO}
                rowWidth={totalTimelineContentWidth}
                onContextMenu={handleTimelineContextMenu} // Pasar los handlers actualizados
                onDoubleClick={handleTimelineDoubleClick} // Pasar los handlers actualizados
                containerRef={timelineContentRef} // Pasar ref contenido
                scrollContainerRef={timelineMainScrollContainerRef} // Pasar ref scroll
              />
            ))}
            {/* Capa para Renderizar Contenido Visual (Barras, Pines, Eventos) */}
            <div className="absolute top-0 left-0 w-full h-full z-10 pointer-events-none">
              {" "}
              {/* Hacer esta capa no interactiva por defecto */}
              {displayEmployees.map((employee, index) => {
                // 1. Filtrar Marcajes
                const employeeDayMarkings = markings
                  .filter(
                    (m) =>
                      m.employeeId === employee.id &&
                      isSameDay(new Date(m.time), currentDate)
                  )
                  .sort(
                    (a, b) =>
                      new Date(a.time).getTime() - new Date(b.time).getTime()
                  );

                // 2. Filtrar Eventos
                const employeeDayEvents = events.filter(
                  (ev) =>
                    ev.employeeId === employee.id &&
                    (isSameDay(new Date(ev.startTime), currentDate) ||
                      isSameDay(new Date(ev.endTime), currentDate) ||
                      (new Date(ev.startTime) < currentDate &&
                        new Date(ev.endTime) > currentDate))
                );

                // 3. Encontrar ENTRADA y SALIDA principal (Lógica simplificada)
                const entrada = employeeDayMarkings.find(
                  (m) => m.type === "ENTRADA"
                );
                const salida = employeeDayMarkings
                  .filter((m) => m.type === "SALIDA")
                  .pop(); // Última salida

                // 4. Calcular datos para WorkedTimeBar
                let regularMinutes = 0;
                let overtimeMinutes = 0;
                let barLeft = 0;
                let barWidth = 0;
                let entradaTime: Date | null = null; // Guardar Date de entrada

                if (entrada) {
                  entradaTime = new Date(entrada.time);
                  const salidaTime = salida ? new Date(salida.time) : null;

                  const endTimeForCalc = salidaTime
                    ? salidaTime > entradaTime
                      ? salidaTime
                      : null
                    : isSameDay(new Date(), currentDate) &&
                      new Date() > entradaTime
                    ? new Date()
                    : null;

                  if (endTimeForCalc) {
                    const totalWorkedMinutes = differenceInMinutes(
                      endTimeForCalc,
                      entradaTime
                    );
                    // Lógica de descanso podría ir aquí si es necesaria
                    regularMinutes = Math.min(
                      totalWorkedMinutes,
                      STANDARD_WORK_MINUTES
                    );
                    overtimeMinutes = Math.max(
                      0,
                      totalWorkedMinutes - regularMinutes
                    );

                    const startHourDecimal =
                      entradaTime.getHours() + entradaTime.getMinutes() / 60;
                    barLeft = startHourDecimal * HOUR_WIDTH;
                    barWidth =
                      ((regularMinutes + overtimeMinutes) / 60) * HOUR_WIDTH;
                  }
                }

                // --- Calcular estilos base para elementos en esta fila ---
                const rowTopOffset = index * ROW_HEIGHT + HEADER_HEIGHT;
                // Ajustar posiciones verticales para mejor visualización
                const barTop = rowTopOffset + ROW_HEIGHT * 0.15;
                const pinTop = rowTopOffset + ROW_HEIGHT * 0.6; // Un poco más abajo
                const eventTop = rowTopOffset + ROW_HEIGHT * 0.55; // Superponer ligeramente con barra
                const barHeight = ROW_HEIGHT * 0.25; // Más delgada
                const eventHeight = ROW_HEIGHT * 0.35;

                // Estilo base para la barra de tiempo
                const barBaseStyle: React.CSSProperties = {
                  position: "absolute",
                  top: `${barTop}px`,
                  left: `${barLeft}px`,
                  height: `${barHeight}px`,
                  width: `${Math.max(2, barWidth)}px`,
                  zIndex: 5,
                  pointerEvents: "auto", // <<<--- Permitir interacción con la barra
                };

                // Estilo base para los pines
                const pinBaseStyle: React.CSSProperties = {
                  position: "absolute",
                  top: `${pinTop}px`,
                  transform: "translate(-50%, -50%)",
                  zIndex: 20,
                  pointerEvents: "auto", // <<<--- Permitir interacción con los pines
                };

                // Estilo base para los eventos
                const eventBaseStyle: React.CSSProperties = {
                  position: "absolute",
                  top: `${eventTop}px`,
                  height: `${eventHeight}px`,
                  zIndex: 15, // Encima de la barra, debajo de pines/handles
                  pointerEvents: "auto", // <<<--- Permitir interacción con eventos
                };

                return (
                  <React.Fragment
                    key={`${currentDateISO}-${employee.id}-content`}
                  >
                    {/* --- Renderizar Barra de Tiempo Trabajado --- */}
                    {/* Solo renderizar si hay entrada y el ancho es > 0 */}
                    {entrada && barWidth > 0 && (
                      <WorkedTimeBar
                        entradaMarking={entrada}
                        salidaMarking={salida ?? null}
                        regularMinutes={regularMinutes}
                        overtimeMinutes={overtimeMinutes}
                        barStyle={barBaseStyle} // Pasar estilo base
                        hourWidth={HOUR_WIDTH}
                        employeeId={employee.id}
                        currentDateISO={currentDateISO}
                      />
                    )}

                    {/* --- Renderizar Pines de Marcaje --- */}
                    {employeeDayMarkings.map((marking) => {
                      // No renderizar pin si coincide con un handle que ya está en la barra
                      // Solo ocultamos el pin si LA BARRA se está renderizando (barWidth > 0)
                      if (barWidth > 0) {
                        if (
                          marking.type === "ENTRADA" &&
                          entrada?.id === marking.id
                        )
                          return null;
                        if (
                          marking.type === "SALIDA" &&
                          salida?.id === marking.id
                        )
                          return null;
                      }

                      const markingTime = new Date(marking.time);
                      const markingHourDecimal =
                        markingTime.getHours() + markingTime.getMinutes() / 60;
                      const pinLeft = markingHourDecimal * HOUR_WIDTH;

                      return (
                        <TimelineMarkingPin
                          key={marking.id}
                          marking={marking}
                          style={{
                            ...pinBaseStyle,
                            left: `${pinLeft}px`,
                          }}
                        />
                      );
                    })}

                    {/* --- Renderizar Eventos --- */}
                    {employeeDayEvents.map((event) => {
                      const eventStart = new Date(event.startTime);
                      const eventEnd = new Date(event.endTime);

                      // Calcular inicio y fin ajustados al día actual
                      const dayStart = set(currentDate, {
                        hours: 0,
                        minutes: 0,
                        seconds: 0,
                        milliseconds: 0,
                      });
                      const dayEnd = set(currentDate, {
                        hours: 23,
                        minutes: 59,
                        seconds: 59,
                        milliseconds: 999,
                      });

                      // Clamp start/end times to the visible day
                      const clampedStart =
                        eventStart < dayStart ? dayStart : eventStart;
                      const clampedEnd = eventEnd > dayEnd ? dayEnd : eventEnd;

                      // Check if the clamped range is valid (end > start) and overlaps with the current day
                      if (
                        clampedEnd <= clampedStart ||
                        clampedStart >= dayEnd ||
                        clampedEnd <= dayStart
                      ) {
                        return null; // Event is fully outside the current day after clamping
                      }

                      const startHourDecimal =
                        clampedStart.getHours() +
                        clampedStart.getMinutes() / 60;
                      const endHourDecimal =
                        clampedEnd.getHours() +
                        clampedEnd.getMinutes() / 60 +
                        (clampedEnd.getSeconds() > 0 ? 1 / 3600 : 0); // Add fraction for seconds

                      const eventLeft = startHourDecimal * HOUR_WIDTH;
                      // Calculate width, ensuring it's at least minimum (e.g., 15 mins)
                      const eventWidth = Math.max(
                        HOUR_WIDTH / 4, // Min width for 15 mins
                        (endHourDecimal - startHourDecimal) * HOUR_WIDTH
                      );

                      return (
                        <TimelineEventItem
                          key={event.id}
                          event={event}
                          style={{
                            ...eventBaseStyle,
                            left: `${eventLeft}px`,
                            width: `${eventWidth}px`,
                          }}
                        />
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </div>{" "}
            {/* Fin Capa Contenido Visual */}
          </div>{" "}
          {/* Fin Contenedor Interno */}
        </div>{" "}
        {/* Fin Área de Timeline Scrollable */}
      </div> // Fin Contenedor Principal Scrollable
    );
  }
);

TimelineView.displayName = "TimelineView";
export default TimelineView;
