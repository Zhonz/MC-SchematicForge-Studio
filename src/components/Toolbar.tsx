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
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 2L18 6V14L10 18L2 14V6L10 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M10 2V18" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M2 6L10 9L18 6" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
          <span className="logo-text">SchematicForge</span>
        </div>
      </div>

      <div className="toolbar-center">
        <div className="file-actions">
          <button
            className="file-btn"
            onClick={loadScene}
            data-tooltip="加载示意图"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15V19C21 20 20 21 19 21H5C4 21 3 20 3 19V15M17 8L12 13L7 8M12 3V13"/>
            </svg>
            <span>打开</span>
          </button>
          <button
            className="file-btn"
            onClick={saveScene}
            data-tooltip="保存示意图"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15V7L17 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V15H16C14.9 15 14 14.1 14 13V5H19"/>
              <path d="M9 11H15V5H9V11Z"/>
            </svg>
            <span>保存</span>
          </button>
          <button
            className="file-btn btn-export"
            onClick={exportSchematic}
            data-tooltip="导出投影"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15V19C21 20 20 21 19 21H5C4 21 3 20 3 19V15M17 8L12 3L7 8M12 3V15"/>
            </svg>
            <span>导出</span>
          </button>
        </div>

        <div className="toolbar-divider"/>

        <div className="tool-group">
          <button
            className={`tool-btn ${toolMode === 'place' ? 'active' : ''}`}
            onClick={() => setToolMode('place')}
            data-tooltip="放置 (P)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5V19M5 12H19"/>
            </svg>
            <span>放置</span>
          </button>
          <button
            className={`tool-btn ${toolMode === 'break' ? 'active' : ''}`}
            onClick={() => setToolMode('break')}
            data-tooltip="破坏 (B)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6H21M6 6V20C6 21 7 22 8 22H16C17 22 18 21 18 20V6M9 6V4C9 3 10 2 11 2H13C14 2 15 3 15 4V6"/>
            </svg>
            <span>破坏</span>
          </button>
          <button
            className={`tool-btn ${toolMode === 'select' ? 'active' : ''}`}
            onClick={() => setToolMode('select')}
            data-tooltip="选择 (S)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 3L19 12L12 13L9 20L5 3Z"/>
            </svg>
            <span>选择</span>
          </button>
        </div>

        <div className="toolbar-divider"/>

        <div className="current-block">
          <div 
            className="block-preview"
            style={{ backgroundColor: selectedBlock.color }}
          />
          <div className="block-info">
            <span className="block-name">{selectedBlock.nameZh}</span>
            <span className="block-id">{selectedBlock.id}</span>
          </div>
        </div>
      </div>

      <div className="toolbar-right">
        <button 
          className="tool-btn"
          onClick={clearScene}
          data-tooltip="清空场景"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6H21M19 6V20C19 21 18 22 17 22H7C6 22 5 21 5 20V6M8 6V4C8 3 9 2 10 2H14C15 2 16 3 16 4V6"/>
          </svg>
        </button>
      </div>

      <style>{`
        .toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: var(--toolbar-height);
          padding: 0 12px;
          background: var(--bg-dark);
          border-bottom: 1px solid var(--border-subtle);
        }

        .toolbar-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--accent-primary);
        }

        .logo-text {
          font-size: 13px;
          font-weight: 600;
          letter-spacing: -0.3px;
          color: var(--text-primary);
        }

        .toolbar-center {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .file-actions {
          display: flex;
          gap: 2px;
          padding: 3px;
          background: var(--bg-darkest);
          border-radius: var(--radius-md);
        }

        .file-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          min-width: 64px;
          height: 28px;
          padding: 0 10px;
          background: transparent;
          border: none;
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 120ms var(--ease-out);
          font-size: 12px;
          font-weight: 500;
        }

        .file-btn:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
        }

        .file-btn:active {
          transform: scale(0.98);
        }

        .btn-export {
          background: var(--accent-primary);
          color: #000;
        }

        .btn-export:hover {
          background: var(--accent-primary-dim);
          box-shadow: var(--shadow-glow);
        }

        .tool-group {
          display: flex;
          gap: 2px;
          padding: 3px;
          background: var(--bg-darkest);
          border-radius: var(--radius-md);
        }

        .tool-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          min-width: 56px;
          height: 28px;
          padding: 0 10px;
          background: transparent;
          border: none;
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 120ms var(--ease-out);
          font-size: 12px;
          font-weight: 500;
        }

        .tool-btn:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
        }

        .tool-btn:active {
          transform: scale(0.98);
        }

        .tool-btn.active {
          background: var(--bg-active);
          color: var(--accent-primary);
          box-shadow: inset 0 0 0 1px var(--accent-primary);
        }

        .toolbar-divider {
          width: 1px;
          height: 20px;
          background: var(--border-subtle);
        }

        .current-block {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 10px;
          background: var(--bg-darkest);
          border-radius: var(--radius-md);
        }

        .block-preview {
          width: 20px;
          height: 20px;
          border-radius: 4px;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.1);
        }

        .block-info {
          display: flex;
          flex-direction: column;
        }

        .block-name {
          font-size: 12px;
          font-weight: 500;
          color: var(--text-primary);
          line-height: 1.2;
        }

        .block-id {
          font-size: 10px;
          font-family: var(--font-mono);
          color: var(--text-muted);
          line-height: 1.2;
        }

        .toolbar-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }
      `}</style>
    </header>
  )
}