"use client"

import type React from "react"

import { useState } from "react"
import { useUI } from "../../hooks/useUI"
import type { Marking } from "../../interfaces/Marking"
import { formatTime } from "../../utils/dateUtils"
import { getMarkingStatusColor } from "../../utils/markingUtils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"
import { MapPin } from "lucide-react"

interface MarkingPinProps {
  marking: Marking
  style: React.CSSProperties
}

export default function MarkingPin({ marking, style }: MarkingPinProps) {
  const { openContextMenu, openEditMarkingModal } = useUI()
  const [showTooltip, setShowTooltip] = useState(false)

  const statusColor = getMarkingStatusColor(marking.status)

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
            className="absolute cursor-pointer z-20"
            style={style}
            onContextMenu={handleContextMenu}
            onDoubleClick={handleDoubleClick}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <MapPin className={`h-5 w-5 ${statusColor.text}`} />
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
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
