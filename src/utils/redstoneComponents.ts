export interface RedstoneComponent {
  id: string;
  name: string;
  nameZh: string;
  category: RedstoneCategory;
  description: string;
  descriptionZh: string;
  properties: {
    canConnectTo?: string[];
    providesPower?: number;
    maxPower?: number;
    isTransparent?: boolean;
    isSolid?: boolean;
    isRepeater?: boolean;
    delay?: number;
    isComparator?: boolean;
    mode?: 'compare' | 'subtract';
  };
  behaviors: RedstoneBehavior[];
}

export type RedstoneCategory = 
  | 'power'
  | 'conductor'
  | 'transmitter'
  | 'receiver'
  | 'logic'
  | 'storage'
  | 'transducer';

export interface RedstoneBehavior {
  type: string;
  description: string;
  descriptionZh: string;
}

export const REDSTONE_COMPONENTS: Record<string, RedstoneComponent> = {
  'minecraft:redstone_block': {
    id: 'minecraft:redstone_block',
    name: 'Redstone Block',
    nameZh: '红石块',
    category: 'power',
    description: 'A block that emits redstone power in all directions',
    descriptionZh: '向所有方向发射红石信号的方块',
    properties: {
      providesPower: 15,
      isSolid: true,
      canConnectTo: ['redstone', 'redstone_torch', 'repeater', 'comparator', 'lever', 'button', 'pressure_plate', 'tripwire_hook']
    },
    behaviors: [
      { type: 'always_active', description: 'Always emits power', descriptionZh: '始终激活' },
      { type: 'power_output', description: 'Outputs 15 power to all adjacent blocks', descriptionZh: '向所有相邻方块输出15级红石信号' }
    ]
  },

  'minecraft:redstone_torch': {
    id: 'minecraft:redstone_torch',
    name: 'Redstone Torch',
    nameZh: '红石火把',
    category: 'power',
    description: 'A torch that provides redstone power when attached to a block',
    descriptionZh: '依附于方块时提供红石信号的火把',
    properties: {
      providesPower: 15,
      canConnectTo: ['redstone', 'repeater', 'comparator']
    },
    behaviors: [
      { type: 'inverted', description: 'Inverts the signal of the block it is attached to', descriptionZh: '反转依附方块的信号' },
      { type: 'dependency', description: 'Loses power when attached block receives power', descriptionZh: '当依附的方块收到信号时失去能量' }
    ]
  },

  'minecraft:lever': {
    id: 'minecraft:lever',
    name: 'Lever',
    nameZh: '拉杆',
    category: 'power',
    description: 'A switch that can be toggled on and off',
    descriptionZh: '可切换开关状态的拉杆',
    properties: {
      providesPower: 15,
      canConnectTo: ['redstone', 'repeater', 'comparator']
    },
    behaviors: [
      { type: 'toggle', description: 'Can be toggled between on and off states', descriptionZh: '可在开启和关闭状态间切换' },
      { type: 'persistent', description: 'Maintains state when not interacted with', descriptionZh: '不交互时保持状态' }
    ]
  },

  'minecraft:stone_button': {
    id: 'minecraft:stone_button',
    name: 'Stone Button',
    nameZh: '石质按钮',
    category: 'power',
    description: 'A button that provides a temporary signal when pressed',
    descriptionZh: '按下时提供临时信号的按钮',
    properties: {
      providesPower: 15,
      canConnectTo: ['redstone', 'repeater', 'comparator']
    },
    behaviors: [
      { type: 'momentary', description: 'Only provides signal when pressed', descriptionZh: '仅在按下时提供信号' },
      { type: 'pulse', description: 'Sends a short pulse (0.1s)', descriptionZh: '发送短脉冲(0.1秒)' }
    ]
  },

  'minecraft:oak_button': {
    id: 'minecraft:oak_button',
    name: 'Oak Button',
    nameZh: '橡木按钮',
    category: 'power',
    description: 'A wooden button with longer press duration',
    descriptionZh: '按压时间更长的木质按钮',
    properties: {
      providesPower: 15,
      canConnectTo: ['redstone', 'repeater', 'comparator']
    },
    behaviors: [
      { type: 'momentary', description: 'Only provides signal when pressed', descriptionZh: '仅在按下时提供信号' },
      { type: 'pulse', description: 'Sends a longer pulse (0.5s)', descriptionZh: '发送较长脉冲(0.5秒)' }
    ]
  },

  'minecraft:stone_pressure_plate': {
    id: 'minecraft:stone_pressure_plate',
    name: 'Stone Pressure Plate',
    nameZh: '石质压力板',
    category: 'power',
    description: 'A pressure plate that activates when an entity stands on it',
    descriptionZh: '有实体站在上面时激活的压力板',
    properties: {
      providesPower: 15,
      canConnectTo: ['redstone', 'repeater', 'comparator']
    },
    behaviors: [
      { type: 'entity_trigger', description: 'Activates when any entity is on it', descriptionZh: '任何实体在上方时激活' },
      { type: 'bistable', description: 'Stays on while entity is present', descriptionZh: '实体存在时保持激活' }
    ]
  },

  'minecraft:heavy_weighted_pressure_plate': {
    id: 'minecraft:heavy_weighted_pressure_plate',
    name: 'Heavy Weighted Pressure Plate',
    nameZh: '重质重量压力板',
    category: 'power',
    description: 'A pressure plate that measures entity weight',
    descriptionZh: '测量实体重量的压力板',
    properties: {
      providesPower: 15,
      maxPower: 150,
      canConnectTo: ['redstone', 'repeater', 'comparator']
    },
    behaviors: [
      { type: 'analog', description: 'Power level based on entity weight', descriptionZh: '信号强度基于实体重量' },
      { type: 'entity_trigger', description: 'Activates based on total entity weight', descriptionZh: '基于实体总重量激活' }
    ]
  },

  'minecraft:light_weighted_pressure_plate': {
    id: 'minecraft:light_weighted_pressure_plate',
    name: 'Light Weighted Pressure Plate',
    nameZh: '轻质重量压力板',
    category: 'power',
    description: 'A pressure plate optimized for counting entities',
    descriptionZh: '优化用于计数的压力板',
    properties: {
      providesPower: 15,
      maxPower: 15,
      canConnectTo: ['redstone', 'repeater', 'comparator']
    },
    behaviors: [
      { type: 'analog', description: 'Power level based on entity count', descriptionZh: '信号强度基于实体数量' },
      { type: 'counting', description: 'Each entity adds 1 to power level', descriptionZh: '每个实体增加1级信号' }
    ]
  },

  'minecraft:tripwire_hook': {
    id: 'minecraft:tripwire_hook',
    name: 'Tripwire Hook',
    nameZh: '绊线钩',
    category: 'power',
    description: 'Detects entities passing through a tripwire',
    descriptionZh: '检测穿过绊线的实体',
    properties: {
      providesPower: 15,
      canConnectTo: ['redstone', 'repeater', 'comparator']
    },
    behaviors: [
      { type: 'trigger', description: 'Activates when tripwire is broken', descriptionZh: '绊线断开时激活' },
      { type: 'sensitive', description: 'Can detect any entity', descriptionZh: '可检测任何实体' }
    ]
  },

  'minecraft:daylight_detector': {
    id: 'minecraft:daylight_detector',
    name: 'Daylight Detector',
    nameZh: '阳光探测器',
    category: 'power',
    description: 'Detects sunlight and outputs redstone signal',
    descriptionZh: '检测阳光并输出红石信号',
    properties: {
      providesPower: 15,
      canConnectTo: ['redstone', 'repeater', 'comparator']
    },
    behaviors: [
      { type: 'ambient', description: 'Signal varies with sunlight intensity', descriptionZh: '信号随阳光强度变化' },
      { type: 'invertable', description: 'Can be inverted with redstone torch', descriptionZh: '可用红石火把反转' }
    ]
  },

  'minecraft:trapped_chest': {
    id: 'minecraft:trapped_chest',
    name: 'Trapped Chest',
    nameZh: '陷阱箱',
    category: 'power',
    description: 'A chest that emits redstone signal when opened',
    descriptionZh: '打开时发出红石信号的箱子',
    properties: {
      providesPower: 15,
      canConnectTo: ['redstone', 'repeater', 'comparator']
    },
    behaviors: [
      { type: 'trigger', description: 'Emits signal when opened', descriptionZh: '打开时发出信号' },
      { type: 'capacity', description: 'Signal strength based on player count', descriptionZh: '信号强度基于玩家数量' }
    ]
  },

  'minecraft:redstone_wire': {
    id: 'minecraft:redstone_wire',
    name: 'Redstone Dust',
    nameZh: '红石粉',
    category: 'conductor',
    description: 'Conducts redstone power in all directions',
    descriptionZh: '向所有方向传导红石信号',
    properties: {
      canConnectTo: ['redstone', 'redstone_torch', 'repeater', 'comparator', 'lever', 'button', 'pressure_plate', 'tripwire_hook', 'daylight_detector', 'trapped_chest', 'observer', 'hopper', 'powered_rail', 'detector_rail', 'lightning_rod']
    },
    behaviors: [
      { type: 'conduction', description: 'Conducts power to adjacent components', descriptionZh: '向相邻组件传导信号' },
      { type: 'attenuation', description: 'Power decreases by 1 per block', descriptionZh: '每格减少1级信号' },
      { type: 'connection', description: 'Connects to compatible components', descriptionZh: '连接到兼容组件' }
    ]
  },

  'minecraft:repeater': {
    id: 'minecraft:repeater',
    name: 'Redstone Repeater',
    nameZh: '红石中继器',
    category: 'transmitter',
    description: 'Extends and amplifies redstone signals',
    descriptionZh: '延长和增强红石信号',
    properties: {
      providesPower: 15,
      canConnectTo: ['redstone'],
      isRepeater: true,
      delay: 1
    },
    behaviors: [
      { type: 'repeat', description: 'Outputs the same signal it receives', descriptionZh: '输出与输入相同的信号' },
      { type: 'delay', description: 'Introduces configurable delay (1-4 ticks)', descriptionZh: '引入可配置的延迟(1-4刻)' },
      { type: 'diode', description: 'Only allows signal in one direction', descriptionZh: '仅允许单向信号' },
      { type: 'boost', description: 'Restores signal to full strength', descriptionZh: '恢复信号至满强度' }
    ]
  },

  'minecraft:comparator': {
    id: 'minecraft:comparator',
    name: 'Redstone Comparator',
    nameZh: '红石比较器',
    category: 'logic',
    description: 'Compares or subtracts redstone signals',
    descriptionZh: '比较或减去红石信号',
    properties: {
      providesPower: 15,
      canConnectTo: ['redstone'],
      isComparator: true,
      mode: 'compare'
    },
    behaviors: [
      { type: 'compare', description: 'Outputs signal if side >= back', descriptionZh: '如果侧面>=后面则输出' },
      { type: 'subtract', description: 'Outputs signal = side - back', descriptionZh: '输出信号 = 侧面 - 后面' },
      { type: 'measure', description: 'Can measure container contents', descriptionZh: '可测量容器内容物' },
      { type: 'signal', description: 'Outputs signal strength from containers', descriptionZh: '从容器输出信号强度' }
    ]
  },

  'minecraft:observer': {
    id: 'minecraft:observer',
    name: 'Observer',
    nameZh: '观察者',
    category: 'receiver',
    description: 'Detects block state changes',
    descriptionZh: '检测方块状态变化',
    properties: {
      providesPower: 15,
      canConnectTo: ['redstone']
    },
    behaviors: [
      { type: 'detect', description: 'Detects changes in adjacent block', descriptionZh: '检测相邻方块的变化' },
      { type: 'pulse', description: 'Emits pulse when change detected', descriptionZh: '检测到变化时发送脉冲' },
      { type: 'instant', description: 'Reacts immediately to changes', descriptionZh: '即时响应变化' }
    ]
  },

  'minecraft:piston': {
    id: 'minecraft:piston',
    name: 'Piston',
    nameZh: '活塞',
    category: 'transducer',
    description: 'Pushes blocks when activated',
    descriptionZh: '激活时推动方块',
    properties: {
      isSolid: true
    },
    behaviors: [
      { type: 'push', description: 'Pushes up to 12 blocks', descriptionZh: '最多推动12个方块' },
      { type: 'extend', description: 'Extends when powered', descriptionZh: '通电时伸出' },
      { type: 'retract', description: 'Does not pull blocks back', descriptionZh: '不会拉回方块' }
    ]
  },

  'minecraft:sticky_piston': {
    id: 'minecraft:sticky_piston',
    name: 'Sticky Piston',
    nameZh: '粘性活塞',
    category: 'transducer',
    description: 'Pushes and pulls blocks when activated',
    descriptionZh: '激活时推动和拉回方块',
    properties: {
      isSolid: true
    },
    behaviors: [
      { type: 'push', description: 'Pushes up to 12 blocks', descriptionZh: '最多推动12个方块' },
      { type: 'pull', description: 'Pulls back the block it pushed', descriptionZh: '拉回它推动的方块' },
      { type: 'limited', description: 'Cannot pull mobs or entities', descriptionZh: '不能拉回生物或实体' }
    ]
  },

  'minecraft:hopper': {
    id: 'minecraft:hopper',
    name: 'Hopper',
    nameZh: '漏斗',
    category: 'storage',
    description: 'Transfers items between containers',
    descriptionZh: '在容器间转移物品',
    properties: {
      isSolid: true,
      canConnectTo: ['redstone']
    },
    behaviors: [
      { type: 'collect', description: 'Collects items from above', descriptionZh: '从上方收集物品' },
      { type: 'transfer', description: 'Transfers items to container below', descriptionZh: '向下方容器转移物品' },
      { type: 'filter', description: 'Can be locked by redstone', descriptionZh: '可被红石锁定' }
    ]
  },

  'minecraft:dropper': {
    id: 'minecraft:dropper',
    name: 'Dropper',
    nameZh: '投掷器',
    category: 'transducer',
    description: 'Drops items when activated',
    descriptionZh: '激活时投掷物品',
    properties: {
      isSolid: true,
      canConnectTo: ['redstone']
    },
    behaviors: [
      { type: 'drop', description: 'Drops item in front', descriptionZh: '向前投掷物品' },
      { type: 'dispense', description: 'Can dispense items', descriptionZh: '可分发物品' }
    ]
  },

  'minecraft:dispenser': {
    id: 'minecraft:dispenser',
    name: 'Dispenser',
    nameZh: '发射器',
    category: 'transducer',
    description: 'Dispenses or activates items when triggered',
    descriptionZh: '触发时分发或激活物品',
    properties: {
      isSolid: true,
      canConnectTo: ['redstone']
    },
    behaviors: [
      { type: 'dispense', description: 'Dispenses items in front', descriptionZh: '向前分发物品' },
      { type: 'activate', description: 'Activates certain items (arrows, fireballs)', descriptionZh: '激活特定物品(箭矢、火球)' }
    ]
  },

  'minecraft:note_block': {
    id: 'minecraft:note_block',
    name: 'Note Block',
    nameZh: '音符盒',
    category: 'transducer',
    description: 'Plays a musical note when powered',
    descriptionZh: '通电时播放音符',
    properties: {
      canConnectTo: ['redstone']
    },
    behaviors: [
      { type: 'sound', description: 'Plays note when powered', descriptionZh: '通电时播放音符' },
      { type: 'pitch', description: 'Note can be changed by clicking', descriptionZh: '可通过点击改变音高' },
      { type: 'instrument', description: 'Instrument based on block below', descriptionZh: '基于下方方块的乐器' }
    ]
  },

  'minecraft:tnt': {
    id: 'minecraft:tnt',
    name: 'TNT',
    nameZh: 'TNT炸药',
    category: 'transducer',
    description: 'Explodes when triggered',
    descriptionZh: '触发时爆炸',
    properties: {},
    behaviors: [
      { type: 'explode', description: 'Explodes when activated', descriptionZh: '激活时爆炸' },
      { type: 'destroy', description: 'Destroys nearby blocks', descriptionZh: '破坏附近方块' }
    ]
  },

  'minecraft:powered_rail': {
    id: 'minecraft:powered_rail',
    name: 'Powered Rail',
    nameZh: '充能铁轨',
    category: 'power',
    description: 'Accelerates or brakes minecarts',
    descriptionZh: '加速或制动矿车',
    properties: {
      canConnectTo: ['redstone']
    },
    behaviors: [
      { type: 'power', description: 'Provides power to adjacent rails', descriptionZh: '向相邻铁轨提供能量' },
      { type: 'accelerate', description: 'Speeds up passing minecarts', descriptionZh: '加速通过的矿车' },
      { type: 'boost', description: 'Boosts minecart speed', descriptionZh: '提升矿车速度' }
    ]
  },

  'minecraft:detector_rail': {
    id: 'minecraft:detector_rail',
    name: 'Detector Rail',
    nameZh: '探测铁轨',
    category: 'power',
    description: 'Detects minecarts and emits signal',
    descriptionZh: '检测矿车并发出信号',
    properties: {
      providesPower: 15,
      canConnectTo: ['redstone']
    },
    behaviors: [
      { type: 'detect', description: 'Detects when minecart passes', descriptionZh: '检测矿车通过' },
      { type: 'signal', description: 'Emits signal when active', descriptionZh: '激活时发出信号' }
    ]
  },

  'minecraft:command_block': {
    id: 'minecraft:command_block',
    name: 'Command Block',
    nameZh: '命令方块',
    category: 'logic',
    description: 'Executes commands when powered',
    descriptionZh: '通电时执行命令',
    properties: {
      canConnectTo: ['redstone']
    },
    behaviors: [
      { type: 'execute', description: 'Executes commands', descriptionZh: '执行命令' },
      { type: 'chain', description: 'Chains to other command blocks', descriptionZh: '链接到其他命令方块' },
      { type: 'conditional', description: 'Runs when powered from behind', descriptionZh: '后方通电时运行' }
    ]
  },

  'minecraft:chain_command_block': {
    id: 'minecraft:chain_command_block',
    name: 'Chain Command Block',
    nameZh: '连锁命令方块',
    category: 'logic',
    description: 'Executes commands in sequence',
    descriptionZh: '按顺序执行命令',
    properties: {
      canConnectTo: ['redstone']
    },
    behaviors: [
      { type: 'chain', description: 'Chains after previous command block', descriptionZh: '在前一命令方块后执行' },
      { type: 'conditional', description: 'Runs when previous succeeds', descriptionZh: '前一个成功时运行' }
    ]
  },

  'minecraft:repeating_command_block': {
    id: 'minecraft:repeating_command_block',
    name: 'Repeating Command Block',
    nameZh: '循环命令方块',
    category: 'logic',
    description: 'Repeats commands every tick',
    descriptionZh: '每个游戏刻重复执行命令',
    properties: {
      canConnectTo: ['redstone']
    },
    behaviors: [
      { type: 'repeat', description: 'Repeats every tick when powered', descriptionZh: '通电时每刻重复' },
      { type: 'instant', description: 'Executes immediately', descriptionZh: '立即执行' }
    ]
  },

  'minecraft:sculk_sensor': {
    id: 'minecraft:sculk_sensor',
    name: 'Sculk Sensor',
    nameZh: '幽匿传感器',
    category: 'receiver',
    description: 'Detects vibrations and emits redstone signals',
    descriptionZh: '检测振动并发出红石信号',
    properties: {
      providesPower: 15,
      canConnectTo: ['redstone']
    },
    behaviors: [
      { type: 'vibration', description: 'Detects vibrations in range', descriptionZh: '检测范围内振动' },
      { type: 'calibrate', description: 'Different vibrations trigger different signals', descriptionZh: '不同振动触发不同信号' }
    ]
  }
};

export function getRedstoneComponent(id: string): RedstoneComponent | undefined {
  return REDSTONE_COMPONENTS[id];
}

export function getRedstoneComponentsByCategory(category: RedstoneCategory): RedstoneComponent[] {
  return Object.values(REDSTONE_COMPONENTS).filter(c => c.category === category);
}

export function getAllRedstoneComponents(): RedstoneComponent[] {
  return Object.values(REDSTONE_COMPONENTS);
}

export function canConnect(component1: string, component2: string): boolean {
  const comp1 = getRedstoneComponent(component1);
  const comp2 = getRedstoneComponent(component2);
  
  if (!comp1 || !comp2) return false;
  
  return comp1.properties.canConnectTo?.includes(component2) || 
         comp2.properties.canConnectTo?.includes(component1);
}

export default REDSTONE_COMPONENTS;
