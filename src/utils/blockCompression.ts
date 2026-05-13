export interface BlockPlacement {
  x: number
  y: number
  z: number
  blockId: string
  properties?: Record<string, unknown>
}

export interface CompressedBlock {
  x: number
  y: number
  z: number
  blockType: number
  properties?: number
}

export interface BlockPalette {
  [blockId: string]: number
}

export interface CompressedSchematic {
  version: number
  name: string
  size: { x: number; y: number; z: number }
  palette: BlockPalette
  blocks: Uint16Array
  metadata?: {
    author?: string
    createdAt?: string
    modifiedAt?: string
  }
}

export class BlockCompressor {
  private palette: BlockPalette = {}
  private reversePalette: Map<number, string> = new Map()
  private paletteIndex: number = 0

  reset(): void {
    this.palette = {}
    this.reversePalette.clear()
    this.paletteIndex = 0
  }

  private getOrCreatePaletteIndex(blockId: string): number {
    if (this.palette[blockId] !== undefined) {
      return this.palette[blockId]
    }
    
    const index = this.paletteIndex++
    this.palette[blockId] = index
    this.reversePalette.set(index, blockId)
    return index
  }

  compress(blocks: Map<string, BlockPlacement>): CompressedSchematic | null {
    if (blocks.size === 0) return null

    this.reset()

    let minX = Infinity, minY = Infinity, minZ = Infinity
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity

    const blockArray: BlockPlacement[] = []
    
    blocks.forEach((placement) => {
      const { x, y, z, blockId, properties } = placement
      blockArray.push({ x, y, z, blockId, properties })
      
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      minZ = Math.min(minZ, z)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
      maxZ = Math.max(maxZ, z)
      
      this.getOrCreatePaletteIndex(blockId)
    })

    const sizeX = maxX - minX + 1
    const sizeY = maxY - minY + 1
    const sizeZ = maxZ - minZ + 1
    const totalBlocks = sizeX * sizeY * sizeZ

    const compressedBlocks = new Uint16Array(totalBlocks)
    compressedBlocks.fill(65535)

    for (const block of blockArray) {
      const localX = block.x - minX
      const localY = block.y - minY
      const localZ = block.z - minZ
      
      const index = localX + localZ * sizeX + localY * sizeX * sizeZ
      const blockType = this.palette[block.blockId]
      
      compressedBlocks[index] = blockType
    }

    return {
      version: 1,
      name: 'compressed',
      size: { x: sizeX, y: sizeY, z: sizeZ },
      palette: this.palette,
      blocks: compressedBlocks
    }
  }

  decompress(schematic: CompressedSchematic): Map<string, BlockPlacement> {
    const blocks = new Map<string, BlockPlacement>()
    const { size, palette, blocks: compressedBlocks } = schematic
    const { x: sizeX, y: sizeY, z: sizeZ } = size

    for (let y = 0; y < sizeY; y++) {
      for (let z = 0; z < sizeZ; z++) {
        for (let x = 0; x < sizeX; x++) {
          const index = x + z * sizeX + y * sizeX * sizeZ
          const blockType = compressedBlocks[index]
          
          if (blockType !== 65535) {
            const blockId = palette[blockType]
            if (blockId) {
              const key = `${x},${y},${z}`
              blocks.set(key, { x, y, z, blockId: String(blockId) })
            }
          }
        }
      }
    }

    return blocks
  }

  getCompressionRatio(original: number, compressed: number): number {
    if (original === 0) return 0
    return Math.round((1 - compressed / original) * 10000) / 100
  }

  getPaletteSize(): number {
    return this.paletteIndex
  }
}

export class SpatialIndex {
  private octree: OctreeNode | null = null
  private blockIndex: Map<string, string> = new Map()

  build(blocks: Map<string, BlockPlacement>): void {
    this.blockIndex.clear()
    
    const positions: Array<{ x: number; y: number; z: number; key: string }> = []
    
    blocks.forEach((placement, key) => {
      const { x, y, z } = placement
      positions.push({ x, y, z, key })
      this.blockIndex.set(`${x},${y},${z}`, key)
    })

    if (positions.length > 0) {
      const bounds = this.calculateBounds(positions)
      this.octree = new OctreeNode(bounds)
      positions.forEach(pos => {
        this.octree?.insert(pos)
      })
    }
  }

  private calculateBounds(positions: Array<{ x: number; y: number; z: number }>) {
    let minX = Infinity, minY = Infinity, minZ = Infinity
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity

    positions.forEach(pos => {
      minX = Math.min(minX, pos.x)
      minY = Math.min(minY, pos.y)
      minZ = Math.min(minZ, pos.z)
      maxX = Math.max(maxX, pos.x)
      maxY = Math.max(maxY, pos.y)
      maxZ = Math.max(maxZ, pos.z)
    })

    const centerX = (minX + maxX) / 2
    const centerY = (minY + maxY) / 2
    const centerZ = (minZ + maxZ) / 2
    const size = Math.max(maxX - minX, maxY - minY, maxZ - minZ) / 2 + 1

    return { centerX, centerY, centerZ, size }
  }

  queryRadius(x: number, y: number, z: number, radius: number): string[] {
    if (!this.octree) return []
    return this.octree.queryRadius(x, y, z, radius)
  }

  queryBox(minX: number, minY: number, minZ: number, maxX: number, maxY: number, maxZ: number): string[] {
    if (!this.octree) return []
    return this.octree.queryBox(minX, minY, minZ, maxX, maxY, maxZ)
  }

  getNeighbors(x: number, y: number, z: number): string[] {
    return this.queryBox(x - 1, y - 1, z - 1, x + 1, y + 1, z + 1)
  }
}

interface Bounds {
  centerX: number
  centerY: number
  centerZ: number
  size: number
}

class OctreeNode {
  private bounds: Bounds
  private children: OctreeNode[] | null = null
  private positions: Array<{ x: number; y: number; z: number; key: string }> = []
  private readonly maxItems: number = 8
  private readonly maxDepth: number = 8
  private depth: number

  constructor(bounds: Bounds, depth: number = 0) {
    this.bounds = bounds
    this.depth = depth
  }

  insert(pos: { x: number; y: number; z: number; key: string }): void {
    if (!this.contains(pos)) return

    if (this.children === null && (this.positions.length < this.maxItems || this.depth >= this.maxDepth)) {
      this.positions.push(pos)
      return
    }

    if (this.children === null) {
      this.subdivide()
    }

    for (const child of this.children!) {
      child.insert(pos)
    }
  }

  private subdivide(): void {
    const { centerX, centerY, centerZ, size } = this.bounds
    const halfSize = size / 2

    const offsets = [
      [-1, -1, -1], [-1, -1, 1], [-1, 1, -1], [-1, 1, 1],
      [1, -1, -1], [1, -1, 1], [1, 1, -1], [1, 1, 1]
    ]

    this.children = offsets.map(([ox, oy, oz]) => {
      const newBounds: Bounds = {
        centerX: centerX + ox * halfSize,
        centerY: centerY + oy * halfSize,
        centerZ: centerZ + oz * halfSize,
        size: halfSize
      }
      return new OctreeNode(newBounds, this.depth + 1)
    })

    for (const pos of this.positions) {
      for (const child of this.children) {
        child.insert(pos)
      }
    }
    this.positions = []
  }

  private contains(pos: { x: number; y: number; z: number }): boolean {
    const { centerX, centerY, centerZ, size } = this.bounds
    const half = size
    return (
      pos.x >= centerX - half && pos.x < centerX + half &&
      pos.y >= centerY - half && pos.y < centerY + half &&
      pos.z >= centerZ - half && pos.z < centerZ + half
    )
  }

  queryRadius(x: number, y: number, z: number, radius: number): string[] {
    const results: string[] = []
    
    const { centerX, centerY, centerZ, size } = this.bounds
    const half = size
    const minDist = Math.sqrt(
      Math.pow(centerX - x - Math.sign(centerX - x) * half, 2) +
      Math.pow(centerY - y - Math.sign(centerY - y) * half, 2) +
      Math.pow(centerZ - z - Math.sign(centerZ - z) * half, 2)
    )
    
    if (minDist > radius) return results

    for (const pos of this.positions) {
      const dist = Math.sqrt(
        Math.pow(pos.x - x, 2) +
        Math.pow(pos.y - y, 2) +
        Math.pow(pos.z - z, 2)
      )
      if (dist <= radius) {
        results.push(pos.key)
      }
    }

    if (this.children) {
      for (const child of this.children) {
        results.push(...child.queryRadius(x, y, z, radius))
      }
    }

    return results
  }

  queryBox(minX: number, minY: number, minZ: number, maxX: number, maxY: number, maxZ: number): string[] {
    const results: string[] = []

    const { centerX, centerY, centerZ, size } = this.bounds
    const half = size

    if (
      centerX + half < minX || centerX - half > maxX ||
      centerY + half < minY || centerY - half > maxY ||
      centerZ + half < minZ || centerZ - half > maxZ
    ) {
      return results
    }

    for (const pos of this.positions) {
      if (
        pos.x >= minX && pos.x <= maxX &&
        pos.y >= minY && pos.y <= maxY &&
        pos.z >= minZ && pos.z <= maxZ
      ) {
        results.push(pos.key)
      }
    }

    if (this.children) {
      for (const child of this.children) {
        results.push(...child.queryBox(minX, minY, minZ, maxX, maxY, maxZ))
      }
    }

    return results
  }
}

export const blockCompressor = new BlockCompressor()
export const spatialIndex = new SpatialIndex()
