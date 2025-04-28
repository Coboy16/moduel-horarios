import type { Marking } from "../interfaces/Marking"
import { Clock, LogIn, LogOut, Coffee, Utensils } from "lucide-react"

// Get color for marking status
export function getMarkingStatusColor(status: string): { bg: string; text: string } {
  switch (status) {
    case "A_TIEMPO":
      return {
        bg: "bg-green-100",
        text: "text-green-800",
      }
    case "TARDANZA":
      return {
        bg: "bg-amber-100",
        text: "text-amber-800",
      }
    case "SALIDA_ANTICIPADA":
      return {
        bg: "bg-blue-100",
        text: "text-blue-800",
      }
    case "AUSENCIA":
      return {
        bg: "bg-red-100",
        text: "text-red-800",
      }
    case "FLOTANTE":
      return {
        bg: "bg-purple-100",
        text: "text-purple-800",
      }
    default:
      return {
        bg: "bg-slate-100",
        text: "text-slate-800",
      }
  }
}

// Get icon for marking type
export function getMarkingTypeIcon(type: string): any {
  switch (type) {
    case "ENTRADA":
      return LogIn
    case "SALIDA":
      return LogOut
    case "INICIO_DESCANSO":
      return Coffee
    case "FIN_DESCANSO":
      return Utensils
    default:
      return Clock
  }
}

// Calculate worked hours from markings
export function calculateWorkedHours(markings: Marking[]): number {
  // Sort markings by time
  const sortedMarkings = [...markings].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())

  let totalMinutes = 0
  let entryTime: Date | null = null
  let breakStartTime: Date | null = null

  for (const marking of sortedMarkings) {
    const markingTime = new Date(marking.time)

    switch (marking.type) {
      case "ENTRADA":
        entryTime = markingTime
        break
      case "SALIDA":
        if (entryTime) {
          const diffMinutes = (markingTime.getTime() - entryTime.getTime()) / (1000 * 60)
          totalMinutes += diffMinutes
          entryTime = null
        }
        break
      case "INICIO_DESCANSO":
        breakStartTime = markingTime
        break
      case "FIN_DESCANSO":
        if (breakStartTime) {
          const breakMinutes = (markingTime.getTime() - breakStartTime.getTime()) / (1000 * 60)
          totalMinutes -= breakMinutes
          breakStartTime = null
        }
        break
    }
  }

  return totalMinutes / 60 // Convert to hours
}

// Group markings by day
export function groupMarkingsByDay(markings: Marking[]): Record<string, Marking[]> {
  const grouped: Record<string, Marking[]> = {}

  markings.forEach((marking) => {
    const date = new Date(marking.time).toISOString().split("T")[0]
    if (!grouped[date]) {
      grouped[date] = []
    }
    grouped[date].push(marking)
  })

  return grouped
}
