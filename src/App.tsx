import { useState } from 'react'
import { BlockBrowser } from '@/components/BlockBrowser'
import { Toolbar } from '@/components/Toolbar'
import { StatusBar } from '@/components/StatusBar'
import { SceneViewport } from '@/components/SceneViewport'
import { WikiPanel } from '@/components/WikiPanel'
import { StructurePanel } from '@/components/StructurePanel'
import { useSceneStore } from '@/stores/sceneStore'

type PanelTab = 'blocks' | 'structures' | null

export function App() {
  const [leftTab, setLeftTab] = useState<PanelTab>('blocks')
  const [rightTab, setRightTab] = useState<'wiki' | null>(null)

  return (
    <div className="app-container">
      <Toolbar
        leftTab={leftTab}
        rightTab={rightTab}
        onToggleLeft={setLeftTab}
        onToggleRight={setRightTab}
      />
      
      <div className="workspace">
        <div className="sidebar sidebar-left">
          <div className="sidebar-tabs">
            <button
              className={`sidebar-tab ${leftTab === 'blocks' ? 'active' : ''}`}
              onClick={() => setLeftTab(leftTab === 'blocks' ? null : 'blocks')}
              data-tooltip="方块"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 4L8 2L14 4V12L8 14L2 12V4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M8 2V14" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M2 4L8 6L14 4" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
            </button>
            <button
              className={`sidebar-tab ${leftTab === 'structures' ? 'active' : ''}`}
              onClick={() => setLeftTab(leftTab === 'structures' ? null : 'structures')}
              data-tooltip="建筑"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="6" width="4" height="8" stroke="currentColor" strokeWidth="1.5"/>
                <rect x="6" y="3" width="4" height="11" stroke="currentColor" strokeWidth="1.5"/>
                <rect x="10" y="8" width="4" height="6" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
            </button>
          </div>
          
          {leftTab === 'blocks' && (
            <div className="sidebar-content">
              <BlockBrowser />
            </div>
          )}
          
          {leftTab === 'structures' && (
            <div className="sidebar-content">
              <StructurePanel />
            </div>
          )}
        </div>
        
        <div className="viewport-container">
          <SceneViewport />
        </div>
        
        <div className="sidebar sidebar-right">
          <div className="sidebar-tabs">
            <button
              className={`sidebar-tab ${rightTab === 'wiki' ? 'active' : ''}`}
              onClick={() => setRightTab(rightTab === 'wiki' ? null : 'wiki')}
              data-tooltip="Wiki"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 3H12C12.5523 3 13 3.44772 13 4V12C13 12.5523 12.5523 13 12 13H4C3.44772 13 3 12.5523 3 12V4C3 3.44772 3.44772 3 4 3Z" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M5 5H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M5 7H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M5 9H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
          
          {rightTab === 'wiki' && (
            <div className="sidebar-content">
              <WikiPanel />
            </div>
          )}
        </div>
      </div>
      
      <StatusBar />
      
      <style>{`
        .app-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: var(--bg-darkest);
          overflow: hidden;
        }
        
        .workspace {
          display: flex;
          flex: 1;
          overflow: hidden;
        }
        
        .sidebar {
          display: flex;
          flex-direction: column;
          background: var(--bg-dark);
          border: 1px solid var(--border-subtle);
          transition: width 200ms var(--ease-out);
        }
        
        .sidebar-left {
          width: var(--sidebar-width);
          border-right: 1px solid var(--border-subtle);
          border-top: none;
          border-bottom: none;
          border-left: none;
        }
        
        .sidebar-right {
          width: 0;
          border-left: 1px solid var(--border-subtle);
          border-top: none;
          border-bottom: none;
          border-right: none;
          overflow: hidden;
        }
        
        .sidebar-right.open {
          width: var(--sidebar-width);
        }
        
        .sidebar-tabs {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 6px;
          background: var(--bg-darkest);
          border-bottom: 1px solid var(--border-subtle);
        }
        
        .sidebar-left .sidebar-tabs {
          flex-direction: row;
          border-bottom: none;
          border-right: 1px solid var(--border-subtle);
        }
        
        .sidebar-tab {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          padding: 0;
          background: transparent;
          border: none;
          border-radius: var(--radius-md);
          color: var(--text-muted);
          cursor: pointer;
          transition: all 120ms var(--ease-out);
        }
        
        .sidebar-tab:hover {
          background: var(--bg-hover);
          color: var(--text-secondary);
        }
        
        .sidebar-tab.active {
          background: var(--bg-active);
          color: var(--accent-primary);
          box-shadow: inset 0 0 0 1px var(--accent-primary);
        }
        
        .sidebar-content {
          flex: 1;
          overflow: hidden;
        }
        
        .viewport-container {
          flex: 1;
          position: relative;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}
