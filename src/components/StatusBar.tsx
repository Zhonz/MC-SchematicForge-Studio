import { useSceneStore } from '@/stores/sceneStore'

export function StatusBar() {
  const { blocks, toolMode, camera } = useSceneStore()

  return (
    <div className="flex items-center px-4 gap-4 flex-shrink-0 border-t text-[10px]" style={{
      height: 'var(--statusbar-height)',
      background: 'var(--color-bg-surface)',
      borderColor: 'var(--color-border)',
      color: 'var(--color-text-muted)'
    }}>
      <div className="flex items-center gap-1.5">
        <span>工具:</span>
        <span style={{ color: 'var(--color-accent-green)' }}>
          {toolMode === 'place' ? '放置' : toolMode === 'break' ? '破坏' : '选择'}
        </span>
      </div>
      
      <div className="w-px h-3" style={{ background: 'var(--color-border)' }} />
      
      <div className="flex items-center gap-1.5">
        <span>方块:</span>
        <span style={{ color: 'var(--color-text-primary)' }}>{blocks.size}</span>
      </div>
      
      <div className="w-px h-3" style={{ background: 'var(--color-border)' }} />
      
      <div className="flex items-center gap-1.5">
        <span>相机:</span>
        <span style={{ fontFamily: 'var(--font-mono)' }}>
          {camera.position.x.toFixed(1)}, {camera.position.y.toFixed(1)}, {camera.position.z.toFixed(1)}
        </span>
      </div>

      <div className="flex-1" />

      <div style={{ color: 'var(--color-text-muted)' }}>
        MC投影工坊 v1.0.0
      </div>
    </div>
  )
}
