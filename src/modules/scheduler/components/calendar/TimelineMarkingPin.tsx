"use client"

import type React from "react"

import { useState } from "react"
import { useUI } from "../../hooks/useUI"
import type { Marking } from "../../interfaces/Marking"
import { formatTime } from "../../utils/dateUtils"
import { getMarkingStatusColor, getMarkingTypeIcon } from "../../utils/markingUtils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"

interface TimelineMarkingPinProps {
  marking: Marking
  style: React.CSSProperties
}

export default function TimelineMarkingPin({ marking, style }: TimelineMarkingPinProps) {
  const { openContextMenu, openEditMarkingModal } = useUI()
  const [showTooltip, setShowTooltip] = useState(false)

  const statusColor = getMarkingStatusColor(marking.status)
  const MarkingIcon = getMarkingTypeIcon(marking.type)

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    openContextMenu(
      {
        x: e.clientX,
        y: e.clientY,
      },
      "marking",
      marking,
    )
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    openEditMarkingModal(marking)
  }

  return (
    <TooltipProvider>
      <Tooltip open={showTooltip}>
        <TooltipTrigger asChild>
          <div
            className={`absolute cursor-pointer z-20 w-6 h-6 rounded-full flex items-center justify-center ${
              statusColor.bg
            }`}
            style={style}
            onContextMenu={handleContextMenu}
            onDoubleClick={handleDoubleClick}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <MarkingIcon className={`h-4 w-4 ${statusColor.text}`} />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <div className="font-medium">Marcaje: {marking.type}</div>
            <div className="text-xs">
              Hora: {formatTime(new Date(marking.time).getHours(), new Date(marking.time).getMinutes())}
            </div>
            <div className="text-xs">Estado: {marking.status}</div>
            {marking.location && <div className="text-xs">Ubicación: {marking.location}</div>}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
