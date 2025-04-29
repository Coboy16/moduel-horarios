// src/modules/scheduler/interfaces/DndData.ts
import type { Event } from "./Event";

// Tipos Draggable Actualizados
export type DraggableItemType =
  | "event"
  | "sidebarItem"
  | "resizeHandle"
  | "workedTime"; // NUEVO TIPO

export type DroppableContainerType = "cell" | "timelineRow" | "deleteZone";

export interface DraggableEventData {
  type: "event";
  event: Event;
}

export interface DraggableSidebarItemData {
  type: "sidebarItem";
  itemType: string;
  itemData: {
    name: string;
    color: string;
    category: string;
    defaultDurationHours?: number;
  };
}

// Draggable para la barra de tiempo trabajado completa
export interface DraggableWorkedTimeData {
  type: "workedTime";
  entradaMarkingId: string;
  salidaMarkingId: string | null; // ID de la salida (puede ser null)
}

// Draggable para los handles de redimensionamiento (Ahora necesita el ID del marcaje a modificar)
export interface DraggableResizeHandleData {
  type: "resizeHandle";
  edge: "left" | "right"; // Qué borde se está arrastrando
  markingId: string; // El ID del marcaje (ENTRADA o SALIDA) que se modificará
  relatedMarkingId: string | null; // El ID del otro marcaje (para validación de no cruce)
  itemType: "event" | "workedTime"; // Tipo del item que se está redimensionando
  // event?: Event; // Mantener si redimensionas eventos normales también
}

export type ActiveDragData =
  | DraggableEventData
  | DraggableSidebarItemData
  | DraggableResizeHandleData
  | DraggableWorkedTimeData // AÑADIDO
  | null;

// --- Droppable Data (Sin cambios necesarios aquí por ahora) ---

export interface DroppableCellData {
  type: "cell";
  date: Date;
  employeeId: string;
  gridInfo: {
    hourHeight: number;
    startHour: number;
    cellTopOffset: number;
  };
}

export interface DroppableTimelineRowData {
  type: "timelineRow";
  employeeId: string;
  date: Date; // Añadimos la fecha a la fila para referencia
  gridInfo: {
    hourWidth: number;
    rowLeftOffset: number;
  };
}

export type OverDragData = DroppableCellData | DroppableTimelineRowData | null;
