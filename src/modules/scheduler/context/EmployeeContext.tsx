"use client"

import type React from "react"
import { createContext, useState, useCallback, useEffect } from "react"
import type { Employee } from "../interfaces/Employee"
import { mockEmployees } from "../tem/employees"

interface EmployeeContextProps {
  employees: Employee[]
  selectedEmployees: Employee[]
  departments: string[]
  positions: string[]
  selectEmployee: (employee: Employee) => void
  deselectEmployee: (employeeId: string) => void
  selectAllEmployees: (employees?: Employee[]) => void
  deselectAllEmployees: () => void
  getEmployeeById: (employeeId: string) => Employee | undefined
  getEmployeesByDepartment: (department: string) => Employee[]
  getEmployeesByPosition: (position: string) => Employee[]
}

export const EmployeeContext = createContext<EmployeeContextProps>({} as EmployeeContextProps)

export const EmployeeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([])
  const [departments, setDepartments] = useState<string[]>([])
  const [positions, setPositions] = useState<string[]>([])

  // Load mock data
  useEffect(() => {
    setEmployees(mockEmployees)

    // Extract unique departments and positions
    const depts = Array.from(new Set(mockEmployees.map((emp) => emp.department)))
    const pos = Array.from(new Set(mockEmployees.map((emp) => emp.position)))

    setDepartments(depts)
    setPositions(pos)

    // Select first employee by default
    if (mockEmployees.length > 0) {
      setSelectedEmployees([mockEmployees[0]])
    }
  }, [])

  const selectEmployee = useCallback((employee: Employee) => {
    setSelectedEmployees((prev) => {
      if (prev.some((emp) => emp.id === employee.id)) {
        return prev
      }
      return [...prev, employee]
    })
  }, [])

  const deselectEmployee = useCallback((employeeId: string) => {
    setSelectedEmployees((prev) => prev.filter((emp) => emp.id !== employeeId))
  }, [])

  const selectAllEmployees = useCallback(
    (employeesToSelect?: Employee[]) => {
      if (employeesToSelect) {
        setSelectedEmployees(employeesToSelect)
      } else {
        setSelectedEmployees(employees)
      }
    },
    [employees],
  )

  const deselectAllEmployees = useCallback(() => {
    setSelectedEmployees([])
  }, [])

  const getEmployeeById = useCallback(
    (employeeId: string) => {
      return employees.find((emp) => emp.id === employeeId)
    },
    [employees],
  )

  const getEmployeesByDepartment = useCallback(
    (department: string) => {
      return employees.filter((emp) => emp.department === department)
    },
    [employees],
  )

  const getEmployeesByPosition = useCallback(
    (position: string) => {
      return employees.filter((emp) => emp.position === position)
    },
    [employees],
  )

  return (
    <EmployeeContext.Provider
      value={{
        employees,
        selectedEmployees,
        departments,
        positions,
        selectEmployee,
        deselectEmployee,
        selectAllEmployees,
        deselectAllEmployees,
        getEmployeeById,
        getEmployeesByDepartment,
        getEmployeesByPosition,
      }}
    >
      {children}
    </EmployeeContext.Provider>
  )
}
