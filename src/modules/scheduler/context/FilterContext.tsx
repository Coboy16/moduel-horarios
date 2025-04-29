"use client";

import type { FC, ReactNode } from "react";
import { createContext, useState, useCallback, useEffect } from "react";
import type { CalendarView, DateRange } from "../interfaces/Filter";

interface FilterContextProps {
  currentView: CalendarView;
  dateRange: DateRange;
  eventTypeFilters: string[];
  setCurrentView: (view: CalendarView) => void;
  setDateRange: (start: Date, end: Date) => void;
  toggleEventTypeFilter: (eventTypeId: string) => void;
  resetFilters: () => void;
}

export const FilterContext = createContext<FilterContextProps>(
  {} as FilterContextProps
);

export const FilterProvider: FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize with current day (for timeline view)
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(
    today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1)
  );
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  // Inicializar con "timeline" como vista predeterminada
  const [currentView, setCurrentView] = useState<CalendarView>("timeline");
  const [dateRange, setDateRangeState] = useState<DateRange>({
    start: today, // Para timeline, usamos solo el día actual
    end: today,
  });
  const [eventTypeFilters, setEventTypeFilters] = useState<string[]>([]);

  // Update date range when view changes
  useEffect(() => {
    const today = new Date();

    switch (currentView) {
      case "day":
        setDateRangeState({
          start: today,
          end: today,
        });
        break;
      case "week": {
        const weekStart = new Date(today);
        weekStart.setDate(
          today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1)
        );
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        setDateRangeState({
          start: weekStart,
          end: weekEnd,
        });
        break;
      }
      case "month": {
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        setDateRangeState({
          start: monthStart,
          end: monthEnd,
        });
        break;
      }
      case "timeline": // Timeline navega por día
        setDateRangeState({
          start: today,
          end: today,
        });
        break;
    }
  }, [currentView]);

  const setDateRange = useCallback((start: Date, end: Date) => {
    setDateRangeState({
      start,
      end,
    });
  }, []);

  const toggleEventTypeFilter = useCallback((eventTypeId: string) => {
    setEventTypeFilters((prev) => {
      if (prev.includes(eventTypeId)) {
        return prev.filter((id) => id !== eventTypeId);
      } else {
        return [...prev, eventTypeId];
      }
    });
  }, []);

  const resetFilters = useCallback(() => {
    setEventTypeFilters([]);
  }, []);

  return (
    <FilterContext.Provider
      value={{
        currentView,
        dateRange,
        eventTypeFilters,
        setCurrentView,
        setDateRange,
        toggleEventTypeFilter,
        resetFilters,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
};
