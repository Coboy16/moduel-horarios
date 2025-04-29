"use client";

import type { FC, ReactNode } from "react";
import { createContext, useState, useCallback, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import type { Event } from "../interfaces/Event";
import { mockEvents } from "../tem/events";
import { mockEventTypes } from "../tem/eventTypes";
import { isWithinInterval } from "date-fns";
import { useUI } from "../hooks/useUI";

interface EventContextProps {
  events: Event[];
  eventTypes: {
    id: string;
    name: string;
    color: string;
    category: string;
  }[];
  addEvent: (event: Omit<Event, "id">) => void;
  updateEvent: (event: Event) => void;
  deleteEvent: (eventId: string) => void;
  copyEvent: (eventId: string) => void;
  getEventById: (eventId: string) => Event | undefined;
  getEventsByEmployeeId: (employeeId: string) => Event[];
  getEventsByType: (type: string) => Event[];
  getEventsByDateRange: (startDate: Date, endDate: Date) => Event[];
  getEventsByEmployeeAndDateRange: (
    employeeId: string,
    startDate: Date,
    endDate: Date
  ) => Event[];
  getShiftEventTypes: () => {
    id: string;
    name: string;
    color: string;
    category: string;
  }[];
  getPermissionEventType: () =>
    | {
        id: string;
        name: string;
        color: string;
        category: string;
      }
    | undefined;
}

export const EventContext = createContext<EventContextProps>(
  {} as EventContextProps
);

export const EventProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [eventTypes, setEventTypes] = useState<
    {
      id: string;
      name: string;
      color: string;
      category: string;
    }[]
  >([]);

  const { showNotification } = useUI();

  // Load mock data
  useEffect(() => {
    setEvents(mockEvents);
    setEventTypes(mockEventTypes);
  }, []);

  const addEvent = useCallback(
    (event: Omit<Event, "id">) => {
      const newEvent: Event = {
        ...event,
        id: uuidv4(),
      };

      setEvents((prev) => [...prev, newEvent]);
      showNotification(
        "Evento agregado",
        "El evento ha sido agregado correctamente",
        "success"
      );
    },
    [showNotification]
  );

  const updateEvent = useCallback(
    (event: Event) => {
      setEvents((prev) => prev.map((e) => (e.id === event.id ? event : e)));
      showNotification(
        "Evento actualizado",
        "El evento ha sido actualizado correctamente",
        "success"
      );
    },
    [showNotification]
  );

  const deleteEvent = useCallback(
    (eventId: string) => {
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
      showNotification(
        "Evento eliminado",
        "El evento ha sido eliminado correctamente",
        "success"
      );
    },
    [showNotification]
  );

  const copyEvent = useCallback(
    (eventId: string) => {
      const eventToCopy = events.find((e) => e.id === eventId);
      if (!eventToCopy) return;

      const newEvent: Event = {
        ...eventToCopy,
        id: uuidv4(),
        title: `${eventToCopy.title} (copia)`,
      };

      setEvents((prev) => [...prev, newEvent]);
      showNotification(
        "Evento copiado",
        "El evento ha sido copiado correctamente",
        "success"
      );
    },
    [events, showNotification]
  );

  const getEventById = useCallback(
    (eventId: string) => {
      return events.find((e) => e.id === eventId);
    },
    [events]
  );

  const getEventsByEmployeeId = useCallback(
    (employeeId: string) => {
      return events.filter((e) => e.employeeId === employeeId);
    },
    [events]
  );

  const getEventsByType = useCallback(
    (type: string) => {
      return events.filter((e) => e.type === type);
    },
    [events]
  );

  const getEventsByDateRange = useCallback(
    (startDate: Date, endDate: Date) => {
      return events.filter((event) => {
        const eventStart = new Date(event.startTime);
        const eventEnd = new Date(event.endTime);

        return (
          isWithinInterval(eventStart, { start: startDate, end: endDate }) ||
          isWithinInterval(eventEnd, { start: startDate, end: endDate }) ||
          (eventStart <= startDate && eventEnd >= endDate)
        );
      });
    },
    [events]
  );

  const getEventsByEmployeeAndDateRange = useCallback(
    (employeeId: string, startDate: Date, endDate: Date) => {
      return events.filter((event) => {
        if (event.employeeId !== employeeId) return false;

        const eventStart = new Date(event.startTime);
        const eventEnd = new Date(event.endTime);

        return (
          isWithinInterval(eventStart, { start: startDate, end: endDate }) ||
          isWithinInterval(eventEnd, { start: startDate, end: endDate }) ||
          (eventStart <= startDate && eventEnd >= endDate)
        );
      });
    },
    [events]
  );

  const getShiftEventTypes = useCallback(() => {
    return eventTypes.filter((type) => type.category === "shift");
  }, [eventTypes]);

  const getPermissionEventType = useCallback(() => {
    return eventTypes.find((type) => type.category === "permission");
  }, [eventTypes]);

  return (
    <EventContext.Provider
      value={{
        events,
        eventTypes,
        addEvent,
        updateEvent,
        deleteEvent,
        copyEvent,
        getEventById,
        getEventsByEmployeeId,
        getEventsByType,
        getEventsByDateRange,
        getEventsByEmployeeAndDateRange,
        getShiftEventTypes,
        getPermissionEventType,
      }}
    >
      {children}
    </EventContext.Provider>
  );
};
