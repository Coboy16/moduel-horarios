export interface FloatingTimeRequest {
  id: string
  employeeId: string
  employeeName: string
  department: string
  date: string
  hours: number
  reason?: string
  status: "pending" | "approved" | "rejected"
}
