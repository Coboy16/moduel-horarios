/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { useState, useCallback } from "react";
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
import { cn } from "../../utils/formatters"; // Asumiendo utils/formatters
import { CheckCircle } from "lucide-react"; // Icono para modal éxito

// Tooltip
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Button } from "../ui/button"; // Botón para modal éxito

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

// Mock Data (o datos reales si los tienes)
import {
  Employee,
  mockEmployees,
  mockMarkings,
  mockSchedules,
  mockWorkedTimes,
} from "../../tem/week_view"; // Ajusta la ruta si es necesario

// Hook Filtros (asumimos que existe o lo defines)
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

// --- Interface para datos del formulario modal ---
interface ModalFormData {
  employeeId: string;
  dayKey: string; // Para contexto, aunque el form use más la fecha
  initialDate: string; // Formato 'yyyy-MM-dd'
  initialTime: string; // Formato 'HH:mm'
}

// Mapeo día (ya existente)
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

  // --- Estados para los Modales de Formularios ---
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formModalType, setFormModalType] = useState<
    "marking" | "leave" | "shift" | null
  >(null);
  const [formModalData, setFormModalData] = useState<ModalFormData | null>(
    null
  );
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  // --- Fin Estados Modales ---

  const employeesToDisplay =
    employees && employees.length > 0 ? employees : mockEmployees;

  // Lógica Un Mes (ya existente)
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

  // --- Helpers (Funciones auxiliares) ---
  const getDayKeyFromDate = (date: Date): string => {
    const d = getDay(date);
    return dayKeyMap[d] || "unknown";
  };

  // Se asume que esta función existe o la defines
  // const formatTime = (decimalTime: number): string => {
  //   const tM = Math.round(decimalTime * 60);
  //   const h = Math.floor(tM / 60);
  //   const m = tM % 60;
  //   return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  // };

  // --- Funciones para manejar modales ---
  const closeAllModals = useCallback(() => {
    setIsFormModalOpen(false);
    setFormModalType(null);
    setFormModalData(null);
    setIsSuccessModalOpen(false);
    setSuccessMessage("");
    // Añadir reset para otros modales si se implementan (ej: paste confirm)
  }, []);

  const openFormModal = useCallback(
    (type: "marking" | "leave" | "shift", data: ModalFormData) => {
      closeContextMenu(); // Cierra el menú contextual si está abierto
      closeAllModals(); // Asegura que otros modales estén cerrados
      setFormModalData(data);
      setFormModalType(type);
      setIsFormModalOpen(true);
    },
    [closeAllModals] // closeContextMenu no necesita ser dependencia si es estable (useCallback sin deps)
  );

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

  // --- Handlers Menú y Acciones ---
  const handleContextMenu = useCallback(
    (
      event: React.MouseEvent<HTMLDivElement>,
      type: "worked" | "grid",
      data: any
    ) => {
      event.preventDefault();
      event.stopPropagation();
      closeContextMenu(); // Cierra menú anterior
      closeAllModals(); // Cierra modales abiertos

      let menuData = data;
      if (type === "grid") {
        // Guardamos el ID del empleado y el objeto Date directamente
        // La preparación para el form se hará en los handleAdd...
        menuData = {
          employeeId: data.employeeId,
          date: data.date, // Guardamos el objeto Date
          // Podemos añadir un string formateado para mostrar en el menú si es necesario
          formattedDateTime: `${format(data.date, "P", { locale: es })}`,
        };
      } else if (type === "worked") {
        // Pasa los datos de la barra trabajada/horario tal cual
        menuData = data;
      }

      setMenuState({
        isOpen: true,
        position: { x: event.clientX, y: event.clientY },
        type: type,
        data: menuData,
      });
    },
    [closeContextMenu, closeAllModals] // Añadimos dependencias
  );

  // Handlers para acciones de barras (sin cambios funcionales por ahora)
  const handleViewDetails = (id: string) => {
    console.log("Ver detalle:", id);
    closeContextMenu();
  };
  const handleCopy = (type: string, id: string) => {
    console.log("Copiar", type, id);
    closeContextMenu();
  };
  const handleDelete = (id: string) => {
    console.log("Eliminar:", id);
    closeContextMenu();
  };

  // --- Handlers para acciones del menú de celda (actualizados) ---
  const handleAddMarking = useCallback(() => {
    if (menuState.type === "grid" && menuState.data) {
      const { employeeId, date } = menuState.data;
      const dayKey = getDayKeyFromDate(date);
      const initialDate = format(date, "yyyy-MM-dd");
      const initialTime = "09:00"; // Hora inicial por defecto (puedes cambiarla)
      openFormModal("marking", {
        employeeId,
        dayKey,
        initialDate,
        initialTime,
      });
    }
    // No es necesario closeContextMenu aquí, openFormModal ya lo hace
  }, [menuState, openFormModal]); // Añadir openFormModal como dependencia

  const handleAddLeave = useCallback(() => {
    if (menuState.type === "grid" && menuState.data) {
      const { employeeId, date } = menuState.data;
      const dayKey = getDayKeyFromDate(date);
      const initialDate = format(date, "yyyy-MM-dd");
      const initialTime = "00:00"; // Hora inicial por defecto para licencias
      openFormModal("leave", { employeeId, dayKey, initialDate, initialTime });
    }
  }, [menuState, openFormModal]);

  const handleAddShift = useCallback(() => {
    if (menuState.type === "grid" && menuState.data) {
      const { employeeId, date } = menuState.data;
      const dayKey = getDayKeyFromDate(date);
      const initialDate = format(date, "yyyy-MM-dd");
      const initialTime = "00:00"; // La hora inicial no suele ser relevante para el form de turno
      openFormModal("shift", { employeeId, dayKey, initialDate, initialTime });
    }
  }, [menuState, openFormModal]);
  // --- Fin Handlers ---

  // Render Checks (ya existente)
  if (employeesToDisplay.length === 0) {
    return (
      <div className="flex justify-center items-center h-60 text-gray-500">
        No hay empleados para mostrar.
      </div>
    );
  }

  // Estilos (ya existentes)
  const headerBgColor = "bg-blue-100";
  const headerTextColor = "text-blue-800";
  const borderColor = "border-blue-200";
  const todayBgColor = "bg-blue-50";
  const otherMonthBgColor = "bg-gray-50";
  const otherMonthTextColor = "text-gray-400";
  const mainBgColor = "bg-white";
  const employeeHeaderBg = "bg-gray-100";

  // Dimensiones (ya existentes)
  const estimatedCellWidth =
    typeof window !== "undefined" ? Math.max(100, window.innerWidth / 8) : 150;
  const estimatedTimelineHeight = 28;

  return (
    <TooltipProvider>
      <div
        className={`h-full overflow-auto ${mainBgColor}`}
        onClick={(e) => {
          // Cierra el menú contextual si se hace clic fuera de él
          if (
            menuState.isOpen &&
            !(e.target as Element).closest(".custom-context-menu")
          ) {
            closeContextMenu();
          }
        }}
      >
        {/* Header General Rango (ya existente) */}
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

        {employeesToDisplay.map((employee) => (
          <div key={employee.id} className={`mb-0 border-b-4 ${borderColor}`}>
            {/* Header Empleado con Tooltip (ya existente) */}
            <Tooltip delayDuration={150}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "px-4 py-1.5 font-semibold text-sm sticky z-10 border-b cursor-default",
                    employeeHeaderBg,
                    borderColor,
                    // Ajusta el 'top' si el header general cambia de altura
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
                {/* Contenido Tooltip (ya existente) */}
                <div className="font-bold text-sm mb-2">{employee.name}</div>
                <div className="space-y-1">
                  {/* ... detalles del empleado ... */}
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

            {/* Renderizar SOLO el mes (ya existente) */}
            <div key={format(displayMonthDate, "yyyy-MM")} className="mb-0">
              {/* Header Mes (ya existente) */}
              <div
                className={cn(
                  "px-4 py-2 font-medium sticky z-10 text-center border-b",
                  headerBgColor,
                  headerTextColor,
                  borderColor,
                  // Ajusta el 'top' si los headers anteriores cambian
                  "top-[68px]"
                )}
              >
                {format(displayMonthDate, "MMMM yyyy", { locale: es })}
              </div>
              {/* Header Días Semana (ya existente) */}
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
              {/* Grid Calendario (ya existente) */}
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

                      // Búsqueda Datos + Fallback (ya existente)
                      let scheduleToRender: any;
                      let workedToRender: any;
                      let markingsToRender: any[] = [];
                      let isFallbackData = false;
                      // ... (lógica de búsqueda y fallback existente) ...
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
                          key={`${employee.id}-${format(day, "yyyy-MM-dd")}`} // Key más específica
                          onContextMenu={(e) =>
                            handleContextMenu(e, "grid", {
                              employeeId: employee.id,
                              date: day, // Pasamos el objeto Date completo
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
                            // Quitar opacidad de fallback si no se desea visualmente
                            // isFallbackData ? "opacity-60" : "",
                          )}
                        >
                          {/* Número día (ya existente) */}
                          <div className="text-right text-xs font-medium p-0.5 self-end select-none">
                            {format(day, "d")}
                          </div>
                          {/* Timeline (ya existente) */}
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
                                // Pasamos el handler de contexto para las barras internas si es necesario
                                onContextMenu={handleContextMenu}
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
              </div>
            </div>
            {/* Fin render mes */}
          </div>
        ))}

        {/* --- Modales --- */}
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
              : "Formulario" // Título por defecto
          }
          size={
            // Tamaños ejemplo, ajústalos según tus formularios
            formModalType === "leave"
              ? "lg"
              : formModalType === "shift"
              ? "xl"
              : "md"
          }
        >
          {formModalType === "marking" && formModalData && (
            <AddMarkingForm
              // Asegúrate que estas props coincidan con AddMarkingForm
              initialDate={formModalData.initialDate}
              initialTime={formModalData.initialTime}
              onClose={closeAllModals}
              onSubmitSuccess={handleFormSuccess}
              // Pasar employeeId si el formulario lo necesita directamente
              // employeeId={formModalData.employeeId}
            />
          )}
          {formModalType === "leave" && formModalData && (
            <AddLeaveForm
              // Asegúrate que estas props coincidan con AddLeaveForm
              initialStartDate={formModalData.initialDate}
              initialStartTime={formModalData.initialTime}
              onClose={closeAllModals}
              onSubmitSuccess={handleFormSuccess}
              // Pasar employeeId si el formulario lo necesita directamente
              // employeeId={formModalData.employeeId}
            />
          )}
          {formModalType === "shift" && formModalData && (
            <AddShiftForm
              // Asegúrate que estas props coincidan con AddShiftForm
              initialStartDate={formModalData.initialDate}
              // initialStartTime no suele necesitarse aquí
              onClose={closeAllModals}
              onSubmitSuccess={handleFormSuccess}
              // Pasar employeeId si el formulario lo necesita directamente
              // employeeId={formModalData.employeeId}
            />
          )}
        </Modal>

        {/* Modal de Éxito */}
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
        {/* --- Fin Modales --- */}

        {/* Menú Contextual */}
        <CustomContextMenu
          isOpen={menuState.isOpen}
          position={menuState.position}
          onClose={closeContextMenu}
          className="custom-context-menu" // Clase para identificar el menú al hacer clic fuera
        >
          {menuState.type === "worked" && menuState.data && (
            <WorkedBarContextMenuContent
              onViewDetails={() =>
                handleViewDetails(
                  menuState.data?.scheduleId || menuState.data?.workedId || ""
                )
              }
              onCopy={() =>
                handleCopy(
                  menuState.data?.type || "unknown",
                  menuState.data?.scheduleId || menuState.data?.workedId || ""
                )
              }
              onDelete={() =>
                handleDelete(
                  menuState.data?.scheduleId || menuState.data?.workedId || ""
                )
              }
            />
          )}
          {menuState.type === "grid" && menuState.data && (
            <GridCellContextMenuContent
              // Mostramos la fecha formateada que preparamos en handleContextMenu
              formattedDateTime={
                menuState.data.formattedDateTime || "Fecha desconocida"
              }
              // Pasamos los nuevos handlers que abren los modales
              onAddMarking={handleAddMarking}
              onAddLeave={handleAddLeave}
              onAddShift={handleAddShift}
            />
          )}
          {/* Aquí podrías añadir EmployeeContextMenuContent si implementas el menú contextual en el nombre del empleado */}
        </CustomContextMenu>

        {/* Aquí podrías añadir los Toasts si los necesitas, similar a WeekView */}
      </div>
    </TooltipProvider>
  );
}
