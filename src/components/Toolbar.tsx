import { useSceneStore } from '@/stores/sceneStore'

type PanelTab = 'blocks' | 'structures' | null

interface ToolbarProps {
  leftTab: PanelTab
  rightTab: 'wiki' | null
  onToggleLeft: (tab: PanelTab) => void
  onToggleRight: (tab: 'wiki' | null) => void
}

export function Toolbar({ leftTab, rightTab, onToggleLeft, onToggleRight }: ToolbarProps) {
  const { toolMode, setToolMode, clearScene, selectedBlock, saveScene, loadScene, exportSchematic } = useSceneStore()

  return (
    <header className="toolbar">
      <div className="toolbar-left">
        <div className="logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 3L21 8V16L12 21L3 16V8L12 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M12 3V21" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M3 8L12 12L21 8" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
          <span className="logo-text">SchematicForge</span>
        </div>
      </div>

      <div className="toolbar-center">
        <div className="file-actions">
          <button
            className="toolbar-btn"
            onClick={loadScene}
            data-tooltip="打开文件"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
          <button
            className="toolbar-btn"
            onClick={saveScene}
            data-tooltip="保存文件"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
          </button>
          <button
            className="toolbar-btn btn-accent"
            onClick={exportSchematic}
            data-tooltip="导出投影"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <span>导出</span>
          </button>
        </div>

        <div className="toolbar-separator"/>

        <div className="tool-group">
          <button
            className={`tool-btn ${toolMode === 'place' ? 'active' : ''}`}
            onClick={() => setToolMode('place')}
            data-tooltip="放置模式 [P]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
          <button
            className={`tool-btn ${toolMode === 'break' ? 'active' : ''}`}
            onClick={() => setToolMode('break')}
            data-tooltip="破坏模式 [B]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18"/>
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
            </svg>
          </button>
          <button
            className={`tool-btn ${toolMode === 'select' ? 'active' : ''}`}
            onClick={() => setToolMode('select')}
            data-tooltip="选择模式 [S]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>
              <path d="M13 13l6 6"/>
            </svg>
          </button>
        </div>

        <div className="toolbar-separator"/>

        <div className="current-block-display">
          <div 
            className="block-swatch"
            style={{ backgroundColor: selectedBlock.color }}
          />
          <div className="block-details">
            <span className="block-name">{selectedBlock.nameZh}</span>
            <span className="block-id">{selectedBlock.id}</span>
          </div>
        </div>
      </div>

      <div className="toolbar-right">
        <button 
          className="toolbar-btn"
          onClick={clearScene}
          data-tooltip="清空场景"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            <line x1="10" y1="11" x2="10" y2="17"/>
            <line x1="14" y1="11" x2="14" y2="17"/>
          </svg>
        </button>
      </div>

      <style>{`
        .toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: var(--toolbar-height);
          padding: 0 var(--space-4);
          background: var(--bg-elevation-1);
          border-bottom: 1px solid var(--border-subtle);
        }

        .toolbar-left {
          display: flex;
          align-items: center;
          gap: var(--space-6);
        }

        .logo {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          color: var(--accent-primary);
        }

        .logo-text {
          font-size: 16px;
          font-weight: 600;
          letter-spacing: -0.3px;
          color: var(--text-primary);
        }

        .toolbar-center {
          display: flex;
          align-items: center;
          gap: var(--space-4);
        }

        .file-actions {
          display: flex;
          gap: var(--space-1);
          padding: var(--space-1);
          background: var(--bg-elevation-2);
          border-radius: var(--radius-lg);
        }

        .toolbar-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-2);
          height: 36px;
          padding: 0 var(--space-3);
          background: transparent;
          border: none;
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all var(--duration-fast) var(--ease-out);
          font-size: 13px;
          font-weight: 500;
        }

        .toolbar-btn:hover {
          background: var(--bg-elevation-3);
          color: var(--text-primary);
        }

        .toolbar-btn:active {
          background: var(--bg-elevation-4);
          transform: scale(0.98);
        }

        .btn-accent {
          background: var(--accent-primary);
          color: #000000;
          font-weight: 600;
          padding: 0 var(--space-4);
        }

        .btn-accent:hover {
          background: var(--accent-primary-dim);
          box-shadow: var(--shadow-glow);
          color: #000000;
        }

        .tool-group {
          display: flex;
          gap: var(--space-1);
          padding: var(--space-1);
          background: var(--bg-elevation-2);
          border-radius: var(--radius-lg);
        }

        .tool-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 36px;
          background: transparent;
          border: none;
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all var(--duration-fast) var(--ease-out);
        }

        .tool-btn:hover {
          background: var(--bg-elevation-3);
          color: var(--text-primary);
        }

        .tool-btn:active {
          transform: scale(0.95);
        }

        .tool-btn.active {
          background: var(--bg-elevation-4);
          color: var(--accent-primary);
          box-shadow: var(--elevation-1);
        }

        .toolbar-separator {
          width: 1px;
          height: 24px;
          background: var(--border-medium);
        }

        .current-block-display {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-2) var(--space-4);
          background: var(--bg-elevation-2);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-subtle);
        }

        .block-swatch {
          width: 24px;
          height: 24px;
          border-radius: var(--radius-md);
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.1);
        }

        .block-details {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .block-name {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          line-height: 1.2;
        }

        .block-id {
          font-size: 11px;
          font-family: var(--font-mono);
          color: var(--text-secondary);
          line-height: 1.2;
        }

        .toolbar-right {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }
      `}</style>
    </header>
  )
}
