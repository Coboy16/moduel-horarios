// src/components/views/WeekView.tsx
"use client";

import React from "react";
import { cn } from "../../lib/utils";
import { MapPin } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import {
  Employee,
  mockEmployees,
  mockMarkings,
  mockSchedules,
  mockWorkedTimes,
} from "../../tem/week_view";

// --- Constants for Layout ---
const EMPLOYEE_COL_WIDTH = 160;
const DAY_COL_WIDTH = 80;
const HEADER_HEIGHT = 40;
const HOUR_WIDTH = 80;
const ROW_HEIGHT = 65;
const TOTAL_LEFT_WIDTH = EMPLOYEE_COL_WIDTH + DAY_COL_WIDTH;

// --- Static Data for Days ---
const days = [
  { key: "lun", date: "28/04" },
  { key: "mar", date: "29/04" },
  { key: "mié", date: "30/04" },
  { key: "jue", date: "01/05" },
  { key: "vie", date: "02/05" },
  { key: "sáb", date: "03/05" },
];

// --- WeekView Props ---
interface WeekViewProps {
  employees?: Employee[];
}

// --- Dynamic WeekView Component ---
export default function WeekView({ employees }: WeekViewProps) {
  const employeesToDisplay =
    employees && employees.length > 0 ? employees : mockEmployees;

  const getRowIndex = (employeeId: string, dayKey: string): number => {
    const employeeIndex = employeesToDisplay.findIndex(
      (e) => e.id === employeeId
    );
    const dayIndex = days.findIndex((d) => d.key === dayKey);
    if (employeeIndex === -1 || dayIndex === -1) return -1;
    return employeeIndex * days.length + dayIndex;
  };

  const totalNumberOfEmployees = employeesToDisplay.length;
  const totalNumberOfRows = totalNumberOfEmployees * days.length;
  const totalTimelineContentHeight = totalNumberOfRows * ROW_HEIGHT;
  const totalTimelineHeight = totalTimelineContentHeight + HEADER_HEIGHT;
  const totalTimelineContentWidth = 24 * HOUR_WIDTH;
  const hoursToDisplay = Array.from({ length: 24 }, (_, i) => i);

  if (totalNumberOfEmployees === 0) {
    return (
      <div className="flex justify-center items-center h-60 text-muted-foreground">
        No hay datos de empleados para mostrar.
      </div>
    );
  }

  const stripeCSS = `
        .bg-stripes-pattern {
           background-image: repeating-linear-gradient(
            -45deg,
            rgba(255, 255, 255, 0.7),
            rgba(255, 255, 255, 0.7) 4px,
            transparent 4px,
            transparent 8px
          );
           background-color: transparent;
        }
        /* Optional: Style for fallback data */
        .fallback-data {
             opacity: 0.6; /* Make fallback data slightly transparent */
             /* filter: grayscale(50%); /* Alternative visual cue */
        }
    `;

  return (
    <TooltipProvider>
      <style>{stripeCSS}</style>
      {/* !! NO CHANGE NEEDED HERE FOR HORIZONTAL SCROLL - Relies on parent containers and this overflow-auto */}
      <div className="h-[calc(100vh-100px)] w-full overflow-auto border border-border rounded-md bg-card text-card-foreground relative">
        <div className="flex min-w-max">
          {/* Fixed Left Columns */}
          <div
            className="sticky left-0 z-30 shrink-0 border-r border-border shadow-sm flex flex-col bg-white"
            style={{
              width: `${TOTAL_LEFT_WIDTH}px`,
              height: `${totalTimelineHeight}px`,
            }}
          >
            {/* Header Corner */}
            <div
              className="border-b border-border flex items-center sticky top-0 z-10 bg-white"
              style={{ height: `${HEADER_HEIGHT}px` }}
            >
              <div
                className="p-2 font-medium text-sm text-center border-r border-border"
                style={{ width: `${EMPLOYEE_COL_WIDTH}px` }}
              >
                Empleado
              </div>
              <div
                className="p-2 font-medium text-sm text-center"
                style={{ width: `${DAY_COL_WIDTH}px` }}
              >
                Día
              </div>
            </div>
            {/* Employee/Day Cells Area */}
            <div className="relative flex-1">
              {employeesToDisplay.map((employee, employeeIndex) => (
                <React.Fragment key={employee.id}>
                  {/* Employee Cell Block */}
                  <Tooltip delayDuration={150}>
                    <TooltipTrigger asChild>
                      <div
                        className="absolute border-b border-r border-border flex flex-col justify-center p-2 bg-white hover:bg-gray-50 cursor-default"
                        style={{
                          top: `${employeeIndex * days.length * ROW_HEIGHT}px`,
                          left: 0,
                          height: `${days.length * ROW_HEIGHT}px`, // Span vertically
                          width: `${EMPLOYEE_COL_WIDTH}px`,
                        }}
                      >
                        <div className="font-semibold text-sm truncate">
                          {employee.name}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {employee.department ?? "Sin Dept."}
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent
                      side="right"
                      align="start"
                      className="bg-slate-800 text-white p-3 rounded-md shadow-lg text-xs border border-slate-700 w-60"
                      sideOffset={5}
                    >
                      {/* Tooltip Content */}
                      <div className="font-bold text-sm mb-2">
                        {employee.name}
                      </div>
                      <div className="space-y-1">
                        <div>
                          <span className="font-medium">Num. documento:</span>{" "}
                          {employee.documentNumber ?? "N/A"}
                        </div>
                        <div>
                          <span className="font-medium">Tipo De Persona:</span>{" "}
                          {employee.personType ?? "N/A"}
                        </div>
                        <div>
                          <span className="font-medium">Contrato:</span>{" "}
                          {employee.contractInfo ?? "N/A"}
                        </div>
                        <div>
                          <span className="font-medium">Sede:</span>{" "}
                          {employee.site ?? "N/A"}
                        </div>
                        <div>
                          <span className="font-medium">Departamento:</span>{" "}
                          {employee.department ?? "N/A"}
                        </div>
                        <div>
                          <span className="font-medium">Cargo:</span>{" "}
                          {employee.position ?? "N/A"}
                        </div>
                        <hr className="border-slate-600 my-2" />
                        <div>
                          <span className="font-medium">Trabajadas:</span>{" "}
                          {employee.workedHours ?? "N/A"}
                        </div>
                        <div>
                          <span className="font-medium">Ordinarias:</span>{" "}
                          {employee.ordinaryHours ?? "N/A"}
                        </div>
                        <div>
                          <span className="font-medium">Ausencias:</span>{" "}
                          {employee.absenceHours ?? "N/A"}
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                  {/* Day Cells */}
                  <div
                    className="absolute flex flex-col bg-white"
                    style={{
                      left: `${EMPLOYEE_COL_WIDTH}px`,
                      top: `${employeeIndex * days.length * ROW_HEIGHT}px`,
                      width: `${DAY_COL_WIDTH}px`,
                    }}
                  >
                    {days.map((day) => (
                      <div
                        key={`${employee.id}-${day.key}-day`}
                        className="border-b border-border p-2 flex items-center justify-center text-xs hover:bg-gray-50"
                        style={{ height: `${ROW_HEIGHT}px` }}
                      >
                        <span className="font-bold mr-1">{day.key}</span>
                        <span>{day.date}</span>
                      </div>
                    ))}
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
          {/* Scrollable Timeline Area */}
          <div className="flex-1 min-w-0 relative">
            {/* !! NO CHANGE NEEDED HERE FOR HORIZONTAL SCROLL */}
            <div
              className="relative"
              style={{
                width: `${totalTimelineContentWidth}px`,
                height: `${totalTimelineHeight}px`,
              }}
            >
              {/* Hour Header */}
              <div
                className="sticky top-0 z-20 flex border-b border-border bg-blue-100"
                style={{
                  height: `${HEADER_HEIGHT}px`,
                  width: `${totalTimelineContentWidth}px`,
                }}
              >
                {hoursToDisplay.map((hour) => (
                  <div
                    key={`header-${hour}`}
                    className="shrink-0 border-r border-blue-200 px-2 text-center text-xs font-medium flex items-center justify-center text-blue-800"
                    style={{ width: `${HOUR_WIDTH}px` }}
                  >
                    {`${hour.toString().padStart(2, "0")}:00`}
                  </div>
                ))}
              </div>
              {/* Timeline Grid and Content Area */}
              <div className="absolute top-0 left-0 w-full h-full">
                {/* Background Grid Lines */}
                {Array.from({ length: totalNumberOfRows }).map(
                  (_, rowIndex) => (
                    <div
                      key={`row-bg-${rowIndex}`}
                      className="absolute border-b border-gray-200"
                      style={{
                        top: `${rowIndex * ROW_HEIGHT + HEADER_HEIGHT}px`,
                        left: 0,
                        height: `${ROW_HEIGHT}px`,
                        width: `${totalTimelineContentWidth}px`,
                        zIndex: 1,
                      }}
                    >
                      <div className="absolute inset-0 pointer-events-none z-0">
                        {hoursToDisplay.map((hour) => (
                          <React.Fragment key={`hour-line-${rowIndex}-${hour}`}>
                            <div
                              className="absolute top-0 bottom-0 border-r border-gray-200"
                              style={{
                                left: `${hour * HOUR_WIDTH}px`,
                                width: "1px",
                              }}
                            />
                            {[15, 30, 45].map((minute) => (
                              <div
                                key={`minute-line-${rowIndex}-${hour}-${minute}`}
                                className="absolute top-0 bottom-0 w-px bg-gray-100"
                                style={{
                                  left: `${
                                    hour * HOUR_WIDTH +
                                    (minute / 60) * HOUR_WIDTH
                                  }px`,
                                }}
                              />
                            ))}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  )
                )}
                {/* Content Layer (Bars and Markings) */}
                <div className="absolute top-0 left-0 w-full h-full z-10">
                  {employeesToDisplay.map((employee) =>
                    days.map((day, dayIndex) => {
                      // <-- Added dayIndex here
                      const rowIndex = getRowIndex(employee.id, day.key);
                      if (rowIndex === -1) return null;

                      // --- Find ACTUAL data ---
                      const actualSchedule = mockSchedules.find(
                        (s) =>
                          s.employeeId === employee.id && s.dayKey === day.key
                      );
                      const actualWorked = mockWorkedTimes.find(
                        (w) =>
                          w.employeeId === employee.id && w.dayKey === day.key
                      );
                      const actualMarkings = mockMarkings.filter(
                        (m) =>
                          m.employeeId === employee.id && m.dayKey === day.key
                      );

                      // --- Determine data to RENDER (Actual or Fallback) ---
                      let scheduleToRender = actualSchedule;
                      let workedToRender = actualWorked;
                      let markingsToRender = actualMarkings;
                      let isFallbackData = false;

                      // --- Check if Fallback data is needed ---
                      if (
                        !actualSchedule &&
                        mockEmployees.length > 0 &&
                        days.length > 0
                      ) {
                        isFallbackData = true;
                        const fallbackEmpId = mockEmployees[0].id; // Use first mock employee as source
                        // Cycle through days using modulo (%)
                        const fallbackDayIndex = dayIndex % days.length;
                        const fallbackDayKey = days[fallbackDayIndex]?.key;

                        if (fallbackDayKey) {
                          // Ensure fallbackDayKey is valid
                          scheduleToRender = mockSchedules.find(
                            (s) =>
                              s.employeeId === fallbackEmpId &&
                              s.dayKey === fallbackDayKey
                          );
                          workedToRender = mockWorkedTimes.find(
                            (w) =>
                              w.employeeId === fallbackEmpId &&
                              w.dayKey === fallbackDayKey
                          );
                          markingsToRender = mockMarkings.filter(
                            (m) =>
                              m.employeeId === fallbackEmpId &&
                              m.dayKey === fallbackDayKey
                          );
                        } else {
                          // Handle case where fallback day cannot be determined (should not happen with modulo)
                          scheduleToRender = undefined;
                          workedToRender = undefined;
                          markingsToRender = [];
                        }
                      }

                      // --- Prepare rendering layers ---
                      const barLayer: React.ReactNode[] = [];
                      const markingLayer: React.ReactNode[] = [];
                      const topOffset = rowIndex * ROW_HEIGHT + HEADER_HEIGHT;
                      const fallbackClass = isFallbackData
                        ? "fallback-data"
                        : ""; // Class for opacity

                      // --- Render using ...ToRender variables ---

                      // --- 1. Render SCHEDULE Bar ---
                      if (scheduleToRender) {
                        const left = scheduleToRender.startTime * HOUR_WIDTH;
                        const width =
                          (scheduleToRender.endTime -
                            scheduleToRender.startTime) *
                          HOUR_WIDTH;
                        const verticalPosition = topOffset + ROW_HEIGHT * 0.5;
                        const barHeight = ROW_HEIGHT * 0.25;

                        if (width > 0.1) {
                          barLayer.push(
                            <div
                              key={`sched-${employee.id}-${day.key}`}
                              className={cn(
                                "absolute rounded-md overflow-hidden pointer-events-none",
                                "bg-green-100 border border-green-300",
                                fallbackClass // Apply fallback style if needed
                              )}
                              style={{
                                top: `${verticalPosition}px`,
                                left: `${left}px`,
                                width: `${width}px`,
                                height: `${barHeight}px`,
                                zIndex: 5,
                              }}
                            >
                              <span
                                className={cn(
                                  "absolute bottom-[-2px] left-1.5 text-[10px] font-medium pointer-events-none text-green-800"
                                )}
                              >
                                {scheduleToRender.label}
                              </span>
                            </div>
                          );
                        }

                        // --- 2. Calculate and Render ABSENCE ---
                        const absenceVerticalPosition =
                          topOffset + ROW_HEIGHT * 0.18;
                        const absenceHeight = ROW_HEIGHT * 0.25;

                        if (workedToRender) {
                          // Absence at start
                          if (
                            workedToRender.startTime >
                            scheduleToRender.startTime
                          ) {
                            const absenceEndEarly = Math.min(
                              workedToRender.startTime,
                              scheduleToRender.endTime
                            );
                            const absenceWidth =
                              (absenceEndEarly - scheduleToRender.startTime) *
                              HOUR_WIDTH;
                            if (absenceWidth > 0.1) {
                              barLayer.push(
                                <div
                                  key={`abs-start-${employee.id}-${day.key}`}
                                  className={cn(
                                    "absolute bg-red-200 rounded-sm overflow-hidden pointer-events-none",
                                    fallbackClass
                                  )}
                                  style={{
                                    top: `${absenceVerticalPosition}px`,
                                    left: `${
                                      scheduleToRender.startTime * HOUR_WIDTH
                                    }px`,
                                    width: `${absenceWidth}px`,
                                    height: `${absenceHeight}px`,
                                    zIndex: 16,
                                  }}
                                >
                                  <div className="absolute inset-0 bg-stripes-pattern opacity-70 pointer-events-none"></div>
                                </div>
                              );
                            }
                          }
                          // Absence at end
                          if (
                            workedToRender.endTime < scheduleToRender.endTime
                          ) {
                            const absenceStartLate = Math.max(
                              workedToRender.endTime,
                              scheduleToRender.startTime
                            );
                            const absenceWidth =
                              (scheduleToRender.endTime - absenceStartLate) *
                              HOUR_WIDTH;
                            if (absenceWidth > 0.1) {
                              barLayer.push(
                                <div
                                  key={`abs-end-${employee.id}-${day.key}`}
                                  className={cn(
                                    "absolute bg-red-200 rounded-sm overflow-hidden pointer-events-none",
                                    fallbackClass
                                  )}
                                  style={{
                                    top: `${absenceVerticalPosition}px`,
                                    left: `${absenceStartLate * HOUR_WIDTH}px`,
                                    width: `${absenceWidth}px`,
                                    height: `${absenceHeight}px`,
                                    zIndex: 16,
                                  }}
                                >
                                  <div className="absolute inset-0 bg-stripes-pattern opacity-70 pointer-events-none"></div>
                                </div>
                              );
                            }
                          }
                        } else {
                          // Full absence if schedule exists but no work
                          const absenceWidth =
                            (scheduleToRender.endTime -
                              scheduleToRender.startTime) *
                            HOUR_WIDTH;
                          if (absenceWidth > 0.1) {
                            barLayer.push(
                              <div
                                key={`abs-full-${employee.id}-${day.key}`}
                                className={cn(
                                  "absolute bg-red-200 rounded-sm overflow-hidden pointer-events-none",
                                  fallbackClass
                                )}
                                style={{
                                  top: `${absenceVerticalPosition}px`,
                                  left: `${
                                    scheduleToRender.startTime * HOUR_WIDTH
                                  }px`,
                                  width: `${absenceWidth}px`,
                                  height: `${absenceHeight}px`,
                                  zIndex: 16,
                                }}
                              >
                                <div className="absolute inset-0 bg-stripes-pattern opacity-70 pointer-events-none"></div>
                              </div>
                            );
                          }
                        }
                      }

                      // --- 3. Render WORKED & OVERTIME ---
                      if (workedToRender) {
                        const workedStart = workedToRender.startTime;
                        const workedEnd = workedToRender.endTime;
                        const scheduleStart =
                          scheduleToRender?.startTime ?? -Infinity;
                        const scheduleEnd =
                          scheduleToRender?.endTime ?? Infinity;

                        const regularStart = Math.max(
                          workedStart,
                          scheduleStart
                        );
                        const regularEnd = Math.min(workedEnd, scheduleEnd);
                        const regularWidth =
                          regularEnd > regularStart
                            ? (regularEnd - regularStart) * HOUR_WIDTH
                            : 0;

                        const overtimeStart = Math.max(
                          workedStart,
                          scheduleEnd
                        );
                        const overtimeEnd = workedEnd;
                        const overtimeWidth =
                          overtimeEnd > overtimeStart
                            ? (overtimeEnd - overtimeStart) * HOUR_WIDTH
                            : 0;

                        const verticalPosition = topOffset + ROW_HEIGHT * 0.18;
                        const barHeight = ROW_HEIGHT * 0.25;

                        if (regularWidth > 0.1) {
                          barLayer.push(
                            <div
                              key={`workR-${employee.id}-${day.key}`}
                              className={cn(
                                "absolute bg-green-500 rounded-sm pointer-events-none",
                                fallbackClass
                              )}
                              style={{
                                top: `${verticalPosition}px`,
                                left: `${regularStart * HOUR_WIDTH}px`,
                                width: `${regularWidth}px`,
                                height: `${barHeight}px`,
                                zIndex: 15,
                              }}
                            />
                          );
                        }
                        if (overtimeWidth > 0.1) {
                          barLayer.push(
                            <div
                              key={`workOT-${employee.id}-${day.key}`}
                              className={cn(
                                "absolute bg-yellow-400 rounded-sm pointer-events-none",
                                fallbackClass
                              )}
                              style={{
                                top: `${verticalPosition}px`,
                                left: `${overtimeStart * HOUR_WIDTH}px`,
                                width: `${overtimeWidth}px`,
                                height: `${barHeight}px`,
                                zIndex: 14,
                              }}
                            />
                          );
                        }
                      }

                      // --- 4. Render MARKINGS ---
                      markingsToRender.forEach((mark, index) => {
                        const pinLeft = mark.time * HOUR_WIDTH;
                        const IconComponent = mark.icon || MapPin;
                        const pinTop =
                          topOffset + ROW_HEIGHT - ROW_HEIGHT * 0.15;

                        markingLayer.push(
                          <div
                            key={`mark-${employee.id}-${day.key}-${index}`}
                            className={cn(
                              "absolute z-30 flex items-center justify-center",
                              fallbackClass
                            )} // Apply fallback class
                            style={{
                              top: `${pinTop}px`,
                              left: `${pinLeft}px`,
                              transform: "translate(-50%, -50%)",
                            }}
                            title={`${mark.type} @ ${mark.time.toFixed(2)}h ${
                              isFallbackData ? "(ejemplo)" : ""
                            }`} // Add note to title
                          >
                            <IconComponent
                              className={cn("w-3.5 h-3.5", mark.color)}
                            />
                          </div>
                        );
                      });

                      // Render collected layers
                      return (
                        <React.Fragment
                          key={`cell-content-${employee.id}-${day.key}`}
                        >
                          {barLayer}
                          {markingLayer}
                        </React.Fragment>
                      );
                    })
                  )}
                </div>{" "}
                {/* End Content Layer */}
              </div>{" "}
              {/* End Timeline Grid/Content Area */}
            </div>{" "}
            {/* End Inner Scrollable Content */}
          </div>{" "}
          {/* End Scrollable Timeline Area */}
        </div>{" "}
        {/* End Main Flex Container */}
      </div>{" "}
      {/* End Outermost Scroll Container */}
    </TooltipProvider>
  );
}
