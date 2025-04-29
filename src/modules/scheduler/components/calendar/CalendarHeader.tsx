"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useFilters } from "../../hooks/useFilters";

export default function CalendarHeader() {
  const { currentView, dateRange } = useFilters();

  // Format the header based on the current view
  const formatHeader = () => {
    const { start, end } = dateRange;

    switch (currentView) {
      case "day":
        return format(start, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
      case "week":
        if (start.getMonth() === end.getMonth()) {
          return `${format(start, "d", { locale: es })} - ${format(
            end,
            "d 'de' MMMM 'de' yyyy",
            { locale: es }
          )}`;
        } else if (start.getFullYear() === end.getFullYear()) {
          return `${format(start, "d 'de' MMMM", { locale: es })} - ${format(
            end,
            "d 'de' MMMM 'de' yyyy",
            {
              locale: es,
            }
          )}`;
        } else {
          return `${format(start, "d 'de' MMMM 'de' yyyy", {
            locale: es,
          })} - ${format(end, "d 'de' MMMM 'de' yyyy", {
            locale: es,
          })}`;
        }
      case "month":
        return format(start, "MMMM 'de' yyyy", { locale: es });
      case "timeline":
        return format(start, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
      default:
        return "";
    }
  };

  return <h2 className="text-lg font-medium">{formatHeader()}</h2>;
}
