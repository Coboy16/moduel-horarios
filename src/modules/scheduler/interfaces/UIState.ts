import type { Event } from "./Event"
import type { Marking } from "./Marking"

export type ContextMenuType = "cell" | "event" | "marking" | "employee" | "calendar" | "timeline"

export interface ContextMenuPosition {
  x: number
  y: number
}

export interface UIState {
  showAddEventModal: boolean
  showEditEventModal: boolean
  showAddMarkingModal: boolean
  showEditMarkingModal: boolean
  showManageEmployeesModal: boolean
  showAddPermissionModal: boolean
  showAddScheduleModal: boolean
  showContextMenu: boolean
  showFloatingTimePanel: boolean
  contextMenuPosition: ContextMenuPosition
  contextMenuType: ContextMenuType
  contextMenuData: any
  addEventData: { date?: Date; employeeId?: string } | null
  editEventData: Event | null
  addMarkingData: { date?: Date; employeeId?: string } | null
  editMarkingData: Marking | null
  addPermissionData: { date?: Date; employeeId?: string } | null
  addScheduleData: { date?: Date; employeeId?: string } | null
}
