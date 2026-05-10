import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useSceneStore } from '@/stores/sceneStore'
import { BLOCKS, getBlocksByCategory, searchBlocks } from '@/utils/blocks'
import { getMCTextureURL } from '@/services/textureService'
import type { BlockCategory, BlockData } from '@/types'

const QUICK_SLOTS = 9
const FAVORITES_KEY = 'sf_quickbar'

const CATEGORIES = [
  { key: 'all', label: '全部', icon: '📦' },
  { key: 'building', label: '建筑', icon: '🧱' },
  { key: 'natural', label: '自然', icon: '🌿' },
  { key: 'redstone', label: '红石', icon: '⚡' },
  { key: 'decoration', label: '装饰', icon: '🎨' },
  { key: 'utility', label: '功能', icon: '🔧' },
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
    <div className="sf-block-browser">
      <div className="sf-header">
        <span className="sf-title">方块选择</span>
        <span className="sf-count">{BLOCKS.length}</span>
      </div>

      <div className="sf-quickbar-section">
        <div className="sf-quickbar-label">快捷栏 · 1-9</div>
        <div className="sf-quickbar">
          {favorites.map((block, idx) => {
            const isActive = selectedBlock?.id === block.id
            const textureFailed = failedTextures.has(block.id)
            return (
              <div
                key={block.id}
                className={`sf-slot ${isActive ? 'active' : ''}`}
                onClick={() => handleSlotClick(block)}
                onContextMenu={(e) => handleSlotRightClick(e, idx)}
                title={`${block.nameZh} [${idx + 1}]`}
              >
                <span className="sf-slot-num">{idx + 1}</span>
                <div className="sf-slot-icon">
                  {!textureFailed && (
                    <img
                      src={getMCTextureURL(block.id)}
                      alt=""
                      onError={() => handleTextureError(block.id)}
                      draggable={false}
                    />
                  )}
                  <div className="sf-slot-color" style={{ backgroundColor: block.color }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {showPicker !== null && (
        <div className="sf-picker-overlay" onClick={() => setShowPicker(null)}>
          <div className="sf-picker" ref={pickerRef} onClick={e => e.stopPropagation()}>
            <div className="sf-picker-header">
              <span>选择方块 - 槽位 {showPicker + 1}</span>
              <button className="sf-picker-close" onClick={() => setShowPicker(null)}>✕</button>
            </div>
            <div className="sf-picker-search">
              <input
                type="text"
                placeholder="搜索..."
                value={searchQuery}
                onChange={e => e.stopPropagation()}
                autoFocus
              />
            </div>
            <div className="sf-picker-grid">
              {(searchQuery ? searchBlocks(searchQuery) : BLOCKS.slice(0, 100)).map(block => (
                <div
                  key={block.id}
                  className="sf-picker-item"
                  onClick={() => handlePickBlock(block)}
                >
                  <div className="sf-picker-icon">
                    <img src={getMCTextureURL(block.id)} alt="" onError={() => handleTextureError(block.id)} />
                    <div style={{ backgroundColor: block.color }} />
                  </div>
                  <span className="sf-picker-name">{block.nameZh}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="sf-search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
        </svg>
        <input
          type="text"
          placeholder="搜索方块..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="sf-categories">
        {CATEGORIES.map(cat => (
          <button
            key={cat.key}
            className={`sf-cat ${activeCategory === cat.key && !searchQuery ? 'active' : ''}`}
            onClick={() => { setActiveCategory(cat.key); setSearchQuery('') }}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      <div className="sf-grid">
        {filteredBlocks.slice(0, 150).map(block => (
          <div
            key={block.id}
            className={`sf-block ${selectedBlock?.id === block.id ? 'selected' : ''}`}
            onClick={() => setSelectedBlock(block)}
            title={block.nameZh}
          >
            <div className="sf-block-icon">
              {!failedTextures.has(block.id) && (
                <img src={getMCTextureURL(block.id)} alt="" onError={() => handleTextureError(block.id)} />
              )}
              <div style={{ backgroundColor: failedTextures.has(block.id) ? block.color : 'transparent' }} />
            </div>
          </div>
        ))}
        {filteredBlocks.length === 0 && (
          <div className="sf-empty">未找到方块</div>
        )}
      </div>

      {selectedBlock && (
        <div className="sf-current">
          <div className="sf-current-icon">
            {!failedTextures.has(selectedBlock.id) && (
              <img src={getMCTextureURL(selectedBlock.id)} alt="" onError={() => handleTextureError(selectedBlock.id)} />
            )}
            <div style={{ backgroundColor: failedTextures.has(selectedBlock.id) ? selectedBlock.color : 'transparent' }} />
          </div>
          <div className="sf-current-info">
            <div className="sf-current-name">{selectedBlock.nameZh}</div>
            <div className="sf-current-id">{selectedBlock.id.replace('minecraft:', '')}</div>
          </div>
          <button className="sf-add-btn" onClick={handleAddToQuickbar} title="添加到快捷栏">
            ★
          </button>
        </div>
      )}

      <style>{`
        .sf-block-browser {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #1a1a1a;
          color: #fff;
          font-family: 'Minecraft', 'Segoe UI', sans-serif;
          user-select: none;
        }

        .sf-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: #2d2d2d;
          border-bottom: 1px solid #3d3d3d;
        }

        .sf-title {
          font-size: 14px;
          font-weight: 600;
          color: #fff;
          letter-spacing: 0.5px;
        }

        .sf-count {
          font-size: 11px;
          padding: 2px 8px;
          background: #4a4a4a;
          border-radius: 10px;
          color: #aaa;
        }

        .sf-quickbar-section {
          padding: 12px 16px;
          background: #252525;
          border-bottom: 1px solid #3d3d3d;
        }

        .sf-quickbar-label {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #888;
          margin-bottom: 8px;
          font-weight: 600;
        }

        .sf-quickbar {
          display: flex;
          gap: 4px;
        }

        .sf-slot {
          position: relative;
          width: 42px;
          height: 42px;
          background: #3a3a3a;
          border: 2px solid #555;
          border-radius: 4px;
          cursor: pointer;
          overflow: hidden;
          transition: transform 0.1s, border-color 0.1s;
        }

        .sf-slot:hover {
          border-color: #aaa;
          transform: scale(1.08);
        }

        .sf-slot.active {
          border-color: #5ca8d4;
          box-shadow: 0 0 8px rgba(92, 168, 212, 0.5);
        }

        .sf-slot-num {
          position: absolute;
          top: 2px;
          left: 3px;
          font-size: 10px;
          font-weight: bold;
          color: #fff;
          text-shadow: 0 1px 2px rgba(0,0,0,0.9);
          z-index: 2;
        }

        .sf-slot-icon {
          position: absolute;
          inset: 0;
        }

        .sf-slot-icon img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          image-rendering: pixelated;
          z-index: 1;
        }

        .sf-slot-color {
          position: absolute;
          inset: 0;
          z-index: 0;
        }

        .sf-search {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 12px 16px;
          padding: 8px 12px;
          background: #2a2a2a;
          border: 1px solid #444;
          border-radius: 6px;
        }

        .sf-search svg {
          width: 16px;
          height: 16px;
          color: #888;
          flex-shrink: 0;
        }

        .sf-search input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: #fff;
          font-size: 13px;
        }

        .sf-search input::placeholder {
          color: #666;
        }

        .sf-categories {
          display: flex;
          gap: 4px;
          padding: 0 16px 12px;
          overflow-x: auto;
        }

        .sf-cat {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 10px;
          font-size: 12px;
          color: #aaa;
          background: #2a2a2a;
          border: 1px solid #3d3d3d;
          border-radius: 4px;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s;
        }

        .sf-cat:hover {
          background: #3a3a3a;
          color: #fff;
        }

        .sf-cat.active {
          background: #4a7a9a;
          border-color: #5ca8d4;
          color: #fff;
        }

        .sf-grid {
          flex: 1;
          overflow-y: auto;
          padding: 8px;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(38px, 1fr));
          gap: 4px;
          align-content: start;
        }

        .sf-grid::-webkit-scrollbar {
          width: 6px;
        }

        .sf-grid::-webkit-scrollbar-track {
          background: #2a2a2a;
        }

        .sf-grid::-webkit-scrollbar-thumb {
          background: #555;
          border-radius: 3px;
        }

        .sf-block {
          position: relative;
          aspect-ratio: 1;
          background: #2a2a2a;
          border: 2px solid transparent;
          border-radius: 4px;
          cursor: pointer;
          overflow: hidden;
          transition: all 0.1s;
        }

        .sf-block:hover {
          border-color: #888;
          transform: scale(1.1);
          z-index: 1;
        }

        .sf-block.selected {
          border-color: #5ca8d4;
          box-shadow: 0 0 6px rgba(92, 168, 212, 0.4);
        }

        .sf-block-icon {
          position: absolute;
          inset: 0;
        }

        .sf-block-icon img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          image-rendering: pixelated;
          z-index: 1;
        }

        .sf-block-icon div {
          position: absolute;
          inset: 0;
        }

        .sf-empty {
          grid-column: 1 / -1;
          text-align: center;
          padding: 20px;
          color: #666;
          font-size: 13px;
        }

        .sf-current {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: #252525;
          border-top: 1px solid #3d3d3d;
        }

        .sf-current-icon {
          position: relative;
          width: 44px;
          height: 44px;
          border-radius: 6px;
          overflow: hidden;
          background: #3a3a3a;
          flex-shrink: 0;
        }

        .sf-current-icon img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          image-rendering: pixelated;
          z-index: 1;
        }

        .sf-current-icon div {
          position: absolute;
          inset: 0;
        }

        .sf-current-info {
          flex: 1;
          min-width: 0;
        }

        .sf-current-name {
          font-size: 14px;
          font-weight: 600;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sf-current-id {
          font-size: 11px;
          font-family: monospace;
          color: #888;
          margin-top: 2px;
        }

        .sf-add-btn {
          width: 36px;
          height: 36px;
          font-size: 18px;
          background: #3a3a3a;
          border: 1px solid #555;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s;
          flex-shrink: 0;
        }

        .sf-add-btn:hover {
          background: #4a4a4a;
          transform: scale(1.1);
        }

        .sf-picker-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
        }

        .sf-picker {
          width: 340px;
          max-height: 420px;
          background: #2a2a2a;
          border: 1px solid #555;
          border-radius: 8px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .sf-picker-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: #333;
          border-bottom: 1px solid #444;
          font-size: 14px;
          font-weight: 600;
        }

        .sf-picker-close {
          width: 24px;
          height: 24px;
          background: transparent;
          border: none;
          color: #888;
          cursor: pointer;
          font-size: 16px;
        }

        .sf-picker-close:hover {
          color: #fff;
        }

        .sf-picker-search {
          padding: 8px 12px;
          border-bottom: 1px solid #444;
        }

        .sf-picker-search input {
          width: 100%;
          padding: 8px 10px;
          background: #3a3a3a;
          border: 1px solid #555;
          border-radius: 4px;
          color: #fff;
          font-size: 13px;
          outline: none;
        }

        .sf-picker-search input:focus {
          border-color: #5ca8d4;
        }

        .sf-picker-grid {
          flex: 1;
          overflow-y: auto;
          padding: 8px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 4px;
        }

        .sf-picker-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 6px;
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.1s;
        }

        .sf-picker-item:hover {
          background: #444;
        }

        .sf-picker-icon {
          position: relative;
          width: 40px;
          height: 40px;
          border-radius: 4px;
          overflow: hidden;
          background: #3a3a3a;
        }

        .sf-picker-icon img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          image-rendering: pixelated;
          z-index: 1;
        }

        .sf-picker-icon div {
          position: absolute;
          inset: 0;
        }

        .sf-picker-name {
          font-size: 9px;
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
