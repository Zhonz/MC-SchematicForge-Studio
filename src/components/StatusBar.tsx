import { useSceneStore } from '@/stores/sceneStore'

export function StatusBar() {
  const { blocks, toolMode } = useSceneStore()

  return (
    <footer className="statusbar">
      <div className="statusbar-left">
        <div className="status-item">
          <span className="status-label">工具</span>
          <span className={`status-value ${toolMode}`}>
            {toolMode === 'place' ? '放置' : toolMode === 'break' ? '破坏' : '选择'}
          </span>
        </div>
        <div className="statusbar-separator"/>
        <div className="status-item">
          <span className="status-label">方块</span>
          <span className="status-value">{blocks.size}</span>
        </div>
      </div>

      <div className="statusbar-center">
        <span className="status-hint">
          左键放置/破坏 · 右键旋转 · 中键平移 · 滚轮缩放
        </span>
      </div>

      <div className="statusbar-right">
        <span className="status-version">SchematicForge v1.0</span>
      </div>

      <style>{`
        .statusbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: var(--statusbar-height);
          padding: 0 12px;
          background: var(--bg-dark);
          border-top: 1px solid var(--border-subtle);
          font-size: 11px;
        }

        .statusbar-left,
        .statusbar-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .statusbar-center {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
        }

        .status-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .status-label {
          color: var(--text-muted);
        }

        .status-value {
          color: var(--text-secondary);
          font-weight: 500;
        }

        .status-value.place {
          color: var(--accent-success);
        }

        .status-value.break {
          color: var(--accent-danger);
        }

        .status-value.select {
          color: var(--accent-primary);
        }

        .statusbar-separator {
          width: 1px;
          height: 12px;
          background: var(--border-subtle);
        }

        .status-hint {
          color: var(--text-muted);
        }

        .status-version {
          color: var(--text-disabled);
        }
      `}</style>
    </footer>
  )
}
