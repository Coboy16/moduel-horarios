"use client";

import React, { useRef, forwardRef } from "react"; // Import forwardRef
import { useDroppable } from "@dnd-kit/core";
import { useUI } from "../../hooks/useUI";
import type { Employee } from "../../interfaces/Employee";
import type { Event } from "../../interfaces/Event";
import type { Marking } from "../../interfaces/Marking";
import { formatTime, isSameDay, formatDate } from "../../utils/dateUtils";
import TimelineMarkingPin from "./TimelineMarkingPin"; // Pin visual (no draggable aquí)
import WorkedTimeBar from "./WorkedTimeBar"; // Barra de tiempo (contiene draggables)
import TimelineEventItem from "./TimelineEventItem"; // Evento (draggable)
import { useEmployees } from "../../hooks/useEmployees";
import { differenceInMinutes } from "date-fns";

interface TimelineViewProps {
  currentDate: Date;
  events: Event[];
  markings: Marking[];
  employees: Employee[]; // Empleados seleccionados o a mostrar
  containerWidth: number; // Ancho disponible para el contenido de la timeline
  containerHeight: number; // Alto total del contenedor del calendario
  // Recibimos el ref del contenido para cálculos de D&D
  timelineContentRef: React.RefObject<HTMLDivElement>;
}

const EMPLOYEE_COL_WIDTH = 200; // Ancho columna de empleados
const HEADER_HEIGHT = 40; // Alto cabecera de horas
const HOUR_WIDTH = 80; // Ancho de cada hora en la timeline
const ROW_HEIGHT = 50; // Alto de cada fila de empleado
const STANDARD_WORK_MINUTES = 8 * 60; // 8 horas estándar

// --- Droppable Row Component (Fondo y área de drop) ---
interface DroppableRowProps {
  employeeId: string;
  employeeIndex: number;
  currentDateISO: string;
  rowWidth: number; // Ancho total de la fila
  onContextMenu: (e: React.MouseEvent, employeeId: string) => void;
}
const DroppableRow: React.FC<DroppableRowProps> = ({
  employeeId,
  employeeIndex,
  currentDateISO,
  rowWidth,
  onContextMenu,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `timeline-row-${currentDateISO}-${employeeId}`, // ID único para drop
    data: {
      type: "timelineRow",
      employeeId: employeeId,
      date: new Date(currentDateISO + "T00:00:00"), // Reconstruir fecha del día
      gridInfo: {
        hourWidth: HOUR_WIDTH,
        // El offset izquierdo real para calcular la hora es 0 dentro del área de contenido
        rowLeftOffset: 0,
      },
    },
  });

  return (
    <div
      ref={setNodeRef} // Ref para el área droppable
      className={`absolute border-b border-border ${
        isOver ? "bg-blue-100/30" : "" // Feedback visual al hacer hover durante D&D
      }`}
      style={{
        top: `${employeeIndex * ROW_HEIGHT + HEADER_HEIGHT}px`, // Posición vertical
        left: 0, // Empieza desde el borde izquierdo del área de contenido
        height: `${ROW_HEIGHT}px`, // Alto de la fila
        width: `${rowWidth}px`, // Ancho total (24 horas)
        zIndex: 1, // Detrás de los elementos visuales
      }}
      onContextMenu={(e) => onContextMenu(e, employeeId)} // Permitir context menu en la fila
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
                className="absolute top-0 bottom-0 w-px bg-border/20"
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

// Usamos forwardRef para poder pasar el ref al div principal
const TimelineView = forwardRef<HTMLDivElement, TimelineViewProps>(
  (
    {
      currentDate,
      events, // Todos los eventos (se filtrarán por empleado y día)
      markings, // Todos los marcajes (se filtrarán)
      employees: selectedEmployees,
      containerWidth, // Ancho disponible después de la columna de empleados
      containerHeight, // Alto total disponible
      timelineContentRef, // Ref recibido del padre
    },
    ref // Ref para el div principal (si es necesario, aunque usamos timelineContentRef)
  ) => {
    const { openContextMenu, openAddMarkingModal } = useUI();
    const { employees: allEmployees } = useEmployees();
    const mainScrollContainerRef = useRef<HTMLDivElement>(null); // Ref para el contenedor CON scroll

    // Mostrar empleados seleccionados o un subconjunto si no hay selección
    const displayEmployees =
      selectedEmployees.length > 0
        ? selectedEmployees
        : allEmployees.slice(0, 15); // Limitar a 15 si no hay selección

    const totalTimelineContentWidth = 24 * HOUR_WIDTH;
    const totalTimelineContentHeight =
      displayEmployees.length * ROW_HEIGHT + HEADER_HEIGHT; // Alto total necesario para el contenido
    const currentDateISO = currentDate.toISOString().split("T")[0]; // Formato YYYY-MM-DD

    // Context Menu Handler (calcula la hora basada en la posición del click)
    const handleTimelineContextMenu = (
      e: React.MouseEvent,
      employeeId: string
    ) => {
      e.preventDefault();
      e.stopPropagation(); // Evitar menú del navegador o de elementos superiores

      // Usar el ref del contenido para el cálculo del offset
      const timelineRect = timelineContentRef.current?.getBoundingClientRect();
      // Usar el ref del contenedor con scroll para obtener scrollLeft
      const scrollLeft = mainScrollContainerRef.current?.scrollLeft || 0;

      if (!timelineRect) {
        console.warn("Timeline context menu: Could not get timeline rect.");
        return;
      }

      // Calcular click X relativo al INICIO del ÁREA DE CONTENIDO (después de empleados)
      // clientX: Posición del click en la ventana
      // timelineRect.left: Posición del borde izquierdo del área de contenido en la ventana
      // scrollLeft: Cuánto se ha scrolleado horizontalmente el contenedor
      const clickXInContent = e.clientX - timelineRect.left + scrollLeft;

      // Calcular la hora basado en la posición X y el ancho de la hora
      const hourDecimal = clickXInContent / HOUR_WIDTH;
      const hour = Math.max(0, Math.min(23, Math.floor(hourDecimal))); // Clamp 0-23
      // Snap a 5 minutos
      const minute = Math.round(((hourDecimal % 1) * 60) / 5) * 5;
      const clampedMinute = Math.max(0, Math.min(55, minute)); // Clamp 0-55

      // Crear la fecha/hora del click
      const clickTime = new Date(currentDate); // Usar la fecha actual de la vista
      clickTime.setHours(hour, clampedMinute, 0, 0);

      console.log("Timeline Context Menu Click Time:", clickTime.toISOString());

      // Abrir menú contextual con los datos calculados
      openContextMenu({ x: e.clientX, y: e.clientY }, "timeline", {
        date: clickTime,
        employeeId,
      });
    };

    // Doble click para añadir marcaje
    const handleTimelineDoubleClick = (
      e: React.MouseEvent,
      employeeId: string
    ) => {
      e.preventDefault();
      e.stopPropagation();

      const timelineRect = timelineContentRef.current?.getBoundingClientRect();
      const scrollLeft = mainScrollContainerRef.current?.scrollLeft || 0;

      if (!timelineRect) return;

      const clickXInContent = e.clientX - timelineRect.left + scrollLeft;
      const hourDecimal = clickXInContent / HOUR_WIDTH;
      const hour = Math.max(0, Math.min(23, Math.floor(hourDecimal)));
      const minute = Math.round(((hourDecimal % 1) * 60) / 5) * 5;
      const clampedMinute = Math.max(0, Math.min(55, minute));

      const clickTime = new Date(currentDate);
      clickTime.setHours(hour, clampedMinute, 0, 0);

      console.log("Timeline Double Click Time:", clickTime.toISOString());
      openAddMarkingModal(clickTime, employeeId); // Abrir modal de añadir marcaje
    };

    return (
      // Contenedor principal que permite el scroll horizontal y vertical
      <div
        className="h-full w-full overflow-auto flex"
        ref={mainScrollContainerRef} // Asignar ref al contenedor scrollable
      >
        {/* Columna Fija de Empleados */}
        <div
          className="sticky left-0 z-30 bg-white bg-card shrink-0 border-r border-border shadow-sm"
          style={{ width: `${EMPLOYEE_COL_WIDTH}px` }}
        >
          {/* Header Esquina Superior Izquierda */}
          <div
            className="border-b border-border p-2 flex items-center justify-center font-medium text-sm sticky top-0 bg-card z-10"
            style={{ height: `${HEADER_HEIGHT}px` }}
          >
            {formatDate(currentDate, "medium")} {/* Muestra "1 de Enero" */}
          </div>
          {/* Lista de Nombres de Empleados */}
          {displayEmployees.map((employee) => (
            <div
              key={employee.id}
              className="border-b border-border p-2 flex flex-col justify-center hover:bg-muted/50 cursor-default" // Añadido hover y cursor
              style={{ height: `${ROW_HEIGHT}px` }}
              title={`${employee.name} - ${employee.department}`} // Tooltip simple
            >
              <div className="font-medium truncate text-sm">
                {employee.name}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {employee.department}
              </div>
            </div>
          ))}
          {/* Espacio extra al final para asegurar scroll completo */}
          <div style={{ height: "20px" }}></div>
        </div>

        {/* Área de Timeline Scrollable (Contenido Principal) */}
        <div className="flex-1 min-w-0 relative">
          {/* Contenedor interno que define el tamaño total del contenido y permite posicionamiento absoluto */}
          <div
            ref={timelineContentRef} // Asignar ref al área de contenido para cálculos de D&D
            className="relative"
            style={{
              width: `${totalTimelineContentWidth}px`, // Ancho total (24 horas)
              height: `${totalTimelineContentHeight}px`, // Alto total basado en empleados
            }}
          >
            {/* Cabecera de Horas (Fija arriba) */}
            <div
              className="sticky top-0 z-20 flex border-b border-border bg-card"
              style={{ height: `${HEADER_HEIGHT}px`, width: "100%" }}
            >
              {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
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
                onContextMenu={handleTimelineContextMenu}
              />
            ))}

            {/* Capa para Renderizar Contenido Visual (Barras, Pines, Eventos) */}
            {/* Esta capa se posiciona absolutamente sobre las filas droppables */}
            <div
              className="absolute top-0 left-0 w-full h-full z-10" // Ocupa todo el espacio, z-index mayor que las filas
              onDoubleClick={(e) => {
                // Encontrar el empleado basado en la posición Y del click
                const timelineRect =
                  timelineContentRef.current?.getBoundingClientRect();
                const scrollTop =
                  mainScrollContainerRef.current?.scrollTop ?? 0;
                if (!timelineRect) return;

                const clickYInContent =
                  e.clientY - timelineRect.top + scrollTop - HEADER_HEIGHT;
                const employeeIndex = Math.floor(clickYInContent / ROW_HEIGHT);

                if (
                  employeeIndex >= 0 &&
                  employeeIndex < displayEmployees.length
                ) {
                  const employeeId = displayEmployees[employeeIndex].id;
                  handleTimelineDoubleClick(e, employeeId);
                }
              }}
            >
              {displayEmployees.map((employee, index) => {
                // 1. Filtrar Marcajes del día para este empleado
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

                // 2. Filtrar Eventos del día para este empleado
                const employeeDayEvents = events.filter(
                  (ev) =>
                    ev.employeeId === employee.id &&
                    (isSameDay(new Date(ev.startTime), currentDate) ||
                      isSameDay(new Date(ev.endTime), currentDate) || // Considerar eventos que cruzan medianoche
                      (new Date(ev.startTime) < currentDate &&
                        new Date(ev.endTime) > currentDate))
                );

                // 3. Encontrar ENTRADA y SALIDA principal (lógica simplificada)
                //    Podría necesitar lógica más robusta para múltiples entradas/salidas
                const entrada = employeeDayMarkings.find(
                  (m) => m.type === "ENTRADA"
                );
                // Última salida del día
                const salida = employeeDayMarkings
                  .filter((m) => m.type === "SALIDA")
                  .pop();

                // 4. Calcular datos para la WorkedTimeBar
                let regularMinutes = 0;
                let overtimeMinutes = 0;
                let entradaTime: Date | null = null;
                let barLeft = 0;
                let barWidth = 0;

                if (entrada) {
                  entradaTime = new Date(entrada.time);
                  const salidaTime = salida ? new Date(salida.time) : null;

                  // Determinar el fin para el cálculo: salida, AHORA (si es hoy), o la propia entrada si no hay fin
                  const endTimeForCalc = salidaTime
                    ? salidaTime > entradaTime
                      ? salidaTime
                      : null // Ignorar salida si es antes que entrada
                    : isSameDay(new Date(), currentDate) &&
                      new Date() > entradaTime
                    ? new Date() // Usar AHORA solo si es hoy y posterior a la entrada
                    : null; // No hay fin válido para calcular duración

                  if (endTimeForCalc) {
                    const totalWorkedMinutes = differenceInMinutes(
                      endTimeForCalc,
                      entradaTime
                    );
                    // Aquí se debería restar el tiempo de descanso si se calcula
                    regularMinutes = Math.min(
                      totalWorkedMinutes,
                      STANDARD_WORK_MINUTES
                    );
                    overtimeMinutes = Math.max(
                      0,
                      totalWorkedMinutes - regularMinutes
                    );

                    // Calcular posición y ancho de la barra
                    const startHourDecimal =
                      entradaTime.getHours() + entradaTime.getMinutes() / 60;
                    barLeft = startHourDecimal * HOUR_WIDTH;
                    barWidth =
                      ((regularMinutes + overtimeMinutes) / 60) * HOUR_WIDTH;
                  }
                }

                // --- Calcular estilos base para elementos en esta fila ---
                const rowTopOffset = index * ROW_HEIGHT + HEADER_HEIGHT;
                const barTop = rowTopOffset + ROW_HEIGHT * 0.2; // Barra un poco más arriba
                const pinTop = rowTopOffset + ROW_HEIGHT * 0.65; // Pines un poco más abajo
                const eventTop = rowTopOffset + ROW_HEIGHT * 0.6; // Eventos alineados cerca de los pines
                const barHeight = ROW_HEIGHT * 0.3; // Alto de la barra
                const eventHeight = ROW_HEIGHT * 0.35; // Alto del evento

                // Estilo base para la barra de tiempo
                const barBaseStyle: React.CSSProperties = {
                  position: "absolute",
                  top: `${barTop}px`,
                  left: `${barLeft}px`, // Calculado arriba
                  height: `${barHeight}px`,
                  width: `${Math.max(2, barWidth)}px`, // Ancho mínimo 2px
                  zIndex: 5, // Detrás de pines y eventos
                };

                // Estilo base para los pines
                const pinBaseStyle: React.CSSProperties = {
                  position: "absolute",
                  top: `${pinTop}px`,
                  transform: "translate(-50%, -50%)", // Centrar el pin en su coordenada
                  zIndex: 20, // Encima de la barra
                  pointerEvents: "auto", // Permitir interacción
                };

                // Estilo base para los eventos
                const eventBaseStyle: React.CSSProperties = {
                  position: "absolute",
                  top: `${eventTop}px`, // Alineado verticalmente
                  height: `${eventHeight}px`,
                  zIndex: 15, // Encima de la barra, debajo de los pines
                  pointerEvents: "auto",
                };
                // --- Fin cálculo estilos base ---

                return (
                  // Fragmento para agrupar elementos de un empleado en un día
                  <React.Fragment
                    key={`${currentDateISO}-${employee.id}-content`}
                  >
                    {/* --- Renderizar Barra de Tiempo Trabajado --- */}
                    {entrada && barWidth > 0 && (
                      <WorkedTimeBar
                        entradaMarking={entrada}
                        salidaMarking={salida ?? null}
                        regularMinutes={regularMinutes}
                        overtimeMinutes={overtimeMinutes}
                        barStyle={barBaseStyle} // Pasar estilo base calculado
                        hourWidth={HOUR_WIDTH}
                        employeeId={employee.id}
                        currentDateISO={currentDateISO}
                      />
                    )}

                    {/* --- Renderizar Pines de Marcaje --- */}
                    {employeeDayMarkings.map((marking) => {
                      // No renderizar pin si coincide con un handle que ya está en la barra
                      if (
                        (marking.type === "ENTRADA" &&
                          entrada?.id === marking.id &&
                          barWidth > 0) ||
                        (marking.type === "SALIDA" &&
                          salida?.id === marking.id &&
                          barWidth > 0)
                      ) {
                        // Los handles están en WorkedTimeBar, no pintamos pin extra
                        // return null;
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
                            ...pinBaseStyle, // Usar estilo base
                            left: `${pinLeft}px`, // Calcular posición horizontal
                          }}
                        />
                      );
                    })}

                    {/* --- Renderizar Eventos --- */}
                    {employeeDayEvents.map((event) => {
                      const eventStart = new Date(event.startTime);
                      const eventEnd = new Date(event.endTime);

                      // Calcular inicio y fin ajustados al día actual
                      const dayStart = new Date(currentDate);
                      dayStart.setHours(0, 0, 0, 0);
                      const dayEnd = new Date(currentDate);
                      dayEnd.setHours(23, 59, 59, 999);

                      const clampedStart =
                        eventStart < dayStart ? dayStart : eventStart;
                      const clampedEnd = eventEnd > dayEnd ? dayEnd : eventEnd;

                      // Convertir a horas decimales
                      const startHourDecimal =
                        clampedStart.getHours() +
                        clampedStart.getMinutes() / 60;
                      const endHourDecimal =
                        clampedEnd.getHours() + clampedEnd.getMinutes() / 60;

                      // Calcular posición y ancho del evento
                      const eventLeft = startHourDecimal * HOUR_WIDTH;
                      const eventWidth = Math.max(
                        HOUR_WIDTH / 4, // Ancho mínimo (e.g., 15 min)
                        (endHourDecimal - startHourDecimal) * HOUR_WIDTH
                      );

                      return (
                        <TimelineEventItem
                          key={event.id}
                          event={event}
                          style={{
                            ...eventBaseStyle, // Usar estilo base
                            left: `${eventLeft}px`,
                            width: `${eventWidth}px`,
                          }}
                        />
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </div>
            {/* Fin Capa Contenido Visual */}
          </div>
          {/* Fin Contenedor Interno */}
        </div>
        {/* Fin Área de Timeline Scrollable */}
      </div>
      // Fin Contenedor Principal Scrollable
    );
  }
);

TimelineView.displayName = "TimelineView"; // Añadir displayName para forwardRef
export default TimelineView;
