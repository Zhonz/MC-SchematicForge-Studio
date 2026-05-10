import { useSceneStore } from '@/stores/sceneStore'

export function StatusBar() {
  const { blocks, toolMode, selectedBlock, camera } = useSceneStore()

  return (
    <div className="h-8 bg-gray-900/95 backdrop-blur-sm border-t border-gray-700 flex items-center px-4 gap-6 text-xs">
      <div className="flex items-center gap-2">
        <span className="text-gray-400">工具:</span>
        <span className="text-mc-green font-medium">
          {toolMode === 'place' ? '🔨 放置' : toolMode === 'break' ? '⛏️ 破坏' : '📐 选择'}
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-gray-400">方块数:</span>
        <span className="text-white font-medium">{blocks.size}</span>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-gray-400">相机:</span>
        <span className="text-gray-300">
          ({camera.position.x.toFixed(1)}, {camera.position.y.toFixed(1)}, {camera.position.z.toFixed(1)})
        </span>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <span className="text-gray-400">MC投影工坊 v1.0.0</span>
      </div>
    </div>
  )
}
