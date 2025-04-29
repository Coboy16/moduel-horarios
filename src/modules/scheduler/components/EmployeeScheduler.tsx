/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  PointerSensorOptions, // Importar opciones
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
  type UniqueIdentifier,
  type Active, // Importar Active
  type Over, // Importar Over
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
import EventItem from "./calendar/EventItem";
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

// Definir opciones para PointerSensor si es necesario
const pointerSensorOptions: PointerSensorOptions = {
  activationConstraint: { distance: 5 },
  // onActivation: ({ event }) => {
  //     // Opcional: Puedes hacer algo cuando el sensor se activa
  //     console.log("Pointer Sensor Activated");
  // }
};

export default function EmployeeScheduler() {
  const {
    // ... (UI state y actions)
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
  const { updateMarking, getMarkingById } = useMarkings();
  const { currentView, dateRange } = useFilters();

  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [activeDragItem, setActiveDragItem] = useState<any>(null);
  const [initialDragTimes, setInitialDragTimes] = useState<{
    start: Date;
    end: Date;
  } | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [showTurnos, setShowTurnos] = useState(false);
  const [showLicencias, setShowLicencias] = useState(false);

  const schedulerContainerRef = useRef<HTMLDivElement>(null);
  const timelineContentRef = useRef<HTMLDivElement>(null); // Ref para el contenido específico

  // ... (useEffect para toggles de paneles)
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

  // Usar las opciones definidas para PointerSensor
  const sensors = useSensors(
    useSensor(PointerSensor, pointerSensorOptions),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // ... (useEffect para cerrar context menu)
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
      // Tipado explícito para data.current
      const activeData = getActiveData(active as Active); // Usar Active aquí
      console.log(
        "[DragStart] ID:",
        active.id,
        "ActiveData:",
        JSON.stringify(activeData)
      );

      setActiveId(active.id);
      setIsResizing(false);

      if (!activeData) {
        console.warn("[DragStart] No active data found!");
        return;
      }
      // ... (resto de la lógica de handleDragStart sin cambios)
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
            type: "workedTime",
            entrada: entrada,
            salida: salida,
            employeeId: entrada.employeeId,
            currentDateISO: new Date(entrada.time).toISOString().split("T")[0],
          });
          const startTime = new Date(entrada.time);
          const endTime = salida ? new Date(salida.time) : new Date();
          setInitialDragTimes({ start: startTime, end: endTime });
          console.log("[DragStart] WorkedTime Initial Times:", {
            start: startTime,
            end: endTime,
          });
        } else {
          console.warn(
            "[DragStart] WorkedTime - Entrada marking not found for ID:",
            activeData.entradaMarkingId
          );
          setActiveDragItem(null);
          setInitialDragTimes(null);
        }
      } else if (isDraggableResizeHandle(activeData)) {
        console.log("[DragStart] Type: Resize Handle");
        if (activeData.itemType === "workedTime") {
          setIsResizing(true);
          const marking = getMarkingById(activeData.markingId);
          if (marking) {
            setActiveDragItem(marking);
            setInitialDragTimes({
              start: new Date(marking.time),
              end: new Date(marking.time),
            });
            console.log("[DragStart] Resizing Marking:", marking);
          } else {
            console.warn(
              "[DragStart] Resize Handle - Marking not found:",
              activeData.markingId
            );
            setActiveDragItem(null);
            setInitialDragTimes(null);
          }
        } else {
          console.log(
            "[DragStart] Resize Handle for different item type:",
            activeData.itemType
          );
          setActiveDragItem(null);
          setInitialDragTimes(null);
        }
      } else if (isDraggableSidebarItem(activeData)) {
        console.log("[DragStart] Type: Sidebar Item");
        const tempEvent: Event = {
          id: `overlay-temp-${activeData.itemType}`,
          title: activeData.itemData.name,
          type: activeData.itemType,
          employeeId: "temp",
          startTime: new Date().toISOString(),
          endTime: addHours(
            new Date(),
            activeData.itemData.defaultDurationHours ?? 1
          ).toISOString(),
          isAllDay: activeData.itemData.category === "permission",
        };
        setActiveDragItem(tempEvent);
        setInitialDragTimes(null);
      } else {
        console.log("[DragStart] Type: Unknown or non-draggable");
        setActiveDragItem(null);
        setInitialDragTimes(null);
      }
    },
    [getMarkingById, getEventById]
  );

  const handleDragMove = useCallback((event: any /* DragMoveEvent */) => {
    // console.log("[DragMove] Delta:", event.delta);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over, delta } = event;
      const activeIdBeforeEnd = activeId;
      const activeDragItemBeforeEnd = activeDragItem;
      const initialDragTimesBeforeEnd = initialDragTimes;
      const isResizingBeforeEnd = isResizing;

      console.log("[DragEnd] Started", {
        /* ... (log existente) */
      });

      setActiveId(null);
      setActiveDragItem(null);
      setInitialDragTimes(null);
      setIsResizing(false);

      if (!over || !activeIdBeforeEnd || !activeDragItemBeforeEnd) {
        console.log("[DragEnd] Aborted - No 'over' or missing active data.");
        return;
      }

      // Tipado explícito para `active` y `over`
      const activeData = getActiveData(active as Active);
      const overData = getOverData(over as Over); // Usar Over aquí

      if (!activeData || !overData) {
        console.log(
          "[DragEnd] Aborted - Missing reconstructed active/over data.",
          { activeData, overData }
        );
        return;
      }

      console.log("[DragEnd] Processing", {
        /* ... (log existente) */
      });

      // --- ¡¡NUEVA VERIFICACIÓN DETALLADA!! ---
      const timelineContentElement = timelineContentRef.current;
      const containerRect = timelineContentElement?.getBoundingClientRect();
      const scrollLeft = timelineContentElement?.parentElement?.scrollLeft ?? 0;

      console.log("[DragEnd] Verification Check:", {
        currentView,
        isTimelineView: currentView === "timeline",
        timelineContentElementExists: !!timelineContentElement,
        containerRectExists: !!containerRect,
        containerRect: containerRect
          ? {
              top: containerRect.top,
              left: containerRect.left,
              width: containerRect.width,
              height: containerRect.height,
            }
          : null, // Loguear dimensiones si existe
      });
      // --- FIN NUEVA VERIFICACIÓN ---

      // La condición que estaba fallando:
      if (currentView !== "timeline" || !containerRect) {
        console.error(
          "[DragEnd] ABORTED HERE - Reason:",
          currentView !== "timeline"
            ? `Not in timeline view (currentView: ${currentView})`
            : "Missing containerRect for calculations"
        );
        return; // Salir si no estamos en timeline o falta el rect
      }
      // Si pasa esta verificación, currentView es 'timeline' y containerRect existe

      try {
        // --- Caso 1: Crear Evento desde Sidebar ---
        if (
          isDraggableSidebarItem(activeData) &&
          isDroppableTimelineRow(overData)
        ) {
          console.log("[DragEnd] Handler: Create Event from Sidebar");
          // ... (lógica existente sin cambios)
          const { itemType, itemData } = activeData;
          const employeeId = overData.employeeId;
          const isPermission = itemData.category === "permission";

          const dropTime = calculateTimeFromTimelineOffset(
            (event.activatorEvent as PointerEvent).clientX,
            containerRect, // Sabemos que existe
            scrollLeft,
            overData.gridInfo
          );

          const targetDate = overData.date;
          let startTime = set(targetDate, {
            hours: dropTime.getHours(),
            minutes: dropTime.getMinutes(),
            seconds: 0,
            milliseconds: 0,
          });
          let endTime: Date;

          if (isPermission || itemData.defaultDurationHours === 24) {
            startTime = set(targetDate, {
              hours: 0,
              minutes: 0,
              seconds: 0,
              milliseconds: 0,
            });
            endTime = set(targetDate, {
              hours: 23,
              minutes: 59,
              seconds: 59,
              milliseconds: 999,
            });
          } else {
            endTime = addHours(startTime, itemData.defaultDurationHours ?? 1);
          }

          const newEvent: Omit<Event, "id"> = {
            title: itemData.name,
            type: itemType,
            employeeId: employeeId,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            isAllDay: isPermission || itemData.defaultDurationHours === 24,
          };
          console.log("[DragEnd] Adding event from sidebar:", newEvent);
          addEvent(newEvent);
        }
        // --- Caso 2: Mover Evento Existente ---
        else if (
          isDraggableEvent(activeData) &&
          isDroppableTimelineRow(overData) &&
          initialDragTimesBeforeEnd
        ) {
          console.log("[DragEnd] Handler: Move Event");
          // ... (lógica existente sin cambios)
          const eventToMove = activeData.event;
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

          const targetEmployeeId = overData.employeeId;

          const dropTime = calculateTimeFromTimelineOffset(
            (event.activatorEvent as PointerEvent).clientX,
            containerRect, // Sabemos que existe
            scrollLeft,
            overData.gridInfo
          );

          const targetDate = overData.date;
          let newStartTime = set(targetDate, {
            hours: dropTime.getHours(),
            minutes: dropTime.getMinutes(),
            seconds: 0,
            milliseconds: 0,
          });

          if (eventToMove.isAllDay) {
            newStartTime = set(targetDate, { hours: 0, minutes: 0 });
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
          activeDragItemBeforeEnd?.type === "workedTime"
        ) {
          console.log("[DragEnd] Handler: Move WorkedTimeBar");
          // ... (lógica existente sin cambios)
          const { entrada, salida } = activeDragItemBeforeEnd as {
            entrada: Marking;
            salida: Marking | null;
          };
          if (!entrada) {
            console.error(
              "[DragEnd] Move WorkedTimeBar failed: Entrada marking missing."
            );
            return;
          }

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

          const targetEmployeeId = overData.employeeId;

          const dropTime = calculateTimeFromTimelineOffset(
            (event.activatorEvent as PointerEvent).clientX,
            containerRect, // Sabemos que existe
            scrollLeft,
            overData.gridInfo
          );

          const targetDate = overData.date;
          const newStartTime = set(targetDate, {
            hours: dropTime.getHours(),
            minutes: dropTime.getMinutes(),
            seconds: 0,
            milliseconds: 0,
          });
          const newEndTime = addMinutes(newStartTime, durationMinutes);

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
        // --- Caso 4: Redimensionar WorkedTimeBar ---
        else if (
          isResizingBeforeEnd &&
          isDraggableResizeHandle(activeData) &&
          activeData.itemType === "workedTime" &&
          isDroppableTimelineRow(overData) &&
          initialDragTimesBeforeEnd
        ) {
          console.log("[DragEnd] Handler: Resize WorkedTimeBar");
          // ... (lógica existente sin cambios significativos, solo aseguramos containerRect)
          const { edge, markingId, relatedMarkingId } = activeData;
          const markingToUpdate = activeDragItemBeforeEnd as Marking | null;
          const relatedMarking = relatedMarkingId
            ? getMarkingById(relatedMarkingId)
            : null;

          if (!markingToUpdate || markingToUpdate.id !== markingId) {
            console.error(
              "[DragEnd] Resize WorkedTimeBar failed: Marking data mismatch.",
              { activeMarkingId: markingId, item: markingToUpdate }
            );
            return;
          }

          const handleFinalX =
            (event.activatorEvent as PointerEvent).clientX + delta.x;

          const dropTime = calculateTimeFromTimelineOffset(
            handleFinalX,
            containerRect, // Sabemos que existe
            scrollLeft,
            overData.gridInfo
          );

          const targetDate = overData.date;
          let newMarkingTime = set(targetDate, {
            hours: dropTime.getHours(),
            minutes: dropTime.getMinutes(),
            seconds: 0,
            milliseconds: 0,
          });

          console.log("[DragEnd] Resize Details:", {
            /* ... (log existente) */
          });

          // Validación de no cruce
          if (relatedMarking) {
            const relatedTime = new Date(relatedMarking.time);
            const minSeparation = 5;
            const newTimeInRelatedDay = set(relatedTime, {
              hours: newMarkingTime.getHours(),
              minutes: newMarkingTime.getMinutes(),
            });

            if (
              edge === "left" &&
              newTimeInRelatedDay >= addMinutes(relatedTime, -minSeparation)
            ) {
              newMarkingTime = addMinutes(relatedTime, -minSeparation);
              console.warn(
                "[DragEnd] Resize adjusted (left): Adjusted to:",
                newMarkingTime.toISOString()
              );
            } else if (
              edge === "right" &&
              newTimeInRelatedDay <= addMinutes(relatedTime, minSeparation)
            ) {
              newMarkingTime = addMinutes(relatedTime, minSeparation);
              console.warn(
                "[DragEnd] Resize adjusted (right): Adjusted to:",
                newMarkingTime.toISOString()
              );
            }
          }

          const updatedMarking: Marking = {
            ...markingToUpdate,
            time: newMarkingTime.toISOString(),
          };
          console.log(
            `[DragEnd] Updating ${
              edge === "left" ? "ENTRADA" : "SALIDA"
            } marking (resize):`,
            updatedMarking
          );
          updateMarking(updatedMarking);
        }
        // --- Otros casos ---
        else {
          console.log("[DragEnd] No matching D&D handler for:", {
            /* ... (log existente) */
          });
        }
      } catch (error) {
        console.error("[DragEnd] Error during processing:", error);
      }
    },
    [
      // Mantener las dependencias correctas
      activeId,
      activeDragItem,
      initialDragTimes,
      isResizing,
      addEvent,
      updateEvent,
      getMarkingById,
      updateMarking,
      getEventById, // Añadir getEventById si se usa en otros casos
      currentView,
      dateRange,
      timelineContentRef, // El ref es una dependencia
    ]
  );

  // ... (renderDragOverlay sin cambios significativos, ya parece correcto)
  const renderDragOverlay = () => {
    if (!activeId || !activeDragItem) return null;
    const item = activeDragItem;
    // console.log("[Overlay] Rendering for:", item.type, item);

    const hourWidth = 80;
    const rowHeight = 50;

    // --- Evento o Sidebar Item ---
    if (item?.type === "event" || item?.type === "sidebarItem" || item?.title) {
      const isSidebar = item.type === "sidebarItem";
      const eventForOverlay: Event = {
        id: item.id || "overlay-temp",
        title: isSidebar ? item.itemData?.name : item.title,
        type: isSidebar ? item.itemType : item.type,
        startTime: item.startTime || new Date().toISOString(),
        endTime: item.endTime || addHours(new Date(), 1).toISOString(),
        employeeId: item.employeeId || "temp",
        isAllDay:
          item.isAllDay ??
          (isSidebar && item.itemData?.category === "permission"),
      };
      const style: React.CSSProperties = {
        cursor: "grabbing",
        opacity: 0.7,
        position: "relative",
        zIndex: 1001,
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
        style.height = `${rowHeight * 0.35}px`;

        if (item.type === "event") {
          return <TimelineEventItem event={eventForOverlay} style={style} />;
        } else {
          // Sidebar item overlay
          return (
            <div
              style={{
                ...style,
                backgroundColor: item.itemData?.color || "#cbd5e1",
                borderRadius: "4px",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "10px",
                padding: "0 4px",
                overflow: "hidden",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
              }}
            >
              {eventForOverlay.title}
            </div>
          );
        }
      } else {
        return <EventItem event={eventForOverlay} style={style} />;
      }
    }

    // --- WorkedTimeBar ---
    if (item?.type === "workedTime" && item?.entrada) {
      const { entrada, salida } = item as {
        entrada: Marking;
        salida: Marking | null;
      };
      const entradaTime = new Date(entrada.time);
      // Usar hora de fin de initialDragTimes si está disponible y es válida
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
      const standardMins = 8 * 60;
      const regularMinutes = Math.min(duration, standardMins);
      const overtimeMinutes = Math.max(0, duration - regularMinutes);

      const overlayStyle: React.CSSProperties = {
        cursor: "grabbing",
        height: `${rowHeight * 0.35}px`,
        width: `${Math.max(1, (duration / 60) * hourWidth)}px`,
        opacity: 0.7,
        display: "flex",
        borderRadius: "4px",
        overflow: "hidden",
        position: "relative",
        zIndex: 1001,
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

    // --- Resize Handle ---
    if (isResizing && item?.time && item?.type) {
      const markingForOverlay = item as Marking;
      const style: React.CSSProperties = {
        cursor: "ew-resize",
        opacity: 0.7,
        position: "relative",
        zIndex: 1001,
      };
      return <TimelineMarkingPin marking={markingForOverlay} style={style} />;
    }

    console.log("[Overlay] No matching item type for overlay:", item?.type);
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
      {/* El resto del JSX se mantiene igual */}
      <div
        ref={schedulerContainerRef}
        className="flex flex-col h-screen overflow-hidden"
      >
        <div className="flex flex-1 flex-col overflow-hidden">
          <FilterBar />
          <div className="flex flex-1 overflow-hidden">
            <EmployeeList />
            <SchedulerCalendar timelineContentRef={timelineContentRef} />{" "}
            {/* Pasar el ref */}
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
