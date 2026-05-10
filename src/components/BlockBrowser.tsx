import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useSceneStore } from '@/stores/sceneStore'
import { BLOCKS, getBlocksByCategory, searchBlocks } from '@/utils/blocks'
import { getMCTextureURL } from '@/services/textureService'
import type { BlockCategory, BlockData } from '@/types'

const QUICK_SLOTS = 9
const FAVORITES_KEY = 'sf_quickbar'
const RECENT_KEY = 'sf_recent'
const PINNED_KEY = 'sf_pinned'
const MAX_RECENT = 12
const PAGE_SIZE = 48

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

function loadPinned(): string[] {
  try {
    const saved = localStorage.getItem(PINNED_KEY)
    if (saved) return JSON.parse(saved) as string[]
  } catch {}
  return []
}

interface ContextMenuState {
  show: boolean
  x: number
  y: number
  block: BlockData | null
}

interface TooltipState {
  show: boolean
  x: number
  y: number
  block: BlockData | null
}

export function BlockBrowser() {
  const { selectedBlock, setSelectedBlock } = useSceneStore()
  const [activeCategory, setActiveCategory] = useState<BlockCategory | 'all' | 'recent' | 'pinned'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [favorites, setFavorites] = useState<BlockData[]>(loadFavorites)
  const [recent, setRecent] = useState<BlockData[]>(loadRecent)
  const [pinned, setPinned] = useState<string[]>(loadPinned)
  const [failedTextures, setFailedTextures] = useState<Set<string>>(new Set())
  const [showPicker, setShowPicker] = useState<number | null>(null)
  const [pickerSearch, setPickerSearch] = useState('')
  const [page, setPage] = useState(0)
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ show: false, x: 0, y: 0, block: null })
  const [tooltip, setTooltip] = useState<TooltipState>({ show: false, x: 0, y: 0, block: null })
  const pickerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const tooltipTimerRef = useRef<ReturnType<typeof setTimeout>>()

  const filteredBlocks = useMemo(() => {
    if (searchQuery.trim()) return searchBlocks(searchQuery)
    if (activeCategory === 'recent') return recent
    if (activeCategory === 'pinned') return pinned.map(id => BLOCKS.find(b => b.id === id)).filter((b): b is BlockData => !!b)
    if (activeCategory === 'all') return BLOCKS
    return getBlocksByCategory(activeCategory)
  }, [activeCategory, searchQuery, recent, pinned])

  const displayedBlocks = useMemo(() => {
    if (searchQuery.trim() || activeCategory === 'recent' || activeCategory === 'pinned') return filteredBlocks
    return filteredBlocks.slice(0, (page + 1) * PAGE_SIZE)
  }, [filteredBlocks, page, searchQuery, activeCategory])

  const hasMore = useMemo(() => {
    if (searchQuery.trim() || activeCategory === 'recent' || activeCategory === 'pinned') return false
    return filteredBlocks.length > displayedBlocks.length
  }, [filteredBlocks.length, displayedBlocks.length, searchQuery, activeCategory])

  useEffect(() => setPage(0), [activeCategory, searchQuery])

  useEffect(() => {
    const handleScroll = () => {
      if (!gridRef.current || !hasMore) return
      const { scrollTop, scrollHeight, clientHeight } = gridRef.current
      if (scrollTop + clientHeight >= scrollHeight - 80) setPage(p => p + 1)
    }
    const grid = gridRef.current
    if (grid) grid.addEventListener('scroll', handleScroll)
    return () => grid?.removeEventListener('scroll', handleScroll)
  }, [hasMore])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) {
        if (e.key === 'Escape') { (e.target as HTMLInputElement).blur(); setContextMenu({ show: false, x: 0, y: 0, block: null }) }
        return
      }
      if (e.key === '/') { e.preventDefault(); searchInputRef.current?.focus(); return }
      const num = parseInt(e.key)
      if (num >= 1 && num <= 9 && favorites[num - 1]) setSelectedBlock(favorites[num - 1])
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [favorites, setSelectedBlock])

  useEffect(() => {
    if (selectedBlock) {
      setRecent(prev => {
        const filtered = prev.filter(b => b.id !== selectedBlock.id)
        const newRecent = [selectedBlock, ...filtered].slice(0, MAX_RECENT)
        try { localStorage.setItem(RECENT_KEY, JSON.stringify(newRecent.map(b => b.id))) } catch {}
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
      setContextMenu({ show: false, x: 0, y: 0, block: null })
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleTextureError = useCallback((id: string) => {
    setFailedTextures(prev => new Set(prev).add(id))
  }, [])

  const handleBlockClick = (block: BlockData) => setSelectedBlock(block)

  const handleBlockRightClick = (e: React.MouseEvent, block: BlockData) => {
    e.preventDefault()
    setContextMenu({ show: true, x: e.clientX, y: e.clientY, block })
  }

  const handleBlockHover = (e: React.MouseEvent, block: BlockData) => {
    if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current)
    tooltipTimerRef.current = setTimeout(() => {
      setTooltip({ show: true, x: e.clientX, y: e.clientY, block })
    }, 500)
  }

  const handleBlockLeave = () => {
    if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current)
    setTooltip({ show: false, x: 0, y: 0, block: null })
  }

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
      try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavs.map(b => b.id))) } catch {}
      setShowPicker(null)
      setPickerSearch('')
    }
  }

  const handleAddToQuickbar = (block?: BlockData) => {
    const target = block || selectedBlock
    if (!target) return
    const existing = favorites.findIndex(f => f.id === target.id)
    if (existing >= 0) { setShowPicker(existing); return }
    const newFavs = [...favorites.slice(1), target]
    setFavorites(newFavs)
    try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavs.map(b => b.id))) } catch {}
  }

  const handleTogglePin = (block?: BlockData) => {
    const target = block || selectedBlock
    if (!target) return
    if (pinned.includes(target.id)) {
      const newPinned = pinned.filter(id => id !== target.id)
      setPinned(newPinned)
      try { localStorage.setItem(PINNED_KEY, JSON.stringify(newPinned)) } catch {}
    } else {
      const newPinned = [target.id, ...pinned].slice(0, 18)
      setPinned(newPinned)
      try { localStorage.setItem(PINNED_KEY, JSON.stringify(newPinned)) } catch {}
    }
  }

  const pickerBlocks = useMemo(() => {
    if (pickerSearch.trim()) return searchBlocks(pickerSearch).slice(0, 80)
    return BLOCKS.slice(0, 80)
  }, [pickerSearch])

  const isPinned = (id: string) => pinned.includes(id)
  const isInQuickbar = (id: string) => favorites.some(f => f.id === id)
  const categoryLabel = activeCategory === 'recent' ? '最近' : activeCategory === 'pinned' ? '收藏' : CATEGORIES.find(c => c.key === activeCategory)?.label || ''

  const contextBlock = contextMenu.block

  return (
    <div className="be-browser">
      <div className="be-toolbar">
        <div className="be-title">
          <span className="be-title-icon">🧱</span>
          <span className="be-title-text">方块选择</span>
        </div>
        <div className="be-toolbar-right">
          <span className="be-block-count">{BLOCKS.length}</span>
        </div>
      </div>

      <div className="be-hotbar-section">
        <div className="be-hotbar-header">
          <span>快捷栏</span>
          <span className="be-hint">1-9</span>
        </div>
        <div className="be-hotbar">
          {favorites.map((block, idx) => {
            const isActive = selectedBlock?.id === block.id
            return (
              <div
                key={block.id}
                className={`be-slot ${isActive ? 'active' : ''}`}
                onClick={() => handleSlotClick(block)}
                onContextMenu={(e) => handleSlotRightClick(e, idx)}
                onMouseEnter={(e) => handleBlockHover(e, block)}
                onMouseLeave={handleBlockLeave}
                title={`${block.nameZh}\n右键替换`}
              >
                <span className="be-slot-num">{idx + 1}</span>
                <div className="be-slot-inner">
                  {!failedTextures.has(block.id) ? (
                    <img src={getMCTextureURL(block.id)} alt="" onError={() => handleTextureError(block.id)} />
                  ) : (
                    <div style={{ backgroundColor: block.color }} />
                  )}
                </div>
                {isPinned(block.id) && <span className="be-slot-pin">📌</span>}
              </div>
            )
          })}
        </div>
      </div>

      {showPicker !== null && (
        <div className="be-picker-overlay" onClick={() => { setShowPicker(null); setPickerSearch('') }}>
          <div className="be-picker" ref={pickerRef} onClick={e => e.stopPropagation()}>
            <div className="be-picker-header">
              <span>替换 {showPicker + 1}</span>
              <button className="be-picker-close" onClick={() => { setShowPicker(null); setPickerSearch('') }}>×</button>
            </div>
            <div className="be-picker-search">
              <input
                type="text"
                placeholder="搜索方块..."
                value={pickerSearch}
                onChange={e => setPickerSearch(e.target.value)}
                autoFocus
              />
            </div>
            <div className="be-picker-grid">
              {pickerBlocks.map(block => (
                <div key={block.id} className="be-picker-item" onClick={() => handlePickBlock(block)}>
                  <div className="be-picker-icon">
                    {!failedTextures.has(block.id) ? (
                      <img src={getMCTextureURL(block.id)} alt="" onError={() => handleTextureError(block.id)} />
                    ) : (
                      <div style={{ backgroundColor: block.color }} />
                    )}
                  </div>
                  <span>{block.nameZh}</span>
                </div>
              ))}
              {pickerBlocks.length === 0 && <div className="be-picker-empty">无结果</div>}
            </div>
          </div>
        </div>
      )}

      {contextMenu.show && contextBlock && (
        <div
          className="be-context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="be-context-header">
            <div className="be-context-icon">
              {!failedTextures.has(contextBlock.id) ? (
                <img src={getMCTextureURL(contextBlock.id)} alt="" onError={() => handleTextureError(contextBlock.id)} />
              ) : (
                <div style={{ backgroundColor: contextBlock.color }} />
              )}
            </div>
            <div className="be-context-info">
              <span className="be-context-name">{contextBlock.nameZh}</span>
              <span className="be-context-id">{contextBlock.id.replace('minecraft:', '')}</span>
            </div>
          </div>
          <div className="be-context-divider" />
          <button className="be-context-item" onClick={() => { setSelectedBlock(contextBlock); setContextMenu({ show: false, x: 0, y: 0, block: null }) }}>
            <span>选择此方块</span>
            <span className="be-context-shortcut">点击</span>
          </button>
          <button className="be-context-item" onClick={() => { handleAddToQuickbar(contextBlock); setContextMenu({ show: false, x: 0, y: 0, block: null }) }}>
            <span>{isInQuickbar(contextBlock.id) ? '已加入快捷栏' : '加入快捷栏'}</span>
            {isInQuickbar(contextBlock.id) ? <span className="be-context-check">✓</span> : null}
          </button>
          <button className="be-context-item" onClick={() => { handleTogglePin(contextBlock); setContextMenu({ show: false, x: 0, y: 0, block: null }) }}>
            <span>{isPinned(contextBlock.id) ? '取消收藏' : '添加收藏'}</span>
            {isPinned(contextBlock.id) ? <span className="be-context-check">📌</span> : <span>☆</span>}
          </button>
        </div>
      )}

      {tooltip.show && tooltip.block && !contextMenu.show && (
        <div
          className="be-tooltip"
          style={{ left: (tooltip.x || 0) + 12, top: (tooltip.y || 0) + 12 }}
        >
          <div className="be-tooltip-header">
            <div className="be-tooltip-icon">
              {!failedTextures.has(tooltip.block?.id || '') ? (
                <img src={getMCTextureURL(tooltip.block?.id || '')} alt="" onError={() => handleTextureError(tooltip.block?.id || '')} />
              ) : (
                <div style={{ backgroundColor: tooltip.block?.color || '#888' }} />
              )}
            </div>
            <div>
              <div className="be-tooltip-name">{tooltip.block?.nameZh}</div>
              <div className="be-tooltip-id">{tooltip.block?.id.replace('minecraft:', '')}</div>
            </div>
          </div>
          <div className="be-tooltip-meta">
            <span>硬度: {tooltip.block?.hardness}</span>
            <span>{tooltip.block?.transparent ? '透明' : '不透明'}</span>
          </div>
        </div>
      )}

      <div className="be-search-section">
        <div className="be-search">
          <span className="be-search-icon">🔍</span>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="搜索方块... (按 / )"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="be-search-clear" onClick={() => setSearchQuery('')}>×</button>
          )}
        </div>
      </div>

      <div className="be-tabs">
        <button className={`be-tab ${activeCategory === 'recent' ? 'active' : ''}`} onClick={() => setActiveCategory('recent')}>
          最近 ({recent.length})
        </button>
        <button className={`be-tab ${activeCategory === 'pinned' ? 'active' : ''}`} onClick={() => setActiveCategory('pinned')}>
          收藏 ({pinned.length})
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat.key}
            className={`be-tab ${activeCategory === cat.key ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.key)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="be-content">
        <div className="be-grid-header">
          {searchQuery ? `"${searchQuery}" → ${filteredBlocks.length} 结果` : categoryLabel}
          {activeCategory === 'all' && !searchQuery && ` (${filteredBlocks.length})`}
        </div>
        <div className="be-grid" ref={gridRef}>
          {displayedBlocks.map(block => (
            <div
              key={block.id}
              className={`be-block ${selectedBlock?.id === block.id ? 'selected' : ''}`}
              onClick={() => handleBlockClick(block)}
              onContextMenu={(e) => handleBlockRightClick(e, block)}
              onMouseEnter={(e) => handleBlockHover(e, block)}
              onMouseLeave={handleBlockLeave}
            >
              <div className="be-block-inner">
                {!failedTextures.has(block.id) ? (
                  <img src={getMCTextureURL(block.id)} alt="" onError={() => handleTextureError(block.id)} />
                ) : (
                  <div style={{ backgroundColor: block.color }} />
                )}
              </div>
              {isPinned(block.id) && <span className="be-block-pin">📌</span>}
            </div>
          ))}
          {filteredBlocks.length === 0 && <div className="be-empty">未找到方块</div>}
          {hasMore && (
            <div className="be-load-more" onClick={() => setPage(p => p + 1)}>
              加载更多 (+{filteredBlocks.length - displayedBlocks.length})
            </div>
          )}
        </div>
      </div>

      {selectedBlock && (
        <div className="be-statusbar">
          <div className="be-status-icon">
            {!failedTextures.has(selectedBlock.id) ? (
              <img src={getMCTextureURL(selectedBlock.id)} alt="" onError={() => handleTextureError(selectedBlock.id)} />
            ) : (
              <div style={{ backgroundColor: selectedBlock.color }} />
            )}
          </div>
          <div className="be-status-info">
            <span className="be-status-name">{selectedBlock.nameZh}</span>
            <span className="be-status-meta">
              {selectedBlock.id.replace('minecraft:', '')} | 硬度 {selectedBlock.hardness}
            </span>
          </div>
          <div className="be-status-actions">
            <button
              className={`be-action ${isPinned(selectedBlock.id) ? 'pinned' : ''}`}
              onClick={() => handleTogglePin()}
              title={isPinned(selectedBlock.id) ? '取消收藏' : '收藏'}
            >
              {isPinned(selectedBlock.id) ? '📌' : '☆'}
            </button>
            <button
              className={`be-action ${isInQuickbar(selectedBlock.id) ? 'inbar' : ''}`}
              onClick={() => handleAddToQuickbar()}
              title={isInQuickbar(selectedBlock.id) ? '已在快捷栏' : '加入快捷栏'}
            >
              {isInQuickbar(selectedBlock.id) ? '✓' : '+'}
            </button>
          </div>
        </div>
      )}

      <style>{`
        .be-browser {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #c6c6c6;
          font-family: 'Minecraft', 'Segoe UI', sans-serif;
          user-select: none;
          position: relative;
        }

        .be-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 10px;
          background: linear-gradient(to bottom, #4a4a4a 0%, #2d2d2d 100%);
          border-bottom: 2px solid #1a1a1a;
        }

        .be-title {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .be-title-icon { font-size: 14px; }

        .be-title-text {
          font-size: 13px;
          font-weight: bold;
          color: #fff;
          text-shadow: 1px 1px 0 #1a1a1a;
        }

        .be-toolbar-right { display: flex; align-items: center; gap: 8px; }

        .be-block-count {
          font-size: 10px;
          color: #999;
          background: #1a1a1a;
          padding: 2px 6px;
          border-radius: 2px;
        }

        .be-hotbar-section {
          padding: 8px 10px;
          background: #1a1a1a;
          border-bottom: 2px solid #333;
        }

        .be-hotbar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
          font-size: 10px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .be-hint { color: #5c9bd4; font-size: 9px; }

        .be-hotbar {
          display: flex;
          gap: 2px;
          justify-content: center;
        }

        .be-slot {
          position: relative;
          width: 38px;
          height: 38px;
          background: #2d2d2d;
          border: 2px solid;
          border-color: #404040 #1a1a1a #1a1a1a #404040;
          cursor: pointer;
        }

        .be-slot:hover { filter: brightness(1.15); }

        .be-slot.active { border-color: #5c9bd4 #3a5f89 #3a5f89 #5c9bd4; }

        .be-slot-num {
          position: absolute;
          top: 1px;
          left: 2px;
          font-size: 9px;
          font-weight: bold;
          color: #fff;
          text-shadow: 1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000;
          z-index: 2;
          pointer-events: none;
        }

        .be-slot-pin {
          position: absolute;
          top: 0;
          right: 0;
          font-size: 8px;
          z-index: 2;
        }

        .be-slot-inner { position: absolute; inset: 0; }

        .be-slot-inner img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          image-rendering: pixelated;
          z-index: 1;
        }

        .be-slot-inner div { position: absolute; inset: 0; }

        .be-search-section {
          padding: 8px 10px;
          background: #b8b8b8;
          border-bottom: 1px solid #9a9a9a;
        }

        .be-search {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 8px;
          background: #fff;
          border: 2px solid;
          border-color: #404040 #1a1a1a #1a1a1a #404040;
        }

        .be-search-icon { font-size: 12px; opacity: 0.5; }

        .be-search input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: #000;
          font-size: 12px;
          font-family: inherit;
        }

        .be-search input::placeholder { color: #888; }

        .be-search-clear {
          width: 16px;
          height: 16px;
          background: #d0d0d0;
          border: 1px solid #666;
          color: #666;
          cursor: pointer;
          font-size: 10px;
          line-height: 1;
          padding: 0;
        }

        .be-search-clear:hover { background: #e0e0e0; }

        .be-tabs {
          display: flex;
          gap: 2px;
          padding: 6px 10px;
          background: #b8b8b8;
          border-bottom: 1px solid #9a9a9a;
          overflow-x: auto;
        }

        .be-tab {
          padding: 4px 8px;
          font-size: 10px;
          color: #fff;
          background: #4a4a4a;
          border: 2px solid;
          border-color: #666 #333 #333 #666;
          cursor: pointer;
          white-space: nowrap;
          font-family: inherit;
        }

        .be-tab:hover { background: #5a5a5a; }

        .be-tab.active {
          background: #4a698f;
          border-color: #6a8ab4 #38537a #38537a #6a8ab4;
        }

        .be-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }

        .be-grid-header {
          padding: 4px 10px;
          font-size: 10px;
          color: #666;
          background: #a0a0a0;
          border-bottom: 1px solid #888;
        }

        .be-grid {
          flex: 1;
          overflow-y: auto;
          padding: 6px;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(32px, 1fr));
          gap: 2px;
          align-content: start;
          background: #8b8b8b;
        }

        .be-grid::-webkit-scrollbar { width: 6px; }
        .be-grid::-webkit-scrollbar-track { background: #5a5a5a; }
        .be-grid::-webkit-scrollbar-thumb { background: #2d2d2d; border: 1px solid #3d3d3d; }

        .be-block {
          position: relative;
          aspect-ratio: 1;
          background: #2d2d2d;
          border: 2px solid;
          border-color: #404040 #1a1a1a #1a1a1a #404040;
          cursor: pointer;
        }

        .be-block:hover { filter: brightness(1.2); z-index: 1; }

        .be-block.selected { border-color: #5c9bd4 #3a5f89 #3a5f89 #5c9bd4; }

        .be-block-inner { position: absolute; inset: 0; }

        .be-block-inner img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          image-rendering: pixelated;
          z-index: 1;
        }

        .be-block-inner div { position: absolute; inset: 0; }

        .be-block-pin {
          position: absolute;
          top: 0;
          right: 0;
          font-size: 8px;
          z-index: 2;
        }

        .be-empty {
          grid-column: 1 / -1;
          text-align: center;
          padding: 20px;
          color: #555;
          font-size: 11px;
        }

        .be-load-more {
          grid-column: 1 / -1;
          text-align: center;
          padding: 6px;
          background: #6a6a6a;
          color: #ccc;
          font-size: 10px;
          border: 2px solid #555;
          cursor: pointer;
        }

        .be-load-more:hover { background: #7a7a7a; }

        .be-statusbar {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 10px;
          background: linear-gradient(to bottom, #4a4a4a 0%, #2d2d2d 100%);
          border-top: 2px solid #555;
        }

        .be-status-icon {
          position: relative;
          width: 36px;
          height: 36px;
          background: #2d2d2d;
          border: 2px solid;
          border-color: #404040 #1a1a1a #1a1a1a #404040;
          flex-shrink: 0;
        }

        .be-status-icon img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          image-rendering: pixelated;
          z-index: 1;
        }

        .be-status-icon div { position: absolute; inset: 0; }

        .be-status-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .be-status-name {
          font-size: 12px;
          font-weight: bold;
          color: #fff;
          text-shadow: 1px 1px 0 #1a1a1a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .be-status-meta {
          font-size: 9px;
          color: #888;
          font-family: monospace;
        }

        .be-status-actions { display: flex; gap: 4px; }

        .be-action {
          width: 26px;
          height: 26px;
          font-size: 12px;
          background: #3a3a3a;
          border: 2px solid;
          border-color: #555 #2a2a2a #2a2a2a #555;
          color: #888;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .be-action:hover { background: #4a4a4a; }

        .be-action.pinned { color: #ffd700; }

        .be-action.inbar { color: #5c9bd4; }

        .be-picker-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
        }

        .be-picker {
          width: 280px;
          max-height: 340px;
          background: #c6c6c6;
          border: 4px solid;
          border-color: #555 #1a1a1a #1a1a1a #555;
          display: flex;
          flex-direction: column;
        }

        .be-picker-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 8px;
          background: linear-gradient(to bottom, #4a4a4a 0%, #2d2d2d 100%);
          border-bottom: 2px solid #1a1a1a;
          font-size: 12px;
          font-weight: bold;
          color: #fff;
        }

        .be-picker-close {
          width: 18px;
          height: 18px;
          background: #3a3a3a;
          border: 2px solid;
          border-color: #555 #2a2a2a #2a2a2a #555;
          color: #fff;
          cursor: pointer;
          font-size: 12px;
          line-height: 1;
          padding: 0;
        }

        .be-picker-close:hover { background: #4a4a4a; }

        .be-picker-search {
          padding: 6px;
          background: #8b8b8b;
          border-bottom: 1px solid #6b6b6b;
        }

        .be-picker-search input {
          width: 100%;
          padding: 5px 7px;
          background: #fff;
          border: 2px solid;
          border-color: #404040 #1a1a1a #1a1a1a #404040;
          color: #000;
          font-size: 11px;
          outline: none;
          font-family: inherit;
        }

        .be-picker-grid {
          flex: 1;
          overflow-y: auto;
          padding: 4px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2px;
          background: #8b8b8b;
        }

        .be-picker-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          padding: 3px;
          background: #2d2d2d;
          border: 2px solid;
          border-color: #404040 #1a1a1a #1a1a1a #404040;
          cursor: pointer;
        }

        .be-picker-item:hover { filter: brightness(1.2); }

        .be-picker-icon {
          position: relative;
          width: 32px;
          height: 32px;
          background: #3a3a3a;
        }

        .be-picker-icon img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          image-rendering: pixelated;
          z-index: 1;
        }

        .be-picker-icon div { position: absolute; inset: 0; }

        .be-picker-item span {
          font-size: 7px;
          color: #aaa;
          text-align: center;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .be-picker-empty {
          grid-column: 1 / -1;
          text-align: center;
          padding: 16px;
          color: #555;
        }

        .be-context-menu {
          position: fixed;
          min-width: 180px;
          background: #2d2d2d;
          border: 2px solid;
          border-color: #555 #1a1a1a #1a1a1a #555;
          z-index: 200;
          padding: 4px 0;
        }

        .be-context-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: #3a3a3a;
        }

        .be-context-icon {
          position: relative;
          width: 32px;
          height: 32px;
          background: #4a4a4a;
          border: 2px solid #555;
        }

        .be-context-icon img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          image-rendering: pixelated;
          z-index: 1;
        }

        .be-context-icon div { position: absolute; inset: 0; }

        .be-context-info { display: flex; flex-direction: column; gap: 2px; }

        .be-context-name {
          font-size: 12px;
          font-weight: bold;
          color: #fff;
        }

        .be-context-id {
          font-size: 9px;
          color: #888;
          font-family: monospace;
        }

        .be-context-divider {
          height: 1px;
          background: #555;
          margin: 4px 0;
        }

        .be-context-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 6px 12px;
          background: transparent;
          border: none;
          color: #fff;
          font-size: 11px;
          cursor: pointer;
          text-align: left;
          font-family: inherit;
        }

        .be-context-item:hover { background: #4a4a4a; }

        .be-context-shortcut {
          font-size: 9px;
          color: #888;
        }

        .be-context-check { font-size: 10px; }

        .be-tooltip {
          position: fixed;
          min-width: 140px;
          background: #2d2d2d;
          border: 2px solid;
          border-color: #555 #1a1a1a #1a1a1a #555;
          z-index: 150;
          padding: 8px;
        }

        .be-tooltip-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }

        .be-tooltip-icon {
          position: relative;
          width: 32px;
          height: 32px;
          background: #4a4a4a;
          border: 2px solid #555;
        }

        .be-tooltip-icon img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          image-rendering: pixelated;
          z-index: 1;
        }

        .be-tooltip-icon div { position: absolute; inset: 0; }

        .be-tooltip-name {
          font-size: 12px;
          font-weight: bold;
          color: #fff;
        }

        .be-tooltip-id {
          font-size: 9px;
          color: #888;
          font-family: monospace;
        }

        .be-tooltip-meta {
          display: flex;
          gap: 8px;
          font-size: 9px;
          color: #aaa;
        }
      `}</style>
    </div>
  )
}
