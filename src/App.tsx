import { useState } from 'react'
import { BlockBrowser } from '@/components/BlockBrowser'
import { Toolbar } from '@/components/Toolbar'
import { StatusBar } from '@/components/StatusBar'
import { SceneViewport } from '@/components/SceneViewport'
import { WikiPanel } from '@/components/WikiPanel'
import { StructurePanel } from '@/components/StructurePanel'

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
        <div className={`sidebar sidebar-left ${leftTab ? 'open' : 'collapsed'}`}>
          {leftTab === 'blocks' && (
            <BlockBrowser />
          )}
          
          {leftTab === 'structures' && (
            <StructurePanel />
          )}
        </div>
        
        <div className="viewport-container">
          <SceneViewport />
        </div>
        
        <div className={`sidebar sidebar-right ${rightTab ? 'open' : 'collapsed'}`}>
          {rightTab === 'wiki' && (
            <WikiPanel />
          )}
        </div>
      </div>
      
      <StatusBar />
      
      <style>{`
        .app-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: var(--bg-elevation-0);
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
          background: var(--bg-elevation-1);
          transition: all var(--duration-normal) var(--ease-out);
          overflow: hidden;
        }
        
        .sidebar-left {
          width: 0;
          border-right: 1px solid var(--border-subtle);
        }
        
        .sidebar-left.open {
          width: var(--sidebar-width);
        }
        
        .sidebar-left.collapsed {
          width: 0;
        }
        
        .sidebar-right {
          width: 0;
          border-left: 1px solid var(--border-subtle);
        }
        
        .sidebar-right.open {
          width: var(--sidebar-width);
        }
        
        .sidebar-right.collapsed {
          width: 0;
        }
        
        .viewport-container {
          flex: 1;
          position: relative;
          overflow: hidden;
          background: var(--bg-elevation-0);
        }
      `}</style>
    </div>
  )
}
