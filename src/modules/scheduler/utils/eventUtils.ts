import type { Event } from "../interfaces/Event"

// Get color for event type
export function getEventTypeColor(type: string): { bg: string; text: string; border: string } {
  switch (type) {
    case "shift-s1":
      return {
        bg: "bg-green-100",
        text: "text-green-800",
        border: "border-green-200",
      }
    case "shift-s2":
      return {
        bg: "bg-blue-100",
        text: "text-blue-800",
        border: "border-blue-200",
      }
    case "shift-s3":
      return {
        bg: "bg-purple-100",
        text: "text-purple-800",
        border: "border-purple-200",
      }
    case "shift-s4":
      return {
        bg: "bg-orange-100",
        text: "text-orange-800",
        border: "border-orange-200",
      }
    case "permission":
      return {
        bg: "bg-red-100",
        text: "text-red-800",
        border: "border-red-200",
      }
    case "meeting":
      return {
        bg: "bg-gray-100",
        text: "text-gray-800",
        border: "border-gray-200",
      }
    case "training":
      return {
        bg: "bg-amber-100",
        text: "text-amber-800",
        border: "border-amber-200",
      }
    default:
      return {
        bg: "bg-slate-100",
        text: "text-slate-800",
        border: "border-slate-200",
      }
  }
}

// Check if events overlap
export function doEventsOverlap(event1: Event, event2: Event): boolean {
  const start1 = new Date(event1.startTime).getTime()
  const end1 = new Date(event1.endTime).getTime()
  const start2 = new Date(event2.startTime).getTime()
  const end2 = new Date(event2.endTime).getTime()

  return start1 < end2 && end1 > start2
}

// Calculate event duration in hours
export function calculateEventDuration(event: Event): number {
  const start = new Date(event.startTime).getTime()
  const end = new Date(event.endTime).getTime()
  return (end - start) / (1000 * 60 * 60) // Convert milliseconds to hours
}

// Group events by day
export function groupEventsByDay(events: Event[]): Record<string, Event[]> {
  const grouped: Record<string, Event[]> = {}

  events.forEach((event) => {
    const date = new Date(event.startTime).toISOString().split("T")[0]
    if (!grouped[date]) {
      grouped[date] = []
    }
    grouped[date].push(event)
  })

  return grouped
}
