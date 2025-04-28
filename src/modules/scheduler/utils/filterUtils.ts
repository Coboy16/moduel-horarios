import type { Event } from "../interfaces/Event"
import type { Marking } from "../interfaces/Marking"

// Filter events by type
export function filterEventsByType(events: Event[], types: string[]): Event[] {
  if (types.length === 0) return events
  return events.filter((event) => types.includes(event.type))
}

// Filter events by employee
export function filterEventsByEmployee(events: Event[], employeeIds: string[]): Event[] {
  if (employeeIds.length === 0) return events
  return events.filter((event) => employeeIds.includes(event.employeeId))
}

// Filter markings by type
export function filterMarkingsByType(markings: Marking[], types: string[]): Marking[] {
  if (types.length === 0) return markings
  return markings.filter((marking) => types.includes(marking.type))
}

// Filter markings by status
export function filterMarkingsByStatus(markings: Marking[], statuses: string[]): Marking[] {
  if (statuses.length === 0) return markings
  return markings.filter((marking) => statuses.includes(marking.status))
}

// Filter markings by employee
export function filterMarkingsByEmployee(markings: Marking[], employeeIds: string[]): Marking[] {
  if (employeeIds.length === 0) return markings
  return markings.filter((marking) => employeeIds.includes(marking.employeeId))
}
