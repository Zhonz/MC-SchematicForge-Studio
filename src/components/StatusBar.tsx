import { useSceneStore } from '@/stores/sceneStore'

export function StatusBar() {
  const { blocks, toolMode } = useSceneStore()

  return (
    <footer className="statusbar">
      <div className="statusbar-left">
        <div className="status-group">
          <span className="status-label">工具</span>
          <span className={`status-value tool-${toolMode}`}>
            {toolMode === 'place' ? '放置' : toolMode === 'break' ? '破坏' : '选择'}
          </span>
        </div>
        <div className="statusbar-separator"/>
        <div className="status-group">
          <span className="status-label">方块</span>
          <span className="status-value">{blocks.size}</span>
        </div>
      </div>

      <div className="statusbar-center">
        <span className="status-hint">
          <kbd>LMB</kbd> 放置/破坏 · <kbd>RMB</kbd> 旋转 · <kbd>MMB</kbd> 平移 · <kbd>滚轮</kbd> 缩放
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
          padding: 0 var(--space-4);
          background: var(--bg-elevation-1);
          border-top: 1px solid var(--border-subtle);
          font-size: 12px;
        }

        .statusbar-left,
        .statusbar-right {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        .statusbar-center {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
        }

        .status-group {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        .status-label {
          color: var(--text-hint);
        }

        .status-value {
          color: var(--text-secondary);
          font-weight: 500;
        }

        .status-value.tool-place {
          color: var(--accent-success);
        }

        .status-value.tool-break {
          color: var(--accent-danger);
        }

        .status-value.tool-select {
          color: var(--accent-primary);
        }

        .statusbar-separator {
          width: 1px;
          height: 14px;
          background: var(--border-medium);
        }

        .status-hint {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          color: var(--text-hint);
        }

        .status-hint kbd {
          padding: 2px 6px;
          background: var(--bg-elevation-2);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--text-secondary);
        }

        .status-version {
          color: var(--text-disabled);
          font-size: 11px;
        }
      `}</style>
    </footer>
  )
}
