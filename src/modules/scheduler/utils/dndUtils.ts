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
  pointerClientX: number, // Renombrado para claridad: Coordenada X del puntero relativa a la VENTANA
  containerRect: DOMRect | undefined, // Rectángulo del CONTENEDOR DE CONTENIDO
  scrollLeft: number, // Scroll horizontal actual del CONTENEDOR PRINCIPAL
  gridInfo: DroppableTimelineRowData["gridInfo"] // hourWidth
): Date {
  // console.log("[calculateTime] Inputs:", { pointerClientX, containerRect, scrollLeft, gridInfo });

  if (
    !containerRect ||
    !gridInfo ||
    !gridInfo.hourWidth ||
    gridInfo.hourWidth <= 0
  ) {
    console.warn(
      "[calculateTime] Missing or invalid containerRect/gridInfo/hourWidth, returning current time.",
      { containerRect, gridInfo }
    );
    return new Date(); // Fallback
  }

  const { hourWidth } = gridInfo;

  // 1. Posición X del puntero RELATIVA al borde izquierdo VISIBLE del contenedor de contenido
  const pointerXRelativeToContainerVisibleLeft =
    pointerClientX - containerRect.left;

  // 2. Posición X REAL dentro del contenido scrollable (considerando el scroll)
  // Esta es la coordenada horizontal absoluta dentro del área de 24 horas
  const absoluteXInContent =
    pointerXRelativeToContainerVisibleLeft + scrollLeft;

  // 3. Calcular la hora decimal (puede ser < 0 o > 24 temporalmente)
  const hourDecimal = absoluteXInContent / hourWidth;

  // 4. Clamping y cálculo de hora/minuto
  // Clamp primero entre 0 y 24 para evitar horas/minutos negativos o excesivos
  const clampedHourDecimal = Math.max(0, Math.min(24, hourDecimal));

  const hour = Math.floor(clampedHourDecimal);
  // Snap a 5 minutos
  let minute = Math.round(((clampedHourDecimal % 1) * 60) / 5) * 5;

  // Ajustar si el cálculo resulta en 24:00 o más -> debe ser 23:55 max
  let finalHour = hour;
  if (finalHour >= 24) {
    finalHour = 23;
    minute = 55; // Clamp minuto a 55 si la hora es 24 o más
  } else {
    // Asegurar que el minuto no exceda 55 incluso si la hora es < 24
    minute = Math.min(55, minute);
  }

  // Crear fecha con la hora/minuto calculados
  const resultDate = new Date(0); // Usar fecha base (epoch)
  // Usar UTC para evitar problemas de zona horaria local al solo querer H:M
  resultDate.setUTCHours(finalHour, minute, 0, 0);

  // console.log("[calculateTime] Results:", {
  //     pointerXRelativeToContainerVisibleLeft,
  //     absoluteXInContent,
  //     hourDecimal,
  //     clampedHourDecimal,
  //     finalHour,
  //     minute,
  //     resultDateISO: resultDate.toISOString(), // Mostrar hora UTC
  // });

  // Devolver la fecha con la HORA y MINUTO calculados (la fecha del día se añadirá después)
  // Necesitamos devolver H:M locales para que 'set' funcione bien después.
  const localResultDate = new Date();
  localResultDate.setHours(finalHour, minute, 0, 0);
  return localResultDate;
}
