import { create } from 'zustand'
import { BlockPlacement, ToolMode, CameraState, BlockData } from '@/types'
import { BLOCKS, getBlockById } from '@/utils/blocks'

interface SceneStore {
  blocks: Map<string, BlockPlacement>
  selectedBlock: BlockData
  toolMode: ToolMode
  camera: CameraState
  hoveredBlock: string | null
  lastSaved: Date | null
  
  setBlocks: (blocks: Map<string, BlockPlacement>) => void
  placeBlock: (x: number, y: number, z: number) => void
  breakBlock: (x: number, y: number, z: number) => void
  setSelectedBlock: (block: BlockData) => void
  setToolMode: (mode: ToolMode) => void
  setCamera: (camera: Partial<CameraState>) => void
  setHoveredBlock: (key: string | null) => void
  getBlockKey: (x: number, y: number, z: number) => string
  clearScene: () => void
  saveScene: () => void
  loadScene: () => void
  exportSchematic: () => void
  importSchematic: () => void
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
  lastSaved: null,

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

  clearScene: () => set({ blocks: new Map() }),

  saveScene: () => {
    const { blocks } = get()
    const blocksArray = Array.from(blocks.values())
    const data = JSON.stringify({
      version: '1.0',
      blocks: blocksArray,
      createdAt: new Date().toISOString()
    })
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `schematic-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    set({ lastSaved: new Date() })
  },

  loadScene: () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string)
          if (data.blocks && Array.isArray(data.blocks)) {
            const newBlocks = new Map<string, BlockPlacement>()
            data.blocks.forEach((block: BlockPlacement) => {
              const key = get().getBlockKey(block.x, block.y, block.z)
              newBlocks.set(key, block)
            })
            set({ blocks: newBlocks })
          }
        } catch (error) {
          console.error('Failed to load schematic:', error)
          alert('无法加载示意图文件，请检查格式')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  },

  exportSchematic: () => {
    const { blocks } = get()
    const blocksArray = Array.from(blocks.values())
    
    let minX = Infinity, minY = Infinity, minZ = Infinity
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity
    
    blocksArray.forEach(block => {
      minX = Math.min(minX, block.x)
      minY = Math.min(minY, block.y)
      minZ = Math.min(minZ, block.z)
      maxX = Math.max(maxX, block.x)
      maxY = Math.max(maxY, block.y)
      maxZ = Math.max(maxZ, block.z)
    })

    const normalizedBlocks = blocksArray.map(block => ({
      x: block.x - minX,
      y: block.y - minY,
      z: block.z - minZ,
      blockId: block.blockId
    }))

    const schematicData = {
      version: '1.0',
      size: {
        x: maxX - minX + 1,
        y: maxY - minY + 1,
        z: maxZ - minZ + 1
      },
      offset: { x: minX, y: minY, z: minZ },
      blocks: normalizedBlocks,
      createdAt: new Date().toISOString()
    }

    const data = JSON.stringify(schematicData, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `schematic-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    set({ lastSaved: new Date() })
  },

  importSchematic: () => {
    get().loadScene()
  }
}))
