/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import type React from "react";
import { createContext, useState, useCallback } from "react";
import type {
  UIState,
  ContextMenuPosition,
  ContextMenuType,
} from "../interfaces/UIState";
import type { Event } from "../interfaces/Event";
import type { Marking } from "../interfaces/Marking";
import { useToast } from "../hooks/use-toast";

interface UIContextProps {
  state: UIState;
  openAddEventModal: (date?: Date, employeeId?: string) => void;
  closeAddEventModal: () => void;
  openEditEventModal: (event: Event) => void;
  closeEditEventModal: () => void;
  openAddMarkingModal: (date?: Date, employeeId?: string) => void;
  closeAddMarkingModal: () => void;
  openEditMarkingModal: (marking: Marking) => void;
  closeEditMarkingModal: () => void;
  openManageEmployeesModal: () => void;
  closeManageEmployeesModal: () => void;
  openAddPermissionModal: (date?: Date, employeeId?: string) => void;
  closeAddPermissionModal: () => void;
  openAddScheduleModal: (date?: Date, employeeId?: string) => void;
  closeAddScheduleModal: () => void;
  openContextMenu: (
    position: ContextMenuPosition,
    type: ContextMenuType,
    data: any
  ) => void;
  closeContextMenu: () => void;
  openFloatingTimePanel: () => void;
  closeFloatingTimePanel: () => void;
  closeAllModals: () => void;
  showNotification: (
    title: string,
    description: string,
    type?: "default" | "success" | "error"
  ) => void;

  // Getters for modal data
  addEventData: { date?: Date; employeeId?: string } | null;
  editEventData: Event | null;
  addMarkingData: { date?: Date; employeeId?: string } | null;
  editMarkingData: Marking | null;
  addPermissionData: { date?: Date; employeeId?: string } | null;
  addScheduleData: { date?: Date; employeeId?: string } | null;

  // Getters for UI state
  showAddEventModal: boolean;
  showEditEventModal: boolean;
  showAddMarkingModal: boolean;
  showEditMarkingModal: boolean;
  showManageEmployeesModal: boolean;
  showAddPermissionModal: boolean;
  showAddScheduleModal: boolean;
  showContextMenu: boolean;
  showFloatingTimePanel: boolean;
  contextMenuPosition: ContextMenuPosition;
  contextMenuType: ContextMenuType;
  contextMenuData: any;
}

export const UIContext = createContext<UIContextProps>({} as UIContextProps);

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<UIState>({
    showAddEventModal: false,
    showEditEventModal: false,
    showAddMarkingModal: false,
    showEditMarkingModal: false,
    showManageEmployeesModal: false,
    showAddPermissionModal: false,
    showAddScheduleModal: false,
    showContextMenu: false,
    showFloatingTimePanel: false,
    contextMenuPosition: { x: 0, y: 0 },
    contextMenuType: "cell",
    contextMenuData: null,
    addEventData: null,
    editEventData: null,
    addMarkingData: null,
    editMarkingData: null,
    addPermissionData: null,
    addScheduleData: null,
  });

  const { toast } = useToast();

  const openAddEventModal = useCallback((date?: Date, employeeId?: string) => {
    setState((prev) => ({
      ...prev,
      showAddEventModal: true,
      addEventData: { date, employeeId },
    }));
  }, []);

  const closeAddEventModal = useCallback(() => {
    setState((prev) => ({
      ...prev,
      showAddEventModal: false,
      addEventData: null,
    }));
  }, []);

  const openEditEventModal = useCallback((event: Event) => {
    setState((prev) => ({
      ...prev,
      showEditEventModal: true,
      editEventData: event,
    }));
  }, []);

  const closeEditEventModal = useCallback(() => {
    setState((prev) => ({
      ...prev,
      showEditEventModal: false,
      editEventData: null,
    }));
  }, []);

  const openAddMarkingModal = useCallback(
    (date?: Date, employeeId?: string) => {
      setState((prev) => ({
        ...prev,
        showAddMarkingModal: true,
        addMarkingData: { date, employeeId },
      }));
    },
    []
  );

  const closeAddMarkingModal = useCallback(() => {
    setState((prev) => ({
      ...prev,
      showAddMarkingModal: false,
      addMarkingData: null,
    }));
  }, []);

  const openEditMarkingModal = useCallback((marking: Marking) => {
    setState((prev) => ({
      ...prev,
      showEditMarkingModal: true,
      editMarkingData: marking,
    }));
  }, []);

  const closeEditMarkingModal = useCallback(() => {
    setState((prev) => ({
      ...prev,
      showEditMarkingModal: false,
      editMarkingData: null,
    }));
  }, []);

  const openManageEmployeesModal = useCallback(() => {
    setState((prev) => ({
      ...prev,
      showManageEmployeesModal: true,
    }));
  }, []);

  const closeManageEmployeesModal = useCallback(() => {
    setState((prev) => ({
      ...prev,
      showManageEmployeesModal: false,
    }));
  }, []);

  const openAddPermissionModal = useCallback(
    (date?: Date, employeeId?: string) => {
      setState((prev) => ({
        ...prev,
        showAddPermissionModal: true,
        addPermissionData: { date, employeeId },
      }));
    },
    []
  );

  const closeAddPermissionModal = useCallback(() => {
    setState((prev) => ({
      ...prev,
      showAddPermissionModal: false,
      addPermissionData: null,
    }));
  }, []);

  const openAddScheduleModal = useCallback(
    (date?: Date, employeeId?: string) => {
      setState((prev) => ({
        ...prev,
        showAddScheduleModal: true,
        addScheduleData: { date, employeeId },
      }));
    },
    []
  );

  const closeAddScheduleModal = useCallback(() => {
    setState((prev) => ({
      ...prev,
      showAddScheduleModal: false,
      addScheduleData: null,
    }));
  }, []);

  const openContextMenu = useCallback(
    (position: ContextMenuPosition, type: ContextMenuType, data: any) => {
      setState((prev) => ({
        ...prev,
        showContextMenu: true,
        contextMenuPosition: position,
        contextMenuType: type,
        contextMenuData: data,
      }));
    },
    []
  );

  const closeContextMenu = useCallback(() => {
    setState((prev) => ({
      ...prev,
      showContextMenu: false,
    }));
  }, []);

  const openFloatingTimePanel = useCallback(() => {
    setState((prev) => ({
      ...prev,
      showFloatingTimePanel: true,
    }));
  }, []);

  const closeFloatingTimePanel = useCallback(() => {
    setState((prev) => ({
      ...prev,
      showFloatingTimePanel: false,
    }));
  }, []);

  const closeAllModals = useCallback(() => {
    setState((prev) => ({
      ...prev,
      showAddEventModal: false,
      showEditEventModal: false,
      showAddMarkingModal: false,
      showEditMarkingModal: false,
      showManageEmployeesModal: false,
      showAddPermissionModal: false,
      showAddScheduleModal: false,
      showContextMenu: false,
      addEventData: null,
      editEventData: null,
      addMarkingData: null,
      editMarkingData: null,
      addPermissionData: null,
      addScheduleData: null,
    }));
  }, []);

  const showNotification = useCallback(
    (
      title: string,
      description: string,
      type: "default" | "success" | "error" = "default"
    ) => {
      toast({
        title,
        description,
        variant: type === "error" ? "destructive" : "default",
      });
    },
    [toast]
  );

  return (
    <UIContext.Provider
      value={{
        state,
        openAddEventModal,
        closeAddEventModal,
        openEditEventModal,
        closeEditEventModal,
        openAddMarkingModal,
        closeAddMarkingModal,
        openEditMarkingModal,
        closeEditMarkingModal,
        openManageEmployeesModal,
        closeManageEmployeesModal,
        openAddPermissionModal,
        closeAddPermissionModal,
        openAddScheduleModal,
        closeAddScheduleModal,
        openContextMenu,
        closeContextMenu,
        openFloatingTimePanel,
        closeFloatingTimePanel,
        closeAllModals,
        showNotification,

        // Getters for modal data
        addEventData: state.addEventData,
        editEventData: state.editEventData,
        addMarkingData: state.addMarkingData,
        editMarkingData: state.editMarkingData,
        addPermissionData: state.addPermissionData,
        addScheduleData: state.addScheduleData,

        // Getters for UI state
        showAddEventModal: state.showAddEventModal,
        showEditEventModal: state.showEditEventModal,
        showAddMarkingModal: state.showAddMarkingModal,
        showEditMarkingModal: state.showEditMarkingModal,
        showManageEmployeesModal: state.showManageEmployeesModal,
        showAddPermissionModal: state.showAddPermissionModal,
        showAddScheduleModal: state.showAddScheduleModal,
        showContextMenu: state.showContextMenu,
        showFloatingTimePanel: state.showFloatingTimePanel,
        contextMenuPosition: state.contextMenuPosition,
        contextMenuType: state.contextMenuType,
        contextMenuData: state.contextMenuData,
      }}
    >
      {children}
    </UIContext.Provider>
  );
};
