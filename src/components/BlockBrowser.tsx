import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useSceneStore } from '@/stores/sceneStore'
import { BLOCKS, getBlocksByCategory, searchBlocks } from '@/utils/blocks'
import { getMCTextureURL } from '@/services/textureService'
import type { BlockCategory, BlockData } from '@/types'

const QUICK_SLOTS = 9
const FAVORITES_KEY = 'sf_quickbar'

const CATEGORIES = [
  { key: 'all', label: '全部' },
  { key: 'building', label: '建筑方块' },
  { key: 'natural', label: '自然方块' },
  { key: 'redstone', label: '红石元件' },
  { key: 'decoration', label: '装饰方块' },
  { key: 'utility', label: '功能方块' },
] as const

function loadFavorites(): BlockData[] {
  try {
    const saved = localStorage.getItem(FAVORITES_KEY)
    if (saved) {
      const ids = JSON.parse(saved) as string[]
      const blocks = ids.map(id => BLOCKS.find(b => b.id === id)).filter((b): b is BlockData => !!b)
      if (blocks.length === QUICK_SLOTS) return blocks
    }
  } catch {}
  return BLOCKS.slice(0, QUICK_SLOTS)
}

export function BlockBrowser() {
  const { selectedBlock, setSelectedBlock } = useSceneStore()
  const [activeCategory, setActiveCategory] = useState<BlockCategory | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [favorites, setFavorites] = useState<BlockData[]>(loadFavorites)
  const [failedTextures, setFailedTextures] = useState<Set<string>>(new Set())
  const [showPicker, setShowPicker] = useState<number | null>(null)
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      const num = parseInt(e.key)
      if (num >= 1 && num <= 9 && favorites[num - 1]) {
        setSelectedBlock(favorites[num - 1])
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [favorites, setSelectedBlock])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredBlocks = useMemo(() => {
    if (searchQuery.trim()) return searchBlocks(searchQuery)
    if (activeCategory === 'all') return BLOCKS
    return getBlocksByCategory(activeCategory)
  }, [activeCategory, searchQuery])

  const handleTextureError = useCallback((id: string) => {
    setFailedTextures(prev => new Set(prev).add(id))
  }, [])

  const handleSlotClick = (block: BlockData) => setSelectedBlock(block)

  const handleSlotRightClick = (e: React.MouseEvent, idx: number) => {
    e.preventDefault()
    setShowPicker(showPicker === idx ? null : idx)
  }

  const handlePickBlock = (block: BlockData) => {
    if (showPicker !== null) {
      const newFavs = [...favorites]
      newFavs[showPicker] = block
      setFavorites(newFavs)
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavs.map(b => b.id)))
      setShowPicker(null)
    }
  }

  const handleAddToQuickbar = () => {
    if (!selectedBlock) return
    const existing = favorites.findIndex(f => f.id === selectedBlock.id)
    if (existing >= 0) return
    const newFavs = [...favorites.slice(1), selectedBlock]
    setFavorites(newFavs)
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavs.map(b => b.id)))
  }

  return (
    <div className="mc-browser">
      <div className="mc-titlebar">
        <div className="mc-title">选择方块</div>
        <div className="mc-title-count">{BLOCKS.length} 个方块</div>
      </div>

      <div className="mc-hotbar-container">
        <div className="mc-hotbar-label">快捷栏</div>
        <div className="mc-hotbar">
          {favorites.map((block, idx) => {
            const isActive = selectedBlock?.id === block.id
            const textureFailed = failedTextures.has(block.id)
            return (
              <div
                key={block.id}
                className={`mc-slot ${isActive ? 'active' : ''}`}
                onClick={() => handleSlotClick(block)}
                onContextMenu={(e) => handleSlotRightClick(e, idx)}
                title={`${block.nameZh} [${idx + 1}]`}
              >
                <span className="mc-slot-key">{idx + 1}</span>
                <div className="mc-slot-inner">
                  {!textureFailed && (
                    <img
                      src={getMCTextureURL(block.id)}
                      alt=""
                      className="mc-slot-img"
                      onError={() => handleTextureError(block.id)}
                      draggable={false}
                    />
                  )}
                  <div className="mc-slot-bg" style={{ backgroundColor: block.color }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {showPicker !== null && (
        <div className="mc-picker-overlay" onClick={() => setShowPicker(null)}>
          <div className="mc-picker" ref={pickerRef} onClick={e => e.stopPropagation()}>
            <div className="mc-picker-title">
              <span>替换槽位 {showPicker + 1}</span>
              <button className="mc-picker-x" onClick={() => setShowPicker(null)}>×</button>
            </div>
            <div className="mc-picker-search">
              <input
                type="text"
                placeholder="输入搜索..."
                value={searchQuery}
                onChange={e => {}}
                autoFocus
              />
            </div>
            <div className="mc-picker-items">
              {(searchQuery ? searchBlocks(searchQuery) : BLOCKS.slice(0, 80)).map(block => (
                <div
                  key={block.id}
                  className="mc-picker-item"
                  onClick={() => handlePickBlock(block)}
                >
                  <div className="mc-picker-icon">
                    <img src={getMCTextureURL(block.id)} alt="" onError={() => handleTextureError(block.id)} />
                    <div style={{ backgroundColor: block.color }} />
                  </div>
                  <span>{block.nameZh}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mc-search">
        <span className="mc-search-icon">🔍</span>
        <input
          type="text"
          placeholder="搜索方块..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="mc-tabs">
        {CATEGORIES.map(cat => (
          <button
            key={cat.key}
            className={`mc-tab ${activeCategory === cat.key && !searchQuery ? 'active' : ''}`}
            onClick={() => { setActiveCategory(cat.key); setSearchQuery('') }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="mc-grid">
        {filteredBlocks.slice(0, 120).map(block => (
          <div
            key={block.id}
            className={`mc-item ${selectedBlock?.id === block.id ? 'selected' : ''}`}
            onClick={() => setSelectedBlock(block)}
            title={block.nameZh}
          >
            <div className="mc-item-inner">
              {!failedTextures.has(block.id) && (
                <img src={getMCTextureURL(block.id)} alt="" onError={() => handleTextureError(block.id)} />
              )}
              <div style={{ backgroundColor: failedTextures.has(block.id) ? block.color : 'transparent' }} />
            </div>
          </div>
        ))}
        {filteredBlocks.length === 0 && (
          <div className="mc-empty">未找到方块</div>
        )}
      </div>

      {selectedBlock && (
        <div className="mc-footer">
          <div className="mc-footer-icon">
            {!failedTextures.has(selectedBlock.id) && (
              <img src={getMCTextureURL(selectedBlock.id)} alt="" onError={() => handleTextureError(selectedBlock.id)} />
            )}
            <div style={{ backgroundColor: failedTextures.has(selectedBlock.id) ? selectedBlock.color : 'transparent' }} />
          </div>
          <div className="mc-footer-info">
            <div className="mc-footer-name">{selectedBlock.nameZh}</div>
            <div className="mc-footer-id">{selectedBlock.id.replace('minecraft:', '')}</div>
          </div>
          <button className="mc-star" onClick={handleAddToQuickbar} title="加入快捷栏">★</button>
        </div>
      )}

      <style>{`
        .mc-browser {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #c6c6c6;
          font-family: 'Minecraft', 'Noto Sans', sans-serif;
          user-select: none;
        }

        .mc-titlebar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          background: linear-gradient(to bottom, #3b3b3b 0%, #1e1e1e 100%);
          border-bottom: 2px solid #232323;
        }

        .mc-title {
          font-size: 14px;
          font-weight: bold;
          color: #fff;
          text-shadow: 1px 1px 0 #3f3f3f;
        }

        .mc-title-count {
          font-size: 11px;
          color: #888;
        }

        .mc-hotbar-container {
          padding: 10px 12px;
          background: #1e1e1e;
          border-bottom: 2px solid #373737;
        }

        .mc-hotbar-label {
          font-size: 10px;
          color: #666;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .mc-hotbar {
          display: flex;
          gap: 2px;
          justify-content: center;
        }

        .mc-slot {
          position: relative;
          width: 40px;
          height: 40px;
          background: #2d2d2d;
          border: 3px solid;
          border-color: #373737 #1a1a1a #1a1a1a #373737;
          cursor: pointer;
          transition: filter 0.1s;
        }

        .mc-slot:hover {
          filter: brightness(1.2);
        }

        .mc-slot.active {
          border-color: #5c9bd4 #3a5f89 #3a5f89 #5c9bd4;
        }

        .mc-slot-key {
          position: absolute;
          top: 1px;
          left: 3px;
          font-size: 10px;
          font-weight: bold;
          color: #fff;
          text-shadow: 1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000;
          z-index: 3;
          pointer-events: none;
        }

        .mc-slot-inner {
          position: absolute;
          inset: 0;
        }

        .mc-slot-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          image-rendering: pixelated;
          z-index: 1;
        }

        .mc-slot-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
        }

        .mc-search {
          display: flex;
          align-items: center;
          gap: 6px;
          margin: 10px 12px;
          padding: 6px 10px;
          background: #1e1e1e;
          border: 2px solid;
          border-color: #373737 #1a1a1a #1a1a1a #373737;
        }

        .mc-search-icon {
          font-size: 12px;
          opacity: 0.6;
        }

        .mc-search input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: #fff;
          font-size: 13px;
          font-family: inherit;
        }

        .mc-search input::placeholder {
          color: #666;
        }

        .mc-tabs {
          display: flex;
          gap: 2px;
          padding: 0 12px 8px;
          overflow-x: auto;
        }

        .mc-tab {
          padding: 6px 10px;
          font-size: 11px;
          color: #fff;
          background: #3b3b3b;
          border: 2px solid;
          border-color: #555 #2a2a2a #2a2a2a #555;
          cursor: pointer;
          white-space: nowrap;
          font-family: inherit;
        }

        .mc-tab:hover {
          background: #4a4a4a;
        }

        .mc-tab.active {
          background: #4a698f;
          border-color: #6a8ab4 #38537a #38537a #6a8ab4;
          color: #fff;
        }

        .mc-grid {
          flex: 1;
          overflow-y: auto;
          padding: 8px;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(36px, 1fr));
          gap: 2px;
          align-content: start;
          background: #8b8b8b;
          border-top: 2px solid #6b6b6b;
          border-bottom: 2px solid #a0a0a0;
        }

        .mc-grid::-webkit-scrollbar {
          width: 8px;
        }

        .mc-grid::-webkit-scrollbar-track {
          background: #5a5a5a;
          border-left: 2px solid #6b6b6b;
        }

        .mc-grid::-webkit-scrollbar-thumb {
          background: #2d2d2d;
          border: 2px solid;
          border-color: #3d3d3d #1a1a1a #1a1a1a #3d3d3d;
        }

        .mc-item {
          position: relative;
          aspect-ratio: 1;
          background: #2d2d2d;
          border: 3px solid;
          border-color: #373737 #1a1a1a #1a1a1a #373737;
          cursor: pointer;
        }

        .mc-item:hover {
          filter: brightness(1.15);
        }

        .mc-item.selected {
          border-color: #5c9bd4 #3a5f89 #3a5f89 #5c9bd4;
        }

        .mc-item-inner {
          position: absolute;
          inset: 0;
        }

        .mc-item-inner img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          image-rendering: pixelated;
          z-index: 1;
        }

        .mc-item-inner div {
          position: absolute;
          inset: 0;
        }

        .mc-empty {
          grid-column: 1 / -1;
          text-align: center;
          padding: 16px;
          color: #555;
          font-size: 12px;
        }

        .mc-footer {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          background: linear-gradient(to bottom, #3b3b3b 0%, #1e1e1e 100%);
          border-top: 2px solid #4a4a4a;
        }

        .mc-footer-icon {
          position: relative;
          width: 40px;
          height: 40px;
          background: #2d2d2d;
          border: 3px solid;
          border-color: #373737 #1a1a1a #1a1a1a #373737;
          flex-shrink: 0;
        }

        .mc-footer-icon img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          image-rendering: pixelated;
          z-index: 1;
        }

        .mc-footer-icon div {
          position: absolute;
          inset: 0;
        }

        .mc-footer-info {
          flex: 1;
        }

        .mc-footer-name {
          font-size: 13px;
          font-weight: bold;
          color: #fff;
          text-shadow: 1px 1px 0 #3f3f3f;
        }

        .mc-footer-id {
          font-size: 10px;
          color: #888;
          margin-top: 2px;
          font-family: monospace;
        }

        .mc-star {
          width: 32px;
          height: 32px;
          font-size: 16px;
          background: #3b3b3b;
          border: 2px solid;
          border-color: #555 #2a2a2a #2a2a2a #555;
          color: #ffd700;
          cursor: pointer;
        }

        .mc-star:hover {
          background: #4a4a4a;
        }

        .mc-picker-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
        }

        .mc-picker {
          width: 300px;
          max-height: 380px;
          background: #c6c6c6;
          border: 4px solid;
          border-color: #555 #1a1a1a #1a1a1a #555;
          display: flex;
          flex-direction: column;
        }

        .mc-picker-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 10px;
          background: linear-gradient(to bottom, #3b3b3b 0%, #1e1e1e 100%);
          border-bottom: 2px solid #232323;
          font-size: 13px;
          font-weight: bold;
          color: #fff;
        }

        .mc-picker-x {
          width: 20px;
          height: 20px;
          background: #3b3b3b;
          border: 2px solid;
          border-color: #555 #2a2a2a #2a2a2a #555;
          color: #fff;
          cursor: pointer;
          font-size: 14px;
          line-height: 1;
        }

        .mc-picker-x:hover {
          background: #4a4a4a;
        }

        .mc-picker-search {
          padding: 8px;
          background: #8b8b8b;
          border-bottom: 2px solid #6b6b6b;
        }

        .mc-picker-search input {
          width: 100%;
          padding: 6px 8px;
          background: #fff;
          border: 2px solid;
          border-color: #373737 #1a1a1a #1a1a1a #373737;
          color: #000;
          font-size: 12px;
          outline: none;
          font-family: inherit;
        }

        .mc-picker-items {
          flex: 1;
          overflow-y: auto;
          padding: 6px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 4px;
          background: #8b8b8b;
        }

        .mc-picker-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          padding: 4px;
          background: #2d2d2d;
          border: 2px solid;
          border-color: #373737 #1a1a1a #1a1a1a #373737;
          cursor: pointer;
        }

        .mc-picker-item:hover {
          filter: brightness(1.2);
        }

        .mc-picker-icon {
          position: relative;
          width: 36px;
          height: 36px;
          background: #3a3a3a;
        }

        .mc-picker-icon img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          image-rendering: pixelated;
          z-index: 1;
        }

        .mc-picker-icon div {
          position: absolute;
          inset: 0;
        }

        .mc-picker-item span {
          font-size: 8px;
          color: #aaa;
          text-align: center;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      `}</style>
    </div>
  )
}
