"use client";

import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import {
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  isSameDay,
  isWithinInterval,
  isBefore,
  isAfter,
  startOfDay,
} from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../utils/formatters";

interface CalendarNewProps {
  mode?: "single" | "range";
  selected?: {
    from: Date;
    to?: Date;
  };
  onSelect?: (range: { from: Date; to?: Date } | undefined) => void;
  defaultMonth?: Date;
  numberOfMonths?: number;
  className?: string;
  showFooter?: boolean;
}

export default function CalendarNew({
  mode = "range",
  selected,
  onSelect,
  defaultMonth = new Date(),
  numberOfMonths = 2,
  className = "",
  showFooter = true,
}: CalendarNewProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(defaultMonth);
  const [rangeStart, setRangeStart] = useState<Date | null>(null);
  const [rangeEnd, setRangeEnd] = useState<Date | null>(null);
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

  useEffect(() => {
    if (selected?.from) {
      setRangeStart(selected.from);
      if (selected.to) {
        setRangeEnd(selected.to);
      } else {
        setRangeEnd(null); // Reset end if only 'from' is provided
      }
    } else {
      setRangeStart(null);
      setRangeEnd(null);
    }
  }, [selected]);

  const handlePreviousMonth = () => {
    setCurrentMonth((prev) => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => addMonths(prev, 1));
  };

  const handleDateClick = (date: Date) => {
    if (mode === "single") {
      setRangeStart(date);
      setRangeEnd(null);
      onSelect?.({ from: date });
      return;
    }

    if (!rangeStart || (rangeStart && rangeEnd)) {
      // Start new range selection
      setRangeStart(date);
      setRangeEnd(null);
      onSelect?.({ from: date });

      // Clear any hovered state
      setHoveredDate(null);
    } else {
      // Complete range selection
      if (isBefore(date, rangeStart)) {
        setRangeEnd(rangeStart);
        setRangeStart(date);
        onSelect?.({ from: date, to: rangeStart });
      } else {
        setRangeEnd(date);
        onSelect?.({ from: rangeStart, to: date });
      }

      // Clear hovered state once range is complete
      setHoveredDate(null);
    }
  };

  const handleDateHover = (date: Date) => {
    if (rangeStart && !rangeEnd) {
      setHoveredDate(date);
    } else {
      setHoveredDate(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredDate(null);
  };

  // Function to determine if a date should show the start/end day's corner radius
  const getDatePosition = (date: Date, week: Date[]) => {
    if (!rangeStart || (!rangeEnd && !hoveredDate)) return "single";

    const isStart = isSameDay(date, rangeStart);
    const isEnd = rangeEnd
      ? isSameDay(date, rangeEnd)
      : hoveredDate
      ? isSameDay(date, hoveredDate)
      : false;

    if (isStart && isEnd) return "single";
    if (isStart) {
      // Check position in week for snake pattern
      const indexInWeek = week.findIndex((d) => isSameDay(d, date));
      // If start date is at the end of a week row
      if (indexInWeek === 6) return "start-bottom";
      return "start";
    }
    if (isEnd) {
      // Check position in week for snake pattern
      const indexInWeek = week.findIndex((d) => isSameDay(d, date));
      // If end date is at the beginning of a week row
      if (indexInWeek === 0) return "end-top";
      return "end";
    }

    // For dates in the middle of a range
    const startDate = startOfDay(rangeStart);
    const endDate = startOfDay(rangeEnd || hoveredDate || rangeStart);
    const currentDay = startOfDay(date);

    // Get position in week
    const indexInWeek = week.findIndex((d) => isSameDay(d, date));

    // Check if this date is at the start or end of a week
    if (indexInWeek === 0) {
      // First column
      // Check if previous date is in range
      const prevDay = new Date(currentDay);
      prevDay.setDate(prevDay.getDate() - 1);

      // Try/catch to handle potential date calculation errors
      try {
        const isPrevInRange = isWithinInterval(prevDay, {
          start: isBefore(startDate, endDate) ? startDate : endDate,
          end: isAfter(endDate, startDate) ? endDate : startDate,
        });

        if (isPrevInRange) return "middle-start-week";
      } catch (e) {
        // If there's an error, default to middle
        console.log("Error checking previous date:", e);
      }
    }

    if (indexInWeek === 6) {
      // Last column
      // Check if next date is in range
      const nextDay = new Date(currentDay);
      nextDay.setDate(nextDay.getDate() + 1);

      // Try/catch to handle potential date calculation errors
      try {
        const isNextInRange = isWithinInterval(nextDay, {
          start: isBefore(startDate, endDate) ? startDate : endDate,
          end: isAfter(endDate, startDate) ? endDate : startDate,
        });

        if (isNextInRange) return "middle-end-week";
      } catch (e) {
        // If there's an error, default to middle
        console.log("Error checking next date:", e);
      }
    }

    return "middle";
  };

  const renderMonth = (monthOffset: number) => {
    const month = addMonths(currentMonth, monthOffset);
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const allDays = eachDayOfInterval({
      start: calendarStart,
      end: calendarEnd,
    });

    const weeks: Date[][] = [];
    let week: Date[] = [];

    allDays.forEach((day, i) => {
      week.push(day);
      if ((i + 1) % 7 === 0) {
        weeks.push(week);
        week = [];
      }
    });
    if (week.length > 0) {
      weeks.push(week);
    }

    const isDateInSelectedRange = (date: Date) => {
      if (!rangeStart) return false;
      const currentDay = startOfDay(date);

      if (rangeEnd) {
        const start = startOfDay(
          isBefore(rangeStart, rangeEnd) ? rangeStart : rangeEnd
        );
        const end = startOfDay(
          isAfter(rangeEnd, rangeStart) ? rangeEnd : rangeStart
        );
        return isWithinInterval(currentDay, { start, end });
      }

      if (hoveredDate && rangeStart && !rangeEnd) {
        const tempStart = startOfDay(
          isBefore(rangeStart, hoveredDate) ? rangeStart : hoveredDate
        );
        const tempEnd = startOfDay(
          isAfter(hoveredDate, rangeStart) ? hoveredDate : rangeStart
        );
        return isWithinInterval(currentDay, { start: tempStart, end: tempEnd });
      }

      return isSameDay(currentDay, startOfDay(rangeStart));
    };

    const isRangeStartDate = (date: Date) =>
      rangeStart && isSameDay(startOfDay(date), startOfDay(rangeStart));

    const isRangeEndDate = (date: Date) =>
      rangeEnd && isSameDay(startOfDay(date), startOfDay(rangeEnd));

    const isHoveredInRange = (date: Date) => {
      if (!rangeStart || rangeEnd || !hoveredDate) return false;
      const currentDay = startOfDay(date);
      const tempStart = startOfDay(
        isBefore(rangeStart, hoveredDate) ? rangeStart : hoveredDate
      );
      const tempEnd = startOfDay(
        isAfter(hoveredDate, rangeStart) ? hoveredDate : rangeStart
      );
      return isWithinInterval(currentDay, { start: tempStart, end: tempEnd });
    };

    return (
      <div className="month-container" onMouseLeave={handleMouseLeave}>
        <div className="p-2 text-center font-medium">
          {format(month, "MMMM yyyy", { locale: es })}
        </div>
        <div className="grid grid-cols-7 mb-1 text-center text-xs">
          {["lu", "ma", "mi", "ju", "vi", "sá", "do"].map((day, i) => (
            <div
              key={i}
              className="h-8 flex items-center justify-center font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {weeks.map((week, weekIndex) => (
            <React.Fragment key={weekIndex}>
              {week.map((day, dayIndex) => {
                const isCurrentMonth = isSameMonth(day, month);
                const isTodayDate = isToday(day);
                const isStart = isRangeStartDate(day);
                const isEnd = isRangeEndDate(day);
                const isInRange = isDateInSelectedRange(day);
                const isHovered = isHoveredInRange(day);
                const datePosition = getDatePosition(day, week);

                // Base button styling
                let dayClassNames =
                  "h-10 w-10 p-0 relative flex items-center justify-center text-sm ";

                // Add styling for non-current month dates
                if (!isCurrentMonth) {
                  dayClassNames += "text-muted-foreground opacity-50 ";
                } else {
                  dayClassNames +=
                    "hover:bg-accent hover:text-accent-foreground ";
                }

                // Specific styling for today's date - circle with blue-500 border
                if (
                  isTodayDate &&
                  !isStart &&
                  !isEnd &&
                  !isInRange &&
                  !isHovered
                ) {
                  dayClassNames += "border-2 border-blue-500 rounded-full ";
                }

                // Styling for dates in the selected range
                if (isInRange || isHovered) {
                  dayClassNames += "bg-blue-200 text-blue-800 ";

                  // Apply specific styles based on date position for snake pattern
                  if (datePosition === "start") {
                    dayClassNames += "rounded-l-md ";
                  } else if (datePosition === "start-bottom") {
                    dayClassNames += "rounded-tl-md ";
                  } else if (datePosition === "end") {
                    dayClassNames += "rounded-r-md ";
                  } else if (datePosition === "end-top") {
                    dayClassNames += "rounded-br-md ";
                  } else if (datePosition === "middle-start-week") {
                    dayClassNames += "rounded-tr-md ";
                  } else if (datePosition === "middle-end-week") {
                    dayClassNames += "rounded-bl-md ";
                  } else if (datePosition === "single") {
                    dayClassNames += "rounded-md ";
                  }
                }

                // Special styling for start/end dates
                if (isStart || isEnd) {
                  dayClassNames +=
                    "bg-blue-500 text-white hover:bg-blue-600 hover:text-white focus:bg-blue-500 focus:text-white ";

                  if (
                    datePosition === "start" ||
                    datePosition === "start-bottom"
                  ) {
                    dayClassNames +=
                      datePosition === "start"
                        ? "rounded-l-md "
                        : "rounded-tl-md ";
                  } else if (
                    datePosition === "end" ||
                    datePosition === "end-top"
                  ) {
                    dayClassNames +=
                      datePosition === "end"
                        ? "rounded-r-md "
                        : "rounded-br-md ";
                  } else if (datePosition === "single") {
                    dayClassNames += "rounded-full "; // Single day selection is a full circle
                  }
                }

                // Cell container styling for snake pattern
                let cellClassNames =
                  "p-0 relative flex items-center justify-center ";

                if ((isInRange || isHovered) && !(isStart || isEnd)) {
                  cellClassNames += "bg-blue-200 ";

                  // Snake pattern styling for cells
                  if (datePosition === "middle-start-week") {
                    cellClassNames += "rounded-tr-md ";
                  } else if (datePosition === "middle-end-week") {
                    cellClassNames += "rounded-bl-md ";
                  }
                }

                if (isStart && (rangeEnd || hoveredDate)) {
                  if (datePosition === "start") {
                    cellClassNames += "rounded-l-md bg-blue-200 ";
                  } else if (datePosition === "start-bottom") {
                    cellClassNames += "rounded-tl-md bg-blue-200 ";
                  }
                }

                if (isEnd) {
                  if (datePosition === "end") {
                    cellClassNames += "rounded-r-md bg-blue-200 ";
                  } else if (datePosition === "end-top") {
                    cellClassNames += "rounded-br-md bg-blue-200 ";
                  }
                }

                return (
                  <div key={dayIndex} className={cn(cellClassNames)}>
                    <Button
                      variant={"ghost"}
                      type="button"
                      className={cn(dayClassNames)}
                      onClick={() => handleDateClick(day)}
                      onMouseEnter={() => handleDateHover(day)}
                      disabled={!isCurrentMonth}
                    >
                      {format(day, "d")}
                    </Button>
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={cn("calendar-new", className)}>
      <div className="p-4">
        <p className="font-medium mb-1">Seleccionar rango de fechas</p>
        <p className="text-sm text-muted-foreground mb-4">
          Selecciona cualquier rango de fechas que desees visualizar
        </p>

        <div className="flex items-center justify-between mb-2 px-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePreviousMonth}
            aria-label="Mes anterior"
            className="h-7 w-7"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNextMonth}
            aria-label="Mes siguiente"
            className="h-7 w-7"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {Array.from({ length: numberOfMonths }, (_, i) => (
            <div key={i} className="flex-1 min-w-[280px]">
              {renderMonth(i)}
            </div>
          ))}
        </div>
      </div>

      {showFooter && (
        <div className="mt-4 p-4 flex items-center justify-end border-t gap-2">
          <Button
            variant="ghost"
            onClick={() => {
              // Limpiar el estado interno
              setRangeStart(null);
              setRangeEnd(null);
              setHoveredDate(null);

              // Notificar al componente padre
              onSelect?.(undefined);

              // Reset el mes actual para mostrar el mes que contiene la fecha actual
              setCurrentMonth(new Date());
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => {
              if (rangeStart) {
                // Ensure end date is set if only start exists (for single mode or incomplete range)
                const finalEnd = mode === "single" ? rangeStart : rangeEnd;
                if (finalEnd) {
                  // Order dates correctly before calling onSelect
                  const orderedStart = isBefore(rangeStart, finalEnd)
                    ? rangeStart
                    : finalEnd;
                  const orderedEnd = isAfter(finalEnd, rangeStart)
                    ? finalEnd
                    : rangeStart;
                  onSelect?.({ from: orderedStart, to: orderedEnd });
                } else {
                  // Only start selected in range mode, treat as single day select for apply?
                  onSelect?.({ from: rangeStart, to: rangeStart });
                }
              }
            }}
            disabled={!rangeStart}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            Aplicar
          </Button>
        </div>
      )}
    </div>
  );
}
