/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/views/TimelineView.tsx
"use client";

import React, { useState, useCallback, useRef, forwardRef } from "react";
import { cn } from "../../lib/utils";
import {
  MapPin,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info as InfoIcon,
  X,
} from "lucide-react";
import { format, set, getDay, isValid } from "date-fns"; // Importar set y getDay de date-fns
import { es } from "date-fns/locale"; // Para formatear día de la semana en español si es necesario

// --- Componentes UI (Asegúrate que las rutas sean correctas) ---
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Button } from "../ui/button";
import { Modal } from "./forms/Modal"; // Asume existe Modal genérico
import { CustomContextMenu } from "./menus/CustomContextMenu";

// --- Contenidos Menús Contextuales (Asegúrate que las rutas sean correctas) ---
import { WorkedBarContextMenuContent } from "./menus/WorkedBarContextMenu";
import { GridCellContextMenuContent } from "./menus/GridCellContextMenu";
import { EmployeeContextMenuContent } from "./menus/EmployeeContextMenu";

// --- Formularios y Tablas Modales (Asegúrate que las rutas sean correctas) ---
import { AddMarkingForm } from "./forms/AddMarkingForm";
import { AddLeaveForm } from "./forms/AddLeaveForm";
import { AddShiftForm } from "./forms/AddShiftForm";
import { EmployeeMarkingsTable } from "./forms/EmployeeMarkingsTable";
import { WorkDetailModal } from "./forms/WorkDetailModal";
import { ConfirmDeleteModal } from "./forms/ConfirmDeleteModal";

// --- Interfaces y Tipos (Podrían estar en archivos separados) ---
import type { Employee } from "../../interfaces/Employee"; // Asume existe esta interfaz
import type { Marking as OriginalMarking } from "../../interfaces/Marking"; // Asume existe esta interfaz

// --- Datos Mock (IMPORTANTE: Adapta las rutas y la estructura si es necesario) ---
import {
  mockEmployees, // Usaremos los mismos empleados mock
  mockMarkings, // Usaremos marcajes mock (filtrados por día)
  mockSchedules, // Usaremos horarios mock (filtrados por día)
  mockWorkedTimes, // Usaremos tiempos trabajados mock (filtrados por día)
} from "../../tem/week_view"; // O la ruta correcta a tus datos mock

// --- Constantes de Layout (Ajustadas de WeekView y TimelineView original) ---
const EMPLOYEE_COL_WIDTH = 200; // Mantenido de TimelineView
const HEADER_HEIGHT = 40; // Común
const HOUR_WIDTH = 80; // Común
const ROW_HEIGHT = 65; // Ajustado a WeekView para consistencia visual
// const TOTAL_LEFT_WIDTH = EMPLOYEE_COL_WIDTH; // No necesitamos día aquí

// --- Helper para obtener dayKey de WeekView desde Date ---
const getDayKey = (date: Date): string | null => {
  if (!isValid(date)) return null;
  const dayIndex = getDay(date); // 0 (Sun) to 6 (Sat)
  // Mapeo basado en los 'days' de WeekView (Lun-Sáb)
  const keys = [null, "lun", "mar", "mié", "jue", "vie", "sáb"]; // Domingo es 0 -> null
  return keys[dayIndex] || null; // Devuelve null si es domingo o inválido
};

// --- Interfaces de Estado (Adaptadas de WeekView) ---
interface MenuState {
  isOpen: boolean;
  position: { x: number; y: number };
  type: "worked" | "grid" | "employee" | null;
  data: any; // employeeId, calculatedTime, scheduleId, workedId, type, etc.
}

interface ModalFormData {
  employeeId: string;
  // dayKey?: string; // No es necesario si siempre usamos currentDate
  initialDate: string; // Formato 'yyyy-MM-dd'
  initialTime: string; // Formato 'HH:mm'
  currentDate: Date; // Pasamos la fecha actual para contexto
}

interface ToastState {
  id: number;
  isVisible: boolean;
  message: string;
  type: "success" | "info" | "warning" | "error";
}

interface DetailModalData {
  id: string; // scheduleId o workedId
  type: string; // 'schedule', 'regular', 'overtime'
  employeeName: string;
  employeeDept?: string;
  date: string; // Formateada (ej: 'lun 28/04/2024') -> Ahora será la fecha actual
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

// --- Interfaz de Props para TimelineView ---
interface TimelineViewProps {
  currentDate: Date;
  // Ya no necesitamos events, markings, employees como props si usamos mocks
  // employees: Employee[]; // Recibimos la lista completa o seleccionada
  selectedEmployees?: Employee[]; // Opcional para filtrar
  containerWidth?: number; // Puede ser útil si el padre lo conoce
  containerHeight?: number; // Puede ser útil si el padre lo conoce
  // Refs son opcionales ahora que la lógica está más autocontenida
  timelineContentRef?: React.RefObject<HTMLDivElement>;
  timelineMainScrollContainerRef?: React.RefObject<HTMLDivElement>;
}

// --- Componente GridRow (Reemplaza DroppableRow) ---
interface GridRowProps {
  employeeId: string;
  employeeIndex: number;
  rowWidth: number;
  currentDate: Date; // Pasar Date completo
  onContextMenu: (
    e: React.MouseEvent,
    type: "grid",
    data: { employeeId: string; calculatedTime: Date }
  ) => void;
  onDoubleClick?: (
    e: React.MouseEvent,
    employeeId: string,
    calculatedTime: Date
  ) => void; // Mantener si se necesita
  // Refs para cálculo de tiempo
  containerRef: React.RefObject<HTMLDivElement>;
  scrollContainerRef: React.RefObject<HTMLDivElement>;
}

const GridRow: React.FC<GridRowProps> = ({
  employeeId,
  employeeIndex,
  rowWidth,
  currentDate, // Usar Date
  onContextMenu,
  onDoubleClick, // Opcional
  containerRef,
  scrollContainerRef,
}) => {
  // Función para calcular la hora del evento del mouse (Adaptada)
  const getTimeFromMouseEvent = (e: React.MouseEvent): Date => {
    const containerRect = containerRef.current?.getBoundingClientRect();
    const scrollLeft = scrollContainerRef.current?.scrollLeft || 0;

    if (!containerRect || !containerRef.current) {
      console.warn("[GridRow] Cannot calculate time: refs missing.");
      return currentDate; // Fallback
    }

    // Calcular el offset X dentro del área del timeline
    // Asumiendo que el timeline empieza justo después de la columna de empleados
    const timelineAreaX = e.clientX - containerRect.left; // No sumar EMPLOYEE_COL_WIDTH aquí porque containerRect es del timeline
    const offsetX = timelineAreaX + scrollLeft;

    // Calcular la hora decimal (0-24)
    const timelineTotalWidth = 24 * HOUR_WIDTH;
    const hoursDecimal = (offsetX / timelineTotalWidth) * 24;

    // Validar y limpiar hora decimal
    const clampedHours = Math.max(0, Math.min(24, hoursDecimal || 0));
    if (isNaN(clampedHours)) return currentDate;

    // Convertir hora decimal a minutos totales desde medianoche
    const totalMinutes = Math.round(clampedHours * 60);
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;

    // Crear nueva fecha combinando la fecha actual con la hora calculada
    const finalDateTime = set(currentDate, {
      hours: hours,
      minutes: minutes,
      seconds: 0,
      milliseconds: 0,
    });

    return finalDateTime;
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
      // ref={setNodeRef} // Ya no es Droppable
      className={cn(
        "absolute border-b border-border cursor-context-menu hover:bg-blue-50/30" // Estilo similar a WeekView
      )}
      style={{
        top: `${employeeIndex * ROW_HEIGHT + HEADER_HEIGHT}px`,
        left: 0,
        height: `${ROW_HEIGHT}px`,
        width: `${rowWidth}px`,
        zIndex: 1, // Detrás de barras y pines
      }}
      onContextMenu={handleContextMenu}
      onDoubleClick={handleDoubleClick} // Mantener si se usa
    >
      {/* Líneas de la cuadrícula horaria (Igual que WeekView) */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
          <React.Fragment key={`hour-line-${hour}`}>
            <div
              className="absolute top-0 bottom-0 border-r border-gray-200" // Estilo WeekView
              style={{ left: `${hour * HOUR_WIDTH}px`, width: "1px" }}
            />
            {[15, 30, 45].map((minute) => (
              <div
                key={`minute-line-${hour}-${minute}`}
                className="absolute top-0 bottom-0 w-px bg-gray-100" // Estilo WeekView
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
      // Las refs son ahora menos críticas pero pueden pasarse si se necesitan externamente
      timelineContentRef: externalContentRef,
      timelineMainScrollContainerRef: externalScrollRef,
    },
    ref // Ref para el div principal si se necesita
  ) => {
    // --- Refs Internas ---
    const internalScrollRef = useRef<HTMLDivElement>(null);
    const internalContentRef = useRef<HTMLDivElement>(null);
    // Usar refs externas si se proporcionan, si no, usar las internas
    const timelineMainScrollContainerRef =
      externalScrollRef || internalScrollRef;
    const timelineContentRef = externalContentRef || internalContentRef;

    // --- Seleccionar Empleados a Mostrar ---
    // Usar selectedEmployees si se proveen, si no, usar mockEmployees
    const employeesToDisplay =
      selectedEmployees && selectedEmployees.length > 0
        ? selectedEmployees
        : mockEmployees; // Usar mocks si no hay selección

    const currentDayKey = getDayKey(currentDate); // Obtener 'lun', 'mar', etc.

    // --- Estado (Replicado de WeekView) ---
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
      markings: OriginalMarking[]; // Usar interfaz original si es necesario
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

    // --- Funciones Auxiliares (Replicadas/Adaptadas de WeekView) ---

    // Función formatTime (igual a WeekView)
    const formatTime = useCallback((decimalTime: number): string => {
      if (
        decimalTime == null ||
        isNaN(decimalTime) ||
        decimalTime < 0 ||
        decimalTime > 24
      ) {
        const now = new Date(); // O usar currentDate como base?
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

    // Formatear fecha para display (ej: Miércoles, 15 de Mayo de 2024)
    const formatDisplayDate = (date: Date): string => {
      return format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
    };
    // Formatear fecha corta para input/modales (ej: 2024-05-15)
    const formatInputDate = (date: Date): string => {
      return format(date, "yyyy-MM-dd");
    };

    // --- Toast Logic (Igual que WeekView) ---
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
        // Limitar toasts visibles (opcional)
        setToasts((prev) => [...prev.slice(-4), newToast]); // Mostrar máx 5
        setTimeout(() => {
          setToasts((prev) =>
            prev.map((t) =>
              t.id === newToast.id ? { ...t, isVisible: false } : t
            )
          );
          // Limpiar toasts invisibles después de la animación
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

    // --- Modal Logic (Igual que WeekView) ---
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

    // --- Context Menu Handler (Adaptado de WeekView) ---
    const handleContextMenu = useCallback(
      (
        event: React.MouseEvent<HTMLDivElement>, // Tipo de evento más específico
        type: "worked" | "grid" | "employee",
        data: any // Datos específicos del contexto (employeeId, scheduleId, workedId, calculatedTime, etc.)
      ) => {
        event.preventDefault();
        event.stopPropagation();
        closeAllModals();
        closeContextMenu();

        let processedData = { ...data };

        if (type === "grid") {
          // 'data' ya debería contener { employeeId, calculatedTime: Date } desde GridRow
          const calculatedTime = data.calculatedTime as Date;
          if (!calculatedTime || !isValid(calculatedTime)) {
            console.warn(
              "TimelineView: Invalid calculatedTime for grid context menu."
            );
            return; // No abrir menú si el tiempo es inválido
          }
          const formattedTime = format(calculatedTime, "HH:mm");
          const formattedDateStr = format(calculatedTime, "yyyy-MM-dd");
          const formattedDisplayDateTime = format(calculatedTime, "PPpp", {
            locale: es,
          }); // "15 may 2024, 14:30"

          processedData = {
            ...data,
            // clickedTimeDecimal: dateToDecimalTime(calculatedTime), // Podría ser útil
            formattedDateTime: formattedDisplayDateTime,
            initialDate: formattedDateStr, // Para formularios
            initialTime: formattedTime, // Para formularios
            currentDate: calculatedTime, // Pasar el objeto Date completo
          };
        } else if (type === "worked") {
          // Datos vienen del onContextMenu de la barra: { scheduleId?, workedId?, type: 'schedule'|'regular'|'overtime', employeeId }
          processedData.id = data.scheduleId || data.workedId;
          processedData.currentDate = currentDate; // Añadir fecha actual al contexto
          if (!processedData.id || !data.employeeId) {
            console.warn(
              "TimelineView: Datos incompletos para menú 'worked'. Faltan id o employeeId.",
              data
            );
            return; // No abrir si faltan datos clave
          }
        } else if (type === "employee") {
          // Datos vienen del onContextMenu del nombre: { employeeId }
          processedData.currentDate = currentDate; // Añadir fecha actual al contexto
        }

        setMenuState({
          isOpen: true,
          position: { x: event.clientX, y: event.clientY },
          type: type,
          data: processedData,
        });
      },
      [closeAllModals, closeContextMenu, currentDate, formatTime] // Dependencias
    );

    // --- Handlers para Acciones de Modales y Menús (Replicados/Adaptados de WeekView) ---

    // Abrir modales de formulario
    const openFormModal = (
      type: "marking" | "leave" | "shift",
      data: ModalFormData // Usar la interfaz actualizada
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
      // Aquí podrías añadir lógica para refetch datos si no usas mocks
      showToast(message, "success"); // Mostrar toast también
    };

    // --- Handlers Menú GRID ---
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
        // Shift usualmente empieza a las 00:00 del día por defecto
        openFormModal("shift", {
          employeeId,
          initialDate,
          initialTime: "00:00",
          currentDate,
        });
      }
    };

    // --- Handlers Menú EMPLOYEE ---
    const handleViewEmpMarkings = (empId: string) => {
      closeContextMenu();
      closeAllModals();
      const employee = employeesToDisplay.find((e) => e.id === empId);
      if (!employee) return;

      // Filtrar marcajes mock para ESTE empleado y ESTE día (currentDate)
      const employeeDayMarkings = mockMarkings
        .filter((m) => {
          // Asumimos m.time es decimal en mock, convertir currentDate a dayKey para comparar
          // O si m.time fuera una fecha string/Date, compararíamos directamente
          // Para mock de WeekView (con dayKey), necesitamos el dayKey de currentDate
          const markingDayKey = m.dayKey; // Asumiendo que el mock tiene dayKey
          return m.employeeId === empId && markingDayKey === currentDayKey;
        })
        .map((m): OriginalMarking => {
          // Adaptar a la interfaz OriginalMarking si es necesario
          // Convertir hora decimal a string HH:mm
          const timeStr = formatTime(m.time);
          // Reconstruir fecha completa (aproximada si solo tenemos hora decimal)
          const markingDate = set(currentDate, {
            hours: Math.floor(m.time),
            minutes: Math.round((m.time % 1) * 60),
            seconds: 0,
            milliseconds: 0,
          });

          return {
            id: m.id ?? `mock-mark-${Math.random()}`,
            employeeId: m.employeeId,
            // dayKey: m.dayKey, // Podría mantenerse
            time: format(markingDate, "yyyy-MM-dd'T'HH:mm:ss"), // Formato ISO string
            type: m.type as any, // Asumir tipo correcto
            icon: m.icon,
            color: m.color,
            // Añadir campos extra si OriginalMarking los requiere
            site: "Sede Mock",
            status: "VALID",
            details: `Mock ${m.type} at ${timeStr}`,
            createdBy: "Sistema Mock",
            dayKey: "",
            markingType: "",
            dateStr: "",
            timeFormatted: "",
          };
        })
        .sort(
          (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
        );

      setMarkingsModalData({
        employee: employee
          ? {
              ...employee,
              position: employee.position || "Sin Cargo", // Provide default value
              // Add other required properties with defaults if needed
            }
          : null,
        markings: employeeDayMarkings,
      });
      setIsMarkingsModalOpen(true);
    };
    // Copiar/Pegar (simulado igual que en WeekView)
    const handleCopyEmpLeave = (empId: string) => {
      console.log("Copiar Licencias Emp:", empId, "para fecha:", currentDate);
      showToast("Licencias y permisos copiados (simulado)", "success");
      closeContextMenu();
    };
    const handleCopyEmpSchedules = (empId: string) => {
      console.log("Copiar Horarios Emp:", empId, "para fecha:", currentDate);
      showToast("Horarios copiados (simulado)", "success");
      closeContextMenu();
    };
    const handleCopyEmpAll = (empId: string) => {
      console.log("Copiar Todo Emp:", empId, "para fecha:", currentDate);
      showToast("Todos los datos copiados (simulado)", "success");
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
        "para fecha:",
        currentDate
      );
      setIsPasteConfirmOpen(false);
      showToast(`Datos pegados en ${pasteEmployeeId} (simulado)`, "success");
      setPasteEmployeeId(null);
      // Aquí iría la lógica real de pegado y actualización de UI/datos
    };
    const handleCancelPaste = () => {
      setIsPasteConfirmOpen(false);
      setPasteEmployeeId(null);
    };

    // --- Handlers Menú WORKED (Barra) ---
    const handleViewDetailsWorked = useCallback(() => {
      if (
        menuState.type !== "worked" ||
        !menuState.data?.id ||
        !menuState.data.employeeId
      ) {
        console.error(
          "TimelineView: Datos insuficientes para ver detalles:",
          menuState.data
        );
        showToast("No se pueden mostrar los detalles (faltan datos).", "error");
        closeContextMenu();
        return;
      }

      const { id, type, employeeId } = menuState.data; // type es 'schedule', 'regular', 'overtime'
      const employee = employeesToDisplay.find((e) => e.id === employeeId);

      if (!employee) {
        console.error(
          "TimelineView: Empleado no encontrado para detalles:",
          employeeId
        );
        showToast("Empleado no encontrado.", "error");
        closeContextMenu();
        return;
      }

      let itemData: any = null;
      let startTimeDec = 0,
        endTimeDec = 0,
        label = undefined;

      // Buscar en mocks (¡NECESITA ADAPTACIÓN AL DÍA ACTUAL!)
      // Esto busca CUALQUIER schedule/worked del empleado, no necesariamente el del día correcto.
      // Para prototipo puede valer, pero en real necesita filtrar por fecha/dayKey.
      if (type === "schedule") {
        itemData = mockSchedules.find(
          (s) =>
            s.id === id &&
            s.employeeId === employeeId /* && s.dayKey === currentDayKey */
        );
      } else {
        // 'regular' or 'overtime' come from a workedTime
        itemData = mockWorkedTimes.find(
          (w) =>
            w.id === id &&
            w.employeeId === employeeId /* && w.dayKey === currentDayKey */
        );
      }

      if (!itemData) {
        console.error(
          `TimelineView: No se encontró ${type} con ID ${id} para ${employeeId}.`
        );
        showToast("No se encontraron datos para este elemento.", "warning");
        closeContextMenu();
        return;
      }

      startTimeDec = itemData.startTime ?? 0;
      endTimeDec = itemData.endTime ?? 0;
      label = itemData.label; // Solo para schedule

      // Si es 'regular' u 'overtime', necesitamos recalcular start/end basado en el schedule
      // Esto es complejo sin el schedule asociado. Simplificaremos para el prototipo.
      // Usaremos el start/end del workedTime completo si type es 'regular'/'overtime'.
      // En una implementación real, se necesitaría la lógica de WeekView que compara worked vs schedule.

      const durationHours = Math.max(0, endTimeDec - startTimeDec);
      const hours = Math.floor(durationHours);
      const minutes = Math.round((durationHours - hours) * 60);
      const dateString = formatDisplayDate(currentDate); // Usar la fecha actual formateada

      const detailPayload: DetailModalData = {
        id: id,
        type: type,
        employeeName: employee.name,
        employeeDept: employee.department || "N/A",
        date: dateString,
        startTime: formatTime(startTimeDec),
        endTime: formatTime(endTimeDec),
        duration: `${hours}h ${minutes}m`,
        label: label,
        status: type === "schedule" ? "Planificado" : "Registrado", // Simplificado
        details: `Mock Detalles (Timeline): ${type} ID ${id} para ${dateString}.`,
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
    ]);

    const handleCopyWorked = useCallback(() => {
      if (menuState.type !== "worked" || !menuState.data?.id) {
        console.warn("TimelineView: No hay datos válidos para copiar.");
        return;
      }
      const { type, id } = menuState.data;
      const textToCopy = `Tipo: ${type}, ID: ${id}, Fecha: ${formatInputDate(
        currentDate
      )}`;
      navigator.clipboard
        .writeText(textToCopy)
        .then(() => {
          showToast(`"${textToCopy}" copiado.`, "info");
        })
        .catch((err) => {
          console.error("TimelineView: Error al copiar:", err);
          showToast("Error al copiar.", "error");
        });
      closeContextMenu();
    }, [menuState, currentDate, showToast, closeContextMenu]);

    const handleDeleteWorked = useCallback(() => {
      if (
        menuState.type !== "worked" ||
        !menuState.data?.id ||
        !menuState.data.employeeId
      ) {
        console.error(
          "TimelineView: Datos insuficientes para eliminar:",
          menuState.data
        );
        showToast("No se puede eliminar (faltan datos).", "error");
        closeContextMenu();
        return;
      }

      const { id, type, employeeId } = menuState.data;
      const employee = employeesToDisplay.find((e) => e.id === employeeId);
      const dateStr = format(currentDate, "dd/MM/yyyy");

      let itemName = `el elemento ${type} (ID: ${id})`;
      if (employee) {
        itemName = `el ${type} de ${employee.name} (${dateStr})`;
        // Podríamos buscar el label si es schedule para hacerlo más descriptivo
        if (type === "schedule") {
          const schedule = mockSchedules.find(
            (s) =>
              s.id === id &&
              s.employeeId === employeeId /* && s.dayKey === currentDayKey */
          );
          if (schedule?.label) {
            itemName = `el horario "${schedule.label}" de ${employee.name} (${dateStr})`;
          }
        }
      }

      setDeleteConfirmData({ id: id, type: type, itemName: itemName });
      setIsDeleteConfirmOpen(true);
      closeContextMenu();
    }, [
      menuState,
      employeesToDisplay,
      currentDate,
      closeContextMenu,
      showToast,
    ]);

    // Confirmar/Cancelar Borrado (igual que WeekView)
    const handleConfirmDelete = useCallback(() => {
      if (!deleteConfirmData) return;
      const { id, type, itemName } = deleteConfirmData;
      console.log(
        `TimelineView: BORRADO CONFIRMADO para ${type} ID: ${id} en fecha ${formatInputDate(
          currentDate
        )}`
      );
      // --- AQUÍ LÓGICA REAL DE BORRADO (API, etc.) ---
      closeAllModals();
      showToast(
        `${
          itemName.charAt(0).toUpperCase() + itemName.slice(1)
        } eliminado (simulado).`,
        "success"
      );
      // Quizás refetch o update local
    }, [deleteConfirmData, currentDate, showToast, closeAllModals]);

    const handleCancelDelete = useCallback(() => {
      closeAllModals();
    }, [closeAllModals]);

    // --- Double Click Handler (Opcional, podría llamar a AddMarking) ---
    const handleTimelineDoubleClick = (
      e: React.MouseEvent,
      employeeId: string,
      calculatedTime: Date
    ) => {
      console.log("[TimelineView] Double Click:", {
        employeeId,
        calculatedTime,
      });
      // Podríamos abrir directamente el modal de marcaje
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
    const hoursToDisplay = Array.from({ length: 24 }, (_, i) => i); // 0-23

    // --- Estilos CSS (Igual que WeekView) ---
    const stripeCSS = `.bg-stripes-pattern { background-image: repeating-linear-gradient(-45deg, rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0.7) 4px, transparent 4px, transparent 8px); background-color: transparent; }`;
    const toastBaseClasses =
      "fixed bottom-5 right-5 z-[100] max-w-sm w-full p-4 rounded-lg shadow-lg flex items-start space-x-3 transition-all duration-300 ease-in-out";
    const toastTypeClasses = {
      /* ... (igual que WeekView) ... */
      success: "bg-green-100 border border-green-300 text-green-800",
      info: "bg-blue-100 border border-blue-300 text-blue-800",
      warning: "bg-yellow-100 border border-yellow-300 text-yellow-800",
      error: "bg-red-100 border border-red-300 text-red-800",
    };
    const toastIcon = {
      /* ... (igual que WeekView) ... */
      success: <CheckCircle className="h-5 w-5 text-green-600" />,
      info: <InfoIcon className="h-5 w-5 text-blue-600" />,
      warning: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
      error: <XCircle className="h-5 w-5 text-red-600" />,
    };

    // --- Renderizado ---
    if (totalNumberOfEmployees === 0) {
      return (
        <div className="flex justify-center items-center h-60 text-muted-foreground">
          No hay datos de empleados para mostrar.
        </div>
      );
    }

    return (
      <TooltipProvider>
        <style>{stripeCSS}</style>
        {/* Contenedor principal (similar a WeekView, maneja clicks para cerrar menú) */}
        <div
          ref={ref || timelineMainScrollContainerRef} // Usar ref externa o interna
          className="h-full w-full overflow-auto border border-border rounded-md bg-card text-card-foreground relative flex" // Añadido flex aquí
          onClick={(e) => {
            // Cerrar menú si se hace clic fuera de él
            if (
              menuState.isOpen &&
              !(e.target as Element).closest(".custom-context-menu")
            ) {
              closeContextMenu();
            }
          }}
        >
          {/* Columna Fija de Empleados (Adaptada con Tooltip y ContextMenu) */}
          <div
            className="sticky left-0 z-30 shrink-0 border-r border-border shadow-sm flex flex-col bg-white" // Añadido flex flex-col
            style={{
              width: `${EMPLOYEE_COL_WIDTH}px`,
              // Altura debería ajustarse al contenido o usar la prop containerHeight
              minHeight: `${totalTimelineHeight}px`, // Asegurar que al menos cubra el timeline
            }}
          >
            {/* Header Esquina (Mantenido) */}
            <div
              className="border-b border-border p-2 flex items-center justify-center font-medium text-sm sticky top-0 bg-white z-10" // bg-white para consistencia
              style={{ height: `${HEADER_HEIGHT}px` }}
            >
              {format(currentDate, "EEE dd/MM", { locale: es })}{" "}
              {/* Formato corto */}
            </div>
            {/* Lista de Nombres con Tooltip y ContextMenu */}
            <div className="flex-1">
              {" "}
              {/* Div para que los nombres ocupen espacio */}
              {employeesToDisplay.map((employee) => (
                <div
                  key={employee.id}
                  // Contenedor para el nombre del empleado, captura ContextMenu
                  onContextMenu={(e) =>
                    handleContextMenu(e, "employee", {
                      employeeId: employee.id,
                    })
                  }
                  className="border-b border-border flex items-center px-2 cursor-context-menu group hover:bg-gray-50" // Estilo WeekView
                  style={{ height: `${ROW_HEIGHT}px` }}
                >
                  <Tooltip delayDuration={150}>
                    <TooltipTrigger asChild>
                      {/* Contenido interno para el tooltip */}
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
                      className="bg-slate-800 text-white p-3 rounded-md shadow-lg text-xs border border-slate-700 w-60 z-50" // z-50 para estar sobre timeline
                    >
                      {/* Contenido del Tooltip (Mock Data como en WeekView) */}
                      <div className="font-bold text-sm mb-2">
                        {employee.name}
                      </div>
                      <div className="space-y-1">
                        <div>
                          <span className="font-medium">Documento:</span>{" "}
                          {employee.documentNumber ?? "N/A"}
                        </div>
                        <div>
                          <span className="font-medium">Tipo Persona:</span>{" "}
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
                        {/* Podríamos añadir datos agregados del DÍA si los tuviéramos */}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </div>
              ))}
            </div>
            {/* <div style={{ height: "20px" }}></div> Espacio extra opcional */}
          </div>
          {/* Área de Timeline Scrollable (Contenido Principal) */}
          <div className="flex-1 min-w-0 relative">
            {/* Contenedor interno que define el tamaño total */}
            <div
              ref={timelineContentRef} // Usar ref interna o externa
              className="relative"
              style={{
                width: `${totalTimelineContentWidth}px`,
                height: `${totalTimelineHeight}px`,
              }}
            >
              {/* Cabecera de Horas (Igual que WeekView, ajustado a 24h) */}
              <div
                className="sticky top-0 z-20 flex border-b border-border bg-blue-100"
                style={{
                  height: `${HEADER_HEIGHT}px`,
                  width: `${totalTimelineContentWidth}px`, // Ancho total
                }}
              >
                {hoursToDisplay.map((hour) => (
                  <div
                    key={`header-${hour}`}
                    className="shrink-0 border-r border-blue-200 px-2 text-center text-xs font-medium flex items-center justify-center text-blue-800" // Estilo WeekView
                    style={{ width: `${HOUR_WIDTH}px` }}
                  >
                    {`${hour.toString().padStart(2, "0")}:00`}
                  </div>
                ))}
              </div>
              {/* Grid Background (Usando GridRow) */}
              {employeesToDisplay.map((employee, index) => (
                <GridRow
                  key={`${employee.id}-gridrow`}
                  employeeId={employee.id}
                  employeeIndex={index}
                  rowWidth={totalTimelineContentWidth}
                  currentDate={currentDate}
                  onContextMenu={handleContextMenu} // Pasa el handler principal
                  onDoubleClick={handleTimelineDoubleClick} // Pasa el handler de doble clic
                  containerRef={timelineContentRef} // Pasa ref del contenido
                  scrollContainerRef={timelineMainScrollContainerRef} // Pasa ref del scroll
                />
              ))}
              {/* Capa para Renderizar Contenido Visual (Barras y Pines - Estilo WeekView) */}
              <div className="absolute top-0 left-0 w-full h-full z-10 pointer-events-none">
                {employeesToDisplay.map((employee, employeeIndex) => {
                  // --- Buscar Datos Mock para este Empleado y Día ---
                  // IMPORTANTE: Esta lógica asume que los mocks usan 'dayKey'.
                  // Si tus mocks usan fechas, la lógica de filtrado cambiará.
                  const actualSchedule = mockSchedules.find(
                    (s) =>
                      s.employeeId === employee.id && s.dayKey === currentDayKey
                  );
                  const actualWorked = mockWorkedTimes.find(
                    (w) =>
                      w.employeeId === employee.id && w.dayKey === currentDayKey
                  );
                  const actualMarkings = mockMarkings.filter(
                    (m) =>
                      m.employeeId === employee.id && m.dayKey === currentDayKey
                  );

                  // --- Contenedores para elementos ---
                  const barLayer: React.ReactNode[] = [];
                  const markingLayer: React.ReactNode[] = [];
                  const topOffset = employeeIndex * ROW_HEIGHT + HEADER_HEIGHT;

                  // --- Lógica de Renderizado de Barras (Adaptada de WeekView) ---
                  if (actualSchedule) {
                    const left = actualSchedule.startTime * HOUR_WIDTH;
                    const width =
                      (actualSchedule.endTime - actualSchedule.startTime) *
                      HOUR_WIDTH;
                    const verticalPosition = topOffset + ROW_HEIGHT * 0.5; // Centro vertical
                    const barHeight = ROW_HEIGHT * 0.25; // Altura barra horario

                    if (width > 0.1) {
                      barLayer.push(
                        <div
                          key={`sched-${employee.id}`}
                          onContextMenu={(e) =>
                            handleContextMenu(e, "worked", {
                              scheduleId: actualSchedule.id,
                              type: "schedule",
                              employeeId: employee.id,
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
                            zIndex: 5, // Horario debajo de trabajado
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

                      // Renderizar Ausencias (si hay horario pero no trabajado, o parcial)
                      const absenceVerticalPosition =
                        topOffset + ROW_HEIGHT * 0.18; // Coincide con trabajado
                      const absenceHeight = ROW_HEIGHT * 0.25;

                      if (actualWorked) {
                        // Ausencia al inicio
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
                                key={`abs-start-${employee.id}`}
                                className={cn(
                                  "absolute bg-red-200 rounded-sm overflow-hidden pointer-events-none"
                                )}
                                style={{
                                  top: `${absenceVerticalPosition}px`,
                                  left: `${
                                    actualSchedule.startTime * HOUR_WIDTH
                                  }px`,
                                  width: `${aWidth}px`,
                                  height: `${absenceHeight}px`,
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
                        // Ausencia al final
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
                                key={`abs-end-${employee.id}`}
                                className={cn(
                                  "absolute bg-red-200 rounded-sm overflow-hidden pointer-events-none"
                                )}
                                style={{
                                  top: `${absenceVerticalPosition}px`,
                                  left: `${aStart * HOUR_WIDTH}px`,
                                  width: `${aWidth}px`,
                                  height: `${absenceHeight}px`,
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
                        // Ausencia total (hay horario, no trabajado)
                        const aWidth =
                          (actualSchedule.endTime - actualSchedule.startTime) *
                          HOUR_WIDTH;
                        if (aWidth > 0.1)
                          barLayer.push(
                            <div
                              key={`abs-full-${employee.id}`}
                              className={cn(
                                "absolute bg-red-200 rounded-sm overflow-hidden pointer-events-none"
                              )}
                              style={{
                                top: `${absenceVerticalPosition}px`,
                                left: `${
                                  actualSchedule.startTime * HOUR_WIDTH
                                }px`,
                                width: `${aWidth}px`,
                                height: `${absenceHeight}px`,
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
                  }

                  // Renderizar Tiempo Trabajado (Regular/Overtime)
                  if (actualWorked) {
                    const workedStart = actualWorked.startTime;
                    const workedEnd = actualWorked.endTime;
                    // Usar el horario encontrado (si existe) para calcular regular/overtime
                    const scheduleStart =
                      actualSchedule?.startTime ?? -Infinity;
                    const scheduleEnd = actualSchedule?.endTime ?? Infinity;

                    const regularStart = Math.max(workedStart, scheduleStart);
                    const regularEnd = Math.min(workedEnd, scheduleEnd);
                    const regularWidth =
                      regularEnd > regularStart
                        ? (regularEnd - regularStart) * HOUR_WIDTH
                        : 0;

                    // Overtime = lo trabajado FUERA del horario (antes o después)
                    // Overtime antes:
                    const overtimeStartBefore = workedStart;
                    const overtimeEndBefore = Math.min(
                      workedEnd,
                      scheduleStart
                    );
                    const overtimeWidthBefore =
                      overtimeEndBefore > overtimeStartBefore
                        ? (overtimeEndBefore - overtimeStartBefore) * HOUR_WIDTH
                        : 0;

                    // Overtime después:
                    const overtimeStartAfter = Math.max(
                      workedStart,
                      scheduleEnd
                    );
                    const overtimeEndAfter = workedEnd;
                    const overtimeWidthAfter =
                      overtimeEndAfter > overtimeStartAfter
                        ? (overtimeEndAfter - overtimeStartAfter) * HOUR_WIDTH
                        : 0;

                    const verticalPosition = topOffset + ROW_HEIGHT * 0.18; // Misma altura que ausencia
                    const barHeight = ROW_HEIGHT * 0.25;

                    // Barra Regular
                    if (regularWidth > 0.1) {
                      barLayer.push(
                        <div
                          key={`workR-${employee.id}`}
                          onContextMenu={(e) =>
                            handleContextMenu(e, "worked", {
                              workedId: actualWorked.id,
                              type: "regular", // O podría ser simplemente 'worked'
                              employeeId: employee.id,
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
                          title={`Trabajado Regular (${formatTime(
                            regularStart
                          )} - ${formatTime(regularEnd)})`}
                        />
                      );
                    }
                    // Barra Overtime (Antes)
                    if (overtimeWidthBefore > 0.1) {
                      barLayer.push(
                        <div
                          key={`workOTB-${employee.id}`}
                          onContextMenu={(e) =>
                            handleContextMenu(e, "worked", {
                              workedId: actualWorked.id,
                              type: "overtime",
                              employeeId: employee.id,
                            })
                          }
                          className={cn(
                            "absolute bg-yellow-400 rounded-sm pointer-events-auto cursor-context-menu"
                          )}
                          style={{
                            top: `${verticalPosition}px`,
                            left: `${overtimeStartBefore * HOUR_WIDTH}px`,
                            width: `${overtimeWidthBefore}px`,
                            height: `${barHeight}px`,
                            zIndex: 14,
                          }}
                          title={`Trabajado Overtime (${formatTime(
                            overtimeStartBefore
                          )} - ${formatTime(overtimeEndBefore)})`}
                        />
                      );
                    }
                    // Barra Overtime (Después)
                    if (overtimeWidthAfter > 0.1) {
                      barLayer.push(
                        <div
                          key={`workOTA-${employee.id}`}
                          onContextMenu={(e) =>
                            handleContextMenu(e, "worked", {
                              workedId: actualWorked.id,
                              type: "overtime",
                              employeeId: employee.id,
                            })
                          }
                          className={cn(
                            "absolute bg-yellow-400 rounded-sm pointer-events-auto cursor-context-menu"
                          )}
                          style={{
                            top: `${verticalPosition}px`,
                            left: `${overtimeStartAfter * HOUR_WIDTH}px`,
                            width: `${overtimeWidthAfter}px`,
                            height: `${barHeight}px`,
                            zIndex: 14,
                          }}
                          title={`Trabajado Overtime (${formatTime(
                            overtimeStartAfter
                          )} - ${formatTime(overtimeEndAfter)})`}
                        />
                      );
                    }
                  }

                  // Renderizar Marcajes (Pines - Lógica WeekView)
                  actualMarkings.forEach((mark, index) => {
                    const pinLeft = mark.time * HOUR_WIDTH; // Asume time es decimal
                    const IconComponent = mark.icon || MapPin; // Usa icono del mock o default
                    const pinTop = topOffset + ROW_HEIGHT - ROW_HEIGHT * 0.15; // Cerca del fondo de la fila

                    markingLayer.push(
                      <div
                        key={`mark-${employee.id}-${index}`}
                        className={cn(
                          "absolute z-30 flex items-center justify-center pointer-events-auto"
                        )} // Interactuable
                        style={{
                          top: `${pinTop}px`,
                          left: `${pinLeft}px`,
                          transform: "translate(-50%, -50%)", // Centrar el icono
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

                  // Devolver las capas para este empleado
                  return (
                    <React.Fragment key={`content-${employee.id}`}>
                      {barLayer}
                      {markingLayer}
                    </React.Fragment>
                  );
                })}
              </div>{" "}
              {/* Fin Capa Contenido Visual */}
            </div>{" "}
            {/* Fin Contenedor Interno Timeline */}
          </div>{" "}
          {/* Fin Área de Timeline Scrollable */}
        </div>{" "}
        {/* Fin Contenedor Principal Flex */}
        {/* --- Modales (Renderizado igual que WeekView) --- */}
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
              // Pasar props requeridas por AddMarkingForm
              initialDate={formModalData.initialDate}
              initialTime={formModalData.initialTime}
              // currentDate={formModalData.currentDate} // Pasar fecha si es útil
              onClose={closeAllModals}
              onSubmitSuccess={handleFormSuccess}
            />
          )}
          {formModalType === "leave" && formModalData && (
            <AddLeaveForm
              // Pasar props requeridas por AddLeaveForm
              initialStartDate={formModalData.initialDate}
              initialStartTime={formModalData.initialTime}
              onClose={closeAllModals}
              onSubmitSuccess={handleFormSuccess}
            />
          )}
          {formModalType === "shift" && formModalData && (
            <AddShiftForm
              // Pasar props requeridas por AddShiftForm
              initialStartDate={formModalData.initialDate}
              // Pasar día específico si es necesario (o se calcula dentro)
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
          size="xl" // O el tamaño adecuado para la tabla
        >
          <div className="p-0">
            {" "}
            {/* Ajustar padding si es necesario */}
            {markingsModalData.employee && (
              <EmployeeMarkingsTable
                markings={markingsModalData.markings} // Pasa los marcajes filtrados
                employeeName={markingsModalData.employee.name}
                // Podrías pasar la fecha si la tabla la necesita
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
          detailData={detailModalData} // Pasa los datos formateados
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
        {/* --- Menú Contextual (Renderizado igual que WeekView) --- */}
        <CustomContextMenu
          isOpen={menuState.isOpen}
          position={menuState.position}
          onClose={closeContextMenu}
          className="custom-context-menu" // Clase para evitar cierre al hacer clic dentro
        >
          {menuState.type === "worked" && menuState.data && (
            <WorkedBarContextMenuContent
              // Pasar los handlers correctos
              onViewDetails={handleViewDetailsWorked}
              onCopy={handleCopyWorked}
              onDelete={handleDeleteWorked}
            />
          )}
          {menuState.type === "grid" && menuState.data && (
            <GridCellContextMenuContent
              // Pasar datos relevantes del grid
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
              // Pasar los handlers correctos usando employeeId
              onViewMarkings={() =>
                handleViewEmpMarkings(menuState.data.employeeId)
              }
              onCopyLeave={() => handleCopyEmpLeave(menuState.data.employeeId)}
              onCopySchedules={() =>
                handleCopyEmpSchedules(menuState.data.employeeId)
              }
              onCopyAll={() => handleCopyEmpAll(menuState.data.employeeId)}
              onPaste={() => handlePasteEmp(menuState.data.employeeId)}
              // Podríamos deshabilitar pegar si no hay nada copiado
            />
          )}
        </CustomContextMenu>
        {/* --- Renderizado de Toasts (Igual que WeekView) --- */}
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
