import { BlockData, BlockCategory } from '@/types'

export const BLOCKS: BlockData[] = [
  // Building blocks
  { id: 'minecraft:stone', name: 'Stone', nameZh: '石头', color: '#808080', hardness: 1.5, transparent: false, category: 'building' },
  { id: 'minecraft:cobblestone', name: 'Cobblestone', nameZh: '圆石', color: '#6B6B6B', hardness: 2.0, transparent: false, category: 'building' },
  { id: 'minecraft:oak_planks', name: 'Oak Planks', nameZh: '橡木木板', color: '#BC9862', hardness: 2.0, transparent: false, category: 'building' },
  { id: 'minecraft:spruce_planks', name: 'Spruce Planks', nameZh: '云杉木板', color: '#6B5430', hardness: 2.0, transparent: false, category: 'building' },
  { id: 'minecraft:birch_planks', name: 'Birch Planks', nameZh: '桦木木板', color: '#D4C59E', hardness: 2.0, transparent: false, category: 'building' },
  { id: 'minecraft:bricks', name: 'Bricks', nameZh: '砖块', color: '#9B5B3C', hardness: 2.0, transparent: false, category: 'building' },
  { id: 'minecraft:stone_bricks', name: 'Stone Bricks', nameZh: '石砖', color: '#7A7A7A', hardness: 1.5, transparent: false, category: 'building' },
  { id: 'minecraft:glass', name: 'Glass', nameZh: '玻璃', color: '#CCE5FF', hardness: 0.3, transparent: true, category: 'building' },
  { id: 'minecraft:white_wool', name: 'White Wool', nameZh: '白色羊毛', color: '#F0F0F0', hardness: 0.8, transparent: false, category: 'building' },
  { id: 'minecraft:concrete', name: 'White Concrete', nameZh: '白色混凝土', color: '#D9D9D9', hardness: 1.8, transparent: false, category: 'building' },

  // Natural blocks
  { id: 'minecraft:grass_block', name: 'Grass Block', nameZh: '草方块', color: '#5D8C3E', hardness: 0.6, transparent: false, category: 'natural' },
  { id: 'minecraft:dirt', name: 'Dirt', nameZh: '泥土', color: '#866043', hardness: 0.5, transparent: false, category: 'natural' },
  { id: 'minecraft:oak_log', name: 'Oak Log', nameZh: '橡木原木', color: '#7B5B3A', hardness: 2.0, transparent: false, category: 'natural' },
  { id: 'minecraft:spruce_log', name: 'Spruce Log', nameZh: '云杉原木', color: '#4A3728', hardness: 2.0, transparent: false, category: 'natural' },
  { id: 'minecraft:sand', name: 'Sand', nameZh: '沙子', color: '#DBD3A0', hardness: 0.5, transparent: false, category: 'natural' },
  { id: 'minecraft:gravel', name: 'Gravel', nameZh: '沙砾', color: '#8A8A8A', hardness: 0.6, transparent: false, category: 'natural' },

  // Redstone blocks
  { id: 'minecraft:redstone_block', name: 'Block of Redstone', nameZh: '红石块', color: '#B80000', hardness: 5.0, transparent: false, category: 'redstone' },
  { id: 'minecraft:redstone_wire', name: 'Redstone Wire', nameZh: '红石粉', color: '#FF0000', hardness: 0.0, transparent: true, category: 'redstone' },
  { id: 'minecraft:redstone_torch', name: 'Redstone Torch', nameZh: '红石火把', color: '#FF6600', hardness: 0.0, transparent: true, category: 'redstone' },
  { id: 'minecraft:repeater', name: 'Repeater', nameZh: '中继器', color: '#8B8B8B', hardness: 0.0, transparent: true, category: 'redstone' },
  { id: 'minecraft:comparator', name: 'Comparator', nameZh: '比较器', color: '#8B8B8B', hardness: 0.0, transparent: true, category: 'redstone' },
  { id: 'minecraft:lever', name: 'Lever', nameZh: '拉杆', color: '#808080', hardness: 0.5, transparent: true, category: 'redstone' },
  { id: 'minecraft:stone_button', name: 'Stone Button', nameZh: '石头按钮', color: '#909090', hardness: 0.5, transparent: true, category: 'redstone' },
  { id: 'minecraft:piston', name: 'Piston', nameZh: '活塞', color: '#9B9B9B', hardness: 1.5, transparent: false, category: 'redstone' },
  { id: 'minecraft:sticky_piston', name: 'Sticky Piston', nameZh: '粘性活塞', color: '#5D8C3E', hardness: 1.5, transparent: false, category: 'redstone' },
  { id: 'minecraft:observer', name: 'Observer', nameZh: '侦测器', color: '#6B6B6B', hardness: 3.5, transparent: false, category: 'redstone' },

  // Decoration blocks
  { id: 'minecraft:oak_stairs', name: 'Oak Stairs', nameZh: '橡木楼梯', color: '#BC9862', hardness: 2.0, transparent: false, category: 'decoration' },
  { id: 'minecraft:oak_slab', name: 'Oak Slab', nameZh: '橡木台阶', color: '#BC9862', hardness: 2.0, transparent: false, category: 'decoration' },
  { id: 'minecraft:stone_stairs', name: 'Stone Stairs', nameZh: '石楼梯', color: '#808080', hardness: 1.5, transparent: false, category: 'decoration' },
  { id: 'minecraft:torch', name: 'Torch', nameZh: '火把', color: '#FFAA00', hardness: 0.0, transparent: true, category: 'decoration' },
  { id: 'minecraft:ladder', name: 'Ladder', nameZh: '梯子', color: '#BC9862', hardness: 0.4, transparent: true, category: 'decoration' },
  { id: 'minecraft:iron_bars', name: 'Iron Bars', nameZh: '铁栏杆', color: '#404040', hardness: 5.0, transparent: true, category: 'decoration' },

  // Utility blocks
  { id: 'minecraft:crafting_table', name: 'Crafting Table', nameZh: '工作台', color: '#BC9862', hardness: 2.5, transparent: false, category: 'utility' },
  { id: 'minecraft:furnace', name: 'Furnace', nameZh: '熔炉', color: '#808080', hardness: 3.5, transparent: false, category: 'utility' },
  { id: 'minecraft:chest', name: 'Chest', nameZh: '箱子', color: '#BC9862', hardness: 2.5, transparent: false, category: 'utility' },
  { id: 'minecraft:iron_block', name: 'Block of Iron', nameZh: '铁块', color: '#E8E8E8', hardness: 5.0, transparent: false, category: 'utility' },
  { id: 'minecraft:gold_block', name: 'Block of Gold', nameZh: '金块', color: '#FFAA00', hardness: 3.0, transparent: false, category: 'utility' },
  { id: 'minecraft:diamond_block', name: 'Block of Diamond', nameZh: '钻石块', color: '#4AEDD9', hardness: 5.0, transparent: false, category: 'utility' },
]

export function getBlockById(id: string): BlockData | undefined {
  return BLOCKS.find(b => b.id === id)
}

export function getBlocksByCategory(category: BlockCategory): BlockData[] {
  return BLOCKS.filter(b => b.category === category)
}
