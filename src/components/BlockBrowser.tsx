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
  { key: 'all', label: '全部', icon: 'grid' },
  { key: 'building', label: '建筑', icon: 'brick' },
  { key: 'natural', label: '自然', icon: 'tree' },
  { key: 'redstone', label: '红石', icon: 'circuit' },
  { key: 'decoration', label: '装饰', icon: 'flower' },
  { key: 'utility', label: '功能', icon: 'tool' },
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

type ViewMode = 'grid' | 'list'
type SortType = 'default' | 'name' | 'hardness' | 'category'
type ActiveTab = 'recent' | 'pinned' | 'palette' | BlockCategory | 'all'
type CategoryFilter = BlockCategory[]

const CategoryIcon = ({ type }: { type: string }) => {
  const icons: Record<string, JSX.Element> = {
    grid: <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><rect x="0.5" y="0.5" width="4" height="4" rx="0.5"/><rect x="5.5" y="0.5" width="4" height="4" rx="0.5"/><rect x="0.5" y="5.5" width="4" height="4" rx="0.5"/><rect x="5.5" y="5.5" width="4" height="4" rx="0.5"/></svg>,
    brick: <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><rect x="1" y="1" width="8" height="3" rx="0.5"/><rect x="1" y="5" width="4" height="4" rx="0.5"/><rect x="6" y="5" width="3" height="4" rx="0.5"/></svg>,
    tree: <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><path d="M5 1L2 5h2L2 9h6L6 5h2L5 1z"/></svg>,
    circuit: <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><circle cx="2" cy="5" r="1.5"/><circle cx="8" cy="2" r="1.5"/><circle cx="8" cy="8" r="1.5"/><path d="M3.5 5h1L5 3l2 4-1 .5 1 2-1.5.5L4 8l-1-3" stroke="currentColor" strokeWidth="0.8" fill="none"/></svg>,
    flower: <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><circle cx="5" cy="5" r="1.5"/><ellipse cx="5" cy="2" rx="1" ry="1.5"/><ellipse cx="5" cy="8" rx="1" ry="1.5"/><ellipse cx="2" cy="5" rx="1.5" ry="1"/><ellipse cx="8" cy="5" rx="1.5" ry="1"/></svg>,
    tool: <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><path d="M7 1l2 2-5 5-2-2 5-5zM3 5l-1.5 1.5L3 8l1.5-1.5L3 5z"/></svg>,
  }
  return icons[type] || icons.grid
}

export function BlockBrowser() {
  const { selectedBlock, setSelectedBlock } = useSceneStore()
  const [activeTab, setActiveTab] = useState<ActiveTab>('all')
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
  const [contextMenu, setContextMenu] = useState<{ show: boolean; x: number; y: number; block: BlockData | null }>({ show: false, x: 0, y: 0, block: null })
  const [showHelp, setShowHelp] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [draggedSlot, setDraggedSlot] = useState<number | null>(null)
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [hoveredBlock, setHoveredBlock] = useState<BlockData | null>(null)
  const [sortType, setSortType] = useState<SortType>('default')
  const [showSortMenu, setShowSortMenu] = useState(false)
  const [categoryFilters, setCategoryFilters] = useState<CategoryFilter>([])
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [previewBlock, setPreviewBlock] = useState<BlockData | null>(null)
  const [previewPos, setPreviewPos] = useState({ x: 0, y: 0 })
  const [searchHighlight, setSearchHighlight] = useState<{ query: string; matchedBlock: BlockData | null }>({ query: '', matchedBlock: null })
  const [selectedBlocks, setSelectedBlocks] = useState<Set<string>>(new Set())
  const [batchMode, setBatchMode] = useState(false)
  const previewTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pickerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const historyRef = useRef<HTMLDivElement>(null)
  const focusIndexRef = useRef(-1)

  const filteredBlocks = useMemo(() => {
    let blocks: BlockData[]
    if (searchQuery.trim()) {
      blocks = searchBlocks(searchQuery)
    } else if (activeTab === 'recent') {
      return recent
    } else if (activeTab === 'pinned') {
      return pinned.map(id => BLOCKS.find(b => b.id === id)).filter((b): b is BlockData => !!b)
    } else if (activeTab === 'palette') {
      return palette.map(id => BLOCKS.find(b => b.id === id)).filter((b): b is BlockData => !!b)
    } else if (activeTab === 'all') {
      blocks = BLOCKS
    } else {
      blocks = getBlocksByCategory(activeTab)
    }
    if (categoryFilters.length > 0) {
      blocks = blocks.filter(b => categoryFilters.includes(b.category))
    }
    return blocks
  }, [activeTab, searchQuery, recent, pinned, palette, categoryFilters])

  const sortedBlocks = useMemo(() => {
    if (['recent', 'pinned', 'palette', 'all'].includes(activeTab) && !searchQuery.trim()) {
      const blocks = activeTab === 'all' ? BLOCKS : filteredBlocks
      switch (sortType) {
        case 'name':
          return [...blocks].sort((a, b) => a.nameZh.localeCompare(b.nameZh, 'zh-CN'))
        case 'hardness':
          return [...blocks].sort((a, b) => b.hardness - a.hardness)
        case 'category':
          return [...blocks].sort((a, b) => {
            const catOrder: Record<string, number> = { building: 0, natural: 1, decoration: 2, redstone: 3, utility: 4 }
            return (catOrder[a.category] || 99) - (catOrder[b.category] || 99)
          })
        default:
          return blocks
      }
    }
    return filteredBlocks
  }, [filteredBlocks, sortType, activeTab, searchQuery])

  const displayedBlocks = useMemo(() => {
    if (searchQuery.trim() || ['recent', 'pinned', 'palette'].includes(activeTab)) return sortedBlocks
    return sortedBlocks.slice(0, (page + 1) * PAGE_SIZE)
  }, [sortedBlocks, page, searchQuery, activeTab])

  const loadProgress = useMemo(() => {
    if (searchQuery.trim() || ['recent', 'pinned', 'palette'].includes(activeTab)) return 100
    return Math.min(100, Math.round((displayedBlocks.length / filteredBlocks.length) * 100))
  }, [filteredBlocks.length, displayedBlocks.length, searchQuery, activeTab])

  const hasMore = useMemo(() => {
    if (searchQuery.trim() || ['recent', 'pinned', 'palette'].includes(activeTab)) return false
    return filteredBlocks.length > displayedBlocks.length
  }, [filteredBlocks.length, displayedBlocks.length, searchQuery, activeTab])

  useEffect(() => { setPage(0); focusIndexRef.current = -1 }, [activeTab, searchQuery, sortType, categoryFilters])

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
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault()
        if (batchMode) { selectAllVisible() }
        else { setBatchMode(true); selectAllVisible() }
        return
      }
      if (e.key === '/') { e.preventDefault(); searchInputRef.current?.focus(); return }
      if (e.key === '?') { e.preventDefault(); setShowHelp(h => !h); return }
      if (e.key === 'b' || e.key === 'B') { e.preventDefault(); searchInputRef.current?.focus(); return }
      if (e.key === 'v' || e.key === 'V') { setViewMode(v => v === 'grid' ? 'list' : 'grid'); return }
      if (e.key === 'r' || e.key === 'R') {
        const sortOrder: SortType[] = ['default', 'name', 'hardness', 'category']
        const currentIdx = sortOrder.indexOf(sortType)
        setSortType(sortOrder[(currentIdx + 1) % sortOrder.length])
        return
      }
      const num = parseInt(e.key)
      if (num >= 1 && num <= 9 && favorites[num - 1]) setSelectedBlock(favorites[num - 1])
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        const cols = viewMode === 'grid' ? Math.floor(gridRef.current?.clientWidth! / 36) : 1
        const newIdx = focusIndexRef.current + (e.key === 'ArrowDown' ? cols : -cols)
        if (newIdx >= 0 && newIdx < displayedBlocks.length) {
          focusIndexRef.current = newIdx
          setSelectedBlock(displayedBlocks[newIdx])
          const item = gridRef.current?.children[newIdx] as HTMLElement
          item?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
        }
      }
      if (e.key === 'Home') {
        e.preventDefault()
        if (displayedBlocks.length > 0) {
          focusIndexRef.current = 0
          setSelectedBlock(displayedBlocks[0])
          gridRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
        }
      }
      if (e.key === 'End') {
        e.preventDefault()
        if (displayedBlocks.length > 0) {
          focusIndexRef.current = displayedBlocks.length - 1
          setSelectedBlock(displayedBlocks[displayedBlocks.length - 1])
          gridRef.current?.scrollTo({ top: gridRef.current.scrollHeight, behavior: 'smooth' })
        }
      }
      if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        if (batchMode) {
          selectAllVisible()
        } else {
          setBatchMode(true)
          selectAllVisible()
        }
        return
      }
      if (e.key === 'Escape') {
        if (batchMode) { clearSelection(); return }
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedBlock && !showPicker) {
          const idx = favorites.findIndex(f => f.id === selectedBlock.id)
          if (idx >= 0) {
            e.preventDefault()
            const newFavs = [...favorites]
            newFavs.splice(idx, 1)
            newFavs.push(BLOCKS[0])
            setFavorites(newFavs)
            try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavs.map(b => b.id))) } catch {}
          }
        }
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [favorites, setSelectedBlock, displayedBlocks, viewMode])

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
      if (historyRef.current && !historyRef.current.contains(e.target as Node)) setShowHistory(false)
      setShowSortMenu(false)
      setShowFilterMenu(false)
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
    focusIndexRef.current = displayedBlocks.indexOf(block)
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

  const handleBlockDragStart = (e: React.DragEvent, block: BlockData) => {
    if (showPicker !== null) return
    e.dataTransfer.setData('text/plain', block.id)
    e.dataTransfer.effectAllowed = 'copy'
  }

  const handleQuickbarDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setDragOverSlot(idx)
  }

  const handleQuickbarDrop = (e: React.DragEvent, idx: number) => {
    e.preventDefault()
    const blockId = e.dataTransfer.getData('text/plain')
    const block = BLOCKS.find(b => b.id === blockId)
    if (block) {
      const existing = favorites.findIndex(f => f.id === block.id)
      let newFavs: BlockData[]
      if (existing >= 0 && existing !== idx) {
        newFavs = [...favorites]
        const [removed] = newFavs.splice(existing, 1)
        newFavs.splice(idx, 0, removed)
      } else if (existing === -1) {
        newFavs = [...favorites]
        newFavs[idx] = block
      } else {
        newFavs = favorites
      }
      setFavorites(newFavs)
      try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavs.map(b => b.id))) } catch {}
    }
    setDraggedSlot(null)
    setDragOverSlot(null)
  }

  const handleQuickbarDragLeave = () => {
    setDragOverSlot(null)
  }

  const toggleCategoryFilter = (cat: BlockCategory) => {
    setCategoryFilters(prev => {
      if (prev.includes(cat)) {
        return prev.filter(c => c !== cat)
      }
      return [...prev, cat]
    })
  }

  const clearCategoryFilters = () => setCategoryFilters([])
  const selectAllFilters = () => setCategoryFilters(['building', 'natural', 'decoration', 'redstone', 'utility'])

  const clearPreviewTimeout = () => {
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current)
      previewTimeoutRef.current = null
    }
  }

  const handleMouseEnterPreview = (block: BlockData, e: React.MouseEvent) => {
    clearPreviewTimeout()
    previewTimeoutRef.current = setTimeout(() => {
      setPreviewBlock(block)
      setPreviewPos({ x: e.clientX, y: e.clientY })
    }, 400)
  }

  const handleMouseLeavePreview = () => {
    clearPreviewTimeout()
    setPreviewBlock(null)
  }

  const handleMouseMovePreview = (e: React.MouseEvent) => {
    if (previewBlock) {
      setPreviewPos({ x: e.clientX, y: e.clientY })
    }
  }

  const fuzzyMatch = (text: string, query: string): boolean => {
    const lowerText = text.toLowerCase()
    const lowerQuery = query.toLowerCase()
    if (lowerText.includes(lowerQuery)) return true
    let qi = 0
    for (let i = 0; i < lowerText.length && qi < lowerQuery.length; i++) {
      if (lowerText[i] === lowerQuery[qi]) qi++
    }
    return qi === lowerQuery.length
  }

  const getHighlightedText = (text: string, query: string) => {
    if (!query) return text
    const lowerText = text.toLowerCase()
    const lowerQuery = query.toLowerCase()
    const idx = lowerText.indexOf(lowerQuery)
    if (idx === -1) return text
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bp-highlight">{text.slice(idx, idx + query.length)}</mark>
        {text.slice(idx + query.length)}
      </>
    )
  }

  const toggleBlockSelection = (block: BlockData, e?: React.MouseEvent) => {
    if (!batchMode) {
      setSelectedBlock(block)
      return
    }
    setSelectedBlocks(prev => {
      const newSet = new Set(prev)
      if (e?.shiftKey && prev.size > 0) {
        const lastSelected = Array.from(prev).pop()!
        const blocks = displayedBlocks
        const lastIdx = blocks.findIndex(b => b.id === lastSelected)
        const currentIdx = blocks.findIndex(b => b.id === block.id)
        const [start, end] = [Math.min(lastIdx, currentIdx), Math.max(lastIdx, currentIdx)]
        for (let i = start; i <= end; i++) {
          newSet.add(blocks[i].id)
        }
      } else if (e?.ctrlKey || e?.metaKey) {
        if (newSet.has(block.id)) newSet.delete(block.id)
        else newSet.add(block.id)
      } else {
        if (newSet.has(block.id) && newSet.size === 1) {
          setBatchMode(false)
          return new Set()
        }
        return new Set([block.id])
      }
      return newSet
    })
  }

  const selectAllVisible = () => {
    setSelectedBlocks(new Set(displayedBlocks.map(b => b.id)))
    setBatchMode(true)
  }

  const clearSelection = () => {
    setSelectedBlocks(new Set())
    setBatchMode(false)
  }

  const handleBatchPin = () => {
    const newPinned = [...new Set([...pinned, ...Array.from(selectedBlocks)])].slice(0, 18)
    setPinned(newPinned)
    clearSelection()
  }

  const handleBatchAddToQuickbar = () => {
    const blocks = Array.from(selectedBlocks).map(id => BLOCKS.find(b => b.id === id)).filter((b): b is BlockData => !!b)
    let newFavs = [...favorites]
    for (const block of blocks) {
      const existingIdx = newFavs.findIndex(f => f.id === block.id)
      if (existingIdx === -1) {
        newFavs = [...newFavs.slice(1), block]
      }
    }
    setFavorites(newFavs)
    clearSelection()
  }

  const handleBatchCopyIds = () => {
    const ids = Array.from(selectedBlocks).map(id => id.replace('minecraft:', '')).join(', ')
    navigator.clipboard.writeText(ids)
    clearSelection()
  }

  const pickerBlocks = useMemo(() => {
    if (pickerSearch.trim()) return searchBlocks(pickerSearch).slice(0, 80)
    return BLOCKS.slice(0, 80)
  }, [pickerSearch])

  const isPinned = (id: string) => pinned.includes(id)
  const isInQuickbar = (id: string) => favorites.some(f => f.id === id)
  const isInPalette = (id: string) => palette.includes(id)

  const tabLabel = activeTab === 'recent' ? '最近' :
    activeTab === 'pinned' ? '收藏' :
    activeTab === 'palette' ? '调色板' :
    CATEGORIES.find(c => c.key === activeTab)?.label || ''

  const getTexture = (block: BlockData) => {
    if (failedTextures.has(block.id)) {
      return <div className="bp-fallback" style={{ background: `linear-gradient(135deg, ${block.color} 0%, ${block.color}cc 100%)` }} />
    }
    return <img src={getMCTextureURL(block.id)} alt="" loading="lazy" onError={() => handleTextureError(block.id)} />
  }

  return (
    <div className="bp-root">
      <div className="bp-header">
        <div className="bp-title">
          <span className="bp-icon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="1" width="14" height="14" rx="2" fill="#3b3b3b" stroke="#1a1a1a" strokeWidth="1"/>
              <rect x="3" y="3" width="4" height="4" fill="#5a8f3e"/>
              <rect x="9" y="3" width="4" height="4" fill="#8b7355"/>
              <rect x="3" y="9" width="4" height="4" fill="#8b7355"/>
              <rect x="9" y="9" width="4" height="4" fill="#5a8f3e"/>
            </svg>
          </span>
          <span className="bp-name">方块选择</span>
          <span className="bp-badge">{BLOCKS.length}</span>
        </div>
        <div className="bp-header-actions">
          <button
            className={`bp-icon-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="网格视图 (V)"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <rect x="0.5" y="0.5" width="4" height="4" rx="0.5"/>
              <rect x="6.5" y="0.5" width="4" height="4" rx="0.5"/>
              <rect x="0.5" y="6.5" width="4" height="4" rx="0.5"/>
              <rect x="6.5" y="6.5" width="4" height="4" rx="0.5"/>
            </svg>
          </button>
          <button
            className={`bp-icon-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="列表视图 (V)"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <rect x="0.5" y="1" width="10" height="2" rx="0.5"/>
              <rect x="0.5" y="5" width="10" height="2" rx="0.5"/>
              <rect x="0.5" y="9" width="10" height="2" rx="0.5"/>
            </svg>
          </button>
          <button className="bp-icon-btn" onClick={() => setShowHelp(h => !h)} title="快捷键 (?)">?</button>
          <button className="bp-icon-btn" onClick={() => setShowSortMenu(!showSortMenu)} title="排序" data-active={sortType !== 'default'}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <path d="M2 3h8M3 6h6M4 9h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
          <button className="bp-icon-btn" onClick={() => setShowFilterMenu(!showFilterMenu)} title="筛选分类" data-active={categoryFilters.length > 0}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <path d="M1 3h10M2 6h8M3 9h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="3" cy="3" r="1.5" fill="currentColor"/>
              <circle cx="6" cy="6" r="1.5" fill="currentColor"/>
              <circle cx="9" cy="9" r="1.5" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </div>

      {showSortMenu && (
         <div className="bp-sort-menu">
           <button className={sortType === 'default' ? 'active' : ''} onClick={() => { setSortType('default'); setShowSortMenu(false) }}>
             <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><rect x="1" y="1" width="8" height="8" rx="1" fill="none" stroke="currentColor"/></svg>
             默认排序
           </button>
           <button className={sortType === 'name' ? 'active' : ''} onClick={() => { setSortType('name'); setShowSortMenu(false) }}>
             <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><text x="2" y="8" fontSize="7" fontWeight="bold">A</text></svg>
             按名称排序
           </button>
           <button className={sortType === 'hardness' ? 'active' : ''} onClick={() => { setSortType('hardness'); setShowSortMenu(false) }}>
             <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><path d="M2 8L5 2l3 6H2z"/></svg>
             按硬度排序
           </button>
           <button className={sortType === 'category' ? 'active' : ''} onClick={() => { setSortType('category'); setShowSortMenu(false) }}>
             <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><rect x="0.5" y="0.5" width="4" height="4" rx="0.5"/><rect x="5.5" y="0.5" width="4" height="4" rx="0.5"/><rect x="0.5" y="5.5" width="4" height="4" rx="0.5"/><rect x="5.5" y="5.5" width="4" height="4" rx="0.5"/></svg>
             按分类排序
           </button>
         </div>
       )}

      {showFilterMenu && (
        <div className="bp-sort-menu">
          <div className="bp-filter-header">
            <span>筛选分类</span>
            <div className="bp-filter-actions">
              <button onClick={selectAllFilters}>全选</button>
              <button onClick={clearCategoryFilters}>清除</button>
            </div>
          </div>
          {(['building', 'natural', 'decoration', 'redstone', 'utility'] as BlockCategory[]).map(cat => (
            <button
              key={cat}
              className={categoryFilters.includes(cat) ? 'active' : ''}
              onClick={() => toggleCategoryFilter(cat)}
            >
              <CategoryIcon type={CATEGORIES.find(c => c.key === cat)?.icon || 'grid'} />
              {CATEGORIES.find(c => c.key === cat)?.label}
              <span className="bp-filter-count">{BLOCKS.filter(b => b.category === cat).length}</span>
            </button>
          ))}
        </div>
      )}

      {showHelp && (
        <div className="bp-help">
          <div className="bp-help-title">快捷键</div>
          <div className="bp-help-row"><kbd>1-9</kbd><span>快捷栏选择</span></div>
          <div className="bp-help-row"><kbd>/</kbd><kbd>B</kbd><span>聚焦搜索</span></div>
          <div className="bp-help-row"><kbd>↑</kbd><kbd>↓</kbd><span>导航方块</span></div>
          <div className="bp-help-row"><kbd>Home</kbd><kbd>End</kbd><span>首/末方块</span></div>
          <div className="bp-help-row"><kbd>V</kbd><span>切换视图</span></div>
          <div className="bp-help-row"><kbd>R</kbd><span>切换排序</span></div>
          <div className="bp-help-row"><kbd>Del</kbd><span>移除快捷栏</span></div>
          <div className="bp-help-row"><kbd>Esc</kbd><span>关闭弹窗</span></div>
          <div className="bp-help-row"><kbd>双击</kbd><span>添加调色板</span></div>
          <div className="bp-help-row"><kbd>拖拽</kbd><span>添加到快捷栏</span></div>
          <div className="bp-help-row"><kbd>右键</kbd><span>操作菜单</span></div>
        </div>
      )}

      <div className="bp-toolbar">
        <div className="bp-search">
          <svg className="bp-search-icon" width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <path d="M10 6.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Zm-.691 3.516a4.5 4.5 0 1 1 .707-.707l2.838 2.838a.5.5 0 0 1-.707.707l-2.838-2.838Z"/>
          </svg>
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
          {searchQuery && (
            <button className="bp-search-clear" onClick={() => setSearchQuery('')}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>
        {showHistory && searchHistory.length > 0 && !searchQuery && (
          <div className="bp-history" ref={historyRef}>
            <div className="bp-history-title">搜索历史</div>
            {searchHistory.map((h, i) => (
              <button key={i} className="bp-history-item" onClick={() => handleHistoryClick(h)}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" opacity="0.5">
                  <circle cx="5" cy="5" r="4" fill="none" stroke="currentColor" strokeWidth="1"/>
                  <path d="M5 2v3l2 1" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                </svg>
                <span>{h}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {batchMode && selectedBlocks.size > 0 && (
        <div className="bp-batch-bar">
          <div className="bp-batch-info">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <rect x="1" y="1" width="4" height="4" rx="1"/>
              <rect x="7" y="1" width="4" height="4" rx="1"/>
              <rect x="1" y="7" width="4" height="4" rx="1"/>
              <rect x="7" y="7" width="4" height="4" rx="1"/>
            </svg>
            已选择 <strong>{selectedBlocks.size}</strong> 个方块
          </div>
          <div className="bp-batch-actions">
            <button onClick={selectAllVisible}>全选可见</button>
            <button onClick={handleBatchPin}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                <path d="M5 1l1.2 2.4 2.6.4-1.9 1.8.5 2.6L5 6.5 2.6 8.2l.5-2.6L1.2 3.8l2.6-.4L5 1z"/>
              </svg>
              批量收藏
            </button>
            <button onClick={handleBatchAddToQuickbar}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                <rect x="1" y="1" width="8" height="8" rx="1" fill="none" stroke="currentColor"/>
                <rect x="3" y="3" width="4" height="4" fill="currentColor"/>
              </svg>
              添加快捷栏
            </button>
            <button onClick={handleBatchCopyIds}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                <rect x="3" y="1" width="6" height="7" rx="1" fill="none" stroke="currentColor"/>
                <rect x="1" y="3" width="6" height="7" rx="1" fill="var(--bg-2)" stroke="currentColor"/>
              </svg>
              复制ID
            </button>
            <button onClick={clearSelection}>取消</button>
          </div>
        </div>
      )}

      <div className="bp-tabs">
        <button className={`bp-tab ${activeTab === 'recent' ? 'active' : ''}`} onClick={() => setActiveTab('recent')}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
            <circle cx="5" cy="5" r="4" fill="none" stroke="currentColor" strokeWidth="1"/>
            <path d="M5 2v3l1.5 1" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
          </svg>
          最近 <span className="bp-tab-count">{recent.length}</span>
        </button>
        <button className={`bp-tab ${activeTab === 'pinned' ? 'active' : ''}`} onClick={() => setActiveTab('pinned')}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
            <path d="M5 1l1.2 2.4 2.6.4-1.9 1.8.5 2.6L5 6.5 2.6 8.2l.5-2.6L1.2 3.8l2.6-.4L5 1z"/>
          </svg>
          收藏 <span className="bp-tab-count">{pinned.length}</span>
        </button>
        <button className={`bp-tab ${activeTab === 'palette' ? 'active' : ''}`} onClick={() => setActiveTab('palette')}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
            <circle cx="3" cy="3" r="2"/>
            <circle cx="7" cy="3" r="2"/>
            <circle cx="5" cy="7" r="2"/>
          </svg>
          调色板 <span className="bp-tab-count">{palette.length}</span>
        </button>
        <div className="bp-tab-sep" />
        {CATEGORIES.map(cat => (
          <button
            key={cat.key}
            className={`bp-tab ${activeTab === cat.key ? 'active' : ''}`}
            onClick={() => setActiveTab(cat.key)}
          >
            <CategoryIcon type={cat.icon} />
            {cat.label}
          </button>
        ))}
      </div>

      <div className="bp-quickbar">
        {favorites.map((block, idx) => {
          const isActive = selectedBlock?.id === block.id
          return (
            <div
              key={block.id}
              className={`bp-slot ${isActive ? 'active' : ''} ${dragOverSlot === idx ? 'drop' : ''}`}
              draggable
              onDragStart={e => handleDragStart(e, idx)}
              onDragOver={e => handleQuickbarDragOver(e, idx)}
              onDragEnd={handleDragEnd}
              onDrop={e => handleQuickbarDrop(e, idx)}
              onDragLeave={handleQuickbarDragLeave}
              onClick={() => handleSlotClick(block)}
              onContextMenu={e => handleSlotRightClick(e, idx)}
              onMouseEnter={e => handleMouseEnterPreview(block, e)}
              onMouseLeave={handleMouseLeavePreview}
              title={`${block.nameZh} [${idx + 1}]`}
            >
              <span className="bp-slot-num">{idx + 1}</span>
              <div className="bp-slot-img">
                {getTexture(block)}
              </div>
              {isPinned(block.id) && (
                <span className="bp-slot-pin">
                  <svg width="8" height="8" viewBox="0 0 10 10" fill="#f5c842">
                    <path d="M5 1l1.2 2.4 2.6.4-1.9 1.8.5 2.6L5 6.5 2.6 8.2l.5-2.6L1.2 3.8l2.6-.4L5 1z"/>
                  </svg>
                </span>
              )}
            </div>
          )
        })}
      </div>

      <div className="bp-status">
        <span className="bp-status-label">
          {searchQuery ? (
            <>
              <svg width="10" height="10" viewBox="0 0 14 14" fill="currentColor" style={{marginRight: 4}}>
                <path d="M10 6.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Zm-.691 3.516a4.5 4.5 0 1 1 .707-.707l2.838 2.838a.5.5 0 0 1-.707.707l-2.838-2.838Z"/>
              </svg>
              "{searchQuery}"
            </>
          ) : tabLabel}
        </span>
        <span className="bp-status-count">{sortedBlocks.length} 方块</span>
        {sortType !== 'default' && !searchQuery && (
          <span className="bp-sort-badge">
            <svg width="8" height="8" viewBox="0 0 12 12" fill="currentColor">
              <path d="M2 3h8M3 6h6M4 9h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {sortType === 'name' ? '名称' : sortType === 'hardness' ? '硬度' : '分类'}
          </span>
        )}
        {categoryFilters.length > 0 && (
          <span className="bp-sort-badge">
            <svg width="8" height="8" viewBox="0 0 12 12" fill="currentColor">
              <circle cx="3" cy="3" r="1.5"/>
              <circle cx="6" cy="6" r="1.5"/>
              <circle cx="9" cy="9" r="1.5"/>
            </svg>
            {categoryFilters.length}类
          </span>
        )}
        {hasMore && (
          <div className="bp-progress">
            <div className="bp-progress-bar" style={{ width: `${loadProgress}%` }} />
          </div>
        )}
      </div>

      <div className={`bp-grid ${viewMode}`} ref={gridRef} onMouseMove={handleMouseMovePreview}>
        {displayedBlocks.map((block, idx) => (
          <div
            key={block.id}
            className={`bp-item ${selectedBlock?.id === block.id ? 'selected' : ''} ${focusIndexRef.current === idx ? 'focused' : ''} ${searchQuery && (block.nameZh.toLowerCase().includes(searchQuery.toLowerCase()) || block.id.includes(searchQuery.toLowerCase())) ? 'matched' : ''} ${selectedBlocks.has(block.id) ? 'batch-selected' : ''}`}
            onClick={e => toggleBlockSelection(block, e)}
            onDoubleClick={() => handleBlockDoubleClick(block)}
            onContextMenu={e => handleBlockRightClick(e, block)}
            onMouseEnter={e => handleMouseEnterPreview(block, e)}
            onMouseLeave={handleMouseLeavePreview}
            draggable
            onDragStart={e => handleBlockDragStart(e, block)}
            onDragEnd={() => { setDraggedSlot(null); handleMouseLeavePreview() }}
          >
            <div className="bp-item-img">
              {getTexture(block)}
            </div>
            {viewMode === 'list' && (
              <div className="bp-item-info">
                <span className="bp-item-name">{block.nameZh}</span>
                <span className="bp-item-id">{block.id.replace('minecraft:', '')}</span>
              </div>
            )}
            {isPinned(block.id) && (
              <span className="bp-item-pin">
                <svg width="8" height="8" viewBox="0 0 10 10" fill="#f5c842">
                  <path d="M5 1l1.2 2.4 2.6.4-1.9 1.8.5 2.6L5 6.5 2.6 8.2l.5-2.6L1.2 3.8l2.6-.4L5 1z"/>
                </svg>
              </span>
            )}
          </div>
        ))}
        {filteredBlocks.length === 0 && (
          <div className="bp-empty">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
              <path d="M8 11h6"/>
            </svg>
            <span>未找到方块</span>
          </div>
        )}
        {hasMore && (
          <div className="bp-more" onClick={() => setPage(p => p + 1)}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" style={{marginRight: 4}}>
              <path d="M6 1v10M1 6h10"/>
            </svg>
            加载更多 (+{filteredBlocks.length - displayedBlocks.length})
          </div>
        )}
      </div>

      {previewBlock && (
        <div
          className="bp-preview"
          style={{
            left: Math.min(previewPos.x + 16, window.innerWidth - 240),
            top: Math.min(previewPos.y + 16, window.innerHeight - 200)
          }}
        >
          <div className="bp-preview-img">
            {getTexture(previewBlock)}
          </div>
          <div className="bp-preview-info">
            <div className="bp-preview-name">{getHighlightedText(previewBlock.nameZh, searchQuery)}</div>
            <div className="bp-preview-id">{previewBlock.id.replace('minecraft:', '')}</div>
            <div className="bp-preview-meta">
              <span className={`bp-preview-cat bp-cat-${previewBlock.category}`}>
                {CATEGORIES.find(c => c.key === previewBlock.category)?.label || previewBlock.category}
              </span>
              <span>硬度 {previewBlock.hardness}</span>
            </div>
            {searchQuery && (
              <div className="bp-preview-hint">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><path d="M2 5l2 2 4-4" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg>
                匹配搜索结果
              </div>
            )}
          </div>
        </div>
      )}

      {showPicker !== null && (
        <div className="bp-picker-overlay" onClick={() => { setShowPicker(null); setPickerSearch('') }}>
          <div className="bp-picker" ref={pickerRef} onClick={e => e.stopPropagation()}>
            <div className="bp-picker-header">
              <span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" style={{marginRight: 6}}>
                  <rect x="1" y="1" width="10" height="10" rx="1" fill="none" stroke="currentColor" strokeWidth="1"/>
                  <rect x="3" y="3" width="6" height="6" fill="currentColor"/>
                </svg>
                替换格子 {showPicker + 1}
              </span>
              <button onClick={() => { setShowPicker(null); setPickerSearch('') }}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                  <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="bp-picker-search">
              <input type="text" placeholder="搜索方块..." value={pickerSearch} onChange={e => setPickerSearch(e.target.value)} autoFocus />
            </div>
            <div className="bp-picker-grid">
              {pickerBlocks.map(block => (
                <div key={block.id} className="bp-picker-item" onClick={() => handlePickBlock(block)}>
                  <div className="bp-picker-img">
                    {getTexture(block)}
                  </div>
                  <span>{block.nameZh}</span>
                </div>
              ))}
              {pickerBlocks.length === 0 && <div className="bp-picker-empty">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="M21 21l-4.35-4.35"/>
                </svg>
                <span>无匹配结果</span>
              </div>}
            </div>
          </div>
        </div>
      )}

      {contextMenu.show && contextMenu.block && (
        <div className="bp-context" style={{ left: contextMenu.x, top: contextMenu.y }} onClick={e => e.stopPropagation()}>
          <div className="bp-context-header">
            <div className="bp-context-icon">
              {getTexture(contextMenu.block)}
            </div>
            <div>
              <div className="bp-context-name">{contextMenu.block.nameZh}</div>
              <div className="bp-context-id">{contextMenu.block.id.replace('minecraft:', '')}</div>
            </div>
          </div>
          <div className="bp-context-sep" />
          <button onClick={() => { if (contextMenu.block) { setSelectedBlock(contextMenu.block); setContextMenu({ show: false, x: 0, y: 0, block: null }) } }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" style={{marginRight: 6}}>
              <path d="M2 5l2 2 4-4" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            </svg>
            选择此方块
          </button>
          <button onClick={() => { if (contextMenu.block) { handleAddToPalette(contextMenu.block); setContextMenu({ show: false, x: 0, y: 0, block: null }) } }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" style={{marginRight: 6}}>
              <circle cx="3" cy="3" r="2"/>
              <circle cx="7" cy="3" r="2"/>
              <circle cx="5" cy="7" r="2"/>
            </svg>
            {isInPalette(contextMenu.block.id) ? '✓ 已在调色板' : '+ 添加到调色板'}
          </button>
          <button onClick={() => { if (contextMenu.block) { handleAddToQuickbar(contextMenu.block); setContextMenu({ show: false, x: 0, y: 0, block: null }) } }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" style={{marginRight: 6}}>
              <rect x="1" y="1" width="8" height="8" rx="1" fill="none" stroke="currentColor"/>
              <rect x="3" y="3" width="4" height="4" fill="currentColor"/>
            </svg>
            {isInQuickbar(contextMenu.block.id) ? '✓ 已在快捷栏' : '+ 添加到快捷栏'}
          </button>
          <button onClick={() => { if (contextMenu.block) { handleTogglePin(contextMenu.block); setContextMenu({ show: false, x: 0, y: 0, block: null }) } }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" style={{marginRight: 6}}>
              <path d="M5 1l1.2 2.4 2.6.4-1.9 1.8.5 2.6L5 6.5 2.6 8.2l.5-2.6L1.2 3.8l2.6-.4L5 1z"/>
            </svg>
            {isPinned(contextMenu.block.id) ? '★ 取消收藏' : '☆ 收藏'}
          </button>
          <div className="bp-context-sep" />
          <button onClick={() => { if (contextMenu.block) { handleCopyId(contextMenu.block.id); setContextMenu({ show: false, x: 0, y: 0, block: null }) } }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" style={{marginRight: 6}}>
              <rect x="3" y="1" width="6" height="7" rx="1" fill="none" stroke="currentColor"/>
              <rect x="1" y="3" width="6" height="7" rx="1" fill="var(--bg-3)" stroke="currentColor"/>
            </svg>
            {copiedId === contextMenu.block.id ? '✓ 已复制' : '📋 复制 ID'}
          </button>
        </div>
      )}

      {selectedBlock && !previewBlock && (
        <div className="bp-footer">
          <div className="bp-footer-icon">
            {getTexture(selectedBlock)}
          </div>
          <div className="bp-footer-info">
            <div className="bp-footer-name">{selectedBlock.nameZh}</div>
            <div className="bp-footer-meta">{selectedBlock.id.replace('minecraft:', '')} · 硬度 {selectedBlock.hardness}</div>
          </div>
          <div className="bp-footer-actions">
            <button
              className={`bp-action ${isPinned(selectedBlock.id) ? 'active' : ''}`}
              onClick={() => handleTogglePin()}
              title={isPinned(selectedBlock.id) ? '取消收藏' : '收藏'}
            >
              {isPinned(selectedBlock.id) ? '★' : '☆'}
            </button>
            <button
              className={`bp-action ${isInPalette(selectedBlock.id) ? 'active' : ''}`}
              onClick={() => handleAddToPalette()}
              title={isInPalette(selectedBlock.id) ? '已在调色板' : '添加到调色板'}
            >
              <svg width="14" height="14" viewBox="0 0 10 10" fill="currentColor">
                <circle cx="3" cy="3" r="2"/>
                <circle cx="7" cy="3" r="2"/>
                <circle cx="5" cy="7" r="2"/>
              </svg>
            </button>
            <button
              className={`bp-action ${isInQuickbar(selectedBlock.id) ? 'active' : ''}`}
              onClick={() => handleAddToQuickbar()}
              title={isInQuickbar(selectedBlock.id) ? '已在快捷栏' : '添加到快捷栏'}
            >
              <svg width="14" height="14" viewBox="0 0 10 10" fill="currentColor">
                <rect x="1" y="1" width="8" height="8" rx="1" fill="none" stroke="currentColor"/>
                <rect x="3" y="3" width="4" height="4" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      <style>{`
        .bp-root {
          --mc-black: #0d0d0d;
          --mc-dark: #191919;
          --mc-gray: #363636;
          --mc-light: #8b8b8b;
          --mc-white: #ffffff;
          --mc-blue: #6388d4;
          --mc-gold: #f5c842;
          --bg-0: #0a0a0a;
          --bg-1: #141414;
          --bg-2: #1e1e1e;
          --bg-3: #2a2a2a;
          --bg-4: #383838;
          --border: #333333;
          --border-light: #444444;
          --text-1: #e8e8e8;
          --text-2: #a0a0a0;
          --text-3: #666666;
          --accent: #4a8fd4;
          --accent-dim: #2d5a8a;
          --gold: #f5c842;

          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--mc-black);
          color: var(--text-1);
          font-family: 'Minecraft', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          user-select: none;
          position: relative;
          font-size: 12px;
          image-rendering: pixelated;
        }

        .bp-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          background: linear-gradient(180deg, var(--mc-dark) 0%, var(--bg-1) 100%);
          border-bottom: 1px solid var(--border);
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }

        .bp-title { display: flex; align-items: center; gap: 10px; }
        .bp-icon { display: flex; align-items: center; }
        .bp-name { font-size: 13px; font-weight: 600; letter-spacing: 0.5px; }
        .bp-badge {
          font-size: 9px;
          padding: 2px 7px;
          background: var(--bg-3);
          border: 1px solid var(--border);
          border-radius: 10px;
          color: var(--text-3);
          font-family: monospace;
        }

        .bp-header-actions { display: flex; gap: 6px; }
        .bp-icon-btn {
          width: 26px;
          height: 26px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-2);
          border: 1px solid var(--border);
          border-radius: 4px;
          color: var(--text-3);
          cursor: pointer;
          font-size: 11px;
          transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .bp-icon-btn:hover { background: var(--bg-3); color: var(--text-2); transform: translateY(-1px); }
        .bp-icon-btn.active { background: var(--accent-dim); border-color: var(--accent); color: #fff; box-shadow: 0 0 8px rgba(74, 143, 212, 0.3); }
        .bp-icon-btn[data-active="true"] { color: var(--mc-gold); }

        .bp-sort-menu {
          position: absolute;
          top: 100%;
          right: 14px;
          margin-top: 4px;
          background: var(--mc-dark);
          border: 1px solid var(--border);
          border-radius: 6px;
          z-index: 60;
          overflow: hidden;
          box-shadow: 0 8px 24px rgba(0,0,0,0.5);
          min-width: 140px;
        }
        .bp-sort-menu button {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 8px 12px;
          background: transparent;
          border: none;
          color: var(--text-1);
          font-size: 11px;
          cursor: pointer;
          text-align: left;
          font-family: inherit;
          transition: background 0.1s;
        }
        .bp-sort-menu button:hover { background: var(--bg-3); }
        .bp-sort-menu button.active { color: var(--accent); background: var(--accent-dim); }
        .bp-sort-menu button svg { opacity: 0.6; }
        .bp-sort-menu button.active svg { opacity: 1; }

        .bp-filter-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          font-size: 10px;
          color: var(--text-3);
          text-transform: uppercase;
          letter-spacing: 1px;
          background: var(--bg-2);
          border-bottom: 1px solid var(--border);
        }
        .bp-filter-actions {
          display: flex;
          gap: 6px;
        }
        .bp-filter-actions button {
          padding: 2px 8px;
          font-size: 9px;
          background: var(--bg-3);
          border: 1px solid var(--border);
          border-radius: 3px;
          color: var(--text-2);
          cursor: pointer;
          font-family: inherit;
          transition: all 0.1s;
        }
        .bp-filter-actions button:hover { background: var(--bg-4); color: var(--text-1); }
        .bp-filter-count {
          margin-left: auto;
          font-size: 9px;
          color: var(--text-3);
          font-family: monospace;
        }
        .bp-sort-menu button.active .bp-filter-count { color: var(--accent); }

        .bp-help {
          padding: 12px 14px;
          background: linear-gradient(180deg, var(--mc-dark) 0%, var(--bg-1) 100%);
          border-bottom: 1px solid var(--border);
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 6px 16px;
          font-size: 11px;
        }
        .bp-help-title {
          grid-column: 1 / -1;
          font-size: 10px;
          color: var(--text-3);
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 2px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .bp-help-title::before {
          content: '';
          width: 16px;
          height: 1px;
          background: var(--border);
        }
        .bp-help-row { display: contents; }
        .bp-help-row kbd {
          background: var(--bg-3);
          border: 1px solid var(--border-light);
          border-bottom-width: 2px;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 10px;
          font-family: inherit;
          color: var(--text-2);
          box-shadow: 0 1px 0 var(--border);
        }
        .bp-help-row span { color: var(--text-3); display: flex; align-items: center; }

        .bp-toolbar {
          padding: 10px 14px;
          background: var(--bg-1);
          border-bottom: 1px solid var(--border);
          position: relative;
        }

        .bp-search {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          background: var(--mc-dark);
          border: 2px solid var(--border);
          border-radius: 6px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);
        }
        .bp-search:focus-within {
          border-color: var(--accent);
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.3), 0 0 0 3px rgba(74, 143, 212, 0.15);
        }

        .bp-search-icon { color: var(--text-3); flex-shrink: 0; }
        .bp-search input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: var(--text-1);
          font-size: 12px;
          font-family: inherit;
        }
        .bp-search input::placeholder { color: var(--text-3); }
        .bp-search-clear {
          width: 18px;
          height: 18px;
          background: var(--bg-3);
          border: 1px solid var(--border);
          border-radius: 3px;
          color: var(--text-3);
          cursor: pointer;
          font-size: 10px;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }
        .bp-search-clear:hover { background: var(--bg-4); color: var(--text-2); }

        .bp-history {
          position: absolute;
          top: 100%;
          left: 14px;
          right: 14px;
          background: var(--mc-dark);
          border: 1px solid var(--border);
          border-radius: 6px;
          z-index: 50;
          overflow: hidden;
          box-shadow: 0 8px 24px rgba(0,0,0,0.5);
          margin-top: 4px;
        }
        .bp-history-title {
          padding: 8px 12px;
          font-size: 10px;
          color: var(--text-3);
          background: var(--bg-2);
          text-transform: uppercase;
          letter-spacing: 1px;
          border-bottom: 1px solid var(--border);
        }
        .bp-history-item {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 8px 12px;
          background: transparent;
          border: none;
          color: var(--text-1);
          font-size: 12px;
          cursor: pointer;
          text-align: left;
          font-family: inherit;
          transition: background 0.1s;
        }
        .bp-history-item:hover { background: var(--bg-3); }
        .bp-history-item span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        .bp-tabs {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 8px 14px;
          background: var(--bg-1);
          border-bottom: 1px solid var(--border);
          overflow-x: auto;
          scrollbar-width: none;
        }
        .bp-tabs::-webkit-scrollbar { display: none; }

        .bp-tab {
          padding: 6px 12px;
          font-size: 11px;
          color: var(--text-2);
          background: transparent;
          border: 1px solid transparent;
          border-radius: 4px;
          cursor: pointer;
          white-space: nowrap;
          font-family: inherit;
          transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .bp-tab:hover { background: var(--bg-2); color: var(--text-1); }
        .bp-tab.active {
          background: linear-gradient(180deg, var(--accent-dim) 0%, rgba(45, 90, 138, 0.8) 100%);
          border-color: var(--accent);
          color: #fff;
          box-shadow: 0 2px 8px rgba(74, 143, 212, 0.25);
        }
        .bp-tab svg { opacity: 0.7; }
        .bp-tab.active svg { opacity: 1; }
        .bp-tab-count {
          font-size: 9px;
          padding: 1px 5px;
          background: rgba(0,0,0,0.3);
          border-radius: 8px;
          opacity: 0.8;
        }
        .bp-tab-sep { flex: 1; min-width: 1px; }

        .bp-quickbar {
          display: flex;
          gap: 4px;
          padding: 10px 14px;
          background: linear-gradient(180deg, var(--bg-1) 0%, var(--mc-black) 100%);
          border-bottom: 1px solid var(--border);
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        }

        .bp-slot {
          position: relative;
          width: 40px;
          height: 40px;
          background: var(--mc-dark);
          border: 2px solid var(--border);
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.05),
            0 2px 4px rgba(0,0,0,0.3);
        }
        .bp-slot:hover {
          border-color: var(--border-light);
          transform: translateY(-2px);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.05),
            0 4px 12px rgba(0,0,0,0.5);
        }
        .bp-slot.active {
          border-color: var(--mc-blue);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.05),
            0 0 0 2px rgba(99, 136, 212, 0.3),
            0 4px 12px rgba(0,0,0,0.5);
        }
        .bp-slot.drop {
          border-color: var(--mc-gold);
          border-style: dashed;
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.05),
            0 0 0 2px rgba(245, 200, 66, 0.3);
        }
        .bp-slot-num {
          position: absolute;
          top: 2px;
          left: 3px;
          font-size: 10px;
          font-weight: 700;
          color: #fff;
          text-shadow: 0 1px 2px rgba(0,0,0,0.9), 0 0 4px rgba(0,0,0,0.5);
          z-index: 3;
          font-family: 'Minecraft', monospace;
        }
        .bp-slot-img {
          position: absolute;
          inset: 0;
          border-radius: 2px;
          overflow: hidden;
        }
        .bp-slot-img img,
        .bp-slot-img .bp-fallback {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          z-index: 1;
        }
        .bp-slot-img .bp-fallback { border-radius: 2px; }
        .bp-slot-pin {
          position: absolute;
          bottom: 1px;
          right: 2px;
          z-index: 4;
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.8));
        }

        .bp-status {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 14px;
          background: var(--bg-1);
          border-bottom: 1px solid var(--border);
          position: relative;
          min-height: 28px;
        }
        .bp-status-label {
          font-size: 11px;
          color: var(--text-2);
          display: flex;
          align-items: center;
        }
        .bp-status-count { font-size: 10px; color: var(--text-3); font-family: monospace; }
        .bp-sort-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 9px;
          padding: 2px 6px;
          background: var(--accent-dim);
          color: var(--text-2);
          border-radius: 10px;
          border: 1px solid var(--accent);
        }
        .bp-progress {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--bg-3);
          overflow: hidden;
        }
        .bp-progress-bar {
          height: 100%;
          background: linear-gradient(90deg, var(--accent-dim) 0%, var(--accent) 100%);
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 0 8px var(--accent);
        }

        .bp-grid {
          flex: 1;
          overflow-y: auto;
          padding: 8px;
          background: var(--mc-black);
        }
        .bp-grid.grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(34px, 1fr));
          gap: 4px;
          align-content: start;
        }
        .bp-grid.list {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .bp-grid::-webkit-scrollbar { width: 8px; }
        .bp-grid::-webkit-scrollbar-track { background: var(--mc-dark); }
        .bp-grid::-webkit-scrollbar-thumb {
          background: var(--bg-3);
          border-radius: 4px;
          border: 2px solid var(--mc-dark);
        }
        .bp-grid::-webkit-scrollbar-thumb:hover { background: var(--bg-4); }

        .bp-item {
          position: relative;
          background: var(--mc-dark);
          border: 2px solid transparent;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .bp-grid.grid .bp-item { aspect-ratio: 1; }
        .bp-grid.list .bp-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px;
        }
        .bp-item:hover {
          border-color: var(--border-light);
          transform: scale(1.08);
          z-index: 5;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        }
        .bp-item.selected {
          border-color: var(--accent);
          box-shadow: 0 0 0 2px rgba(74, 143, 212, 0.25), 0 4px 12px rgba(0,0,0,0.4);
        }
        .bp-item.focused {
          outline: 2px solid var(--accent);
          outline-offset: 1px;
          box-shadow: 0 0 0 4px rgba(74, 143, 212, 0.15), 0 4px 12px rgba(0,0,0,0.4);
        }
        .bp-item:active { cursor: grabbing; }
        .bp-item[draggable="true"]:active { opacity: 0.7; }

        .bp-item-img {
          position: relative;
          border-radius: 2px;
          overflow: hidden;
        }
        .bp-grid.grid .bp-item-img { inset: 0; }
        .bp-grid.list .bp-item-img {
          width: 32px;
          height: 32px;
          flex-shrink: 0;
          border: 1px solid var(--border);
        }
        .bp-item-img img,
        .bp-item-img .bp-fallback {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          z-index: 1;
        }
        .bp-item-img .bp-fallback { border-radius: 2px; }

        .bp-item-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
        .bp-item-name { font-size: 12px; color: var(--text-1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .bp-item-id { font-size: 10px; color: var(--text-3); font-family: monospace; }

        .bp-item-pin {
          position: absolute;
          top: 1px;
          right: 1px;
          z-index: 6;
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.8));
        }

        .bp-empty {
          grid-column: 1 / -1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 40px 20px;
          color: var(--text-3);
          font-size: 12px;
        }

        .bp-more {
          grid-column: 1 / -1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 12px;
          background: var(--bg-2);
          color: var(--text-2);
          font-size: 12px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s;
          border: 1px dashed var(--border);
        }
        .bp-more:hover {
          background: var(--bg-3);
          color: var(--text-1);
          border-color: var(--border-light);
        }

        .bp-preview {
          position: fixed;
          display: flex;
          gap: 14px;
          padding: 14px;
          background: var(--mc-dark);
          border: 1px solid var(--border);
          border-radius: 8px;
          z-index: 400;
          box-shadow: 0 12px 40px rgba(0,0,0,0.7);
          animation: previewIn 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          pointer-events: none;
          min-width: 200px;
        }
        @keyframes previewIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .bp-preview-img {
          position: relative;
          width: 64px;
          height: 64px;
          background: var(--bg-2);
          border: 2px solid var(--border);
          border-radius: 6px;
          overflow: hidden;
          flex-shrink: 0;
          box-shadow: inset 0 2px 8px rgba(0,0,0,0.4);
        }
        .bp-preview-img img,
        .bp-preview-img .bp-fallback {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .bp-preview-info { display: flex; flex-direction: column; gap: 4px; }
        .bp-preview-name { font-size: 14px; font-weight: 600; color: var(--text-1); }
        .bp-preview-id { font-size: 11px; color: var(--text-3); font-family: monospace; }
        .bp-preview-meta { display: flex; gap: 8px; font-size: 10px; color: var(--text-2); margin-top: 4px; }
        .bp-preview-cat {
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .bp-cat-building { background: #5a4a3a; color: #d4a574; }
        .bp-cat-natural { background: #3a5a3a; color: #74d474; }
        .bp-cat-decocation { background: #5a3a5a; color: #d474d4; }
        .bp-cat-redstone { background: #5a3a3a; color: #d47474; }
        .bp-cat-utility { background: #3a4a5a; color: #74a4d4; }
        .bp-preview-hint {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 9px;
          color: var(--accent);
          margin-top: 6px;
          padding-top: 6px;
          border-top: 1px solid var(--border);
        }
        .bp-highlight {
          background: rgba(245, 200, 66, 0.3);
          color: var(--mc-gold);
          padding: 0 2px;
          border-radius: 2px;
        }
        .bp-item.matched {
          box-shadow: 0 0 0 1px var(--mc-gold), 0 0 8px rgba(245, 200, 66, 0.2);
        }
        .bp-item.batch-selected {
          border-color: var(--accent) !important;
          box-shadow: 0 0 0 2px rgba(74, 143, 212, 0.4), 0 4px 12px rgba(0,0,0,0.4);
        }
        .bp-item.batch-selected::after {
          content: '';
          position: absolute;
          top: 2px;
          right: 2px;
          width: 14px;
          height: 14px;
          background: var(--accent);
          border-radius: 50%;
          z-index: 10;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10'%3E%3Cpath d='M2 5l2 2 4-4' stroke='white' stroke-width='2' fill='none'/%3E%3C/svg%3E");
          background-size: 10px;
          background-position: center;
          background-repeat: no-repeat;
        }

        .bp-batch-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          background: linear-gradient(180deg, var(--bg-1) 0%, var(--mc-dark) 100%);
          border-top: 1px solid var(--border);
        }
        .bp-batch-info {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: var(--text-1);
        }
        .bp-batch-info strong { color: var(--accent); }
        .bp-batch-actions {
          display: flex;
          gap: 6px;
          margin-left: auto;
        }
        .bp-batch-actions button {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 10px;
          font-size: 11px;
          background: var(--bg-2);
          border: 1px solid var(--border);
          border-radius: 4px;
          color: var(--text-1);
          cursor: pointer;
          font-family: inherit;
          transition: all 0.15s;
        }
        .bp-batch-actions button:hover { background: var(--bg-3); transform: translateY(-1px); }
        .bp-batch-actions button:first-child { background: var(--accent-dim); border-color: var(--accent); }

        .bp-footer {
          position: relative;
          width: 40px;
          height: 40px;
          background: var(--mc-dark);
          border: 2px solid var(--border);
          border-radius: 4px;
          overflow: hidden;
          flex-shrink: 0;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);
        }
        .bp-footer-icon img,
        .bp-footer-icon .bp-fallback {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .bp-footer-info { flex: 1; min-width: 0; }
        .bp-footer-name { font-size: 13px; font-weight: 600; color: var(--text-1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .bp-footer-meta { font-size: 10px; color: var(--text-3); font-family: monospace; margin-top: 3px; }

        .bp-footer-actions { display: flex; gap: 6px; }
        .bp-action {
          width: 32px;
          height: 32px;
          font-size: 14px;
          background: var(--bg-2);
          border: 1px solid var(--border);
          border-radius: 4px;
          color: var(--text-3);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .bp-action:hover {
          background: var(--bg-3);
          color: var(--text-2);
          transform: translateY(-1px);
        }
        .bp-action.active { color: var(--mc-gold); }

        .bp-picker-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          animation: fadeIn 0.15s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .bp-picker {
          width: 280px;
          max-height: 360px;
          background: var(--mc-dark);
          border: 1px solid var(--border);
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 12px 40px rgba(0,0,0,0.7);
          animation: scaleIn 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .bp-picker-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          background: var(--bg-2);
          font-size: 12px;
          font-weight: 600;
          border-bottom: 1px solid var(--border);
        }
        .bp-picker-header button {
          width: 20px;
          height: 20px;
          background: var(--bg-3);
          border: 1px solid var(--border);
          border-radius: 4px;
          color: var(--text-2);
          cursor: pointer;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }
        .bp-picker-header button:hover { background: var(--bg-4); color: var(--text-1); }
        .bp-picker-search {
          padding: 10px;
          border-bottom: 1px solid var(--border);
        }
        .bp-picker-search input {
          width: 100%;
          padding: 8px 10px;
          background: var(--bg-1);
          border: 1px solid var(--border);
          border-radius: 4px;
          color: var(--text-1);
          font-size: 12px;
          outline: none;
          font-family: inherit;
          transition: border-color 0.15s;
        }
        .bp-picker-search input:focus { border-color: var(--accent); }
        .bp-picker-grid {
          flex: 1;
          overflow-y: auto;
          padding: 8px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
        }
        .bp-picker-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 6px;
          background: var(--bg-1);
          border: 1px solid var(--border);
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .bp-picker-item:hover {
          background: var(--bg-3);
          border-color: var(--accent);
          transform: scale(1.05);
        }
        .bp-picker-img {
          position: relative;
          width: 32px;
          height: 32px;
          background: var(--mc-dark);
          border-radius: 3px;
          overflow: hidden;
        }
        .bp-picker-img img,
        .bp-picker-img .bp-fallback {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .bp-picker-item span {
          font-size: 8px;
          color: var(--text-3);
          text-align: center;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .bp-picker-empty {
          grid-column: 1 / -1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 30px;
          color: var(--text-3);
        }

        .bp-context {
          position: fixed;
          min-width: 180px;
          background: var(--mc-dark);
          border: 1px solid var(--border);
          border-radius: 6px;
          z-index: 200;
          overflow: hidden;
          box-shadow: 0 8px 24px rgba(0,0,0,0.6);
          animation: scaleIn 0.15s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .bp-context-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          background: var(--bg-2);
          border-bottom: 1px solid var(--border);
        }
        .bp-context-icon {
          position: relative;
          width: 36px;
          height: 36px;
          background: var(--bg-1);
          border: 1px solid var(--border);
          border-radius: 4px;
          overflow: hidden;
          flex-shrink: 0;
        }
        .bp-context-icon img,
        .bp-context-icon .bp-fallback {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .bp-context-name { font-size: 12px; font-weight: 600; color: var(--text-1); }
        .bp-context-id { font-size: 10px; color: var(--text-3); font-family: monospace; margin-top: 2px; }
        .bp-context-sep { height: 1px; background: var(--border); margin: 2px 0; }
        .bp-context button {
          display: flex;
          align-items: center;
          width: 100%;
          padding: 10px 14px;
          background: transparent;
          border: none;
          color: var(--text-1);
          font-size: 12px;
          cursor: pointer;
          text-align: left;
          font-family: inherit;
          transition: background 0.1s;
        }
        .bp-context button:hover { background: var(--bg-3); }
      `}</style>
    </div>
  )
}
