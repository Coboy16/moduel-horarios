/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, {
  useState,
  useCallback,
  useRef,
  forwardRef,
  useEffect, // Importado para posible depuración
} from "react";
import { cn } from "../../lib/utils";
import {
  MapPin,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info as InfoIcon,
  X,
} from "lucide-react";
import { format, set, getDay, isValid } from "date-fns";
import { es } from "date-fns/locale";

// --- Componentes UI ---
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Button } from "../ui/button";
import { Modal } from "./forms/Modal";
import { CustomContextMenu } from "./menus/CustomContextMenu";

// --- Contenidos Menús Contextuales ---
import { WorkedBarContextMenuContent } from "./menus/WorkedBarContextMenu";
import { GridCellContextMenuContent } from "./menus/GridCellContextMenu";
import { EmployeeContextMenuContent } from "./menus/EmployeeContextMenu";

// --- Formularios y Tablas Modales ---
import { AddMarkingForm } from "./forms/AddMarkingForm";
import { AddLeaveForm } from "./forms/AddLeaveForm";
import { AddShiftForm } from "./forms/AddShiftForm";
import { EmployeeMarkingsTable } from "./forms/EmployeeMarkingsTable";
import { WorkDetailModal } from "./forms/WorkDetailModal";
import { ConfirmDeleteModal } from "./forms/ConfirmDeleteModal";

// --- Interfaces y Tipos ---
import type { Employee } from "../../interfaces/Employee";
import type { Marking as OriginalMarking } from "../../interfaces/Marking";

// --- Datos Mock ---
import {
  mockEmployees, // <--- Necesario para obtener IDs secuenciales para estética
  mockMarkings,
  mockSchedules,
  mockWorkedTimes,
} from "../../tem/week_view";

// --- Constantes de Layout ---
const EMPLOYEE_COL_WIDTH = 200;
const HEADER_HEIGHT = 40;
const HOUR_WIDTH = 80;
const ROW_HEIGHT = 65;

// --- Helper para obtener dayKey ---
const getDayKey = (date: Date): string | null => {
  if (!isValid(date)) return null;
  const dayIndex = getDay(date);
  const keys = [null, "lun", "mar", "mié", "jue", "vie", "sáb"];
  return keys[dayIndex] || null;
};

// --- Interfaces de Estado ---
interface MenuState {
  isOpen: boolean;
  position: { x: number; y: number };
  type: "worked" | "grid" | "employee" | null;
  data: any;
}

interface ModalFormData {
  employeeId: string;
  initialDate: string;
  initialTime: string;
  currentDate: Date;
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
  date: string;
  startTime: string;
  endTime: string;
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

// --- Interfaz de Props ---
interface TimelineViewProps {
  currentDate: Date;
  selectedEmployees?: Employee[];
  containerWidth?: number;
  containerHeight?: number;
  timelineContentRef?: React.RefObject<HTMLDivElement>;
  timelineMainScrollContainerRef?: React.RefObject<HTMLDivElement>;
}

// --- Componente GridRow (Sin cambios) ---
interface GridRowProps {
  employeeId: string;
  employeeIndex: number;
  rowWidth: number;
  currentDate: Date;
  onContextMenu: (
    e: React.MouseEvent,
    type: "grid",
    data: { employeeId: string; calculatedTime: Date }
  ) => void;
  onDoubleClick?: (
    e: React.MouseEvent,
    employeeId: string,
    calculatedTime: Date
  ) => void;
  containerRef: React.RefObject<HTMLDivElement>;
  scrollContainerRef: React.RefObject<HTMLDivElement>;
}

const GridRow: React.FC<GridRowProps> = ({
  employeeId,
  employeeIndex,
  rowWidth,
  currentDate,
  onContextMenu,
  onDoubleClick,
  containerRef,
  scrollContainerRef,
}) => {
  const getTimeFromMouseEvent = (e: React.MouseEvent): Date => {
    const containerRect = containerRef.current?.getBoundingClientRect();
    const scrollLeft = scrollContainerRef.current?.scrollLeft || 0;
    if (!containerRect || !containerRef.current) {
      return currentDate;
    }
    const timelineAreaX = e.clientX - containerRect.left;
    const offsetX = timelineAreaX + scrollLeft;
    const timelineTotalWidth = 24 * HOUR_WIDTH;
    const hoursDecimal = (offsetX / timelineTotalWidth) * 24;
    const clampedHours = Math.max(0, Math.min(24, hoursDecimal || 0));
    if (isNaN(clampedHours)) return currentDate;
    const totalMinutes = Math.round(clampedHours * 60);
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    return set(currentDate, { hours, minutes, seconds: 0, milliseconds: 0 });
  };
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const calculatedTime = getTimeFromMouseEvent(e);
    onContextMenu(e, "grid", { employeeId, calculatedTime });
  };
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDoubleClick) {
      const calculatedTime = getTimeFromMouseEvent(e);
      onDoubleClick(e, employeeId, calculatedTime);
    }
  };
  return (
    <div
      className={cn(
        "absolute border-b border-border cursor-context-menu hover:bg-blue-50/30"
      )}
      style={{
        top: `${employeeIndex * ROW_HEIGHT + HEADER_HEIGHT}px`,
        left: 0,
        height: `${ROW_HEIGHT}px`,
        width: `${rowWidth}px`,
        zIndex: 1,
      }}
      onContextMenu={handleContextMenu}
      onDoubleClick={handleDoubleClick}
    >
      <div className="absolute inset-0 pointer-events-none z-0">
        {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
          <React.Fragment key={`hour-line-${hour}`}>
            <div
              className="absolute top-0 bottom-0 border-r border-gray-200"
              style={{ left: `${hour * HOUR_WIDTH}px`, width: "1px" }}
            />
            {[15, 30, 45].map((minute) => (
              <div
                key={`minute-line-${hour}-${minute}`}
                className="absolute top-0 bottom-0 w-px bg-gray-100"
                style={{
                  left: `${hour * HOUR_WIDTH + (minute / 60) * HOUR_WIDTH}px`,
                }}
              />
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
// --- Fin GridRow ---

// --- Componente Principal TimelineView ---
const TimelineView = forwardRef<HTMLDivElement, TimelineViewProps>(
  (
    {
      currentDate,
      selectedEmployees,
      timelineContentRef: externalContentRef,
      timelineMainScrollContainerRef: externalScrollRef,
    },
    ref
  ) => {
    const internalScrollRef = useRef<HTMLDivElement>(null);
    const internalContentRef = useRef<HTMLDivElement>(null);
    const timelineMainScrollContainerRef =
      externalScrollRef || internalScrollRef;
    const timelineContentRef = externalContentRef || internalContentRef;

    const employeesToDisplay =
      selectedEmployees && selectedEmployees.length > 0
        ? selectedEmployees
        : mockEmployees;
    const currentDayKey = getDayKey(currentDate);

    // --- Estado (Sin cambios) ---
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
      markings: OriginalMarking[];
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

    // --- Funciones Auxiliares (Sin cambios) ---
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
    const formatDisplayDate = (date: Date): string =>
      format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
    const formatInputDate = (date: Date): string => format(date, "yyyy-MM-dd");

    // --- Toast Logic (Sin cambios) ---
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
        setToasts((prev) => [...prev.slice(-4), newToast]);
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
      setTimeout(
        () => setToasts((prev) => prev.filter((t) => t.isVisible)),
        500
      );
    };

    // --- Modal Logic (Sin cambios) ---
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

    // --- Context Menu Handler (Sin cambios) ---
    const handleContextMenu = useCallback(
      (
        event: React.MouseEvent<HTMLDivElement>,
        type: "worked" | "grid" | "employee",
        data: any
      ) => {
        event.preventDefault();
        event.stopPropagation();
        closeAllModals();
        closeContextMenu();
        let processedData = { ...data };
        if (type === "grid") {
          const calculatedTime = data.calculatedTime as Date;
          if (!calculatedTime || !isValid(calculatedTime)) return;
          const formattedTime = format(calculatedTime, "HH:mm");
          const formattedDateStr = format(calculatedTime, "yyyy-MM-dd");
          const formattedDisplayDateTime = format(calculatedTime, "PPpp", {
            locale: es,
          });
          processedData = {
            ...data,
            formattedDateTime: formattedDisplayDateTime,
            initialDate: formattedDateStr,
            initialTime: formattedTime,
            currentDate: calculatedTime,
          };
        } else if (type === "worked") {
          processedData.id = data.scheduleId || data.workedId;
          processedData.currentDate = currentDate;
          if (!processedData.id || !data.employeeId) {
            console.warn(
              "TimelineView: Incomplete data for 'worked' menu.",
              data
            );
            return;
          }
        } else if (type === "employee") {
          processedData.currentDate = currentDate;
        }
        setMenuState({
          isOpen: true,
          position: { x: event.clientX, y: event.clientY },
          type: type,
          data: processedData,
        });
      },
      [closeAllModals, closeContextMenu, currentDate, formatTime]
    );

    // --- Handlers para Acciones (Sin cambios relevantes) ---
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
      showToast(message, "success");
    };
    const handleAddMarking = () => {
      if (menuState.type === "grid" && menuState.data) {
        const { employeeId, initialDate, initialTime, currentDate } =
          menuState.data;
        openFormModal("marking", {
          employeeId,
          initialDate,
          initialTime,
          currentDate,
        });
      }
    };
    const handleAddLeave = () => {
      if (menuState.type === "grid" && menuState.data) {
        const { employeeId, initialDate, initialTime, currentDate } =
          menuState.data;
        openFormModal("leave", {
          employeeId,
          initialDate,
          initialTime,
          currentDate,
        });
      }
    };
    const handleAddShift = () => {
      if (menuState.type === "grid" && menuState.data) {
        const { employeeId, initialDate, currentDate } = menuState.data;
        openFormModal("shift", {
          employeeId,
          initialDate,
          initialTime: "00:00",
          currentDate,
        });
      }
    };
    const handleViewEmpMarkings = (empId: string) => {
      // Muestra marcajes REALES si existen para ese empleado y día
      closeContextMenu();
      closeAllModals();
      const employee = employeesToDisplay.find((e) => e.id === empId);
      if (!employee) return;
      const employeeDayMarkings = mockMarkings
        .filter((m) => m.employeeId === empId && m.dayKey === currentDayKey)
        .map(
          (m): OriginalMarking => ({
            id: m.id ?? `mock-mark-${Math.random()}`,
            employeeId: m.employeeId,
            time: format(
              set(currentDate, {
                hours: Math.floor(m.time),
                minutes: Math.round((m.time % 1) * 60),
                seconds: 0,
                milliseconds: 0,
              }),
              "yyyy-MM-dd'T'HH:mm:ss"
            ),
            type: m.type as any,
            icon: m.icon,
            color: m.color,
            site: "Sede Mock",
            status: "VALID",
            details: `Mock ${m.type} at ${formatTime(m.time)}`,
            createdBy: "Sistema Mock",
            dayKey: "",
            markingType: "",
            dateStr: "",
            timeFormatted: "",
          })
        )
        .sort(
          (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
        );
      setMarkingsModalData({
        employee: employee
          ? { ...employee, position: employee.position || "Sin Cargo" }
          : null,
        markings: employeeDayMarkings,
      });
      setIsMarkingsModalOpen(true);
    };
    const handleCopyEmpLeave = (empId: string) => {
      console.log("Copiar Licencias Emp:", empId, "fecha:", currentDate);
      showToast("Licencias copiadas (simulado)", "info");
      closeContextMenu();
    };
    const handleCopyEmpSchedules = (empId: string) => {
      console.log("Copiar Horarios Emp:", empId, "fecha:", currentDate);
      showToast("Horarios copiados (simulado)", "info");
      closeContextMenu();
    };
    const handleCopyEmpAll = (empId: string) => {
      console.log("Copiar Todo Emp:", empId, "fecha:", currentDate);
      showToast("Todos los datos copiados (simulado)", "info");
      closeContextMenu();
    };
    const handlePasteEmp = (empId: string) => {
      closeContextMenu();
      closeAllModals();
      setPasteEmployeeId(empId);
      setIsPasteConfirmOpen(true);
    };
    const handleConfirmPaste = () => {
      console.log(
        "Pegando datos en Emp:",
        pasteEmployeeId,
        "fecha:",
        currentDate
      );
      setIsPasteConfirmOpen(false);
      showToast(`Datos pegados en ${pasteEmployeeId} (simulado)`, "success");
      setPasteEmployeeId(null);
    };
    const handleCancelPaste = () => {
      setIsPasteConfirmOpen(false);
      setPasteEmployeeId(null);
    };
    const handleViewDetailsWorked = useCallback(() => {
      // Muestra detalles del elemento VISUAL (mock posiblemente)
      if (
        menuState.type !== "worked" ||
        !menuState.data?.id ||
        !menuState.data.employeeId
      ) {
        showToast("Error: Faltan datos para ver detalles.", "error");
        closeContextMenu();
        return;
      }
      const { id, type, employeeId } = menuState.data; // employeeId aquí es el REAL de la fila
      const employee = employeesToDisplay.find((e) => e.id === employeeId);
      if (!employee) {
        showToast("Error: Empleado no encontrado.", "error");
        closeContextMenu();
        return;
      }
      let itemData: any = null;
      let startTimeDec = 0,
        endTimeDec = 0,
        label = undefined;
      // IMPORTANTE: Buscamos el dato visual que se mostró (puede ser de un mockEmployee diferente al real)
      // Necesitamos encontrar el ID del mockEmployee que se usó para la fila de este 'employeeId' real
      const realEmployeeIndex = employeesToDisplay.findIndex(
        (e) => e.id === employeeId
      );
      const mockEmployeeIdForVisuals = mockEmployees[realEmployeeIndex]?.id;

      if (mockEmployeeIdForVisuals) {
        if (type === "schedule")
          itemData = mockSchedules.find(
            (s) =>
              s.id === id &&
              s.employeeId === mockEmployeeIdForVisuals &&
              s.dayKey === currentDayKey
          );
        else
          itemData = mockWorkedTimes.find(
            (w) =>
              w.id === id &&
              w.employeeId === mockEmployeeIdForVisuals &&
              w.dayKey === currentDayKey
          );
      }

      if (!itemData) {
        showToast(
          "Advertencia: No se encontraron datos del elemento visual.",
          "warning"
        );
        closeContextMenu();
        return;
      }
      startTimeDec = itemData.startTime ?? 0;
      endTimeDec = itemData.endTime ?? 0;
      label = itemData.label;
      const durationHours = Math.max(0, endTimeDec - startTimeDec);
      const hours = Math.floor(durationHours);
      const minutes = Math.round((durationHours - hours) * 60);
      const dateString = formatDisplayDate(currentDate);
      const detailPayload: DetailModalData = {
        id,
        type,
        employeeName: employee.name,
        employeeDept: employee.department || "N/A",
        date: dateString,
        startTime: formatTime(startTimeDec),
        endTime: formatTime(endTimeDec),
        duration: `${hours}h ${minutes}m`,
        label,
        status: type === "schedule" ? "Planificado" : "Registrado",
        details: `Visual: ${type} ID ${id} para ${dateString}.`,
      };
      setDetailModalData(detailPayload);
      setIsDetailModalOpen(true);
      closeContextMenu();
    }, [
      menuState,
      employeesToDisplay,
      currentDate,
      formatTime,
      formatDisplayDate,
      showToast,
      closeContextMenu,
      currentDayKey,
    ]); // Incluir dependencias
    const handleCopyWorked = useCallback(() => {
      if (menuState.type !== "worked" || !menuState.data?.id) return;
      const { type, id } = menuState.data;
      const textToCopy = `Visual Tipo: ${type}, ID: ${id}, Fecha: ${formatInputDate(
        currentDate
      )}`;
      navigator.clipboard
        .writeText(textToCopy)
        .then(() => showToast(`"${textToCopy}" copiado.`, "info"))
        .catch(() => showToast("Error al copiar.", "error"));
      closeContextMenu();
    }, [menuState, currentDate, showToast, closeContextMenu]);
    const handleDeleteWorked = useCallback(() => {
      // Elimina el elemento REAL asociado a la fila
      if (
        menuState.type !== "worked" ||
        !menuState.data?.id ||
        !menuState.data.employeeId
      ) {
        showToast("Error: Faltan datos para eliminar.", "error");
        closeContextMenu();
        return;
      }
      const { id, type, employeeId } = menuState.data; // employeeId es el REAL
      const employee = employeesToDisplay.find((e) => e.id === employeeId);
      const dateStr = format(currentDate, "dd/MM/yyyy");
      let itemName = `el elemento ${type} (ID: ${id})`;
      if (employee) {
        itemName = `el ${type} de ${employee.name} (${dateStr})`; /* Podríamos buscar label si es schedule */
      }
      setDeleteConfirmData({ id, type, itemName });
      setIsDeleteConfirmOpen(true);
      closeContextMenu();
    }, [
      menuState,
      employeesToDisplay,
      currentDate,
      closeContextMenu,
      showToast,
      currentDayKey,
    ]); // Incluir dependencias
    const handleConfirmDelete = useCallback(() => {
      if (!deleteConfirmData) return;
      const { id, type, itemName } = deleteConfirmData;
      console.log(
        `TimelineView: BORRADO CONFIRMADO ${type} ID: ${id} fecha ${formatInputDate(
          currentDate
        )}`
      );
      closeAllModals();
      showToast(
        `${
          itemName.charAt(0).toUpperCase() + itemName.slice(1)
        } eliminado (simulado).`,
        "success"
      );
    }, [deleteConfirmData, currentDate, showToast, closeAllModals]);
    const handleCancelDelete = useCallback(() => {
      closeAllModals();
    }, [closeAllModals]);
    const handleTimelineDoubleClick = (
      e: React.MouseEvent,
      employeeId: string,
      calculatedTime: Date
    ) => {
      const initialDate = formatInputDate(calculatedTime);
      const initialTime = format(calculatedTime, "HH:mm");
      openFormModal("marking", {
        employeeId,
        initialDate,
        initialTime,
        currentDate: calculatedTime,
      });
    };

    // --- Cálculos de Layout ---
    const totalNumberOfEmployees = employeesToDisplay.length;
    const totalTimelineContentWidth = 24 * HOUR_WIDTH;
    const totalTimelineHeight =
      totalNumberOfEmployees * ROW_HEIGHT + HEADER_HEIGHT;
    const hoursToDisplay = Array.from({ length: 24 }, (_, i) => i);

    // --- Estilos CSS ---
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

    // --- Renderizado ---
    if (totalNumberOfEmployees === 0) {
      return (
        <div className="flex justify-center items-center h-60 text-muted-foreground">
          No hay empleados para mostrar.
        </div>
      );
    }

    return (
      <TooltipProvider>
        <style>{stripeCSS}</style>
        <div
          ref={ref || timelineMainScrollContainerRef}
          className="h-full w-full overflow-auto border border-border rounded-md bg-card text-card-foreground relative flex"
          onClick={(e) => {
            if (
              menuState.isOpen &&
              !(e.target as Element).closest(".custom-context-menu")
            )
              closeContextMenu();
          }}
        >
          {/* Columna Fija de Empleados */}
          <div
            className="sticky left-0 z-30 shrink-0 border-r border-border shadow-sm flex flex-col bg-white"
            style={{
              width: `${EMPLOYEE_COL_WIDTH}px`,
              minHeight: `${totalTimelineHeight}px`,
            }}
          >
            <div
              className="border-b border-border p-2 flex items-center justify-center font-medium text-sm sticky top-0 bg-white z-10"
              style={{ height: `${HEADER_HEIGHT}px` }}
            >
              {format(currentDate, "EEE dd/MM", { locale: es })}
            </div>
            <div className="flex-1">
              {employeesToDisplay.map(
                (
                  employee // Muestra nombres REALES
                ) => (
                  <div
                    key={employee.id}
                    onContextMenu={(e) =>
                      handleContextMenu(e, "employee", {
                        employeeId: employee.id,
                      })
                    }
                    className="border-b border-border flex items-center px-2 cursor-context-menu group hover:bg-gray-50"
                    style={{ height: `${ROW_HEIGHT}px` }}
                  >
                    <Tooltip delayDuration={150}>
                      <TooltipTrigger asChild>
                        <div className="flex flex-col justify-center h-full w-full">
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
                        sideOffset={5}
                        className="bg-slate-800 text-white p-3 rounded-md shadow-lg text-xs border border-slate-700 w-60 z-50"
                      >
                        <div className="font-bold text-sm mb-2">
                          {employee.name}
                        </div>
                        <div className="space-y-1">
                          <div>
                            <span className="font-medium">Doc:</span>{" "}
                            {employee.documentNumber ?? "N/A"}
                          </div>
                          <div>
                            <span className="font-medium">Tipo:</span>{" "}
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
                            <span className="font-medium">Dept:</span>{" "}
                            {employee.department ?? "N/A"}
                          </div>
                          <div>
                            <span className="font-medium">Cargo:</span>{" "}
                            {employee.position ?? "N/A"}
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                )
              )}
            </div>
          </div>
          {/* Área de Timeline Scrollable */}
          <div className="flex-1 min-w-0 relative">
            <div
              ref={timelineContentRef}
              className="relative"
              style={{
                width: `${totalTimelineContentWidth}px`,
                height: `${totalTimelineHeight}px`,
              }}
            >
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
                  >{`${hour.toString().padStart(2, "0")}:00`}</div>
                ))}
              </div>
              {employeesToDisplay.map((employee, index) => (
                <GridRow
                  key={`${employee.id}-gridrow`}
                  employeeId={employee.id}
                  employeeIndex={index}
                  rowWidth={totalTimelineContentWidth}
                  currentDate={currentDate}
                  onContextMenu={handleContextMenu}
                  onDoubleClick={handleTimelineDoubleClick}
                  containerRef={timelineContentRef}
                  scrollContainerRef={timelineMainScrollContainerRef}
                />
              ))}

              {/* ================================================================== */}
              {/* ================== INICIO CAMBIO IMPORTANTE ================== */}
              {/* ================================================================== */}
              <div className="absolute top-0 left-0 w-full h-full z-10 pointer-events-none">
                {employeesToDisplay.map((employee, employeeIndex) => {
                  // --- MODIFICACIÓN CLAVE PARA ESTÉTICA ---
                  // 1. Obtenemos el ID del empleado MOCK correspondiente al índice actual en la lista de visualización.
                  //    Esto asegura que tomamos datos mock secuencialmente para llenar las filas visualmente.
                  //    Usamos el operador '?' por si hay más empleados seleccionados que mocks disponibles.
                  const mockEmployeeIdForVisuals =
                    mockEmployees[employeeIndex]?.id;

                  // 2. Buscamos los datos VISUALES (schedule, worked, markings) usando el mockEmployeeIdForVisuals y el currentDayKey.
                  //    Si no se encontró un mockEmployeeIdForVisuals (índice fuera de rango), los datos serán undefined/vacío.
                  const actualSchedule = mockEmployeeIdForVisuals
                    ? mockSchedules.find(
                        (s) =>
                          s.employeeId === mockEmployeeIdForVisuals &&
                          s.dayKey === currentDayKey
                      )
                    : undefined;

                  const actualWorked = mockEmployeeIdForVisuals
                    ? mockWorkedTimes.find(
                        (w) =>
                          w.employeeId === mockEmployeeIdForVisuals &&
                          w.dayKey === currentDayKey
                      )
                    : undefined;

                  const actualMarkings = mockEmployeeIdForVisuals
                    ? mockMarkings.filter(
                        (m) =>
                          m.employeeId === mockEmployeeIdForVisuals &&
                          m.dayKey === currentDayKey
                      )
                    : [];
                  // --- FIN MODIFICACIÓN CLAVE ---

                  const barLayer: React.ReactNode[] = [];
                  const markingLayer: React.ReactNode[] = [];
                  const topOffset = employeeIndex * ROW_HEIGHT + HEADER_HEIGHT;

                  // --- Renderizado de Barras (Usa los datos VISUALES encontrados arriba) ---
                  if (actualSchedule) {
                    const left = actualSchedule.startTime * HOUR_WIDTH;
                    const width =
                      (actualSchedule.endTime - actualSchedule.startTime) *
                      HOUR_WIDTH;
                    const vPos = topOffset + ROW_HEIGHT * 0.5;
                    const h = ROW_HEIGHT * 0.25;
                    if (width > 0.1)
                      barLayer.push(
                        <div
                          key={`sched-${employee.id}-visual`} // Añadido -visual para claridad
                          onContextMenu={(e) =>
                            handleContextMenu(e, "worked", {
                              scheduleId: actualSchedule.id, // ID del schedule VISUAL
                              type: "schedule",
                              employeeId: employee.id, // *** ID REAL del empleado de la FILA ***
                            })
                          }
                          className={cn(
                            "absolute rounded-md overflow-hidden bg-green-100 border border-green-300 pointer-events-auto cursor-context-menu"
                          )}
                          style={{
                            top: `${vPos}px`,
                            left: `${left}px`,
                            width: `${width}px`,
                            height: `${h}px`,
                            zIndex: 5,
                          }}
                          title={`Horario: ${
                            actualSchedule.label || ""
                          } (${formatTime(
                            actualSchedule.startTime
                          )} - ${formatTime(actualSchedule.endTime)})`}
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
                    // Absence bars (using visual data)
                    const absVPos = topOffset + ROW_HEIGHT * 0.18;
                    const absH = ROW_HEIGHT * 0.25;
                    if (actualWorked) {
                      if (actualWorked.startTime > actualSchedule.startTime) {
                        const aEnd = Math.min(
                          actualWorked.startTime,
                          actualSchedule.endTime
                        );
                        const aWidth =
                          (aEnd - actualSchedule.startTime) * HOUR_WIDTH;
                        if (aWidth > 0.1)
                          barLayer.push(
                            <div
                              key={`abs-start-${employee.id}-visual`}
                              className={cn(
                                "absolute bg-red-200 rounded-sm overflow-hidden pointer-events-none"
                              )}
                              style={{
                                top: `${absVPos}px`,
                                left: `${
                                  actualSchedule.startTime * HOUR_WIDTH
                                }px`,
                                width: `${aWidth}px`,
                                height: `${absH}px`,
                                zIndex: 16,
                              }}
                              title={`Ausencia (${formatTime(
                                actualSchedule.startTime
                              )} - ${formatTime(aEnd)})`}
                            >
                              <div className="absolute inset-0 bg-stripes-pattern opacity-70"></div>
                            </div>
                          );
                      }
                      if (actualWorked.endTime < actualSchedule.endTime) {
                        const aStart = Math.max(
                          actualWorked.endTime,
                          actualSchedule.startTime
                        );
                        const aWidth =
                          (actualSchedule.endTime - aStart) * HOUR_WIDTH;
                        if (aWidth > 0.1)
                          barLayer.push(
                            <div
                              key={`abs-end-${employee.id}-visual`}
                              className={cn(
                                "absolute bg-red-200 rounded-sm overflow-hidden pointer-events-none"
                              )}
                              style={{
                                top: `${absVPos}px`,
                                left: `${aStart * HOUR_WIDTH}px`,
                                width: `${aWidth}px`,
                                height: `${absH}px`,
                                zIndex: 16,
                              }}
                              title={`Ausencia (${formatTime(
                                aStart
                              )} - ${formatTime(actualSchedule.endTime)})`}
                            >
                              <div className="absolute inset-0 bg-stripes-pattern opacity-70"></div>
                            </div>
                          );
                      }
                    } else {
                      const aWidth =
                        (actualSchedule.endTime - actualSchedule.startTime) *
                        HOUR_WIDTH;
                      if (aWidth > 0.1)
                        barLayer.push(
                          <div
                            key={`abs-full-${employee.id}-visual`}
                            className={cn(
                              "absolute bg-red-200 rounded-sm overflow-hidden pointer-events-none"
                            )}
                            style={{
                              top: `${absVPos}px`,
                              left: `${
                                actualSchedule.startTime * HOUR_WIDTH
                              }px`,
                              width: `${aWidth}px`,
                              height: `${absH}px`,
                              zIndex: 16,
                            }}
                            title={`Ausencia Total (${formatTime(
                              actualSchedule.startTime
                            )} - ${formatTime(actualSchedule.endTime)})`}
                          >
                            <div className="absolute inset-0 bg-stripes-pattern opacity-70"></div>
                          </div>
                        );
                    }
                  }
                  // Worked Time Bars (using visual data)
                  if (actualWorked) {
                    const wStart = actualWorked.startTime;
                    const wEnd = actualWorked.endTime;
                    const sStart = actualSchedule?.startTime ?? -Infinity;
                    const sEnd = actualSchedule?.endTime ?? Infinity;
                    const regStart = Math.max(wStart, sStart);
                    const regEnd = Math.min(wEnd, sEnd);
                    const regWidth =
                      regEnd > regStart ? (regEnd - regStart) * HOUR_WIDTH : 0;
                    const otStartB = wStart;
                    const otEndB = Math.min(wEnd, sStart);
                    const otWidthB =
                      otEndB > otStartB ? (otEndB - otStartB) * HOUR_WIDTH : 0;
                    const otStartA = Math.max(wStart, sEnd);
                    const otEndA = wEnd;
                    const otWidthA =
                      otEndA > otStartA ? (otEndA - otStartA) * HOUR_WIDTH : 0;
                    const vPos = topOffset + ROW_HEIGHT * 0.18;
                    const h = ROW_HEIGHT * 0.25;
                    if (regWidth > 0.1)
                      barLayer.push(
                        <div
                          key={`workR-${employee.id}-visual`}
                          onContextMenu={(e) =>
                            handleContextMenu(e, "worked", {
                              workedId: actualWorked.id, // ID del worked VISUAL
                              type: "regular",
                              employeeId: employee.id, // *** ID REAL del empleado de la FILA ***
                            })
                          }
                          className={cn(
                            "absolute bg-green-500 rounded-sm pointer-events-auto cursor-context-menu"
                          )}
                          style={{
                            top: `${vPos}px`,
                            left: `${regStart * HOUR_WIDTH}px`,
                            width: `${regWidth}px`,
                            height: `${h}px`,
                            zIndex: 15,
                          }}
                          title={`Trabajado (${formatTime(
                            regStart
                          )} - ${formatTime(regEnd)})`}
                        />
                      );
                    if (otWidthB > 0.1)
                      barLayer.push(
                        <div
                          key={`workOTB-${employee.id}-visual`}
                          onContextMenu={(e) =>
                            handleContextMenu(e, "worked", {
                              workedId: actualWorked.id, // ID del worked VISUAL
                              type: "overtime",
                              employeeId: employee.id, // *** ID REAL del empleado de la FILA ***
                            })
                          }
                          className={cn(
                            "absolute bg-yellow-400 rounded-sm pointer-events-auto cursor-context-menu"
                          )}
                          style={{
                            top: `${vPos}px`,
                            left: `${otStartB * HOUR_WIDTH}px`,
                            width: `${otWidthB}px`,
                            height: `${h}px`,
                            zIndex: 14,
                          }}
                          title={`Overtime (${formatTime(
                            otStartB
                          )} - ${formatTime(otEndB)})`}
                        />
                      );
                    if (otWidthA > 0.1)
                      barLayer.push(
                        <div
                          key={`workOTA-${employee.id}-visual`}
                          onContextMenu={(e) =>
                            handleContextMenu(e, "worked", {
                              workedId: actualWorked.id, // ID del worked VISUAL
                              type: "overtime",
                              employeeId: employee.id, // *** ID REAL del empleado de la FILA ***
                            })
                          }
                          className={cn(
                            "absolute bg-yellow-400 rounded-sm pointer-events-auto cursor-context-menu"
                          )}
                          style={{
                            top: `${vPos}px`,
                            left: `${otStartA * HOUR_WIDTH}px`,
                            width: `${otWidthA}px`,
                            height: `${h}px`,
                            zIndex: 14,
                          }}
                          title={`Overtime (${formatTime(
                            otStartA
                          )} - ${formatTime(otEndA)})`}
                        />
                      );
                  }

                  // --- Renderizar Marcajes (Pines - usando datos VISUALES) ---
                  actualMarkings.forEach((mark, index) => {
                    const pinLeft = mark.time * HOUR_WIDTH;
                    const IconComponent = mark.icon || MapPin;
                    const pinTop = topOffset + ROW_HEIGHT - ROW_HEIGHT * 0.15;
                    markingLayer.push(
                      <div
                        key={`mark-${employee.id}-${index}-visual`}
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
                        <Tooltip delayDuration={50}>
                          <TooltipTrigger>
                            <IconComponent
                              className={cn(
                                "w-3.5 h-3.5",
                                mark.color || "text-gray-500"
                              )}
                            />
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            className="text-xs px-2 py-1"
                          >
                            {mark.type} - {formatTime(mark.time)}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    );
                  });

                  return (
                    <React.Fragment key={`content-${employee.id}`}>
                      {barLayer}
                      {markingLayer}
                    </React.Fragment>
                  );
                })}
              </div>
              {/* ================================================================== */}
              {/* =================== FIN CAMBIO IMPORTANTE =================== */}
              {/* ================================================================== */}
            </div>{" "}
            {/* Fin Contenedor Interno Timeline */}
          </div>{" "}
          {/* Fin Área de Timeline Scrollable */}
        </div>{" "}
        {/* Fin Contenedor Principal Flex */}
        {/* --- Modales (Sin cambios) --- */}
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
          } para ${formatInputDate(currentDate)}`}
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
          title="Confirmar Pegado"
          size="sm"
        >
          <div className="p-5">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-yellow-500 mr-3" />
              <p className="text-gray-700 font-medium">¿Está seguro?</p>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              Esta acción puede sobrescribir datos para{" "}
              {employeesToDisplay.find((e) => e.id === pasteEmployeeId)?.name}{" "}
              en la fecha {formatInputDate(currentDate)}.
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
        {/* --- Menú Contextual (Sin cambios) --- */}
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
                menuState.data.formattedDateTime || "Fecha/Hora ??"
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
        {/* --- Toasts (Sin cambios) --- */}
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
      </TooltipProvider>
    );
  }
);

TimelineView.displayName = "TimelineView";
export default TimelineView;
