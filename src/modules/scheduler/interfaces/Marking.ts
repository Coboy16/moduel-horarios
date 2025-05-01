export interface Marking {
  site?: string;
  dateStr: string;
  type: "ENTRADA" | "SALIDA" | "INICIO_DESCANSO" | "FIN_DESCANSO";
  id: string;
  employeeId: string;
  time: string;
  status: string;
  method?: "HUELLA" | "PIN" | "ROSTRO" | null;
  location?: string;
}
