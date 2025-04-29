/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  PointerSensorOptions,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
  type UniqueIdentifier,
  type Active,
  type Over,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useUI } from "../hooks/useUI";
import { useEvents } from "../hooks/useEvents";
import { useEmployees } from "../hooks/useEmployees";
import { useMarkings } from "../hooks/useMarkings";
import EmployeeList from "./employee/EmployeeList";
import SchedulerCalendar from "./calendar/SchedulerCalendar";
import FilterBar from "./filters/FilterBar";

// ... (imports de Modals, ContextMenu, Items, etc.)
import AddEventModal from "./modals/AddEventModal";
import EditEventModal from "./modals/EditEventModal";
import AddMarkingModal from "./modals/AddMarkingModal";
import EditMarkingModal from "./modals/EditMarkingModal";
import ManageEmployeesModal from "./modals/ManageEmployeesModal";
import AddPermissionModal from "./modals/AddPermissionModal";
import AddScheduleModal from "./modals/AddScheduleModal";
import ContextMenu from "./context-menu/ContextMenu";
import FloatingTimeApprovalPanel from "./floating-time/FloatingTimeApprovalPanel";
import EventItem from "./calendar/EventItem"; // Para overlay en otras vistas
import TimelineEventItem from "./calendar/TimelineEventItem";
import TimelineMarkingPin from "./calendar/TimelineMarkingPin";

import {
  getActiveData,
  getOverData,
  isDraggableEvent,
  isDraggableSidebarItem,
  isDraggableResizeHandle,
  isDraggableWorkedTime,
  isDroppableTimelineRow,
  calculateTimeFromTimelineOffset,
} from "../utils/dndUtils";
import type { Event } from "../interfaces/Event";
import type { Marking } from "../interfaces/Marking";
import {
  addHours,
  addMinutes,
  differenceInMinutes,
  set,
  isSameDay,
} from "date-fns";
import { useFilters } from "../hooks/useFilters";
import MarcajesPanel from "./turnos_licencia/MarcajesPanel";
import TurnosPanel from "./turnos_licencia/TurnosPanel";
import LicenciasPanel from "./turnos_licencia/LicenciaPanel";

const pointerSensorOptions: PointerSensorOptions = {
  activationConstraint: { distance: 5 },
};

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
    // Asegúrate de tener `showNotification` si lo usas
  } = useUI();
  const { addEvent, updateEvent, getEventById } = useEvents();
  const { getEmployeeById } = useEmployees();
  const { updateMarking, getMarkingById } = useMarkings();
  const { currentView, dateRange } = useFilters();

  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [activeDragItem, setActiveDragItem] = useState<any>(null);
  const [initialDragTimes, setInitialDragTimes] = useState<{
    start: Date;
    end: Date;
  } | null>(null);
  const [isResizing, setIsResizing] = useState(false); // Flag específico para resize
  const [draggedHandleEdge, setDraggedHandleEdge] = useState<
    "left" | "right" | null
  >(null); // Para saber qué handle se arrastra

  const [showTurnos, setShowTurnos] = useState(false); // Estado local
  const [showLicencias, setShowLicencias] = useState(false); // Estado local

  const schedulerContainerRef = useRef<HTMLDivElement>(null);
  // Ref para el CONTENIDO del timeline (el div scrollable interior)
  const timelineContentRef = useRef<HTMLDivElement>(null);
  // Ref para el CONTENEDOR PRINCIPAL del timeline (el que tiene el overflow)
  const timelineMainScrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleTurnosToggle = (event: CustomEvent) =>
      setShowTurnos(event.detail.show);
    const handleLicenciasToggle = (event: CustomEvent) =>
      setShowLicencias(event.detail.show);
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

  const sensors = useSensors(
    useSensor(PointerSensor, pointerSensorOptions),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        showContextMenu &&
        !target.closest("[data-contextmenu]") &&
        !target.closest("[data-contextmenu-trigger]")
      ) {
        closeContextMenu();
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showContextMenu, closeContextMenu]);

  // --- handleDragStart ---
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const activeData = getActiveData(active as Active);

      console.log("--- handleDragStart ---");
      console.log("Active ID:", active.id);
      console.log("Active Data:", JSON.stringify(activeData, null, 2));

      setActiveId(active.id);
      setIsResizing(false); // Reset resizing flag
      setDraggedHandleEdge(null); // Reset handle edge

      if (!activeData) {
        console.warn("[DragStart] No active data found!");
        setActiveDragItem(null);
        setInitialDragTimes(null);
        return;
      }

      // --- Caso: Arrastrando un Evento ---
      if (isDraggableEvent(activeData)) {
        console.log("[DragStart] Type: Event");
        const eventItem = activeData.event;
        setActiveDragItem(eventItem);
        setInitialDragTimes({
          start: new Date(eventItem.startTime),
          end: new Date(eventItem.endTime),
        });
        console.log("[DragStart] Event Initial Times:", {
          start: new Date(eventItem.startTime),
          end: new Date(eventItem.endTime),
        });
      }
      // --- Caso: Arrastrando una Barra de Tiempo Trabajado ---
      else if (isDraggableWorkedTime(activeData)) {
        console.log("[DragStart] Type: WorkedTimeBar");
        const entrada = getMarkingById(activeData.entradaMarkingId);
        const salida = activeData.salidaMarkingId
          ? getMarkingById(activeData.salidaMarkingId)
          : null;

        if (entrada) {
          const startTime = new Date(entrada.time);
          // Usa la hora de salida si existe, si no, usa la hora actual si es el mismo día, si no, usa la hora de entrada
          const endTime = salida
            ? new Date(salida.time)
            : isSameDay(new Date(), startTime)
            ? new Date() // Hora actual si es hoy
            : startTime; // Hora de entrada si es un día pasado sin salida

          setActiveDragItem({
            type: "workedTime", // Importante para el overlay
            entrada: entrada,
            salida: salida,
            employeeId: entrada.employeeId,
            // Pasamos la fecha como string para reconstruirla si es necesario
            currentDateISO: startTime.toISOString().split("T")[0],
          });
          setInitialDragTimes({ start: startTime, end: endTime });
          console.log("[DragStart] WorkedTime Initial Times:", {
            start: startTime,
            end: endTime,
          });
        } else {
          console.warn(
            "[DragStart] WorkedTime - Entrada marking not found:",
            activeData.entradaMarkingId
          );
          setActiveDragItem(null);
          setInitialDragTimes(null);
        }
      }
      // --- Caso: Arrastrando un Handle de Redimensionamiento ---
      else if (isDraggableResizeHandle(activeData)) {
        console.log("[DragStart] Type: Resize Handle");
        setIsResizing(true); // ¡Activar flag de redimensionamiento!
        setDraggedHandleEdge(activeData.edge); // Guardar qué borde se está arrastrando

        // Encontrar el item asociado (Evento o Marcaje)
        let itemToResize: Event | Marking | null = null;
        if (activeData.itemType === "event" && activeData.event) {
          itemToResize = activeData.event;
          setInitialDragTimes({
            start: new Date(itemToResize.startTime),
            end: new Date(itemToResize.endTime),
          });
          console.log("[DragStart] Resizing Event:", itemToResize);
        } else if (activeData.itemType === "workedTime") {
          itemToResize = getMarkingById(activeData.markingId);
          if (itemToResize) {
            // Para el marcaje, start y end time inicial son el mismo
            setInitialDragTimes({
              start: new Date(itemToResize.time),
              end: new Date(itemToResize.time),
            });
            console.log("[DragStart] Resizing Marking:", itemToResize);
          } else {
            console.warn(
              "[DragStart] Resize Handle - Marking not found:",
              activeData.markingId
            );
          }
        }

        if (itemToResize) {
          setActiveDragItem(itemToResize); // Guardamos el evento o marcaje que se está redimensionando
        } else {
          console.warn(
            `[DragStart] Resize Handle - Item to resize (${activeData.itemType}) not found or data missing.`
          );
          setActiveDragItem(null);
          setInitialDragTimes(null);
        }
      }
      // --- Caso: Arrastrando desde el Sidebar ---
      else if (isDraggableSidebarItem(activeData)) {
        console.log("[DragStart] Type: Sidebar Item");
        // Crear un objeto temporal similar a un evento para el overlay
        const tempEvent = {
          id: `overlay-temp-${activeData.itemType}-${Date.now()}`, // ID temporal único
          title: activeData.itemData.name,
          type: activeData.itemType, // Usar el itemType real (e.g., 'shift', 'permission')
          employeeId: "temp",
          startTime: new Date().toISOString(), // Hora actual como placeholder
          endTime: addHours(
            new Date(),
            activeData.itemData.defaultDurationHours ?? 1
          ).toISOString(),
          isAllDay: activeData.itemData.category === "permission",
          // Añadir datos específicos del itemData para el overlay
          itemData: activeData.itemData, // Mantener color, etc.
          category: activeData.itemData.category, // Guardar categoría
        };
        setActiveDragItem(tempEvent);
        setInitialDragTimes(null); // No hay tiempos iniciales para items nuevos
      }
      // --- Otro caso ---
      else {
        console.log("[DragStart] Type: Unknown or non-draggable");
        setActiveDragItem(null);
        setInitialDragTimes(null);
      }
    },
    [getEventById, getMarkingById] // Añadir dependencias
  );

  const handleDragMove = useCallback(
    (event: any /* DragMoveEvent */) => {
      // Podrías añadir lógica aquí si necesitas feedback visual durante el movimiento
      // console.log("[DragMove] Delta X:", event.delta.x, "Delta Y:", event.delta.y);
      if (isResizing && activeDragItem) {
        // console.log(`[DragMove] Resizing ${draggedHandleEdge} handle...`);
      }
    },
    [isResizing, activeDragItem, draggedHandleEdge]
  );

  // --- handleDragEnd ---
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over, delta } = event;

      // --- Log Inicial ---
      console.log("--- handleDragEnd ---");
      console.log("Active ID:", active.id);
      console.log("Over ID:", over?.id);
      console.log("Delta:", delta);
      console.log("Is Resizing Flag:", isResizing);
      console.log("Dragged Handle:", draggedHandleEdge);

      // Guardar estado antes de resetear
      const activeIdBeforeEnd = activeId;
      const activeDragItemBeforeEnd = activeDragItem;
      const initialDragTimesBeforeEnd = initialDragTimes;
      const isResizingBeforeEnd = isResizing;
      const draggedHandleEdgeBeforeEnd = draggedHandleEdge;

      // Resetear estado del drag
      setActiveId(null);
      setActiveDragItem(null);
      setInitialDragTimes(null);
      setIsResizing(false);
      setDraggedHandleEdge(null);

      // --- Validaciones Esenciales ---
      if (!over || !activeIdBeforeEnd || !activeDragItemBeforeEnd) {
        console.log(
          "[DragEnd] Aborted - No 'over' or missing active drag data."
        );
        return;
      }

      // Reconstruir datos active/over (¡Importante!)
      const activeData = getActiveData(active as Active);
      const overData = getOverData(over as Over);

      console.log(
        "Active Data (reconstructed):",
        JSON.stringify(activeData, null, 2)
      );
      console.log(
        "Over Data (reconstructed):",
        JSON.stringify(overData, null, 2)
      );

      if (!activeData || !overData) {
        console.log(
          "[DragEnd] Aborted - Missing reconstructed active/over data."
        );
        return;
      }

      // --- Verificación Específica para Timeline ---
      if (currentView !== "timeline") {
        console.log(
          `[DragEnd] Aborted - Not in timeline view (current: ${currentView}). Skipping timeline logic.`
        );
        // Aquí podrías añadir lógica para otras vistas si fuera necesario
        return;
      }

      // Necesitamos las referencias al contenedor y su scroll para calcular la hora
      const timelineContentElement = timelineContentRef.current;
      const mainScrollContainerElement = timelineMainScrollContainerRef.current; // Usar el ref del contenedor principal
      const containerRect = timelineContentElement?.getBoundingClientRect();
      const scrollLeft = mainScrollContainerElement?.scrollLeft ?? 0; // Usar el scroll del contenedor principal

      console.log("[DragEnd] Timeline Refs Check:", {
        timelineContentElementExists: !!timelineContentElement,
        mainScrollContainerElementExists: !!mainScrollContainerElement,
        containerRectExists: !!containerRect,
        scrollLeft,
        containerRect: containerRect
          ? {
              top: containerRect.top,
              left: containerRect.left,
              width: containerRect.width,
              height: containerRect.height,
            }
          : null,
      });

      if (
        !containerRect ||
        !timelineContentElement ||
        !mainScrollContainerElement
      ) {
        console.error(
          "[DragEnd] Aborted - Missing necessary timeline refs or containerRect for calculations."
        );
        return;
      }
      // --- FIN Verificación Específica para Timeline ---

      // --- INICIO LÓGICA PRINCIPAL handleDragEnd (Timeline) ---
      try {
        // --- Caso 1: Crear Evento desde Sidebar/Paneles Inferiores ---
        if (
          isDraggableSidebarItem(activeData) &&
          isDroppableTimelineRow(overData)
        ) {
          console.log("[DragEnd] Handler: Create Event from Sidebar/Panel");
          const { itemType, itemData } = activeData;
          const employeeId = overData.employeeId;
          const targetDate = overData.date; // Fecha de la fila donde se soltó
          const isPermissionOrFullDay =
            itemData.category === "permission" ||
            itemData.defaultDurationHours === 24;

          // Calcular la hora de inicio basada en dónde se soltó
          const dropTime = calculateTimeFromTimelineOffset(
            (event.activatorEvent as PointerEvent).clientX, // Usar clientX del evento final
            containerRect,
            scrollLeft,
            overData.gridInfo
          );

          let startTime: Date;
          let endTime: Date;

          if (isPermissionOrFullDay) {
            // Evento de día completo: ignorar dropTime, empezar a las 00:00
            startTime = set(targetDate, {
              hours: 0,
              minutes: 0,
              seconds: 0,
              milliseconds: 0,
            });
            // Terminar al final del día
            endTime = set(targetDate, {
              hours: 23,
              minutes: 59,
              seconds: 59,
              milliseconds: 999,
            });
          } else {
            // Evento con duración: usar dropTime
            startTime = set(targetDate, {
              hours: dropTime.getHours(),
              minutes: dropTime.getMinutes(),
              seconds: 0,
              milliseconds: 0,
            });
            endTime = addHours(startTime, itemData.defaultDurationHours ?? 1);
          }

          const newEvent: Omit<Event, "id"> = {
            title: itemData.name,
            type: itemType, // Usar el ID del tipo (e.g., 'shift-s1')
            employeeId: employeeId,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            isAllDay: isPermissionOrFullDay,
            location: "", // Opcional, puedes añadir lógica si es necesario
            description: "", // Opcional
          };
          console.log("[DragEnd] Adding event from sidebar:", newEvent);
          addEvent(newEvent);
        }
        // --- Caso 2: Mover Evento Existente ---
        else if (
          isDraggableEvent(activeData) &&
          isDroppableTimelineRow(overData) &&
          initialDragTimesBeforeEnd // Asegurarse de tener los tiempos iniciales
        ) {
          console.log("[DragEnd] Handler: Move Event");
          const eventToMove = activeData.event;
          const targetEmployeeId = overData.employeeId;
          const targetDate = overData.date;

          // Calcular duración original
          const durationMinutes = differenceInMinutes(
            initialDragTimesBeforeEnd.end,
            initialDragTimesBeforeEnd.start
          );

          if (durationMinutes <= 0) {
            console.warn(
              "[DragEnd] Move Event: Invalid duration.",
              durationMinutes
            );
            return;
          }

          // Calcular la nueva hora de inicio basada en dónde se soltó
          const dropTime = calculateTimeFromTimelineOffset(
            (event.activatorEvent as PointerEvent).clientX,
            containerRect,
            scrollLeft,
            overData.gridInfo
          );

          let newStartTime: Date;
          // Si es de día completo, mantenerlo así en la nueva fecha
          if (eventToMove.isAllDay) {
            newStartTime = set(targetDate, {
              hours: 0,
              minutes: 0,
              seconds: 0,
              milliseconds: 0,
            });
          } else {
            newStartTime = set(targetDate, {
              hours: dropTime.getHours(),
              minutes: dropTime.getMinutes(),
              seconds: 0,
              milliseconds: 0,
            });
          }

          const newEndTime = addMinutes(newStartTime, durationMinutes);

          const updatedEventData: Event = {
            ...eventToMove,
            employeeId: targetEmployeeId,
            startTime: newStartTime.toISOString(),
            endTime: newEndTime.toISOString(),
          };
          console.log("[DragEnd] Updating moved event:", updatedEventData);
          updateEvent(updatedEventData);
        }
        // --- Caso 3: Mover WorkedTimeBar ---
        else if (
          isDraggableWorkedTime(activeData) &&
          isDroppableTimelineRow(overData) &&
          initialDragTimesBeforeEnd &&
          activeDragItemBeforeEnd?.type === "workedTime" // Verificar el tipo del item activo
        ) {
          console.log("[DragEnd] Handler: Move WorkedTimeBar");
          const { entrada, salida } = activeDragItemBeforeEnd as {
            entrada: Marking;
            salida: Marking | null;
          }; // Casteo seguro
          const targetEmployeeId = overData.employeeId;
          const targetDate = overData.date;

          if (!entrada) {
            console.error(
              "[DragEnd] Move WorkedTimeBar failed: Missing 'entrada' marking in activeDragItemBeforeEnd."
            );
            return;
          }

          // Calcular duración original
          const durationMinutes = differenceInMinutes(
            initialDragTimesBeforeEnd.end,
            initialDragTimesBeforeEnd.start
          );

          if (durationMinutes <= 0) {
            console.warn(
              "[DragEnd] Move WorkedTimeBar: Invalid duration.",
              durationMinutes
            );
            return;
          }

          // Calcular nueva hora de inicio
          const dropTime = calculateTimeFromTimelineOffset(
            (event.activatorEvent as PointerEvent).clientX,
            containerRect,
            scrollLeft,
            overData.gridInfo
          );

          const newStartTime = set(targetDate, {
            hours: dropTime.getHours(),
            minutes: dropTime.getMinutes(),
            seconds: 0,
            milliseconds: 0,
          });
          const newEndTime = addMinutes(newStartTime, durationMinutes);

          // Actualizar marcaje de ENTRADA
          const updatedEntrada: Marking = {
            ...entrada,
            employeeId: targetEmployeeId,
            time: newStartTime.toISOString(),
          };
          console.log(
            "[DragEnd] Updating ENTRADA marking (move):",
            updatedEntrada
          );
          updateMarking(updatedEntrada);

          // Actualizar marcaje de SALIDA si existe
          if (salida) {
            const updatedSalida: Marking = {
              ...salida,
              employeeId: targetEmployeeId,
              time: newEndTime.toISOString(),
            };
            console.log(
              "[DragEnd] Updating SALIDA marking (move):",
              updatedSalida
            );
            updateMarking(updatedSalida);
          } else {
            console.log("[DragEnd] No SALIDA marking to update for move.");
          }
        }
        // --- Caso 4: Redimensionar (Evento o WorkedTimeBar) ---
        else if (
          isResizingBeforeEnd && // Usar el flag guardado
          isDraggableResizeHandle(activeData) &&
          isDroppableTimelineRow(overData) &&
          initialDragTimesBeforeEnd // Necesitamos el tiempo inicial para saber qué se redimensiona
        ) {
          console.log("[DragEnd] Handler: Resize Item");
          const { edge, itemType } = activeData;
          const targetEmployeeId = overData.employeeId; // El empleado sobre el que se soltó (puede no ser relevante para resize, pero útil)
          const targetDate = overData.date; // Fecha sobre la que se soltó

          // Calcular la posición final X del handle
          const handleFinalX = (event.activatorEvent as PointerEvent).clientX; // Usamos la posición final del puntero

          // Calcular la nueva hora basada en la posición final del handle
          const newTime = calculateTimeFromTimelineOffset(
            handleFinalX,
            containerRect,
            scrollLeft,
            overData.gridInfo
          );

          // Combinar la fecha de la fila con la hora calculada
          let newDateTime = set(targetDate, {
            hours: newTime.getHours(),
            minutes: newTime.getMinutes(),
            seconds: 0,
            milliseconds: 0,
          });

          console.log("[DragEnd] Resize Details:", {
            edge,
            itemType,
            initialTime: initialDragTimesBeforeEnd.start, // O end, según el handle
            finalPointerX: handleFinalX,
            calculatedNewTime: newTime,
            targetDate: targetDate,
            newDateTimeCombined: newDateTime,
          });

          // --- Subcaso 4.1: Redimensionar Evento ---
          if (
            itemType === "event" &&
            activeData.event &&
            isDraggableEvent(activeDragItemBeforeEnd)
          ) {
            console.log("[DragEnd] Resizing Event");
            const eventToResize = activeDragItemBeforeEnd; // El evento guardado en dragStart

            // Validar que el evento existe
            if (!eventToResize) {
              console.error(
                "[DragEnd] Resize Event Error: Event data missing in activeDragItemBeforeEnd."
              );
              return;
            }

            let updatedStartTime = new Date(eventToResize.startTime);
            let updatedEndTime = new Date(eventToResize.endTime);

            if (edge === "left") {
              // No permitir que start sea después de end
              if (newDateTime >= updatedEndTime) {
                console.warn(
                  "[DragEnd] Resize Event (Left): Start time cannot be after end time. Adjusting."
                );
                // Ajustar a 5 minutos antes del fin como mínimo
                newDateTime = addMinutes(updatedEndTime, -5);
              }
              updatedStartTime = newDateTime;
            } else {
              // edge === 'right'
              // No permitir que end sea antes de start
              if (newDateTime <= updatedStartTime) {
                console.warn(
                  "[DragEnd] Resize Event (Right): End time cannot be before start time. Adjusting."
                );
                // Ajustar a 5 minutos después del inicio como mínimo
                newDateTime = addMinutes(updatedStartTime, 5);
              }
              updatedEndTime = newDateTime;
            }

            const updatedEvent: Event = {
              ...eventToResize,
              startTime: updatedStartTime.toISOString(),
              endTime: updatedEndTime.toISOString(),
              // employeeId: targetEmployeeId, // ¿Debería cambiar el empleado al redimensionar? Usualmente no.
            };
            console.log("[DragEnd] Updating resized event:", updatedEvent);
            updateEvent(updatedEvent);
          }
          // --- Subcaso 4.2: Redimensionar WorkedTimeBar (actualizar marcaje) ---
          else if (itemType === "workedTime" && activeData.markingId) {
            console.log("[DragEnd] Resizing WorkedTimeBar");
            const markingIdToUpdate = activeData.markingId;
            const relatedMarkingId = activeData.relatedMarkingId;
            const markingToUpdate = getMarkingById(markingIdToUpdate);
            const relatedMarking = relatedMarkingId
              ? getMarkingById(relatedMarkingId)
              : null;

            if (!markingToUpdate) {
              console.error(
                `[DragEnd] Resize WorkedTimeBar Error: Marking with ID ${markingIdToUpdate} not found.`
              );
              return;
            }

            console.log("[DragEnd] Resizing Marking:", markingToUpdate);
            if (relatedMarking)
              console.log("[DragEnd] Related Marking:", relatedMarking);

            // Validación de no cruce con el marcaje relacionado
            if (relatedMarking) {
              const relatedTime = new Date(relatedMarking.time);
              const minSeparation = 5; // Mínimo 5 minutos de separación

              if (
                edge === "left" &&
                newDateTime >= addMinutes(relatedTime, -minSeparation)
              ) {
                console.warn(
                  "[DragEnd] Resize WorkedTime (Left): Crossing related marking. Adjusting."
                );
                newDateTime = addMinutes(relatedTime, -minSeparation);
              } else if (
                edge === "right" &&
                newDateTime <= addMinutes(relatedTime, minSeparation)
              ) {
                console.warn(
                  "[DragEnd] Resize WorkedTime (Right): Crossing related marking. Adjusting."
                );
                newDateTime = addMinutes(relatedTime, minSeparation);
              }
            }

            const updatedMarking: Marking = {
              ...markingToUpdate,
              time: newDateTime.toISOString(),
              // employeeId: targetEmployeeId, // ¿Cambiar empleado al redimensionar? Probablemente no.
            };
            console.log(
              `[DragEnd] Updating ${
                edge === "left" ? "ENTRADA" : "SALIDA"
              } marking (resize):`,
              updatedMarking
            );
            updateMarking(updatedMarking);
          } else {
            console.warn(
              "[DragEnd] Resize: Unknown item type or missing data.",
              { itemType, activeData }
            );
          }
        }

        // --- Otros casos / No manejado ---
        else {
          console.log("[DragEnd] No matching D&D handler for:", {
            activeType: activeData?.type,
            overType: overData?.type,
            isResizing: isResizingBeforeEnd, // Usa el valor antes del reset
            activeId: activeIdBeforeEnd,
            overId: over?.id,
          });
        }
      } catch (error) {
        console.error("[DragEnd] Error during processing:", error);
        // Considerar mostrar una notificación de error al usuario
      }
      // --- FIN LÓGICA PRINCIPAL handleDragEnd ---
    },
    [
      activeId,
      activeDragItem,
      initialDragTimes,
      isResizing,
      draggedHandleEdge, // Estados del D&D
      currentView,
      dateRange, // Contexto de Filtros
      addEvent,
      updateEvent, // Acciones de Eventos
      getMarkingById,
      updateMarking, // Acciones de Marcajes
      getEventById, // Acciones de Eventos (para resize)
      timelineContentRef,
      timelineMainScrollContainerRef, // Refs
      closeContextMenu, // Para cerrar menú si está abierto
      // showNotification // Si se usa para errores
    ]
  );

  // --- renderDragOverlay ---
  const renderDragOverlay = () => {
    if (!activeId || !activeDragItem) {
      // console.log("[Overlay] No active item, rendering null.");
      return null;
    }

    const item = activeDragItem;
    const isResizingOverlay = isResizing; // Usa el estado actual
    const overlayType =
      item.type || (isDraggableSidebarItem(item) ? "sidebarItem" : "unknown");

    console.log(
      `[Overlay] Rendering for ID: ${activeId}, Type: ${overlayType}, Resizing: ${isResizingOverlay}`
    );
    // console.log("[Overlay] Item Data:", item);

    const hourWidth = 80; // Debería coincidir con TimelineView
    const rowHeight = 50; // Debería coincidir con TimelineView

    // --- Overlay para Evento o Sidebar Item (convertido a evento temporal) ---
    if (overlayType === "event" || overlayType === "sidebarItem") {
      const isSidebar = overlayType === "sidebarItem";
      // Construir un objeto Event consistente para el overlay
      const eventForOverlay: Event & { itemData?: any } = {
        id: item.id || `overlay-${Date.now()}`,
        title: isSidebar ? item.itemData?.name : item.title,
        type: isSidebar ? item.itemType : item.type,
        startTime: item.startTime || new Date().toISOString(),
        endTime: item.endTime || addHours(new Date(), 1).toISOString(),
        employeeId: item.employeeId || "temp",
        isAllDay:
          item.isAllDay ??
          (isSidebar && item.itemData?.category === "permission"),
        itemData: isSidebar ? item.itemData : undefined, // Incluir itemData para sidebar
      };

      const style: React.CSSProperties = {
        cursor: "grabbing",
        opacity: 0.7,
        position: "relative", // Cambiado de absolute para que el tamaño lo controle el contenido o width/height
        zIndex: 1001,
      };

      if (currentView === "timeline") {
        const start = new Date(eventForOverlay.startTime);
        const end = new Date(eventForOverlay.endTime);
        const durationMinutes = differenceInMinutes(end, start);
        // Ancho mínimo de 15 mins, máximo de 24h
        const calculatedWidth = Math.max(
          hourWidth / 4,
          Math.min(24 * hourWidth, (durationMinutes / 60) * hourWidth)
        );

        style.width = `${calculatedWidth}px`;
        // Alto fijo pequeño para el overlay del evento/sidebar en timeline
        style.height = `${rowHeight * 0.35}px`;

        // Usar TimelineEventItem si es un evento existente
        if (!isSidebar) {
          console.log("[Overlay] Rendering TimelineEventItem overlay");
          return <TimelineEventItem event={eventForOverlay} style={style} />;
        }
        // Renderizar un div simple para el item del sidebar
        else {
          console.log("[Overlay] Rendering Sidebar item div overlay");
          return (
            <div
              style={{
                ...style,
                backgroundColor: eventForOverlay.itemData?.color || "#cbd5e1", // Usar color del itemData
                borderRadius: "4px",
                color: "white", // Asumir texto blanco, ajustar si es necesario
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "10px",
                padding: "0 4px",
                overflow: "hidden",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
                boxShadow: "0 2px 5px rgba(0,0,0,0.2)", // Añadir sombra
              }}
            >
              {eventForOverlay.title}
            </div>
          );
        }
      } else {
        // Overlay para otras vistas (Day/Week/Month) - Usar EventItem normal
        console.log("[Overlay] Rendering EventItem overlay (non-timeline)");
        return <EventItem event={eventForOverlay} style={style} />;
      }
    }

    // --- Overlay para WorkedTimeBar ---
    if (overlayType === "workedTime" && item?.entrada) {
      console.log("[Overlay] Rendering WorkedTimeBar overlay");
      const { entrada, salida } = item as {
        entrada: Marking;
        salida: Marking | null;
      };
      const entradaTime = new Date(entrada.time);

      // Usar la hora final de initialDragTimes si existe y es válida, si no, calcular como en dragStart
      const endTimeForOverlay =
        initialDragTimes?.end && initialDragTimes.end > entradaTime
          ? initialDragTimes.end
          : salida
          ? new Date(salida.time)
          : isSameDay(new Date(), entradaTime)
          ? new Date()
          : entradaTime;

      const duration = Math.max(
        0,
        differenceInMinutes(endTimeForOverlay, entradaTime)
      );
      const standardMins = 8 * 60; // Podrías obtener esto de la configuración del empleado
      const regularMinutes = Math.min(duration, standardMins);
      const overtimeMinutes = Math.max(0, duration - regularMinutes);

      const overlayStyle: React.CSSProperties = {
        cursor: "grabbing",
        height: `${rowHeight * 0.35}px`,
        width: `${Math.max(2, (duration / 60) * hourWidth)}px`, // Ancho mínimo 2px
        opacity: 0.7,
        display: "flex",
        borderRadius: "4px",
        overflow: "hidden",
        position: "relative",
        zIndex: 1001,
        boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
      };

      // Renderizar directamente las barras de colores para el overlay
      return (
        <div style={overlayStyle}>
          {regularMinutes > 0 && (
            <div
              className="h-full bg-green-400"
              style={{ width: `${(regularMinutes / 60) * hourWidth}px` }}
            />
          )}
          {overtimeMinutes > 0 && (
            <div
              className="h-full bg-yellow-400"
              style={{ width: `${(overtimeMinutes / 60) * hourWidth}px` }}
            />
          )}
        </div>
      );
    }

    // --- Overlay para Resize Handle ---
    if (
      isResizingOverlay &&
      (item as Marking)?.time &&
      (item as Marking)?.type
    ) {
      // Aquí 'item' debería ser el Marcaje que se está redimensionando
      const markingForOverlay = item as Marking;
      console.log(
        "[Overlay] Rendering Resize Handle (MarkingPin) overlay for:",
        markingForOverlay
      );

      const style: React.CSSProperties = {
        cursor: "ew-resize", // Cursor de redimensionamiento
        opacity: 0.7,
        position: "relative", // Dejar que el DragOverlay lo posicione
        zIndex: 1001,
        // No establecemos top/left aquí, DragOverlay lo hace
      };
      // Usar TimelineMarkingPin para representar el handle que se arrastra
      return <TimelineMarkingPin marking={markingForOverlay} style={style} />;
    }

    console.log(
      "[Overlay] No matching item type for overlay, rendering null. Type:",
      overlayType
    );
    return null; // Fallback
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragMove={handleDragMove} // Añadido por si se necesita
    >
      <div
        ref={schedulerContainerRef}
        className="flex flex-col h-screen overflow-hidden"
      >
        <div className="flex flex-1 flex-col overflow-hidden">
          <FilterBar />
          <div className="flex flex-1 overflow-hidden">
            <EmployeeList />
            {/* Pasar las refs necesarias al calendario */}
            <SchedulerCalendar
              timelineContentRef={timelineContentRef}
              timelineMainScrollContainerRef={timelineMainScrollContainerRef}
            />
          </div>
        </div>

        {/* Paneles inferiores */}
        <MarcajesPanel />
        {(showTurnos || showLicencias) && (
          <div className="w-full clearfix border-t bg-background">
            {showTurnos && <TurnosPanel />}
            {showLicencias && <LicenciasPanel showTurnos={showTurnos} />}
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
        <div data-contextmenu>
          {" "}
          {/* Evita que el click cierre el menú */}
          <ContextMenu
            position={contextMenuPosition}
            type={contextMenuType}
            data={contextMenuData}
          />
        </div>
      )}

      {/* Floating Time Panel */}
      {showFloatingTimePanel && <FloatingTimeApprovalPanel />}

      {/* Drag Overlay */}
      <DragOverlay dropAnimation={null}>{renderDragOverlay()}</DragOverlay>
    </DndContext>
  );
}
