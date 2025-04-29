"use client";

import { useDroppable } from "@dnd-kit/core";
import { cn } from "../../lib/utils"; // Assuming cn is exported from lib/utils or utils/formatters
import type { DroppableCellData } from "../../interfaces/DndData";
import { format } from "date-fns";

interface WeekDayCellProps {
  day: Date;
  employeeId: string;
  dayWidth: number;
  totalHoursGridHeight: number; // Height of the full hour grid for one employee
  headerHeight: number; // Height of the day header
  hourRowHeight: number; // Height of a single hour row
  startHour: number; // Start hour of the view
  onContextMenu: (e: React.MouseEvent, date: Date, employeeId: string) => void;
  onDoubleClick: (e: React.MouseEvent, date: Date, employeeId: string) => void;
}

export default function WeekDayCell({
  day,
  employeeId,
  dayWidth,
  totalHoursGridHeight,
  headerHeight,
  hourRowHeight,
  startHour,
  onContextMenu,
  onDoubleClick,
}: WeekDayCellProps) {
  // Calculate the top offset for this specific employee's hour grid relative to the gridRef parent
  // This requires knowing the employee's index, which is NOT available here.
  // A better approach is to calculate the cellTopOffset in the parent (WeekView)
  // and pass it down, or rethink the gridInfo structure if dndUtils uses it differently.
  // For now, we assume dndUtils' calculateTimeFromOffset uses this offset relative to the *start* of the area containing all droppable cells.
  // In WeekView, this area starts after the main day header.

  const cellTopOffset = headerHeight; // Approximation based on WeekView structure

  // Droppable area for the cell
  const droppableId = `week-cell-${
    day.toISOString().split("T")[0]
  }-${employeeId}`;
  const { setNodeRef, isOver } = useDroppable({
    id: droppableId,
    data: {
      type: "cell",
      date: day, // The date of this specific cell
      employeeId: employeeId,
      gridInfo: {
        hourHeight: hourRowHeight,
        startHour: startHour,
        cellTopOffset: cellTopOffset, // Pass calculated offset
      },
      // You might also want to pass the employee index if calculateTimeFromOffset needed it
      // employeeIndex: findEmployeeIndex? // Not ideal to pass index directly if not necessary
    } as DroppableCellData, // Cast for type safety
  });

  console.log(
    `WeekDayCell: Rendering cell for ${format(
      day,
      "yyyy-MM-dd"
    )} - Employee ${employeeId}. Droppable ID: ${droppableId}. Is over: ${isOver}`
  );

  return (
    <div
      key={day.toISOString()} // Use date string as key for inner map
      ref={setNodeRef} // Ref for droppable
      className={cn(
        "relative border-r border-border last:border-r-0", // last:border-r-0 removes the last border
        isOver ? "bg-blue-100/50" : "" // Visual feedback for drag over
      )}
      style={{ width: `${dayWidth}px`, height: `${totalHoursGridHeight}px` }} // Dynamic width, total hours height
      onContextMenu={(e) => onContextMenu(e, day, employeeId)} // Context menu on cell
      onDoubleClick={(e) => onDoubleClick(e, day, employeeId)} // Double click on cell
    >
      {/* Events and Markings are rendered absolutely over the *entire* grid area in WeekView, NOT inside these divs */}
    </div>
  );
}
