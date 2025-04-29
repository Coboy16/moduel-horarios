/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { Marking } from "../../interfaces/Marking";
import type {
  DraggableWorkedTimeData,
  DraggableResizeHandleData,
} from "../../interfaces/DndData";
import { cn } from "../../lib/utils"; // Importar cn

interface WorkedTimeBarProps {
  entradaMarking: Marking;
  salidaMarking: Marking | null;
  regularMinutes: number;
  overtimeMinutes: number;
  barStyle: React.CSSProperties; // Estilo base (top, left, height, width inicial)
  hourWidth: number;
  employeeId: string;
  currentDateISO: string;
}

export default function WorkedTimeBar({
  entradaMarking,
  salidaMarking,
  regularMinutes,
  overtimeMinutes,
  barStyle,
  hourWidth,
  employeeId,
  currentDateISO,
}: WorkedTimeBarProps) {
  const hasSalida = salidaMarking !== null;
  // Crear un prefijo único para los IDs de este componente específico
  const uniquePrefix = `wt-${currentDateISO}-${employeeId}-${entradaMarking.id}`;

  // --- Draggable Principal de la Barra ---
  const draggableBarData: DraggableWorkedTimeData = {
    type: "workedTime",
    entradaMarkingId: entradaMarking.id,
    salidaMarkingId: salidaMarking?.id ?? null,
  };
  const {
    attributes: barAttributes,
    listeners: barListeners, // LISTENER PARA MOVER LA BARRA
    setNodeRef: setBarNodeRef,
    transform: barTransform,
    isDragging: isBarDragging,
  } = useDraggable({
    id: `${uniquePrefix}-bar`, // ID único para la barra
    data: draggableBarData,
  });

  // --- Draggable para Resize Izquierdo (Entrada) ---
  const resizeLeftData: DraggableResizeHandleData = {
    type: "resizeHandle",
    edge: "left",
    markingId: entradaMarking.id, // ID del marcaje a modificar (entrada)
    relatedMarkingId: salidaMarking?.id ?? null, // ID del otro marcaje (salida)
    itemType: "workedTime", // Tipo de item
  };
  const {
    attributes: leftAttributes,
    listeners: leftListeners, // LISTENER PARA MOVER EL HANDLE IZQUIERDO
    setNodeRef: setLeftHandleRef,
    isDragging: isLeftDragging,
  } = useDraggable({
    id: `${uniquePrefix}-resize-left`, // ID único para el handle izquierdo
    data: resizeLeftData,
  });

  // --- Draggable para Resize Derecho (Salida) - Condicional ---
  const resizeRightData: DraggableResizeHandleData | null = salidaMarking
    ? {
        type: "resizeHandle",
        edge: "right",
        markingId: salidaMarking.id, // ID del marcaje a modificar (salida)
        relatedMarkingId: entradaMarking.id, // ID del otro marcaje (entrada)
        itemType: "workedTime", // Tipo de item
      }
    : null;
  const {
    attributes: rightAttributes,
    listeners: rightListeners, // LISTENER PARA MOVER EL HANDLE DERECHO
    setNodeRef: setRightHandleRef,
    isDragging: isRightDragging,
  } = useDraggable({
    id: `${uniquePrefix}-resize-right`, // ID único para el handle derecho
    data: resizeRightData,
    disabled: !hasSalida, // Deshabilitar si no hay salida
  });

  // Estilo combinado para la barra principal
  const combinedBarStyle: React.CSSProperties = {
    ...barStyle, // Aplicar el estilo base (posición inicial, etc.)
    // Aplicar transform SOLO si se está arrastrando la barra completa
    transform: isBarDragging ? CSS.Translate.toString(barTransform) : undefined,
    opacity: isBarDragging || isLeftDragging || isRightDragging ? 0.7 : 1,
    cursor: isBarDragging ? "grabbing" : "grab", // Cursor para la barra
    // zIndex se hereda de barStyle o se eleva si se arrastra/redimensiona
    zIndex:
      isBarDragging || isLeftDragging || isRightDragging
        ? 1000
        : barStyle.zIndex ?? 10,
    position: "absolute", // Asegurar que sea absoluto
    display: "flex",
    borderRadius: "4px",
    overflow: "hidden",
    pointerEvents: "auto", // Debe ser interactivo
  };

  const regularWidth = (regularMinutes / 60) * hourWidth;
  const overtimeWidth = (overtimeMinutes / 60) * hourWidth;

  // --- Función para detener propagación de eventos NO D&D ---
  const stopNonDndPropagation = (e: React.MouseEvent | React.TouchEvent) => {
    // Evitar que click, context menu, etc., en la barra interfieran
    if (e.type !== "pointerdown") {
      // NO detener pointerdown
      console.log(
        `[WorkedTimeBar] Event ${e.type} stopped propagation on main bar`
      );
      e.stopPropagation();
    }
  };

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
          `[WorkedTimeBar Handle ${handleName}] Event: ${eventName} triggered`
        );
        event.stopPropagation(); // DETENER propagación para los handles
        listeners[eventName as keyof typeof listeners]?.(event);
      };
    }
    return wrappedListeners;
  };

  const loggedLeftListeners = wrapHandleListeners("Left", leftListeners);
  const loggedRightListeners = wrapHandleListeners("Right", rightListeners);

  return (
    // Contenedor principal de la barra, APLICAR LISTENERS DE LA BARRA AQUÍ
    <div
      ref={setBarNodeRef}
      style={combinedBarStyle}
      {...barAttributes} // Atributos para accesibilidad y D&D
      {...barListeners} // LISTENERS PARA ARRASTRAR LA BARRA COMPLETA
      // Quitar onPointerDown={stopPropagation} para permitir que dnd-kit lo capture
      onClick={stopNonDndPropagation}
      onContextMenu={stopNonDndPropagation}
      onDoubleClick={stopNonDndPropagation}
      title={`Tiempo trabajado: ${(
        (regularMinutes + overtimeMinutes) /
        60
      ).toFixed(1)}h`}
    >
      {/* Barra Verde (Regular) - SIN event handlers */}
      {regularMinutes > 0 && (
        <div
          className="h-full bg-green-400 pointer-events-none"
          style={{
            width: `${regularWidth}px`,
            borderTopLeftRadius: "4px",
            borderBottomLeftRadius: "4px",
            borderTopRightRadius: overtimeMinutes <= 0 ? "4px" : "0",
            borderBottomRightRadius: overtimeMinutes <= 0 ? "4px" : "0",
          }}
          title={`Regular: ${Math.round(regularMinutes / 6) / 10}h`}
        />
      )}

      {/* Barra Amarilla (Overtime) - SIN event handlers */}
      {overtimeMinutes > 0 && (
        <div
          className="h-full bg-yellow-400 pointer-events-none"
          style={{
            width: `${overtimeWidth}px`,
            borderTopRightRadius: "4px",
            borderBottomRightRadius: "4px",
            borderTopLeftRadius: regularMinutes <= 0 ? "4px" : "0",
            borderBottomLeftRadius: regularMinutes <= 0 ? "4px" : "0",
          }}
          title={`Overtime: ${Math.round(overtimeMinutes / 6) / 10}h`}
        />
      )}

      {/* --- Handles de Redimensionamiento --- */}
      {/* APLICAR LISTENERS DE LOS HANDLES AQUÍ */}

      {/* Handle Izquierdo (Entrada) */}
      <div
        ref={setLeftHandleRef} // Ref para dnd-kit
        {...leftAttributes} // Atributos del handle
        {...loggedLeftListeners} // LISTENERS PARA ARRASTRAR ESTE HANDLE
        className={cn(
          "absolute -left-1 top-1/2 -translate-y-1/2 w-3 h-4 cursor-ew-resize z-20",
          "flex items-center justify-center opacity-60 hover:opacity-100 group"
        )}
        style={{ touchAction: "none" }}
        aria-label="Redimensionar inicio"
        // Quitar stopPropagation de aquí, ya está en los listeners loggeados
        // onClick={stopSpecificPropagation}
        // onDoubleClick={stopSpecificPropagation}
        // onContextMenu={stopSpecificPropagation}
      >
        <div className="bg-gray-300 group-hover:bg-gray-400 rounded-sm w-full h-full flex items-center justify-center">
          <GripVertical className="h-3 w-3 text-gray-600 pointer-events-none" />
        </div>
      </div>

      {/* Handle Derecho (Salida) - Condicional */}
      {hasSalida && (
        <div
          ref={setRightHandleRef} // Ref para dnd-kit
          {...rightAttributes} // Atributos del handle
          {...loggedRightListeners} // LISTENERS PARA ARRASTRAR ESTE HANDLE
          className={cn(
            "absolute -right-1 top-1/2 -translate-y-1/2 w-3 h-4 cursor-ew-resize z-20",
            "flex items-center justify-center opacity-60 hover:opacity-100 group"
          )}
          style={{ touchAction: "none" }}
          aria-label="Redimensionar fin"
          // Quitar stopPropagation de aquí, ya está en los listeners loggeados
          // onClick={stopSpecificPropagation}
          // onDoubleClick={stopSpecificPropagation}
          // onContextMenu={stopSpecificPropagation}
        >
          <div className="bg-gray-300 group-hover:bg-gray-400 rounded-sm w-full h-full flex items-center justify-center">
            <GripVertical className="h-3 w-3 text-gray-600 pointer-events-none" />
          </div>
        </div>
      )}
    </div>
  );
}
