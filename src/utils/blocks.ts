import { BlockData, BlockCategory } from '@/types'

export const BLOCKS: BlockData[] = [
  // Building blocks
  { id: 'minecraft:stone', name: 'Stone', nameZh: '石头', color: '#808080', hardness: 1.5, transparent: false, category: 'building' },
  { id: 'minecraft:cobblestone', name: 'Cobblestone', nameZh: '圆石', color: '#6B6B6B', hardness: 2.0, transparent: false, category: 'building' },
  { id: 'minecraft:oak_planks', name: 'Oak Planks', nameZh: '橡木木板', color: '#BC9862', hardness: 2.0, transparent: false, category: 'building' },
  { id: 'minecraft:spruce_planks', name: 'Spruce Planks', nameZh: '云杉木板', color: '#6B5430', hardness: 2.0, transparent: false, category: 'building' },
  { id: 'minecraft:birch_planks', name: 'Birch Planks', nameZh: '桦木木板', color: '#D4C59E', hardness: 2.0, transparent: false, category: 'building' },
  { id: 'minecraft:dark_oak_planks', name: 'Dark Oak Planks', nameZh: '深色橡木木板', color: '#4A3728', hardness: 2.0, transparent: false, category: 'building' },
  { id: 'minecraft:bricks', name: 'Bricks', nameZh: '砖块', color: '#9B5B3C', hardness: 2.0, transparent: false, category: 'building' },
  { id: 'minecraft:stone_bricks', name: 'Stone Bricks', nameZh: '石砖', color: '#7A7A7A', hardness: 1.5, transparent: false, category: 'building' },
  { id: 'minecraft:glass', name: 'Glass', nameZh: '玻璃', color: '#CCE5FF', hardness: 0.3, transparent: true, category: 'building' },
  { id: 'minecraft:tinted_glass', name: 'Tinted Glass', nameZh: '遮光玻璃', color: '#4A4A5A', hardness: 0.3, transparent: true, category: 'building' },
  { id: 'minecraft:white_wool', name: 'White Wool', nameZh: '白色羊毛', color: '#F0F0F0', hardness: 0.8, transparent: false, category: 'building' },
  { id: 'minecraft:concrete', name: 'White Concrete', nameZh: '白色混凝土', color: '#D9D9D9', hardness: 1.8, transparent: false, category: 'building' },
  { id: 'minecraft:obsidian', name: 'Obsidian', nameZh: '黑曜石', color: '#1a1a2e', hardness: 50, transparent: false, category: 'building' },
  { id: 'minecraft:crying_obsidian', name: 'Crying Obsidian', nameZh: '哭泣黑曜石', color: '#2a1a4e', hardness: 50, transparent: false, category: 'building' },

  // Natural blocks
  { id: 'minecraft:grass_block', name: 'Grass Block', nameZh: '草方块', color: '#5D8C3E', hardness: 0.6, transparent: false, category: 'natural' },
  { id: 'minecraft:dirt', name: 'Dirt', nameZh: '泥土', color: '#866043', hardness: 0.5, transparent: false, category: 'natural' },
  { id: 'minecraft:oak_log', name: 'Oak Log', nameZh: '橡木原木', color: '#7B5B3A', hardness: 2.0, transparent: false, category: 'natural' },
  { id: 'minecraft:spruce_log', name: 'Spruce Log', nameZh: '云杉原木', color: '#4A3728', hardness: 2.0, transparent: false, category: 'natural' },
  { id: 'minecraft:sand', name: 'Sand', nameZh: '沙子', color: '#DBD3A0', hardness: 0.5, transparent: false, category: 'natural' },
  { id: 'minecraft:gravel', name: 'Gravel', nameZh: '沙砾', color: '#8A8A8A', hardness: 0.6, transparent: false, category: 'natural' },
  { id: 'minecraft:end_stone', name: 'End Stone', nameZh: '末地石', color: '#E8E8CC', hardness: 3, transparent: false, category: 'natural' },
  { id: 'minecraft:netherrack', name: 'Netherrack', nameZh: '下界岩', color: '#8B3A3A', hardness: 0.4, transparent: false, category: 'natural' },
  { id: 'minecraft:basalt', name: 'Basalt', nameZh: '玄武岩', color: '#3D3D4A', hardness: 1.25, transparent: false, category: 'natural' },
  { id: 'minecraft:blackstone', name: 'Blackstone', nameZh: '黑石', color: '#1a1a1a', hardness: 2, transparent: false, category: 'natural' },

  // Redstone blocks
  { id: 'minecraft:redstone_block', name: 'Block of Redstone', nameZh: '红石块', color: '#B80000', hardness: 5.0, transparent: false, category: 'redstone' },
  { id: 'minecraft:redstone_wire', name: 'Redstone Wire', nameZh: '红石粉', color: '#FF0000', hardness: 0.0, transparent: true, category: 'redstone' },
  { id: 'minecraft:redstone_torch', name: 'Redstone Torch', nameZh: '红石火把', color: '#FF6600', hardness: 0.0, transparent: true, category: 'redstone' },
  { id: 'minecraft:repeater', name: 'Repeater', nameZh: '中继器', color: '#8B8B8B', hardness: 0.0, transparent: true, category: 'redstone' },
  { id: 'minecraft:comparator', name: 'Comparator', nameZh: '比较器', color: '#8B8B8B', hardness: 0.0, transparent: true, category: 'redstone' },
  { id: 'minecraft:lever', name: 'Lever', nameZh: '拉杆', color: '#808080', hardness: 0.5, transparent: true, category: 'redstone' },
  { id: 'minecraft:stone_button', name: 'Stone Button', nameZh: '石头按钮', color: '#909090', hardness: 0.5, transparent: true, category: 'redstone' },
  { id: 'minecraft:wooden_button', name: 'Wooden Button', nameZh: '木质按钮', color: '#BC9862', hardness: 0.5, transparent: true, category: 'redstone' },
  { id: 'minecraft:piston', name: 'Piston', nameZh: '活塞', color: '#9B9B9B', hardness: 1.5, transparent: false, category: 'redstone' },
  { id: 'minecraft:sticky_piston', name: 'Sticky Piston', nameZh: '粘性活塞', color: '#5D8C3E', hardness: 1.5, transparent: false, category: 'redstone' },
  { id: 'minecraft:observer', name: 'Observer', nameZh: '侦测器', color: '#6B6B6B', hardness: 3.5, transparent: false, category: 'redstone' },
  { id: 'minecraft:hopper', name: 'Hopper', nameZh: '漏斗', color: '#6B6B6B', hardness: 3, transparent: false, category: 'redstone' },
  { id: 'minecraft:dropper', name: 'Dropper', nameZh: '投掷器', color: '#8B8B8B', hardness: 3.5, transparent: false, category: 'redstone' },
  { id: 'minecraft:dispenser', name: 'Dispenser', nameZh: '发射器', color: '#8B8B8B', hardness: 3.5, transparent: false, category: 'redstone' },
  { id: 'minecraft:trapped_chest', name: 'Trapped Chest', nameZh: '陷阱箱', color: '#9B7B4B', hardness: 2.5, transparent: false, category: 'redstone' },
  { id: 'minecraft:daylight_detector', name: 'Daylight Detector', nameZh: '阳光探测器', color: '#D4C59E', hardness: 0.2, transparent: false, category: 'redstone' },
  { id: 'minecraft:heavy_weighted_pressure_plate', name: 'Heavy Weighted Pressure Plate', nameZh: '重质weighted压力板', color: '#E8E8E8', hardness: 5.0, transparent: true, category: 'redstone' },
  { id: 'minecraft:light_weighted_pressure_plate', name: 'Light Weighted Pressure Plate', nameZh: '轻质weighted压力板', color: '#FFAA00', hardness: 0.5, transparent: true, category: 'redstone' },
  { id: 'minecraft:stone_pressure_plate', name: 'Stone Pressure Plate', nameZh: '石质压力板', color: '#909090', hardness: 0.5, transparent: true, category: 'redstone' },
  { id: 'minecraft:tripwire_hook', name: 'Tripwire Hook', nameZh: '绊线钩', color: '#BC9862', hardness: 0.0, transparent: true, category: 'redstone' },

  // Decoration blocks
  { id: 'minecraft:oak_stairs', name: 'Oak Stairs', nameZh: '橡木楼梯', color: '#BC9862', hardness: 2.0, transparent: false, category: 'decoration' },
  { id: 'minecraft:oak_slab', name: 'Oak Slab', nameZh: '橡木台阶', color: '#BC9862', hardness: 2.0, transparent: true, category: 'decoration' },
  { id: 'minecraft:stone_stairs', name: 'Stone Stairs', nameZh: '石楼梯', color: '#808080', hardness: 1.5, transparent: false, category: 'decoration' },
  { id: 'minecraft:torch', name: 'Torch', nameZh: '火把', color: '#FFAA00', hardness: 0.0, transparent: true, category: 'decoration' },
  { id: 'minecraft:soul_torch', name: 'Soul Torch', nameZh: '灵魂火把', color: '#6699CC', hardness: 0.0, transparent: true, category: 'decoration' },
  { id: 'minecraft:ladder', name: 'Ladder', nameZh: '梯子', color: '#BC9862', hardness: 0.4, transparent: true, category: 'decoration' },
  { id: 'minecraft:iron_bars', name: 'Iron Bars', nameZh: '铁栏杆', color: '#404040', hardness: 5.0, transparent: true, category: 'decoration' },
  { id: 'minecraft:chain', name: 'Chain', nameZh: '锁链', color: '#505050', hardness: 3, transparent: true, category: 'decoration' },

  // Utility blocks
  { id: 'minecraft:crafting_table', name: 'Crafting Table', nameZh: '工作台', color: '#BC9862', hardness: 2.5, transparent: false, category: 'utility' },
  { id: 'minecraft:furnace', name: 'Furnace', nameZh: '熔炉', color: '#808080', hardness: 3.5, transparent: false, category: 'utility' },
  { id: 'minecraft:chest', name: 'Chest', nameZh: '箱子', color: '#BC9862', hardness: 2.5, transparent: false, category: 'utility' },
  { id: 'minecraft:ender_chest', name: 'Ender Chest', nameZh: '末影箱', color: '#2A2A4A', hardness: 22.5, transparent: false, category: 'utility' },
  { id: 'minecraft:iron_block', name: 'Block of Iron', nameZh: '铁块', color: '#E8E8E8', hardness: 5.0, transparent: false, category: 'utility' },
  { id: 'minecraft:gold_block', name: 'Block of Gold', nameZh: '金块', color: '#FFAA00', hardness: 3.0, transparent: false, category: 'utility' },
  { id: 'minecraft:diamond_block', name: 'Block of Diamond', nameZh: '钻石块', color: '#4AEDD9', hardness: 5.0, transparent: false, category: 'utility' },
  { id: 'minecraft:netherite_block', name: 'Block of Netherite', nameZh: '下界合金块', color: '#4A4A52', hardness: 50, transparent: false, category: 'utility' },

  // Bounce blocks (for pearl cannons)
  { id: 'minecraft:slime_block', name: 'Slime Block', nameZh: '史莱姆方块', color: '#7FCC19', hardness: 0.0, transparent: false, category: 'redstone' },
  { id: 'minecraft:honey_block', name: 'Honey Block', nameZh: '蜂蜜块', color: '#E4A128', hardness: 0.0, transparent: false, category: 'redstone' },
  { id: 'minecraft:honeycomb_block', name: 'Honeycomb Block', nameZh: '蜜脾块', color: '#DDA62B', hardness: 0.0, transparent: false, category: 'redstone' },

  // Target block (for pearl cannons)
  { id: 'minecraft:target', name: 'Target', nameZh: '标靶', color: '#CC3333', hardness: 0.5, transparent: false, category: 'redstone' },

  // Sculk blocks
  { id: 'minecraft:sculk_sensor', name: 'Sculk Sensor', nameZh: '幽匿传感器', color: '#1A5F5F', hardness: 1.8, transparent: false, category: 'redstone' },
  { id: 'minecraft:sculk_catalyst', name: 'Sculk Catalyst', nameZh: '幽匿催发体', color: '#1A4F4F', hardness: 1.8, transparent: false, category: 'redstone' },
  { id: 'minecraft:sculk_shrieker', name: 'Sculk Shrieker', nameZh: '幽匿哀嚎者', color: '#1A3F3F', hardness: 1.8, transparent: false, category: 'redstone' },
]

export function getBlockById(id: string): BlockData | undefined {
  return BLOCKS.find(b => b.id === id)
}

export function getBlocksByCategory(category: BlockCategory): BlockData[] {
  return BLOCKS.filter(b => b.category === category)
}
