import { create } from 'zustand';

interface SidebarState {
  isExpanded: boolean;
  toggleExpanded: () => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isExpanded: true,
  toggleExpanded: () => set((state) => ({ isExpanded: !state.isExpanded })),
}));