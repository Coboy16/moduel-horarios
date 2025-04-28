export interface Event {
  id: string
  title: string
  type: string
  employeeId: string
  startTime: string
  endTime: string
  isAllDay?: boolean
  location?: string
  description?: string
}
