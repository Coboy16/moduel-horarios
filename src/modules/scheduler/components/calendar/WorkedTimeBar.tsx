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
  barStyle: React.CSSProperties;
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
  const uniquePrefix = `wt-${currentDateISO}-${employeeId}-${entradaMarking.id}`;

  // --- Draggable Principal de la Barra ---
  const draggableBarData: DraggableWorkedTimeData = {
    type: "workedTime",
    entradaMarkingId: entradaMarking.id,
    salidaMarkingId: salidaMarking?.id ?? null,
  };
  const {
    attributes: barAttributes,
    listeners: barListeners, // Estos listeners deben poder activarse
    setNodeRef: setBarNodeRef,
    transform: barTransform,
    isDragging: isBarDragging,
  } = useDraggable({
    id: `${uniquePrefix}-bar`,
    data: draggableBarData,
  });

  // --- Draggable para Resize Izquierdo (Entrada) ---
  const resizeLeftData: DraggableResizeHandleData = {
    type: "resizeHandle",
    edge: "left",
    markingId: entradaMarking.id,
    relatedMarkingId: salidaMarking?.id ?? null,
    itemType: "workedTime",
  };
  const {
    attributes: leftAttributes,
    listeners: leftListeners, // Estos listeners deben poder activarse
    setNodeRef: setLeftHandleRef,
    isDragging: isLeftDragging,
  } = useDraggable({
    id: `${uniquePrefix}-resize-left`,
    data: resizeLeftData,
  });

  // --- Draggable para Resize Derecho (Salida) - Condicional ---
  const resizeRightData: DraggableResizeHandleData | null = salidaMarking
    ? {
        type: "resizeHandle",
        edge: "right",
        markingId: salidaMarking.id,
        relatedMarkingId: entradaMarking.id,
        itemType: "workedTime",
      }
    : null;

  const {
    attributes: rightAttributes,
    listeners: rightListeners, // Estos listeners deben poder activarse
    setNodeRef: setRightHandleRef,
    isDragging: isRightDragging,
  } = useDraggable({
    id: `${uniquePrefix}-resize-right`,
    data: resizeRightData,
    disabled: !hasSalida,
  });

  // Estilo combinado para la barra principal
  const combinedBarStyle: React.CSSProperties = {
    ...barStyle,
    transform: isBarDragging ? CSS.Translate.toString(barTransform) : undefined,
    opacity: isBarDragging || isLeftDragging || isRightDragging ? 0.7 : 1,
    cursor: isBarDragging
      ? "grabbing"
      : isLeftDragging || isRightDragging
      ? "ew-resize"
      : "grab", // Cambiar cursor también al redimensionar
    zIndex:
      isBarDragging || isLeftDragging || isRightDragging
        ? 1000
        : barStyle.zIndex ?? 10,
    position: "absolute",
    display: "flex",
    borderRadius: "4px",
    overflow: "hidden",
    pointerEvents: "auto", // Asegurar que la barra reciba eventos
  };

  const regularWidth = (regularMinutes / 60) * hourWidth;
  const overtimeWidth = (overtimeMinutes / 60) * hourWidth;

  // Función para detener la propagación de eventos específicos (NO POINTER DOWN)
  const stopSpecificPropagation = (e: React.MouseEvent | React.TouchEvent) => {
    console.log(`[WorkedTimeBar] Event ${e.type} stopped propagation`);
    e.stopPropagation();
  };

  // Wrapper para los listeners de los handles para añadir logging
  const logHandleListeners = (
    handleName: string,
    listeners: ReturnType<typeof useDraggable>["listeners"]
  ) => {
    if (!listeners) return {};
    return Object.entries(listeners).reduce((acc, [eventName, handler]) => {
      acc[eventName as keyof typeof listeners] = (event: any) => {
        console.log(`[Handle ${handleName}] Event: ${eventName}`);
        // Detener propagación aquí para los handles SÍ es seguro
        event.stopPropagation();
        handler(event);
      };
      return acc;
    }, {} as typeof listeners);
  };

  const loggedLeftListeners = logHandleListeners("Left", leftListeners);
  const loggedRightListeners = logHandleListeners("Right", rightListeners);

  return (
    // Contenedor principal de la barra, APLICAR LISTENERS DE LA BARRA AQUÍ
    <div
      ref={setBarNodeRef}
      style={combinedBarStyle}
      {...barAttributes} // Atributos para accesibilidad y D&D
      {...barListeners} // LISTENERS PARA ARRASTRAR LA BARRA COMPLETA
      // Quitar onPointerDown={stopPropagation} para permitir que dnd-kit lo capture
      onClick={stopSpecificPropagation} // Detener solo click normal
      onContextMenu={stopSpecificPropagation} // Detener context menu
      onDoubleClick={stopSpecificPropagation} // Detener doble click
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
