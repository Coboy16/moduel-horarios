/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
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
import type {
  DraggableEventData,
  DraggableResizeHandleData,
} from "../../interfaces/DndData";
import { cn } from "../../lib/utils";

interface TimelineEventItemProps {
  event: Event;
  style: React.CSSProperties; // Estilo calculado (posición, tamaño inicial)
}

export default function TimelineEventItem({
  event,
  style,
}: TimelineEventItemProps) {
  const { openContextMenu, openEditEventModal } = useUI();
  const [showTooltip, setShowTooltip] = useState(false);

  const eventColor = getEventTypeColor(event.type);
  const uniquePrefix = `event-${event.id}`;

  // --- Draggable Principal del Evento ---
  const draggableData: DraggableEventData = { type: "event", event };
  const {
    attributes: eventAttributes,
    listeners: eventListeners,
    setNodeRef: setEventNodeRef,
    transform: eventTransform,
    isDragging: isEventDragging,
  } = useDraggable({
    id: uniquePrefix,
    data: draggableData,
  });

  // --- Draggable para Resize Izquierdo ---
  const resizeLeftData: DraggableResizeHandleData = {
    type: "resizeHandle",
    edge: "left",
    itemType: "event", // *** ASEGURARSE DE ESTO ***
    event: event, // *** PASAR EL EVENTO ***
    markingId: "", // No aplica
    relatedMarkingId: null, // No aplica
  };
  const {
    attributes: leftAttributes,
    listeners: leftListeners,
    setNodeRef: setLeftHandleRef,
    isDragging: isLeftDragging,
  } = useDraggable({
    id: `${uniquePrefix}-resize-left`,
    data: resizeLeftData,
  });

  // --- Draggable para Resize Derecho ---
  const resizeRightData: DraggableResizeHandleData = {
    type: "resizeHandle",
    edge: "right",
    itemType: "event", // *** ASEGURARSE DE ESTO ***
    event: event, // *** PASAR EL EVENTO ***
    markingId: "", // No aplica
    relatedMarkingId: null, // No aplica
  };
  const {
    attributes: rightAttributes,
    listeners: rightListeners,
    setNodeRef: setRightHandleRef,
    isDragging: isRightDragging,
  } = useDraggable({
    id: `${uniquePrefix}-resize-right`,
    data: resizeRightData,
  });

  // --- Envolver listeners de handles ---
  const wrapHandleListeners = (
    handleName: string,
    listeners: ReturnType<typeof useDraggable>["listeners"]
  ) => {
    if (!listeners) return {};
    const wrappedListeners: typeof listeners = {};
    for (const eventName in listeners) {
      wrappedListeners[eventName as keyof typeof listeners] = (event: any) => {
        console.log(
          `[TimelineEventItem Handle ${handleName}] Event: ${eventName} triggered`
        );
        event.stopPropagation();
        listeners[eventName as keyof typeof listeners]?.(event);
      };
    }
    return wrappedListeners;
  };

  const loggedLeftListeners = wrapHandleListeners("Left", leftListeners);
  const loggedRightListeners = wrapHandleListeners("Right", rightListeners);

  // --- Estilo combinado ---
  const isInteracting = isEventDragging || isLeftDragging || isRightDragging;
  const combinedStyle: React.CSSProperties = {
    ...style,
    transform: isEventDragging
      ? CSS.Translate.toString(eventTransform)
      : undefined,
    opacity: isInteracting ? 0.7 : 1,
    cursor: isEventDragging ? "grabbing" : "grab",
    zIndex: isInteracting ? 1000 : style.zIndex ?? 15,
    position: "absolute" as const,
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openContextMenu({ x: e.clientX, y: e.clientY }, "event", event);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openEditEventModal(event);
  };

  return (
    <div
      ref={setEventNodeRef}
      style={combinedStyle}
      className={cn(
        `group/event-item rounded-md p-1 text-xs overflow-hidden border shadow-sm`, // Grupo para hover en handles
        eventColor.border,
        eventColor.bg,
        eventColor.text
      )}
      onContextMenu={handleContextMenu}
      onDoubleClick={handleDoubleClick}
      {...eventAttributes}
      {...eventListeners}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      aria-label={`Evento ${event.title}`}
    >
      <TooltipProvider>
        <Tooltip open={showTooltip && !isInteracting} delayDuration={300}>
          <TooltipTrigger asChild>
            <div className="h-full flex items-center pointer-events-none">
              <div className="font-medium truncate">{event.title}</div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs z-[1100]">
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

      {/* --- Handle Izquierdo --- */}
      <div
        ref={setLeftHandleRef}
        {...leftAttributes}
        {...loggedLeftListeners}
        className={cn(
          "absolute left-[-2px] top-[-2px] bottom-[-2px] w-2 cursor-ew-resize z-[20]", // Aumentar área de agarre y z-index
          "flex items-center justify-center",
          // Mostrar sutilmente, más visible en hover del grupo padre
          "opacity-0 group-hover/event-item:opacity-50 hover:!opacity-100 transition-opacity"
        )}
        style={{ touchAction: "none" }}
        aria-label="Redimensionar inicio"
      >
        {/* Indicador visual del handle */}
        <div className="w-1 h-1/2 bg-gray-500 rounded-full opacity-75 group-hover/event-item:opacity-100 pointer-events-none" />
      </div>

      {/* --- Handle Derecho --- */}
      <div
        ref={setRightHandleRef}
        {...rightAttributes}
        {...loggedRightListeners}
        className={cn(
          "absolute right-[-2px] top-[-2px] bottom-[-2px] w-2 cursor-ew-resize z-[20]", // Aumentar área de agarre y z-index
          "flex items-center justify-center",
          // Mostrar sutilmente, más visible en hover del grupo padre
          "opacity-0 group-hover/event-item:opacity-50 hover:!opacity-100 transition-opacity"
        )}
        style={{ touchAction: "none" }}
        aria-label="Redimensionar fin"
      >
        {/* Indicador visual del handle */}
        <div className="w-1 h-1/2 bg-gray-500 rounded-full opacity-75 group-hover/event-item:opacity-100 pointer-events-none" />
      </div>
    </div>
  );
}
