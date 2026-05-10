import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useSceneStore } from '@/stores/sceneStore'
import { BLOCKS, getBlocksByCategory, searchBlocks } from '@/utils/blocks'
import { getMCTextureURL } from '@/services/textureService'
import type { BlockCategory, BlockData } from '@/types'

const QUICK_SLOTS = 9
const FAVORITES_KEY = 'sf_quickbar'
const RECENT_KEY = 'sf_recent'
const MAX_RECENT = 18

const CATEGORIES = [
  { key: 'all', label: '全部' },
  { key: 'building', label: '建筑' },
  { key: 'natural', label: '自然' },
  { key: 'redstone', label: '红石' },
  { key: 'decoration', label: '装饰' },
  { key: 'utility', label: '功能' },
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

function loadRecent(): BlockData[] {
  try {
    const saved = localStorage.getItem(RECENT_KEY)
    if (saved) {
      const ids = JSON.parse(saved) as string[]
      return ids.map(id => BLOCKS.find(b => b.id === id)).filter((b): b is BlockData => !!b)
    }
  } catch {}
  return []
}

function saveRecent(recent: BlockData[]) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent.map(b => b.id)))
  } catch {}
}

export function BlockBrowser() {
  const { selectedBlock, setSelectedBlock } = useSceneStore()
  const [activeCategory, setActiveCategory] = useState<BlockCategory | 'all' | 'recent'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [favorites, setFavorites] = useState<BlockData[]>(loadFavorites)
  const [recent, setRecent] = useState<BlockData[]>(loadRecent)
  const [failedTextures, setFailedTextures] = useState<Set<string>>(new Set())
  const [showPicker, setShowPicker] = useState<number | null>(null)
  const [pickerSearch, setPickerSearch] = useState('')
  const pickerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) {
        if (e.key === 'Escape') {
          (e.target as HTMLInputElement).blur()
        }
        return
      }
      if (e.key === '/') {
        e.preventDefault()
        searchInputRef.current?.focus()
        return
      }
      const num = parseInt(e.key)
      if (num >= 1 && num <= 9 && favorites[num - 1]) {
        setSelectedBlock(favorites[num - 1])
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [favorites, setSelectedBlock])

  useEffect(() => {
    if (selectedBlock) {
      setRecent(prev => {
        const filtered = prev.filter(b => b.id !== selectedBlock.id)
        const newRecent = [selectedBlock, ...filtered].slice(0, MAX_RECENT)
        saveRecent(newRecent)
        return newRecent
      })
    }
  }, [selectedBlock])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(null)
        setPickerSearch('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredBlocks = useMemo(() => {
    if (searchQuery.trim()) return searchBlocks(searchQuery)
    if (activeCategory === 'recent') return recent
    if (activeCategory === 'all') return BLOCKS
    return getBlocksByCategory(activeCategory)
  }, [activeCategory, searchQuery, recent])

  const handleTextureError = useCallback((id: string) => {
    setFailedTextures(prev => new Set(prev).add(id))
  }, [])

  const handleSlotClick = (block: BlockData) => setSelectedBlock(block)

  const handleSlotRightClick = (e: React.MouseEvent, idx: number) => {
    e.preventDefault()
    setShowPicker(showPicker === idx ? null : idx)
    setPickerSearch('')
  }

  const handlePickBlock = (block: BlockData) => {
    if (showPicker !== null) {
      const newFavs = [...favorites]
      newFavs[showPicker] = block
      setFavorites(newFavs)
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavs.map(b => b.id)))
      setShowPicker(null)
      setPickerSearch('')
    }
  }

  const handleAddToQuickbar = () => {
    if (!selectedBlock) return
    const existing = favorites.findIndex(f => f.id === selectedBlock.id)
    if (existing >= 0) {
      setShowPicker(existing)
      return
    }
    const newFavs = [...favorites.slice(1), selectedBlock]
    setFavorites(newFavs)
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavs.map(b => b.id)))
  }

  const pickerBlocks = useMemo(() => {
    if (pickerSearch.trim()) return searchBlocks(pickerSearch)
    return BLOCKS.slice(0, 100)
  }, [pickerSearch])

  return (
    <div className="mc-browser">
      <div className="mc-titlebar">
        <div className="mc-title">选择方块</div>
        <div className="mc-title-count">{BLOCKS.length}</div>
      </div>

      <div className="mc-hotbar-container">
        <div className="mc-hotbar-label">快捷栏</div>
        <div className="mc-hotbar">
          {favorites.map((block, idx) => {
            const isActive = selectedBlock?.id === block.id
            return (
              <div
                key={block.id}
                className={`mc-slot ${isActive ? 'active' : ''}`}
                onClick={() => handleSlotClick(block)}
                onContextMenu={(e) => handleSlotRightClick(e, idx)}
                title={block.nameZh}
              >
                <span className="mc-slot-key">{idx + 1}</span>
                <div className="mc-slot-inner">
                  {!failedTextures.has(block.id) ? (
                    <img
                      src={getMCTextureURL(block.id)}
                      alt=""
                      className="mc-slot-img"
                      onError={() => handleTextureError(block.id)}
                      draggable={false}
                    />
                  ) : (
                    <div className="mc-slot-bg" style={{ backgroundColor: block.color }} />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {showPicker !== null && (
        <div className="mc-picker-overlay" onClick={() => { setShowPicker(null); setPickerSearch('') }}>
          <div className="mc-picker" ref={pickerRef} onClick={e => e.stopPropagation()}>
            <div className="mc-picker-title">
              <span>替换 {showPicker + 1}</span>
              <button className="mc-picker-x" onClick={() => { setShowPicker(null); setPickerSearch('') }}>×</button>
            </div>
            <div className="mc-picker-search">
              <input
                type="text"
                placeholder="搜索..."
                value={pickerSearch}
                onChange={e => setPickerSearch(e.target.value)}
                autoFocus
              />
            </div>
            <div className="mc-picker-items">
              {pickerBlocks.map(block => (
                <div
                  key={block.id}
                  className="mc-picker-item"
                  onClick={() => handlePickBlock(block)}
                >
                  <div className="mc-picker-icon">
                    {!failedTextures.has(block.id) ? (
                      <img src={getMCTextureURL(block.id)} alt="" onError={() => handleTextureError(block.id)} />
                    ) : (
                      <div style={{ backgroundColor: block.color }} />
                    )}
                  </div>
                  <span>{block.nameZh}</span>
                </div>
              ))}
              {pickerBlocks.length === 0 && (
                <div className="mc-picker-empty">无结果</div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mc-search">
        <span className="mc-search-icon">🔍</span>
        <input
          ref={searchInputRef}
          type="text"
          placeholder="搜索方块... (按 / 聚焦)"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button className="mc-search-clear" onClick={() => setSearchQuery('')}>×</button>
        )}
      </div>

      <div className="mc-tabs">
        {activeCategory === 'recent' ? (
          <button className="mc-tab active">最近</button>
        ) : (
          <button className="mc-tab" onClick={() => setActiveCategory('recent')}>最近 ({recent.length})</button>
        )}
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

      <div className="mc-grid-header">
        {searchQuery ? (
          <span>搜索: "{searchQuery}" ({filteredBlocks.length} 结果)</span>
        ) : activeCategory === 'recent' ? (
          <span>最近使用</span>
        ) : activeCategory === 'all' ? (
          <span>全部方块</span>
        ) : (
          <span>{CATEGORIES.find(c => c.key === activeCategory)?.label}</span>
        )}
      </div>

      <div className="mc-grid">
        {filteredBlocks.slice(0, 150).map(block => (
          <div
            key={block.id}
            className={`mc-item ${selectedBlock?.id === block.id ? 'selected' : ''}`}
            onClick={() => setSelectedBlock(block)}
            title={`${block.nameZh}\n${block.id.replace('minecraft:', '')}\n硬度: ${block.hardness}`}
          >
            <div className="mc-item-inner">
              {!failedTextures.has(block.id) ? (
                <img src={getMCTextureURL(block.id)} alt="" onError={() => handleTextureError(block.id)} />
              ) : (
                <div style={{ backgroundColor: block.color }} />
              )}
            </div>
          </div>
        ))}
        {filteredBlocks.length === 0 && (
          <div className="mc-empty">未找到方块</div>
        )}
        {filteredBlocks.length > 150 && (
          <div className="mc-more">+{filteredBlocks.length - 150} 更多</div>
        )}
      </div>

      {selectedBlock && (
        <div className="mc-footer">
          <div className="mc-footer-icon">
            {!failedTextures.has(selectedBlock.id) ? (
              <img src={getMCTextureURL(selectedBlock.id)} alt="" onError={() => handleTextureError(selectedBlock.id)} />
            ) : (
              <div style={{ backgroundColor: selectedBlock.color }} />
            )}
          </div>
          <div className="mc-footer-info">
            <div className="mc-footer-name">{selectedBlock.nameZh}</div>
            <div className="mc-footer-meta">
              <span className="mc-footer-id">{selectedBlock.id.replace('minecraft:', '')}</span>
              <span className="mc-footer-hardness">硬度: {selectedBlock.hardness}</span>
            </div>
          </div>
          <button className="mc-star" onClick={handleAddToQuickbar} title="加入快捷栏">
            {favorites.some(f => f.id === selectedBlock.id) ? '✓' : '★'}
          </button>
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
          background: #2a2a2a;
          padding: 2px 8px;
          border-radius: 3px;
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

        .mc-search-clear {
          width: 18px;
          height: 18px;
          background: #3a3a3a;
          border: 1px solid #555;
          color: #888;
          cursor: pointer;
          font-size: 12px;
          line-height: 1;
          padding: 0;
        }

        .mc-search-clear:hover {
          background: #4a4a4a;
          color: #fff;
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

        .mc-grid-header {
          padding: 4px 12px 6px;
          font-size: 10px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          background: #b8b8b8;
          border-bottom: 1px solid #a0a0a0;
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
          z-index: 1;
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

        .mc-more {
          grid-column: 1 / -1;
          text-align: center;
          padding: 6px;
          background: #6a6a6a;
          color: #ccc;
          font-size: 10px;
          border: 2px solid #555;
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
          min-width: 0;
        }

        .mc-footer-name {
          font-size: 13px;
          font-weight: bold;
          color: #fff;
          text-shadow: 1px 1px 0 #3f3f3f;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .mc-footer-meta {
          display: flex;
          gap: 8px;
          margin-top: 2px;
        }

        .mc-footer-id {
          font-size: 10px;
          color: #888;
          font-family: monospace;
        }

        .mc-footer-hardness {
          font-size: 10px;
          color: #666;
        }

        .mc-star {
          width: 32px;
          height: 32px;
          font-size: 14px;
          background: #3b3b3b;
          border: 2px solid;
          border-color: #555 #2a2a2a #2a2a2a #555;
          color: #888;
          cursor: pointer;
          flex-shrink: 0;
        }

        .mc-star:hover {
          background: #4a4a4a;
          color: #ffd700;
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
          padding: 0;
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

        .mc-picker-empty {
          grid-column: 1 / -1;
          text-align: center;
          padding: 20px;
          color: #555;
        }
      `}</style>
    </div>
  )
}
