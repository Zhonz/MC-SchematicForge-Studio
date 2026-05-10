import { useRef, useCallback, useState } from 'react'
import { BlockBrowser } from '@/components/BlockBrowser'
import { Toolbar } from '@/components/Toolbar'
import { StatusBar } from '@/components/StatusBar'
import { SceneViewport } from '@/components/SceneViewport'
import { useSceneStore } from '@/stores/sceneStore'

export function App() {
  const { toolMode } = useSceneStore()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden" style={{
      background: 'var(--color-bg-primary)',
      color: 'var(--color-text-primary)'
    }}>
      <Toolbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />
      
      <div className="flex-1 flex overflow-hidden">
        {sidebarOpen && <BlockBrowser />}
        <SceneViewport />
      </div>
      
      <StatusBar />
    </div>
  )
}
