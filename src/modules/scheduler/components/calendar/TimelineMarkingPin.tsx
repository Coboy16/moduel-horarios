"use client";

import type React from "react";
import { useState } from "react";
import { useUI } from "../../hooks/useUI";
import type { Marking } from "../../interfaces/Marking";
import { formatTime } from "../../utils/dateUtils";
import { getMarkingStatusColor } from "../../utils/markingUtils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Fingerprint, ScanLine, UserCircle, MapPin } from "lucide-react";

interface TimelineMarkingPinProps {
  marking: Marking;
  style: React.CSSProperties; // Recibe la posición calculada
}

const getMethodIcon = (method: Marking["method"]) => {
  switch (method) {
    case "HUELLA":
      return Fingerprint;
    case "PIN":
      return UserCircle; // Placeholder for PIN
    case "ROSTRO":
      return ScanLine; // Placeholder for Face Scan
    default:
      return MapPin; // Default if no method
  }
};

export default function TimelineMarkingPin({
  marking,
  style,
}: TimelineMarkingPinProps) {
  const { openContextMenu, openEditMarkingModal } = useUI();
  const [showTooltip, setShowTooltip] = useState(false);

  const statusColor = getMarkingStatusColor(marking.status);
  const MarkingIcon = getMethodIcon(marking.method);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openContextMenu({ x: e.clientX, y: e.clientY }, "marking", marking);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openEditMarkingModal(marking);
  };

  return (
    <TooltipProvider>
      <Tooltip open={showTooltip} delayDuration={150}>
        <TooltipTrigger asChild>
          <div
            className={`absolute cursor-pointer z-20 w-6 h-6 rounded-full flex items-center justify-center border border-background shadow-sm ${statusColor.bg} ${statusColor.text}`}
            style={style} // Aplica la posición calculada por TimelineView
            onContextMenu={handleContextMenu}
            onDoubleClick={handleDoubleClick}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <MarkingIcon className="h-4 w-4" />
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          align="center"
          className="max-w-xs z-[9999]"
          sideOffset={5}
          // Añadir avoidCollisions y portales
          avoidCollisions={false}
          // Asegurar que se use portal
          forceMount={showTooltip}
        >
          <div className="space-y-1">
            <div className="font-medium">Marcaje: {marking.type}</div>
            <div className="text-xs">
              Hora:{" "}
              {formatTime(
                new Date(marking.time).getHours(),
                new Date(marking.time).getMinutes()
              )}
            </div>
            <div className="text-xs">Estado: {marking.status}</div>
            {marking.location && (
              <div className="text-xs">Ubicación: {marking.location}</div>
            )}
            {marking.method && (
              <div className="text-xs">Método: {marking.method}</div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
