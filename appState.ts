export interface AppState {
  selectedEmployeeId: string | null;
  // Puedes agregar más estados globales aquí según sea necesario
}

// Estado global inicial
const initialState: AppState = {
  selectedEmployeeId: null
};

// Exportar una instancia única del estado
export const appState: AppState = { ...initialState };

// Funciones auxiliares para manipular el estado
export const setSelectedEmployeeId = (id: string | null) => {
  appState.selectedEmployeeId = id;
};

export const getSelectedEmployeeId = (): string | null => {
  return appState.selectedEmployeeId;
};

export const clearSelectedEmployeeId = () => {
  appState.selectedEmployeeId = null;
};