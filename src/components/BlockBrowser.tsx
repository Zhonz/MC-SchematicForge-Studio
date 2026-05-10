import { useState, useMemo } from 'react'
import { useSceneStore } from '@/stores/sceneStore'
import { BLOCKS, getBlocksByCategory } from '@/utils/blocks'
import type { BlockCategory } from '@/types'

const CATEGORIES: Array<{ key: BlockCategory; label: string; icon: JSX.Element }> = [
  { 
    key: 'building', 
    label: '建筑', 
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21H21M5 21V11M12 21V3M19 21V11M9 11V7M15 11V7"/></svg>
  },
  { 
    key: 'natural', 
    label: '自然', 
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22V8M12 8C12 8 5 13 5 17C5 20 8 22 12 22M12 8C12 8 19 13 19 17C19 20 16 22 12 22"/></svg>
  },
  { 
    key: 'redstone', 
    label: '红石', 
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14H12L11 22L21 10H12L13 2Z"/></svg>
  },
  { 
    key: 'decoration', 
    label: '装饰', 
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L15 8H21L16 12L18 19L12 15L6 19L8 12L3 8H9L12 2Z"/></svg>
  },
  { 
    key: 'utility', 
    label: '实用', 
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
  },
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

  return (
    <div className="block-browser">
      <div className="panel-header">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        </svg>
        方块
        <span className="block-count">{BLOCKS.length}</span>
      </div>

      <div className="search-container">
        <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
        </svg>
        <input
          type="text"
          placeholder="搜索方块..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="category-tabs">
        {CATEGORIES.map(cat => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`category-tab ${activeCategory === cat.key ? 'active' : ''}`}
          >
            {cat.icon}
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      <div className="block-list">
        {filteredBlocks.map(block => (
          <div
            key={block.id}
            onClick={() => setSelectedBlock(block)}
            className={`block-item ${selectedBlock.id === block.id ? 'selected' : ''}`}
          >
            <div 
              className="block-color" 
              style={{ backgroundColor: block.color }}
            />
            <div className="block-info">
              <div className="block-name">{block.nameZh}</div>
              <div className="block-id">{block.id}</div>
            </div>
          </div>
        ))}
        
        {filteredBlocks.length === 0 && (
          <div className="empty-state">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <span>没有找到方块</span>
          </div>
        )}
      </div>

      {selectedBlock && (
        <div className="block-footer">
          <div className="selected-block">
            <div 
              className="selected-color" 
              style={{ backgroundColor: selectedBlock.color }}
            />
            <div className="selected-info">
              <div className="selected-name">{selectedBlock.nameZh}</div>
              <div className="selected-id">{selectedBlock.id}</div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .block-browser {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--bg-dark);
        }

        .panel-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--text-muted);
          border-bottom: 1px solid var(--border-subtle);
        }

        .block-count {
          margin-left: auto;
          padding: 2px 6px;
          font-size: 10px;
          background: var(--bg-active);
          border-radius: 10px;
          color: var(--text-secondary);
        }

        .search-container {
          position: relative;
          padding: 8px 12px;
          border-bottom: 1px solid var(--border-subtle);
        }

        .search-icon {
          position: absolute;
          left: 22px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          pointer-events: none;
        }

        .search-input {
          width: 100%;
          padding: 8px 12px 8px 32px;
          font-size: 12px;
          background: var(--bg-darkest);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          outline: none;
          transition: all 120ms var(--ease-out);
        }

        .search-input:focus {
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 2px rgba(92, 155, 255, 0.15);
        }

        .search-input::placeholder {
          color: var(--text-muted);
        }

        .category-tabs {
          display: flex;
          gap: 4px;
          padding: 8px 12px;
          border-bottom: 1px solid var(--border-subtle);
          overflow-x: auto;
        }

        .category-tab {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 10px;
          font-size: 11px;
          font-weight: 500;
          color: var(--text-secondary);
          background: transparent;
          border: none;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 120ms var(--ease-out);
          white-space: nowrap;
        }

        .category-tab:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
        }

        .category-tab.active {
          background: var(--bg-active);
          color: var(--accent-primary);
        }

        .block-list {
          flex: 1;
          overflow-y: auto;
          padding: 4px;
        }

        .block-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 100ms var(--ease-out);
          border-left: 2px solid transparent;
        }

        .block-item:hover {
          background: var(--bg-hover);
        }

        .block-item.selected {
          background: var(--bg-active);
          border-left-color: var(--accent-primary);
        }

        .block-color {
          width: 28px;
          height: 28px;
          border-radius: var(--radius-sm);
          flex-shrink: 0;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.1);
        }

        .block-info {
          flex: 1;
          min-width: 0;
        }

        .block-name {
          font-size: 12px;
          font-weight: 500;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .block-id {
          font-size: 10px;
          font-family: var(--font-mono);
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 40px 20px;
          color: var(--text-muted);
          font-size: 12px;
        }

        .block-footer {
          padding: 10px 12px;
          border-top: 1px solid var(--border-subtle);
          background: var(--bg-medium);
        }

        .selected-block {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .selected-color {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-md);
          flex-shrink: 0;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.1);
        }

        .selected-info {
          flex: 1;
          min-width: 0;
        }

        .selected-name {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-primary);
        }

        .selected-id {
          font-size: 10px;
          font-family: var(--font-mono);
          color: var(--text-muted);
        }
      `}</style>
    </div>
  )
}
