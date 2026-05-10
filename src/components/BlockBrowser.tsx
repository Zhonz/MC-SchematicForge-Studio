import { useState, useMemo } from 'react'
import { useSceneStore } from '@/stores/sceneStore'
import { BLOCKS, getBlocksByCategory } from '@/utils/blocks'
import type { BlockCategory, BlockData } from '@/types'

const CATEGORIES: Array<{ key: BlockCategory; label: string; icon: string }> = [
  { key: 'building', label: '建筑', icon: '🏗️' },
  { key: 'natural', label: '自然', icon: '🌿' },
  { key: 'redstone', label: '红石', icon: '⚡' },
  { key: 'decoration', label: '装饰', icon: '🎨' },
  { key: 'utility', label: '实用', icon: '🔧' },
]

export function BlockBrowser() {
  const { selectedBlock, setSelectedBlock } = useSceneStore()
  const [activeCategory, setActiveCategory] = useState<BlockCategory>('building')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredBlocks = useMemo(() => {
    const blocks = getBlocksByCategory(activeCategory)
    if (!searchQuery.trim()) return blocks
    return blocks.filter(b => 
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.nameZh.includes(searchQuery)
    )
  }, [activeCategory, searchQuery])

  const blockCount = BLOCKS.length

  return (
    <div className="flex flex-col flex-shrink-0 border-r" style={{
      width: 'var(--sidebar-width)',
      background: 'var(--color-bg-surface)',
      borderColor: 'var(--color-border)'
    }}>
      <div className="px-4 py-3 border-b flex-shrink-0" style={{ borderColor: 'var(--color-border)' }}>
        <div className="text-sm font-display font-bold tracking-wider" style={{ color: 'var(--color-text-primary)' }}>
          方块浏览器
        </div>
        <div className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
          {blockCount} 个方块
        </div>
      </div>

      <div className="px-3 py-2 border-b flex-shrink-0" style={{ borderColor: 'var(--color-border)' }}>
        <input
          type="text"
          placeholder="搜索方块..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-search"
        />
      </div>

      <div className="flex flex-wrap gap-0.5 px-2 py-2 border-b flex-shrink-0" style={{ borderColor: 'var(--color-border)' }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`category-tab ${activeCategory === cat.key ? 'active' : ''}`}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        {filteredBlocks.map(block => (
          <div
            key={block.id}
            onClick={() => setSelectedBlock(block)}
            className={`block-item ${selectedBlock.id === block.id ? 'selected' : ''}`}
          >
            <div className="block-icon" style={{ backgroundColor: block.color }} />
            <div className="flex-1 min-w-0">
              <div className="block-name truncate">{block.nameZh}</div>
              <div className="block-name-en truncate">{block.name}</div>
            </div>
          </div>
        ))}
        
        {filteredBlocks.length === 0 && (
          <div className="py-8 text-center" style={{ color: 'var(--color-text-muted)' }}>
            <div className="text-2xl mb-2">🔍</div>
            <div className="text-xs">没有找到方块</div>
          </div>
        )}
      </div>

      {selectedBlock && (
        <div className="px-3 py-2 border-t flex-shrink-0" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-sm shadow-voxel" style={{ backgroundColor: selectedBlock.color }} />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                {selectedBlock.nameZh}
              </div>
              <div className="text-[10px] truncate" style={{ color: 'var(--color-text-muted)' }}>
                {selectedBlock.id}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
