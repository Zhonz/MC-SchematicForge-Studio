import { useState, useMemo, useEffect, useCallback } from 'react'
import { useSceneStore } from '@/stores/sceneStore'
import { BLOCKS, getBlocksByCategory, searchBlocks } from '@/utils/blocks'
import { getMCTextureURL } from '@/services/textureService'
import type { BlockCategory, BlockData } from '@/types'

const QUICK_SLOTS = 9

const MAIN_CATEGORIES: Array<{ key: BlockCategory | 'all' | 'search'; label: string; emoji: string }> = [
  { key: 'all', label: '全部', emoji: '📦' },
  { key: 'building', label: '建筑', emoji: '🧱' },
  { key: 'natural', label: '自然', emoji: '🌿' },
  { key: 'redstone', label: '红石', emoji: '⚡' },
  { key: 'decoration', label: '装饰', emoji: '🎨' },
  { key: 'utility', label: '功能', emoji: '🔧' },
]

const FAVORITES_STORAGE_KEY = 'schematicforge_favorites'

function loadFavorites(): BlockData[] {
  try {
    const saved = localStorage.getItem(FAVORITES_STORAGE_KEY)
    if (saved) {
      const ids = JSON.parse(saved) as string[]
      return ids.map(id => BLOCKS.find(b => b.id === id)).filter((b): b is BlockData => b !== undefined)
    }
  } catch {}
  return [BLOCKS[0], BLOCKS[1], BLOCKS[2], BLOCKS[3], BLOCKS[4], BLOCKS[5], BLOCKS[6], BLOCKS[7], BLOCKS[8]]
}

function saveFavorites(favorites: BlockData[]) {
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites.map(b => b.id)))
  } catch {}
}

export function BlockBrowser() {
  const { selectedBlock, setSelectedBlock } = useSceneStore()
  const [activeCategory, setActiveCategory] = useState<BlockCategory | 'all' | 'search'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [favorites, setFavorites] = useState<BlockData[]>(loadFavorites)
  const [failedTextures, setFailedTextures] = useState<Set<string>>(new Set())
  const [rightClickedSlot, setRightClickedSlot] = useState<number | null>(null)

  useEffect(() => {
    if (selectedBlock && !favorites.find(f => f.id === selectedBlock.id)) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key >= '1' && e.key <= '9') {
          const idx = parseInt(e.key) - 1
          if (idx < favorites.length) {
            setSelectedBlock(favorites[idx])
          }
        }
      }
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedBlock, favorites, setSelectedBlock])

  const filteredBlocks = useMemo(() => {
    if (searchQuery.trim()) {
      setActiveCategory('search')
      return searchBlocks(searchQuery)
    }
    if (activeCategory === 'all' || activeCategory === 'search') {
      return BLOCKS
    }
    return getBlocksByCategory(activeCategory)
  }, [activeCategory, searchQuery])

  const handleTextureError = (blockId: string) => {
    setFailedTextures(prev => new Set(prev).add(blockId))
  }

  const handleQuickSlotClick = (block: BlockData, index: number) => {
    setSelectedBlock(block)
  }

  const handleQuickSlotRightClick = (e: React.MouseEvent, index: number) => {
    e.preventDefault()
    setRightClickedSlot(index)
  }

  const handleAddToFavorites = (block: BlockData) => {
    if (rightClickedSlot !== null) {
      const newFavorites = [...favorites]
      newFavorites[rightClickedSlot] = block
      setFavorites(newFavorites)
      saveFavorites(newFavorites)
      setRightClickedSlot(null)
    }
  }

  const closeSlotMenu = useCallback(() => {
    setRightClickedSlot(null)
  }, [])

  return (
    <div className="block-browser-mc" onClick={closeSlotMenu}>
      <div className="panel-header">
        <span className="title">方块选择</span>
        <span className="count">{BLOCKS.length}</span>
      </div>

      <div className="quick-bar">
        <div className="quick-label">快捷栏</div>
        <div className="quick-slots">
          {Array.from({ length: QUICK_SLOTS }).map((_, idx) => {
            const block = favorites[idx]
            const isSelected = selectedBlock?.id === block?.id
            return (
              <div
                key={idx}
                className={`quick-slot ${isSelected ? 'selected' : ''} ${block ? 'filled' : ''}`}
                onClick={() => block && handleQuickSlotClick(block, idx)}
                onContextMenu={(e) => handleQuickSlotRightClick(e, idx)}
                title={block ? `${block.nameZh} (${idx + 1})` : `快捷栏 ${idx + 1}`}
              >
                <span className="slot-number">{idx + 1}</span>
                {block && (
                  <>
                    <img
                      src={getMCTextureURL(block.id)}
                      alt={block.nameZh}
                      className="slot-texture"
                      onError={() => handleTextureError(block.id)}
                      style={{ opacity: failedTextures.has(block.id) ? 0 : 1 }}
                    />
                    {!failedTextures.has(block.id) && (
                      <div className="slot-fallback" style={{ backgroundColor: block.color }} />
                    )}
                    {failedTextures.has(block.id) && (
                      <div className="slot-solid" style={{ backgroundColor: block.color }} />
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {rightClickedSlot !== null && (
        <div className="slot-replace-menu" onClick={(e) => e.stopPropagation()}>
          <div className="menu-title">替换快捷栏 {rightClickedSlot + 1}</div>
          <div className="menu-search">
            <input
              type="text"
              placeholder="搜索方块..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
          <div className="menu-blocks">
            {(searchQuery.trim() ? searchBlocks(searchQuery) : BLOCKS.slice(0, 50)).map(block => (
              <div
                key={block.id}
                className="menu-block-item"
                onClick={() => handleAddToFavorites(block)}
              >
                <div className="menu-block-texture">
                  <img
                    src={getMCTextureURL(block.id)}
                    alt={block.nameZh}
                    onError={() => handleTextureError(block.id)}
                    style={{ opacity: failedTextures.has(block.id) ? 0 : 1 }}
                  />
                  <div className="menu-block-fallback" style={{ backgroundColor: block.color }} />
                </div>
                <span className="menu-block-name">{block.nameZh}</span>
              </div>
            ))}
          </div>
          <button className="menu-close" onClick={closeSlotMenu}>关闭</button>
        </div>
      )}

      <div className="search-bar">
        <input
          type="text"
          placeholder="搜索方块..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            if (e.target.value.trim()) {
              setActiveCategory('search')
            }
          }}
        />
      </div>

      <div className="category-tabs">
        {MAIN_CATEGORIES.map(cat => (
          <button
            key={cat.key}
            onClick={() => {
              setActiveCategory(cat.key)
              if (cat.key !== 'search') setSearchQuery('')
            }}
            className={`cat-tab ${activeCategory === cat.key ? 'active' : ''}`}
          >
            <span className="cat-emoji">{cat.emoji}</span>
            <span className="cat-label">{cat.label}</span>
          </button>
        ))}
      </div>

      <div className="block-grid">
        {filteredBlocks.slice(0, 200).map(block => (
          <div
            key={block.id}
            className={`grid-item ${selectedBlock?.id === block.id ? 'selected' : ''}`}
            onClick={() => setSelectedBlock(block)}
            title={block.nameZh}
          >
            <img
              src={getMCTextureURL(block.id)}
              alt={block.nameZh}
              className="grid-texture"
              onError={() => handleTextureError(block.id)}
              style={{ opacity: failedTextures.has(block.id) ? 0 : 1 }}
            />
            {!failedTextures.has(block.id) && (
              <div className="grid-fallback" style={{ backgroundColor: block.color }} />
            )}
            {failedTextures.has(block.id) && (
              <div className="grid-solid" style={{ backgroundColor: block.color }} />
            )}
          </div>
        ))}
        
        {filteredBlocks.length === 0 && (
          <div className="empty-state">
            <span>没有找到匹配的方块</span>
          </div>
        )}

        {filteredBlocks.length > 200 && (
          <div className="more-indicator">
            还有 {filteredBlocks.length - 200} 个方块，请使用搜索...
          </div>
        )}
      </div>

      {selectedBlock && (
        <div className="current-block">
          <div className="current-preview">
            <img
              src={getMCTextureURL(selectedBlock.id)}
              alt={selectedBlock.nameZh}
              onError={() => handleTextureError(selectedBlock.id)}
              style={{ opacity: failedTextures.has(selectedBlock.id) ? 0 : 1 }}
            />
            <div className="current-fallback" style={{ backgroundColor: selectedBlock.color }} />
            {failedTextures.has(selectedBlock.id) && (
              <div className="current-solid" style={{ backgroundColor: selectedBlock.color }} />
            )}
          </div>
          <div className="current-info">
            <div className="current-name">{selectedBlock.nameZh}</div>
            <div className="current-meta">
              <span className="mc-id">{selectedBlock.id}</span>
            </div>
          </div>
          <button
            className="add-favorite-btn"
            onClick={() => {
              const emptySlot = favorites.findIndex((f, i) => i >= favorites.length - 1)
              const targetSlot = emptySlot >= 0 ? emptySlot : 0
              const newFavorites = [...favorites]
              if (targetSlot < QUICK_SLOTS) {
                newFavorites[targetSlot] = selectedBlock
                setFavorites(newFavorites)
                saveFavorites(newFavorites)
              }
            }}
            title="添加到快捷栏"
          >
            ⭐
          </button>
        </div>
      )}

      <style>{`
        .block-browser-mc {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--bg-elevation-1);
          font-size: 13px;
          user-select: none;
        }

        .panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: var(--bg-elevation-2);
          border-bottom: 1px solid var(--border-subtle);
        }

        .panel-header .title {
          font-weight: 600;
          font-size: 14px;
          color: var(--text-primary);
        }

        .panel-header .count {
          font-size: 11px;
          padding: 2px 8px;
          background: var(--bg-elevation-4);
          border-radius: 10px;
          color: var(--text-secondary);
        }

        .quick-bar {
          padding: 12px 16px;
          background: var(--bg-elevation-2);
          border-bottom: 1px solid var(--border-subtle);
        }

        .quick-label {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--text-hint);
          margin-bottom: 8px;
          font-weight: 600;
        }

        .quick-slots {
          display: flex;
          gap: 4px;
        }

        .quick-slot {
          position: relative;
          width: 40px;
          height: 40px;
          background: var(--bg-elevation-3);
          border: 2px solid var(--border-medium);
          border-radius: 4px;
          cursor: pointer;
          overflow: hidden;
          transition: all 0.1s ease;
        }

        .quick-slot:hover {
          border-color: var(--accent-primary);
          transform: scale(1.05);
        }

        .quick-slot.selected {
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 2px rgba(144, 202, 249, 0.3);
        }

        .quick-slot.filled {
          border-color: var(--border-medium);
        }

        .slot-number {
          position: absolute;
          top: 2px;
          left: 3px;
          font-size: 9px;
          font-weight: bold;
          color: white;
          text-shadow: 0 1px 2px rgba(0,0,0,0.8);
          z-index: 2;
        }

        .slot-texture, .slot-fallback, .slot-solid {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }

        .slot-texture {
          z-index: 1;
          image-rendering: pixelated;
        }

        .search-bar {
          padding: 8px 16px;
          border-bottom: 1px solid var(--border-subtle);
        }

        .search-bar input {
          width: 100%;
          padding: 8px 12px;
          font-size: 13px;
          background: var(--bg-elevation-2);
          border: 1px solid var(--border-subtle);
          border-radius: 6px;
          color: var(--text-primary);
          outline: none;
        }

        .search-bar input:focus {
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 2px rgba(144, 202, 249, 0.15);
        }

        .search-bar input::placeholder {
          color: var(--text-hint);
        }

        .category-tabs {
          display: flex;
          gap: 4px;
          padding: 8px 16px;
          border-bottom: 1px solid var(--border-subtle);
          overflow-x: auto;
        }

        .cat-tab {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 10px;
          font-size: 12px;
          font-weight: 500;
          color: var(--text-secondary);
          background: transparent;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s ease;
        }

        .cat-tab:hover {
          background: var(--bg-elevation-3);
          color: var(--text-primary);
        }

        .cat-tab.active {
          background: var(--accent-primary);
          color: white;
        }

        .cat-emoji {
          font-size: 14px;
        }

        .cat-label {
          font-size: 12px;
        }

        .block-grid {
          flex: 1;
          overflow-y: auto;
          padding: 8px;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(36px, 1fr));
          gap: 4px;
          align-content: start;
        }

        .grid-item {
          position: relative;
          width: 100%;
          aspect-ratio: 1;
          background: var(--bg-elevation-2);
          border: 2px solid transparent;
          border-radius: 4px;
          cursor: pointer;
          overflow: hidden;
          transition: all 0.1s ease;
        }

        .grid-item:hover {
          border-color: var(--accent-primary);
          transform: scale(1.1);
          z-index: 1;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }

        .grid-item.selected {
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 2px rgba(144, 202, 249, 0.4);
        }

        .grid-texture, .grid-fallback, .grid-solid {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }

        .grid-texture {
          z-index: 1;
          image-rendering: pixelated;
        }

        .empty-state {
          grid-column: 1 / -1;
          text-align: center;
          padding: 20px;
          color: var(--text-hint);
          font-size: 13px;
        }

        .more-indicator {
          grid-column: 1 / -1;
          text-align: center;
          padding: 8px;
          color: var(--text-hint);
          font-size: 11px;
          background: var(--bg-elevation-2);
          border-radius: 4px;
        }

        .current-block {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: var(--bg-elevation-2);
          border-top: 1px solid var(--border-subtle);
        }

        .current-preview {
          position: relative;
          width: 44px;
          height: 44px;
          border-radius: 6px;
          overflow: hidden;
          flex-shrink: 0;
          background: var(--bg-elevation-3);
        }

        .current-preview img, .current-fallback, .current-solid {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }

        .current-preview img {
          z-index: 1;
          image-rendering: pixelated;
        }

        .current-info {
          flex: 1;
          min-width: 0;
        }

        .current-name {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .current-meta {
          margin-top: 2px;
        }

        .mc-id {
          font-size: 11px;
          font-family: monospace;
          color: var(--text-secondary);
          background: var(--bg-elevation-4);
          padding: 2px 6px;
          border-radius: 3px;
        }

        .add-favorite-btn {
          padding: 8px;
          font-size: 16px;
          background: var(--bg-elevation-3);
          border: 1px solid var(--border-medium);
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .add-favorite-btn:hover {
          background: var(--bg-elevation-4);
          transform: scale(1.1);
        }

        .slot-replace-menu {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 320px;
          max-height: 400px;
          background: var(--bg-elevation-2);
          border: 1px solid var(--border-medium);
          border-radius: 8px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
          z-index: 100;
          display: flex;
          flex-direction: column;
        }

        .menu-title {
          padding: 12px 16px;
          font-weight: 600;
          font-size: 14px;
          border-bottom: 1px solid var(--border-subtle);
          color: var(--text-primary);
        }

        .menu-search {
          padding: 8px 12px;
          border-bottom: 1px solid var(--border-subtle);
        }

        .menu-search input {
          width: 100%;
          padding: 8px 10px;
          font-size: 13px;
          background: var(--bg-elevation-3);
          border: 1px solid var(--border-subtle);
          border-radius: 4px;
          color: var(--text-primary);
          outline: none;
        }

        .menu-search input:focus {
          border-color: var(--accent-primary);
        }

        .menu-blocks {
          flex: 1;
          overflow-y: auto;
          padding: 8px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 4px;
          max-height: 280px;
        }

        .menu-block-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          padding: 4px;
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.1s ease;
        }

        .menu-block-item:hover {
          background: var(--bg-elevation-3);
        }

        .menu-block-texture {
          position: relative;
          width: 40px;
          height: 40px;
          border-radius: 4px;
          overflow: hidden;
          background: var(--bg-elevation-4);
        }

        .menu-block-texture img, .menu-block-fallback {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }

        .menu-block-texture img {
          z-index: 1;
          image-rendering: pixelated;
        }

        .menu-block-name {
          font-size: 9px;
          color: var(--text-secondary);
          text-align: center;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .menu-close {
          margin: 8px 12px;
          padding: 8px;
          font-size: 12px;
          background: var(--bg-elevation-4);
          border: 1px solid var(--border-medium);
          border-radius: 4px;
          cursor: pointer;
          color: var(--text-secondary);
        }

        .menu-close:hover {
          background: var(--bg-elevate-hover);
          color: var(--text-primary);
        }
      `}</style>
    </div>
  )
}
