// src/modules/scheduler/utils/dndUtils.ts
import type { Active, Over } from "@dnd-kit/core";
import type {
  ActiveDragData,
  OverDragData,
  DraggableEventData,
  DraggableSidebarItemData,
  DraggableResizeHandleData,
  DraggableWorkedTimeData, // IMPORTADO
  DroppableCellData,
  DroppableTimelineRowData,
} from "../interfaces/DndData";

export function getActiveData(active: Active | null): ActiveDragData {
  return (active?.data?.current as ActiveDragData) ?? null;
}

export function getOverData(over: Over | null): OverDragData {
  return (over?.data?.current as OverDragData) ?? null;
}

// --- Type guards Draggable ---
export function isDraggableEvent(
  data: ActiveDragData
): data is DraggableEventData {
  return data?.type === "event";
}

export function isDraggableSidebarItem(
  data: ActiveDragData
): data is DraggableSidebarItemData {
  return data?.type === "sidebarItem";
}

export function isDraggableResizeHandle(
  data: ActiveDragData
): data is DraggableResizeHandleData {
  return data?.type === "resizeHandle";
}

// NUEVO type guard para WorkedTimeBar
export function isDraggableWorkedTime(
  data: ActiveDragData
): data is DraggableWorkedTimeData {
  return data?.type === "workedTime";
}

// --- Type guards Droppable ---
export function isDroppableCell(data: OverDragData): data is DroppableCellData {
  return data?.type === "cell";
}

export function isDroppableTimelineRow(
  data: OverDragData
): data is DroppableTimelineRowData {
  return data?.type === "timelineRow";
}

// --- Helpers de Cálculo (Sin cambios aquí) ---

export function calculateTimeFromOffset(
  offsetY: number,
  gridInfo: DroppableCellData["gridInfo"]
): Date {
  const { hourHeight, startHour, cellTopOffset } = gridInfo;
  // Considerar scroll si el contenedor grid es scrollable
  const relativeOffsetY = offsetY - cellTopOffset; // Ajustar si cellTopOffset es relativo a la ventana vs al contenedor scrollable
  const hourDecimal = relativeOffsetY / hourHeight + startHour;
  const hour = Math.floor(hourDecimal);
  const minute = Math.floor((hourDecimal % 1) * 60);

  const clampedHour = Math.max(0, Math.min(23, hour));
  const clampedMinute = Math.max(0, Math.min(59, minute));

  const date = new Date();
  date.setHours(clampedHour, clampedMinute, 0, 0);
  return date;
}

export function calculateTimeFromTimelineOffset(
  clientX: number, // Coordenada X del puntero relativa a la ventana
  containerRect: DOMRect | undefined, // Rectángulo del *contenedor scrollable*
  scrollLeft: number, // Scroll horizontal actual del contenedor
  gridInfo: DroppableTimelineRowData["gridInfo"] // hourWidth y rowLeftOffset (offset de la columna de empleados)
): Date {
  if (!containerRect) {
    console.warn("calculateTimeFromTimelineOffset missing containerRect");
    return new Date(); // Fallback
  }

  const { hourWidth, rowLeftOffset } = gridInfo;

  // Calcular la posición X relativa al *inicio del contenido de la timeline* (después de la columna de empleados)
  // dentro del contenedor scrollable.
  const relativeX = clientX - containerRect.left - rowLeftOffset + scrollLeft;

  const hourDecimal = relativeX / hourWidth;

  // Clamping para evitar valores fuera de 0-24h
  const clampedHourDecimal = Math.max(0, Math.min(24, hourDecimal));

  const hour = Math.floor(clampedHourDecimal);
  // Snap a intervalos de 5 minutos para mejor usabilidad
  let minute = Math.round(((clampedHourDecimal % 1) * 60) / 5) * 5;

  // Ajustar si el cálculo da exactamente 24:00 (debería ser 23:55 o similar)
  const finalHour = Math.min(23, hour); // Asegurar que la hora no sea 24
  if (hour >= 24) {
    minute = 59; // O 55 si usas snap de 5 min
  } else {
    minute = Math.min(55, minute); // Clamp a 55 si usas snap de 5 min
  }

  const date = new Date(); // Fecha temporal, la fecha real vendrá del 'overData.date'
  date.setHours(finalHour, minute, 0, 0);
  return date;
}
