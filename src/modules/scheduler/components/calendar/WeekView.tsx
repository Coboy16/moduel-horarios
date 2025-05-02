/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useCallback, useRef, useMemo } from "react"; // Añadido useMemo
import { cn } from "../../lib/utils";
import {
  MapPin,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info as InfoIcon,
  X,
} from "lucide-react";
import {
  format,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  startOfDay,
  isAfter,
} from "date-fns"; // Añadidas funciones de date-fns
import { es } from "date-fns/locale"; // Añadido locale español
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

import { useFilters } from "../../hooks/useFilters"; // Importar hook de filtros

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

import { WorkDetailModal } from "./forms/WorkDetailModal";
import { ConfirmDeleteModal } from "./forms/ConfirmDeleteModal";

// Constantes
const EMPLOYEE_COL_WIDTH = 160;
const DAY_COL_WIDTH = 80;
const HEADER_HEIGHT = 40;
const HOUR_WIDTH = 80;
const ROW_HEIGHT = 65;
const TOTAL_LEFT_WIDTH = EMPLOYEE_COL_WIDTH + DAY_COL_WIDTH;

// Mapeo día (para mock data filtering)

// Interfaces (sin cambios estructurales)
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
  dayKey: string; // Mantenemos dayKey para compatibilidad con mocks/formularios
  fullDate: Date; // Añadimos la fecha completa
  initialDate: string; // Formato YYYY-MM-DD
  initialTime: string; // Formato HH:mm
}

interface ToastState {
  id: number;
  isVisible: boolean;
  message: string;
  type: "success" | "info" | "warning" | "error";
}

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
  id: string;
  type: string;
  itemName: string;
}

// *** NUEVO: Interface para los días dinámicos ***
interface DynamicDay {
  key: string; // ej: "lun"
  date: string; // ej: "28/04"
  fullDate: Date; // Objeto Date completo
}

export default function WeekView({ employees }: WeekViewProps) {
  const { dateRange: selectedRange } = useFilters(); // Obtener rango del hook

  const employeesToDisplay =
    employees && employees.length > 0 ? employees : mockEmployees;

  // *** NUEVO: Generar días dinámicamente ***
  const dynamicDays = useMemo((): DynamicDay[] => {
    let startDate: Date;
    let endDate: Date;

    if (selectedRange?.start) {
      startDate = startOfDay(selectedRange.start);
      endDate = selectedRange.end ? startOfDay(selectedRange.end) : startDate; // Si no hay end, es un solo día
    } else {
      // Fallback: Mostrar la semana actual (Lunes a Domingo) si no hay rango
      const today = new Date();
      startDate = startOfWeek(today, { weekStartsOn: 1 }); // Lunes
      endDate = endOfWeek(today, { weekStartsOn: 1 }); // Domingo
    }

    // Asegurar que start <= end
    if (isAfter(startDate, endDate)) {
      [startDate, endDate] = [endDate, startDate]; // Swap si están invertidas
    }

    const daysInInterval = eachDayOfInterval({
      start: startDate,
      end: endDate,
    });

    return daysInInterval.map(
      (date): DynamicDay => ({
        key: format(date, "eee", { locale: es }).toLowerCase(), // ej: "lun"
        date: format(date, "dd/MM", { locale: es }), // ej: "28/04"
        fullDate: date, // Guardar el objeto Date completo
      })
    );
  }, [selectedRange]);
  // *** FIN NUEVO ***

  // Estados (sin cambios estructurales)
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
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailModalData, setDetailModalData] =
    useState<DetailModalData | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteConfirmData, setDeleteConfirmData] =
    useState<DeleteConfirmData | null>(null);

  // Funciones auxiliares (sin cambios)
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

  // Dimensiones calculadas (MODIFICADO para usar dynamicDays)
  const totalNumberOfEmployees = employeesToDisplay.length;
  const totalNumberOfDays = dynamicDays.length; // Usar longitud del array dinámico
  const totalNumberOfRows = totalNumberOfEmployees * totalNumberOfDays; // Actualizado
  const totalTimelineContentHeight = totalNumberOfRows * ROW_HEIGHT;
  const totalTimelineHeight = totalTimelineContentHeight + HEADER_HEIGHT;
  const totalTimelineContentWidth = 24 * HOUR_WIDTH;
  const hoursToDisplay = Array.from({ length: 24 }, (_, i) => i);

  // Funciones Toast (sin cambios)
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

  // closeAllModals (sin cambios)
  const closeAllModals = useCallback(() => {
    setIsFormModalOpen(false);
    setFormModalType(null);
    setFormModalData(null);
    setIsSuccessModalOpen(false);
    setSuccessMessage("");
    setIsMarkingsModalOpen(false);
    setMarkingsModalData({ employee: null, markings: [] });
    setIsPasteConfirmOpen(false);
    setPasteEmployeeId(null);
    setIsDetailModalOpen(false);
    setDetailModalData(null);
    setIsDeleteConfirmOpen(false);
    setDeleteConfirmData(null);
  }, []);

  const closeContextMenu = useCallback(() => {
    setMenuState((prev) => ({
      ...prev,
      isOpen: false,
      type: null,
      data: null,
    }));
  }, []);

  // handleContextMenu (MODIFICADO para usar fullDate)
  const handleContextMenu = useCallback(
    (
      event: React.MouseEvent<HTMLDivElement>,
      type: "worked" | "grid" | "employee",
      data: any // data contendrá { employeeId, dayKey, fullDate } para 'grid'
    ) => {
      event.preventDefault();
      event.stopPropagation();
      closeAllModals();
      closeContextMenu();

      let processedData = { ...data };

      if (type === "grid") {
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
        // Usar fullDate para formatear
        const dateStr = format(data.fullDate, "dd/MM/yyyy", { locale: es });
        const formattedDateForInput = format(data.fullDate, "yyyy-MM-dd");

        processedData = {
          ...data, // Mantiene employeeId, dayKey, fullDate
          clickedTime: clickedTimeDecimal,
          formattedDateTime: `${dateStr} - ${formattedTime}`,
          initialDate: formattedDateForInput,
          initialTime: formattedTime,
        };
      } else if (type === "worked") {
        processedData.id = data.scheduleId || data.workedId;
        if (!processedData.id || !data.employeeId || !data.dayKey) {
          // dayKey sigue siendo útil para filtrar mocks
          console.warn(
            "WeekView: Datos incompletos para menú 'worked'. Faltan id, employeeId o dayKey.",
            data
          );
        }
        // Podríamos añadir fullDate aquí si la barra lo pasara, para más precisión
        // processedData.fullDate = data.fullDate;
      }

      setMenuState({
        isOpen: true,
        position: { x: event.clientX, y: event.clientY },
        type: type,
        data: processedData,
      });
    },
    [
      closeAllModals,
      closeContextMenu,
      calculateTimeFromOffset,
      formatTime,
      totalTimelineContentWidth,
    ]
  );

  // openFormModal (MODIFICADO para aceptar fullDate)
  const openFormModal = (
    type: "marking" | "leave" | "shift",
    data: ModalFormData // La interfaz ya incluye fullDate
  ) => {
    closeAllModals();
    closeContextMenu();
    setFormModalData(data); // Guardar todos los datos necesarios
    setFormModalType(type);
    setIsFormModalOpen(true);
  };

  // handleFormSuccess (sin cambios)
  const handleFormSuccess = (message: string) => {
    closeAllModals();
    setSuccessMessage(message);
    setIsSuccessModalOpen(true);
  };

  // Handlers menú GRID (MODIFICADO para pasar fullDate)
  const handleAddMarking = () => {
    if (menuState.type === "grid" && menuState.data) {
      const { employeeId, dayKey, fullDate, initialDate, initialTime } =
        menuState.data;
      openFormModal("marking", {
        employeeId,
        dayKey,
        fullDate,
        initialDate,
        initialTime,
      });
    }
  };
  const handleAddLeave = () => {
    if (menuState.type === "grid" && menuState.data) {
      const { employeeId, dayKey, fullDate, initialDate, initialTime } =
        menuState.data;
      openFormModal("leave", {
        employeeId,
        dayKey,
        fullDate,
        initialDate,
        initialTime,
      });
    }
  };
  const handleAddShift = () => {
    if (menuState.type === "grid" && menuState.data) {
      const { employeeId, dayKey, fullDate, initialDate } = menuState.data;
      openFormModal("shift", {
        employeeId,
        dayKey,
        fullDate,
        initialDate,
        initialTime: "00:00", // Shift usualmente empieza al inicio del día
      });
    }
  };

  // Handlers menú EMPLOYEE (MODIFICADO para usar dynamicDays en handleViewEmpMarkings)
  const handleViewEmpMarkings = (empId: string) => {
    closeContextMenu();
    closeAllModals();
    const employee = employeesToDisplay.find((e) => e.id === empId);
    if (!employee) return;

    // Filtrar marcajes mock por employeeId
    const employeeMarkings = mockMarkings
      .filter((m) => m.employeeId === empId)
      .map((m): Marking | null => {
        // Puede ser null si el dayKey no está en los días mostrados
        // Encontrar el día correspondiente en los días mostrados actualmente
        const matchingDay = dynamicDays.find((d) => d.key === m.dayKey);
        if (!matchingDay) return null; // Si el marcaje es de un día no mostrado, ignorarlo

        const dateStr = format(matchingDay.fullDate, "dd/MM/yyyy", {
          locale: es,
        }); // Usar la fecha real

        return {
          id: m.id ?? `mock-mark-${Math.random()}`,
          employeeId: m.employeeId,
          dayKey: m.dayKey,
          time: formatTime(m.time),
          type: m.type as any,
          icon: m.icon,
          color: m.color,
          dateStr: dateStr, // Fecha formateada real
          site: "Sede Desconocida",
          status: "VALID",
          details: "Sin detalles",
          createdBy: "Sistema",
          markingType: m.type,
          timeFormatted: formatTime(m.time),
        };
      })
      .filter((m): m is Marking => m !== null) // Filtrar los nulos
      .sort((a, b) => {
        // Ordenar por fecha real y luego por hora
        const dateA =
          dynamicDays.find((d) => d.key === a.dayKey)?.fullDate.getTime() ?? 0;
        const dateB =
          dynamicDays.find((d) => d.key === b.dayKey)?.fullDate.getTime() ?? 0;
        const dateComparison = dateA - dateB;
        if (dateComparison !== 0) return dateComparison;
        // Convertir tiempo HH:mm a número para comparar
        const timeA = Number(a.time.replace(":", "."));
        const timeB = Number(b.time.replace(":", "."));
        return timeA - timeB;
      });

    setMarkingsModalData({ employee, markings: employeeMarkings });
    setIsMarkingsModalOpen(true);
  };
  // Resto de handlers de Employee sin cambios
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

  // Handlers menú WORKED (MODIFICADO para usar fullDate si está disponible)
  const handleViewDetailsWorked = useCallback(() => {
    if (
      menuState.type !== "worked" ||
      !menuState.data?.id ||
      !menuState.data.employeeId ||
      !menuState.data.dayKey // Mantenemos dayKey por compatibilidad mock
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
    // Encontrar el día por dayKey en los días mostrados actualmente
    const dayInfo = dynamicDays.find((d) => d.key === dayKey);

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

    if (type === "schedule") {
      itemData = mockSchedules.find(
        (s) => s.id === id && s.employeeId === employeeId && s.dayKey === dayKey
      );
    } else {
      // 'regular' o 'overtime' vienen de workedTimes
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

    // Usar la fecha completa para el string
    const dateString = format(dayInfo.fullDate, "eee dd/MM/yyyy", {
      locale: es,
    });

    const detailPayload: DetailModalData = {
      id: id,
      type: type, // Puede ser 'schedule', 'regular', 'overtime'
      employeeName: employee.name,
      employeeDept: employee.department || "N/A",
      date: dateString,
      startTime: formatTime(startTime),
      endTime: formatTime(endTime),
      duration: `${hours}h ${minutes}m`,
      label: label,
      status: type === "schedule" ? "Planificado" : "Registrado", // Simplificado
      details: `Mock: Detalles para ${type} ID ${id} en WeekView.`,
    };

    setDetailModalData(detailPayload);
    setIsDetailModalOpen(true);
    closeContextMenu();
  }, [
    menuState,
    employeesToDisplay,
    dynamicDays,
    formatTime,
    showToast,
    closeContextMenu,
  ]);

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
    const dayInfo = dynamicDays.find((d) => d.key === dayKey);

    let itemName = `el elemento ${type} (ID: ${id})`;
    if (employee && dayInfo) {
      const dateStr = format(dayInfo.fullDate, "dd/MM", { locale: es });
      itemName = `el ${type} de ${employee.name} (${dayInfo.key} ${dateStr})`;
      if (type === "schedule") {
        const schedule = mockSchedules.find((s) => s.id === id);
        if (schedule?.label) {
          itemName = `el horario "${schedule.label}" de ${employee.name} (${dayInfo.key} ${dateStr})`;
        }
      }
    }

    setDeleteConfirmData({ id: id, type: type, itemName: itemName });
    setIsDeleteConfirmOpen(true);
    closeContextMenu();
  }, [menuState, employeesToDisplay, dynamicDays, closeContextMenu, showToast]);

  const handleConfirmDelete = useCallback(() => {
    if (!deleteConfirmData) return;
    const { id, type, itemName } = deleteConfirmData;
    console.log(`WeekView: BORRADO CONFIRMADO para ${type} ID: ${id}`);
    closeAllModals();
    showToast(
      `${
        itemName.charAt(0).toUpperCase() + itemName.slice(1)
      } eliminado (simulado).`,
      "success"
    );
  }, [deleteConfirmData, showToast, closeAllModals]);

  const handleCancelDelete = useCallback(() => {
    closeAllModals();
  }, [closeAllModals]);

  // Check inicial (sin cambios)
  if (totalNumberOfEmployees === 0) {
    return (
      <div className="flex justify-center items-center h-60 text-muted-foreground">
        No hay datos de empleados para mostrar.
      </div>
    );
  }
  if (totalNumberOfDays === 0) {
    return (
      <div className="flex justify-center items-center h-60 text-muted-foreground">
        Seleccione un rango de fechas para mostrar.
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
        <div className="flex min-w-max">
          {/* Columna Izquierda Fija (MODIFICADO para usar dynamicDays) */}
          <div
            className="sticky left-0 z-30 shrink-0 border-r border-border shadow-sm flex flex-col bg-white"
            style={{
              width: `${TOTAL_LEFT_WIDTH}px`,
              height: `${totalTimelineHeight}px`,
            }}
          >
            {/* Header Izquierdo (sin cambios) */}
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
            {/* Contenido Izquierdo (MODIFICADO para usar dynamicDays) */}
            <div className="relative flex-1">
              {employeesToDisplay.map((employee, employeeIndex) => (
                <React.Fragment key={employee.id}>
                  {/* Celda Nombre Empleado (sin cambios internos) */}
                  <div
                    onContextMenu={(e) =>
                      handleContextMenu(e, "employee", {
                        employeeId: employee.id,
                      })
                    }
                    className="absolute border-b border-r border-border bg-white hover:bg-gray-50 cursor-context-menu group"
                    style={{
                      top: `${
                        employeeIndex * totalNumberOfDays * ROW_HEIGHT
                      }px`, // Usa totalNumberOfDays
                      left: 0,
                      height: `${totalNumberOfDays * ROW_HEIGHT}px`, // Usa totalNumberOfDays
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
                        {/* Tooltip content sin cambios */}
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
                  {/* Celdas Días (MODIFICADO para iterar sobre dynamicDays) */}
                  <div
                    className="absolute flex flex-col bg-white"
                    style={{
                      left: `${EMPLOYEE_COL_WIDTH}px`,
                      top: `${
                        employeeIndex * totalNumberOfDays * ROW_HEIGHT
                      }px`, // Usa totalNumberOfDays
                      width: `${DAY_COL_WIDTH}px`,
                    }}
                  >
                    {dynamicDays.map(
                      (
                        day // Itera sobre dynamicDays
                      ) => (
                        <div
                          key={`${employee.id}-${day.key}-${day.date}`} // Key única
                          className="border-b border-border p-2 flex items-center justify-center text-xs hover:bg-gray-50"
                          style={{ height: `${ROW_HEIGHT}px` }}
                        >
                          <span className="font-bold mr-1 capitalize">
                            {day.key}
                          </span>{" "}
                          {/* Muestra key (lun, mar...) */}
                          <span>{day.date}</span> {/* Muestra fecha (28/04) */}
                        </div>
                      )
                    )}
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
          {/* Área Timeline Scrollable (MODIFICADO para usar dynamicDays) */}
          <div className="flex-1 min-w-0 relative">
            <div
              className="relative"
              style={{
                width: `${totalTimelineContentWidth}px`,
                height: `${totalTimelineHeight}px`,
              }}
            >
              {/* Header Timeline (sin cambios) */}
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
              {/* Grid Background y Contenido Timeline (MODIFICADO para usar dynamicDays) */}
              <div className="absolute top-0 left-0 w-full h-full">
                {/* Filas Background (MODIFICADO) */}
                {Array.from({ length: totalNumberOfRows }).map(
                  // Usa totalNumberOfRows actualizado
                  (_, localRowIndex) => {
                    // Calcular employeeIndex y dayIndex basado en dynamicDays.length
                    const employeeIndex = Math.floor(
                      localRowIndex / totalNumberOfDays
                    );
                    const dayIndex = localRowIndex % totalNumberOfDays;
                    const employee = employeesToDisplay[employeeIndex];
                    const day = dynamicDays[dayIndex]; // Obtener día de dynamicDays
                    if (!employee || !day) return null;
                    const top = localRowIndex * ROW_HEIGHT + HEADER_HEIGHT;
                    return (
                      <div
                        key={`row-bg-${localRowIndex}`}
                        onContextMenu={(e) =>
                          handleContextMenu(e, "grid", {
                            employeeId: employee.id,
                            dayKey: day.key, // Pasar key (lun, mar...)
                            fullDate: day.fullDate, // Pasar fecha completa
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
                        {/* Líneas verticales (sin cambios internos) */}
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
                {/* Capa para renderizar Barras y Marcajes (MODIFICADO) */}
                <div className="absolute top-0 left-0 w-full h-full z-10 pointer-events-none">
                  {employeesToDisplay.map(
                    (
                      employee,
                      employeeIndex // Necesitamos employeeIndex
                    ) =>
                      dynamicDays.map((day, dayIndex) => {
                        // Iterar sobre dynamicDays, necesitamos dayIndex
                        // Calcular rowIndex basado en los índices de los maps
                        const localRowIndex =
                          employeeIndex * totalNumberOfDays + dayIndex;
                        const dayKey = day.key; // Usar la key del día actual (lun, mar...)

                        // Filtrar mocks usando dayKey
                        const actualSchedule = mockSchedules.find(
                          (s) =>
                            s.employeeId === employee.id && s.dayKey === dayKey
                        );
                        const actualWorked = mockWorkedTimes.find(
                          (w) =>
                            w.employeeId === employee.id && w.dayKey === dayKey
                        );
                        const actualMarkings = mockMarkings.filter(
                          (m) =>
                            m.employeeId === employee.id && m.dayKey === dayKey
                        );

                        const barLayer: React.ReactNode[] = [];
                        const markingLayer: React.ReactNode[] = [];
                        const topOffset =
                          localRowIndex * ROW_HEIGHT + HEADER_HEIGHT; // Calcular topOffset

                        // Renderizar Barra Horario (Schedule) - Lógica interna sin cambios, pero pasa dayKey
                        if (actualSchedule) {
                          const left = actualSchedule.startTime * HOUR_WIDTH;
                          const width =
                            (actualSchedule.endTime -
                              actualSchedule.startTime) *
                            HOUR_WIDTH;
                          const verticalPosition = topOffset + ROW_HEIGHT * 0.5;
                          const barHeight = ROW_HEIGHT * 0.25;
                          if (width > 0.1)
                            barLayer.push(
                              <div
                                key={`sched-${employee.id}-${dayKey}`}
                                onContextMenu={(e) =>
                                  handleContextMenu(e, "worked", {
                                    scheduleId: actualSchedule.id,
                                    type: "schedule",
                                    employeeId: employee.id,
                                    dayKey: dayKey, // Pasar dayKey
                                    // Podríamos pasar fullDate si fuera necesario: fullDate: day.fullDate
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
                          // Renderizar Ausencias - Lógica interna sin cambios
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
                                    key={`abs-start-${employee.id}-${dayKey}`}
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
                                    key={`abs-end-${employee.id}-${dayKey}`}
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
                                  key={`abs-full-${employee.id}-${dayKey}`}
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

                        // Renderizar Barras Tiempo Trabajado - Lógica interna sin cambios, pero pasa dayKey
                        if (actualWorked) {
                          const workedStart = actualWorked.startTime;
                          const workedEnd = actualWorked.endTime;
                          const scheduleStart =
                            actualSchedule?.startTime ?? -Infinity;
                          const scheduleEnd =
                            actualSchedule?.endTime ?? Infinity;
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
                          const verticalPosition =
                            topOffset + ROW_HEIGHT * 0.18;
                          const barHeight = ROW_HEIGHT * 0.25;

                          if (regularWidth > 0.1)
                            barLayer.push(
                              <div
                                key={`workR-${employee.id}-${dayKey}`}
                                onContextMenu={(e) =>
                                  handleContextMenu(e, "worked", {
                                    workedId: actualWorked.id,
                                    type: "regular",
                                    employeeId: employee.id,
                                    dayKey: dayKey, // Pasar dayKey
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
                                key={`workOT-${employee.id}-${dayKey}`}
                                onContextMenu={(e) =>
                                  handleContextMenu(e, "worked", {
                                    workedId: actualWorked.id,
                                    type: "overtime",
                                    employeeId: employee.id,
                                    dayKey: dayKey, // Pasar dayKey
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

                        // Renderizar Marcajes (pines) - Lógica interna sin cambios
                        actualMarkings.forEach((mark, index) => {
                          const pinLeft = mark.time * HOUR_WIDTH;
                          const IconComponent = mark.icon || MapPin;
                          const pinTop =
                            topOffset + ROW_HEIGHT - ROW_HEIGHT * 0.15;
                          markingLayer.push(
                            <div
                              key={`mark-${employee.id}-${dayKey}-${index}`}
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
                            key={`cell-content-${employee.id}-${dayKey}`}
                          >
                            {barLayer}
                            {markingLayer}
                          </React.Fragment>
                        );
                      })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- Modales y Menú Contextual (sin cambios internos aquí) --- */}
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
        <CustomContextMenu
          isOpen={menuState.isOpen}
          position={menuState.position}
          onClose={closeContextMenu}
          className="custom-context-menu"
        >
          {menuState.type === "worked" && menuState.data && (
            <WorkedBarContextMenuContent
              onViewDetails={handleViewDetailsWorked}
              onCopy={handleCopyWorked}
              onDelete={handleDeleteWorked}
            />
          )}
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
        {/* Renderizado de Toasts (sin cambios) */}
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
      </div>
    </TooltipProvider>
  );
}
