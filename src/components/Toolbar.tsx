import React from 'react'
import { useSceneStore } from '@/stores/sceneStore'
import type { ToolMode } from '@/types'

const TOOLS: { key: ToolMode; label: string; icon: string }[] = [
  { key: 'place', label: '放置', icon: '🔨' },
  { key: 'break', label: '破坏', icon: '⛏️' },
  { key: 'select', label: '选择', icon: '📐' },
]

export function Toolbar() {
  const { toolMode, setToolMode, clearScene, selectedBlock } = useSceneStore()

  return (
    <div className="h-14 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700 flex items-center px-4 gap-4">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
          {TOOLS.map(tool => (
            <button
              key={tool.key}
              onClick={() => setToolMode(tool.key)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                toolMode === tool.key
                  ? 'bg-mc-green text-white shadow-mc-sm'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              {tool.icon} {tool.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-8 w-px bg-gray-700" />

      <div className="flex items-center gap-2">
        <div 
          className="w-8 h-8 rounded shadow-mc-sm"
          style={{ backgroundColor: selectedBlock.color }}
        />
        <span className="text-sm text-white font-medium">{selectedBlock.nameZh}</span>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            const { exportToLitematic } = require('@/utils/export')
            exportToLitematic()
          }}
          className="px-4 py-1.5 bg-mc-green text-white rounded-lg text-sm font-medium hover:bg-mc-dark-green transition-all shadow-mc-sm"
        >
          💾 导出投影
        </button>
        <button
          onClick={clearScene}
          className="px-4 py-1.5 bg-red-600/80 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-all shadow-mc-sm"
        >
          🗑️ 清空场景
        </button>
      </div>
    </div>
  )
}
