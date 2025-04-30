// src/modules/scheduler/interfaces/DndData.ts
import type { Event } from "./Event";
import type { Marking } from "./Marking"; // Asegúrate de importar Marking si no estaba ya

// Tipos Draggable Actualizados
export type DraggableItemType =
  | "event"
  | "sidebarItem"
  | "resizeHandle"
  | "workedTime";

export type DroppableContainerType = "cell" | "timelineRow" | "deleteZone";

export interface DraggableEventData {
  type: "event";
  event: Event;
}

export interface DraggableSidebarItemData {
  type: "sidebarItem";
  itemType: string; // ID específico del tipo de evento (e.g., shift-s1, lpm)
  itemData: {
    id: string; // Añadir ID original del item
    code: string; // Añadir código si existe
    name: string;
    color: string;
    category: "shift" | "permission" | string; // Hacer más específico si es posible
    defaultDurationHours?: number;
  };
}

export interface DraggableWorkedTimeData {
  type: "workedTime";
  entradaMarkingId: string;
  salidaMarkingId: string | null;
}

// Actualizado para incluir 'event' opcionalmente
export interface DraggableResizeHandleData {
  type: "resizeHandle";
  edge: "left" | "right";
  itemType: "event" | "workedTime"; // Tipo del item que se redimensiona
  // Para WorkedTime
  markingId: string; // ID del marcaje a modificar (ENTRADA o SALIDA)
  relatedMarkingId: string | null; // ID del otro marcaje (para validación)
  // Para Event
  event?: Event; // El evento que se está redimensionando
}

export type ActiveDragData =
  | DraggableEventData
  | DraggableSidebarItemData
  | DraggableResizeHandleData
  | DraggableWorkedTimeData
  | null;

// --- Droppable Data ---

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
  date: Date;
  gridInfo: {
    hourWidth: number;
    rowLeftOffset: number; // Suele ser 0 si el droppable es el contenedor de contenido
  };
}

// Añadido para la zona de eliminación (si la implementas)
export interface DroppableDeleteZoneData {
  type: "deleteZone";
}

export type OverDragData =
  | DroppableCellData
  | DroppableTimelineRowData
  | DroppableDeleteZoneData // Añadido
  | null;
