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

interface WorkedTimeBarProps {
  entradaMarking: Marking;
  salidaMarking: Marking | null;
  regularMinutes: number;
  overtimeMinutes: number;
  barStyle: React.CSSProperties; // Incluye top, left, height, width total
  hourWidth: number;
  employeeId: string; // Necesario para el ID único de los draggables
  currentDateISO: string; // Para asegurar IDs únicos por día
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
  const uniquePrefix = `wt-${currentDateISO}-${employeeId}`; // Prefijo único por barra/día/empleado

  // --- Draggable Principal de la Barra ---
  const draggableData: DraggableWorkedTimeData = {
    type: "workedTime",
    entradaMarkingId: entradaMarking.id,
    salidaMarkingId: salidaMarking?.id ?? null,
  };
  const {
    attributes: barAttributes,
    listeners: barListeners,
    setNodeRef: setBarNodeRef,
    transform: barTransform,
    isDragging: isBarDragging,
  } = useDraggable({
    id: `${uniquePrefix}-bar`, // ID único
    data: draggableData,
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
    listeners: leftListeners,
    setNodeRef: setLeftHandleRef,
    isDragging: isLeftDragging,
  } = useDraggable({
    id: `${uniquePrefix}-resize-left`, // ID único
    data: resizeLeftData,
  });

  // --- Draggable para Resize Derecho (Salida) ---
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
    listeners: rightListeners,
    setNodeRef: setRightHandleRef,
    isDragging: isRightDragging,
  } = useDraggable({
    id: `${uniquePrefix}-resize-right`, // ID único
    data: resizeRightData ?? undefined,
    disabled: !hasSalida,
  });

  // Estilo combinado para la barra principal
  const combinedBarStyle: React.CSSProperties = {
    ...barStyle, // Recibe left, top, height, width total
    transform: isBarDragging ? CSS.Translate.toString(barTransform) : undefined,
    opacity: isBarDragging || isLeftDragging || isRightDragging ? 0.7 : 1,
    cursor: isBarDragging ? "grabbing" : "grab",
    zIndex: isBarDragging || isLeftDragging || isRightDragging ? 1000 : 10,
    position: "absolute",
    display: "flex",
    pointerEvents: "auto", // Permitir interacciones con la barra y handles
  };

  const regularWidth = (regularMinutes / 60) * hourWidth;
  const overtimeWidth = (overtimeMinutes / 60) * hourWidth;

  // Prevenir propagación para no activar context menu de la fila
  const stopPropagation = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      ref={setBarNodeRef}
      style={combinedBarStyle}
      {...barAttributes}
      {...barListeners}
      onClick={stopPropagation}
      onContextMenu={stopPropagation}
      onTouchStart={stopPropagation} // También para touch
    >
      {/* Barra Verde (Regular) */}
      {regularMinutes > 0 && (
        <div
          className="h-full rounded-l bg-green-400 opacity-90 pointer-events-none" // No necesita pointer events
          style={{
            width: `${regularWidth}px`,
            borderTopRightRadius: overtimeMinutes <= 0 ? "0.25rem" : "0",
            borderBottomRightRadius: overtimeMinutes <= 0 ? "0.25rem" : "0",
          }}
          title={`Regular: ${Math.round(regularMinutes / 6) / 10}h`}
        />
      )}

      {/* Barra Amarilla (Overtime) */}
      {overtimeMinutes > 0 && (
        <div
          className="h-full rounded-r bg-yellow-400 opacity-90 pointer-events-none" // No necesita pointer events
          style={{ width: `${overtimeWidth}px` }}
          title={`Overtime: ${Math.round(overtimeMinutes / 6) / 10}h`}
        />
      )}

      {/* Handle Izquierdo (Entrada) */}
      <div
        ref={setLeftHandleRef}
        {...leftListeners}
        {...leftAttributes}
        className="absolute -left-1 top-0 bottom-0 w-3 cursor-ew-resize z-20 flex items-center justify-center opacity-50 hover:opacity-100" // Aumentar área y hacer visible al hover
        style={{ touchAction: "none" }}
        aria-label="Redimensionar inicio"
        onClick={stopPropagation} // Prevenir que el click en el handle active el drag de la barra
        onDoubleClick={stopPropagation}
        onContextMenu={stopPropagation}
        onTouchStart={stopPropagation}
      >
        <GripVertical className="h-4 w-4 text-gray-700 pointer-events-none bg-gray-200 rounded-sm" />
      </div>

      {/* Handle Derecho (Salida) - Condicional */}
      {hasSalida && (
        <div
          ref={setRightHandleRef}
          {...rightListeners}
          {...rightAttributes}
          className="absolute -right-1 top-0 bottom-0 w-3 cursor-ew-resize z-20 flex items-center justify-center opacity-50 hover:opacity-100" // Aumentar área
          style={{ touchAction: "none" }}
          aria-label="Redimensionar fin"
          onClick={stopPropagation}
          onDoubleClick={stopPropagation}
          onContextMenu={stopPropagation}
          onTouchStart={stopPropagation}
        >
          <GripVertical className="h-4 w-4 text-gray-700 pointer-events-none bg-gray-200 rounded-sm" />
        </div>
      )}
    </div>
  );
}
