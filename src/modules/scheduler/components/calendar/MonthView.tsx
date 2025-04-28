"use client"

import React from "react"
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
} from "date-fns"
import { useEmployees } from "../../hooks/useEmployees"
import { useEvents } from "../../hooks/useEvents"
import { useUI } from "../../hooks/useUI"
import MonthEventItem from "./MonthEventItem"

interface MonthViewProps {
  startDate: Date
  endDate: Date
}

export default function MonthView({ startDate, endDate }: MonthViewProps) {
  const { selectedEmployees, getEmployeeById } = useEmployees()
  const { getEventsByEmployeeAndDateRange } = useEvents()
  const { openContextMenu, openAddEventModal } = useUI()

  // Get all days in the month view (including days from prev/next months to fill the grid)
  const monthStart = startOfMonth(startDate)
  const monthEnd = endOfMonth(startDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const allDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  // Group days into weeks
  const weeks: Date[][] = []
  let week: Date[] = []

  allDays.forEach((day, i) => {
    week.push(day)
    if (week.length === 7 || i === allDays.length - 1) {
      weeks.push(week)
      week = []
    }
  })

  const handleCellContextMenu = (e: React.MouseEvent, date: Date) => {
    e.preventDefault()
    openContextMenu({ x: e.clientX, y: e.clientY }, "cell", {
      date,
      employeeId: selectedEmployees.length > 0 ? selectedEmployees[0].id : undefined,
    })
  }

  const handleCellDoubleClick = (e: React.MouseEvent, date: Date) => {
    e.preventDefault()
    openAddEventModal(date, selectedEmployees.length > 0 ? selectedEmployees[0].id : undefined)
  }

  return (
    <div className="h-full overflow-auto">
      {selectedEmployees.map((employee) => (
        <div key={employee.id} className="mb-8">
          <div className="px-4 py-2 bg-muted/30 font-medium sticky top-0 z-10">
            {employee.name} - {employee.department}
          </div>

          <div className="grid grid-cols-7 border-b border-border">
            {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day, i) => (
              <div key={i} className="h-10 flex items-center justify-center text-sm font-medium">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 border-b border-border">
            {weeks.map((week, weekIndex) => (
              <React.Fragment key={weekIndex}>
                {week.map((day, dayIndex) => {
                  const isCurrentMonth = isSameMonth(day, startDate)
                  const isTodayDate = isToday(day)
                  const dayEvents = getEventsByEmployeeAndDateRange(employee.id, day, day)

                  return (
                    <div
                      key={dayIndex}
                      className={`min-h-[100px] border-r border-b border-border p-1 ${
                        isCurrentMonth ? "" : "bg-muted/20 text-muted-foreground"
                      } ${isTodayDate ? "bg-accent/20" : ""}`}
                      onContextMenu={(e) => handleCellContextMenu(e, day)}
                      onDoubleClick={(e) => handleCellDoubleClick(e, day)}
                    >
                      <div className="text-right text-sm p-1">{format(day, "d")}</div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map((event) => (
                          <MonthEventItem key={event.id} event={event} />
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-muted-foreground text-center">+{dayEvents.length - 3} más</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
