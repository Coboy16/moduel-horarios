"use client";

import React, { useRef } from "react"; // Import React
import { useDroppable } from "@dnd-kit/core";
import { useUI } from "../../hooks/useUI";
import type { Employee } from "../../interfaces/Employee";
import type { Event } from "../../interfaces/Event";
import type { Marking } from "../../interfaces/Marking";
import { formatTime, isSameDay, formatDate } from "../../utils/dateUtils";
import TimelineMarkingPin from "./TimelineMarkingPin";
import WorkedTimeBar from "./WorkedTimeBar";
import { useEmployees } from "../../hooks/useEmployees";
import { differenceInMinutes } from "date-fns";

interface TimelineViewProps {
  currentDate: Date;
  events: Event[];
  markings: Marking[];
  employees: Employee[];
  containerWidth: number;
  containerHeight: number;
}

const EMPLOYEE_COL_WIDTH = 200;
const HEADER_HEIGHT = 40;
const HOUR_WIDTH = 80;
const ROW_HEIGHT = 50;
const STANDARD_WORK_MINUTES = 8 * 60;

// --- Droppable Row Component (Sólo para D&D y Grid) ---
interface DroppableRowProps {
  employeeId: string;
  employeeIndex: number; // Index needed for height calculation
  currentDateISO: string; // To make ID unique per day
  onContextMenu: (e: React.MouseEvent, employeeId: string) => void;
}
const DroppableRow: React.FC<DroppableRowProps> = ({
  employeeId,
  employeeIndex,
  currentDateISO,
  onContextMenu,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `timeline-row-${currentDateISO}-${employeeId}`, // Unique ID per day/employee
    data: {
      type: "timelineRow",
      employeeId: employeeId,
      date: new Date(currentDateISO), // Reconstruir fecha desde ISO
      gridInfo: {
        hourWidth: HOUR_WIDTH,
        rowLeftOffset: EMPLOYEE_COL_WIDTH,
      },
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`border-b border-border relative ${
        isOver ? "bg-blue-100/50" : ""
      }`}
      style={{
        position: "absolute", // Rows are also absolutely positioned now
        top: `${employeeIndex * ROW_HEIGHT + HEADER_HEIGHT}px`,
        left: 0, // Starts from the beginning of the timeline content area
        height: `${ROW_HEIGHT}px`,
        width: `${24 * HOUR_WIDTH}px`, // Full width for the grid lines
      }}
      onContextMenu={(e) => onContextMenu(e, employeeId)}
    >
      {/* Grid Lines */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
          <div
            key={`hour-line-${hour}`}
            className="absolute top-0 bottom-0 border-r border-border/50"
            style={{ left: `${hour * HOUR_WIDTH}px`, width: "1px" }}
          >
            {[15, 30, 45].map((minute) => (
              <div
                key={`minute-line-${hour}-${minute}`}
                className="absolute top-0 bottom-0 w-px bg-border/20"
                style={{ left: `${(minute / 60) * HOUR_WIDTH}px` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
// --- End Droppable Row ---

export default function TimelineView({
  currentDate,
  markings,
  employees: selectedEmployees,
}: TimelineViewProps) {
  const { openContextMenu } = useUI();
  const { employees: allEmployees } = useEmployees();
  const mainContainerRef = useRef<HTMLDivElement>(null); // Ref for the main scrollable container
  const timelineContentRef = useRef<HTMLDivElement>(null); // Ref for the timeline content area

  const displayEmployees =
    selectedEmployees.length > 0
      ? selectedEmployees
      : allEmployees.slice(0, 10);

  const totalTimelineContentWidth = 24 * HOUR_WIDTH;
  const totalTimelineContentHeight = displayEmployees.length * ROW_HEIGHT;
  const currentDateISO = currentDate.toISOString().split("T")[0]; // Get YYYY-MM-DD for unique IDs

  // Context Menu Handler (Needs adjustment for scroll)
  const handleTimelineContextMenu = (
    e: React.MouseEvent,
    employeeId: string
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const timelineRect = timelineContentRef.current?.getBoundingClientRect();
    const mainScrollLeft = mainContainerRef.current?.scrollLeft || 0;

    if (!timelineRect) return;

    // Calculate click position relative to the *timeline content area*
    const clickX = e.clientX - timelineRect.left + mainScrollLeft;

    const hourDecimal = clickX / HOUR_WIDTH;
    const hour = Math.max(0, Math.min(23, Math.floor(hourDecimal)));
    const minute = Math.max(
      0,
      Math.min(59, Math.floor((hourDecimal % 1) * 60))
    );

    const clickTime = new Date(currentDate);
    clickTime.setHours(hour, minute, 0, 0);

    openContextMenu({ x: e.clientX, y: e.clientY }, "timeline", {
      date: clickTime,
      employeeId,
    });
  };

  return (
    <div
      className="h-full overflow-auto flex" // Main container scrollable
      ref={mainContainerRef}
    >
      {/* Columna Fija de Empleados */}
      <div
        className="sticky left-0 z-30 bg-white shrink-0 border-r border-border"
        style={{ width: `${EMPLOYEE_COL_WIDTH}px` }}
      >
        {/* Header Esquina */}
        <div
          className="border-b border-border p-2 flex items-center justify-center font-medium text-sm sticky top-0 bg-white z-10"
          style={{ height: `${HEADER_HEIGHT}px` }}
        >
          {formatDate(currentDate, "medium")}
        </div>
        {/* Lista de Empleados */}
        {displayEmployees.map((employee) => (
          <div
            key={employee.id}
            className="border-b border-border p-2 flex flex-col justify-center"
            style={{ height: `${ROW_HEIGHT}px` }}
          >
            <div className="font-medium truncate text-sm">{employee.name}</div>
            <div className="text-xs text-muted-foreground truncate">
              {employee.department}
            </div>
          </div>
        ))}
        {/* Empty space at the bottom to allow scrolling past last employee */}
        <div style={{ height: "20px" }}></div>
      </div>

      {/* Área de Timeline Scrollable (Contenido) */}
      <div className="flex-1 overflow-x-visible">
        <div
          ref={timelineContentRef} // Add ref here
          className="relative"
          style={{
            width: `${totalTimelineContentWidth}px`,
            height: `${totalTimelineContentHeight + HEADER_HEIGHT + 20}px`, // Ensure height accommodates content + header + buffer
          }}
        >
          {/* Cabecera de Horas */}
          <div
            className="sticky top-0 z-20 flex border-b border-border bg-white"
            style={{ height: `${HEADER_HEIGHT}px`, width: "100%" }} // Take full width of content
          >
            {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
              <div
                key={`header-${hour}`}
                className="shrink-0 border-r border-border p-2 text-center text-xs flex items-center justify-center"
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
              onContextMenu={handleTimelineContextMenu}
            />
          ))}

          {/* Renderizar Contenido (Barras y Pines) ABSOLUTAMENTE */}
          <div className="absolute top-0 left-0 w-full h-full z-10 pointer-events-none">
            {" "}
            {/* Container for visual items */}
            {displayEmployees.map((employee, index) => {
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

              const entrada = employeeDayMarkings.find(
                (m) => m.type === "ENTRADA"
              );
              const salida = employeeDayMarkings
                .filter((m) => m.type === "SALIDA")
                .pop();

              let regularMinutes = 0;
              let overtimeMinutes = 0;
              let entradaTime: Date | null = null;
              let barLeft = 0;
              let barWidth = 0;

              if (entrada) {
                entradaTime = new Date(entrada.time);
                const salidaTime = salida ? new Date(salida.time) : null;
                const endTimeForCalc =
                  salidaTime ??
                  (isSameDay(new Date(), currentDate) ? new Date() : null); // Use NOW only if it's today and no exit yet

                if (endTimeForCalc && endTimeForCalc > entradaTime) {
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

                  // Calculate bar position and width
                  const startHourDecimal =
                    entradaTime.getHours() + entradaTime.getMinutes() / 60;
                  barLeft = startHourDecimal * HOUR_WIDTH;
                  barWidth =
                    ((regularMinutes + overtimeMinutes) / 60) * HOUR_WIDTH;
                } else if (!salida && isSameDay(new Date(), currentDate)) {
                  // Handle "in progress" - bar goes from entrada to current time
                  const nowTime = new Date();
                  if (nowTime > entradaTime) {
                    const totalWorkedMinutes = differenceInMinutes(
                      nowTime,
                      entradaTime
                    );
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
              }

              // --- Calcular estilos base ---
              const barTop =
                index * ROW_HEIGHT + HEADER_HEIGHT + ROW_HEIGHT * 0.25; // 25% down in the row
              const pinTop =
                index * ROW_HEIGHT + HEADER_HEIGHT + ROW_HEIGHT * 0.65; // 65% down in the row (adjust as needed)
              const barHeight = ROW_HEIGHT * 0.35; // 35% of row height

              const barBaseStyle: React.CSSProperties = {
                position: "absolute",
                top: `${barTop}px`,
                left: `${barLeft}px`,
                height: `${barHeight}px`,
                width: `${Math.max(1, barWidth)}px`, // Min width 1px
              };

              const pinBaseStyle: React.CSSProperties = {
                position: "absolute",
                top: `${pinTop}px`,
                transform: "translateX(-50%)",
                zIndex: 20,
                pointerEvents: "auto", // Allow interaction with pins
              };
              // --- Fin cálculo estilos base ---

              return (
                <React.Fragment
                  key={`${currentDateISO}-${employee.id}-content`}
                >
                  {/* Renderizar Barra de Tiempo Trabajado si hay entrada */}
                  {entrada && barWidth > 0 && (
                    <WorkedTimeBar
                      entradaMarking={entrada}
                      salidaMarking={salida ?? null}
                      regularMinutes={regularMinutes}
                      overtimeMinutes={overtimeMinutes}
                      barStyle={barBaseStyle}
                      hourWidth={HOUR_WIDTH}
                      employeeId={employee.id}
                      currentDateISO={currentDateISO}
                    />
                  )}

                  {/* Renderizar Pines de Marcaje */}
                  {entrada && entradaTime && (
                    <TimelineMarkingPin
                      marking={entrada}
                      style={{
                        ...pinBaseStyle,
                        left: `${
                          (entradaTime.getHours() +
                            entradaTime.getMinutes() / 60) *
                          HOUR_WIDTH
                        }px`,
                      }}
                    />
                  )}
                  {salida && (
                    <TimelineMarkingPin
                      marking={salida}
                      style={{
                        ...pinBaseStyle,
                        left: `${
                          (new Date(salida.time).getHours() +
                            new Date(salida.time).getMinutes() / 60) *
                          HOUR_WIDTH
                        }px`,
                      }}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
