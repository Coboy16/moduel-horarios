import React, { createContext, useContext, useState, useEffect } from 'react';
import { UnifiedEmployee } from '../interfaces/unifiedTypes';
import { globalEmployees } from '../temp/data_global_temp';

interface AppStateContextType {
  currentEmployee: UnifiedEmployee | null;
  setCurrentEmployee: (employee: UnifiedEmployee | null) => void;
  selectEmployeeById: (id: string) => void;
  allEmployees: UnifiedEmployee[];
  refreshEmployees: () => void;
  getCurrentScreen: () => 'employee' | 'scheduling' | 'incidencias' | null;
  setCurrentScreen: (screen: 'employee' | 'scheduling' | 'incidencias') => void;
  updateEmployee: (updatedEmployee: UnifiedEmployee) => void;
  addEmployee: (newEmployee: UnifiedEmployee) => void;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentEmployee, setCurrentEmployee] = useState<UnifiedEmployee | null>(null);
  const [allEmployees, setAllEmployees] = useState<UnifiedEmployee[]>([]);
  const [currentScreen, setCurrentScreen] = useState<'employee' | 'scheduling' | 'incidencias' | null>(null);

  // Inicializar empleados unificados al cargar
  useEffect(() => {
    refreshEmployees();
    
    // Intentar recuperar un empleado seleccionado de sessionStorage (si existe)
    const savedEmployeeId = sessionStorage.getItem('selectedEmployeeId');
    if (savedEmployeeId) {
      selectEmployeeById(savedEmployeeId);
    }
  }, []);

  // Función para refrescar la lista de empleados unificada
  const refreshEmployees = () => {
    // Usar la fuente de datos global
    setAllEmployees(globalEmployees);
  };

  // Función para actualizar un empleado existente
  const updateEmployee = (updatedEmployee: UnifiedEmployee) => {
    setAllEmployees(prev => 
      prev.map(emp => emp.id === updatedEmployee.id ? updatedEmployee : emp)
    );
    
    // Si el empleado actualizado es el actual, actualizar también el estado actual
    if (currentEmployee?.id === updatedEmployee.id) {
      setCurrentEmployee(updatedEmployee);
    }
  };

  // Función para añadir un nuevo empleado
  const addEmployee = (newEmployee: UnifiedEmployee) => {
    setAllEmployees(prev => [...prev, newEmployee]);
  };

  // Función para seleccionar un empleado por ID
  const selectEmployeeById = (id: string) => {
    const employee = allEmployees.find(emp => emp.id === id);
    setCurrentEmployee(employee || null);
    
    // Guardar en sessionStorage para persistencia
    if (employee) {
      sessionStorage.setItem('selectedEmployeeId', employee.id);
    } else {
      sessionStorage.removeItem('selectedEmployeeId');
    }
  };

  // Función para obtener la pantalla actual
  const getCurrentScreen = () => {
    return currentScreen;
  };

  return (
    <AppStateContext.Provider
      value={{
        currentEmployee,
        setCurrentEmployee,
        selectEmployeeById,
        allEmployees,
        refreshEmployees,
        getCurrentScreen,
        setCurrentScreen,
        updateEmployee,
        addEmployee
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
};

// Hook personalizado para facilitar el uso del contexto
export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState debe ser usado dentro de un AppStateProvider');
  }
  return context;
};