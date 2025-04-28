import type { Marking } from "../interfaces/Marking"

// Helper function to create dates
const createDate = (year: number, month: number, day: number, hour: number, minute: number): string => {
  return new Date(year, month, day, hour, minute).toISOString()
}

// Current date for reference
const now = new Date()
const currentYear = now.getFullYear()
const currentMonth = now.getMonth()
const currentDay = now.getDate()

export const mockMarkings: Marking[] = [
  // Marcajes para Juan Pérez
  {
    id: "marking-001",
    employeeId: "emp-001",
    type: "ENTRADA",
    time: createDate(currentYear, currentMonth, currentDay, 8, 55),
    status: "A_TIEMPO",
    location: "Oficina Central",
  },
  {
    id: "marking-002",
    employeeId: "emp-001",
    type: "INICIO_DESCANSO",
    time: createDate(currentYear, currentMonth, currentDay, 12, 0),
    status: "A_TIEMPO",
    location: "Oficina Central",
  },
  {
    id: "marking-003",
    employeeId: "emp-001",
    type: "FIN_DESCANSO",
    time: createDate(currentYear, currentMonth, currentDay, 13, 0),
    status: "A_TIEMPO",
    location: "Oficina Central",
  },
  {
    id: "marking-004",
    employeeId: "emp-001",
    type: "SALIDA",
    time: createDate(currentYear, currentMonth, currentDay, 17, 5),
    status: "A_TIEMPO",
    location: "Oficina Central",
  },

  // Marcajes para María Rodríguez
  {
    id: "marking-005",
    employeeId: "emp-002",
    type: "ENTRADA",
    time: createDate(currentYear, currentMonth, currentDay, 9, 10),
    status: "TARDANZA",
    location: "Oficina Central",
  },
  {
    id: "marking-006",
    employeeId: "emp-002",
    type: "INICIO_DESCANSO",
    time: createDate(currentYear, currentMonth, currentDay, 12, 15),
    status: "TARDANZA",
    location: "Oficina Central",
  },
  {
    id: "marking-007",
    employeeId: "emp-002",
    type: "FIN_DESCANSO",
    time: createDate(currentYear, currentMonth, currentDay, 13, 20),
    status: "TARDANZA",
    location: "Oficina Central",
  },
  {
    id: "marking-008",
    employeeId: "emp-002",
    type: "SALIDA",
    time: createDate(currentYear, currentMonth, currentDay, 16, 45),
    status: "SALIDA_ANTICIPADA",
    location: "Oficina Central",
  },

  // Marcajes para Carlos Gómez
  {
    id: "marking-009",
    employeeId: "emp-003",
    type: "ENTRADA",
    time: createDate(currentYear, currentMonth, currentDay, 15, 50),
    status: "A_TIEMPO",
    location: "Remoto",
  },
  {
    id: "marking-010",
    employeeId: "emp-003",
    type: "INICIO_DESCANSO",
    time: createDate(currentYear, currentMonth, currentDay, 19, 0),
    status: "A_TIEMPO",
    location: "Remoto",
  },
  {
    id: "marking-011",
    employeeId: "emp-003",
    type: "FIN_DESCANSO",
    time: createDate(currentYear, currentMonth, currentDay, 19, 30),
    status: "A_TIEMPO",
    location: "Remoto",
  },
  {
    id: "marking-012",
    employeeId: "emp-003",
    type: "SALIDA",
    time: createDate(currentYear, currentMonth, currentDay, 23, 15),
    status: "TARDANZA",
    location: "Remoto",
  },

  // Marcajes para Ana Martínez
  {
    id: "marking-013",
    employeeId: "emp-004",
    type: "ENTRADA",
    time: createDate(currentYear, currentMonth, currentDay, 12, 0),
    status: "A_TIEMPO",
    location: "Oficina Central",
  },
  {
    id: "marking-014",
    employeeId: "emp-004",
    type: "INICIO_DESCANSO",
    time: createDate(currentYear, currentMonth, currentDay, 16, 0),
    status: "A_TIEMPO",
    location: "Oficina Central",
  },
  {
    id: "marking-015",
    employeeId: "emp-004",
    type: "FIN_DESCANSO",
    time: createDate(currentYear, currentMonth, currentDay, 16, 30),
    status: "A_TIEMPO",
    location: "Oficina Central",
  },
  {
    id: "marking-016",
    employeeId: "emp-004",
    type: "SALIDA",
    time: createDate(currentYear, currentMonth, currentDay, 20, 0),
    status: "A_TIEMPO",
    location: "Oficina Central",
  },
]
