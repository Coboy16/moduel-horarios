"use client";

import { UIProvider } from "./context/UIContext";
import { EmployeeProvider } from "./context/EmployeeContext";
import { EventProvider } from "./context/EventContext";
import { FilterProvider } from "./context/FilterContext";
import { MarkingProvider } from "./context/MarkingContext";
import EmployeeScheduler from "./components/EmployeeScheduler";
// import { Toaster } from "./components/ui/toaster";

export default function SchedulerScreen() {
  return (
    <UIProvider>
      <EmployeeProvider>
        <EventProvider>
          <FilterProvider>
            <MarkingProvider>
              <div className="h-screen flex flex-col">
                <EmployeeScheduler />
                {/* <Toaster /> */}
              </div>
            </MarkingProvider>
          </FilterProvider>
        </EventProvider>
      </EmployeeProvider>
    </UIProvider>
  );
}
