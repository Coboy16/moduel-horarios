/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { useState, useCallback, useRef } from "react";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  getDay,
  isBefore,
  startOfDay,
  isAfter,
} from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "../../utils/formatters";
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info as InfoIcon,
  X,
} from "lucide-react";

// Tooltip & Button
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Button } from "../ui/button";

// Componentes Menú y Timeline
import { CustomContextMenu } from "./menus/CustomContextMenu";
import { WorkedBarContextMenuContent } from "./menus/WorkedBarContextMenu";
import { GridCellContextMenuContent } from "./menus/GridCellContextMenu";
import { DayTimeline } from "./DayTimeline";

// --- Componentes de Formulario y Modal ---
import { Modal } from "./forms/Modal";
import { AddMarkingForm } from "./forms/AddMarkingForm";
import { AddLeaveForm } from "./forms/AddLeaveForm";
import { AddShiftForm } from "./forms/AddShiftForm";
import { WorkDetailModal } from "./forms/WorkDetailModal";
import { ConfirmDeleteModal } from "./forms/ConfirmDeleteModal";

// Mock Data
import {
  Employee,
  mockEmployees,
  mockMarkings,
  mockSchedules,
  mockWorkedTimes,
} from "../../tem/week_view";

// Hook Filtros
const useFilters = () => ({
  dateRange: { start: new Date(), end: endOfMonth(new Date()) },
});

// Props
interface MonthViewProps {
  employees?: Employee[];
}

// Estado Menú Contextual
interface MenuState {
  isOpen: boolean;
  position: { x: number; y: number };
  type: "worked" | "grid" | null;
  data: any;
}
const initialMenuState: MenuState = {
  isOpen: false,
  position: { x: 0, y: 0 },
  type: null,
  data: null,
};

// Interface para datos del formulario modal (ya existente)
interface ModalFormData {
  employeeId: string;
  dayKey: string;
  initialDate: string;
  initialTime: string;
}

// --- (NUEVO) Interfaces para estados de Modales/Toasts de Barra ---
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
// --- Fin Nuevas Interfaces ---

// Mapeo día
const dayKeyMap: { [key: number]: string } = {
  1: "lun",
  2: "mar",
  3: "mié",
  4: "jue",
  5: "vie",
  6: "sáb",
  0: "dom",
};

// Componente Principal
export default function MonthView({ employees }: MonthViewProps) {
  const { dateRange } = useFilters();
  const [menuState, setMenuState] = useState<MenuState>(initialMenuState);

  // Estados Modales Formularios
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formModalType, setFormModalType] = useState<
    "marking" | "leave" | "shift" | null
  >(null);
  const [formModalData, setFormModalData] = useState<ModalFormData | null>(
    null
  );
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // --- (NUEVO) Estados para Toasts y Modales de Barra ---
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailModalData, setDetailModalData] =
    useState<DetailModalData | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteConfirmData, setDeleteConfirmData] =
    useState<DeleteConfirmData | null>(null);
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const toastIdRef = useRef(0);
  // --- Fin Nuevos Estados ---

  const employeesToDisplay =
    employees && employees.length > 0 ? employees : mockEmployees;

  // Lógica Un Mes
  const displayMonthDate = startOfMonth(dateRange.start);
  const monthStart = startOfMonth(displayMonthDate);
  const monthEnd = endOfMonth(displayMonthDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const allDaysInMonthView = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });
  const monthWeeks: Date[][] = [];
  let week: Date[] = [];
  allDaysInMonthView.forEach((day, i) => {
    week.push(day);
    if ((i + 1) % 7 === 0) {
      monthWeeks.push(week);
      week = [];
    }
  });
  const todayDate = startOfDay(new Date());

  // --- Helpers ---
  const getDayKeyFromDate = (date: Date): string =>
    dayKeyMap[getDay(date)] || "unknown";

  const formatDecimalTime = useCallback((decimalTime: number): string => {
    if (isNaN(decimalTime) || decimalTime < 0 || decimalTime > 24)
      return "00:00";
    const totalMinutes = Math.round(decimalTime * 60);
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
  }, []);
  // --- Fin Helpers ---

  // --- (NUEVO) Funciones Toast ---
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
  // --- Fin Funciones Toast ---

  // --- Funciones para manejar modales ---

  const closeAllModals = useCallback(() => {
    setIsFormModalOpen(false);
    setFormModalType(null);
    setFormModalData(null);
    setIsSuccessModalOpen(false);
    setSuccessMessage("");
    setIsDetailModalOpen(false);
    setDetailModalData(null);
    setIsDeleteConfirmOpen(false);
    setDeleteConfirmData(null);
  }, []);

  const handleFormSuccess = useCallback(
    (message: string) => {
      closeAllModals();
      setSuccessMessage(message);
      setIsSuccessModalOpen(true);
    },
    [closeAllModals]
  );

  const closeContextMenu = useCallback(() => {
    setMenuState(initialMenuState);
  }, []);
  // --- Fin Funciones para manejar modales ---
  const openFormModal = useCallback(
    (type: "marking" | "leave" | "shift", data: ModalFormData) => {
      closeContextMenu();
      closeAllModals();
      setFormModalData(data);
      setFormModalType(type);
      setIsFormModalOpen(true);
    },
    [closeAllModals, closeContextMenu]
  );
  // --- Handlers Menú y Acciones ---
  const handleContextMenu = useCallback(
    (
      event: React.MouseEvent<HTMLDivElement>,
      type: "worked" | "grid",
      data: any
    ) => {
      event.preventDefault();
      event.stopPropagation();
      closeContextMenu();
      closeAllModals();

      let processedData = { ...data };

      if (type === "worked") {
        processedData.id = data.scheduleId || data.workedId;
        if (!processedData.id || !data.employeeId || !data.date) {
          console.warn(
            "MonthView: Datos incompletos recibidos para menú 'worked'. Faltan id, employeeId o date.",
            data
          );
        }
      } else if (type === "grid") {
        processedData = {
          employeeId: data.employeeId,
          date: data.date,
          formattedDateTime: `${format(data.date, "P", { locale: es })}`,
        };
      }

      setMenuState({
        isOpen: true,
        position: { x: event.clientX, y: event.clientY },
        type: type,
        data: processedData,
      });
    },
    [closeContextMenu, closeAllModals]
  );

  // --- (NUEVO) Handlers específicos para acciones de barra ---
  const handleViewDetailsWorked = useCallback(() => {
    if (
      menuState.type !== "worked" ||
      !menuState.data?.id ||
      !menuState.data.employeeId ||
      !menuState.data.date
    ) {
      console.error(
        "MonthView: Datos insuficientes en menuState para ver detalles:",
        menuState.data
      );
      showToast("No se pueden mostrar los detalles (faltan datos).", "error");
      closeContextMenu();
      return;
    }

    const { id, type, employeeId, date } = menuState.data;
    const employee = employeesToDisplay.find((e) => e.id === employeeId);
    if (!employee) {
      console.error(
        "MonthView: Empleado no encontrado para detalles:",
        employeeId
      );
      showToast("Empleado no encontrado.", "error");
      closeContextMenu();
      return;
    }

    let itemData: any = null;
    let startTime = 0,
      endTime = 0,
      label = undefined;

    if (type === "schedule") {
      itemData = mockSchedules.find((s) => s.id === id);
    } else {
      itemData = mockWorkedTimes.find((w) => w.id === id);
    }

    if (!itemData) {
      console.error(
        `MonthView: No se encontró ${type} con ID ${id} en los mocks.`
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

    const detailPayload: DetailModalData = {
      id: id,
      type: type,
      employeeName: employee.name,
      employeeDept: employee.department || "N/A",
      date: format(date, "eee dd/MM/yyyy", { locale: es }),
      startTime: formatDecimalTime(startTime),
      endTime: formatDecimalTime(endTime),
      duration: `${hours}h ${minutes}m`,
      label: label,
      status: type === "schedule" ? "Planificado" : "Registrado",
      details: `Este es un detalle mock para ${type} ID ${id}. Obtenido de datos simulados.`,
    };

    setDetailModalData(detailPayload);
    setIsDetailModalOpen(true);
    closeContextMenu();
  }, [
    menuState,
    employeesToDisplay,
    formatDecimalTime,
    showToast,
    closeContextMenu,
  ]);

  const handleCopyWorked = useCallback(() => {
    if (menuState.type !== "worked" || !menuState.data?.id) {
      console.warn("MonthView: No hay datos válidos para copiar.");
      return;
    }
    const { type, id } = menuState.data;

    const textToCopy = `Tipo: ${type}, ID: ${id}`;
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        showToast(`"${textToCopy}" copiado al portapapeles.`, "info");
      })
      .catch((err) => {
        console.error("MonthView: Error al copiar al portapapeles:", err);
        showToast("Error al intentar copiar.", "error");
      });
    closeContextMenu();
  }, [menuState, showToast, closeContextMenu]);

  const handleDeleteWorked = useCallback(() => {
    if (
      menuState.type !== "worked" ||
      !menuState.data?.id ||
      !menuState.data.employeeId ||
      !menuState.data.date
    ) {
      console.error(
        "MonthView: Datos insuficientes para iniciar eliminación:",
        menuState.data
      );
      showToast("No se puede iniciar la eliminación (faltan datos).", "error");
      closeContextMenu();
      return;
    }

    const { id, type, employeeId, date } = menuState.data;
    const employee = employeesToDisplay.find((e) => e.id === employeeId);

    let itemName = `el elemento ${type} (ID: ${id})`;
    if (employee) {
      itemName = `el ${type} de ${employee.name} del ${format(
        date,
        "dd/MM/yyyy",
        { locale: es }
      )}`;
      if (type === "schedule") {
        const schedule = mockSchedules.find((s) => s.id === id);
        if (schedule?.label) {
          itemName = `el horario "${schedule.label}" de ${
            employee.name
          } del ${format(date, "dd/MM/yyyy", { locale: es })}`;
        }
      }
    }

    setDeleteConfirmData({ id: id, type: type, itemName: itemName });
    setIsDeleteConfirmOpen(true);
    closeContextMenu();
  }, [menuState, employeesToDisplay, closeContextMenu, showToast]);

  const handleConfirmDelete = useCallback(() => {
    if (!deleteConfirmData) {
      console.error(
        "MonthView: No hay datos en deleteConfirmData para confirmar."
      );
      return;
    }
    const { id, type, itemName } = deleteConfirmData;

    console.log(
      `MonthView: SOLICITUD DE BORRADO CONFIRMADA para ${type} con ID: ${id}`
    );

    closeAllModals();
    showToast(
      `${
        itemName.charAt(0).toUpperCase() + itemName.slice(1)
      } ha sido eliminado (simulado).`,
      "success"
    );
  }, [deleteConfirmData, showToast, closeAllModals]);

  const handleCancelDelete = useCallback(() => {
    closeAllModals();
  }, [closeAllModals]);
  // --- Fin Handlers Acciones Barra ---

  // Handlers para acciones del menú de celda (ya existentes, sin cambios)
  const handleAddMarking = useCallback(() => {
    if (menuState.type === "grid" && menuState.data) {
      const { employeeId, date } = menuState.data;
      const dayKey = getDayKeyFromDate(date);
      const initialDate = format(date, "yyyy-MM-dd");
      const initialTime = "09:00";
      openFormModal("marking", {
        employeeId,
        dayKey,
        initialDate,
        initialTime,
      });
    }
  }, [menuState, openFormModal]);

  const handleAddLeave = useCallback(() => {
    if (menuState.type === "grid" && menuState.data) {
      const { employeeId, date } = menuState.data;
      const dayKey = getDayKeyFromDate(date);
      const initialDate = format(date, "yyyy-MM-dd");
      const initialTime = "00:00";
      openFormModal("leave", { employeeId, dayKey, initialDate, initialTime });
    }
  }, [menuState, openFormModal]);

  const handleAddShift = useCallback(() => {
    if (menuState.type === "grid" && menuState.data) {
      const { employeeId, date } = menuState.data;
      const dayKey = getDayKeyFromDate(date);
      const initialDate = format(date, "yyyy-MM-dd");
      const initialTime = "00:00";
      openFormModal("shift", { employeeId, dayKey, initialDate, initialTime });
    }
  }, [menuState, openFormModal]);
  // --- Fin Handlers ---

  // Render Checks
  if (employeesToDisplay.length === 0) {
    return (
      <div className="flex justify-center items-center h-60 text-gray-500">
        No hay empleados para mostrar.
      </div>
    );
  }

  // Estilos
  const headerBgColor = "bg-blue-100";
  const headerTextColor = "text-blue-800";
  const borderColor = "border-blue-200";
  const todayBgColor = "bg-blue-50";
  const otherMonthBgColor = "bg-gray-50";
  const otherMonthTextColor = "text-gray-400";
  const mainBgColor = "bg-white";
  const employeeHeaderBg = "bg-gray-100";

  // Dimensiones
  const estimatedCellWidth =
    typeof window !== "undefined" ? Math.max(100, window.innerWidth / 8) : 150;
  const estimatedTimelineHeight = 28;

  // --- (NUEVO) Estilos y Iconos para Toasts ---
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
  // --- Fin Estilos Toast ---

  return (
    <TooltipProvider>
      <div
        className={`h-full overflow-auto ${mainBgColor}`}
        onClick={(e) => {
          if (
            menuState.isOpen &&
            !(e.target as Element).closest(".custom-context-menu")
          ) {
            closeContextMenu();
          }
        }}
      >
        {/* Header General Rango */}
        <div
          className={cn(
            "w-full text-center text-sm font-medium py-2 border-b sticky top-0 z-20",
            headerBgColor,
            headerTextColor,
            borderColor
          )}
        >
          {format(dateRange.start, "d 'de' MMMM", { locale: es })} -{" "}
          {format(dateRange.end, "d 'de' MMMM 'de' yyyy", { locale: es })}
        </div>

        {/* Mapeo de Empleados */}
        {employeesToDisplay.map((employee) => (
          <div key={employee.id} className={`mb-0 border-b-4 ${borderColor}`}>
            {/* Header Empleado con Tooltip */}
            <Tooltip delayDuration={150}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "px-4 py-1.5 font-semibold text-sm sticky z-10 border-b cursor-default",
                    employeeHeaderBg,
                    borderColor,
                    "top-[40px]"
                  )}
                >
                  {employee.name} - {employee.department}
                </div>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                align="start"
                className="bg-slate-800 text-white p-3 rounded-md shadow-lg text-xs border border-slate-700 w-60"
              >
                <div className="font-bold text-sm mb-2">{employee.name}</div>
                <div className="space-y-1">
                  <div>
                    <span className="font-medium">Num. documento:</span>{" "}
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
            {/* Renderizar SOLO el mes */}
            <div key={format(displayMonthDate, "yyyy-MM")} className="mb-0">
              {/* Header Mes */}
              <div
                className={cn(
                  "px-4 py-2 font-medium sticky z-10 text-center border-b",
                  headerBgColor,
                  headerTextColor,
                  borderColor,
                  "top-[68px]"
                )}
              >
                {format(displayMonthDate, "MMMM yyyy", { locale: es })}
              </div>
              {/* Header Días Semana */}
              <div className="grid grid-cols-7 border-b bg-gray-50">
                {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map(
                  (dayName) => (
                    <div
                      key={dayName}
                      className={cn(
                        "h-8 flex items-center justify-center text-xs font-medium text-gray-500",
                        borderColor,
                        "border-r last:border-r-0"
                      )}
                    >
                      {dayName}
                    </div>
                  )
                )}
              </div>
              {/* Grid Calendario */}
              <div className="grid grid-cols-7">
                {monthWeeks.map((weekData, weekIndex) => (
                  <React.Fragment key={weekIndex}>
                    {weekData.map((day) => {
                      const isCurrentMonth = isSameMonth(day, displayMonthDate);
                      const isTodayDate = isToday(day);
                      const dayKey = getDayKeyFromDate(day);
                      const isPastOrToday =
                        isBefore(day, todayDate) || isTodayDate;
                      const isFutureDay = isAfter(day, todayDate);

                      let scheduleToRender: any;
                      let workedToRender: any;
                      let markingsToRender: any[] = [];
                      let isFallbackData = false;
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
                      const requiresFallback =
                        !(
                          actualSchedule ||
                          actualWorked ||
                          actualMarkings.length > 0
                        ) &&
                        employees &&
                        employees.length > 0 &&
                        mockEmployees.length > 0;

                      if (requiresFallback) {
                        isFallbackData = true;
                        const fallbackEmpId = mockEmployees[0].id;
                        scheduleToRender = mockSchedules.find(
                          (s) =>
                            s.employeeId === fallbackEmpId &&
                            s.dayKey === dayKey
                        );
                        workedToRender = isPastOrToday
                          ? mockWorkedTimes.find(
                              (w) =>
                                w.employeeId === fallbackEmpId &&
                                w.dayKey === dayKey
                            )
                          : undefined;
                        markingsToRender = mockMarkings.filter(
                          (m) =>
                            m.employeeId === fallbackEmpId &&
                            m.dayKey === dayKey
                        );
                      } else {
                        scheduleToRender = actualSchedule;
                        workedToRender = isPastOrToday
                          ? actualWorked
                          : undefined;
                        markingsToRender = actualMarkings;
                      }

                      return (
                        <div
                          key={`${employee.id}-${format(day, "yyyy-MM-dd")}`}
                          onContextMenu={(e) =>
                            handleContextMenu(e, "grid", {
                              employeeId: employee.id,
                              date: day,
                            })
                          }
                          className={cn(
                            "relative min-h-[100px] border-r border-b p-1 flex flex-col cursor-context-menu",
                            borderColor,
                            isCurrentMonth ? mainBgColor : otherMonthBgColor,
                            isTodayDate ? todayBgColor : "",
                            !isCurrentMonth
                              ? otherMonthTextColor
                              : "text-gray-800"
                          )}
                        >
                          <div className="text-right text-xs font-medium p-0.5 self-end select-none">
                            {format(day, "d")}
                          </div>
                          <div className="flex-grow relative mt-1 min-h-[30px]">
                            {(scheduleToRender ||
                              workedToRender ||
                              markingsToRender.length > 0) && (
                              <DayTimeline
                                schedule={scheduleToRender}
                                worked={workedToRender}
                                markings={markingsToRender}
                                width={estimatedCellWidth - 10}
                                height={estimatedTimelineHeight}
                                onContextMenu={(
                                  e,
                                  typeFromTimeline,
                                  dataFromTimeline
                                ) => {
                                  handleContextMenu(e, "worked", {
                                    ...dataFromTimeline,
                                    employeeId: employee.id,
                                    date: day,
                                  });
                                }}
                                isFallbackData={isFallbackData}
                                isFuture={isFutureDay}
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>{" "}
              {/* Fin Grid Calendario */}
            </div>{" "}
            {/* Fin Render Mes */}
          </div> /* Fin Mapeo Empleado */
        ))}

        {/* --- Modales --- */}
        {/* Modales de Formularios (AHORA CON CONTENIDO INTERNO) */}
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
              : "Formulario"
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
                menuState.data.formattedDateTime || "Fecha desconocida"
              }
              onAddMarking={handleAddMarking}
              onAddLeave={handleAddLeave}
              onAddShift={handleAddShift}
            />
          )}
        </CustomContextMenu>

        {/* --- (NUEVO) Renderizado de Toasts --- */}
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
        {/* --- Fin Toasts --- */}
      </div>{" "}
      {/* Fin Contenedor Principal */}
    </TooltipProvider>
  );
}
