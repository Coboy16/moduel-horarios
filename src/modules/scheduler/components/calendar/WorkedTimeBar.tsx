/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
// import { GripVertical } from "lucide-react"; // Ya no se usa GripVertical visualmente
import type { Marking } from "../../interfaces/Marking";
import type {
  DraggableWorkedTimeData,
  DraggableResizeHandleData,
} from "../../interfaces/DndData";
import { cn } from "../../lib/utils";

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
  const uniquePrefix = `wt-${currentDateISO}-${employeeId}-${entradaMarking.id}`;

  // --- Draggable Principal de la Barra ---
  const draggableBarData: DraggableWorkedTimeData = {
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
    listeners: leftListeners,
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
    listeners: rightListeners,
    setNodeRef: setRightHandleRef,
    isDragging: isRightDragging,
  } = useDraggable({
    id: `${uniquePrefix}-resize-right`,
    data: resizeRightData,
    disabled: !hasSalida,
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
        // console.log(`[WorkedTimeBar Handle ${handleName}] Event: ${eventName}`);
        event.stopPropagation(); // DETENER propagación para los handles
        listeners[eventName as keyof typeof listeners]?.(event);
      };
    }
    return wrappedListeners;
  };

  const loggedLeftListeners = wrapHandleListeners("Left", leftListeners);
  const loggedRightListeners = wrapHandleListeners("Right", rightListeners);

  // Estilo combinado para el contenedor principal que se mueve
  const combinedContainerStyle: React.CSSProperties = {
    ...barStyle, // Aplicar el estilo base (posición inicial, altura)
    // Quitar width de aquí, se controla por el contenido ahora
    // Quitar background/border de aquí, eso va en la barra visual interna
    // Aplicar transform SOLO si se está arrastrando la barra completa
    transform: isBarDragging ? CSS.Translate.toString(barTransform) : undefined,
    opacity: isBarDragging || isLeftDragging || isRightDragging ? 0.7 : 1,
    // Cursor se maneja en elementos internos (barra visual y pines)
    zIndex:
      isBarDragging || isLeftDragging || isRightDragging
        ? 1000
        : barStyle.zIndex ?? 10,
    position: "absolute",
    // display: 'flex', // No necesario aquí, el flex está en la barra interna
    // borderRadius: '4px', // No necesario aquí
    // overflow: 'hidden', // No necesario aquí
    pointerEvents: "auto", // El contenedor debe ser interactivo para D&D
    // Ajustar left/width para acomodar los pines si es necesario
    // Por ejemplo, si los pines tienen w-4, el left podría necesitar ajustarse
    // y el width total también. Esto depende de cómo `barStyle` calcula el left/width inicial.
    // Asumiremos que barStyle.left y barStyle.width ya consideran el espacio total.
  };

  const regularWidth = (regularMinutes / 60) * hourWidth;
  const overtimeWidth = (overtimeMinutes / 60) * hourWidth;
  const totalBarWidth = regularWidth + overtimeWidth;

  // Función para detener otros eventos (ya no se usa directamente)
  // const stopNonDndPropagation = (e: React.MouseEvent | React.TouchEvent) => {
  //   if (e.type !== 'pointerdown') {
  //     e.stopPropagation();
  //   }
  // };

  const isInteracting = isBarDragging || isLeftDragging || isRightDragging;

  return (
    // Contenedor principal: Posicionamiento y Drag de toda la barra
    <div
      ref={setBarNodeRef}
      style={combinedContainerStyle}
      className="group/worked-time" // Grupo para hover effects en los pines
      {...barAttributes}
      {...barListeners} // Listeners para mover TODA la barra
      title={`Tiempo trabajado: ${(
        (regularMinutes + overtimeMinutes) /
        60
      ).toFixed(1)}h`}
    >
      {/* Contenedor de la Barra Visual (verde/amarillo) */}
      {/* Este div ahora toma el cursor de movimiento y los listeners de hover/click si son necesarios */}
      <div
        className={cn(
          "relative mx-1 flex h-5 rounded overflow-hidden shadow-sm", // Altura ajustada (era h-full), margen horizontal para pines, flex para segmentos
          isBarDragging ? "cursor-grabbing" : "cursor-grab"
        )}
        style={{ width: `${totalBarWidth}px` }}
        // Podrías añadir aquí onClick, onContextMenu si fueran necesarios en la barra misma
        // onClick={stopNonDndPropagation}
        // onContextMenu={stopNonDndPropagation}
      >
        {/* Barra Verde (Regular) */}
        {regularMinutes > 0 && (
          <div
            className="h-full bg-green-400 pointer-events-none" // No interactivo directamente
            style={{
              width: `${regularWidth}px`,
              // Los border-radius se manejan en el contenedor padre (.rounded)
            }}
            title={`Regular: ${Math.round(regularMinutes / 6) / 10}h`}
          />
        )}

        {/* Barra Amarilla (Overtime) */}
        {overtimeMinutes > 0 && (
          <div
            className="h-full bg-yellow-400 pointer-events-none" // No interactivo directamente
            style={{
              width: `${overtimeWidth}px`,
              // Los border-radius se manejan en el contenedor padre (.rounded)
            }}
            title={`Overtime: ${Math.round(overtimeMinutes / 6) / 10}h`}
          />
        )}
      </div>{" "}
      {/* Fin Contenedor Barra Visual */}
      {/* --- Pin Handle Izquierdo (Entrada) --- */}
      <div
        ref={setLeftHandleRef} // Ref para dnd-kit
        {...leftAttributes} // Atributos D&D
        {...loggedLeftListeners} // Listeners D&D (con stopPropagation)
        className={cn(
          "absolute left-0 top-[-4px] bottom-[-4px]", // Posicionamiento absoluto en el borde izquierdo
          "w-4 z-20 cursor-ew-resize", // Ancho clickeable, z-index, cursor
          "flex justify-center", // Centrar contenido del pin
          // Opacidad controlada por hover en el grupo padre
          "opacity-60 group-hover/worked-time:opacity-100 transition-opacity"
        )}
        style={{ touchAction: "none" }} // Para interacciones táctiles
        aria-label="Redimensionar inicio"
      >
        {/* Estructura Visual del Pin */}
        <div className="flex flex-col items-center w-full h-full pointer-events-none">
          {/* Círculo */}
          <div className="w-3 h-3 rounded-full bg-slate-600 mt-[-1px]" />{" "}
          {/* Color y forma */}
          {/* Línea */}
          <div className="flex-grow w-px bg-slate-400" /> {/* Línea vertical */}
        </div>
      </div>
      {/* --- Pin Handle Derecho (Salida) - Condicional --- */}
      {hasSalida && (
        <div
          ref={setRightHandleRef} // Ref para dnd-kit
          {...rightAttributes} // Atributos D&D
          {...loggedRightListeners} // Listeners D&D (con stopPropagation)
          className={cn(
            "absolute right-0 top-[-4px] bottom-[-4px]", // Posicionamiento absoluto en el borde derecho
            "w-4 z-20 cursor-ew-resize", // Ancho, z-index, cursor
            "flex justify-center", // Centrar contenido
            // Opacidad
            "opacity-60 group-hover/worked-time:opacity-100 transition-opacity"
          )}
          style={{ touchAction: "none" }}
          aria-label="Redimensionar fin"
        >
          {/* Estructura Visual del Pin */}
          <div className="flex flex-col items-center w-full h-full pointer-events-none">
            {/* Círculo */}
            <div className="w-3 h-3 rounded-full bg-slate-600 mt-[-1px]" />{" "}
            {/* Color y forma */}
            {/* Línea */}
            <div className="flex-grow w-px bg-slate-400" />{" "}
            {/* Línea vertical */}
          </div>
        </div>
      )}
    </div> // Fin Contenedor Principal
  );
}
