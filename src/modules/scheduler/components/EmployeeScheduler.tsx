// src/modules/scheduler/components/EmployeeScheduler.tsx

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

import AddEventModal from "./modals/AddEventModal";
import EditEventModal from "./modals/EditEventModal";
import AddMarkingModal from "./modals/AddMarkingModal";
import EditMarkingModal from "./modals/EditMarkingModal";
import ManageEmployeesModal from "./modals/ManageEmployeesModal";
import AddPermissionModal from "./modals/AddPermissionModal";
import AddScheduleModal from "./modals/AddScheduleModal";
import ContextMenu from "./context-menu/ContextMenu";
import FloatingTimeApprovalPanel from "./floating-time/FloatingTimeApprovalPanel";
// No necesitamos EventItem aquí directamente si solo usamos Timeline
// import EventItem from "./calendar/EventItem";
import TimelineEventItem from "./calendar/TimelineEventItem";
import TimelineMarkingPin from "./calendar/TimelineMarkingPin";
import { getEventTypeColor } from "../utils/eventUtils"; // Necesario para el overlay del sidebar item

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
  min,
  max,
} from "date-fns";
import { useFilters } from "../hooks/useFilters";
import MarcajesPanel from "./turnos_licencia/MarcajesPanel";
import TurnosPanel from "./turnos_licencia/TurnosPanel";
import LicenciasPanel from "./turnos_licencia/LicenciaPanel";

const pointerSensorOptions: PointerSensorOptions = {
  activationConstraint: { distance: 5 },
};

type SavedContainerInfo = {
  rect: DOMRect;
  scrollLeft: number;
} | null;

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
    showNotification,
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
  const [isResizing, setIsResizing] = useState(false);
  const [resizeEdge, setResizeEdge] = useState<"left" | "right" | null>(null);
  const [showTurnos, setShowTurnos] = useState(false);
  const [showLicencias, setShowLicencias] = useState(false);
  const [savedContainerInfo, setSavedContainerInfo] =
    useState<SavedContainerInfo>(null);

  const schedulerContainerRef = useRef<HTMLDivElement>(null);
  const timelineContentRef = useRef<HTMLDivElement>(null);
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

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      console.log("--- handleDragStart TRIGGERED ---", {
        id: event.active.id,
        data: event.active.data?.current,
      });
      const { active } = event;
      const activeData = getActiveData(active as Active); // active existe aquí
      console.log(
        "[DragStart] ID:",
        active.id,
        "ActiveData:",
        JSON.stringify(activeData)
      );

      setActiveId(active.id);
      setIsResizing(false);
      setResizeEdge(null);
      setSavedContainerInfo(null);

      if (!activeData) {
        console.warn("[DragStart] No active data found!");
        return;
      }

      if (currentView === "timeline") {
        const timelineContentElement = timelineContentRef.current;
        const scrollContainerElement = timelineMainScrollContainerRef.current;
        if (timelineContentElement && scrollContainerElement) {
          const rect = timelineContentElement.getBoundingClientRect();
          const scrollLeft = scrollContainerElement.scrollLeft ?? 0;
          if (rect.width > 0 && rect.height > 0) {
            setSavedContainerInfo({ rect, scrollLeft });
            console.log("[DragStart] Saved Container Info:", {
              rect: { left: rect.left.toFixed(0), top: rect.top.toFixed(0) },
              scrollLeft: scrollLeft.toFixed(0),
            });
          } else {
            console.warn(
              "[DragStart] Invalid Rect Dimensions, not saving:",
              rect
            );
          }
        } else {
          console.error(
            "[DragStart] Missing timelineContentRef or timelineMainScrollContainerRef!"
          );
        }
      }

      if (isDraggableEvent(activeData)) {
        console.log("[DragStart] Type: Event");
        setActiveDragItem(activeData.event);
        setInitialDragTimes({
          start: new Date(activeData.event.startTime),
          end: new Date(activeData.event.endTime),
        });
      } else if (isDraggableWorkedTime(activeData)) {
        console.log("[DragStart] Type: WorkedTime");
        const entrada = getMarkingById(activeData.entradaMarkingId);
        const salida = activeData.salidaMarkingId
          ? getMarkingById(activeData.salidaMarkingId)
          : null;
        if (entrada) {
          setActiveDragItem({
            type: "workedTime", // Marcar explícitamente para overlay
            entrada,
            salida,
            employeeId: entrada.employeeId,
            currentDateISO: new Date(entrada.time).toISOString().split("T")[0],
          });
          const startTime = new Date(entrada.time);
          const endTime = salida
            ? new Date(salida.time)
            : isSameDay(new Date(), startTime)
            ? new Date()
            : addHours(startTime, 8);
          setInitialDragTimes({ start: startTime, end: endTime });
        } else {
          setActiveDragItem(null);
          setInitialDragTimes(null);
        }
      } else if (isDraggableResizeHandle(activeData)) {
        console.log(
          `[DragStart] Type: Resize Handle (${activeData.itemType}, edge: ${activeData.edge})`
        );
        setIsResizing(true);
        setResizeEdge(activeData.edge);

        if (activeData.itemType === "workedTime") {
          const marking = getMarkingById(activeData.markingId);
          if (marking) {
            setActiveDragItem(marking); // Guardar el marcaje que se mueve
            setInitialDragTimes({
              start: new Date(marking.time),
              end: new Date(marking.time),
            });
          } else {
            setActiveDragItem(null);
            setInitialDragTimes(null);
          }
        } else if (activeData.itemType === "event" && activeData.event) {
          setActiveDragItem(activeData.event); // Guardar el evento
          setInitialDragTimes({
            start: new Date(activeData.event.startTime),
            end: new Date(activeData.event.endTime),
          });
        } else {
          setActiveDragItem(null);
          setInitialDragTimes(null);
        }
      } else if (isDraggableSidebarItem(activeData)) {
        console.log("[DragStart] Type: Sidebar Item");
        const tempEventData = {
          id: `sidebar-overlay-${activeData.itemType}-${activeData.itemData.id}`, // ID más único
          title: activeData.itemData.name,
          type: activeData.itemData.id, // Usar el ID específico del item (e.g., 's1', 'lpm') como tipo temporal? O mantener itemType ('shift', 'permission')? -> Usaremos itemType para consistencia con Event
          itemSpecificId: activeData.itemData.id, // Guardar id específico (s1, lpm)
          startTime: new Date().toISOString(),
          endTime: addHours(
            new Date(),
            activeData.itemData.defaultDurationHours ?? 1
          ).toISOString(),
          employeeId: "temp",
          isAllDay: activeData.itemData.category === "permission",
          originalData: activeData.itemData,
          dndType: "sidebarItem", // Identificador claro
        };
        setActiveDragItem(tempEventData);
        setInitialDragTimes(null);
      } else {
        setActiveDragItem(null);
        setInitialDragTimes(null);
      }
    },
    [
      getMarkingById,
      getEventById,
      currentView,
      timelineContentRef,
      timelineMainScrollContainerRef,
    ]
  );

  const handleDragMove = useCallback((event: any) => {
    // Placeholder
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over, delta } = event;
      const activeIdBeforeEnd = activeId;
      const activeDragItemBeforeEnd = activeDragItem;
      const initialDragTimesBeforeEnd = initialDragTimes;
      const isResizingBeforeEnd = isResizing;
      const resizeEdgeBeforeEnd = resizeEdge;
      const savedContainerInfoBeforeEnd = savedContainerInfo;

      console.log("[DragEnd] Started", {
        activeId: activeIdBeforeEnd,
        overId: over?.id,
        isResizing: isResizingBeforeEnd,
        resizeEdge: resizeEdgeBeforeEnd,
      });

      setActiveId(null);
      setActiveDragItem(null);
      setInitialDragTimes(null);
      setIsResizing(false);
      setResizeEdge(null);
      setSavedContainerInfo(null);

      if (!over || !activeIdBeforeEnd || !activeDragItemBeforeEnd) {
        console.log(
          "[DragEnd] Aborted: Missing over, activeId or activeDragItem"
        );
        return;
      }

      const activeData = getActiveData(active as Active); // active existe aquí
      const overData = getOverData(over as Over);

      if (!activeData || !overData) {
        console.log("[DragEnd] Aborted: Missing activeData or overData");
        return;
      }

      console.log("[DragEnd] Processing", {
        activeDataType: activeData.type,
        overDataType: overData.type,
        activeItemId:
          (activeData as any).event?.id ??
          (activeData as any).markingId ??
          (activeData as any).itemData?.id,
        overContainerId: (overData as any).employeeId ?? overData.type,
      });

      const containerRect = savedContainerInfoBeforeEnd?.rect;
      const scrollLeft = savedContainerInfoBeforeEnd?.scrollLeft ?? 0;

      if (currentView !== "timeline" || !containerRect) {
        console.error(
          "[DragEnd] Aborted: Not in timeline view or containerRect missing."
        );
        return;
      }

      // --- Calcular tiempo y fecha de destino ---
      // Necesitamos gridInfo del overData para calcular la hora
      const dropGridInfo = (overData as DroppableTimelineRowData).gridInfo;
      if (!dropGridInfo) {
        console.error(
          "[DragEnd] Aborted: Missing gridInfo in overData for timeline drop."
        );
        return;
      }
      const dropTime = calculateTimeFromTimelineOffset(
        (event.activatorEvent as PointerEvent).clientX, // Posición X del puntero
        containerRect,
        scrollLeft,
        dropGridInfo
      );
      const targetDate = (overData as DroppableTimelineRowData).date; // Fecha de la fila

      try {
        // --- CASE 1: Create Event from Sidebar (Turno/Licencia) ---
        if (
          isDraggableSidebarItem(activeData) &&
          isDroppableTimelineRow(overData)
        ) {
          console.log("[DragEnd] Handler: Create Event from Sidebar");
          const { itemData } = activeData; // itemData contiene { id, code, name, color, category, defaultDurationHours }
          const employeeId = overData.employeeId;
          const isPermission = itemData.category === "permission";
          const defaultDuration = itemData.defaultDurationHours ?? 1;

          let startTime = set(targetDate, {
            hours: dropTime.getHours(),
            minutes: dropTime.getMinutes(),
            seconds: 0,
            milliseconds: 0,
          });
          let endTime: Date;
          let isAllDayEvent = false;

          if (isPermission || defaultDuration >= 24) {
            startTime = set(targetDate, { hours: 0, minutes: 0 });
            endTime = set(targetDate, { hours: 23, minutes: 59, seconds: 59 });
            isAllDayEvent = true;
          } else {
            endTime = addHours(startTime, defaultDuration);
            if (!isSameDay(startTime, endTime)) {
              endTime = set(startTime, { hours: 23, minutes: 59, seconds: 59 });
            }
          }

          // El 'type' del evento debería ser el ID único del tipo de evento, ej: 'shift-s1', 'permission'
          // Obtenemos esto del ID original del itemData si está disponible, o usamos la categoría como fallback
          const eventType = itemData.id || itemData.category;

          const newEvent: Omit<Event, "id"> = {
            title: itemData.name,
            type: eventType, // Usar el ID específico como tipo
            employeeId,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            isAllDay: isAllDayEvent,
          };
          console.log("[DragEnd] Adding Event from Sidebar:", newEvent);
          addEvent(newEvent);
        }
        // --- CASE 2: Move Existing Event ---
        else if (
          isDraggableEvent(activeData) &&
          isDroppableTimelineRow(overData) &&
          initialDragTimesBeforeEnd &&
          !isResizingBeforeEnd
        ) {
          console.log("[DragEnd] Handler: Move Event");
          const eventToMove = activeData.event;
          const durationMinutes = differenceInMinutes(
            initialDragTimesBeforeEnd.end,
            initialDragTimesBeforeEnd.start
          );
          if (durationMinutes < 0) return; // Evitar duración negativa

          const targetEmployeeId = overData.employeeId;
          let newStartTime = set(targetDate, {
            hours: dropTime.getHours(),
            minutes: dropTime.getMinutes(),
            seconds: 0,
            milliseconds: 0,
          });
          if (eventToMove.isAllDay) {
            newStartTime = set(targetDate, { hours: 0, minutes: 0 });
          }
          // Si la duración es 0, ponerla a 15 mins como mínimo
          const finalDurationMinutes =
            durationMinutes > 0 ? durationMinutes : 15;
          const newEndTime = addMinutes(newStartTime, finalDurationMinutes);

          const updatedEventData: Event = {
            ...eventToMove,
            employeeId: targetEmployeeId,
            startTime: newStartTime.toISOString(),
            endTime: newEndTime.toISOString(),
          };
          console.log("[DragEnd] Updating Moved Event:", updatedEventData);
          updateEvent(updatedEventData);
        }
        // --- CASE 3: Move WorkedTimeBar ---
        else if (
          isDraggableWorkedTime(activeData) &&
          isDroppableTimelineRow(overData) &&
          initialDragTimesBeforeEnd &&
          activeDragItemBeforeEnd?.type === "workedTime" &&
          !isResizingBeforeEnd
        ) {
          console.log("[DragEnd] Handler: Move WorkedTimeBar");
          const { entrada, salida } = activeDragItemBeforeEnd as {
            entrada: Marking;
            salida: Marking | null;
          };
          if (!entrada) return;
          const durationMinutes = differenceInMinutes(
            initialDragTimesBeforeEnd.end,
            initialDragTimesBeforeEnd.start
          );
          // Permitir mover incluso si duración es 0 (caso de un solo marcaje)
          // if (durationMinutes <= 0) return;

          const targetEmployeeId = overData.employeeId;
          const newStartTime = set(targetDate, {
            hours: dropTime.getHours(),
            minutes: dropTime.getMinutes(),
            seconds: 0,
            milliseconds: 0,
          });
          // Asegurar duración mínima si es necesario, o mantener original
          const finalDurationMinutes =
            durationMinutes > 0 ? durationMinutes : 0;
          const newEndTime = addMinutes(newStartTime, finalDurationMinutes);

          const updatedEntrada: Marking = {
            ...entrada,
            employeeId: targetEmployeeId,
            time: newStartTime.toISOString(),
          };
          console.log(
            "[DragEnd] Updating Moved Entrada Marking:",
            updatedEntrada
          );
          updateMarking(updatedEntrada);

          if (salida) {
            // Solo actualizar salida si la duración original era > 0
            if (durationMinutes > 0) {
              const updatedSalida: Marking = {
                ...salida,
                employeeId: targetEmployeeId,
                time: newEndTime.toISOString(),
              };
              console.log(
                "[DragEnd] Updating Moved Salida Marking:",
                updatedSalida
              );
              updateMarking(updatedSalida);
            } else {
              // Si la duración original era 0, y había salida, ¿qué hacer?
              // Podríamos eliminarla o dejarla donde estaba. Por ahora la dejamos.
              console.log(
                "[DragEnd] Moved WorkedTimeBar with 0 duration, Salida marking not moved."
              );
            }
          }
        }
        // --- CASE 4: Resize WorkedTimeBar ---
        else if (
          isResizingBeforeEnd &&
          isDraggableResizeHandle(activeData) &&
          activeData.itemType === "workedTime" &&
          isDroppableTimelineRow(overData) &&
          initialDragTimesBeforeEnd
        ) {
          console.log("[DragEnd] Handler: Resize WorkedTimeBar");
          const { edge, markingId, relatedMarkingId } = activeData;
          const markingToUpdate = activeDragItemBeforeEnd as Marking | null;
          const relatedMarking = relatedMarkingId
            ? getMarkingById(relatedMarkingId)
            : null;

          if (!markingToUpdate || markingToUpdate.id !== markingId) {
            console.log(
              "[DragEnd] Resize WorkedTime Aborted: Marking mismatch"
            );
            return;
          }

          const handleFinalX =
            (event.activatorEvent as PointerEvent).clientX + delta.x;
          const newDropTime = calculateTimeFromTimelineOffset(
            handleFinalX,
            containerRect,
            scrollLeft,
            dropGridInfo // Usar gridInfo de overData
          );

          let newMarkingTime = set(targetDate, {
            hours: newDropTime.getHours(),
            minutes: newDropTime.getMinutes(),
            seconds: 0,
            milliseconds: 0,
          });

          if (relatedMarking) {
            const relatedTime = new Date(relatedMarking.time);
            const minSeparation = 5;

            if (
              edge === "left" &&
              newMarkingTime >= addMinutes(relatedTime, -minSeparation)
            ) {
              newMarkingTime = addMinutes(relatedTime, -minSeparation);
              console.log(
                "[DragEnd] Resize WorkedTime: Adjusted left edge due to proximity."
              );
            } else if (
              edge === "right" &&
              newMarkingTime <= addMinutes(relatedTime, minSeparation)
            ) {
              newMarkingTime = addMinutes(relatedTime, minSeparation);
              console.log(
                "[DragEnd] Resize WorkedTime: Adjusted right edge due to proximity."
              );
            }
          }

          const updatedMarking: Marking = {
            ...markingToUpdate,
            time: newMarkingTime.toISOString(),
          };
          console.log("[DragEnd] Updating Resized Marking:", updatedMarking);
          updateMarking(updatedMarking);
        }
        // --- CASE 5: Resize Event ---
        else if (
          isResizingBeforeEnd &&
          isDraggableResizeHandle(activeData) &&
          activeData.itemType === "event" &&
          isDroppableTimelineRow(overData) &&
          initialDragTimesBeforeEnd
        ) {
          console.log("[DragEnd] Handler: Resize Event");
          const { edge, event: eventToResize } = activeData;

          if (
            !eventToResize ||
            eventToResize.id !== activeDragItemBeforeEnd?.id
          ) {
            console.log("[DragEnd] Resize Event Aborted: Event mismatch");
            return;
          }

          const handleFinalX =
            (event.activatorEvent as PointerEvent).clientX + delta.x;
          const newDropTime = calculateTimeFromTimelineOffset(
            handleFinalX,
            containerRect,
            scrollLeft,
            dropGridInfo // Usar gridInfo de overData
          );

          let newTime = set(targetDate, {
            hours: newDropTime.getHours(),
            minutes: newDropTime.getMinutes(),
            seconds: 0,
            milliseconds: 0,
          });

          let newStartTime = new Date(initialDragTimesBeforeEnd.start);
          let newEndTime = new Date(initialDragTimesBeforeEnd.end);
          const minDurationMinutes = 15;

          if (edge === "left") {
            if (newTime >= addMinutes(newEndTime, -minDurationMinutes)) {
              newStartTime = addMinutes(newEndTime, -minDurationMinutes);
              console.log(
                "[DragEnd] Resize Event: Adjusted start time to maintain min duration."
              );
            } else {
              newStartTime = newTime;
            }
          } else {
            // edge === "right"
            if (newTime <= addMinutes(newStartTime, minDurationMinutes)) {
              newEndTime = addMinutes(newStartTime, minDurationMinutes);
              console.log(
                "[DragEnd] Resize Event: Adjusted end time to maintain min duration."
              );
            } else {
              newEndTime = newTime;
            }
          }

          if (newStartTime >= newEndTime) {
            if (edge === "left") {
              newStartTime = addMinutes(newEndTime, -minDurationMinutes);
            } else {
              newEndTime = addMinutes(newStartTime, minDurationMinutes);
            }
            console.warn(
              "[DragEnd] Resize Event: Start/End times crossed after adjustment, forcing min duration."
            );
          }

          const updatedEventData: Event = {
            ...eventToResize,
            startTime: newStartTime.toISOString(),
            endTime: newEndTime.toISOString(),
          };
          console.log("[DragEnd] Updating Resized Event:", updatedEventData);
          updateEvent(updatedEventData);
        } else {
          console.log("[DragEnd] No matching D&D handler for:", {
            activeDataType: activeData.type,
            overDataType: overData.type,
            isResizing: isResizingBeforeEnd,
          });
        }
      } catch (error) {
        console.error("[DragEnd] Error during processing:", error);
        showNotification(
          "Error al arrastrar",
          "Ocurrió un error al procesar la acción.",
          "error"
        );
      }
    },
    [
      // Dependencias actualizadas
      activeId,
      activeDragItem,
      initialDragTimes,
      isResizing,
      resizeEdge,
      savedContainerInfo,
      addEvent,
      updateEvent,
      getMarkingById,
      updateMarking,
      getEventById,
      currentView,
      dateRange,
      timelineContentRef,
      timelineMainScrollContainerRef,
      showNotification,
    ]
  );

  // --- RENDER DRAG OVERLAY (CORREGIDO) ---
  const renderDragOverlay = () => {
    // Usar activeId y activeDragItem del estado
    if (!activeId || !activeDragItem) return null;

    const item = activeDragItem; // El objeto que estamos arrastrando (estado)
    const hourWidth = 80;
    const rowHeight = 50;

    // --- Overlay para Eventos o Sidebar Items ---
    const isSidebar = item.dndType === "sidebarItem";
    // Condición más robusta: es un evento si tiene startTime y NO es de sidebar, O si es de sidebar
    const isEventOrSidebar = (item.startTime && !isSidebar) || isSidebar;

    if (isEventOrSidebar && !isResizing) {
      const eventData = isSidebar ? item.originalData : item;
      const startTime = isSidebar ? new Date() : new Date(item.startTime);
      const defaultDuration = eventData?.defaultDurationHours ?? 1;
      const endTime = isSidebar
        ? addHours(startTime, defaultDuration)
        : new Date(item.endTime);

      const eventForOverlay: Event = {
        id: item.id || "overlay-temp",
        title: eventData?.name || item.title,
        // Usar el tipo específico del item original si es de sidebar, sino el tipo del evento
        type: isSidebar ? item.itemSpecificId || item.type : item.type,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        employeeId: item.employeeId || "temp",
        isAllDay:
          item.isAllDay ?? (isSidebar && eventData?.category === "permission"),
      };

      const style: React.CSSProperties = {
        cursor: "grabbing",
        opacity: 0.7,
        position: "relative",
        zIndex: 1001,
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        borderRadius: "4px",
      };

      if (currentView === "timeline") {
        const durationMinutes = differenceInMinutes(
          new Date(eventForOverlay.endTime),
          new Date(eventForOverlay.startTime)
        );
        const calculatedWidth = Math.max(
          hourWidth / 4,
          (durationMinutes / 60) * hourWidth
        );
        style.width = `${calculatedWidth}px`;
        style.height = `${rowHeight * 0.35}px`; // Altura para evento

        if (!isSidebar) {
          // Es un evento existente
          return <TimelineEventItem event={eventForOverlay} style={style} />;
        } else {
          // Es un item del sidebar
          const bgColor = eventData?.color || "#cbd5e1"; // Usar color original
          // Determinar color de texto basado en el fondo para legibilidad (simple)
          // const textColor = tinycolor(bgColor).isLight() ? "black" : "white";
          const textColor = "white"; // Forzar blanco por simplicidad ahora

          return (
            <div
              style={{
                ...style,
                backgroundColor: bgColor,
                color: textColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "10px",
                padding: "0 4px",
                overflow: "hidden",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
                border: `1px solid rgba(0,0,0,0.1)`,
              }}
            >
              {eventForOverlay.title}
            </div>
          );
        }
      } else {
        return null; // Solo timeline por ahora
      }
    }
    // --- Overlay para WorkedTimeBar ---
    else if (item?.type === "workedTime" && item?.entrada && !isResizing) {
      const { entrada, salida } = item as {
        entrada: Marking;
        salida: Marking | null;
      };
      const entradaTime = new Date(entrada.time);
      const startTimeForOverlay = initialDragTimes?.start || entradaTime;
      const endTimeForOverlay =
        initialDragTimes?.end ||
        (salida ? new Date(salida.time) : addHours(entradaTime, 8));

      const duration = Math.max(
        0,
        differenceInMinutes(endTimeForOverlay, startTimeForOverlay)
      );
      const standardMins = 8 * 60;
      const regularMinutes = Math.min(duration, standardMins);
      const overtimeMinutes = Math.max(0, duration - regularMinutes);

      const overlayStyle: React.CSSProperties = {
        cursor: "grabbing",
        height: `${rowHeight * 0.25}px`,
        width: `${Math.max(2, (duration / 60) * hourWidth)}px`,
        opacity: 0.7,
        display: "flex",
        borderRadius: "4px",
        overflow: "hidden",
        position: "relative",
        zIndex: 1001,
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
      };

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
    // --- Overlay para Resize Handles ---
    else if (isResizing && item) {
      const style: React.CSSProperties = {
        cursor: "ew-resize",
        opacity: 0.7,
        position: "relative",
        zIndex: 1001,
      };

      // Si item es un Marking (viene de resize de WorkedTime)
      if (item.type === "ENTRADA" || item.type === "SALIDA") {
        const markingForOverlay = item as Marking;
        return <TimelineMarkingPin marking={markingForOverlay} style={style} />;
      }
      // Si item es un Event (viene de resize de EventItem)
      else if (item.title && item.startTime) {
        const eventForOverlay = item as Event;
        const eventColorInfo = getEventTypeColor(eventForOverlay.type);
        return (
          <div
            style={{
              ...style,
              width: "8px",
              height: "16px",
              // Extraer color base del className, o usar fallback
              backgroundColor: eventColorInfo.bg.includes("green")
                ? "#4CAF50"
                : eventColorInfo.bg.includes("blue")
                ? "#2196F3"
                : eventColorInfo.bg.includes("purple")
                ? "#9C27B0"
                : eventColorInfo.bg.includes("orange")
                ? "#FF9800"
                : eventColorInfo.bg.includes("red")
                ? "#F44336"
                : eventColorInfo.bg.includes("gray")
                ? "#607D8B"
                : eventColorInfo.bg.includes("amber")
                ? "#FFC107"
                : "#9e9e9e", // fallback slate/grey
              borderRadius: "2px",
              border: "1px solid rgba(0,0,0,0.2)",
            }}
          ></div>
        );
      }
    }

    console.log("[Overlay] No matching condition for overlay:", {
      item,
      isResizing,
    });
    return null; // Fallback
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragMove={handleDragMove}
    >
      <div
        ref={schedulerContainerRef}
        className="flex flex-col h-screen overflow-hidden"
      >
        <div className="flex flex-1 flex-col overflow-hidden">
          <FilterBar />
          <div className="flex flex-1 overflow-hidden">
            <EmployeeList />
            <SchedulerCalendar
              timelineContentRef={timelineContentRef}
              timelineMainScrollContainerRef={timelineMainScrollContainerRef}
            />
          </div>
        </div>
        <MarcajesPanel />
        {(showTurnos || showLicencias) && (
          <div className="w-full clearfix border-t bg-background">
            {showTurnos && <TurnosPanel />}
            {showLicencias && <LicenciasPanel showTurnos={showTurnos} />}
          </div>
        )}
      </div>
      {/* Modals, Context Menu, Overlay... */}
      {showAddEventModal && <AddEventModal />}
      {showEditEventModal && <EditEventModal />}
      {showAddMarkingModal && <AddMarkingModal />}
      {showEditMarkingModal && <EditMarkingModal />}
      {showManageEmployeesModal && <ManageEmployeesModal />}
      {showAddPermissionModal && <AddPermissionModal />}
      {showAddScheduleModal && <AddScheduleModal />}
      {showContextMenu && (
        <div data-contextmenu>
          <ContextMenu
            position={contextMenuPosition}
            type={contextMenuType}
            data={contextMenuData}
          />
        </div>
      )}
      {showFloatingTimePanel && <FloatingTimeApprovalPanel />}
      {/* Asegúrate que DragOverlay se renderiza correctamente */}
      <DragOverlay dropAnimation={null}>{renderDragOverlay()}</DragOverlay>
    </DndContext>
  );
}
