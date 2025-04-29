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

// --- Funciones getActiveData y getOverData (sin cambios) ---
export function getActiveData(active: Active | null): ActiveDragData {
  return active?.data?.current ? (active.data.current as ActiveDragData) : null;
}

export function getOverData(over: Over | null): OverDragData {
  return over?.data?.current ? (over.data.current as OverDragData) : null;
}

// --- Type guards (sin cambios) ---
export function isDraggableEvent(
  data: ActiveDragData | OverDragData | null | undefined
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

// --- calculateTimeFromOffset (para Day/Week - sin cambios) ---
export function calculateTimeFromOffset(
  offsetY: number,
  gridInfo: DroppableCellData["gridInfo"]
): Date {
  // ... (código existente)
  const { hourHeight, startHour, cellTopOffset } = gridInfo;
  const relativeOffsetY = offsetY - cellTopOffset;
  const hourDecimal = relativeOffsetY / hourHeight + startHour;
  const hour = Math.floor(hourDecimal);
  const minute = Math.floor((hourDecimal % 1) * 60);
  const clampedHour = Math.max(0, Math.min(23, hour));
  const clampedMinute = Math.max(0, Math.min(59, minute));
  const date = new Date(); // La fecha real debería venir del contexto del drop
  date.setHours(clampedHour, clampedMinute, 0, 0);
  return date;
}

// --- calculateTimeFromTimelineOffset (REVISADO con LOGS) ---
export function calculateTimeFromTimelineOffset(
  clientX: number, // Coordenada X del puntero relativa a la VENTANA
  containerRect: DOMRect | undefined, // Rectángulo del CONTENEDOR DE CONTENIDO (el div scrollable interno)
  scrollLeft: number, // Scroll horizontal actual del CONTENEDOR PRINCIPAL (el que tiene overflow)
  gridInfo: DroppableTimelineRowData["gridInfo"] // hourWidth y rowLeftOffset (debería ser 0 si containerRect es el contenido)
): Date {
  console.log("[calculateTime] Inputs:", {
    clientX,
    containerRect,
    scrollLeft,
    gridInfo,
  });

  if (!containerRect) {
    console.warn(
      "[calculateTime] Missing containerRect, returning current time."
    );
    return new Date(); // Fallback
  }

  const { hourWidth, rowLeftOffset = 0 } = gridInfo; // rowLeftOffset debería ser 0 aquí

  // 1. Calcular la posición X del puntero RELATIVA al borde izquierdo VISIBLE del contenedor de contenido
  const pointerXRelativeToContainerVisibleLeft = clientX - containerRect.left;

  // 2. Calcular la posición X REAL dentro del contenido scrollable (considerando el scroll)
  const absoluteXInContent =
    pointerXRelativeToContainerVisibleLeft + scrollLeft;

  // 3. Ajustar por el offset inicial de la fila (si lo hubiera, aunque aquí es 0)
  const relativeX = absoluteXInContent - rowLeftOffset;

  // 4. Calcular la hora decimal
  const hourDecimal = relativeX / hourWidth;

  // 5. Clamping y cálculo de hora/minuto
  const clampedHourDecimal = Math.max(0, Math.min(24, hourDecimal));
  const hour = Math.floor(clampedHourDecimal);
  // Snap a 5 minutos
  let minute = Math.round(((clampedHourDecimal % 1) * 60) / 5) * 5;

  // Ajustar si pasa de 24:00
  let finalHour = hour;
  if (hour >= 24) {
    finalHour = 23;
    minute = 55;
  } else {
    minute = Math.min(55, minute); // Clamp a 55
  }

  // Crear fecha con la hora/minuto calculados (la fecha del día se añadirá después)
  const resultDate = new Date(); // Usar new Date() para obtener un objeto Date válido
  resultDate.setHours(finalHour, minute, 0, 0); // Establecer H:M locales

  console.log("[calculateTime] Results:", {
    pointerXRelativeToContainerVisibleLeft,
    absoluteXInContent,
    relativeX,
    hourDecimal,
    finalHour,
    minute,
    resultDateISO: resultDate.toISOString(),
  });

  return resultDate; // Devuelve una fecha con H:M calculados
}
