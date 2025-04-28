import { BarChart2, Clock, LucideIcon } from "lucide-react";

export interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
  children?: MenuItem[];
}

export const menuItems: MenuItem[] = [
  {
    id: "dashboard",
    label: "Panel de Monitoreo",
    icon: BarChart2,
    path: "/dashboard",
  },

  {
    id: "time-control",
    label: "Control de Tiempo",
    icon: Clock,
    path: "/time-control",
    children: [
      {
        id: "schedule-assignment",
        label: "Planificador de horarios",
        icon: Clock,
        path: "/employees/schedule",
      },
    ],
  },
];
