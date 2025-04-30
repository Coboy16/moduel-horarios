/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/views/DayTimeline.tsx
import React from "react";
import { cn } from "../../lib/utils"; // Ajusta la ruta a tu archivo utils
import { MapPin } from "lucide-react"; // Icono por defecto para marcajes

// --- Tipos de Datos Simplificados ---
interface Schedule {
  id: string;
  label?: string;
  startTime: number;
  endTime: number;
}
interface WorkedTime {
  id: string;
  startTime: number;
  endTime: number;
}
interface Marking {
  id: string;
  time: number;
  type?: string;
  icon?: React.ElementType;
  color?: string;
}

// --- Props del Componente ---
interface DayTimelineProps {
  schedule?: Schedule;
  worked?: WorkedTime; // Este ya no se pasará si el día es futuro desde MonthView
  markings?: Marking[];
  width: number;
  height: number;
  onContextMenu?: (
    event: React.MouseEvent<HTMLDivElement>,
    type: "worked",
    data: any
  ) => void;
  isFallbackData?: boolean;
  /** Indica si el día que representa esta línea de tiempo es futuro */
  isFuture: boolean; // <--- NUEVA PROP
}

// --- Constantes Internas ---
const HOUR_WIDTH_FACTOR = 1 / 24;

export function DayTimeline({
  schedule,
  worked, // worked será undefined si es futuro
  markings = [],
  width,
  height,
  onContextMenu,
  isFallbackData = false,
  isFuture, // <--- Recibe la nueva prop
}: DayTimelineProps) {
  const barLayer: React.ReactNode[] = [];
  const markingLayer: React.ReactNode[] = [];
  // La opacidad ya no se aplica aquí, se maneja en MonthView si se desea
  // const fallbackClass = isFallbackData ? "opacity-60" : "";
  const fallbackClass = ""; // Sin opacidad por defecto

  // --- Constantes de Estilo ---
  const SCHEDULE_BAR_TOP_PERCENT = 60;
  const WORKED_BAR_TOP_PERCENT = 25;
  const BAR_HEIGHT_PERCENT = 25;
  const MARKING_TOP_PERCENT = 85;
  const MARKING_ICON_SIZE = "w-2 h-2";

  // --- Cálculos de Píxeles ---
  const scheduleTop = (SCHEDULE_BAR_TOP_PERCENT / 100) * height;
  const workedTop = (WORKED_BAR_TOP_PERCENT / 100) * height;
  const barHeightPx = Math.max(2, (BAR_HEIGHT_PERCENT / 100) * height);
  const markingTop = (MARKING_TOP_PERCENT / 100) * height;

  // --- Helper Formato Hora ---
  const formatTime = (decimalTime: number): string => {
    /* ... sin cambios ... */
    const totalMinutes = Math.round(decimalTime * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
  };

  // --- Lógica de Renderizado ---

  // 1. Render SCHEDULE (Barra inferior clara)
  if (schedule) {
    const leftPx = schedule.startTime * HOUR_WIDTH_FACTOR * width;
    const barWidthPx =
      (schedule.endTime - schedule.startTime) * HOUR_WIDTH_FACTOR * width;
    if (barWidthPx > 0.5) {
      barLayer.push(
        <div
          key={`sched-${schedule.id}`}
          onContextMenu={(e) =>
            onContextMenu?.(e, "worked", {
              scheduleId: schedule.id,
              type: "schedule",
            })
          }
          className={cn(
            "absolute rounded-sm overflow-hidden",
            "bg-green-100 border border-green-300",
            fallbackClass,
            "pointer-events-auto cursor-context-menu"
          )}
          style={{
            top: `${scheduleTop}px`,
            left: `${leftPx}px`,
            width: `${barWidthPx}px`,
            height: `${barHeightPx}px`,
            zIndex: 5,
          }}
          title={`${schedule.label || "Turno"}: ${formatTime(
            schedule.startTime
          )} - ${formatTime(schedule.endTime)}`}
        />
      );
    }

    // 2. Render ABSENCE (Rayas rojas, barra superior)
    if (worked) {
      // Si hay datos 'worked' (solo si es pasado o hoy)
      // Ausencia al inicio
      if (worked.startTime > schedule.startTime) {
        /* ... render abs-start ... */
        const absenceEnd = Math.min(worked.startTime, schedule.endTime);
        const absenceWidthPx =
          (absenceEnd - schedule.startTime) * HOUR_WIDTH_FACTOR * width;
        if (absenceWidthPx > 0.5) {
          barLayer.push(
            <div
              key={`abs-start-${schedule.id}`}
              className={cn(
                "absolute bg-red-200 rounded-sm O-h P-e-n",
                fallbackClass
              )}
              style={{
                top: `${workedTop}px`,
                left: `${schedule.startTime * HOUR_WIDTH_FACTOR * width}px`,
                width: `${absenceWidthPx}px`,
                height: `${barHeightPx}px`,
                zIndex: 16,
              }}
            >
              <div className="absolute inset-0 bg-stripes-pattern opacity-70"></div>
            </div>
          );
        }
      }
      // Ausencia al final
      if (worked.endTime < schedule.endTime) {
        /* ... render abs-end ... */
        const absenceStart = Math.max(worked.endTime, schedule.startTime);
        const absenceWidthPx =
          (schedule.endTime - absenceStart) * HOUR_WIDTH_FACTOR * width;
        if (absenceWidthPx > 0.5) {
          barLayer.push(
            <div
              key={`abs-end-${schedule.id}`}
              className={cn(
                "absolute bg-red-200 rounded-sm O-h P-e-n",
                fallbackClass
              )}
              style={{
                top: `${workedTop}px`,
                left: `${absenceStart * HOUR_WIDTH_FACTOR * width}px`,
                width: `${absenceWidthPx}px`,
                height: `${barHeightPx}px`,
                zIndex: 16,
              }}
            >
              <div className="absolute inset-0 bg-stripes-pattern opacity-70"></div>
            </div>
          );
        }
      }
    } else if (!isFuture) {
      // Si NO hay datos worked Y NO es futuro -> mostrar ausencia completa
      const absenceWidthPx =
        (schedule.endTime - schedule.startTime) * HOUR_WIDTH_FACTOR * width;
      if (absenceWidthPx > 0.5) {
        barLayer.push(
          <div
            key={`abs-full-${schedule.id}`}
            className={cn(
              "absolute bg-red-200 rounded-sm overflow-hidden pointer-events-none",
              fallbackClass
            )}
            style={{
              top: `${workedTop}px`,
              left: `${schedule.startTime * HOUR_WIDTH_FACTOR * width}px`,
              width: `${absenceWidthPx}px`,
              height: `${barHeightPx}px`,
              zIndex: 16,
            }}
          >
            <div className="absolute inset-0 bg-stripes-pattern opacity-70"></div>
          </div>
        );
      }
    }
    // Si no hay 'worked' Y SÍ es futuro, no se renderiza la barra de ausencia completa.
  }

  // 3. Render WORKED y OVERTIME (Barra superior) - Solo si 'worked' existe (pasado o hoy)
  if (worked) {
    const workedStart = worked.startTime;
    const workedEnd = worked.endTime;
    const scheduleStart = schedule?.startTime ?? -Infinity;
    const scheduleEnd = schedule?.endTime ?? Infinity;
    const regularStart = Math.max(workedStart, scheduleStart);
    const regularEnd = Math.min(workedEnd, scheduleEnd);
    const regularWidthPx =
      regularEnd > regularStart
        ? (regularEnd - regularStart) * HOUR_WIDTH_FACTOR * width
        : 0;
    const overtimeStart = Math.max(workedStart, scheduleEnd);
    const overtimeEnd = workedEnd;
    const overtimeWidthPx =
      overtimeEnd > overtimeStart
        ? (overtimeEnd - overtimeStart) * HOUR_WIDTH_FACTOR * width
        : 0;

    if (regularWidthPx > 0.5) {
      barLayer.push(
        <div
          key={`workR-${worked.id}`}
          onContextMenu={(e) =>
            onContextMenu?.(e, "worked", {
              workedId: worked.id,
              type: "regular",
            })
          }
          className={cn(
            "absolute bg-green-500 rounded-sm",
            fallbackClass,
            "pointer-events-auto cursor-context-menu"
          )}
          style={{
            top: `${workedTop}px`,
            left: `${regularStart * HOUR_WIDTH_FACTOR * width}px`,
            width: `${regularWidthPx}px`,
            height: `${barHeightPx}px`,
            zIndex: 15,
          }}
          title={`Trabajado: ${formatTime(regularStart)} - ${formatTime(
            regularEnd
          )}`}
        />
      );
    }
    if (overtimeWidthPx > 0.5) {
      barLayer.push(
        <div
          key={`workOT-${worked.id}`}
          onContextMenu={(e) =>
            onContextMenu?.(e, "worked", {
              workedId: worked.id,
              type: "overtime",
            })
          }
          className={cn(
            "absolute bg-yellow-400 rounded-sm",
            fallbackClass,
            "pointer-events-auto cursor-context-menu"
          )}
          style={{
            top: `${workedTop}px`,
            left: `${overtimeStart * HOUR_WIDTH_FACTOR * width}px`,
            width: `${overtimeWidthPx}px`,
            height: `${barHeightPx}px`,
            zIndex: 14,
          }}
          title={`Extra: ${formatTime(overtimeStart)} - ${formatTime(
            overtimeEnd
          )}`}
        />
      );
    }
  }

  // 4. Render MARKINGS
  markings.forEach((mark) => {
    const pinLeftPx = mark.time * HOUR_WIDTH_FACTOR * width;
    const IconComponent = mark.icon || MapPin;
    markingLayer.push(
      <div
        key={`mark-${mark.id}`}
        className={cn(
          "absolute z-30 flex items-center justify-center",
          fallbackClass,
          "pointer-events-auto"
        )}
        style={{
          top: `${markingTop}px`,
          left: `${pinLeftPx}px`,
          transform: "translate(-50%, -50%)",
        }}
        title={`${mark.type || "Marcaje"} @ ${formatTime(mark.time)}`}
      >
        {" "}
        <IconComponent className={cn(MARKING_ICON_SIZE, mark.color)} />{" "}
      </div>
    );
  });

  return (
    <div className="relative w-full h-full pointer-events-none">
      <div className="absolute inset-0 z-10">{barLayer}</div>
      <div className="absolute inset-0 z-20">{markingLayer}</div>
    </div>
  );
}
