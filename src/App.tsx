import { useState, useCallback } from 'react'
import { BlockBrowser } from '@/components/BlockBrowser'
import { Toolbar } from '@/components/Toolbar'
import { StatusBar } from '@/components/StatusBar'
import { SceneViewport } from '@/components/SceneViewport'
import { WikiPanel } from '@/components/WikiPanel'
import { StructurePanel } from '@/components/StructurePanel'
import { useSceneStore } from '@/stores/sceneStore'

type SidePanel = 'blocks' | 'wiki' | 'structures' | null

export function App() {
  const { toolMode } = useSceneStore()
  const [leftPanel, setLeftPanel] = useState<SidePanel>('blocks')
  const [rightPanel, setRightPanel] = useState<SidePanel>(null)
  const [wikiSearchQuery, setWikiSearchQuery] = useState('')

  const handleWikiLookup = useCallback((query: string) => {
    setWikiSearchQuery(query)
    setRightPanel('wiki')
  }, [])

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden" style={{
      background: 'var(--color-bg-primary)',
      color: 'var(--color-text-primary)'
    }}>
      <Toolbar
        leftPanel={leftPanel}
        rightPanel={rightPanel}
        onToggleLeft={(panel) => setLeftPanel(leftPanel === panel ? null : panel)}
        onToggleRight={(panel) => setRightPanel(rightPanel === panel ? null : panel)}
      />
      
      <div className="flex-1 flex overflow-hidden">
        {leftPanel === 'blocks' && <BlockBrowser onWikiLookup={handleWikiLookup} />}
        {leftPanel === 'structures' && <StructurePanel />}
        <SceneViewport />
        {rightPanel === 'wiki' && <WikiPanel initialQuery={wikiSearchQuery} />}
      </div>
      
      <StatusBar />
    </div>
  )
}
