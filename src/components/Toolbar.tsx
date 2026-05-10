import { useSceneStore } from '@/stores/sceneStore'

interface ToolbarProps {
  onToggleSidebar: () => void
  sidebarOpen: boolean
}

const TOOLS: Array<{
  key: 'place' | 'break' | 'select'
  label: string
  icon: string
  shortcut: string
}> = [
  { key: 'place', label: '放置', icon: '🔨', shortcut: 'P' },
  { key: 'break', label: '破坏', icon: '⛏️', shortcut: 'B' },
  { key: 'select', label: '选择', icon: '📐', shortcut: 'S' },
]

export function Toolbar({ onToggleSidebar, sidebarOpen }: ToolbarProps) {
  const { toolMode, setToolMode, clearScene, selectedBlock } = useSceneStore()

  return (
    <div className="flex items-center px-4 gap-3 flex-shrink-0 border-b" style={{
      height: 'var(--toolbar-height)',
      background: 'var(--color-bg-surface)',
      borderColor: 'var(--color-border)'
    }}>
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="w-8 h-8 flex items-center justify-center rounded-md transition-all"
          style={{
            background: sidebarOpen ? 'var(--color-bg-hover)' : 'transparent',
            color: 'var(--color-text-secondary)',
          }}
        >
          {sidebarOpen ? '◀' : '▶'}
        </button>
        
        <div className="flex items-center gap-1 px-1 py-0.5 rounded-md" style={{
          background: 'var(--color-bg-primary)'
        }}>
          {TOOLS.map(tool => (
            <button
              key={tool.key}
              onClick={() => setToolMode(tool.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                toolMode === tool.key ? 'tool-active' : ''
              }`}
              style={{
                color: toolMode === tool.key ? 'var(--color-accent-green)' : 'var(--color-text-secondary)'
              }}
            >
              <span>{tool.icon}</span>
              <span>{tool.label}</span>
              <span className="text-[10px] opacity-50 ml-1">{tool.shortcut}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="w-px h-6" style={{ background: 'var(--color-border-strong)' }} />

      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-sm shadow-voxel" style={{ backgroundColor: selectedBlock.color }} />
        <span className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>
          {selectedBlock.nameZh}
        </span>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <button className="btn btn-primary">
          <span>💾</span>
          <span>导出</span>
        </button>
        <button 
          onClick={clearScene}
          className="btn btn-danger"
        >
          <span>🗑️</span>
          <span>清空</span>
        </button>
      </div>
    </div>
  )
}
