/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/views/WeekView.tsx
"use client";

import React, { useState, useCallback, useRef } from "react";
import { cn } from "../../lib/utils";
import {
  MapPin,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info as InfoIcon,
  X,
} from "lucide-react";
import { format } from "date-fns"; // format ya estaba
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import {
  Employee,
  mockEmployees,
  mockMarkings,
  mockSchedules,
  mockWorkedTimes,
} from "../../tem/week_view";

import { CustomContextMenu } from "./menus/CustomContextMenu";
import { WorkedBarContextMenuContent } from "./menus/WorkedBarContextMenu";
import { GridCellContextMenuContent } from "./menus/GridCellContextMenu";
import { EmployeeContextMenuContent } from "./menus/EmployeeContextMenu";

import { Modal } from "./forms/Modal";
import { AddMarkingForm } from "./forms/AddMarkingForm";
import { AddLeaveForm } from "./forms/AddLeaveForm";
import { AddShiftForm } from "./forms/AddShiftForm";
import { Button } from "../ui/button";
import { Marking } from "../../interfaces/Marking";
import { EmployeeMarkingsTable } from "./forms/EmployeeMarkingsTable";

// --- (NUEVO) Importar los modales necesarios ---
import { WorkDetailModal } from "./forms/WorkDetailModal"; // Asegúrate que la ruta sea correcta
import { ConfirmDeleteModal } from "./forms/ConfirmDeleteModal"; // Asegúrate que la ruta sea correcta

// Constantes (sin cambios)
const EMPLOYEE_COL_WIDTH = 160;
const DAY_COL_WIDTH = 80;
const HEADER_HEIGHT = 40;
const HOUR_WIDTH = 80;
const ROW_HEIGHT = 65;
const TOTAL_LEFT_WIDTH = EMPLOYEE_COL_WIDTH + DAY_COL_WIDTH;

// Datos días (sin cambios)
const days = [
  { key: "lun", date: "28/04" },
  { key: "mar", date: "29/04" },
  { key: "mié", date: "30/04" },
  { key: "jue", date: "01/05" },
  { key: "vie", date: "02/05" },
  { key: "sáb", date: "03/05" },
];
const currentYear = new Date().getFullYear();

// Interfaces Props y Estado (sin cambios estructurales)
interface WeekViewProps {
  employees?: Employee[];
}

interface MenuState {
  isOpen: boolean;
  position: { x: number; y: number };
  type: "worked" | "grid" | "employee" | null;
  data: any;
}

interface ModalFormData {
  employeeId: string;
  dayKey: string;
  initialDate: string;
  initialTime: string;
}

interface ToastState {
  id: number;
  isVisible: boolean;
  message: string;
  type: "success" | "info" | "warning" | "error";
}

// --- (NUEVO) Interfaces para estados de Modales/Toasts de Barra ---
interface DetailModalData {
  id: string;
  type: string;
  employeeName: string;
  employeeDept?: string;
  date: string; // Formateada (ej: 'lun 28/04/2024')
  startTime: string; // Formateada (ej: '09:00')
  endTime: string; // Formateada (ej: '18:00')
  duration?: string;
  label?: string;
  status?: string;
  details?: string;
}

interface DeleteConfirmData {
  id: string; // ID del item a borrar (scheduleId o workedId)
  type: string; // 'schedule', 'worked', 'regular', 'overtime'
  itemName: string; // Descripción para el mensaje del modal
}
// --- Fin Nuevas Interfaces ---

export default function WeekView({ employees }: WeekViewProps) {
  const employeesToDisplay =
    employees && employees.length > 0 ? employees : mockEmployees;

  // Estados existentes (sin cambios)
  const [menuState, setMenuState] = useState<MenuState>({
    isOpen: false,
    position: { x: 0, y: 0 },
    type: null,
    data: null,
  });
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formModalType, setFormModalType] = useState<
    "marking" | "leave" | "shift" | null
  >(null);
  const [formModalData, setFormModalData] = useState<ModalFormData | null>(
    null
  );
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isMarkingsModalOpen, setIsMarkingsModalOpen] = useState(false);
  const [markingsModalData, setMarkingsModalData] = useState<{
    employee: Employee | null;
    markings: Marking[];
  }>({ employee: null, markings: [] });
  const [isPasteConfirmOpen, setIsPasteConfirmOpen] = useState(false);
  const [pasteEmployeeId, setPasteEmployeeId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const toastIdRef = useRef(0);

  // --- (NUEVO) Estados para Modales de Barra ---
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailModalData, setDetailModalData] =
    useState<DetailModalData | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteConfirmData, setDeleteConfirmData] =
    useState<DeleteConfirmData | null>(null);
  // --- Fin Nuevos Estados ---

  // Funciones auxiliares existentes (sin cambios)
  const getRowIndex = useCallback(
    (employeeId: string, dayKey: string): number => {
      const employeeIndex = employeesToDisplay.findIndex(
        (e) => e.id === employeeId
      );
      const dayIndex = days.findIndex((d) => d.key === dayKey);
      if (employeeIndex === -1 || dayIndex === -1) return -1;
      return employeeIndex * days.length + dayIndex;
    },
    [employeesToDisplay]
  );

  const calculateTimeFromOffset = useCallback(
    (offsetX: number, timelineWidth: number): number => {
      if (timelineWidth <= 0 || isNaN(offsetX) || offsetX < 0) return 0;
      const clampedOffsetX = Math.max(0, Math.min(offsetX, timelineWidth));
      const hours = (clampedOffsetX / timelineWidth) * 24;
      const calculatedHours = Math.round(hours * 4) / 4;
      return isNaN(calculatedHours)
        ? 0
        : Math.max(0, Math.min(24, calculatedHours));
    },
    []
  );

  const formatTime = useCallback((decimalTime: number): string => {
    if (
      decimalTime == null ||
      isNaN(decimalTime) ||
      decimalTime < 0 ||
      decimalTime > 24
    ) {
      const now = new Date();
      return `${now.getHours().toString().padStart(2, "0")}:${now
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;
    }
    const totalMinutes = Math.round(decimalTime * 60);
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
  }, []);

  // Dimensiones calculadas (sin cambios)
  const totalNumberOfEmployees = employeesToDisplay.length;
  const totalNumberOfRows = totalNumberOfEmployees * days.length;
  const totalTimelineContentHeight = totalNumberOfRows * ROW_HEIGHT;
  const totalTimelineHeight = totalTimelineContentHeight + HEADER_HEIGHT;
  const totalTimelineContentWidth = 24 * HOUR_WIDTH;
  const hoursToDisplay = Array.from({ length: 24 }, (_, i) => i);

  // Funciones Toast (ya existentes y correctas)
  const showToast = useCallback(
    (
      message: string,
      type: ToastState["type"] = "success",
      duration = 3000
    ) => {
      toastIdRef.current += 1;
      const newToast: ToastState = {
        id: toastIdRef.current,
        isVisible: true,
        message,
        type,
      };
      setToasts((prev) => [...prev.filter((t) => t.isVisible), newToast]);
      setTimeout(() => {
        setToasts((prev) =>
          prev.map((t) =>
            t.id === newToast.id ? { ...t, isVisible: false } : t
          )
        );
        setTimeout(
          () => setToasts((prev) => prev.filter((t) => t.isVisible)),
          500
        );
      }, duration);
    },
    []
  );

  const closeToast = (id: number) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isVisible: false } : t))
    );
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.isVisible)), 500);
  };

  // (MODIFICADO) closeAllModals ahora cierra también los nuevos modales
  const closeAllModals = useCallback(() => {
    // Modales existentes
    setIsFormModalOpen(false);
    setFormModalType(null);
    setFormModalData(null);
    setIsSuccessModalOpen(false);
    setSuccessMessage("");
    setIsMarkingsModalOpen(false);
    setMarkingsModalData({ employee: null, markings: [] });
    setIsPasteConfirmOpen(false);
    setPasteEmployeeId(null);
    // (NUEVO) Cerrar modales de barra
    setIsDetailModalOpen(false);
    setDetailModalData(null);
    setIsDeleteConfirmOpen(false);
    setDeleteConfirmData(null);
  }, []); // Dependencias vacías porque solo usa setters

  const closeContextMenu = useCallback(() => {
    setMenuState((prev) => ({
      ...prev,
      isOpen: false,
      type: null,
      data: null,
    }));
  }, []);

  // (MODIFICADO) handleContextMenu para asegurar datos en 'worked'
  const handleContextMenu = useCallback(
    (
      event: React.MouseEvent<HTMLDivElement>,
      type: "worked" | "grid" | "employee",
      data: any
    ) => {
      event.preventDefault();
      event.stopPropagation();
      closeAllModals(); // Cierra todos los modales primero
      closeContextMenu(); // Cierra el menú anterior

      let processedData = { ...data }; // Copia inicial

      if (type === "grid") {
        // Lógica existente para grid (sin cambios aquí, ya estaba completa)
        const currentTarget = event.currentTarget as Element;
        const container = currentTarget.closest(".overflow-auto");
        const containerRect = container?.getBoundingClientRect();
        const containerScrollLeft = container ? container.scrollLeft : 0;
        const clientX = event.clientX;
        const gridContainerViewportStart =
          (containerRect?.left ?? 0) + TOTAL_LEFT_WIDTH;
        const gridOffsetX =
          clientX - gridContainerViewportStart + containerScrollLeft;
        const clickedTimeDecimal = calculateTimeFromOffset(
          gridOffsetX,
          totalTimelineContentWidth
        );
        const formattedTime = formatTime(clickedTimeDecimal);
        const dayInfo = days.find((d) => d.key === data.dayKey);
        const dateStr = dayInfo
          ? `${dayInfo.date}/${currentYear}`
          : `??/??/${currentYear}`;
        let initialDateObj = new Date();
        if (dayInfo) {
          const [dayOfMonth, month] = dayInfo.date.split("/");
          initialDateObj = new Date(
            currentYear,
            parseInt(month) - 1,
            parseInt(dayOfMonth)
          );
        }
        const formattedDateForInput = format(initialDateObj, "yyyy-MM-dd");

        processedData = {
          ...data,
          clickedTime: clickedTimeDecimal,
          formattedDateTime: `${dateStr} - ${formattedTime}`,
          initialDate: formattedDateForInput,
          initialTime: formattedTime,
        };
      } else if (type === "worked") {
        // ¡CRÍTICO! Asegura que 'data' contenga id, employeeId, dayKey
        processedData.id = data.scheduleId || data.workedId;

        // Verificar si faltan datos esenciales pasados por el evento onContextMenu de la barra
        if (!processedData.id || !data.employeeId || !data.dayKey) {
          console.warn(
            "WeekView: Datos incompletos para menú 'worked'. Faltan id, employeeId o dayKey.",
            data
          );
          // Es crucial que el onContextMenu de las barras en el JSX pase estos datos.
        }
      }
      // Para 'employee', no se necesita procesamiento adicional aquí

      setMenuState({
        isOpen: true,
        position: { x: event.clientX, y: event.clientY },
        type: type,
        data: processedData, // Usar los datos procesados/verificados
      });
    },
    [
      // Mantener dependencias originales
      closeAllModals,
      closeContextMenu,
      calculateTimeFromOffset,
      formatTime,
      totalTimelineContentWidth,
    ]
  );

  // Funciones para abrir modales de formulario (sin cambios)
  const openFormModal = (
    type: "marking" | "leave" | "shift",
    data: ModalFormData
  ) => {
    closeAllModals();
    closeContextMenu();
    setFormModalData(data);
    setFormModalType(type);
    setIsFormModalOpen(true);
  };
  const handleFormSuccess = (message: string) => {
    closeAllModals();
    setSuccessMessage(message);
    setIsSuccessModalOpen(true);
  };

  // Handlers para acciones de menú GRID (sin cambios)
  const handleAddMarking = () => {
    if (menuState.type === "grid" && menuState.data) {
      const { employeeId, dayKey, initialDate, initialTime } = menuState.data;
      openFormModal("marking", {
        employeeId,
        dayKey,
        initialDate,
        initialTime,
      });
    }
  };
  const handleAddLeave = () => {
    if (menuState.type === "grid" && menuState.data) {
      const { employeeId, dayKey, initialDate, initialTime } = menuState.data;
      openFormModal("leave", { employeeId, dayKey, initialDate, initialTime });
    }
  };
  const handleAddShift = () => {
    if (menuState.type === "grid" && menuState.data) {
      const { employeeId, dayKey, initialDate } = menuState.data;
      openFormModal("shift", {
        employeeId,
        dayKey,
        initialDate,
        initialTime: "00:00",
      });
    }
  };

  // Handlers para acciones de menú EMPLOYEE (sin cambios)
  const handleViewEmpMarkings = (empId: string) => {
    closeContextMenu();
    closeAllModals();
    const employee = employeesToDisplay.find((e) => e.id === empId);
    if (!employee) return;

    const employeeMarkings = mockMarkings
      .filter((m) => m.employeeId === empId)
      .map((m): Marking => {
        // Especificar tipo Marking
        const dayInfo = days.find((d) => d.key === m.dayKey);
        const dateStr = dayInfo
          ? `${dayInfo.date}/${currentYear}`
          : `??/??/${currentYear}`;
        return {
          id: m.id ?? `mock-mark-${Math.random()}`,
          employeeId: m.employeeId,
          dayKey: m.dayKey,
          time: formatTime(m.time),
          type: m.type as
            | "ENTRADA"
            | "SALIDA"
            | "INICIO_DESCANSO"
            | "FIN_DESCANSO",
          icon: m.icon,
          color: m.color,
          dateStr: dateStr,
          site: "Sede Desconocida",
          status: "VALID",
          details: "Sin detalles",
          createdBy: "Sistema",
          markingType: m.type,
          timeFormatted: formatTime(m.time),
        };
      })
      .sort((a, b) => {
        const dateA = a.dateStr.split("/").reverse().join("-");
        const dateB = b.dateStr.split("/").reverse().join("-");
        const dateComparison = dateA.localeCompare(dateB);
        if (dateComparison !== 0) return dateComparison;
        return Number(a.time ?? 0) - Number(b.time ?? 0);
      });

    setMarkingsModalData({ employee, markings: employeeMarkings });
    setIsMarkingsModalOpen(true);
  };
  const handleCopyEmpLeave = (empId: string) => {
    console.log("Copiar Licencias Emp:", empId);
    showToast("Licencias y permisos copiados", "success");
    closeContextMenu();
  };
  const handleCopyEmpSchedules = (empId: string) => {
    console.log("Copiar Horarios Emp:", empId);
    showToast("Horarios copiados", "success");
    closeContextMenu();
  };
  const handleCopyEmpAll = (empId: string) => {
    console.log("Copiar Todo Emp:", empId);
    showToast("Todos los datos copiados", "success");
    closeContextMenu();
  };
  const handlePasteEmp = (empId: string) => {
    closeContextMenu();
    closeAllModals();
    setPasteEmployeeId(empId);
    setIsPasteConfirmOpen(true);
  };
  const handleConfirmPaste = () => {
    console.log("Pegando datos en Emp:", pasteEmployeeId);
    setIsPasteConfirmOpen(false);
    showToast(`Datos pegados`, "success");
    setPasteEmployeeId(null);
  };
  const handleCancelPaste = () => {
    setIsPasteConfirmOpen(false);
    setPasteEmployeeId(null);
  };
  // --- Fin Handlers Existentes ---

  // --- (NUEVO) Handlers específicos para acciones de barra WORKED ---
  const handleViewDetailsWorked = useCallback(() => {
    if (
      menuState.type !== "worked" ||
      !menuState.data?.id ||
      !menuState.data.employeeId ||
      !menuState.data.dayKey
    ) {
      console.error(
        "WeekView: Datos insuficientes en menuState para ver detalles:",
        menuState.data
      );
      showToast("No se pueden mostrar los detalles (faltan datos).", "error");
      closeContextMenu();
      return;
    }

    const { id, type, employeeId, dayKey } = menuState.data;
    const employee = employeesToDisplay.find((e) => e.id === employeeId);
    const dayInfo = days.find((d) => d.key === dayKey);

    if (!employee || !dayInfo) {
      console.error(
        "WeekView: Empleado o día no encontrado para detalles:",
        employeeId,
        dayKey
      );
      showToast("Empleado o día no encontrado.", "error");
      closeContextMenu();
      return;
    }

    let itemData: any = null;
    let startTime = 0,
      endTime = 0,
      label = undefined;

    // Buscar en mocks (reemplazar con lógica real)
    if (type === "schedule") {
      itemData = mockSchedules.find(
        (s) => s.id === id && s.employeeId === employeeId && s.dayKey === dayKey
      );
    } else {
      itemData = mockWorkedTimes.find(
        (w) => w.id === id && w.employeeId === employeeId && w.dayKey === dayKey
      );
    }

    if (!itemData) {
      console.error(
        `WeekView: No se encontró ${type} con ID ${id} para ${employeeId}/${dayKey}.`
      );
      showToast("No se encontraron datos para este elemento.", "warning");
      closeContextMenu();
      return;
    }

    startTime = itemData.startTime ?? 0;
    endTime = itemData.endTime ?? 0;
    label = itemData.label;

    const durationHours = Math.max(0, endTime - startTime);
    const hours = Math.floor(durationHours);
    const minutes = Math.round((durationHours - hours) * 60);

    const dateString = `${dayInfo.key} ${dayInfo.date}/${currentYear}`; // Ej: 'lun 28/04/2024'

    const detailPayload: DetailModalData = {
      id: id,
      type: type,
      employeeName: employee.name,
      employeeDept: employee.department || "N/A",
      date: dateString,
      startTime: formatTime(startTime),
      endTime: formatTime(endTime),
      duration: `${hours}h ${minutes}m`,
      label: label,
      status: type === "schedule" ? "Planificado" : "Registrado",
      details: `Mock: Detalles para ${type} ID ${id} en WeekView.`,
    };

    setDetailModalData(detailPayload);
    setIsDetailModalOpen(true);
    closeContextMenu();
  }, [menuState, employeesToDisplay, formatTime, showToast, closeContextMenu]);

  const handleCopyWorked = useCallback(() => {
    if (menuState.type !== "worked" || !menuState.data?.id) {
      console.warn("WeekView: No hay datos válidos para copiar.");
      return;
    }
    const { type, id } = menuState.data;
    const textToCopy = `Tipo: ${type}, ID: ${id}`;
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        showToast(`"${textToCopy}" copiado.`, "info");
      })
      .catch((err) => {
        console.error("WeekView: Error al copiar:", err);
        showToast("Error al copiar.", "error");
      });
    closeContextMenu();
  }, [menuState, showToast, closeContextMenu]);

  const handleDeleteWorked = useCallback(() => {
    if (
      menuState.type !== "worked" ||
      !menuState.data?.id ||
      !menuState.data.employeeId ||
      !menuState.data.dayKey
    ) {
      console.error(
        "WeekView: Datos insuficientes para eliminar:",
        menuState.data
      );
      showToast("No se puede eliminar (faltan datos).", "error");
      closeContextMenu();
      return;
    }

    const { id, type, employeeId, dayKey } = menuState.data;
    const employee = employeesToDisplay.find((e) => e.id === employeeId);
    const dayInfo = days.find((d) => d.key === dayKey);

    let itemName = `el elemento ${type} (ID: ${id})`;
    if (employee && dayInfo) {
      itemName = `el ${type} de ${employee.name} (${dayInfo.key} ${dayInfo.date})`;
      if (type === "schedule") {
        const schedule = mockSchedules.find((s) => s.id === id);
        if (schedule?.label) {
          itemName = `el horario "${schedule.label}" de ${employee.name} (${dayInfo.key} ${dayInfo.date})`;
        }
      }
    }

    setDeleteConfirmData({ id: id, type: type, itemName: itemName });
    setIsDeleteConfirmOpen(true);
    closeContextMenu();
  }, [menuState, employeesToDisplay, closeContextMenu, showToast]);

  // (NUEVO) Handler para confirmar la eliminación desde el modal
  const handleConfirmDelete = useCallback(() => {
    if (!deleteConfirmData) return;
    const { id, type, itemName } = deleteConfirmData;

    console.log(`WeekView: BORRADO CONFIRMADO para ${type} ID: ${id}`);
    // --- AQUÍ LÓGICA REAL DE BORRADO (API, actualizar estado global, etc.) ---

    closeAllModals(); // Cierra el modal de confirmación
    showToast(
      `${
        itemName.charAt(0).toUpperCase() + itemName.slice(1)
      } eliminado (simulado).`,
      "success"
    );
    // Quizás refetch o update local de datos
  }, [deleteConfirmData, showToast, closeAllModals]);

  // (NUEVO) Handler para cancelar desde el modal de eliminación
  const handleCancelDelete = useCallback(() => {
    closeAllModals(); // Simplemente cierra todos los modales
  }, [closeAllModals]);
  // --- Fin Handlers Acciones Barra WORKED ---

  // Check inicial (sin cambios)
  if (totalNumberOfEmployees === 0) {
    return (
      <div className="flex justify-center items-center h-60 text-muted-foreground">
        No hay datos de empleados para mostrar.
      </div>
    );
  }

  // Estilos CSS y Toast (sin cambios)
  const stripeCSS = `.bg-stripes-pattern { background-image: repeating-linear-gradient(-45deg, rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0.7) 4px, transparent 4px, transparent 8px); background-color: transparent; }`;
  const toastBaseClasses =
    "fixed bottom-5 right-5 z-[100] max-w-sm w-full p-4 rounded-lg shadow-lg flex items-start space-x-3 transition-all duration-300 ease-in-out";
  const toastTypeClasses = {
    success: "bg-green-100 border border-green-300 text-green-800",
    info: "bg-blue-100 border border-blue-300 text-blue-800",
    warning: "bg-yellow-100 border border-yellow-300 text-yellow-800",
    error: "bg-red-100 border border-red-300 text-red-800",
  };
  const toastIcon = {
    success: <CheckCircle className="h-5 w-5 text-green-600" />,
    info: <InfoIcon className="h-5 w-5 text-blue-600" />,
    warning: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
    error: <XCircle className="h-5 w-5 text-red-600" />,
  };

  return (
    <TooltipProvider>
      <style>{stripeCSS}</style>
      {/* Contenedor principal y onClick (sin cambios) */}
      <div
        className="h-[calc(100vh-100px)] w-full overflow-auto border border-border rounded-md bg-card text-card-foreground relative"
        onClick={(e) => {
          if (
            menuState.isOpen &&
            !(e.target as Element).closest(".custom-context-menu")
          )
            closeContextMenu();
        }}
      >
        {/* Layout Flex (sin cambios) */}
        <div className="flex min-w-max">
          {/* Columna Izquierda Fija (Empleado y Día - SIN CAMBIOS INTERNOS) */}
          <div
            className="sticky left-0 z-30 shrink-0 border-r border-border shadow-sm flex flex-col bg-white"
            style={{
              width: `${TOTAL_LEFT_WIDTH}px`,
              height: `${totalTimelineHeight}px`,
            }}
          >
            {/* Header Izquierdo */}
            <div
              className="border-b border-border flex items-center sticky top-0 z-10 bg-white"
              style={{ height: `${HEADER_HEIGHT}px` }}
            >
              <div
                className="p-2 font-medium text-sm text-center border-r border-border"
                style={{ width: `${EMPLOYEE_COL_WIDTH}px` }}
              >
                Empleado
              </div>
              <div
                className="p-2 font-medium text-sm text-center"
                style={{ width: `${DAY_COL_WIDTH}px` }}
              >
                Día
              </div>
            </div>
            {/* Contenido Izquierdo (Nombres Empleados y Días) */}
            <div className="relative flex-1">
              {employeesToDisplay.map((employee, employeeIndex) => (
                <React.Fragment key={employee.id}>
                  {/* Celda Nombre Empleado con Tooltip */}
                  <div
                    onContextMenu={(e) =>
                      handleContextMenu(e, "employee", {
                        employeeId: employee.id,
                      })
                    }
                    className="absolute border-b border-r border-border bg-white hover:bg-gray-50 cursor-context-menu group"
                    style={{
                      top: `${employeeIndex * days.length * ROW_HEIGHT}px`,
                      left: 0,
                      height: `${days.length * ROW_HEIGHT}px`,
                      width: `${EMPLOYEE_COL_WIDTH}px`,
                    }}
                  >
                    <Tooltip delayDuration={150}>
                      <TooltipTrigger asChild>
                        <div className="flex flex-col justify-center h-full w-full p-2">
                          <div className="font-semibold text-sm truncate">
                            {employee.name}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {employee.department ?? "Sin Dept."}
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent
                        side="right"
                        align="start"
                        className="bg-slate-800 text-white p-3 rounded-md shadow-lg text-xs border border-slate-700 w-60"
                        sideOffset={5}
                      >
                        <div className="font-bold text-sm mb-2">
                          {employee.name}
                        </div>
                        <div className="space-y-1">
                          <div>
                            <span className="font-medium">Num. documento:</span>{" "}
                            {employee.documentNumber ?? "N/A"}
                          </div>
                          <div>
                            <span className="font-medium">
                              Tipo De Persona:
                            </span>{" "}
                            {employee.personType ?? "N/A"}
                          </div>
                          <div>
                            <span className="font-medium">Contrato:</span>{" "}
                            {employee.contractInfo ?? "N/A"}
                          </div>
                          <div>
                            <span className="font-medium">Sede:</span>{" "}
                            {employee.site ?? "N/A"}
                          </div>
                          <div>
                            <span className="font-medium">Departamento:</span>{" "}
                            {employee.department ?? "N/A"}
                          </div>
                          <div>
                            <span className="font-medium">Cargo:</span>{" "}
                            {employee.position ?? "N/A"}
                          </div>
                          <hr className="border-slate-600 my-2" />
                          <div>
                            <span className="font-medium">Trabajadas:</span>{" "}
                            {employee.workedHours ?? "N/A"}
                          </div>
                          <div>
                            <span className="font-medium">Ordinarias:</span>{" "}
                            {employee.ordinaryHours ?? "N/A"}
                          </div>
                          <div>
                            <span className="font-medium">Ausencias:</span>{" "}
                            {employee.absenceHours ?? "N/A"}
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  {/* Celdas Días */}
                  <div
                    className="absolute flex flex-col bg-white"
                    style={{
                      left: `${EMPLOYEE_COL_WIDTH}px`,
                      top: `${employeeIndex * days.length * ROW_HEIGHT}px`,
                      width: `${DAY_COL_WIDTH}px`,
                    }}
                  >
                    {days.map((day) => (
                      <div
                        key={`${employee.id}-${day.key}-day`}
                        className="border-b border-border p-2 flex items-center justify-center text-xs hover:bg-gray-50"
                        style={{ height: `${ROW_HEIGHT}px` }}
                      >
                        <span className="font-bold mr-1">{day.key}</span>
                        <span>{day.date}</span>
                      </div>
                    ))}
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
          {/* Área Timeline Scrollable */}
          <div className="flex-1 min-w-0 relative">
            <div
              className="relative"
              style={{
                width: `${totalTimelineContentWidth}px`,
                height: `${totalTimelineHeight}px`,
              }}
            >
              {/* Header Timeline (Horas - SIN CAMBIOS INTERNOS) */}
              <div
                className="sticky top-0 z-20 flex border-b border-border bg-blue-100"
                style={{
                  height: `${HEADER_HEIGHT}px`,
                  width: `${totalTimelineContentWidth}px`,
                }}
              >
                {hoursToDisplay.map((hour) => (
                  <div
                    key={`header-${hour}`}
                    className="shrink-0 border-r border-blue-200 px-2 text-center text-xs font-medium flex items-center justify-center text-blue-800"
                    style={{ width: `${HOUR_WIDTH}px` }}
                  >
                    {`${hour.toString().padStart(2, "0")}:00`}
                  </div>
                ))}
              </div>
              {/* Grid Background y Contenido Timeline */}
              <div className="absolute top-0 left-0 w-full h-full">
                {/* Filas Background y Líneas Horarias/Minutos (SIN CAMBIOS INTERNOS) */}
                {Array.from({ length: totalNumberOfRows }).map(
                  (_, localRowIndex) => {
                    const employeeIndex = Math.floor(
                      localRowIndex / days.length
                    );
                    const dayIndex = localRowIndex % days.length;
                    const employee = employeesToDisplay[employeeIndex];
                    const day = days[dayIndex];
                    if (!employee || !day) return null;
                    const top = localRowIndex * ROW_HEIGHT + HEADER_HEIGHT;
                    return (
                      <div
                        key={`row-bg-${localRowIndex}`}
                        onContextMenu={(e) =>
                          handleContextMenu(e, "grid", {
                            employeeId: employee.id,
                            dayKey: day.key,
                          })
                        }
                        className="absolute border-b border-gray-200 hover:bg-blue-50/30 cursor-context-menu"
                        style={{
                          top: `${top}px`,
                          left: 0,
                          height: `${ROW_HEIGHT}px`,
                          width: `${totalTimelineContentWidth}px`,
                          zIndex: 2,
                        }}
                      >
                        {/* Líneas verticales */}
                        <div className="absolute inset-0 pointer-events-none z-0">
                          {hoursToDisplay.map((hour) => (
                            <React.Fragment
                              key={`hour-line-${localRowIndex}-${hour}`}
                            >
                              <div
                                className="absolute top-0 bottom-0 border-r border-gray-200"
                                style={{
                                  left: `${hour * HOUR_WIDTH}px`,
                                  width: "1px",
                                }}
                              />
                              {[15, 30, 45].map((minute) => (
                                <div
                                  key={`minute-line-${localRowIndex}-${hour}-${minute}`}
                                  className="absolute top-0 bottom-0 w-px bg-gray-100"
                                  style={{
                                    left: `${
                                      hour * HOUR_WIDTH +
                                      (minute / 60) * HOUR_WIDTH
                                    }px`,
                                  }}
                                />
                              ))}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    );
                  }
                )}
                {/* Capa para renderizar Barras y Marcajes (CON onContextMenu MODIFICADO) */}
                <div className="absolute top-0 left-0 w-full h-full z-10 pointer-events-none">
                  {employeesToDisplay.map((employee) =>
                    days.map((day) => {
                      const rowIndex = getRowIndex(employee.id, day.key);
                      if (rowIndex === -1) return null;
                      const actualSchedule = mockSchedules.find(
                        (s) =>
                          s.employeeId === employee.id && s.dayKey === day.key
                      );
                      const actualWorked = mockWorkedTimes.find(
                        (w) =>
                          w.employeeId === employee.id && w.dayKey === day.key
                      );
                      const actualMarkings = mockMarkings.filter(
                        (m) =>
                          m.employeeId === employee.id && m.dayKey === day.key
                      );
                      const barLayer: React.ReactNode[] = [];
                      const markingLayer: React.ReactNode[] = [];
                      const topOffset = rowIndex * ROW_HEIGHT + HEADER_HEIGHT;

                      // Renderizar Barra Horario (Schedule)
                      if (actualSchedule) {
                        const left = actualSchedule.startTime * HOUR_WIDTH;
                        const width =
                          (actualSchedule.endTime - actualSchedule.startTime) *
                          HOUR_WIDTH;
                        const verticalPosition = topOffset + ROW_HEIGHT * 0.5;
                        const barHeight = ROW_HEIGHT * 0.25;
                        if (width > 0.1)
                          barLayer.push(
                            <div
                              key={`sched-${employee.id}-${day.key}`}
                              // (MODIFICADO) Context Menu para BARRA HORARIO
                              onContextMenu={(e) =>
                                handleContextMenu(e, "worked", {
                                  scheduleId: actualSchedule.id,
                                  type: "schedule",
                                  employeeId: employee.id, // Pasar employeeId
                                  dayKey: day.key, // Pasar dayKey
                                })
                              }
                              className={cn(
                                "absolute rounded-md overflow-hidden bg-green-100 border border-green-300 pointer-events-auto cursor-context-menu"
                              )}
                              style={{
                                top: `${verticalPosition}px`,
                                left: `${left}px`,
                                width: `${width}px`,
                                height: `${barHeight}px`,
                                zIndex: 5,
                              }}
                            >
                              <span
                                className={cn(
                                  "absolute bottom-[-2px] left-1.5 text-[10px] font-medium pointer-events-none text-green-800"
                                )}
                              >
                                {actualSchedule.label}
                              </span>
                            </div>
                          );
                        // Renderizar Ausencias (barras rojas) - Lógica existente SIN CAMBIOS
                        const absenceVerticalPosition =
                          topOffset + ROW_HEIGHT * 0.18;
                        const absenceHeight = ROW_HEIGHT * 0.25;
                        if (actualWorked) {
                          if (
                            actualWorked.startTime > actualSchedule.startTime
                          ) {
                            const aE = Math.min(
                              actualWorked.startTime,
                              actualSchedule.endTime
                            );
                            const aW =
                              (aE - actualSchedule.startTime) * HOUR_WIDTH;
                            if (aW > 0.1)
                              barLayer.push(
                                <div
                                  key={`abs-start-${employee.id}-${day.key}`}
                                  className={cn(
                                    "absolute bg-red-200 rounded-sm overflow-hidden pointer-events-none"
                                  )}
                                  style={{
                                    top: `${absenceVerticalPosition}px`,
                                    left: `${
                                      actualSchedule.startTime * HOUR_WIDTH
                                    }px`,
                                    width: `${aW}px`,
                                    height: `${absenceHeight}px`,
                                    zIndex: 16,
                                  }}
                                >
                                  <div className="absolute inset-0 bg-stripes-pattern opacity-70 pointer-events-none"></div>
                                </div>
                              );
                          }
                          if (actualWorked.endTime < actualSchedule.endTime) {
                            const aS = Math.max(
                              actualWorked.endTime,
                              actualSchedule.startTime
                            );
                            const aW =
                              (actualSchedule.endTime - aS) * HOUR_WIDTH;
                            if (aW > 0.1)
                              barLayer.push(
                                <div
                                  key={`abs-end-${employee.id}-${day.key}`}
                                  className={cn(
                                    "absolute bg-red-200 rounded-sm overflow-hidden pointer-events-none"
                                  )}
                                  style={{
                                    top: `${absenceVerticalPosition}px`,
                                    left: `${aS * HOUR_WIDTH}px`,
                                    width: `${aW}px`,
                                    height: `${absenceHeight}px`,
                                    zIndex: 16,
                                  }}
                                >
                                  <div className="absolute inset-0 bg-stripes-pattern opacity-70 pointer-events-none"></div>
                                </div>
                              );
                          }
                        } else {
                          const aW =
                            (actualSchedule.endTime -
                              actualSchedule.startTime) *
                            HOUR_WIDTH;
                          if (aW > 0.1)
                            barLayer.push(
                              <div
                                key={`abs-full-${employee.id}-${day.key}`}
                                className={cn(
                                  "absolute bg-red-200 rounded-sm overflow-hidden pointer-events-none"
                                )}
                                style={{
                                  top: `${absenceVerticalPosition}px`,
                                  left: `${
                                    actualSchedule.startTime * HOUR_WIDTH
                                  }px`,
                                  width: `${aW}px`,
                                  height: `${absenceHeight}px`,
                                  zIndex: 16,
                                }}
                              >
                                <div className="absolute inset-0 bg-stripes-pattern opacity-70 pointer-events-none"></div>
                              </div>
                            );
                        }
                      }

                      // Renderizar Barras Tiempo Trabajado (Regular/Overtime)
                      if (actualWorked) {
                        const workedStart = actualWorked.startTime;
                        const workedEnd = actualWorked.endTime;
                        const scheduleStart =
                          actualSchedule?.startTime ?? -Infinity;
                        const scheduleEnd = actualSchedule?.endTime ?? Infinity;
                        const regularStart = Math.max(
                          workedStart,
                          scheduleStart
                        );
                        const regularEnd = Math.min(workedEnd, scheduleEnd);
                        const regularWidth =
                          regularEnd > regularStart
                            ? (regularEnd - regularStart) * HOUR_WIDTH
                            : 0;
                        const overtimeStart = Math.max(
                          workedStart,
                          scheduleEnd
                        );
                        const overtimeEnd = workedEnd;
                        const overtimeWidth =
                          overtimeEnd > overtimeStart
                            ? (overtimeEnd - overtimeStart) * HOUR_WIDTH
                            : 0;
                        const verticalPosition = topOffset + ROW_HEIGHT * 0.18;
                        const barHeight = ROW_HEIGHT * 0.25;

                        if (regularWidth > 0.1)
                          barLayer.push(
                            <div
                              key={`workR-${employee.id}-${day.key}`}
                              // (MODIFICADO) Context Menu para BARRA REGULAR
                              onContextMenu={(e) =>
                                handleContextMenu(e, "worked", {
                                  workedId: actualWorked.id,
                                  type: "regular",
                                  employeeId: employee.id,
                                  dayKey: day.key,
                                })
                              }
                              className={cn(
                                "absolute bg-green-500 rounded-sm pointer-events-auto cursor-context-menu"
                              )}
                              style={{
                                top: `${verticalPosition}px`,
                                left: `${regularStart * HOUR_WIDTH}px`,
                                width: `${regularWidth}px`,
                                height: `${barHeight}px`,
                                zIndex: 15,
                              }}
                            />
                          );
                        if (overtimeWidth > 0.1)
                          barLayer.push(
                            <div
                              key={`workOT-${employee.id}-${day.key}`}
                              // (MODIFICADO) Context Menu para BARRA OVERTIME
                              onContextMenu={(e) =>
                                handleContextMenu(e, "worked", {
                                  workedId: actualWorked.id,
                                  type: "overtime",
                                  employeeId: employee.id,
                                  dayKey: day.key,
                                })
                              }
                              className={cn(
                                "absolute bg-yellow-400 rounded-sm pointer-events-auto cursor-context-menu"
                              )}
                              style={{
                                top: `${verticalPosition}px`,
                                left: `${overtimeStart * HOUR_WIDTH}px`,
                                width: `${overtimeWidth}px`,
                                height: `${barHeight}px`,
                                zIndex: 14,
                              }}
                            />
                          );
                      }

                      // Renderizar Marcajes (pines) - Lógica existente SIN CAMBIOS
                      actualMarkings.forEach((mark, index) => {
                        const pinLeft = mark.time * HOUR_WIDTH;
                        const IconComponent = mark.icon || MapPin;
                        const pinTop =
                          topOffset + ROW_HEIGHT - ROW_HEIGHT * 0.15;
                        markingLayer.push(
                          <div
                            key={`mark-${employee.id}-${day.key}-${index}`}
                            className={cn(
                              "absolute z-30 flex items-center justify-center pointer-events-auto"
                            )}
                            style={{
                              top: `${pinTop}px`,
                              left: `${pinLeft}px`,
                              transform: "translate(-50%, -50%)",
                            }}
                            title={`${mark.type} @ ${formatTime(mark.time)}`}
                          >
                            <IconComponent
                              className={cn("w-3.5 h-3.5", mark.color)}
                            />
                          </div>
                        );
                      });

                      return (
                        <React.Fragment
                          key={`cell-content-${employee.id}-${day.key}`}
                        >
                          {barLayer}
                          {markingLayer}
                        </React.Fragment>
                      );
                    })
                  )}
                </div>{" "}
                {/* Fin Capa Barras y Marcajes */}
              </div>{" "}
              {/* Fin Grid Background y Contenido */}
            </div>{" "}
            {/* Fin Contenedor Timeline Scrollable */}
          </div>{" "}
          {/* Fin Área Timeline Scrollable */}
        </div>{" "}
        {/* Fin Layout Flex */}
        {/* --- Modales (TODOS CON SU CONTENIDO COMPLETO) --- */}
        <Modal
          isOpen={isFormModalOpen}
          onClose={closeAllModals}
          title={
            formModalType === "marking"
              ? "Nuevo Marcaje"
              : formModalType === "leave"
              ? "Agregar Licencia/Permiso"
              : formModalType === "shift"
              ? "Agregar Horario"
              : ""
          }
          size={
            formModalType === "leave"
              ? "lg"
              : formModalType === "shift"
              ? "xl"
              : "md"
          }
        >
          {formModalType === "marking" && formModalData && (
            <AddMarkingForm
              initialDate={formModalData.initialDate}
              initialTime={formModalData.initialTime}
              onClose={closeAllModals}
              onSubmitSuccess={handleFormSuccess}
            />
          )}
          {formModalType === "leave" && formModalData && (
            <AddLeaveForm
              initialStartDate={formModalData.initialDate}
              initialStartTime={formModalData.initialTime}
              onClose={closeAllModals}
              onSubmitSuccess={handleFormSuccess}
            />
          )}
          {formModalType === "shift" && formModalData && (
            <AddShiftForm
              initialStartDate={formModalData.initialDate}
              onClose={closeAllModals}
              onSubmitSuccess={handleFormSuccess}
            />
          )}
        </Modal>
        <Modal
          isOpen={isSuccessModalOpen}
          onClose={closeAllModals}
          title="Operación Exitosa"
          size="sm"
        >
          <div className="text-center py-4">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-3" />
            <p className="text-gray-700">{successMessage}</p>
            <Button
              onClick={closeAllModals}
              className="mt-5 bg-blue-500 hover:bg-blue-600"
            >
              Aceptar
            </Button>
          </div>
        </Modal>
        <Modal
          isOpen={isMarkingsModalOpen}
          onClose={closeAllModals}
          title={`Marcajes de ${
            markingsModalData.employee?.name || "Empleado"
          }`}
          size="xl"
        >
          <div className="p-0">
            {markingsModalData.employee && (
              <EmployeeMarkingsTable
                markings={markingsModalData.markings}
                employeeName={markingsModalData.employee.name}
                onClose={closeAllModals}
              />
            )}
          </div>
        </Modal>
        <Modal
          isOpen={isPasteConfirmOpen}
          onClose={handleCancelPaste}
          title="Confirmar Acción"
          size="sm"
        >
          <div className="p-5">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-yellow-500 mr-3" />
              <p className="text-gray-700 font-medium">¿Está seguro?</p>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              Esta acción puede sobrescribir datos existentes.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleCancelPaste}>
                Cancelar
              </Button>
              <Button
                className="bg-blue-500 hover:bg-blue-600"
                onClick={handleConfirmPaste}
              >
                Confirmar
              </Button>
            </div>
          </div>
        </Modal>
        {/* --- (NUEVO) Renderizado de Modales para Barra --- */}
        <WorkDetailModal
          isOpen={isDetailModalOpen}
          onClose={closeAllModals}
          detailData={detailModalData}
        />
        <ConfirmDeleteModal
          isOpen={isDeleteConfirmOpen}
          onClose={handleCancelDelete}
          onConfirm={handleConfirmDelete}
          title={
            deleteConfirmData?.type === "schedule"
              ? "Eliminar Horario"
              : "Eliminar Registro"
          }
          itemName={deleteConfirmData?.itemName || "este elemento"}
        />
        {/* --- Fin Nuevos Modales --- */}
        {/* Menú Contextual */}
        <CustomContextMenu
          isOpen={menuState.isOpen}
          position={menuState.position}
          onClose={closeContextMenu}
          className="custom-context-menu"
        >
          {/* --- (MODIFICADO) Conectar Nuevos Handlers para 'worked' --- */}
          {menuState.type === "worked" && menuState.data && (
            <WorkedBarContextMenuContent
              onViewDetails={handleViewDetailsWorked} // <-- Usar nuevo handler
              onCopy={handleCopyWorked} // <-- Usar nuevo handler
              onDelete={handleDeleteWorked} // <-- Usar nuevo handler
            />
          )}
          {/* Mantener sin cambios para 'grid' y 'employee' */}
          {menuState.type === "grid" && menuState.data && (
            <GridCellContextMenuContent
              formattedDateTime={
                menuState.data.formattedDateTime || "??/?? - ??:??"
              }
              onAddMarking={handleAddMarking}
              onAddLeave={handleAddLeave}
              onAddShift={handleAddShift}
            />
          )}
          {menuState.type === "employee" && menuState.data && (
            <EmployeeContextMenuContent
              onViewMarkings={() =>
                handleViewEmpMarkings(menuState.data.employeeId)
              }
              onCopyLeave={() => handleCopyEmpLeave(menuState.data.employeeId)}
              onCopySchedules={() =>
                handleCopyEmpSchedules(menuState.data.employeeId)
              }
              onCopyAll={() => handleCopyEmpAll(menuState.data.employeeId)}
              onPaste={() => handlePasteEmp(menuState.data.employeeId)}
            />
          )}
        </CustomContextMenu>
        {/* Renderizado de Toasts (ya existente y completo) */}
        <div className="fixed bottom-0 right-0 p-4 space-y-2 z-[100]">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={cn(
                toastBaseClasses,
                toastTypeClasses[toast.type],
                toast.isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4 pointer-events-none"
              )}
              role="alert"
            >
              <div className="flex-shrink-0">{toastIcon[toast.type]}</div>
              <div className="flex-grow text-sm font-medium">
                {toast.message}
              </div>
              <button
                onClick={() => closeToast(toast.id)}
                className="ml-auto -mx-1.5 -my-1.5 p-1.5 inline-flex h-8 w-8 rounded-lg focus:ring-2 focus:ring-offset-1"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>{" "}
      {/* Fin Contenedor Principal */}
    </TooltipProvider>
  );
}
