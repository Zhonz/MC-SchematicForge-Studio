export interface BlockData {
  id: string
  name: string
  nameZh: string
  color: string
  hardness: number
  transparent: boolean
  category: BlockCategory
}

export type BlockCategory = 
  | 'building'
  | 'natural'
  | 'redstone'
  | 'decoration'
  | 'utility'

export interface BlockPlacement {
  x: number
  y: number
  z: number
  blockId: string
  state?: Record<string, unknown>
}

export interface SceneRegion {
  name: string
  origin: { x: number; y: number; z: number }
  size: { x: number; y: number; z: number }
  blocks: BlockPlacement[]
}

export type ToolMode = 'place' | 'break' | 'select'

export interface CameraState {
  position: { x: number; y: number; z: number }
  target: { x: number; y: number; z: number }
  zoom: number
  rotation: { x: number; y: number }
}
