import type { Event } from "../interfaces/Event";
import type { Marking } from "../interfaces/Marking";
import type { Employee } from "../interfaces/Employee";
import { isSameDay } from "../utils/dateUtils";

interface UseCalculatePositionProps {
  view: "day" | "week" | "timeline";
  startDate?: Date; // Requerido para day/week
  endDate?: Date; // Requerido para day/week
  employees: Employee[];
  containerWidth: number;
  containerHeight: number;
  dayViewStartHour?: number; // Específico de DayView
  dayViewEndHour?: number; // Específico de DayView
  timelineHourWidth?: number; // Específico de TimelineView
  timelineHeaderHeight?: number; // Específico de TimelineView
  timelineRowHeight?: number; // Específico de TimelineView
  dayViewTimeColWidth?: number; // Específico de DayView
  dayViewHeaderHeight?: number; // Específico de DayView
  timelineEmployeeColWidth?: number; // Específico de TimelineView
}

// Este hook centraliza la lógica de cálculo de posición para diferentes vistas
export function useCalculatePosition({
  view,
  startDate,
  employees,
  containerWidth,
  containerHeight,
  dayViewStartHour = 6,
  dayViewEndHour = 22,
  timelineHourWidth = 100,
  timelineHeaderHeight = 40, // Ajusta según tu diseño real
  timelineRowHeight = 80, // Ajusta según tu diseño real
  dayViewTimeColWidth = 100, // Ajusta según tu diseño real
  dayViewHeaderHeight = 50, // Ajusta según tu diseño real
  timelineEmployeeColWidth = 200, // Ajusta según tu diseño real
}: UseCalculatePositionProps) {
  const dayViewVisibleHours = dayViewEndHour - dayViewStartHour + 1;
  const dayViewGridHeight = containerHeight - dayViewHeaderHeight;
  const dayViewHourHeight = dayViewGridHeight / dayViewVisibleHours;
  const dayViewGridWidth = containerWidth - dayViewTimeColWidth;
  const dayViewEmployeeColWidth =
    employees.length > 0
      ? dayViewGridWidth / employees.length
      : dayViewGridWidth;

  const getEventPosition = (event: Event): React.CSSProperties | null => {
    const employeeIndex = employees.findIndex(
      (emp) => emp.id === event.employeeId
    );
    if (employeeIndex === -1) return null;

    const startTime = new Date(event.startTime);
    const endTime = new Date(event.endTime);

    if (view === "day" && startDate) {
      if (!isSameDay(startTime, startDate)) return null; // Evento no es de este día

      // Clonar fechas para no mutar las originales
      let clampedStartTime = new Date(startTime);
      let clampedEndTime = new Date(endTime);

      // Ajustar si cruza la medianoche o los límites de la vista
      if (!isSameDay(clampedStartTime, startDate)) {
        clampedStartTime = new Date(startDate);
        clampedStartTime.setHours(dayViewStartHour, 0, 0, 0);
      }
      if (
        !isSameDay(clampedEndTime, startDate) ||
        clampedEndTime.getHours() > dayViewEndHour ||
        (clampedEndTime.getHours() === dayViewEndHour &&
          clampedEndTime.getMinutes() > 0)
      ) {
        clampedEndTime = new Date(startDate);
        clampedEndTime.setHours(dayViewEndHour, 59, 59, 999); // Ajusta a 23:59 si cruza medianoche
      }

      const startHourDecimal = Math.max(
        dayViewStartHour,
        clampedStartTime.getHours() + clampedStartTime.getMinutes() / 60
      );
      const endHourDecimal = Math.min(
        dayViewEndHour + 1,
        clampedEndTime.getHours() + clampedEndTime.getMinutes() / 60
      ); // +1 porque la altura va hasta el final de la hora

      const top =
        (startHourDecimal - dayViewStartHour) * dayViewHourHeight +
        dayViewHeaderHeight;
      const height = Math.max(
        1,
        (endHourDecimal - startHourDecimal) * dayViewHourHeight
      ); // Altura mínima de 1px
      const left =
        employeeIndex * dayViewEmployeeColWidth + dayViewTimeColWidth;
      const width = dayViewEmployeeColWidth - 10; // -10 for padding/margin

      return {
        position: "absolute",
        left: `${left}px`,
        width: `${width}px`,
        top: `${top}px`,
        height: `${height}px`,
        zIndex: 10,
      };
    }

    if (view === "timeline" && startDate) {
      if (!isSameDay(startTime, startDate)) return null; // Evento no es de este día

      let clampedStartTime = new Date(startTime);
      let clampedEndTime = new Date(endTime);

      // Ajustar si cruza la medianoche
      if (!isSameDay(clampedStartTime, startDate)) {
        clampedStartTime = new Date(startDate);
        clampedStartTime.setHours(0, 0, 0, 0);
      }
      if (!isSameDay(clampedEndTime, startDate)) {
        clampedEndTime = new Date(startDate);
        clampedEndTime.setHours(23, 59, 59, 999);
      }

      const startHourDecimal =
        clampedStartTime.getHours() + clampedStartTime.getMinutes() / 60;
      const endHourDecimal =
        clampedEndTime.getHours() + clampedEndTime.getMinutes() / 60;

      const left =
        startHourDecimal * timelineHourWidth + timelineEmployeeColWidth;
      const width = Math.max(
        1,
        (endHourDecimal - startHourDecimal) * timelineHourWidth
      );
      const top = employeeIndex * timelineRowHeight + timelineHeaderHeight + 10; // +10 offset vertical dentro de la fila
      const height = timelineRowHeight * 0.4; // Ocupa el 40% de la altura de la fila

      return {
        position: "absolute",
        left: `${left}px`,
        width: `${width}px`,
        top: `${top}px`,
        height: `${height}px`,
        zIndex: 10,
      };
    }

    // Implementar lógica para WeekView si es necesario
    if (view === "week") {
      // Lógica similar a DayView pero calculando el `dayIndex`
      // y ajustando `left` y `width` según el día de la semana.
      // Requiere pasar `days` (array de fechas de la semana) o calcularlos aquí.
      return {}; // Placeholder
    }

    return null;
  };

  const getMarkingPosition = (marking: Marking): React.CSSProperties | null => {
    const employeeIndex = employees.findIndex(
      (emp) => emp.id === marking.employeeId
    );
    if (employeeIndex === -1) return null;

    const markingTime = new Date(marking.time);

    if (view === "day" && startDate) {
      if (!isSameDay(markingTime, startDate)) return null;

      const hourDecimal =
        markingTime.getHours() + markingTime.getMinutes() / 60;
      if (hourDecimal < dayViewStartHour || hourDecimal > dayViewEndHour + 1)
        return null; // Fuera del rango visible

      const top =
        (hourDecimal - dayViewStartHour) * dayViewHourHeight +
        dayViewHeaderHeight;
      const left =
        employeeIndex * dayViewEmployeeColWidth +
        dayViewTimeColWidth +
        dayViewEmployeeColWidth / 2; // Centrado en la columna

      return {
        position: "absolute",
        left: `${left}px`,
        top: `${top}px`,
        transform: "translateX(-50%)", // Centrar el pin
        zIndex: 20,
      };
    }

    if (view === "timeline" && startDate) {
      if (!isSameDay(markingTime, startDate)) return null;

      const hourDecimal =
        markingTime.getHours() + markingTime.getMinutes() / 60;
      const left = hourDecimal * timelineHourWidth + timelineEmployeeColWidth;
      const top =
        employeeIndex * timelineRowHeight +
        timelineHeaderHeight +
        timelineRowHeight * 0.7; // Posición vertical dentro de la fila

      return {
        position: "absolute",
        left: `${left}px`,
        top: `${top}px`,
        transform: "translateX(-50%)", // Centrar el pin
        zIndex: 20,
      };
    }

    // Implementar lógica para WeekView si es necesario
    if (view === "week") {
      // Similar a DayView, ajustando left según dayIndex
      return {}; // Placeholder
    }

    return null;
  };

  // Devuelve las funciones y cualquier valor calculado que pueda ser útil
  return {
    getEventPosition,
    getMarkingPosition,
    dayViewHourHeight,
    timelineHourWidth,
  };
}
