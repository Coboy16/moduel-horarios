"use client"

import type React from "react"
import { createContext, useState, useCallback, useEffect } from "react"
import { v4 as uuidv4 } from "uuid"
import type { Marking } from "../interfaces/Marking"
import type { FloatingTimeRequest } from "../interfaces/FloatingTime"
import { mockMarkings } from "../tem/markings"
import { mockFloatingTimeRequests } from "../tem/floatingTimes"
import { useUI } from "../hooks/useUI"

interface MarkingContextProps {
  markings: Marking[]
  markingTypes: string[]
  markingStatuses: string[]
  floatingTimeRequests: FloatingTimeRequest[]
  addMarking: (marking: Omit<Marking, "id">) => void
  updateMarking: (marking: Marking) => void
  deleteMarking: (markingId: string) => void
  getMarkingById: (markingId: string) => Marking | undefined
  getMarkingsByEmployeeId: (employeeId: string) => Marking[]
  getMarkingsByType: (type: string) => Marking[]
  getMarkingsByStatus: (status: string) => Marking[]
  getMarkingsByDate: (date: Date) => Marking[]
  approveFloatingTime: (requestId: string) => void
  rejectFloatingTime: (requestId: string) => void
  calculateWorkedHours: (employeeId: string, date: Date) => number
}

export const MarkingContext = createContext<MarkingContextProps>({} as MarkingContextProps)

export const MarkingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [markings, setMarkings] = useState<Marking[]>([])
  const [floatingTimeRequests, setFloatingTimeRequests] = useState<FloatingTimeRequest[]>([])
  const { showNotification } = useUI()

  // Marking types and statuses
  const markingTypes = ["ENTRADA", "SALIDA", "INICIO_DESCANSO", "FIN_DESCANSO"]
  const markingStatuses = ["A_TIEMPO", "TARDANZA", "SALIDA_ANTICIPADA", "AUSENCIA", "FLOTANTE"]

  // Load mock data
  useEffect(() => {
    setMarkings(mockMarkings)
    setFloatingTimeRequests(mockFloatingTimeRequests)
  }, [])

  const addMarking = useCallback(
    (marking: Omit<Marking, "id">) => {
      const newMarking: Marking = {
        ...marking,
        id: uuidv4(),
      }

      setMarkings((prev) => [...prev, newMarking])
      showNotification("Marcaje agregado", "El marcaje ha sido agregado correctamente", "success")
    },
    [showNotification],
  )

  const updateMarking = useCallback(
    (marking: Marking) => {
      setMarkings((prev) => prev.map((m) => (m.id === marking.id ? marking : m)))
      showNotification("Marcaje actualizado", "El marcaje ha sido actualizado correctamente", "success")
    },
    [showNotification],
  )

  const deleteMarking = useCallback(
    (markingId: string) => {
      setMarkings((prev) => prev.filter((m) => m.id !== markingId))
      showNotification("Marcaje eliminado", "El marcaje ha sido eliminado correctamente", "success")
    },
    [showNotification],
  )

  const getMarkingById = useCallback(
    (markingId: string) => {
      return markings.find((m) => m.id === markingId)
    },
    [markings],
  )

  const getMarkingsByEmployeeId = useCallback(
    (employeeId: string) => {
      return markings.filter((m) => m.employeeId === employeeId)
    },
    [markings],
  )

  const getMarkingsByType = useCallback(
    (type: string) => {
      return markings.filter((m) => m.type === type)
    },
    [markings],
  )

  const getMarkingsByStatus = useCallback(
    (status: string) => {
      return markings.filter((m) => m.status === status)
    },
    [markings],
  )

  const getMarkingsByDate = useCallback(
    (date: Date) => {
      return markings.filter((marking) => {
        const markingDate = new Date(marking.time)
        return (
          markingDate.getFullYear() === date.getFullYear() &&
          markingDate.getMonth() === date.getMonth() &&
          markingDate.getDate() === date.getDate()
        )
      })
    },
    [markings],
  )

  const approveFloatingTime = useCallback(
    (requestId: string) => {
      setFloatingTimeRequests((prev) =>
        prev.map((req) => (req.id === requestId ? { ...req, status: "approved" } : req)),
      )
      showNotification("Solicitud aprobada", "La solicitud de tiempo flotante ha sido aprobada", "success")
    },
    [showNotification],
  )

  const rejectFloatingTime = useCallback(
    (requestId: string) => {
      setFloatingTimeRequests((prev) =>
        prev.map((req) => (req.id === requestId ? { ...req, status: "rejected" } : req)),
      )
      showNotification("Solicitud rechazada", "La solicitud de tiempo flotante ha sido rechazada", "success")
    },
    [showNotification],
  )

  const calculateWorkedHours = useCallback(
    (employeeId: string, date: Date) => {
      const employeeMarkings = getMarkingsByEmployeeId(employeeId).filter((marking) => {
        const markingDate = new Date(marking.time)
        return (
          markingDate.getFullYear() === date.getFullYear() &&
          markingDate.getMonth() === date.getMonth() &&
          markingDate.getDate() === date.getDate()
        )
      })

      // Sort markings by time
      employeeMarkings.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())

      let totalMinutes = 0
      let entryTime: Date | null = null

      for (const marking of employeeMarkings) {
        if (marking.type === "ENTRADA" && !entryTime) {
          entryTime = new Date(marking.time)
        } else if (marking.type === "SALIDA" && entryTime) {
          const exitTime = new Date(marking.time)
          const diffMinutes = (exitTime.getTime() - entryTime.getTime()) / (1000 * 60)
          totalMinutes += diffMinutes
          entryTime = null
        }
      }

      return totalMinutes / 60 // Convert to hours
    },
    [getMarkingsByEmployeeId],
  )

  return (
    <MarkingContext.Provider
      value={{
        markings,
        markingTypes,
        markingStatuses,
        floatingTimeRequests,
        addMarking,
        updateMarking,
        deleteMarking,
        getMarkingById,
        getMarkingsByEmployeeId,
        getMarkingsByType,
        getMarkingsByStatus,
        getMarkingsByDate,
        approveFloatingTime,
        rejectFloatingTime,
        calculateWorkedHours,
      }}
    >
      {children}
    </MarkingContext.Provider>
  )
}
