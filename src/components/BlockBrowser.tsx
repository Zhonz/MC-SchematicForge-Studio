import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useSceneStore } from '@/stores/sceneStore'
import { BLOCKS, getBlocksByCategory, searchBlocks } from '@/utils/blocks'
import { getMCTextureURL } from '@/services/textureService'
import type { BlockCategory, BlockData } from '@/types'

const QUICK_SLOTS = 9
const FAVORITES_KEY = 'sf_quickbar'
const RECENT_KEY = 'sf_recent'
const PINNED_KEY = 'sf_pinned'
const PALETTE_KEY = 'sf_palette'
const SEARCH_HISTORY_KEY = 'sf_search_history'
const MAX_RECENT = 18
const MAX_PALETTE = 12
const MAX_SEARCH_HISTORY = 10
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

function loadPalette(): string[] {
  try {
    const saved = localStorage.getItem(PALETTE_KEY)
    if (saved) return JSON.parse(saved) as string[]
  } catch {}
  return BLOCKS.slice(0, MAX_PALETTE).map(b => b.id)
}

function loadSearchHistory(): string[] {
  try {
    const saved = localStorage.getItem(SEARCH_HISTORY_KEY)
    if (saved) return JSON.parse(saved) as string[]
  } catch {}
  return []
}

const CATEGORY_COUNTS = {
  all: BLOCKS.length,
  building: BLOCKS.filter(b => b.category === 'building').length,
  natural: BLOCKS.filter(b => b.category === 'natural').length,
  redstone: BLOCKS.filter(b => b.category === 'redstone').length,
  decoration: BLOCKS.filter(b => b.category === 'decoration').length,
  utility: BLOCKS.filter(b => b.category === 'utility').length,
}

interface ContextMenuState {
  show: boolean
  x: number
  y: number
  block: BlockData | null
}

export function BlockBrowser() {
  const { selectedBlock, setSelectedBlock } = useSceneStore()
  const [activeCategory, setActiveCategory] = useState<BlockCategory | 'all' | 'recent' | 'pinned' | 'palette'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchHistory, setSearchHistory] = useState<string[]>(loadSearchHistory)
  const [showHistory, setShowHistory] = useState(false)
  const [favorites, setFavorites] = useState<BlockData[]>(loadFavorites)
  const [recent, setRecent] = useState<BlockData[]>(loadRecent)
  const [pinned, setPinned] = useState<string[]>(loadPinned)
  const [palette, setPalette] = useState<string[]>(loadPalette)
  const [failedTextures, setFailedTextures] = useState<Set<string>>(new Set())
  const [showPicker, setShowPicker] = useState<number | null>(null)
  const [pickerSearch, setPickerSearch] = useState('')
  const [page, setPage] = useState(0)
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ show: false, x: 0, y: 0, block: null })
  const [showHelp, setShowHelp] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [draggedSlot, setDraggedSlot] = useState<number | null>(null)
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null)
  const pickerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const historyRef = useRef<HTMLDivElement>(null)

  const filteredBlocks = useMemo(() => {
    if (searchQuery.trim()) return searchBlocks(searchQuery)
    if (activeCategory === 'recent') return recent
    if (activeCategory === 'pinned') return pinned.map(id => BLOCKS.find(b => b.id === id)).filter((b): b is BlockData => !!b)
    if (activeCategory === 'palette') return palette.map(id => BLOCKS.find(b => b.id === id)).filter((b): b is BlockData => !!b)
    if (activeCategory === 'all') return BLOCKS
    return getBlocksByCategory(activeCategory)
  }, [activeCategory, searchQuery, recent, pinned, palette])

  const displayedBlocks = useMemo(() => {
    if (searchQuery.trim() || ['recent', 'pinned', 'palette'].includes(activeCategory)) return filteredBlocks
    return filteredBlocks.slice(0, (page + 1) * PAGE_SIZE)
  }, [filteredBlocks, page, searchQuery, activeCategory])

  const hasMore = useMemo(() => {
    if (searchQuery.trim() || ['recent', 'pinned', 'palette'].includes(activeCategory)) return false
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
        if (e.key === 'Escape') {
          (e.target as HTMLInputElement).blur()
          setContextMenu({ show: false, x: 0, y: 0, block: null })
          setShowPicker(null)
          setShowHistory(false)
        }
        return
      }
      if (e.key === '/') { e.preventDefault(); searchInputRef.current?.focus(); return }
      if (e.key === '?') { e.preventDefault(); setShowHelp(h => !h); return }
      if (e.key === 'b' || e.key === 'B') { e.preventDefault(); searchInputRef.current?.focus(); return }
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
      if (historyRef.current && !historyRef.current.contains(e.target as Node)) {
        setShowHistory(false)
      }
      setContextMenu({ show: false, x: 0, y: 0, block: null })
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleTextureError = useCallback((id: string) => {
    setFailedTextures(prev => new Set(prev).add(id))
  }, [])

  const handleBlockClick = (block: BlockData) => {
    setSelectedBlock(block)
    setShowHistory(false)
  }

  const handleBlockDoubleClick = (block: BlockData) => handleAddToPalette(block)

  const handleBlockRightClick = (e: React.MouseEvent, block: BlockData) => {
    e.preventDefault()
    setContextMenu({ show: true, x: e.clientX, y: e.clientY, block })
  }

  const handleSlotClick = (block: BlockData) => setSelectedBlock(block)
  const handleSlotRightClick = (e: React.MouseEvent, idx: number) => {
    e.preventDefault()
    setShowPicker(showPicker === idx ? null : idx)
    setPickerSearch('')
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setShowHistory(value.length === 0)
  }

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      const newHistory = [searchQuery, ...searchHistory.filter(h => h !== searchQuery)].slice(0, MAX_SEARCH_HISTORY)
      setSearchHistory(newHistory)
      try { localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory)) } catch {}
    }
    setShowHistory(false)
  }

  const handleHistoryClick = (history: string) => {
    setSearchQuery(history)
    setShowHistory(false)
    searchInputRef.current?.focus()
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

  const handleAddToPalette = (block?: BlockData) => {
    const target = block || selectedBlock
    if (!target) return
    if (!palette.includes(target.id)) {
      const newPalette = [target.id, ...palette].slice(0, MAX_PALETTE)
      setPalette(newPalette)
      try { localStorage.setItem(PALETTE_KEY, JSON.stringify(newPalette)) } catch {}
    }
  }

  const handleRemoveFromPalette = (id: string) => {
    const newPalette = palette.filter(p => p !== id)
    setPalette(newPalette)
    try { localStorage.setItem(PALETTE_KEY, JSON.stringify(newPalette)) } catch {}
  }

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id.replace('minecraft:', ''))
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    setDraggedSlot(idx)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault()
    setDragOverSlot(idx)
  }

  const handleDragEnd = () => {
    if (draggedSlot !== null && dragOverSlot !== null && draggedSlot !== dragOverSlot) {
      const newFavs = [...favorites]
      const [removed] = newFavs.splice(draggedSlot, 1)
      newFavs.splice(dragOverSlot, 0, removed)
      setFavorites(newFavs)
      try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavs.map(b => b.id))) } catch {}
    }
    setDraggedSlot(null)
    setDragOverSlot(null)
  }

  const pickerBlocks = useMemo(() => {
    if (pickerSearch.trim()) return searchBlocks(pickerSearch).slice(0, 80)
    return BLOCKS.slice(0, 80)
  }, [pickerSearch])

  const isPinned = (id: string) => pinned.includes(id)
  const isInQuickbar = (id: string) => favorites.some(f => f.id === id)
  const isInPalette = (id: string) => palette.includes(id)

  const categoryLabel = activeCategory === 'recent' ? '最近' : 
    activeCategory === 'pinned' ? '收藏' : 
    activeCategory === 'palette' ? '调色板' : 
    CATEGORIES.find(c => c.key === activeCategory)?.label || ''

  const contextBlock = contextMenu.block

  return (
    <div className="sb-root">
      <div className="sb-header">
        <div className="sb-title">
          <span className="sb-title-icon">🧱</span>
          <span className="sb-title-text">方块</span>
          <span className="sb-title-count">{BLOCKS.length}</span>
        </div>
        <button className="sb-help-btn" onClick={() => setShowHelp(h => !h)} title="快捷键">?</button>
      </div>

      {showHelp && (
        <div className="sb-help">
          <div className="sb-help-title">快捷键</div>
          <div className="sb-help-row"><kbd>1-9</kbd><span>快捷栏</span></div>
          <div className="sb-help-row"><kbd>/</kbd><kbd>B</kbd><span>搜索</span></div>
          <div className="sb-help-row"><kbd>↑↓</kbd><span>历史</span></div>
          <div className="sb-help-row"><kbd>Esc</kbd><span>关闭</span></div>
          <div className="sb-help-row"><kbd>右键</kbd><span>菜单</span></div>
          <div className="sb-help-row"><kbd>双击</kbd><span>调色板</span></div>
        </div>
      )}

      <div className="sb-palette-zone">
        <div className="sb-zone-label">
          <span>调色板</span>
          <span className="sb-zone-hint">双击添加</span>
        </div>
        <div className="sb-palette">
          {palette.slice(0, MAX_PALETTE).map((id, idx) => {
            const block = BLOCKS.find(b => b.id === id)
            if (!block) return null
            const isActive = selectedBlock?.id === block.id
            return (
              <div
                key={id}
                className={`sb-palette-item ${isActive ? 'active' : ''} ${dragOverSlot === idx ? 'drop-target' : ''}`}
                draggable
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragEnd={handleDragEnd}
                onClick={() => handleBlockClick(block)}
                onContextMenu={(e) => handleBlockRightClick(e, block)}
                title={block.nameZh}
              >
                <div className="sb-item-img">
                  {!failedTextures.has(id) ? (
                    <img src={getMCTextureURL(id)} alt="" onError={() => handleTextureError(id)} />
                  ) : (
                    <div style={{ backgroundColor: block.color }} />
                  )}
                </div>
              </div>
            )
          })}
          {palette.length === 0 && (
            <div className="sb-palette-empty">双击方块添加</div>
          )}
        </div>
      </div>

      <div className="sb-quickbar-zone">
        <div className="sb-zone-label">
          <span>快捷栏</span>
          <span className="sb-zone-hint">1-9</span>
        </div>
        <div className="sb-quickbar">
          {favorites.map((block, idx) => {
            const isActive = selectedBlock?.id === block.id
            return (
              <div
                key={block.id}
                className={`sb-slot ${isActive ? 'active' : ''} ${dragOverSlot === idx ? 'drop-target' : ''}`}
                draggable
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragEnd={handleDragEnd}
                onClick={() => handleSlotClick(block)}
                onContextMenu={(e) => handleSlotRightClick(e, idx)}
                title={block.nameZh}
              >
                <span className="sb-slot-num">{idx + 1}</span>
                <div className="sb-slot-img">
                  {!failedTextures.has(block.id) ? (
                    <img src={getMCTextureURL(block.id)} alt="" onError={() => handleTextureError(block.id)} />
                  ) : (
                    <div style={{ backgroundColor: block.color }} />
                  )}
                </div>
                {isPinned(block.id) && <span className="sb-slot-pin">📌</span>}
              </div>
            )
          })}
        </div>
      </div>

      {showPicker !== null && (
        <div className="sb-picker-overlay" onClick={() => { setShowPicker(null); setPickerSearch('') }}>
          <div className="sb-picker" ref={pickerRef} onClick={e => e.stopPropagation()}>
            <div className="sb-picker-title">
              <span>替换 {showPicker + 1}</span>
              <button className="sb-picker-close" onClick={() => { setShowPicker(null); setPickerSearch('') }}>×</button>
            </div>
            <div className="sb-picker-search">
              <input
                type="text"
                placeholder="搜索..."
                value={pickerSearch}
                onChange={e => setPickerSearch(e.target.value)}
                autoFocus
              />
            </div>
            <div className="sb-picker-grid">
              {pickerBlocks.map(block => (
                <div key={block.id} className="sb-picker-cell" onClick={() => handlePickBlock(block)}>
                  <div className="sb-picker-img">
                    {!failedTextures.has(block.id) ? (
                      <img src={getMCTextureURL(block.id)} alt="" onError={() => handleTextureError(block.id)} />
                    ) : (
                      <div style={{ backgroundColor: block.color }} />
                    )}
                  </div>
                  <span>{block.nameZh}</span>
                </div>
              ))}
              {pickerBlocks.length === 0 && <div className="sb-picker-empty">无结果</div>}
            </div>
          </div>
        </div>
      )}

      {contextMenu.show && contextBlock && (
        <div className="sb-context" style={{ left: contextMenu.x, top: contextMenu.y }} onClick={e => e.stopPropagation()}>
          <div className="sb-context-header">
            <div className="sb-context-icon">
              {!failedTextures.has(contextBlock.id) ? (
                <img src={getMCTextureURL(contextBlock.id)} alt="" onError={() => handleTextureError(contextBlock.id)} />
              ) : (
                <div style={{ backgroundColor: contextBlock.color }} />
              )}
            </div>
            <div>
              <div className="sb-context-name">{contextBlock.nameZh}</div>
              <div className="sb-context-id">{contextBlock.id.replace('minecraft:', '')}</div>
            </div>
          </div>
          <div className="sb-context-sep" />
          <button className="sb-context-item" onClick={() => { setSelectedBlock(contextBlock); setContextMenu({ show: false, x: 0, y: 0, block: null }) }}>选择</button>
          <button className="sb-context-item" onClick={() => { handleAddToPalette(contextBlock); setContextMenu({ show: false, x: 0, y: 0, block: null }) }}>
            {isInPalette(contextBlock.id) ? '✓ 已在调色板' : '+ 加入调色板'}
          </button>
          <button className="sb-context-item" onClick={() => { handleAddToQuickbar(contextBlock); setContextMenu({ show: false, x: 0, y: 0, block: null }) }}>
            {isInQuickbar(contextBlock.id) ? '✓ 已在快捷栏' : '+ 加入快捷栏'}
          </button>
          <button className="sb-context-item" onClick={() => { handleTogglePin(contextBlock); setContextMenu({ show: false, x: 0, y: 0, block: null }) }}>
            {isPinned(contextBlock.id) ? '📌 取消收藏' : '☆ 收藏'}
          </button>
          <div className="sb-context-sep" />
          <button className="sb-context-item" onClick={() => { handleCopyId(contextBlock.id); setContextMenu({ show: false, x: 0, y: 0, block: null }) }}>
            {copiedId === contextBlock.id ? '✓ 已复制' : '📋 复制ID'}
          </button>
        </div>
      )}

      <div className="sb-search-zone">
        <div className="sb-search-box">
          <span className="sb-search-icon">🔍</span>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="搜索方块..."
            value={searchQuery}
            onChange={e => handleSearchChange(e.target.value)}
            onFocus={() => setShowHistory(true)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSearchSubmit()
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                const idx = searchHistory.indexOf(searchQuery)
                if (idx < searchHistory.length - 1) setSearchQuery(searchHistory[idx + 1])
              }
              if (e.key === 'ArrowUp') {
                e.preventDefault()
                const idx = searchHistory.indexOf(searchQuery)
                if (idx > 0) setSearchQuery(searchHistory[idx - 1])
                else if (idx === -1 && searchHistory.length > 0) setSearchQuery(searchHistory[0])
              }
            }}
          />
          {searchQuery && <button className="sb-search-clear" onClick={() => setSearchQuery('')}>×</button>}
        </div>
        {showHistory && searchHistory.length > 0 && !searchQuery && (
          <div className="sb-history" ref={historyRef}>
            <div className="sb-history-title">历史</div>
            {searchHistory.map((h, i) => (
              <button key={i} className="sb-history-item" onClick={() => handleHistoryClick(h)}>
                <span>🕐</span><span>{h}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="sb-tabs">
        <button className={`sb-tab ${activeCategory === 'recent' ? 'active' : ''}`} onClick={() => setActiveCategory('recent')}>
          最近 ({recent.length})
        </button>
        <button className={`sb-tab ${activeCategory === 'pinned' ? 'active' : ''}`} onClick={() => setActiveCategory('pinned')}>
          收藏 ({pinned.length})
        </button>
        <button className={`sb-tab ${activeCategory === 'palette' ? 'active' : ''}`} onClick={() => setActiveCategory('palette')}>
          调色板 ({palette.length})
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat.key}
            className={`sb-tab ${activeCategory === cat.key ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.key)}
          >
            {cat.label} ({CATEGORY_COUNTS[cat.key as keyof typeof CATEGORY_COUNTS]})
          </button>
        ))}
      </div>

      <div className="sb-grid-header">{searchQuery ? `"${searchQuery}" ${filteredBlocks.length}` : categoryLabel}</div>

      <div className="sb-grid" ref={gridRef}>
        {displayedBlocks.map(block => (
          <div
            key={block.id}
            className={`sb-block ${selectedBlock?.id === block.id ? 'selected' : ''}`}
            onClick={() => handleBlockClick(block)}
            onDoubleClick={() => handleBlockDoubleClick(block)}
            onContextMenu={(e) => handleBlockRightClick(e, block)}
          >
            <div className="sb-block-img">
              {!failedTextures.has(block.id) ? (
                <img src={getMCTextureURL(block.id)} alt="" onError={() => handleTextureError(block.id)} />
              ) : (
                <div style={{ backgroundColor: block.color }} />
              )}
            </div>
            {isPinned(block.id) && <span className="sb-block-pin">📌</span>}
          </div>
        ))}
        {filteredBlocks.length === 0 && <div className="sb-empty">无结果</div>}
        {hasMore && (
          <div className="sb-more" onClick={() => setPage(p => p + 1)}>+{filteredBlocks.length - displayedBlocks.length}</div>
        )}
      </div>

      {selectedBlock && (
        <div className="sb-footer">
          <div className="sb-footer-icon">
            {!failedTextures.has(selectedBlock.id) ? (
              <img src={getMCTextureURL(selectedBlock.id)} alt="" onError={() => handleTextureError(selectedBlock.id)} />
            ) : (
              <div style={{ backgroundColor: selectedBlock.color }} />
            )}
          </div>
          <div className="sb-footer-info">
            <div className="sb-footer-name">{selectedBlock.nameZh}</div>
            <div className="sb-footer-meta">{selectedBlock.id.replace('minecraft:', '')} · 硬度 {selectedBlock.hardness}</div>
          </div>
          <div className="sb-footer-btns">
            <button className={`sb-footer-btn ${isPinned(selectedBlock.id) ? 'active' : ''}`} onClick={() => handleTogglePin()}>
              {isPinned(selectedBlock.id) ? '📌' : '☆'}
            </button>
            <button className={`sb-footer-btn ${isInPalette(selectedBlock.id) ? 'in' : ''}`} onClick={() => handleAddToPalette()}>
              <span>{isInPalette(selectedBlock.id) ? '✓' : '🎨'}</span>
            </button>
            <button className={`sb-footer-btn ${isInQuickbar(selectedBlock.id) ? 'in' : ''}`} onClick={() => handleAddToQuickbar()}>
              <span>{isInQuickbar(selectedBlock.id) ? '✓' : '+'}</span>
            </button>
          </div>
        </div>
      )}

      <style>{`
        .sb-root {
          --bg-deep: #0d0d0d;
          --bg-base: #1a1a1a;
          --bg-surface: #242424;
          --bg-elevated: #2e2e2e;
          --bg-hover: #383838;
          --border: #3a3a3a;
          --border-light: #4a4a4a;
          --text-primary: #e8e8e8;
          --text-secondary: #a0a0a0;
          --text-hint: #666;
          --accent: #5c9bd4;
          --accent-dim: #3a5f89;
          --gold: #d4a84b;
          
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--bg-deep);
          color: var(--text-primary);
          font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
          user-select: none;
          position: relative;
        }

        .sb-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          background: var(--bg-base);
          border-bottom: 1px solid var(--border);
        }

        .sb-title { display: flex; align-items: center; gap: 8px; }
        .sb-title-icon { font-size: 16px; }
        .sb-title-text { font-size: 13px; font-weight: 600; color: var(--text-primary); }
        .sb-title-count {
          font-size: 10px;
          padding: 2px 6px;
          background: var(--bg-surface);
          border-radius: 10px;
          color: var(--text-hint);
        }

        .sb-help-btn {
          width: 22px;
          height: 22px;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 4px;
          color: var(--text-hint);
          cursor: pointer;
          font-size: 11px;
          font-weight: 600;
          transition: all 0.15s;
        }
        .sb-help-btn:hover { background: var(--bg-elevated); color: var(--text-primary); }

        .sb-help {
          padding: 10px 14px;
          background: var(--bg-base);
          border-bottom: 1px solid var(--border);
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 4px 10px;
          font-size: 11px;
        }
        .sb-help-title {
          grid-column: 1 / -1;
          font-size: 10px;
          color: var(--text-hint);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }
        .sb-help-row { display: contents; }
        .sb-help-row kbd {
          background: var(--bg-surface);
          border: 1px solid var(--border-light);
          padding: 1px 5px;
          border-radius: 3px;
          font-size: 10px;
          font-family: inherit;
          color: var(--text-secondary);
        }
        .sb-help-row span { color: var(--text-hint); }

        .sb-palette-zone, .sb-quickbar-zone {
          padding: 8px 14px;
          background: var(--bg-base);
          border-bottom: 1px solid var(--border);
        }

        .sb-zone-label {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
          font-size: 10px;
          color: var(--text-hint);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .sb-zone-hint { color: var(--accent); font-size: 9px; }

        .sb-palette {
          display: flex;
          gap: 3px;
          flex-wrap: wrap;
        }

        .sb-palette-item, .sb-slot {
          position: relative;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.12s;
        }

        .sb-palette-item {
          width: 30px;
          height: 30px;
        }
        .sb-slot {
          width: 36px;
          height: 36px;
        }

        .sb-palette-item:hover, .sb-slot:hover {
          border-color: var(--border-light);
          transform: scale(1.08);
        }

        .sb-palette-item.active, .sb-slot.active {
          border-color: var(--accent);
          box-shadow: 0 0 0 1px var(--accent-dim);
        }

        .sb-palette-item.drop-target, .sb-slot.drop-target {
          border-color: var(--gold);
          border-style: dashed;
        }

        .sb-item-img, .sb-slot-img {
          position: absolute;
          inset: 0;
          border-radius: 3px;
          overflow: hidden;
        }

        .sb-item-img img, .sb-slot-img img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          image-rendering: pixelated;
          z-index: 1;
        }

        .sb-item-img div, .sb-slot-img div {
          position: absolute;
          inset: 0;
        }

        .sb-slot-num {
          position: absolute;
          top: 2px;
          left: 3px;
          font-size: 9px;
          font-weight: 700;
          color: #fff;
          text-shadow: 0 1px 2px rgba(0,0,0,0.9);
          z-index: 2;
        }

        .sb-slot-pin {
          position: absolute;
          top: 0;
          right: 0;
          font-size: 8px;
          z-index: 2;
        }

        .sb-palette-empty {
          width: 100%;
          text-align: center;
          font-size: 10px;
          color: var(--text-hint);
          padding: 6px;
        }

        .sb-quickbar { display: flex; gap: 2px; justify-content: center; }

        .sb-search-zone {
          padding: 8px 14px;
          background: var(--bg-deep);
          border-bottom: 1px solid var(--border);
          position: relative;
        }

        .sb-search-box {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 7px 10px;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 6px;
          transition: border-color 0.15s;
        }
        .sb-search-box:focus-within {
          border-color: var(--accent);
        }

        .sb-search-icon { font-size: 12px; opacity: 0.5; }
        .sb-search-box input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: var(--text-primary);
          font-size: 12px;
          font-family: inherit;
        }
        .sb-search-box input::placeholder { color: var(--text-hint); }

        .sb-search-clear {
          width: 16px;
          height: 16px;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: 3px;
          color: var(--text-hint);
          cursor: pointer;
          font-size: 10px;
          padding: 0;
        }
        .sb-search-clear:hover { background: var(--bg-hover); }

        .sb-history {
          position: absolute;
          top: 100%;
          left: 14px;
          right: 14px;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 6px;
          z-index: 50;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        }

        .sb-history-title {
          padding: 6px 10px;
          font-size: 10px;
          color: var(--text-hint);
          background: var(--bg-elevated);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .sb-history-item {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 7px 10px;
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: 12px;
          cursor: pointer;
          text-align: left;
          font-family: inherit;
          transition: background 0.1s;
        }
        .sb-history-item:hover { background: var(--bg-hover); }
        .sb-history-item span:first-child { opacity: 0.5; font-size: 10px; }

        .sb-tabs {
          display: flex;
          gap: 2px;
          padding: 6px 14px;
          background: var(--bg-deep);
          border-bottom: 1px solid var(--border);
          overflow-x: auto;
        }

        .sb-tab {
          padding: 5px 10px;
          font-size: 11px;
          color: var(--text-secondary);
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 4px;
          cursor: pointer;
          white-space: nowrap;
          font-family: inherit;
          transition: all 0.12s;
        }
        .sb-tab:hover { background: var(--bg-elevated); color: var(--text-primary); }
        .sb-tab.active {
          background: var(--accent-dim);
          border-color: var(--accent);
          color: #fff;
        }

        .sb-grid-header {
          padding: 6px 14px;
          font-size: 10px;
          color: var(--text-hint);
          background: var(--bg-base);
          border-bottom: 1px solid var(--border);
        }

        .sb-grid {
          flex: 1;
          overflow-y: auto;
          padding: 6px;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(30px, 1fr));
          gap: 3px;
          align-content: start;
          background: var(--bg-deep);
        }

        .sb-grid::-webkit-scrollbar { width: 5px; }
        .sb-grid::-webkit-scrollbar-track { background: var(--bg-base); }
        .sb-grid::-webkit-scrollbar-thumb { background: var(--bg-elevated); border-radius: 3px; }

        .sb-block {
          position: relative;
          aspect-ratio: 1;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 3px;
          cursor: pointer;
          transition: all 0.1s;
        }
        .sb-block:hover { border-color: var(--border-light); transform: scale(1.1); z-index: 1; }
        .sb-block.selected { border-color: var(--accent); }

        .sb-block-img {
          position: absolute;
          inset: 0;
          border-radius: 2px;
          overflow: hidden;
        }
        .sb-block-img img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          image-rendering: pixelated;
          z-index: 1;
        }
        .sb-block-img div { position: absolute; inset: 0; }

        .sb-block-pin {
          position: absolute;
          top: 0;
          right: 0;
          font-size: 8px;
          z-index: 2;
        }

        .sb-empty {
          grid-column: 1 / -1;
          text-align: center;
          padding: 20px;
          color: var(--text-hint);
          font-size: 11px;
        }

        .sb-more {
          grid-column: 1 / -1;
          text-align: center;
          padding: 6px;
          background: var(--bg-surface);
          color: var(--text-secondary);
          font-size: 10px;
          border-radius: 4px;
          cursor: pointer;
        }
        .sb-more:hover { background: var(--bg-elevated); }

        .sb-footer {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 14px;
          background: var(--bg-base);
          border-top: 1px solid var(--border);
        }

        .sb-footer-icon {
          position: relative;
          width: 36px;
          height: 36px;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 4px;
          overflow: hidden;
          flex-shrink: 0;
        }
        .sb-footer-icon img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          image-rendering: pixelated;
          z-index: 1;
        }
        .sb-footer-icon div { position: absolute; inset: 0; }

        .sb-footer-info { flex: 1; min-width: 0; }
        .sb-footer-name {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sb-footer-meta { font-size: 9px; color: var(--text-hint); font-family: monospace; margin-top: 2px; }

        .sb-footer-btns { display: flex; gap: 4px; }
        .sb-footer-btn {
          width: 28px;
          height: 28px;
          font-size: 13px;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 4px;
          color: var(--text-hint);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.12s;
        }
        .sb-footer-btn:hover { background: var(--bg-elevated); }
        .sb-footer-btn.active { color: var(--gold); }
        .sb-footer-btn.in { color: var(--accent); }

        .sb-picker-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.75);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
        }

        .sb-picker {
          width: 260px;
          max-height: 320px;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5);
        }

        .sb-picker-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          background: var(--bg-elevated);
          font-size: 12px;
          font-weight: 600;
        }

        .sb-picker-close {
          width: 18px;
          height: 18px;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 3px;
          color: var(--text-secondary);
          cursor: pointer;
          font-size: 12px;
          padding: 0;
        }
        .sb-picker-close:hover { background: var(--bg-hover); }

        .sb-picker-search {
          padding: 8px;
          border-bottom: 1px solid var(--border);
        }
        .sb-picker-search input {
          width: 100%;
          padding: 6px 8px;
          background: var(--bg-deep);
          border: 1px solid var(--border);
          border-radius: 4px;
          color: var(--text-primary);
          font-size: 11px;
          outline: none;
          font-family: inherit;
        }
        .sb-picker-search input:focus { border-color: var(--accent); }

        .sb-picker-grid {
          flex: 1;
          overflow-y: auto;
          padding: 6px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 4px;
        }

        .sb-picker-cell {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          padding: 4px;
          background: var(--bg-deep);
          border: 1px solid var(--border);
          border-radius: 4px;
          cursor: pointer;
        }
        .sb-picker-cell:hover { background: var(--bg-hover); }

        .sb-picker-img {
          position: relative;
          width: 30px;
          height: 30px;
          background: var(--bg-surface);
          border-radius: 3px;
          overflow: hidden;
        }
        .sb-picker-img img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          image-rendering: pixelated;
          z-index: 1;
        }
        .sb-picker-img div { position: absolute; inset: 0; }
        .sb-picker-cell span { font-size: 7px; color: var(--text-hint); text-align: center; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .sb-picker-empty { grid-column: 1 / -1; text-align: center; padding: 20px; color: var(--text-hint); }

        .sb-context {
          position: fixed;
          min-width: 170px;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 6px;
          z-index: 200;
          overflow: hidden;
          box-shadow: 0 4px 16px rgba(0,0,0,0.5);
        }

        .sb-context-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          background: var(--bg-elevated);
        }
        .sb-context-icon {
          position: relative;
          width: 32px;
          height: 32px;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 4px;
          overflow: hidden;
        }
        .sb-context-icon img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          image-rendering: pixelated;
          z-index: 1;
        }
        .sb-context-icon div { position: absolute; inset: 0; }
        .sb-context-name { font-size: 12px; font-weight: 600; color: var(--text-primary); }
        .sb-context-id { font-size: 9px; color: var(--text-hint); font-family: monospace; margin-top: 2px; }

        .sb-context-sep { height: 1px; background: var(--border); margin: 2px 0; }

        .sb-context-item {
          display: block;
          width: 100%;
          padding: 8px 12px;
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: 11px;
          cursor: pointer;
          text-align: left;
          font-family: inherit;
          transition: background 0.1s;
        }
        .sb-context-item:hover { background: var(--bg-hover); }
      `}</style>
    </div>
  )
}
