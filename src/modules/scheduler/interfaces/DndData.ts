import type { Event } from "./Event";

export type DraggableItemType = "event" | "sidebarItem" | "resizeHandle";
export type DroppableContainerType = "cell" | "timelineRow" | "deleteZone"; // Añadir deleteZone si se implementa

export interface DraggableEventData {
  type: "event";
  event: Event;
}

export interface DraggableSidebarItemData {
  type: "sidebarItem";
  itemType: string; // e.g., 'shift-s1', 'permission'
  itemData: {
    // Datos adicionales del tipo si son necesarios
    name: string;
    color: string;
    category: string;
    defaultDurationHours?: number;
  };
}

export interface DraggableResizeHandleData {
  type: "resizeHandle";
  edge: "left" | "right";
  event: Event;
}

export type ActiveDragData =
  | DraggableEventData
  | DraggableSidebarItemData
  | DraggableResizeHandleData
  | null;

// --- Droppable Data ---

export interface DroppableCellData {
  type: "cell";
  date: Date;
  employeeId: string;
  gridInfo: {
    // Información necesaria para calcular la hora exacta
    hourHeight: number;
    startHour: number;
    cellTopOffset: number; // Distancia desde el top del contenedor droppable
  };
}

export interface DroppableTimelineRowData {
  type: "timelineRow";
  employeeId: string;
  gridInfo: {
    // Información necesaria para calcular la hora exacta
    hourWidth: number;
    rowLeftOffset: number; // Distancia desde el left del contenedor droppable
  };
}

// Añadir DroppableDeleteZoneData si se implementa

export type OverDragData = DroppableCellData | DroppableTimelineRowData | null;
