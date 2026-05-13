import { BlockPlacement } from '@/types';

export interface BuildingExample {
  name: string;
  description: string;
  config: {
    type: 'house' | 'tower' | 'castle' | 'village' | 'farm' | 'bridge' | 'wall';
    size: { width: number; height: number; depth: number };
    style: 'modern' | 'medieval' | 'rustic' | 'fantasy' | 'industrial';
    materials: {
      primary: string;
      secondary: string;
      accent: string;
      roof: string;
      foundation: string;
    };
    features: string[];
  };
  tips: string[];
}

export const BuildingExamples: BuildingExample[] = [
  {
    name: '简约小木屋',
    description: '适合新手的简单木质房屋建筑',
    config: {
      type: 'house',
      size: { width: 8, height: 6, depth: 8 },
      style: 'rustic',
      materials: {
        primary: 'minecraft:oak_planks',
        secondary: 'minecraft:spruce_planks',
        accent: 'minecraft:glass_pane',
        roof: 'minecraft:oak_stairs',
        foundation: 'minecraft:cobblestone'
      },
      features: ['porch']
    },
    tips: [
      '适合地形平坦的生存服务器',
      '可以快速搭建作为临时住所',
      '建议在周围添加栅栏防护'
    ]
  },
  {
    name: '中世纪城堡',
    description: '带有护城河和塔楼的宏伟城堡',
    config: {
      type: 'castle',
      size: { width: 30, height: 12, depth: 30 },
      style: 'medieval',
      materials: {
        primary: 'minecraft:cobblestone',
        secondary: 'minecraft:mossy_cobblestone',
        accent: 'minecraft:iron_bars',
        roof: 'minecraft:cobblestone_stairs',
        foundation: 'minecraft:stone'
      },
      features: ['battlements', 'moat', 'gate']
    },
    tips: [
      '需要较大的平坦地形',
      '建议使用WorldEdit快速施工',
      '可以添加红石机关制作自动门'
    ]
  },
  {
    name: '观景塔',
    description: '高耸的观景塔，可俯瞰全图',
    config: {
      type: 'tower',
      size: { width: 7, height: 25, depth: 7 },
      style: 'fantasy',
      materials: {
        primary: 'minecraft:quartz_block',
        secondary: 'minecraft:smooth_stone',
        accent: 'minecraft:sea_lantern',
        roof: 'minecraft:quartz_stairs',
        foundation: 'minecraft:polished_granite'
      },
      features: ['balcony', 'flag']
    },
    tips: [
      '建在高地可以获得更好的视野',
      '可以添加螺旋楼梯节省空间',
      '顶部适合放置信标'
    ]
  },
  {
    name: '农场',
    description: '自动化农场，包含农田和谷仓',
    config: {
      type: 'farm',
      size: { width: 20, height: 6, depth: 20 },
      style: 'rustic',
      materials: {
        primary: 'minecraft:oak_planks',
        secondary: 'minecraft:dark_oak_planks',
        accent: 'minecraft:glass',
        roof: 'minecraft:oak_stairs',
        foundation: 'minecraft:cobblestone'
      },
      features: ['barn', 'fencing']
    },
    tips: [
      '规划好灌溉系统',
      '谷仓可以存放农业用品',
      '建议靠近水源建造'
    ]
  },
  {
    name: '石桥',
    description: '横跨河流或峡谷的石桥',
    config: {
      type: 'bridge',
      size: { width: 5, height: 8, depth: 20 },
      style: 'medieval',
      materials: {
        primary: 'minecraft:stone_bricks',
        secondary: 'minecraft:cobblestone',
        accent: 'minecraft:iron_bars',
        roof: 'minecraft:stone_brick_stairs',
        foundation: 'minecraft:stone'
      },
      features: ['railings', 'pillars']
    },
    tips: [
      '两侧需要有支撑点',
      '桥墩可以使用活塞建造',
      '栏杆增加安全性'
    ]
  },
  {
    name: '城墙',
    description: '保护城镇的坚固城墙',
    config: {
      type: 'wall',
      size: { width: 50, height: 8, depth: 3 },
      style: 'medieval',
      materials: {
        primary: 'minecraft:stone',
        secondary: 'minecraft:cobblestone',
        accent: 'minecraft:iron_bars',
        roof: 'minecraft:cobblestone_stairs',
        foundation: 'minecraft:cobblestone'
      },
      features: ['battlements', 'towers', 'gate']
    },
    tips: [
      '围绕城镇中心建造',
      '塔楼间隔不要太远',
      '城门使用铁门增加安全性'
    ]
  },
  {
    name: '现代别墅',
    description: '时尚简约的现代风格建筑',
    config: {
      type: 'house',
      size: { width: 15, height: 10, depth: 12 },
      style: 'modern',
      materials: {
        primary: 'minecraft:concrete',
        secondary: 'minecraft:polished_diorite',
        accent: 'minecraft:glass',
        roof: 'minecraft:quartz_block',
        foundation: 'minecraft:polished_andesite'
      },
      features: ['balcony', 'pool']
    },
    tips: [
      '使用混凝土打造平滑外墙',
      '落地窗增加采光',
      '屋顶可以做成平顶花园'
    ]
  },
  {
    name: '村庄',
    description: '包含多栋房屋的完整村落',
    config: {
      type: 'village',
      size: { width: 40, height: 6, depth: 40 },
      style: 'rustic',
      materials: {
        primary: 'minecraft:oak_planks',
        secondary: 'minecraft:spruce_planks',
        accent: 'minecraft:glass_pane',
        roof: 'minecraft:spruce_stairs',
        foundation: 'minecraft:cobblestone'
      },
      features: ['well', 'paths', 'farm']
    },
    tips: [
      '房屋风格可以略有变化',
      '小路连接各个建筑',
      '中心可以放置村庄钟'
    ]
  }
];

export function getExampleByName(name: string): BuildingExample | undefined {
  return BuildingExamples.find(example => example.name === name);
}

export function getExamplesByType(type: BuildingExample['config']['type']): BuildingExample[] {
  return BuildingExamples.filter(example => example.config.type === type);
}

export function getExamplesByStyle(style: BuildingExample['config']['style']): BuildingExample[] {
  return BuildingExamples.filter(example => example.config.style === style);
}

export default BuildingExamples;
