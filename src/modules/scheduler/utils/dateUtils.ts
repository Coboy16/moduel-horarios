import { format, isWithinInterval, isSameDay, addDays } from "date-fns"
import { es } from "date-fns/locale"
import type { CalendarView, DateRange } from "../interfaces/Filter"

// Format time (e.g., "09:00")
export function formatTime(hours: number, minutes: number): string {
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
}

// Format time range (e.g., "09:00 - 17:00")
export function formatTimeRange(start: Date, end: Date): string {
  return `${formatTime(start.getHours(), start.getMinutes())} - ${formatTime(end.getHours(), end.getMinutes())}`
}

// Format date (e.g., "Lunes, 1 de enero de 2023")
export function formatDate(date: Date, type: "short" | "medium" | "full" = "medium"): string {
  switch (type) {
    case "short":
      return format(date, "dd/MM/yyyy", { locale: es })
    case "medium":
      return format(date, "d 'de' MMMM", { locale: es })
    case "full":
      return format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })
    default:
      return format(date, "d 'de' MMMM", { locale: es })
  }
}

// Format date range based on view (e.g., "1 - 7 de enero de 2023")
export function formatDateRange(start: Date, end: Date, view: CalendarView): string {
  switch (view) {
    case "day":
      return formatDate(start, "full")
    case "week":
      if (start.getMonth() === end.getMonth()) {
        return `${format(start, "d", { locale: es })} - ${format(end, "d 'de' MMMM 'de' yyyy", { locale: es })}`
      } else if (start.getFullYear() === end.getFullYear()) {
        return `${format(start, "d 'de' MMMM", { locale: es })} - ${format(end, "d 'de' MMMM 'de' yyyy", {
          locale: es,
        })}`
      } else {
        return `${format(start, "d 'de' MMMM 'de' yyyy", { locale: es })} - ${format(end, "d 'de' MMMM 'de' yyyy", {
          locale: es,
        })}`
      }
    case "month":
      return format(start, "MMMM 'de' yyyy", { locale: es })
    case "timeline":
      return formatDate(start, "full")
    default:
      return ""
  }
}

// Format date for input fields (e.g., "2023-01-01")
export function formatDateForInput(date: Date): string {
  return format(date, "yyyy-MM-dd")
}

// Format time for input fields (e.g., "09:00")
export function formatTimeForInput(date: Date): string {
  return format(date, "HH:mm")
}

// Check if a date is within a range
export function isDateInRange(date: Date, range: DateRange): boolean {
  return isWithinInterval(date, { start: range.start, end: range.end })
}

// Check if two dates are the same day
export { isSameDay }

// Add days to a date
export { addDays }
