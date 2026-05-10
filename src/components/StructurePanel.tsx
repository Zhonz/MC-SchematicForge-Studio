import { useState } from 'react'
import { STRUCTURES, getStructuresByCategory, MinecraftStructure } from '@/data/minecraftStructures'
import { useStructureStore } from '@/stores/structureStore'

const CATEGORIES = [
  { key: 'all', label: '全部' },
  { key: 'redstone', label: '红石' },
  { key: 'nether', label: '下界' },
  { key: 'ocean', label: '海洋' },
  { key: 'end', label: '末地' },
  { key: 'desert', label: '沙漠' },
  { key: 'jungle', label: '丛林' },
  { key: 'forest', label: '森林' },
  { key: 'underground', label: '地下' },
  { key: 'plains', label: '平原' },
  { key: 'snow', label: '雪地' },
  { key: 'deep_dark', label: '深暗' },
]

export function StructurePanel() {
  const { activeStructures, toggleStructure } = useStructureStore()
  const [activeCategory, setActiveCategory] = useState('all')
  const [selectedStructure, setSelectedStructure] = useState<MinecraftStructure | null>(null)

  const filteredStructures = activeCategory === 'all'
    ? STRUCTURES
    : getStructuresByCategory(activeCategory)

  return (
    <div className="structure-panel">
      <div className="panel-header">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="10" width="5" height="11"/>
          <rect x="9.5" y="5" width="5" height="16"/>
          <rect x="16" y="12" width="5" height="9"/>
        </svg>
        建筑
        <span className="structure-count">{STRUCTURES.length}</span>
      </div>

      <div className="category-tabs">
        {CATEGORIES.map(cat => (
          <button
            key={cat.key}
            onClick={() => { setActiveCategory(cat.key); setSelectedStructure(null) }}
            className={`category-tab ${activeCategory === cat.key ? 'active' : ''}`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {!selectedStructure ? (
        <div className="structure-list">
          {filteredStructures.map(structure => {
            const isActive = activeStructures.has(structure.id)
            return (
              <div key={structure.id} className="structure-item">
                <div
                  className={`structure-row ${isActive ? 'active' : ''}`}
                  onClick={() => toggleStructure(structure.id)}
                >
                  <div className={`status-dot ${isActive ? 'on' : ''}`}/>
                  <div className="structure-info">
                    <div className="structure-name">{structure.nameZh}</div>
                    <div className="structure-meta">{structure.description}</div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedStructure(structure)}
                  className="detail-btn"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </button>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="structure-detail">
          <div className="detail-header">
            <button onClick={() => setSelectedStructure(null)} className="back-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
              返回
            </button>
            <span className="detail-title">{selectedStructure.nameZh}</span>
          </div>

          <div className="detail-content">
            <div className="detail-section">
              <div className="section-label">尺寸</div>
              <div className="section-value mono">
                {selectedStructure.size.x} × {selectedStructure.size.y} × {selectedStructure.size.z}
              </div>
            </div>

            {selectedStructure.spawners.length > 0 && (
              <div className="detail-section">
                <div className="section-label danger">刷怪点</div>
                <div className="spawner-list">
                  {selectedStructure.spawners.map((spawner, i) => (
                    <div key={i} className="spawner-item">
                      <span className="spawner-icon">{spawner.icon}</span>
                      <div className="spawner-info">
                        <div className="spawner-desc">{spawner.description}</div>
                        <div className="spawner-pos mono">
                          ({spawner.position.x}, {spawner.position.y}, {spawner.position.z})
                        </div>
                      </div>
                      {spawner.count && (
                        <span className="spawner-count">×{spawner.count}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="detail-section">
              <div className="section-label">特征</div>
              <div className="feature-tags">
                {selectedStructure.keyFeatures.map((feature, i) => (
                  <span key={i} className="feature-tag">{feature}</span>
                ))}
              </div>
            </div>

            <div className="detail-section">
              <div className="section-label">提示</div>
              <div className="tips-list">
                {selectedStructure.tips.map((tip, i) => (
                  <div key={i} className="tip-item">
                    <span className="tip-num">{i + 1}</span>
                    <span className="tip-text">{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .structure-panel {
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

        .structure-count {
          margin-left: auto;
          padding: 2px 6px;
          font-size: 10px;
          background: var(--bg-active);
          border-radius: 10px;
          color: var(--text-secondary);
        }

        .category-tabs {
          display: flex;
          gap: 4px;
          padding: 8px 12px;
          border-bottom: 1px solid var(--border-subtle);
          overflow-x: auto;
        }

        .category-tab {
          padding: 4px 8px;
          font-size: 11px;
          font-weight: 500;
          color: var(--text-secondary);
          background: transparent;
          border: none;
          border-radius: var(--radius-sm);
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

        .structure-list {
          flex: 1;
          overflow-y: auto;
          padding: 4px;
        }

        .structure-item {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 8px;
          border-radius: var(--radius-md);
          transition: all 100ms var(--ease-out);
        }

        .structure-item:hover {
          background: var(--bg-hover);
        }

        .structure-row {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--border-medium);
          transition: all 120ms var(--ease-out);
        }

        .status-dot.on {
          background: var(--accent-success);
          box-shadow: 0 0 8px rgba(92, 255, 123, 0.5);
        }

        .structure-info {
          flex: 1;
          min-width: 0;
        }

        .structure-name {
          font-size: 12px;
          font-weight: 500;
          color: var(--text-primary);
        }

        .structure-meta {
          font-size: 10px;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .detail-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          padding: 0;
          background: transparent;
          border: none;
          border-radius: var(--radius-sm);
          color: var(--text-muted);
          cursor: pointer;
          transition: all 120ms var(--ease-out);
        }

        .detail-btn:hover {
          background: var(--bg-active);
          color: var(--text-primary);
        }

        .structure-detail {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .detail-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border-bottom: 1px solid var(--border-subtle);
        }

        .back-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          font-size: 11px;
          color: var(--text-secondary);
          background: transparent;
          border: none;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 120ms var(--ease-out);
        }

        .back-btn:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
        }

        .detail-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .detail-content {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
        }

        .detail-section {
          margin-bottom: 16px;
        }

        .section-label {
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--text-muted);
          margin-bottom: 8px;
        }

        .section-label.danger {
          color: var(--accent-danger);
        }

        .section-value {
          font-size: 12px;
          color: var(--text-secondary);
        }

        .spawner-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .spawner-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          background: var(--bg-medium);
          border-radius: var(--radius-md);
        }

        .spawner-icon {
          font-size: 16px;
        }

        .spawner-info {
          flex: 1;
          min-width: 0;
        }

        .spawner-desc {
          font-size: 11px;
          font-weight: 500;
          color: var(--text-primary);
        }

        .spawner-pos {
          font-size: 10px;
          color: var(--text-muted);
        }

        .spawner-count {
          padding: 2px 6px;
          font-size: 10px;
          font-weight: 600;
          background: rgba(255, 92, 92, 0.2);
          color: var(--accent-danger);
          border-radius: 10px;
        }

        .feature-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }

        .feature-tag {
          padding: 4px 8px;
          font-size: 11px;
          background: var(--bg-hover);
          color: var(--text-secondary);
          border-radius: var(--radius-sm);
        }

        .tips-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .tip-item {
          display: flex;
          gap: 8px;
          font-size: 11px;
          line-height: 1.4;
        }

        .tip-num {
          flex-shrink: 0;
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 600;
          background: var(--bg-active);
          color: var(--text-muted);
          border-radius: 50%;
        }

        .tip-text {
          color: var(--text-secondary);
        }

        .mono {
          font-family: var(--font-mono);
        }
      `}</style>
    </div>
  )
}
