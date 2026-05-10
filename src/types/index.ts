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
  properties?: BlockProperties
}

export interface BlockProperties {
  facing?: 'north' | 'south' | 'east' | 'west' | 'up' | 'down'
  rotation?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15
  delay?: 1 | 2 | 3 | 4
  powered?: boolean
  locked?: boolean
  mode?: 'compare' | 'subtract' | 'off'
  extended?: boolean
  half?: 'top' | 'bottom'
  hinge?: 'left' | 'right'
  open?: boolean
  triggered?: boolean
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
