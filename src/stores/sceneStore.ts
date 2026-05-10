import { create } from 'zustand'
import { BlockPlacement, ToolMode, CameraState, BlockData } from '@/types'
import { BLOCKS } from '@/utils/blocks'

interface SceneStore {
  blocks: Map<string, BlockPlacement>
  selectedBlock: BlockData
  toolMode: ToolMode
  camera: CameraState
  hoveredBlock: string | null
  lastSaved: Date | null
  schematicName: string
  schematicAuthor: string
  
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
  setSchematicName: (name: string) => void
  setSchematicAuthor: (author: string) => void
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
  schematicName: 'Untitled Schematic',
  schematicAuthor: 'SchematicForge',

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

  setSchematicName: (name) => set({ schematicName: name }),
  setSchematicAuthor: (author) => set({ schematicAuthor: author }),

  saveScene: () => {
    const { blocks, schematicName } = get()
    const blocksArray = Array.from(blocks.values())
    const data = JSON.stringify({
      version: '1.0',
      name: schematicName,
      blocks: blocksArray,
      createdAt: new Date().toISOString()
    }, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${schematicName.replace(/\s+/g, '_')}-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    set({ lastSaved: new Date() })
  },

  loadScene: () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,.litematic'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string
          const data = JSON.parse(content)
          
          if (data.blocks && Array.isArray(data.blocks)) {
            const newBlocks = new Map<string, BlockPlacement>()
            data.blocks.forEach((block: BlockPlacement) => {
              const key = get().getBlockKey(block.x, block.y, block.z)
              newBlocks.set(key, block)
            })
            set({ blocks: newBlocks })
            if (data.name) set({ schematicName: data.name })
          }
          else if (data.Regions) {
            const newBlocks = new Map<string, BlockPlacement>()
            Object.values(data.Regions).forEach((region: any) => {
              if (region.BlockStates && region.Palette) {
                const palette = region.Palette
                const blockStates = region.BlockStates
                const size = region.Size
                const offset = region.Offset || { x: 0, y: 0, z: 0 }
                
                for (let i = 0; i < blockStates.length; i++) {
                  const stateId = blockStates[i]
                  const blockName = Object.keys(palette).find(k => palette[k] === stateId) || 'minecraft:air'
                  
                  const x = (i % size.x) + offset.x
                  const y = Math.floor((i / (size.x * size.z)) % size.y) + offset.y
                  const z = Math.floor((i / size.x) % size.z) + offset.z
                  
                  if (blockName !== 'minecraft:air') {
                    const key = get().getBlockKey(x, y, z)
                    newBlocks.set(key, { x, y, z, blockId: blockName })
                  }
                }
              }
            })
            set({ blocks: newBlocks })
            if (data.Metadata?.Name) set({ schematicName: data.Metadata.Name })
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
    const { blocks, schematicName } = get()
    const blocksArray = Array.from(blocks.values())
    
    if (blocksArray.length === 0) {
      alert('场景为空，请先放置方块')
      return
    }
    
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

    const sizeX = maxX - minX + 1
    const sizeY = maxY - minY + 1
    const sizeZ = maxZ - minZ + 1

    const palette: Record<string, number> = {}
    const paletteReverse: Record<number, string> = {}
    let paletteIndex = 0
    
    blocksArray.forEach(block => {
      if (!palette[block.blockId]) {
        palette[block.blockId] = paletteIndex
        paletteReverse[paletteIndex] = block.blockId
        paletteIndex++
      }
    })
    
    const totalBlocks = sizeX * sizeY * sizeZ
    const blockIds = new Int8Array(totalBlocks).fill(-1)
    const blockData = new Int8Array(totalBlocks).fill(0)
    
    blocksArray.forEach(block => {
      const localX = block.x - minX
      const localY = block.y - minY
      const localZ = block.z - minZ
      const index = localX + localZ * sizeX + localY * sizeX * sizeZ
      blockIds[index] = palette[block.blockId]
    })

    const nbtData = createSchematicNBT(sizeX, sizeY, sizeZ, blockIds, blockData, paletteReverse)
    const blob = new Blob([nbtData], { type: 'application/octet-stream' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${schematicName.replace(/\s+/g, '_')}.schem`
    a.click()
    URL.revokeObjectURL(url)
    set({ lastSaved: new Date() })
    
    alert(`投影已导出为 .schem 格式！\n尺寸: ${sizeX}×${sizeY}×${sizeZ}\n方块数: ${blocksArray.length}\n\n可直接用于: WorldEdit, Litematica, etc.`)
  },

  importSchematic: () => {
    get().loadScene()
  }
}))

function writeString(str: string): Uint8Array {
  const encoder = new TextEncoder()
  const strBytes = encoder.encode(str)
  const result = new Uint8Array(2 + strBytes.length)
  const view = new DataView(result.buffer)
  view.setInt16(0, strBytes.length, false)
  result.set(strBytes, 2)
  return result
}

function writeInt32(value: number): Uint8Array {
  const result = new Uint8Array(4)
  const view = new DataView(result.buffer)
  view.setInt32(0, value, false)
  return result
}

function writeInt16(value: number): Uint8Array {
  const result = new Uint8Array(2)
  const view = new DataView(result.buffer)
  view.setInt16(0, value, false)
  return result
}

function writeInt8(value: number): Uint8Array {
  return new Uint8Array([value & 0xFF])
}

function writeInt64(value: number): Uint8Array {
  const result = new Uint8Array(8)
  const view = new DataView(result.buffer)
  view.setBigInt64(0, BigInt(value), false)
  return result
}

function writeIntArray(arr: Int8Array): Uint8Array {
  const header = writeInt32(arr.length)
  const result = new Uint8Array(header.length + arr.length)
  result.set(header, 0)
  result.set(new Uint8Array(arr.buffer, arr.byteOffset, arr.length), header.length)
  return result
}

function writeByteArray(arr: Uint8Array): Uint8Array {
  const header = writeInt32(arr.length)
  const result = new Uint8Array(header.length + arr.length)
  result.set(header, 0)
  result.set(arr, header.length)
  return result
}

function createSchematicNBT(
  width: number, height: number, depth: number,
  blockIds: Int8Array, blockData: Int8Array,
  paletteReverse: Record<number, string>
): Uint8Array {
  const parts: Uint8Array[] = []
  
  parts.push(writeString('Schematic'))
  parts.push(new Uint8Array([11]))
  parts.push(writeIntArray(new Int8Array([width, height, depth])))
  
  parts.push(writeString('Height'))
  parts.push(new Uint8Array([11]))
  parts.push(writeIntArray(new Int8Array([height])))
  
  parts.push(writeString('Length'))
  parts.push(new Uint8Array([11]))
  parts.push(writeIntArray(new Int8Array([depth])))
  
  parts.push(writeString('Width'))
  parts.push(new Uint8Array([11]))
  parts.push(writeIntArray(new Int8Array([width])))
  
  parts.push(writeString('Materials'))
  parts.push(new Uint8Array([8]))
  parts.push(writeString('Alpha'))
  
  parts.push(writeString('Blocks'))
  parts.push(new Uint8Array([7]))
  const blocksUint8 = new Uint8Array(blockIds.length)
  for (let i = 0; i < blockIds.length; i++) {
    blocksUint8[i] = blockIds[i] >= 0 ? blockIds[i] : 0
  }
  parts.push(writeByteArray(blocksUint8))
  
  parts.push(writeString('Data'))
  parts.push(new Uint8Array([7]))
  const dataUint8 = new Uint8Array(blockData.length)
  for (let i = 0; i < blockData.length; i++) {
    dataUint8[i] = blockData[i] & 0xFF
  }
  parts.push(writeByteArray(dataUint8))
  
  const paletteKeys = Object.keys(paletteReverse).map(Number).sort((a, b) => a - b)
  parts.push(writeString('Palette'))
  parts.push(new Uint8Array([10]))
  paletteKeys.forEach(id => {
    parts.push(writeString(paletteReverse[id]))
    parts.push(new Uint8Array([1]))
    parts.push(writeInt32(id))
  })
  parts.push(new Uint8Array([0]))
  
  parts.push(writeString('WEOriginX'))
  parts.push(new Uint8Array([3]))
  parts.push(writeInt32(0))
  
  parts.push(writeString('WEOriginY'))
  parts.push(new Uint8Array([3]))
  parts.push(writeInt32(0))
  
  parts.push(writeString('WEOriginZ'))
  parts.push(new Uint8Array([3]))
  parts.push(writeInt32(0))
  
  parts.push(writeString('WEOffsetX'))
  parts.push(new Uint8Array([3]))
  parts.push(writeInt32(0))
  
  parts.push(writeString('WEOffsetY'))
  parts.push(new Uint8Array([3]))
  parts.push(writeInt32(0))
  
  parts.push(writeString('WEOffsetZ'))
  parts.push(new Uint8Array([3]))
  parts.push(writeInt32(0))
  
  parts.push(new Uint8Array([0]))
  
  let totalLength = 0
  parts.forEach(p => totalLength += p.length)
  
  const result = new Uint8Array(totalLength)
  let offset = 0
  parts.forEach(p => {
    result.set(p, offset)
    offset += p.length
  })
  
  return result
}
