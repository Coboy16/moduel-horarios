import type { Active, Over } from "@dnd-kit/core";
import type {
  ActiveDragData,
  OverDragData,
  DraggableEventData,
  DraggableSidebarItemData,
  DraggableResizeHandleData,
  DroppableCellData,
  DroppableTimelineRowData,
} from "../interfaces/DndData";

export function getActiveData(active: Active | null): ActiveDragData {
  return (active?.data?.current as ActiveDragData) ?? null;
}

export function getOverData(over: Over | null): OverDragData {
  return (over?.data?.current as OverDragData) ?? null;
}

// Type guards para identificar el tipo de elemento arrastrado
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

// Type guards para identificar el contenedor sobre el que se suelta
export function isDroppableCell(data: OverDragData): data is DroppableCellData {
  return data?.type === "cell";
}

export function isDroppableTimelineRow(
  data: OverDragData
): data is DroppableTimelineRowData {
  return data?.type === "timelineRow";
}

// Puedes añadir más type guards si implementas más tipos (ej. deleteZone)

// Helper para calcular la nueva hora en DayView/WeekView
export function calculateTimeFromOffset(
  offsetY: number,
  gridInfo: DroppableCellData["gridInfo"]
): Date {
  const { hourHeight, startHour, cellTopOffset } = gridInfo;
  const relativeOffsetY = offsetY - cellTopOffset;
  const hourDecimal = relativeOffsetY / hourHeight + startHour;
  const hour = Math.floor(hourDecimal);
  const minute = Math.floor((hourDecimal % 1) * 60);

  // Clamping para asegurar que esté dentro de 0-23 horas
  const clampedHour = Math.max(0, Math.min(23, hour));
  const clampedMinute = Math.max(0, Math.min(59, minute));

  const date = new Date(); // Usamos una fecha temporal, se reemplazará con la del 'over'
  date.setHours(clampedHour, clampedMinute, 0, 0);
  return date;
}

// Helper para calcular la nueva hora en TimelineView
export function calculateTimeFromTimelineOffset(
  offsetX: number,
  gridInfo: DroppableTimelineRowData["gridInfo"]
): Date {
  const { hourWidth, rowLeftOffset } = gridInfo;
  const relativeOffsetX = offsetX - rowLeftOffset;
  const hourDecimal = relativeOffsetX / hourWidth;
  const hour = Math.floor(hourDecimal);
  const minute = Math.floor((hourDecimal % 1) * 60);

  // Clamping
  const clampedHour = Math.max(0, Math.min(23, hour));
  const clampedMinute = Math.max(0, Math.min(59, minute));

  const date = new Date(); // Fecha temporal
  date.setHours(clampedHour, clampedMinute, 0, 0);
  return date;
}
