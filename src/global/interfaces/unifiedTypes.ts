/* eslint-disable @typescript-eslint/no-explicit-any */
export enum TipoVerificacion {
  ROSTRO = 'Rostro',
  HUELLA = 'Huella',
  TARJETA = 'Tarjeta',
  MANUAL = 'Manual'
}

export enum TipoMarcaje {
  ENTRADA = 'Entrada',
  SALIDA = 'Salida',
  BREAK_INICIO = 'Inicio de Descanso',
  BREAK_FIN = 'Fin de Descanso',
  OTRO = 'Otro'
}

export interface Coordenadas {
  latitud: number;
  longitud: number;
  descripcion?: string;
}

export interface WorkShift {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  color: string;
}

export interface License {
  code: string;
  label: string;
  color: string;
}

export interface ScheduleEntry {
  date: string;
  shift: string;
  startTime: string;
  endTime: string;
  actualEntryTime?: string;
  actualExitTime?: string;
  status?: 'onTime' | 'late' | 'early' | 'absent' | 'pending';
}

export interface Marcaje {
  id: string;
  fecha: string;
  hora: string;
  empleadoId: string;
  dispositivo: string;
  tipoVerificacion: TipoVerificacion;
  tipoMarcaje: TipoMarcaje;
  esManual: boolean;
  usuarioRegistro?: string;
  timestampRegistro?: string;
  observaciones?: string;
  coordenadas?: Coordenadas;
  resultado?: "Verificado" | "No Verificado" | "Pendiente";
}

export interface Incidencia {
  id: string;
  empleadoId: string;
  fecha: string;
  tipo: 'Falta' | 'Tardanza' | 'Salida Temprana' | 'Sin Marcar Salida' | 'Sin Marcar Entrada' | 'Otro';
  estado: 'Pendiente' | 'Justificada' | 'Injustificada';
  descripcion?: string;
  marcajeId?: string;
  justificacion?: string;
}

export interface Dispositivo {
  id: string;
  nombre: string;
  tipo: string;
  ubicacion: string;
  ip: string;
  sn: string;
  estado: string;
  ultimaSincronizacion: string;
}

// Modelo unificado de empleado
export interface UnifiedEmployee {
  // Identificación
  id: string;
  codigo?: string;
  
  // Datos personales
  primerNombre?: string;
  segundoNombre?: string;
  primerApellido?: string;
  segundoApellido?: string;
  nombre?: string;    // Campo combinado para compatibilidad
  apellidos?: string; // Campo combinado para compatibilidad
  name?: string;      // Campo combinado alternativo para compatibilidad
  initial?: string;
  
  // Información de contacto
  telefono?: string;
  phone?: string;     // Alternativo para compatibilidad
  correo?: string;
  email?: string;     // Alternativo para compatibilidad
  
  // Información demográfica
  genero?: string;
  fechaNacimiento?: string;
  tipoDocumento?: string;
  numeroDocumento?: string;
  
  // Información laboral
  position?: string;  // Puesto actual
  cargo?: string;     // Alternativo para compatibilidad
  department?: string;
  section: string;
  unit?: string;
  location?: string;  // Sede/ubicación física
  sede?: string;      // Alternativo para compatibilidad
  company?: string;   // Empresa (para externos/contratistas)
  empresa?: string;   // Alternativo para compatibilidad
  
  // Datos de contrato
  modalidadTiempo?: string;
  contractType?: string; // Indefinido, Temporal, Por Proyecto, etc.
  fechaInicialContrato?: string;
  fechaFinalContrato?: string;
  startDate?: string;  // Alternativo para compatibilidad
  
  // Datos de acceso/verificación
  method?: string;  // Método principal de verificación
  perfilesMarcaje?: string[];
  permitirVisitas?: boolean;
  
  // Estado
  status?: 'active' | 'inactive';
  
  // Planificación
  tipoPlanificacion?: string;
  schedule?: ScheduleEntry[];
  
  // Datos visuales
  profileImage?: string;
  photoUrl?: string;  // Alternativo para compatibilidad
  
  // Datos de organización
  containerType?: string;
  
  // Campos auxiliares para procesamiento
  fullName?: string;      // Campo calculado
  displayName?: string;   // Campo calculado
}

// Función para convertir desde los formatos antiguos al unificado
export function convertToUnifiedEmployee(employee: any): UnifiedEmployee {
  const unified: UnifiedEmployee = {
    id: employee.id,
    section: employee.section || '',
  };
  
  // Mapeo de campos básicos
  const fieldMappings: [keyof UnifiedEmployee, string[]][] = [
    ['primerNombre', ['primerNombre']],
    ['segundoNombre', ['segundoNombre']],
    ['primerApellido', ['primerApellido']],
    ['segundoApellido', ['segundoApellido']],
    ['nombre', ['nombre']],
    ['apellidos', ['apellidos']],
    ['name', ['name']],
    ['initial', ['initial']],
    ['telefono', ['telefono', 'phone']],
    ['correo', ['correo', 'email']],
    ['genero', ['genero']],
    ['fechaNacimiento', ['fechaNacimiento']],
    ['tipoDocumento', ['tipoDocumento']],
    ['numeroDocumento', ['numeroDocumento']],
    ['position', ['position', 'cargo']],
    ['department', ['department']],
    ['unit', ['unit']],
    ['location', ['location', 'sede']],
    ['company', ['company', 'empresa']],
    ['modalidadTiempo', ['modalidadTiempo']],
    ['contractType', ['contractType']],
    ['fechaInicialContrato', ['fechaInicialContrato', 'startDate']],
    ['fechaFinalContrato', ['fechaFinalContrato']],
    ['method', ['method']],
    ['permitirVisitas', ['permitirVisitas']],
    ['status', ['status']],
    ['tipoPlanificacion', ['tipoPlanificacion']],
    ['schedule', ['schedule']],
    ['profileImage', ['profileImage', 'photoUrl']],
    ['containerType', ['containerType']],
    ['codigo', ['codigo', 'code']],
  ];
  
  // Asignar campos mapeados
  for (const [targetField, sourceFields] of fieldMappings) {
    for (const sourceField of sourceFields) {
      if (employee[sourceField] !== undefined) {
        unified[targetField] = employee[sourceField];
        break;
      }
    }
  }
  
  // Generar campos calculados
  unified.fullName = generateFullName(unified);
  unified.displayName = unified.fullName || unified.name || `${unified.nombre || ''} ${unified.apellidos || ''}`.trim();
  
  return unified;
}

// Función auxiliar para generar nombre completo
function generateFullName(employee: UnifiedEmployee): string {
  if (employee.primerNombre || employee.primerApellido) {
    const nombres = [employee.primerNombre, employee.segundoNombre].filter(Boolean).join(' ');
    const apellidos = [employee.primerApellido, employee.segundoApellido].filter(Boolean).join(' ');
    return `${nombres} ${apellidos}`.trim();
  } else if (employee.nombre || employee.apellidos) {
    return `${employee.nombre || ''} ${employee.apellidos || ''}`.trim();
  } else if (employee.name) {
    return employee.name;
  }
  return '';
}

// Función para convertir de unificado a los formatos específicos de cada pantalla
export function convertToSpecificModel(unified: UnifiedEmployee, targetScreen: 'employee' | 'scheduling' | 'incidencias'): any {
  switch (targetScreen) {
    case 'employee':
      return {
        id: unified.id,
        name: unified.displayName || unified.name,
        position: unified.position || unified.cargo,
        department: unified.department,
        section: unified.section,
        location: unified.location || unified.sede,
        method: unified.method,
        initial: unified.initial || (unified.displayName ? unified.displayName.charAt(0) : ''),
        status: unified.status || 'active',
      };
    
    case 'scheduling':
      return {
        id: unified.id,
        name: unified.displayName || unified.name,
        position: unified.position || unified.cargo,
        department: unified.department,
        location: unified.location || unified.sede,
        code: unified.codigo,
        contractType: unified.modalidadTiempo || unified.contractType,
        schedule: unified.schedule || [],
      };
    
    case 'incidencias':
      return {
        id: unified.id,
        nombre: unified.nombre || unified.primerNombre || '',
        apellidos: unified.apellidos || unified.primerApellido || '',
        position: unified.position || unified.cargo || '',
        department: unified.department || '',
        location: unified.location || unified.sede || '',
        section: unified.section,
        company: unified.company || unified.empresa || '',
        photoUrl: unified.profileImage || unified.photoUrl,
        containerType: unified.containerType,
      };
    
    default:
      return unified;
  }
}