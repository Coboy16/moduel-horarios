import type { FloatingTimeRequest } from "../interfaces/FloatingTime"

// Helper function to create dates
const createDate = (year: number, month: number, day: number, hour: number, minute: number): string => {
  return new Date(year, month, day, hour, minute).toISOString()
}

// Current date for reference
const now = new Date()
const currentYear = now.getFullYear()
const currentMonth = now.getMonth()
const currentDay = now.getDate()

export const mockFloatingTimeRequests: FloatingTimeRequest[] = [
  {
    id: "float-001",
    employeeId: "emp-001",
    employeeName: "Juan Pérez",
    department: "Ventas",
    date: createDate(currentYear, currentMonth, currentDay + 1, 9, 0),
    hours: 2,
    reason: "Cita médica",
    status: "pending",
  },
  {
    id: "float-002",
    employeeId: "emp-002",
    employeeName: "María Rodríguez",
    department: "Recursos Humanos",
    date: createDate(currentYear, currentMonth, currentDay, 14, 0),
    hours: 3,
    reason: "Asunto personal",
    status: "approved",
  },
  {
    id: "float-003",
    employeeId: "emp-003",
    employeeName: "Carlos Gómez",
    department: "TI",
    date: createDate(currentYear, currentMonth, currentDay - 1, 16, 0),
    hours: 1.5,
    reason: "Trámite bancario",
    status: "rejected",
  },
  {
    id: "float-004",
    employeeId: "emp-004",
    employeeName: "Ana Martínez",
    department: "Marketing",
    date: createDate(currentYear, currentMonth, currentDay + 2, 12, 0),
    hours: 4,
    reason: "Reunión familiar",
    status: "pending",
  },
  {
    id: "float-005",
    employeeId: "emp-005",
    employeeName: "Luis Sánchez",
    department: "Ventas",
    date: createDate(currentYear, currentMonth, currentDay + 1, 15, 0),
    hours: 2,
    reason: "Cita con cliente",
    status: "pending",
  },
]
