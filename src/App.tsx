import { useRef, useCallback } from 'react'
import { BlockBrowser } from '@/components/BlockBrowser'
import { Toolbar } from '@/components/Toolbar'
import { StatusBar } from '@/components/StatusBar'
import { useThreeScene } from '@/components/ThreeScene'
import { useSceneStore } from '@/stores/sceneStore'

export function App() {
  const containerRef = useRef<HTMLDivElement>(null)
  useThreeScene(containerRef)
  
  const { toolMode, placeBlock, breakBlock } = useSceneStore()

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (toolMode === 'place') {
      const x = Math.round((e.clientX - window.innerWidth / 2) / 20)
      const y = 0
      const z = Math.round((e.clientY - window.innerHeight / 2) / 20)
      placeBlock(x, y, z)
    }
  }, [toolMode, placeBlock])

  const handleContextMenu = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (toolMode === 'break') {
      const x = Math.round((e.clientX - window.innerWidth / 2) / 20)
      const y = 0
      const z = Math.round((e.clientY - window.innerHeight / 2) / 20)
      breakBlock(x, y, z)
    }
  }, [toolMode, breakBlock])

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-900 overflow-hidden">
      <Toolbar />
      
      <div className="flex-1 flex overflow-hidden">
        <BlockBrowser />
        
        <div 
          ref={containerRef} 
          className="flex-1 relative cursor-crosshair"
          onClick={handleClick}
          onContextMenu={handleContextMenu}
        >
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
            <div className="bg-gray-900/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-gray-700">
              <div className="text-sm text-white font-display font-bold">
                MC投影工坊 SchematicForge Studio
              </div>
              <div className="text-xs text-gray-400 text-center">
                {toolMode === 'place' && '🔨 左键放置方块'}
                {toolMode === 'break' && '⛏️ 右键破坏方块'}
                {toolMode === 'select' && '📐 选择区域'}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <StatusBar />
    </div>
  )
}
