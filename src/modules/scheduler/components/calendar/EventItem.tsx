"use client";

import React, { useState } from "react";
import { useDraggable } from "@dnd-kit/core"; // NUEVO
import { CSS } from "@dnd-kit/utilities"; // NUEVO
import { useUI } from "../../hooks/useUI";
import type { Event } from "../../interfaces/Event";
import { formatTimeRange } from "../../utils/dateUtils";
import { getEventTypeColor } from "../../utils/eventUtils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { GripVertical } from "lucide-react"; // Para resize handles
import type {
  DraggableEventData,
  DraggableResizeHandleData,
} from "../../interfaces/DndData"; // NUEVO

interface EventItemProps {
  event: Event;
  style: React.CSSProperties; // El estilo calculado por el padre (posición, tamaño inicial)
}

export default function EventItem({ event, style }: EventItemProps) {
  const { openContextMenu, openEditEventModal } = useUI();
  const [showTooltip, setShowTooltip] = useState(false);

  const eventColor = getEventTypeColor(event.type);

  // --- Draggable Principal del Evento ---
  const draggableData: DraggableEventData = { type: "event", event };
  const {
    attributes: eventAttributes,
    listeners: eventListeners,
    setNodeRef: setEventNodeRef,
    transform: eventTransform,
    isDragging: isEventDragging,
  } = useDraggable({
    id: `event-${event.id}`,
    data: draggableData,
  });

  // --- Draggable para Resize Izquierdo ---
  const resizeLeftData: DraggableResizeHandleData = {
    type: "resizeHandle",
    edge: "left",
    event,
  };
  const {
    attributes: leftAttributes,
    listeners: leftListeners,
    setNodeRef: setLeftHandleRef,
    isDragging: isLeftDragging,
  } = useDraggable({
    id: `event-${event.id}-resize-left`,
    data: resizeLeftData,
  });

  // --- Draggable para Resize Derecho ---
  const resizeRightData: DraggableResizeHandleData = {
    type: "resizeHandle",
    edge: "right",
    event,
  };
  const {
    attributes: rightAttributes,
    listeners: rightListeners,
    setNodeRef: setRightHandleRef,
    isDragging: isRightDragging,
  } = useDraggable({
    id: `event-${event.id}-resize-right`,
    data: resizeRightData,
  });

  const combinedStyle = {
    ...style,
    // Aplicamos transform solo si el evento principal se está arrastrando
    // Si un handle se arrastra, el evento no se mueve visualmente hasta onDragEnd
    transform: isEventDragging
      ? CSS.Translate.toString(eventTransform)
      : undefined,
    opacity: isEventDragging || isLeftDragging || isRightDragging ? 0.7 : 1, // Opacidad mientras se arrastra/redimensiona
    cursor: isEventDragging ? "grabbing" : "grab",
    zIndex:
      isEventDragging || isLeftDragging || isRightDragging
        ? 1000
        : style.zIndex ?? 10, // Elevar mientras se arrastra
    position: "absolute" as const, // Asegurar que la posición absoluta se mantenga
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Importante para que no active el context menu de la celda
    openContextMenu({ x: e.clientX, y: e.clientY }, "event", event);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Importante
    openEditEventModal(event);
  };

  return (
    <div
      ref={setEventNodeRef} // Ref para el draggable del evento completo
      style={combinedStyle}
      className={`rounded-md p-1 text-xs overflow-hidden border ${eventColor.border} ${eventColor.bg} ${eventColor.text}`}
      onContextMenu={handleContextMenu}
      onDoubleClick={handleDoubleClick}
      {...eventAttributes} // Atributos para el draggable del evento
      {...eventListeners} // Listeners para el draggable del evento
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      aria-label={`Evento ${event.title}`}
    >
      <TooltipProvider>
        <Tooltip
          open={
            showTooltip &&
            !isEventDragging &&
            !isLeftDragging &&
            !isRightDragging
          }
          delayDuration={300}
        >
          <TooltipTrigger asChild>
            {/* Contenido del evento */}
            <div className="h-full flex flex-col justify-between">
              <div className="font-medium truncate flex-grow">
                {event.title}
              </div>
              <div className="truncate text-[10px]">
                {formatTimeRange(
                  new Date(event.startTime),
                  new Date(event.endTime)
                )}
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-xs z-[1100]">
            {" "}
            {/* Asegurar z-index alto */}
            <div className="space-y-1">
              <div className="font-medium">{event.title}</div>
              <div className="text-xs">Tipo: {event.type}</div>
              <div className="text-xs">
                Horario:{" "}
                {formatTimeRange(
                  new Date(event.startTime),
                  new Date(event.endTime)
                )}
              </div>
              {event.location && (
                <div className="text-xs">Ubicación: {event.location}</div>
              )}
              {event.description && (
                <div className="text-xs">Descripción: {event.description}</div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* --- Handle para Redimensionar Izquierda --- */}
      <div
        ref={setLeftHandleRef}
        {...leftListeners}
        {...leftAttributes}
        className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize z-10 flex items-center justify-center opacity-50 hover:opacity-100"
        style={{ touchAction: "none" }} // Necesario para dnd-kit en touch
        aria-label="Redimensionar inicio"
        // onClick={(e) => e.stopPropagation()} // Prevenir que el click en el handle abra el modal
        // onDoubleClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-3 w-3 text-gray-500 pointer-events-none" />
      </div>

      {/* --- Handle para Redimensionar Derecha --- */}
      <div
        ref={setRightHandleRef}
        {...rightListeners}
        {...rightAttributes}
        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize z-10 flex items-center justify-center opacity-50 hover:opacity-100"
        style={{ touchAction: "none" }}
        aria-label="Redimensionar fin"
        // onClick={(e) => e.stopPropagation()}
        // onDoubleClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-3 w-3 text-gray-500 pointer-events-none" />
      </div>
    </div>
  );
}
