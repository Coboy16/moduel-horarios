import type { Active, Over } from "@dnd-kit/core";
import type {
  ActiveDragData,
  OverDragData,
  DraggableEventData,
  DraggableSidebarItemData,
  DraggableResizeHandleData,
  DraggableWorkedTimeData,
  DroppableCellData,
  DroppableTimelineRowData,
} from "../interfaces/DndData";

export function getActiveData(active: Active | null): ActiveDragData {
  // Asegurarse de que realmente accedemos a 'current' si existe
  return active?.data?.current ? (active.data.current as ActiveDragData) : null;
}

export function getOverData(over: Over | null): OverDragData {
  return over?.data?.current ? (over.data.current as OverDragData) : null;
}

// --- Type guards Draggable ---
export function isDraggableEvent(
  data: ActiveDragData | OverDragData | null | undefined // Hacer el tipo más permisivo
): data is DraggableEventData {
  return !!data && data.type === "event";
}

export function isDraggableSidebarItem(
  data: ActiveDragData | OverDragData | null | undefined
): data is DraggableSidebarItemData {
  return !!data && data.type === "sidebarItem";
}

export function isDraggableResizeHandle(
  data: ActiveDragData | OverDragData | null | undefined
): data is DraggableResizeHandleData {
  return !!data && data.type === "resizeHandle";
}

export function isDraggableWorkedTime(
  data: ActiveDragData | OverDragData | null | undefined
): data is DraggableWorkedTimeData {
  return !!data && data.type === "workedTime";
}

// --- Type guards Droppable ---
export function isDroppableCell(
  data: ActiveDragData | OverDragData | null | undefined
): data is DroppableCellData {
  return !!data && data.type === "cell";
}

export function isDroppableTimelineRow(
  data: ActiveDragData | OverDragData | null | undefined
): data is DroppableTimelineRowData {
  return !!data && data.type === "timelineRow";
}

// --- Helpers de Cálculo ---

// Calcula la hora basado en el offset Y (para vistas Day/Week)
export function calculateTimeFromOffset(
  offsetY: number,
  gridInfo: DroppableCellData["gridInfo"]
): Date {
  // (Sin cambios, asumir que funciona para Day/Week si se usa)
  const { hourHeight, startHour, cellTopOffset } = gridInfo;
  const relativeOffsetY = offsetY - cellTopOffset;
  const hourDecimal = relativeOffsetY / hourHeight + startHour;
  const hour = Math.floor(hourDecimal);
  const minute = Math.floor((hourDecimal % 1) * 60);
  const clampedHour = Math.max(0, Math.min(23, hour));
  const clampedMinute = Math.max(0, Math.min(59, minute));
  const date = new Date();
  date.setHours(clampedHour, clampedMinute, 0, 0);
  return date;
}

// Calcula la hora basado en el offset X (para Timeline)
export function calculateTimeFromTimelineOffset(
  clientX: number, // Coordenada X del puntero relativa a la ventana
  containerRect: DOMRect | undefined, // Rectángulo del *contenedor de contenido* de la timeline
  scrollLeft: number, // Scroll horizontal actual del *contenedor scrollable*
  gridInfo: DroppableTimelineRowData["gridInfo"] // hourWidth y rowLeftOffset (offset de la columna de empleados)
): Date {
  if (!containerRect) {
    console.warn("calculateTimeFromTimelineOffset missing containerRect");
    return new Date(); // Fallback
  }

  // El rowLeftOffset ahora es 0 porque calculamos relativo al área de contenido
  const { hourWidth, rowLeftOffset = 0 } = gridInfo;

  // Posición X relativa al inicio del área de contenido de la timeline
  // clientX - containerRect.left = posición X relativa al viewport, dentro del contenedor de contenido
  // + scrollLeft = ajusta por el scroll horizontal del contenedor padre
  const relativeX = clientX - containerRect.left + scrollLeft - rowLeftOffset;

  const hourDecimal = relativeX / hourWidth;

  // Clamping para evitar valores fuera de 0-24h
  const clampedHourDecimal = Math.max(0, Math.min(24, hourDecimal)); // Permitir hasta 24 para cálculo de minutos

  const hour = Math.floor(clampedHourDecimal);

  // Snap a intervalos de 5 minutos para mejor usabilidad
  let minute = Math.round(((clampedHourDecimal % 1) * 60) / 5) * 5;

  // Ajustar si el cálculo da exactamente 24:00 o más (debería ser 23:55 o similar)
  let finalHour = hour;
  if (hour >= 24) {
    finalHour = 23;
    minute = 55; // Clamp a 55 si es >= 24:00
  } else {
    minute = Math.min(55, minute); // Asegurar que no pase de 55 para horas < 24
  }

  // Usamos una fecha base (0) y solo establecemos horas/minutos
  // La fecha real (día) vendrá del `overData.date` en `handleDragEnd`
  const baseDate = new Date(0);
  baseDate.setUTCHours(finalHour, minute, 0, 0); // Usar UTC para evitar problemas de zona horaria al solo querer H:M

  console.log("[calculateTimeFromTimelineOffset]", {
    clientX,
    containerLeft: containerRect.left,
    scrollLeft,
    rowLeftOffset,
    relativeX,
    hourDecimal,
    finalHour,
    minute,
  });

  // Devolvemos una fecha con la hora y minuto calculados (la fecha del día se aplicará después)
  const resultDate = new Date(); // Crear una nueva fecha para no mutar
  resultDate.setHours(finalHour, minute, 0, 0);
  return resultDate;
}
