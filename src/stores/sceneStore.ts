import { create } from 'zustand'
import { BlockPlacement, ToolMode, CameraState, BlockData } from '@/types'
import { BLOCKS, getBlockById } from '@/utils/blocks'

interface SceneStore {
  blocks: Map<string, BlockPlacement>
  selectedBlock: BlockData
  toolMode: ToolMode
  camera: CameraState
  hoveredBlock: string | null
  
  setBlocks: (blocks: Map<string, BlockPlacement>) => void
  placeBlock: (x: number, y: number, z: number) => void
  breakBlock: (x: number, y: number, z: number) => void
  setSelectedBlock: (block: BlockData) => void
  setToolMode: (mode: ToolMode) => void
  setCamera: (camera: Partial<CameraState>) => void
  setHoveredBlock: (key: string | null) => void
  getBlockKey: (x: number, y: number, z: number) => string
  clearScene: () => void
}

export const useSceneStore = create<SceneStore>((set, get) => ({
  blocks: new Map(),
  selectedBlock: BLOCKS[0],
  toolMode: 'place',
  camera: {
    position: { x: 30, y: 20, z: 30 },
    target: { x: 0, y: 5, z: 0 },
    zoom: 50,
    rotation: { x: 0.5, y: 0.8 }
  },
  hoveredBlock: null,

  setBlocks: (blocks) => set({ blocks }),
  
  placeBlock: (x, y, z) => {
    const { blocks, selectedBlock, getBlockKey } = get()
    const newBlocks = new Map(blocks)
    const key = getBlockKey(x, y, z)
    newBlocks.set(key, { x, y, z, blockId: selectedBlock.id })
    set({ blocks: newBlocks })
  },

  breakBlock: (x, y, z) => {
    const { blocks, getBlockKey } = get()
    const newBlocks = new Map(blocks)
    const key = getBlockKey(x, y, z)
    newBlocks.delete(key)
    set({ blocks: newBlocks })
  },

  setSelectedBlock: (block) => set({ selectedBlock: block }),
  
  setToolMode: (mode) => set({ toolMode: mode }),

  setCamera: (camera) => {
    const { camera: currentCamera } = get()
    set({ camera: { ...currentCamera, ...camera } })
  },

  setHoveredBlock: (key) => set({ hoveredBlock: key }),

  getBlockKey: (x, y, z) => `${x},${y},${z}`,

  clearScene: () => set({ blocks: new Map() })
}))
