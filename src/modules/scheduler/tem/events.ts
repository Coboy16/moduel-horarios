import type { Event } from "../interfaces/Event"

// Helper function to create dates
const createDate = (year: number, month: number, day: number, hour: number, minute: number): string => {
  return new Date(year, month, day, hour, minute).toISOString()
}

// Current date for reference
const now = new Date()
const currentYear = now.getFullYear()
const currentMonth = now.getMonth()
const currentDay = now.getDate()

export const mockEvents: Event[] = [
  // Turnos para Juan Pérez
  {
    id: "event-001",
    title: "Turno S1",
    type: "shift-s1",
    employeeId: "emp-001",
    startTime: createDate(currentYear, currentMonth, currentDay, 9, 0),
    endTime: createDate(currentYear, currentMonth, currentDay, 17, 0),
    location: "Oficina Central",
  },
  {
    id: "event-002",
    title: "Turno S1",
    type: "shift-s1",
    employeeId: "emp-001",
    startTime: createDate(currentYear, currentMonth, currentDay + 1, 9, 0),
    endTime: createDate(currentYear, currentMonth, currentDay + 1, 17, 0),
    location: "Oficina Central",
  },
  {
    id: "event-003",
    title: "Turno S2",
    type: "shift-s2",
    employeeId: "emp-001",
    startTime: createDate(currentYear, currentMonth, currentDay + 2, 12, 0),
    endTime: createDate(currentYear, currentMonth, currentDay + 2, 20, 0),
    location: "Oficina Central",
  },

  // Turnos para María Rodríguez
  {
    id: "event-004",
    title: "Turno S1",
    type: "shift-s1",
    employeeId: "emp-002",
    startTime: createDate(currentYear, currentMonth, currentDay, 9, 0),
    endTime: createDate(currentYear, currentMonth, currentDay, 17, 0),
    location: "Oficina Central",
  },
  {
    id: "event-005",
    title: "Día Libre",
    type: "permission",
    employeeId: "emp-002",
    startTime: createDate(currentYear, currentMonth, currentDay + 1, 0, 0),
    endTime: createDate(currentYear, currentMonth, currentDay + 1, 23, 59),
    isAllDay: true,
  },
  {
    id: "event-006",
    title: "Turno S1",
    type: "shift-s1",
    employeeId: "emp-002",
    startTime: createDate(currentYear, currentMonth, currentDay + 2, 9, 0),
    endTime: createDate(currentYear, currentMonth, currentDay + 2, 17, 0),
    location: "Oficina Central",
  },

  // Turnos para Carlos Gómez
  {
    id: "event-007",
    title: "Turno S3",
    type: "shift-s3",
    employeeId: "emp-003",
    startTime: createDate(currentYear, currentMonth, currentDay, 16, 0),
    endTime: createDate(currentYear, currentMonth, currentDay, 23, 0),
    location: "Remoto",
  },
  {
    id: "event-008",
    title: "Turno S3",
    type: "shift-s3",
    employeeId: "emp-003",
    startTime: createDate(currentYear, currentMonth, currentDay + 1, 16, 0),
    endTime: createDate(currentYear, currentMonth, currentDay + 1, 23, 0),
    location: "Remoto",
  },
  {
    id: "event-009",
    title: "Licencia por Enfermedad",
    type: "permission",
    employeeId: "emp-003",
    startTime: createDate(currentYear, currentMonth, currentDay + 2, 0, 0),
    endTime: createDate(currentYear, currentMonth, currentDay + 3, 23, 59),
    isAllDay: true,
    description: "Reposo médico por gripe",
  },

  // Turnos para Ana Martínez
  {
    id: "event-010",
    title: "Turno S2",
    type: "shift-s2",
    employeeId: "emp-004",
    startTime: createDate(currentYear, currentMonth, currentDay, 12, 0),
    endTime: createDate(currentYear, currentMonth, currentDay, 20, 0),
    location: "Oficina Central",
  },
  {
    id: "event-011",
    title: "Turno S2",
    type: "shift-s2",
    employeeId: "emp-004",
    startTime: createDate(currentYear, currentMonth, currentDay + 1, 12, 0),
    endTime: createDate(currentYear, currentMonth, currentDay + 1, 20, 0),
    location: "Oficina Central",
  },
  {
    id: "event-012",
    title: "Reunión de Marketing",
    type: "meeting",
    employeeId: "emp-004",
    startTime: createDate(currentYear, currentMonth, currentDay + 2, 14, 0),
    endTime: createDate(currentYear, currentMonth, currentDay + 2, 16, 0),
    location: "Sala de Conferencias",
    description: "Planificación de campaña Q3",
  },
]
