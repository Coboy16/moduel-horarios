"use client"

import type React from "react"

import { useState } from "react"
import { useUI } from "../../hooks/useUI"
import type { Event } from "../../interfaces/Event"
import { getEventTypeColor } from "../../utils/eventUtils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"

interface MonthEventItemProps {
  event: Event
}

export default function MonthEventItem({ event }: MonthEventItemProps) {
  const { openContextMenu, openEditEventModal } = useUI()
  const [showTooltip, setShowTooltip] = useState(false)

  const eventColor = getEventTypeColor(event.type)

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    openContextMenu(
      {
        x: e.clientX,
        y: e.clientY,
      },
      "event",
      event,
    )
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    openEditEventModal(event)
  }

  return (
    <TooltipProvider>
      <Tooltip open={showTooltip}>
        <TooltipTrigger asChild>
          <div
            className={`rounded px-1 py-0.5 text-xs cursor-pointer truncate ${eventColor.bg} ${eventColor.text}`}
            onContextMenu={handleContextMenu}
            onDoubleClick={handleDoubleClick}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            {event.title}
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <div className="space-y-1">
            <div className="font-medium">{event.title}</div>
            <div className="text-xs">Tipo: {event.type}</div>
            <div className="text-xs">
              Horario: {new Date(event.startTime).toLocaleTimeString()} - {new Date(event.endTime).toLocaleTimeString()}
            </div>
            {event.location && <div className="text-xs">Ubicación: {event.location}</div>}
            {event.description && <div className="text-xs">Descripción: {event.description}</div>}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
