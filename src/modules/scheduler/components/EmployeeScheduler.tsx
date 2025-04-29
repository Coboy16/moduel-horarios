/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
  type DragMoveEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useUI } from "../hooks/useUI";
import { useEvents } from "../hooks/useEvents";
import { useEmployees } from "../hooks/useEmployees";
import EmployeeList from "./employee/EmployeeList";
import SchedulerCalendar from "./calendar/SchedulerCalendar";
import FilterBar from "./filters/FilterBar";

import AddEventModal from "./modals/AddEventModal";
import EditEventModal from "./modals/EditEventModal";
import AddMarkingModal from "./modals/AddMarkingModal";
import EditMarkingModal from "./modals/EditMarkingModal";
import ManageEmployeesModal from "./modals/ManageEmployeesModal";
import AddPermissionModal from "./modals/AddPermissionModal";
import AddScheduleModal from "./modals/AddScheduleModal";
import ContextMenu from "./context-menu/ContextMenu";
import FloatingTimeApprovalPanel from "./floating-time/FloatingTimeApprovalPanel";
import EventItem from "./calendar/EventItem"; // Para DragOverlay
import TimelineEventItem from "./calendar/TimelineEventItem"; // Para DragOverlay
import {
  getActiveData,
  getOverData,
  isDraggableEvent,
  isDraggableSidebarItem,
  isDraggableResizeHandle,
  isDroppableCell,
  isDroppableTimelineRow,
  calculateTimeFromOffset,
  calculateTimeFromTimelineOffset,
} from "../utils/dndUtils";
import type { Event } from "../interfaces/Event";
import { addHours, addMinutes, differenceInMinutes, set } from "date-fns";
import { useFilters } from "../hooks/useFilters";
import MarcajesPanel from "./turnos_licencia/MarcajesPanel";
import TurnosPanel from "./turnos_licencia/TurnosPanel";
import LicenciasPanel from "./turnos_licencia/LicenciaPanel";

export default function EmployeeScheduler() {
  const {
    showAddEventModal,
    showEditEventModal,
    showAddMarkingModal,
    showEditMarkingModal,
    showManageEmployeesModal,
    showAddPermissionModal,
    showAddScheduleModal,
    showContextMenu,
    showFloatingTimePanel,
    contextMenuPosition,
    contextMenuType,
    contextMenuData,
    closeContextMenu,
  } = useUI();
  const { addEvent, updateEvent, getEventById } = useEvents();
  const { getEmployeeById } = useEmployees();
  const { currentView } = useFilters();

  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [activeDragItem, setActiveDragItem] = useState<Event | null>(null);
  const [initialDragEventTimes, setInitialDragEventTimes] = useState<{
    start: Date;
    end: Date;
  } | null>(null);

  // Estado para mostrar/ocultar paneles
  const [showTurnos, setShowTurnos] = useState(false);
  const [showLicencias, setShowLicencias] = useState(false);

  // Escuchar eventos de activación/desactivación de paneles desde FilterBar
  useEffect(() => {
    // Esta función será llamada por FilterBar cuando se active/desactive turnos
    const handleTurnosToggle = (event: CustomEvent) => {
      setShowTurnos(event.detail.show);
    };

    // Esta función será llamada por FilterBar cuando se active/desactive licencias
    const handleLicenciasToggle = (event: CustomEvent) => {
      setShowLicencias(event.detail.show);
    };

    window.addEventListener("turnos-toggle" as any, handleTurnosToggle as any);
    window.addEventListener(
      "licencias-toggle" as any,
      handleLicenciasToggle as any
    );

    return () => {
      window.removeEventListener(
        "turnos-toggle" as any,
        handleTurnosToggle as any
      );
      window.removeEventListener(
        "licencias-toggle" as any,
        handleLicenciasToggle as any
      );
    };
  }, []);

  // Configuración de sensores para dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Requiere mover al menos 5px para iniciar el drag
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Cerrar context menu al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Asegurarse que el click no fue dentro de un elemento que abre el menú
      const target = event.target as HTMLElement;
      if (showContextMenu && !target.closest("[data-contextmenu-trigger]")) {
        // Asume que los triggers tienen este atributo
        closeContextMenu();
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [showContextMenu, closeContextMenu]);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const activeData = getActiveData(event.active);
      setActiveId(event.active.id);

      if (isDraggableEvent(activeData)) {
        setActiveDragItem(activeData.event);
        setInitialDragEventTimes({
          start: new Date(activeData.event.startTime),
          end: new Date(activeData.event.endTime),
        });
      } else if (isDraggableResizeHandle(activeData)) {
        setActiveDragItem(activeData.event); // Mostramos el evento mientras redimensionamos
        setInitialDragEventTimes({
          start: new Date(activeData.event.startTime),
          end: new Date(activeData.event.endTime),
        });
      } else if (isDraggableSidebarItem(activeData)) {
        // Crear un evento temporal para el overlay si se desea
        const tempEvent: Event = {
          id: "overlay-temp",
          title: activeData.itemData.name,
          type: activeData.itemType,
          employeeId: "temp", // Se asignará al soltar
          startTime: new Date().toISOString(), // Placeholder
          endTime: addHours(
            new Date(),
            activeData.itemData.defaultDurationHours ?? 1
          ).toISOString(), // Placeholder
          isAllDay: activeData.itemData.category === "permission",
        };
        setActiveDragItem(tempEvent);
        setInitialDragEventTimes(null); // No aplica para creación
      } else {
        setActiveDragItem(null);
        setInitialDragEventTimes(null);
      }
    },
    [getEventById]
  );

  const handleDragMove = useCallback(
    (event: DragMoveEvent) => {
      const { active } = event;
      const activeData = getActiveData(active);

      if (!isDraggableResizeHandle(activeData) || !initialDragEventTimes) {
        return; // Solo manejamos resize en dragMove por ahora para feedback visual
      }

      // --- Lógica de Redimensionamiento (Feedback Visual - Opcional) ---
      // Podrías actualizar un estado temporal aquí para mostrar el resize en tiempo real,
      // pero para simplificar, actualizaremos solo en onDragEnd.
      // La lógica sería similar a onDragEnd, pero actualizando un estado temporal
      // en lugar del contexto de eventos.
    },
    [initialDragEventTimes]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over, delta } = event;
      setActiveId(null); // Limpiar item activo
      setActiveDragItem(null); // Limpiar overlay
      setInitialDragEventTimes(null); // Limpiar tiempos iniciales

      if (!over) {
        console.log("DragEnd: No 'over' element.");
        return; // No se soltó sobre un área válida
      }

      const activeData = getActiveData(active);
      const overData = getOverData(over);

      if (!activeData || !overData) {
        console.log("DragEnd: Missing active or over data.", {
          activeData,
          overData,
        });
        return;
      }

      console.log("DragEnd:", { activeData, overData, delta });

      try {
        // --- Caso 1: Crear Evento desde Sidebar ---
        if (
          isDraggableSidebarItem(activeData) &&
          (isDroppableCell(overData) || isDroppableTimelineRow(overData))
        ) {
          console.log("Creating event from sidebar item...");
          const { itemType, itemData } = activeData;
          const employeeId = overData.employeeId;
          const isPermission = itemData.category === "permission";

          let startTime: Date;
          let endTime: Date;
          let dropTime: Date;

          if (isDroppableCell(overData)) {
            // Calcular la hora basada en la posición Y del drop
            dropTime = calculateTimeFromOffset(
              (event.activatorEvent as PointerEvent).clientY, // Usar coordenadas del evento original
              overData.gridInfo
            );
            startTime = set(overData.date, {
              hours: dropTime.getHours(),
              minutes: dropTime.getMinutes(),
            });
          } else {
            // isDroppableTimelineRow
            // Calcular la hora basada en la posición X del drop
            dropTime = calculateTimeFromTimelineOffset(
              (event.activatorEvent as PointerEvent).clientX, // Usar coordenadas del evento original
              overData.gridInfo
            );
            // Asumimos que la fecha es la del `startDate` del filtro actual para Timeline
            const timelineDate =
              event.active.data.current?.timelineDate ?? new Date(); // Necesitas pasar la fecha actual de la timeline
            startTime = set(timelineDate, {
              hours: dropTime.getHours(),
              minutes: dropTime.getMinutes(),
            });
          }

          if (isPermission) {
            // Permisos suelen ser de día completo
            startTime.setHours(0, 0, 0, 0);
            endTime = new Date(startTime);
            endTime.setHours(23, 59, 59, 999);
          } else {
            // Turnos con duración default
            endTime = addHours(startTime, itemData.defaultDurationHours ?? 1);
          }

          const newEvent: Omit<Event, "id"> = {
            title: itemData.name,
            type: itemType,
            employeeId: employeeId,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            isAllDay: isPermission,
            // location: getEmployeeById(employeeId)?.location, // Opcional
          };
          console.log("Adding new event:", newEvent);
          addEvent(newEvent);
        }
        // --- Caso 2: Mover Evento Existente ---
        else if (
          isDraggableEvent(activeData) &&
          (isDroppableCell(overData) || isDroppableTimelineRow(overData))
        ) {
          console.log("Moving existing event...");
          const eventToMove = activeData.event;
          const originalStart = new Date(eventToMove.startTime);
          const originalEnd = new Date(eventToMove.endTime);
          const durationMinutes = differenceInMinutes(
            originalEnd,
            originalStart
          );

          let newStartTime: Date;
          const targetEmployeeId = overData.employeeId;

          if (isDroppableCell(overData)) {
            // Calcular la nueva hora de inicio basada en dónde se soltó
            const dropTime = calculateTimeFromOffset(
              (event.activatorEvent as PointerEvent).clientY, // Usar coordenadas del evento original
              overData.gridInfo
            );
            newStartTime = set(overData.date, {
              hours: dropTime.getHours(),
              minutes: dropTime.getMinutes(),
            });
          } else {
            // isDroppableTimelineRow
            const dropTime = calculateTimeFromTimelineOffset(
              (event.activatorEvent as PointerEvent).clientX, // Usar coordenadas del evento original
              overData.gridInfo
            );
            const timelineDate =
              event.active.data.current?.timelineDate ?? new Date(); // Necesitas pasar la fecha actual de la timeline
            newStartTime = set(timelineDate, {
              hours: dropTime.getHours(),
              minutes: dropTime.getMinutes(),
            });
          }

          const newEndTime = addMinutes(newStartTime, durationMinutes);

          const updatedEvent: Event = {
            ...eventToMove,
            employeeId: targetEmployeeId, // Actualiza el empleado si cambió
            startTime: newStartTime.toISOString(),
            endTime: newEndTime.toISOString(),
          };
          console.log("Updating event (move):", updatedEvent);
          updateEvent(updatedEvent);
        }
        // --- Caso 3: Redimensionar Evento Existente ---
        else if (isDraggableResizeHandle(activeData) && initialDragEventTimes) {
          console.log("Resizing event...");
          const eventToResize = activeData.event;
          const { edge } = activeData;
          const { start: initialStart, end: initialEnd } =
            initialDragEventTimes;

          let newStartTime = new Date(initialStart);
          let newEndTime = new Date(initialEnd);
          let pixelToMinutesFactor = 1; // Minutos por píxel, necesita cálculo real

          // --- Cálculo del factor pixel-minuto (¡IMPORTANTE!) ---
          // Este cálculo depende de la vista y necesita la altura/ancho por hora
          if (currentView === "day" && isDroppableCell(overData)) {
            const hourHeight = overData.gridInfo.hourHeight;
            if (hourHeight > 0) {
              pixelToMinutesFactor = 60 / hourHeight;
            }
          } else if (
            currentView === "timeline" &&
            isDroppableTimelineRow(overData)
          ) {
            const hourWidth = overData.gridInfo.hourWidth;
            if (hourWidth > 0) {
              pixelToMinutesFactor = 60 / hourWidth;
            }
          }
          // Añadir lógica para 'week' si es necesario

          if (currentView === "timeline") {
            const minutesChangedX = delta.x * pixelToMinutesFactor;
            if (edge === "left") {
              newStartTime = addMinutes(initialStart, minutesChangedX);
            } else {
              // edge === 'right'
              newEndTime = addMinutes(initialEnd, minutesChangedX);
            }
          } else {
            // DayView (y WeekView necesitaría lógica similar)
            // const minutesChangedY = delta.y * pixelToMinutesFactor;
            // if (edge === "left") {
            //   newStartTime = addMinutes(initialStart, minutesChangedY);
            // } else {
            //   // edge === 'right'
            //   newEndTime = addMinutes(initialEnd, minutesChangedY);
            // }
          }

          // Validar que el inicio no sea posterior al fin
          if (newStartTime >= newEndTime) {
            if (edge === "left") newStartTime = addMinutes(newEndTime, -15);
            // Duración mínima 15 min
            else newEndTime = addMinutes(newStartTime, 15);
          }

          // Validar límites del día/vista si es necesario (ej. no empezar antes de las 00:00)
          // newStartTime = clampDateToView(newStartTime, viewBoundaries);
          // newEndTime = clampDateToView(newEndTime, viewBoundaries);

          const updatedEvent: Event = {
            ...eventToResize,
            startTime: newStartTime.toISOString(),
            endTime: newEndTime.toISOString(),
          };

          console.log("Updating event (resize):", updatedEvent);
          updateEvent(updatedEvent);
        }
        // --- Caso 4: Arrastrar a zona de eliminación (si se implementa) ---
        // else if (over?.id === 'delete-zone') {
        //   if (isDraggableEvent(activeData)) {
        //     deleteEvent(activeData.event.id);
        //   }
        // }
        else {
          console.log("DragEnd: No matching D&D handler for:", {
            activeType: activeData?.type,
            overType: overData?.type,
          });
        }
      } catch (error) {
        console.error("Error during drag end processing:", error);
        // Opcional: Mostrar notificación de error al usuario
      } finally {
        // Asegurarse de limpiar estados incluso si hay errores
        setActiveId(null);
        setActiveDragItem(null);
        setInitialDragEventTimes(null);
      }
    },
    [addEvent, updateEvent, getEmployeeById, initialDragEventTimes, currentView]
  );

  // ------ Renderizado del Overlay ------
  const renderDragOverlay = () => {
    if (!activeId || !activeDragItem) return null;

    const activeData = getActiveData({
      id: activeId,
      data: {
        current: {
          type: activeDragItem.id === "overlay-temp" ? "sidebarItem" : "event",
          event: activeDragItem,
        },
      },
    } as any); // Simula el objeto Active

    // Renderiza el overlay basado en el tipo de item
    if (
      isDraggableEvent(activeData) ||
      isDraggableResizeHandle(activeData) ||
      (isDraggableSidebarItem(activeData) &&
        activeDragItem.id === "overlay-temp")
    ) {
      // Usamos los componentes de evento existentes para el overlay
      // Pasamos un estilo básico, dnd-kit se encarga de la posición
      const style: React.CSSProperties = {
        cursor: "grabbing",
        // Puedes añadir más estilos si es necesario (ej. tamaño fijo)
      };

      if (currentView === "timeline") {
        return <TimelineEventItem event={activeDragItem} style={style} />;
      } else {
        // Usar EventItem para Day y Week (Week necesitará ajustes de estilo)
        // El tamaño en el overlay puede ser fijo o basado en la duración default
        const overlayHeight =
          currentView === "day"
            ? `${
                (differenceInMinutes(
                  new Date(activeDragItem.endTime),
                  new Date(activeDragItem.startTime)
                ) /
                  60) *
                60
              }px`
            : "auto"; // Altura base 60px/hr para DayView

        return (
          <EventItem
            event={activeDragItem}
            style={{ ...style, height: overlayHeight, width: "150px" }}
          />
        );
      }
    }

    return null;
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragMove={handleDragMove}
    >
      <div className="flex flex-col h-screen">
        {/* Contenedor principal con altura completa */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Contenedor para FilterBar y el resto */}
          <FilterBar />
          <div className="flex flex-1 overflow-hidden">
            {/* Contenedor para EmployeeList y Calendar */}
            <EmployeeList />
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Contenedor del calendario */}
              <SchedulerCalendar />
            </div>
          </div>
        </div>

        {/* Panel de marcajes (siempre visible) */}
        <MarcajesPanel />

        {/* Contenedor para paneles de turnos y licencias */}
        {(showTurnos || showLicencias) && (
          <div className="w-full clearfix">
            {/* Panel de turnos (mostrado condicionalmente) */}
            {showTurnos && <TurnosPanel />}

            {/* Panel de licencias (mostrado condicionalmente) */}
            {showLicencias && <LicenciasPanel />}
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddEventModal && <AddEventModal />}
      {showEditEventModal && <EditEventModal />}
      {showAddMarkingModal && <AddMarkingModal />}
      {showEditMarkingModal && <EditMarkingModal />}
      {showManageEmployeesModal && <ManageEmployeesModal />}
      {showAddPermissionModal && <AddPermissionModal />}
      {showAddScheduleModal && <AddScheduleModal />}

      {/* Context Menu */}
      {showContextMenu && (
        <div data-contextmenu-trigger>
          <ContextMenu
            position={contextMenuPosition}
            type={contextMenuType}
            data={contextMenuData}
          />
        </div>
      )}

      {/* Floating Time Panel */}
      {showFloatingTimePanel && <FloatingTimeApprovalPanel />}

      {/* Drag Overlay: Muestra el elemento mientras se arrastra */}
      <DragOverlay dropAnimation={null}>{renderDragOverlay()}</DragOverlay>
    </DndContext>
  );
}
