import { create } from 'zustand'

interface StructureStore {
  activeStructures: Set<string>
  toggleStructure: (id: string) => void
  setActiveStructures: (ids: Set<string>) => void
  clearAll: () => void
}

export const useStructureStore = create<StructureStore>((set, get) => ({
  activeStructures: new Set(),

  toggleStructure: (id: string) => {
    const { activeStructures } = get()
    const newSet = new Set(activeStructures)
    
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    
    set({ activeStructures: newSet })
  },

  setActiveStructures: (ids: Set<string>) => {
    set({ activeStructures: ids })
  },

  clearAll: () => {
    set({ activeStructures: new Set() })
  },
}))
