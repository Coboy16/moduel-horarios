/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Marking {
  details: string;
  createdBy: string;
  dayKey: string;
  markingType: string;
  site?: string;
  dateStr: string;
  type: "ENTRADA" | "SALIDA" | "INICIO_DESCANSO" | "FIN_DESCANSO";
  id: string;
  employeeId: string;
  time: string;
  status: string;
  method?: "HUELLA" | "PIN" | "ROSTRO" | null;
  location?: string;
  icon?: any; // Add icon property as optional
  color: string;
  timeFormatted: string;
}
