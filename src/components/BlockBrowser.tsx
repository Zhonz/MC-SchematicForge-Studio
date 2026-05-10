import { useState, useMemo } from 'react'
import { useSceneStore } from '@/stores/sceneStore'
import { BLOCKS, getBlocksByCategory } from '@/utils/blocks'
import { getMCTextureURL } from '@/services/textureService'
import type { BlockCategory } from '@/types'

const CATEGORIES: Array<{ key: BlockCategory; label: string; icon: JSX.Element }> = [
  { 
    key: 'building', 
    label: '建筑', 
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 21H21M5 21V11M12 21V3M19 21V11M9 11V7M15 11V7"/></svg>
  },
  { 
    key: 'natural', 
    label: '自然', 
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22V8M12 8C12 8 5 13 5 17C5 20 8 22 12 22M12 8C12 8 19 13 19 17C19 20 16 22 12 22"/></svg>
  },
  { 
    key: 'redstone', 
    label: '红石', 
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M13 2L3 14H12L11 22L21 10H12L13 2Z"/></svg>
  },
  { 
    key: 'decoration', 
    label: '装饰', 
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2L15 8H21L16 12L18 19L12 15L6 19L8 12L3 8H9L12 2Z"/></svg>
  },
  { 
    key: 'utility', 
    label: '实用', 
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
  },
]

export function BlockBrowser() {
  const { selectedBlock, setSelectedBlock } = useSceneStore()
  const [activeCategory, setActiveCategory] = useState<BlockCategory>('building')
  const [searchQuery, setSearchQuery] = useState('')
  const [failedTextures, setFailedTextures] = useState<Set<string>>(new Set())

  const filteredBlocks = useMemo(() => {
    const blocks = getBlocksByCategory(activeCategory)
    if (!searchQuery.trim()) return blocks
    return blocks.filter(b => 
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.nameZh.includes(searchQuery)
    )
  }, [activeCategory, searchQuery])

  const handleTextureError = (blockId: string) => {
    setFailedTextures(prev => new Set(prev).add(blockId))
  }

  return (
    <div className="block-browser">
      <div className="panel-header">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        </svg>
        方块
        <span className="block-count">{BLOCKS.length}</span>
      </div>

      <div className="search-container">
        <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
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
            <div className="block-texture-wrapper">
              {!failedTextures.has(block.id) ? (
                <img 
                  src={getMCTextureURL(block.id)}
                  alt={block.nameZh}
                  className="block-texture"
                  onError={() => handleTextureError(block.id)}
                />
              ) : null}
              <div 
                className="block-color-fallback" 
                style={{ 
                  backgroundColor: failedTextures.has(block.id) ? 'transparent' : block.color,
                  opacity: failedTextures.has(block.id) ? 0 : 1
                }}
              />
              {failedTextures.has(block.id) && (
                <div 
                  className="block-color-solid" 
                  style={{ backgroundColor: block.color }}
                />
              )}
            </div>
            <div className="block-info">
              <div className="block-name">{block.nameZh}</div>
              <div className="block-id">{block.id}</div>
            </div>
          </div>
        ))}
        
        {filteredBlocks.length === 0 && (
          <div className="empty-state">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <span>没有找到匹配的方块</span>
          </div>
        )}
      </div>

      {selectedBlock && (
        <div className="selected-block-footer">
          <div className="selected-preview-wrapper">
            {!failedTextures.has(selectedBlock.id) ? (
              <img 
                src={getMCTextureURL(selectedBlock.id)}
                alt={selectedBlock.nameZh}
                className="selected-preview-image"
                onError={() => handleTextureError(selectedBlock.id)}
              />
            ) : null}
            <div 
              className="selected-preview-fallback" 
              style={{ 
                backgroundColor: failedTextures.has(selectedBlock.id) ? 'transparent' : selectedBlock.color,
                opacity: failedTextures.has(selectedBlock.id) ? 0 : 1
              }}
            />
            {failedTextures.has(selectedBlock.id) && (
              <div 
                className="selected-preview-solid" 
                style={{ backgroundColor: selectedBlock.color }}
              />
            )}
          </div>
          <div className="selected-info">
            <div className="selected-name">{selectedBlock.nameZh}</div>
            <div className="selected-meta">
              <span className="selected-id">{selectedBlock.id}</span>
              <span className="selected-hardness">硬度: {selectedBlock.hardness}</span>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .block-browser {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--bg-elevation-1);
        }

        .panel-header {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-4);
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: var(--text-secondary);
          border-bottom: 1px solid var(--border-subtle);
        }

        .block-count {
          margin-left: auto;
          padding: var(--space-1) var(--space-2);
          font-size: 11px;
          font-weight: 600;
          background: var(--bg-elevation-4);
          border-radius: var(--radius-md);
          color: var(--text-secondary);
        }

        .search-container {
          position: relative;
          padding: var(--space-3) var(--space-4);
          border-bottom: 1px solid var(--border-subtle);
        }

        .search-icon {
          position: absolute;
          left: calc(var(--space-4) + var(--space-3));
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-hint);
          pointer-events: none;
        }

        .search-input {
          width: 100%;
          padding: var(--space-3) var(--space-4) var(--space-3) calc(var(--space-3) + 28px);
          font-size: 14px;
          background: var(--bg-elevation-2);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          color: var(--text-primary);
          outline: none;
          transition: all var(--duration-fast) var(--ease-out);
        }

        .search-input:hover {
          border-color: var(--border-medium);
        }

        .search-input:focus {
          border-color: var(--accent-primary);
          background: var(--bg-elevation-3);
          box-shadow: 0 0 0 3px rgba(144, 202, 249, 0.12);
        }

        .search-input::placeholder {
          color: var(--text-hint);
        }

        .category-tabs {
          display: flex;
          gap: var(--space-1);
          padding: var(--space-3) var(--space-4);
          border-bottom: 1px solid var(--border-subtle);
          overflow-x: auto;
        }

        .category-tab {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-2) var(--space-3);
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
          background: transparent;
          border: none;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--duration-fast) var(--ease-out);
          white-space: nowrap;
        }

        .category-tab:hover {
          background: var(--bg-elevation-3);
          color: var(--text-primary);
        }

        .category-tab.active {
          background: var(--bg-elevation-4);
          color: var(--accent-primary);
        }

        .block-list {
          flex: 1;
          overflow-y: auto;
          padding: var(--space-2);
        }

        .block-item {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-3);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--duration-instant) var(--ease-out);
          border-left: 3px solid transparent;
        }

        .block-item:hover {
          background: var(--bg-elevation-3);
        }

        .block-item.selected {
          background: var(--bg-elevation-4);
          border-left-color: var(--accent-primary);
        }

        .block-texture-wrapper {
          position: relative;
          width: 32px;
          height: 32px;
          border-radius: var(--radius-md);
          overflow: hidden;
          flex-shrink: 0;
          background: var(--bg-elevation-3);
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.1);
        }

        .block-texture {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          z-index: 1;
        }

        .block-color-fallback {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          transition: opacity var(--duration-fast) var(--ease-out);
        }

        .block-color-solid {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }

        .block-info {
          flex: 1;
          min-width: 0;
        }

        .block-name {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .block-id {
          font-size: 12px;
          font-family: var(--font-mono);
          color: var(--text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: var(--space-3);
          padding: var(--space-8);
          color: var(--text-disabled);
          font-size: 13px;
        }

        .selected-block-footer {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-4);
          background: var(--bg-elevation-2);
          border-top: 1px solid var(--border-subtle);
        }

        .selected-preview-wrapper {
          position: relative;
          width: 40px;
          height: 40px;
          border-radius: var(--radius-lg);
          overflow: hidden;
          flex-shrink: 0;
          background: var(--bg-elevation-3);
          box-shadow: var(--elevation-1), inset 0 0 0 1px rgba(255,255,255,0.1);
        }

        .selected-preview-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          z-index: 1;
        }

        .selected-preview-fallback {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          transition: opacity var(--duration-fast) var(--ease-out);
        }

        .selected-preview-solid {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }

        .selected-info {
          flex: 1;
          min-width: 0;
        }

        .selected-name {
          font-size: 15px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .selected-meta {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          margin-top: var(--space-1);
        }

        .selected-id {
          font-size: 11px;
          font-family: var(--font-mono);
          color: var(--text-secondary);
        }

        .selected-hardness {
          font-size: 11px;
          color: var(--text-hint);
        }
      `}</style>
    </div>
  )
}
