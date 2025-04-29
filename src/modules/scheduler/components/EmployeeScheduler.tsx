/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useCallback, useRef } from "react"; // Import React and useRef
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter, // Consider 'pointerWithin' or custom collision for timeline
  type DragStartEvent,
  type DragEndEvent,
  type UniqueIdentifier,
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
  const { updateMarking, getMarkingById } = useMarkings();
  const { currentView, dateRange } = useFilters();

  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [activeDragItem, setActiveDragItem] = useState<any>(null);
  const [initialDragTimes, setInitialDragTimes] = useState<{
    start: Date;
    end: Date;
  } | null>(null);
  // --- CORRECCIÓN AQUÍ ---
  const [isResizing, setIsResizing] = useState(false); // Guardar la variable de estado
  // ---------------------
  const [showTurnos, setShowTurnos] = useState(false);
  const [showLicencias, setShowLicencias] = useState(false);

  const schedulerContainerRef = useRef<HTMLDivElement>(null);

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
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showContextMenu && !target.closest("[data-contextmenu-trigger]")) {
        closeContextMenu();
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showContextMenu, closeContextMenu]);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const activeData = getActiveData(active);
      setActiveId(active.id);
      setIsResizing(false); // Ahora setIsResizing existe

      console.log("Drag Start - ID:", active.id, "Data:", activeData);

      if (isDraggableEvent(activeData)) {
        setActiveDragItem(activeData.event);
        setInitialDragTimes({
          start: new Date(activeData.event.startTime),
          end: new Date(activeData.event.endTime),
        });
      } else if (isDraggableWorkedTime(activeData)) {
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
          setInitialDragTimes({
            start: new Date(entrada.time),
            end: salida ? new Date(salida.time) : new Date(),
          });
        } else {
          setActiveDragItem(null);
          setInitialDragTimes(null);
        }
      } else if (isDraggableResizeHandle(activeData)) {
        setIsResizing(true); // Ahora setIsResizing existe
        const marking = getMarkingById(activeData.markingId);
        setActiveDragItem(marking);
        if (marking) {
          setInitialDragTimes({
            start: new Date(marking.time),
            end: new Date(marking.time),
          });
        } else {
          setInitialDragTimes(null);
        }
      } else if (isDraggableSidebarItem(activeData)) {
        const tempEvent: Event = {
          id: "overlay-temp",
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
        setActiveDragItem(null);
        setInitialDragTimes(null);
      }
    },
    [getEventById, getMarkingById, setIsResizing]
  ); // Añadir setIsResizing a las dependencias

  const handleDragMove = useCallback(() => {
    // Sin cambios
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { over, delta } = event;
      const activeIdBeforeEnd = activeId;
      const activeDragItemBeforeEnd = activeDragItem;
      const initialDragTimesBeforeEnd = initialDragTimes;

      setActiveId(null);
      setActiveDragItem(null);
      setInitialDragTimes(null);
      setIsResizing(false); // Ahora setIsResizing existe

      if (!over || !activeIdBeforeEnd || !activeDragItemBeforeEnd) {
        console.log(
          "DragEnd: No 'over' element or missing active data after cleanup."
        );
        return;
      }

      const activeData = getActiveData({
        id: activeIdBeforeEnd,
        data: { current: activeDragItemBeforeEnd },
      } as any);
      const overData = getOverData(over);

      if (!activeData || !overData) {
        console.log("DragEnd: Missing reconstructed active or over data.", {
          activeData,
          overData,
        });
        return;
      }

      console.log(
        "DragEnd - Active:",
        activeData,
        "Over:",
        overData,
        "Delta:",
        delta
      );

      const containerRect =
        schedulerContainerRef.current?.getBoundingClientRect();
      const scrollLeft = schedulerContainerRef.current?.scrollLeft ?? 0;
      // const scrollTop = schedulerContainerRef.current?.scrollTop ?? 0;

      try {
        // --- Caso 1: Crear Evento desde Sidebar (Timeline) ---
        if (
          isDraggableSidebarItem(activeData) &&
          isDroppableTimelineRow(overData)
        ) {
          const { itemType, itemData } = activeData;
          const employeeId = overData.employeeId;
          const isPermission = itemData.category === "permission";

          const dropTime = calculateTimeFromTimelineOffset(
            (event.activatorEvent as PointerEvent).clientX,
            containerRect,
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

          if (isPermission) {
            startTime = set(startTime, { hours: 0, minutes: 0 });
            endTime = set(startTime, { hours: 23, minutes: 59 });
          } else {
            endTime = addHours(startTime, itemData.defaultDurationHours ?? 1);
          }

          const newEvent: Omit<Event, "id"> = {
            title: itemData.name,
            type: itemType,
            employeeId: employeeId,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            isAllDay: isPermission,
          };
          addEvent(newEvent);
          console.log("Timeline: Added event from sidebar", newEvent);
        }
        // --- Caso 2: Mover Evento Existente (Timeline) ---
        else if (
          isDraggableEvent(activeData) &&
          isDroppableTimelineRow(overData) &&
          initialDragTimesBeforeEnd
        ) {
          const eventToMove = activeData.event;
          const durationMinutes = differenceInMinutes(
            initialDragTimesBeforeEnd.end,
            initialDragTimesBeforeEnd.start
          );
          const targetEmployeeId = overData.employeeId;

          const dropTime = calculateTimeFromTimelineOffset(
            (event.activatorEvent as PointerEvent).clientX,
            containerRect,
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
            newStartTime = set(newStartTime, { hours: 0, minutes: 0 });
          }

          const newEndTime = addMinutes(newStartTime, durationMinutes);
          const updatedEvent: Event = {
            ...eventToMove,
            employeeId: targetEmployeeId,
            startTime: newStartTime.toISOString(),
            endTime: newEndTime.toISOString(),
          };
          updateEvent(updatedEvent);
          console.log("Timeline: Moved event", updatedEvent);
        }
        // --- Caso 3: Mover WorkedTimeBar (Timeline) ---
        else if (
          isDraggableWorkedTime(activeData) &&
          isDroppableTimelineRow(overData) &&
          initialDragTimesBeforeEnd
        ) {
          console.log("Moving WorkedTimeBar...");
          const { entrada, salida } = activeDragItemBeforeEnd as {
            entrada: Marking;
            salida: Marking | null;
          };
          if (!entrada) return;

          const durationMinutes = differenceInMinutes(
            initialDragTimesBeforeEnd.end,
            initialDragTimesBeforeEnd.start
          );
          const targetEmployeeId = overData.employeeId;

          const dropTime = calculateTimeFromTimelineOffset(
            (event.activatorEvent as PointerEvent).clientX,
            containerRect,
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
          updateMarking(updatedEntrada);
          console.log("Updating ENTRADA marking:", updatedEntrada);

          if (salida) {
            const updatedSalida: Marking = {
              ...salida,
              employeeId: targetEmployeeId,
              time: newEndTime.toISOString(),
            };
            updateMarking(updatedSalida);
            console.log("Updating SALIDA marking:", updatedSalida);
          }
        }
        // --- Caso 4: Redimensionar WorkedTimeBar (Timeline) ---
        else if (
          isDraggableResizeHandle(activeData) &&
          activeData.itemType === "workedTime" &&
          isDroppableTimelineRow(overData) &&
          initialDragTimesBeforeEnd
        ) {
          console.log("Resizing WorkedTimeBar handle...");
          const { edge, markingId, relatedMarkingId } = activeData;
          const markingToUpdate = activeDragItemBeforeEnd as Marking | null;
          const relatedMarking = relatedMarkingId
            ? getMarkingById(relatedMarkingId)
            : null;

          if (!markingToUpdate || markingToUpdate.id !== markingId) {
            console.error("Resize failed: Marking data mismatch");
            return;
          }

          const handleFinalX =
            (event.activatorEvent as PointerEvent).clientX + delta.x;
          const dropTime = calculateTimeFromTimelineOffset(
            handleFinalX,
            containerRect,
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

          // --- Validación de no cruce ---
          if (relatedMarking) {
            const relatedTime = new Date(relatedMarking.time);
            const minSeparation = 5;
            if (
              edge === "left" &&
              newMarkingTime >= addMinutes(relatedTime, -minSeparation)
            ) {
              newMarkingTime = addMinutes(relatedTime, -minSeparation);
              console.warn(
                "Resize adjusted: Start time cannot be too close to end time."
              );
            } else if (
              edge === "right" &&
              newMarkingTime <= addMinutes(relatedTime, minSeparation)
            ) {
              newMarkingTime = addMinutes(relatedTime, minSeparation);
              console.warn(
                "Resize adjusted: End time cannot be too close to start time."
              );
            }
          }
          // --- Fin Validación ---

          const updatedMarking: Marking = {
            ...markingToUpdate,
            time: newMarkingTime.toISOString(),
          };
          updateMarking(updatedMarking);
          console.log(
            `Updating ${
              edge === "left" ? "ENTRADA" : "SALIDA"
            } marking (resize):`,
            updatedMarking
          );
        }
        // ... (otros casos como resize de Event si es necesario) ...
        else {
          console.log("DragEnd: No matching D&D handler for:", {
            activeType: activeData?.type,
            overType: overData?.type,
          });
        }
      } catch (error) {
        console.error("Error during drag end processing:", error);
      }
    },
    [
      activeId,
      activeDragItem,
      initialDragTimes, // Estado capturado
      addEvent,
      updateEvent,
      getEmployeeById,
      getMarkingById,
      updateMarking,
      currentView,
      dateRange,
      setIsResizing, // Dependencias de Contexto y setState
    ]
  );

  // --- renderDragOverlay ---
  const renderDragOverlay = () => {
    if (!activeId || !activeDragItem) return null;

    const item = activeDragItem;

    // --- Evento o Sidebar Item ---
    if (
      item?.type === "shift-s1" ||
      item?.type === "permission" ||
      item?.title
    ) {
      const eventForOverlay = item as Event;
      const style: React.CSSProperties = { cursor: "grabbing", opacity: 0.7 };
      const hourWidth = 80;
      const rowHeight = 50;

      if (currentView === "timeline") {
        const durationMinutes = differenceInMinutes(
          new Date(eventForOverlay.endTime),
          new Date(eventForOverlay.startTime)
        );
        style.width = `${Math.max(
          hourWidth / 4,
          (durationMinutes / 60) * hourWidth
        )}px`;
        style.height = `${rowHeight * 0.35}px`;
        if (eventForOverlay.id !== "overlay-temp") {
          return <TimelineEventItem event={eventForOverlay} style={style} />;
        } else {
          return (
            <div
              style={{
                ...style,
                backgroundColor: "#cbd5e1",
                borderRadius: "4px",
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
      const salidaTime = salida ? new Date(salida.time) : new Date();
      const duration = Math.max(
        0,
        differenceInMinutes(salidaTime, entradaTime)
      );
      const standardMins = 8 * 60;
      const regularMinutes = Math.min(duration, standardMins);
      const overtimeMinutes = Math.max(0, duration - regularMinutes);
      const hourWidth = 80;
      const rowHeight = 50;

      const overlayStyle: React.CSSProperties = {
        cursor: "grabbing",
        height: `${rowHeight * 0.35}px`,
        width: `${Math.max(1, (duration / 60) * hourWidth)}px`,
        opacity: 0.7,
        display: "flex",
        borderRadius: "4px",
        overflow: "hidden",
      };

      return (
        <div style={overlayStyle}>
          <div
            className="h-full bg-green-400"
            style={{ width: `${(regularMinutes / 60) * hourWidth}px` }}
          ></div>
          {overtimeMinutes > 0 && (
            <div
              className="h-full bg-yellow-400"
              style={{ width: `${(overtimeMinutes / 60) * hourWidth}px` }}
            ></div>
          )}
        </div>
      );
    }

    // --- Resize Handle ---
    // Acceder a isResizing aquí SÍ es posible porque está definida en el scope del componente
    if (isResizing && item?.time) {
      // <-- Ahora isResizing está disponible
      const markingForOverlay = item as Marking;
      const style: React.CSSProperties = { cursor: "ew-resize", opacity: 0.7 };
      return <TimelineMarkingPin marking={markingForOverlay} style={style} />;
    }

    console.log("Overlay: No matching item type", item);
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
      <div ref={schedulerContainerRef} className="flex flex-col h-screen">
        {/* ... (resto del JSX sin cambios) ... */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <FilterBar />
          <div className="flex flex-1 overflow-hidden">
            {" "}
            {/* Este div necesita ser el scrollable */}
            <EmployeeList />
            <div className="flex-1 flex flex-col overflow-hidden">
              <SchedulerCalendar />
            </div>
          </div>
        </div>

        {/* Paneles inferiores */}
        <MarcajesPanel />
        {(showTurnos || showLicencias) && (
          <div className="w-full clearfix border-t">
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

      {/* Drag Overlay */}
      <DragOverlay dropAnimation={null}>{renderDragOverlay()}</DragOverlay>
    </DndContext>
  );
}
