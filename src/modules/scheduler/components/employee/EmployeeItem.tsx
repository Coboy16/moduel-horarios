"use client"

import type React from "react"

import { useState } from "react"
import { useEmployees } from "../../hooks/useEmployees"
import { useUI } from "../../hooks/useUI"
import { Checkbox } from "../ui/checkbox"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"
import { User, Building2, Briefcase, MapPin } from "lucide-react"

interface EmployeeItemProps {
  employee: {
    id: string
    name: string
    department: string
    position: string
    location?: string
    email?: string
    phone?: string
  }
}

export default function EmployeeItem({ employee }: EmployeeItemProps) {
  const { selectedEmployees, selectEmployee, deselectEmployee } = useEmployees()
  const { openContextMenu } = useUI()
  const [showTooltip, setShowTooltip] = useState(false)

  const isSelected = selectedEmployees.some((e) => e.id === employee.id)

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    openContextMenu(
      {
        x: e.clientX,
        y: e.clientY,
      },
      "employee",
      employee,
    )
  }

  return (
    <TooltipProvider>
      <Tooltip open={showTooltip}>
        <TooltipTrigger asChild>
          <div
            className={`p-3 flex items-center hover:bg-accent transition-colors ${isSelected ? "bg-accent/50" : ""}`}
            onContextMenu={handleContextMenu}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => {
                if (checked) {
                  selectEmployee(employee)
                } else {
                  deselectEmployee(employee.id)
                }
              }}
              className="mr-3"
            />

            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{employee.name}</div>
              <div className="text-xs text-muted-foreground truncate">
                {employee.department} • {employee.position}
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <div className="space-y-2">
            <div className="font-medium">{employee.name}</div>
            <div className="text-xs flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              <span>{employee.department}</span>
            </div>
            <div className="text-xs flex items-center gap-1">
              <Briefcase className="h-3 w-3" />
              <span>{employee.position}</span>
            </div>
            {employee.location && (
              <div className="text-xs flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>{employee.location}</span>
              </div>
            )}
            {employee.email && (
              <div className="text-xs flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>{employee.email}</span>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
