"use client";

import type React from "react";
import { useRef } from "react";
import { useUI } from "../../hooks/useUI";
import { format, addDays, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import type { Employee } from "../../interfaces/Employee";
import type { Event } from "../../interfaces/Event";
import type { Marking } from "../../interfaces/Marking";
import { formatTime } from "../../utils/dateUtils";
import EventItem from "./EventItem";
import MarkingPin from "./MarkingPin";

interface WeekViewProps {
  startDate: Date;
  endDate: Date;
  events: Event[];
  markings: Marking[];
  employees: Employee[];
  width: number;
  height: number;
}

export default function WeekView({
  startDate,
  endDate,
  events,
  markings,
  employees,
  width,
  height,
}: WeekViewProps) {
  const { openContextMenu } = useUI();
  const gridRef = useRef<HTMLDivElement>(null);

  // Hours to display
  const startHour = 6;
  const endHour = 22;
  const hours = Array.from(
    { length: endHour - startHour + 1 },
    (_, i) => i + startHour
  );

  // Days of the week
  const days = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));

  // Handle grid background context menu
  const handleGridContextMenu = (
    e: React.MouseEvent,
    date: Date,
    employeeId: string
  ) => {
    e.preventDefault();

    // Calculate time from click position
    const rect = gridRef.current?.getBoundingClientRect();
    if (!rect) return;

    const offsetY = e.clientY - rect.top;
    const hourHeight = (height - 50) / (endHour - startHour + 1); // 50px for header
    const hour = Math.floor(offsetY / hourHeight) + startHour;
    const minute = Math.floor((offsetY % hourHeight) / (hourHeight / 60));

    if (hour < 0 || hour >= 24) return;

    const clickTime = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      hour,
      minute
    );

    openContextMenu(
      {
        x: e.clientX,
        y: e.clientY,
      },
      "cell",
      {
        date: clickTime,
        employeeId,
      }
    );
  };

  // Position events in the grid
  const getEventPosition = (event: Event) => {
    const startTime = new Date(event.startTime);
    const endTime = new Date(event.endTime);

    // Find which day of the week this event belongs to
    const dayIndex = days.findIndex((day) => isSameDay(day, startTime));
    if (dayIndex === -1) return null;

    // If event spans multiple days, cap it to the current day
    if (!isSameDay(startTime, endTime)) {
      endTime.setHours(23, 59, 59, 999);
    }

    const startHourDecimal = startTime.getHours() + startTime.getMinutes() / 60;
    const endHourDecimal = endTime.getHours() + endTime.getMinutes() / 60;

    const employeeIndex = employees.findIndex(
      (emp) => emp.id === event.employeeId
    );
    if (employeeIndex === -1) return null;

    const dayWidth = (width - 100) / days.length; // 100px for time column
    const employeeHeight = (height - 50) / employees.length; // 50px for header

    return {
      left: `${dayIndex * dayWidth + 100}px`,
      width: `${dayWidth - 10}px`,
      top: `${
        employeeIndex * employeeHeight +
        (startHourDecimal - startHour) * 60 +
        50
      }px`,
      height: `${(endHourDecimal - startHourDecimal) * 60}px`,
    };
  };

  // Position markings in the grid
  const getMarkingPosition = (marking: Marking) => {
    const markingTime = new Date(marking.time);

    // Find which day of the week this marking belongs to
    const dayIndex = days.findIndex((day) => isSameDay(day, markingTime));
    if (dayIndex === -1) return null;

    const hourDecimal = markingTime.getHours() + markingTime.getMinutes() / 60;

    const employeeIndex = employees.findIndex(
      (emp) => emp.id === marking.employeeId
    );
    if (employeeIndex === -1) return null;

    const dayWidth = (width - 100) / days.length; // 100px for time column
    const employeeHeight = (height - 50) / employees.length; // 50px for header

    return {
      left: `${dayIndex * dayWidth + 100 + dayWidth / 2}px`,
      top: `${
        employeeIndex * employeeHeight + (hourDecimal - startHour) * 60 + 50
      }px`,
    };
  };

  return (
    <div className="h-full overflow-auto">
      <div className="relative" ref={gridRef}>
        {/* Time column */}
        <div className="absolute top-0 left-0 w-[100px] z-10">
          <div className="h-[50px] border-b border-r border-border bg-white"></div>
          {hours.map((hour) => (
            <div
              key={hour}
              className="h-[60px] border-b border-r border-border p-2 text-sm text-right"
            >
              {formatTime(hour, 0)}
            </div>
          ))}
        </div>

        {/* Day columns */}
        <div className="ml-[100px]">
          {/* Header row with day names */}
          <div className="flex h-[50px] border-b border-border">
            {days.map((day, index) => (
              <div
                key={index}
                className="flex-1 border-r border-border p-2 font-medium truncate"
                style={{ minWidth: `${(width - 100) / days.length}px` }}
              >
                {format(day, "EEE d", { locale: es })}
              </div>
            ))}
          </div>

          {/* Grid cells */}
          <div className="flex">
            {days.map((day, dayIndex) => (
              <div
                key={dayIndex}
                className="flex-1 relative"
                style={{ minWidth: `${(width - 100) / days.length}px` }}
              >
                {employees.map((employee, employeeIndex) => (
                  <div
                    key={employee.id}
                    className="relative"
                    style={{ height: `${(height - 50) / employees.length}px` }}
                  >
                    {hours.map((hour) => (
                      <div
                        key={hour}
                        className="h-[60px] border-b border-r border-border"
                        onContextMenu={(e) =>
                          handleGridContextMenu(e, day, employee.id)
                        }
                      >
                        {/* 15-minute markers */}
                        {[15, 30, 45].map((minute) => (
                          <div
                            key={minute}
                            className="absolute w-full border-b border-dashed border-border/30"
                            style={{
                              top: `${(hour - startHour) * 60 + minute}px`,
                            }}
                          />
                        ))}
                      </div>
                    ))}

                    {/* Working hours background */}
                    <div
                      className="absolute left-0 right-0 bg-green-50"
                      style={{
                        top: `${(9 - startHour) * 60}px`,
                        height: `${8 * 60}px`,
                      }}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Events */}
        {events.map((event) => {
          const position = getEventPosition(event);
          if (!position) return null;

          return <EventItem key={event.id} event={event} style={position} />;
        })}

        {/* Markings */}
        {markings.map((marking) => {
          const position = getMarkingPosition(marking);
          if (!position) return null;

          return (
            <MarkingPin key={marking.id} marking={marking} style={position} />
          );
        })}
      </div>
    </div>
  );
}
