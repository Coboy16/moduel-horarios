"use client";

import type React from "react";

import { useState } from "react";
import { useFilters } from "../../hooks/useFilters";
import { useEvents } from "../../hooks/useEvents";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { Search, CalendarIcon, Filter, X } from "lucide-react";
import { formatDateRange } from "../../utils/dateUtils";

export default function FilterBar() {
  const {
    currentView,
    dateRange,
    setDateRange,
    eventTypeFilters,
    toggleEventTypeFilter,
    resetFilters,
  } = useFilters();

  const { eventTypes } = useEvents();

  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
    console.log("Searching for:", searchTerm);
  };

  return (
    <div className="p-4 border-b border-border bg-card">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                <span>
                  {formatDateRange(dateRange.start, dateRange.end, currentView)}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                defaultMonth={dateRange.start}
                selected={{
                  from: dateRange.start,
                  to: dateRange.end,
                }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    setDateRange(range.from, range.to);
                  }
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-[200px]"
            />
          </form>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? "bg-accent" : ""}
          >
            <Filter className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="text-muted-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Limpiar filtros
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="mt-4 flex flex-wrap gap-2">
          <div>
            <span className="text-sm font-medium mr-2">Tipos de eventos:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {eventTypes.map((type) => (
                <Button
                  key={type.id}
                  variant="outline"
                  size="sm"
                  className={`flex items-center gap-1 ${
                    eventTypeFilters.includes(type.id) ? "bg-accent" : ""
                  }`}
                  onClick={() => toggleEventTypeFilter(type.id)}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: type.color }}
                  />
                  {type.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
