import { useState } from 'react'
import { STRUCTURES, getStructuresByCategory, MinecraftStructure } from '@/data/minecraftStructures'
import { useStructureStore } from '@/stores/structureStore'

const CATEGORIES = [
  { key: 'all', label: '全部', icon: '🏰' },
  { key: 'nether', label: '下界', icon: '🔥' },
  { key: 'ocean', label: '海洋', icon: '🌊' },
  { key: 'end', label: '末地', icon: '🌌' },
  { key: 'desert', label: '沙漠', icon: '🏜️' },
  { key: 'underground', label: '地下', icon: '⛏️' },
  { key: 'forest', label: '森林', icon: '🌲' },
]

export function StructurePanel() {
  const { activeStructures, toggleStructure } = useStructureStore()
  const [activeCategory, setActiveCategory] = useState('all')
  const [selectedStructure, setSelectedStructure] = useState<MinecraftStructure | null>(null)

  const filteredStructures = activeCategory === 'all'
    ? STRUCTURES
    : getStructuresByCategory(activeCategory)

  return (
    <div className="flex flex-col flex-shrink-0 border-l" style={{
      width: 'var(--sidebar-width)',
      background: 'var(--color-bg-surface)',
      borderColor: 'var(--color-border)'
    }}>
      <div className="px-4 py-3 border-b flex-shrink-0" style={{ borderColor: 'var(--color-border)' }}>
        <div className="text-sm font-display font-bold tracking-wider" style={{ color: 'var(--color-text-primary)' }}>
          🏰 原版建筑参考
        </div>
        <div className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
          虚化预览 + 刷怪点标注
        </div>
      </div>

      <div className="flex flex-wrap gap-0.5 px-2 py-2 border-b flex-shrink-0" style={{ borderColor: 'var(--color-border)' }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat.key}
            onClick={() => { setActiveCategory(cat.key); setSelectedStructure(null) }}
            className={`category-tab ${activeCategory === cat.key ? 'active' : ''}`}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {!selectedStructure ? (
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
          {filteredStructures.map(structure => {
            const isActive = activeStructures.has(structure.id)
            return (
              <div key={structure.id} className="space-y-1">
                <div
                  className={`block-item ${isActive ? 'selected' : ''}`}
                  onClick={() => toggleStructure(structure.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: isActive ? '#4ade80' : 'var(--color-border-strong)',
                          boxShadow: isActive ? '0 0 8px rgba(74, 222, 128, 0.5)' : 'none',
                        }}
                      />
                      <div className="block-name truncate">{structure.nameZh}</div>
                    </div>
                    <div className="block-name-en truncate">{structure.description}</div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedStructure(structure)}
                  className="w-full text-[10px] px-2 py-1 rounded text-left transition-all"
                  style={{
                    background: 'rgba(6, 182, 212, 0.1)',
                    color: 'var(--color-accent-diamond)',
                    border: '1px solid rgba(6, 182, 212, 0.2)',
                  }}
                >
                  📋 查看详情 →
                </button>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              {selectedStructure.nameZh}
            </div>
            <button
              onClick={() => setSelectedStructure(null)}
              className="text-[10px] px-2 py-0.5 rounded"
              style={{
                background: 'var(--color-bg-hover)',
                color: 'var(--color-text-secondary)'
              }}
            >
              ← 返回
            </button>
          </div>

          <div className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            {selectedStructure.description}
          </div>

          <div className="px-3 py-2 rounded-md" style={{ background: 'var(--color-bg-elevated)' }}>
            <div className="text-xs font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
              📐 尺寸
            </div>
            <div className="text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>
              {selectedStructure.size.x} × {selectedStructure.size.y} × {selectedStructure.size.z}
            </div>
          </div>

          {selectedStructure.spawners.length > 0 && (
            <div>
              <div className="text-xs font-medium mb-2" style={{ color: 'var(--color-accent-redstone)' }}>
                ⚠️ 刷怪点
              </div>
              <div className="space-y-1">
                {selectedStructure.spawners.map((spawner, i) => (
                  <div
                    key={i}
                    className="px-3 py-2 rounded-md flex items-center gap-2"
                    style={{ background: 'var(--color-bg-elevated)' }}
                  >
                    <span className="text-lg">{spawner.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                        {spawner.description}
                      </div>
                      <div className="text-[10px] font-mono" style={{ color: 'var(--color-text-muted)' }}>
                        ({spawner.position.x}, {spawner.position.y}, {spawner.position.z})
                      </div>
                    </div>
                    {spawner.count && (
                      <span
                        className="text-[10px] px-2 py-0.5 rounded"
                        style={{
                          background: 'rgba(239, 68, 68, 0.2)',
                          color: '#ef4444',
                        }}
                      >
                        ×{spawner.count}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="text-xs font-medium mb-2" style={{ color: 'var(--color-accent-gold)' }}>
              📦 关键特征
            </div>
            <div className="flex flex-wrap gap-1">
              {selectedStructure.keyFeatures.map((feature, i) => (
                <span
                  key={i}
                  className="text-[10px] px-2 py-1 rounded"
                  style={{
                    background: 'var(--color-bg-hover)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-medium mb-2" style={{ color: 'var(--color-accent-green)' }}>
              💡 提示
            </div>
            <div className="space-y-1">
              {selectedStructure.tips.map((tip, i) => (
                <div
                  key={i}
                  className="text-xs leading-relaxed flex gap-2"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  <span className="flex-shrink-0">{i + 1}.</span>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
