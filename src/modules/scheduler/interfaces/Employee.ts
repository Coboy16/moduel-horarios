export interface Employee {
  id: string;
  name: string;
  department: string;
  position: string;
  location?: string;
  email?: string;
  phone?: string;
  maxOvertimeHours?: number;
  documentNumber?: string;
  personType?: string;
  contractInfo?: string;
  site?: string;
}
