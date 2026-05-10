import { useSceneStore } from '@/stores/sceneStore'
import { MinecraftStructure, STRUCTURES } from '@/data/minecraftStructures'
import { StructureGhost } from '@/utils/StructureGhost'

const CATEGORY_COLORS: Record<string, string> = {
  ocean: '#4a90d9',
  nether: '#b80000',
  end: '#9b59b6',
  desert: '#f59e0b',
  jungle: '#5D8C3E',
  forest: '#2d5016',
  plains: '#7c3aed',
  underground: '#808080',
  snow: '#06b6d4',
  deep_dark: '#1a1a2e',
}

interface StructureReferenceStore {
  activeStructures: Set<string>
  structureGhosts: Map<string, { ghost: StructureGhost; data: MinecraftStructure }>
  
  toggleStructure: (id: string) => void
  setActiveStructures: (ids: Set<string>) => void
  clearAll: () => void
}

export const useStructureStore = useSceneStore.create<StructureReferenceStore>((set, get) => ({
  activeStructures: new Set(),
  structureGhosts: new Map(),

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
