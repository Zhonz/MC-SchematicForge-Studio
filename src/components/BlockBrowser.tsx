import React from 'react'
import { useSceneStore } from '@/stores/sceneStore'
import { BLOCKS, getBlocksByCategory } from '@/utils/blocks'
import type { BlockCategory } from '@/types'

const CATEGORIES: { key: BlockCategory; label: string; icon: string }[] = [
  { key: 'building', label: '建筑方块', icon: '🏗️' },
  { key: 'natural', label: '自然方块', icon: '🌿' },
  { key: 'redstone', label: '红石元件', icon: '⚡' },
  { key: 'decoration', label: '装饰方块', icon: '🎨' },
  { key: 'utility', label: '实用方块', icon: '🔧' },
]

export function BlockBrowser() {
  const { selectedBlock, setSelectedBlock } = useSceneStore()
  const [activeCategory, setActiveCategory] = React.useState<BlockCategory>('building')
  const [searchQuery, setSearchQuery] = React.useState('')

  const filteredBlocks = React.useMemo(() => {
    const blocks = getBlocksByCategory(activeCategory)
    if (!searchQuery) return blocks
    return blocks.filter(b => 
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.nameZh.includes(searchQuery)
    )
  }, [activeCategory, searchQuery])

  return (
    <div className="w-72 bg-gray-900/95 backdrop-blur-sm border-r border-gray-700 flex flex-col h-full">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-display font-bold text-white flex items-center gap-2">
          <span className="text-2xl">📦</span>
          <span>方块浏览器</span>
        </h2>
      </div>

      <div className="p-3 border-b border-gray-700">
        <input
          type="text"
          placeholder="搜索方块..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-mc-green focus:ring-1 focus:ring-mc-green text-sm"
        />
      </div>

      <div className="flex flex-wrap gap-1 p-2 border-b border-gray-700">
        {CATEGORIES.map(cat => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${
              activeCategory === cat.key
                ? 'bg-mc-green text-white shadow-mc-sm'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredBlocks.map(block => (
          <button
            key={block.id}
            onClick={() => setSelectedBlock(block)}
            className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all text-left ${
              selectedBlock.id === block.id
                ? 'bg-mc-green/30 border-2 border-mc-green'
                : 'bg-gray-800/50 hover:bg-gray-700/50 border-2 border-transparent'
            }`}
          >
            <div 
              className="w-8 h-8 rounded shadow-mc-sm"
              style={{ backgroundColor: block.color }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{block.nameZh}</div>
              <div className="text-xs text-gray-400 truncate">{block.name}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="p-3 border-t border-gray-700">
        <div className="text-xs text-gray-400">
          共 {BLOCKS.length} 个方块 | 当前: <span className="text-mc-green">{selectedBlock.nameZh}</span>
        </div>
      </div>
    </div>
  )
}
