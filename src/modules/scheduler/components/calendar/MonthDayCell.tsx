"use client";

import { useDroppable } from "@dnd-kit/core";
import { cn } from "../../lib/utils"; // Assuming cn is exported from lib/utils or utils/formatters
import type { DroppableCellData } from "../../interfaces/DndData"; // Import DroppableCellData if gridInfo is used
import { format } from "date-fns";
import MonthEventItem from "./MonthEventItem";
import { useEvents } from "../../hooks/useEvents"; // To fetch events for the cell

interface MonthDayCellProps {
  day: Date;
  employeeId: string;
  dayIndex: number; // Needed for grid layout
  dayWidth: number;
  cellHeight: number; // Fixed height for month cell
  onContextMenu: (e: React.MouseEvent, date: Date, employeeId: string) => void;
  onDoubleClick: (e: React.MouseEvent, date: Date, employeeId: string) => void;
}

export default function MonthDayCell({
  day,
  employeeId,
  cellHeight,
  onContextMenu,
  onDoubleClick,
}: MonthDayCellProps) {
  const { getEventsByEmployeeAndDateRange } = useEvents();

  // Fetch events specific to this employee AND this day
  const dayEvents = getEventsByEmployeeAndDateRange(
    employeeId,
    day, // Start date is this day
    day // End date is also this day
  );
  // You might also want to fetch markings here if needed, using useMarkings

  // Droppable area for the cell
  const droppableId = `month-cell-${
    day.toISOString().split("T")[0]
  }-${employeeId}`;
  const { setNodeRef, isOver } = useDroppable({
    id: droppableId,
    data: {
      type: "cell",
      date: day, // The date of this specific cell
      employeeId: employeeId,
      // gridInfo might not be relevant for month view,
      // or needs a different structure (e.g., cell height, not hour height)
      gridInfo: {
        hourHeight: cellHeight, // Use cell height here
        startHour: 0, // Not hour-based
        cellTopOffset: 0, // This would need complex calculation if needed
      },
    } as DroppableCellData, // Cast for type safety
  });

  console.log(
    `MonthDayCell: Rendering cell for ${format(
      day,
      "yyyy-MM-dd"
    )} - Employee ${employeeId}. Droppable ID: ${droppableId}. Is over: ${isOver}. Events: ${
      dayEvents.length
    }`
  );

  return (
    <div
      key={day.toISOString()} // Use date string as key for inner map
      ref={setNodeRef} // Ref for droppable
      className={cn(
        "relative border-r border-b border-border p-1 last:border-r-0",
        isOver ? "bg-blue-100/50" : "" // Visual feedback for drag over
      )}
      style={{ height: `${cellHeight}px`, overflow: "hidden" }} // Fixed height, hide overflow
      onContextMenu={(e) => onContextMenu(e, day, employeeId)} // Context menu on cell
      onDoubleClick={(e) => onDoubleClick(e, day, employeeId)} // Double click on cell
    >
      <div className="text-right text-sm p-1">
        {format(day, "d")} {/* Show just the day number */}
      </div>
      <div className="space-y-1">
        {" "}
        {/* Container for events in the cell */}
        {/* Render events for this employee and day */}
        {dayEvents.slice(0, 2).map(
          (
            event // Show first few events
          ) => (
            <MonthEventItem key={event.id} event={event} />
          )
        )}
        {dayEvents.length > 2 && (
          <div className="text-xs text-muted-foreground text-center">
            +{dayEvents.length - 2} más
          </div>
        )}
        {/* Markings can also be shown here if desired */}
        {/* {markingsOnThisDay.map(marking => <span key={marking.id}>📍</span>)} */}
      </div>
    </div>
  );
}
