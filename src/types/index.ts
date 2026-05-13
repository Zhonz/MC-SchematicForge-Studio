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

export interface SchematicMetadata {
  name: string
  author: string
  version: string
  createdAt: string
  modifiedAt: string
  description?: string
  tags?: string[]
}

export interface SchematicData {
  metadata: SchematicMetadata
  blocks: BlockPlacement[]
  regions?: SceneRegion[]
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

export interface LogEntry {
  id: string
  timestamp: number
  level: LogLevel
  message: string
  context?: Record<string, unknown>
  error?: Error
}

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface AppError {
  code: string
  message: string
  severity: ErrorSeverity
  timestamp: number
  context?: Record<string, unknown>
  stack?: string
}

export interface PerformanceMetrics {
  fps: number
  memoryUsage: number
  renderTime: number
  blockCount: number
  lastUpdate: number
}

export interface CacheEntry<T> {
  value: T
  timestamp: number
  ttl: number
}

export type BuildingType = 'house' | 'tower' | 'castle' | 'village' | 'farm' | 'bridge' | 'wall'
export type BuildingStyle = 'medieval' | 'modern' | 'fantasy' | 'industrial' | 'traditional'
export type ComplexityLevel = 'simple' | 'medium' | 'complex' | 'epic'

export interface AIBuildingConfig {
  type: BuildingType
  style: BuildingStyle
  complexity: ComplexityLevel
  size: { width: number; height: number; depth: number }
  seed?: number
  options?: Record<string, unknown>
}

export type RedstoneCircuitType = 
  | 'lever_switch'
  | 'button_door'
  | 'pressure_plate_trap'
  | 'piston_door'
  | 'piston_pusher'
  | 'redstone_clock'
  | 'memory_cell'
  | 'logic_gate'
  | 'counter'
  | 'dispenser_trap'
  | 'hidden_door'
  | 'elevator'
  | 'combination_lock'
  | 'sequential_logic'
  | 'tnt_cannon'
  | 'auto_farm'
  | 'storage_system'
  | 'light_sensor'

export interface RedstoneCircuitConfig {
  type: RedstoneCircuitType
  difficulty: '简单' | '中等' | '困难'
  options?: Record<string, unknown>
}

export interface OperationResult<T = void> {
  success: boolean
  data?: T
  error?: AppError
}

export interface AsyncOperationResult<T = void> extends Promise<OperationResult<T>> {}

export interface Subscription {
  unsubscribe: () => void
}

export interface EventEmitter<T> {
  on(event: string, callback: (data: T) => void): Subscription
  off(event: string, callback: (data: T) => void): void
  emit(event: string, data: T): void
}

export interface ConfigOption {
  key: string
  value: unknown
  type: 'string' | 'number' | 'boolean' | 'object'
  defaultValue: unknown
  description?: string
}

export interface AppConfig {
  [key: string]: ConfigOption
}
