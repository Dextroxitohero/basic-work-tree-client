import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UiState {
  hideSalaries: boolean
  toggleHideSalaries: () => void
}

// Solo preferencias del cliente. Los datos del servidor viven en TanStack Query.
export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      hideSalaries: false,
      toggleHideSalaries: () => set((s) => ({ hideSalaries: !s.hideSalaries })),
    }),
    { name: 'ui' },
  ),
)
