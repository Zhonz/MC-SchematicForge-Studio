import { useSceneStore } from '@/stores/sceneStore'

export function exportToLitematic() {
  const { blocks } = useSceneStore.getState()
  
  const blockData = Array.from(blocks.values())
  
  if (blockData.length === 0) {
    alert('场景中没有方块，无法导出')
    return
  }

  let minX = Infinity, minY = Infinity, minZ = Infinity
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity

  blockData.forEach(b => {
    minX = Math.min(minX, b.x)
    minY = Math.min(minY, b.y)
    minZ = Math.min(minZ, b.z)
    maxX = Math.max(maxX, b.x)
    maxY = Math.max(maxY, b.y)
    maxZ = Math.max(maxZ, b.z)
  })

  const size = {
    x: maxX - minX + 1,
    y: maxY - minY + 1,
    z: maxZ - minZ + 1
  }

  const palette = [...new Set(blockData.map(b => b.blockId))]
  
  const exportData = {
    Version: 4,
    Metadata: {
      Name: 'MC投影工坊导出',
      Author: 'SchematicForge Studio',
      Description: '由 MC投影工坊 自动生成',
      TimeCreated: Date.now(),
      TimeModified: Date.now(),
      TotalBlocks: blockData.length,
      TotalVolume: size.x * size.y * size.z,
      EnclosingSize: size
    },
    Regions: {
      Main: {
        BlockCount: blockData.length,
        Position: [minX, minY, minZ],
        Size: [size.x, size.y, size.z],
        BlockStatePalette: palette,
        Blocks: blockData.map(b => ({
          pos: [b.x - minX, b.y - minY, b.z - minZ],
          state: palette.indexOf(b.blockId)
        }))
      }
    }
  }

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'schematicforge-export.json'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  alert(`投影文件已导出！\n方块数: ${blockData.length}\n尺寸: ${size.x}x${size.y}x${size.z}`)
}
