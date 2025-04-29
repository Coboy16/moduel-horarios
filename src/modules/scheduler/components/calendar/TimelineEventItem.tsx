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
import { cn } from "../../lib/utils"; // Importar cn

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
  const uniquePrefix = `event-${event.id}`; // Prefijo único

  // --- Draggable Principal del Evento ---
  const draggableData: DraggableEventData = { type: "event", event };
  const {
    attributes: eventAttributes,
    listeners: eventListeners, // Listener para mover el evento
    setNodeRef: setEventNodeRef,
    transform: eventTransform,
    isDragging: isEventDragging,
  } = useDraggable({
    id: uniquePrefix, // ID único para el evento
    data: draggableData,
  });

  // --- Draggable para Resize Izquierdo ---
  const resizeLeftData: DraggableResizeHandleData = {
    type: "resizeHandle",
    edge: "left",
    itemType: "event", // Especificar que es un evento
    event: event, // Pasar el evento para referencia en dragEnd
    markingId: "", // No aplica a eventos
    relatedMarkingId: null, // No aplica a eventos
  };
  const {
    attributes: leftAttributes,
    listeners: leftListeners, // Listener para mover el handle izquierdo
    setNodeRef: setLeftHandleRef,
    isDragging: isLeftDragging,
  } = useDraggable({
    id: `${uniquePrefix}-resize-left`, // ID único
    data: resizeLeftData,
  });

  // --- Draggable para Resize Derecho ---
  const resizeRightData: DraggableResizeHandleData = {
    type: "resizeHandle",
    edge: "right",
    itemType: "event",
    event: event,
    markingId: "",
    relatedMarkingId: null,
  };
  const {
    attributes: rightAttributes,
    listeners: rightListeners, // Listener para mover el handle derecho
    setNodeRef: setRightHandleRef,
    isDragging: isRightDragging,
  } = useDraggable({
    id: `${uniquePrefix}-resize-right`, // ID único
    data: resizeRightData,
  });

  // --- Envolver listeners de handles para log y stopPropagation ---
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
        event.stopPropagation(); // DETENER propagación para los handles
        listeners[eventName as keyof typeof listeners]?.(event);
      };
    }
    return wrappedListeners;
  };

  const loggedLeftListeners = wrapHandleListeners("Left", leftListeners);
  const loggedRightListeners = wrapHandleListeners("Right", rightListeners);

  // --- Estilo combinado ---
  const combinedStyle = {
    ...style,
    // Aplicar transform solo si el evento principal se está arrastrando
    transform: isEventDragging
      ? CSS.Translate.toString(eventTransform)
      : undefined,
    opacity: isEventDragging || isLeftDragging || isRightDragging ? 0.7 : 1,
    cursor: isEventDragging ? "grabbing" : "grab",
    zIndex:
      isEventDragging || isLeftDragging || isRightDragging
        ? 1000
        : style.zIndex ?? 15, // Asegurar z-index por defecto
    position: "absolute" as const, // Asegurar posición absoluta
  };

  // --- Handlers de UI ---
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevenir menú contextual de la fila
    openContextMenu({ x: e.clientX, y: e.clientY }, "event", event);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevenir doble click en la fila
    openEditEventModal(event);
  };

  // --- Stop propagation para eventos no D&D en el item principal ---
  const stopNonDndPropagation = (e: React.MouseEvent | React.TouchEvent) => {
    if (e.type !== "pointerdown") {
      // console.log(`[TimelineEventItem] Event ${e.type} stopped propagation`);
      e.stopPropagation();
    }
  };

  return (
    <div
      ref={setEventNodeRef} // Ref para arrastrar el evento completo
      style={combinedStyle}
      className={cn(
        `rounded-md p-1 text-xs overflow-hidden border shadow-sm`, // Añadir sombra
        eventColor.border,
        eventColor.bg,
        eventColor.text
      )}
      onContextMenu={handleContextMenu}
      onDoubleClick={handleDoubleClick}
      {...eventAttributes} // Atributos D&D del evento
      {...eventListeners} // Listeners D&D del evento
      // Detener otros eventos para no interferir
      onClick={stopNonDndPropagation}
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
            <div className="h-full flex items-center pointer-events-none">
              {" "}
              {/* Contenido no interactivo */}
              <div className="font-medium truncate">{event.title}</div>
              {/* Podrías añadir la hora aquí si el espacio lo permite */}
              {/* <div className="ml-1 text-[10px] opacity-80 truncate">
                 {formatTimeRange(new Date(event.startTime), new Date(event.endTime))}
              </div> */}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs z-[1100]">
            {/* ... (contenido del tooltip sin cambios) ... */}
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
        ref={setLeftHandleRef} // Ref para el handle izquierdo
        {...leftAttributes} // Atributos D&D del handle
        {...loggedLeftListeners} // Listeners D&D del handle (con stopPropagation)
        className={cn(
          "absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize z-[100] flex items-center justify-center", // z-index alto
          "opacity-0 hover:opacity-100 focus:opacity-100 group-hover/menu-item:opacity-50" // Mostrar al hacer hover/focus
        )}
        style={{ touchAction: "none" }}
        aria-label="Redimensionar inicio"
      >
        <div className="w-1 h-4 bg-gray-500 rounded-full pointer-events-none" />{" "}
        {/* Indicador visual */}
        {/* <GripVertical className="h-3 w-3 text-gray-500 pointer-events-none" /> */}
      </div>

      {/* --- Handle para Redimensionar Derecha --- */}
      <div
        ref={setRightHandleRef} // Ref para el handle derecho
        {...rightAttributes} // Atributos D&D del handle
        {...loggedRightListeners} // Listeners D&D del handle (con stopPropagation)
        className={cn(
          "absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize z-[100] flex items-center justify-center", // z-index alto
          "opacity-0 hover:opacity-100 focus:opacity-100 group-hover/menu-item:opacity-50" // Mostrar al hacer hover/focus
        )}
        style={{ touchAction: "none" }}
        aria-label="Redimensionar fin"
      >
        <div className="w-1 h-4 bg-gray-500 rounded-full pointer-events-none" />{" "}
        {/* Indicador visual */}
        {/* <GripVertical className="h-3 w-3 text-gray-500 pointer-events-none" /> */}
      </div>
    </div>
  );
}
