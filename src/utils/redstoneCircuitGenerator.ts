import { BlockPlacement, RedstoneCircuitType } from '@/types';

export interface RedstoneCircuitConfig {
  type: RedstoneCircuitType;
  size?: {
    length?: number;
    width?: number;
    height?: number;
  };
  complexity?: 'simple' | 'medium' | 'advanced';
}

export type { RedstoneCircuitType };

export interface RedstoneCircuitResult {
  blocks: BlockPlacement[];
  description: string;
  descriptionZh: string;
  tips: string[];
}

export class RedstoneCircuitGenerator {
  private static instance: RedstoneCircuitGenerator;

  static getInstance(): RedstoneCircuitGenerator {
    if (!RedstoneCircuitGenerator.instance) {
      RedstoneCircuitGenerator.instance = new RedstoneCircuitGenerator();
    }
    return RedstoneCircuitGenerator.instance;
  }

  generate(config: RedstoneCircuitConfig): RedstoneCircuitResult {
    const { type, size = {}, complexity = 'simple' } = config;
    const blocks: BlockPlacement[] = [];

    switch (type) {
      case 'lever_switch':
        return this.generateLeverSwitch(blocks, size);
      case 'button_door':
        return this.generateButtonDoor(blocks, size);
      case 'pressure_plate_trap':
        return this.generatePressurePlateTrap(blocks, size);
      case 'piston_pusher':
        return this.generatePistonPusher(blocks, size, complexity);
      case 'redstone_clock':
        return this.generateRedstoneClock(blocks, size);
      case 'tnt_cannon':
        return this.generateTNTCannon(blocks, size);
      case 'auto_farm':
        return this.generateAutoFarm(blocks, size);
      case 'elevator':
        return this.generateElevator(blocks, size, complexity);
      case 'storage_system':
        return this.generateStorageSystem(blocks, size);
      case 'light_sensor':
        return this.generateLightSensor(blocks, size);
      case 'combination_lock':
        return this.generateCombinationLock(blocks, size);
      case 'sequential_logic':
        return this.generateSequentialLogic(blocks, size, complexity);
      default:
        return this.generateLeverSwitch(blocks, size);
    }
  }

  private generateLeverSwitch(blocks: BlockPlacement[], size: any): RedstoneCircuitResult {
    const baseX = 0, baseY = 0, baseZ = 0;
    const leverX = baseX + 2;

    blocks.push({ x: leverX, y: baseY, z: baseZ, blockId: 'minecraft:lever' });
    blocks.push({ x: leverX - 1, y: baseY, z: baseZ, blockId: 'minecraft:redstone_wire' });
    
    for (let i = 0; i < 5; i++) {
      blocks.push({ x: leverX - 2 - i, y: baseY, z: baseZ, blockId: 'minecraft:redstone_wire' });
      if (i < 4) {
        blocks.push({ x: leverX - 2 - i, y: baseY + 1, z: baseZ, blockId: 'minecraft:redstone_torch' });
      }
    }

    blocks.push({ x: leverX - 6, y: baseY, z: baseZ, blockId: 'minecraft:redstone_lamp' });

    return {
      blocks,
      description: 'A simple lever-controlled redstone lamp circuit',
      descriptionZh: '一个简单的拉杆控制红石灯电路',
      tips: [
        '拉杆切换开关状态',
        '红石中继器延长信号',
        '可以添加更多中继器增加延迟',
        '适用于简单的开关控制'
      ]
    };
  }

  private generateButtonDoor(blocks: BlockPlacement[], size: any): RedstoneCircuitResult {
    const doorWidth = size.width || 3;
    const doorHeight = size.height || 4;
    const baseX = 0, baseY = 0, baseZ = 0;

    blocks.push({ x: baseX, y: baseY + 1, z: baseZ + 2, blockId: 'minecraft:stone_button' });
    blocks.push({ x: baseX - 1, y: baseY, z: baseZ + 2, blockId: 'minecraft:redstone_wire' });
    blocks.push({ x: baseX - 2, y: baseY, z: baseZ + 2, blockId: 'minecraft:redstone_repeater' });
    
    for (let x = 0; x < doorWidth; x++) {
      for (let y = 0; y < doorHeight; y++) {
        const centerOffset = Math.abs(x - Math.floor(doorWidth / 2));
        const isDoorSpace = centerOffset < 1 && y < 2;
        
        if (!isDoorSpace) {
          if (y === doorHeight - 1) {
            blocks.push({ x: baseX + x, y: baseY + y, z: baseZ, blockId: 'minecraft:oak_planks' });
            blocks.push({ x: baseX + x, y: baseY + y, z: baseZ + 1, blockId: 'minecraft:oak_planks' });
          } else {
            blocks.push({ x: baseX + x, y: baseY + y, z: baseZ, blockId: 'minecraft:oak_door' });
          }
        }
      }
    }

    for (let x = 0; x < doorWidth; x++) {
      blocks.push({ x: baseX + x, y: baseY + doorHeight, z: baseZ + 1, blockId: 'minecraft:oak_planks' });
      blocks.push({ x: baseX + x, y: baseY + doorHeight + 1, z: baseZ + 1, blockId: 'minecraft:oak_stairs' });
    }

    blocks.push({ x: baseX - 1, y: baseY, z: baseZ + 1, blockId: 'minecraft:sticky_piston' });
    blocks.push({ x: baseX - 1, y: baseY, z: baseZ + 2, blockId: 'minecraft:slime_block' });

    return {
      blocks,
      description: 'A button-controlled door with auto-close mechanism',
      descriptionZh: '按钮控制的自动关门门',
      tips: [
        '石质按钮提供0.1秒脉冲',
        '需要中继器延长信号',
        '粘性活塞推动史莱姆块',
        '史莱姆块带动门打开',
        '可添加压力板实现自动关门'
      ]
    };
  }

  private generatePressurePlateTrap(blocks: BlockPlacement[], size: any): RedstoneCircuitResult {
    const baseX = 0, baseY = 0, baseZ = 0;
    const trapLength = size.length || 5;

    blocks.push({ x: baseX, y: baseY, z: baseZ, blockId: 'minecraft:stone_pressure_plate' });
    blocks.push({ x: baseX - 1, y: baseY, z: baseZ, blockId: 'minecraft:redstone_wire' });
    blocks.push({ x: baseX - 2, y: baseY, z: baseZ, blockId: 'minecraft:redstone_repeater' });
    blocks.push({ x: baseX - 3, y: baseY, z: baseZ, blockId: 'minecraft:redstone_wire' });

    for (let z = 1; z < trapLength; z++) {
      blocks.push({ x: baseX, y: baseY, z: baseZ + z, blockId: 'minecraft:air' });
      blocks.push({ x: baseX - 4, y: baseY, z: baseZ + z, blockId: 'minecraft:cobblestone' });
      blocks.push({ x: baseX + 1, y: baseY, z: baseZ + z, blockId: 'minecraft:cobblestone' });
      
      if (z === trapLength - 1) {
        blocks.push({ x: baseX, y: baseY - 1, z: baseZ + z, blockId: 'minecraft:lava' });
        blocks.push({ x: baseX, y: baseY - 1, z: baseZ + z - 1, blockId: 'minecraft:tnt' });
      }
    }

    return {
      blocks,
      description: 'A pressure plate activated trap with TNT',
      descriptionZh: '压力板触发的TNT陷阱',
      tips: [
        '压力板检测实体',
        '中继器延迟信号',
        '可使用绊线替代压力板',
        'TNT放置在岩浆上方',
        '陷阱触发后需要重置'
      ]
    };
  }

  private generatePistonPusher(blocks: BlockPlacement[], size: any, complexity: string): RedstoneCircuitResult {
    const baseX = 0, baseY = 0, baseZ = 0;
    const length = size.length || 8;
    const layers = complexity === 'advanced' ? 5 : (complexity === 'medium' ? 3 : 1);

    for (let z = 0; z < length; z++) {
      const isActiveLayer = z % 2 === 0;
      
      for (let x = -1; x <= 1; x++) {
        for (let y = 0; y < layers; y++) {
          if (x === 0 && y === 0) {
            blocks.push({ x: baseX, y: baseY, z: baseZ + z, blockId: 'minecraft:sticky_piston' });
            blocks.push({ x: baseX, y: baseY, z: baseZ + z + 1, blockId: 'minecraft:slime_block' });
          } else {
            blocks.push({ x: baseX + x, y: baseY + y, z: baseZ + z, blockId: 'minecraft:observer' });
          }
        }
      }

      if (isActiveLayer) {
        blocks.push({ x: baseX, y: baseY, z: baseZ + z, blockId: 'minecraft:redstone_block' });
      }
    }

    return {
      blocks,
      description: 'A multi-layer piston pusher for item transportation',
      descriptionZh: '多层活塞推送器用于物品运输',
      tips: [
        '观察者检测红石块移动',
        '粘性活塞推动物品',
        '可堆叠多层增加效率',
        '观察者堆叠形成递推链',
        '适合运输方块和物品'
      ]
    };
  }

  private generateRedstoneClock(blocks: BlockPlacement[], size: any): RedstoneCircuitResult {
    const baseX = 0, baseY = 0, baseZ = 0;
    const clockLength = size.length || 5;

    blocks.push({ x: baseX, y: baseY, z: baseZ, blockId: 'minecraft:note_block' });

    for (let i = 0; i < clockLength; i++) {
      const x = baseX - 2 - i;
      blocks.push({ x, y: baseY, z: baseZ, blockId: 'minecraft:redstone_wire' });
      blocks.push({ x, y: baseY + 1, z: baseZ, blockId: 'minecraft:redstone_torch' });
      
      if (i > 0) {
        blocks.push({ x: x, y: baseY, z: baseZ - 1, blockId: 'minecraft:redstone_wire' });
      }
    }

    blocks.push({ x: baseX - 2 - clockLength, y: baseY, z: baseZ, blockId: 'minecraft:redstone_repeater' });
    blocks.push({ x: baseX - 2 - clockLength, y: baseY, z: baseZ - 1, blockId: 'minecraft:redstone_wire' });
    blocks.push({ x: baseX - 1, y: baseY, z: baseZ - 1, blockId: 'minecraft:redstone_wire' });

    return {
      blocks,
      description: 'A redstone torch clock generator',
      descriptionZh: '红石火把脉冲发生器',
      tips: [
        '利用红石火把熄灭特性',
        '中继器控制脉冲间隔',
        '音符盒播放音效',
        '调整中继器数量改变频率',
        '可用于高速电路'
      ]
    };
  }

  private generateTNTCannon(blocks: BlockPlacement[], size: any): RedstoneCircuitResult {
    const baseX = 0, baseY = 0, baseZ = 0;
    const height = size.height || 10;

    blocks.push({ x: baseX, y: baseY, z: baseZ, blockId: 'minecraft:lever' });
    blocks.push({ x: baseX - 1, y: baseY, z: baseZ, blockId: 'minecraft:redstone_wire' });

    for (let y = 0; y < height; y++) {
      blocks.push({ x: baseX, y: baseY + y, z: baseZ + 1, blockId: 'minecraft:hopper' });
      blocks.push({ x: baseX + 1, y: baseY + y, z: baseZ + 1, blockId: 'minecraft:observer' });
      
      if (y < height - 1) {
        blocks.push({ x: baseX + 1, y: baseY + y, z: baseZ + 2, blockId: 'minecraft:sticky_piston' });
        blocks.push({ x: baseX + 1, y: baseY + y + 1, z: baseZ + 2, blockId: 'minecraft:slime_block' });
      }
    }

    blocks.push({ x: baseX, y: baseY + height, z: baseZ + 1, blockId: 'minecraft:dispenser' });

    return {
      blocks,
      description: 'A cannon that launches TNT using observers and pistons',
      descriptionZh: '使用观察者和活塞发射TNT的大炮',
      tips: [
        '漏斗提供TNT供给',
        '观察者检测漏斗激活',
        '粘性活塞推送TNT',
        '发射器射出TNT',
        '可调整高度改变射程'
      ]
    };
  }

  private generateAutoFarm(blocks: BlockPlacement[], size: any): RedstoneCircuitResult {
    const baseX = 0, baseY = 0, baseZ = 0;
    const farmSize = size.length || 9;

    for (let x = 0; x < farmSize; x++) {
      for (let z = 0; z < farmSize; z++) {
        if (x === 0 || x === farmSize - 1 || z === 0 || z === farmSize - 1) {
          blocks.push({ x: baseX + x, y: baseY, z: baseZ + z, blockId: 'minecraft:cobblestone' });
        } else {
          blocks.push({ x: baseX + x, y: baseY, z: baseZ + z, blockId: 'minecraft:farmland' });
          blocks.push({ x: baseX + x, y: baseY + 1, z: baseZ + z, blockId: 'minecraft:wheat' });
        }
      }
    }

    blocks.push({ x: baseX + Math.floor(farmSize / 2), y: baseY + 1, z: baseZ - 1, blockId: 'minecraft:hopper' });
    blocks.push({ x: baseX + Math.floor(farmSize / 2), y: baseY, z: baseZ - 2, blockId: 'minecraft:chest' });

    blocks.push({ x: baseX + farmSize, y: baseY, z: baseZ - 1, blockId: 'minecraft:water' });
    blocks.push({ x: baseX + farmSize, y: baseY, z: baseZ, blockId: 'minecraft:water' });
    blocks.push({ x: baseX + farmSize, y: baseY, z: baseZ + 1, blockId: 'minecraft:water' });

    return {
      blocks,
      description: 'An automatic wheat farm with water and collection system',
      descriptionZh: '自动小麦农场带水流收集系统',
      tips: [
        '水流推动成熟的农作物',
        '漏斗自动收集物品',
        '箱子存储收获物',
        '水需要定期补给',
        '可添加骨粉自动化'
      ]
    };
  }

  private generateElevator(blocks: BlockPlacement[], size: any, complexity: string): RedstoneCircuitResult {
    const baseX = 0, baseY = 0, baseZ = 0;
    const height = size.height || 10;
    const floors = Math.floor(height / 3);

    for (let y = 0; y < height; y++) {
      blocks.push({ x: baseX, y: baseY + y, z: baseZ, blockId: 'minecraft:magma_block' });
      blocks.push({ x: baseX, y: baseY + y, z: baseZ + 1, blockId: 'minecraft:soul_sand' });
      blocks.push({ x: baseX + 1, y: baseY + y, z: baseZ, blockId: 'minecraft:oak_fence' });
      blocks.push({ x: baseX + 1, y: baseY + y, z: baseZ + 1, blockId: 'minecraft:oak_fence' });
    }

    for (let f = 1; f <= floors; f++) {
      const fy = f * 3;
      blocks.push({ x: baseX + 2, y: baseY + fy, z: baseZ, blockId: 'minecraft:oak_button' });
      blocks.push({ x: baseX + 3, y: baseY + fy, z: baseZ, blockId: 'minecraft:redstone_wire' });
      blocks.push({ x: baseX + 4, y: baseY + fy, z: baseZ, blockId: 'minecraft:lever' });
    }

    return {
      blocks,
      description: 'A bubble elevator with call buttons on each floor',
      descriptionZh: '气泡电梯每层有呼叫按钮',
      tips: [
        '岩浆块和灵魂沙产生气泡',
        '栅栏防止玩家跳出',
        '按钮调用电梯',
        '可到达任意高度',
        '需要实体乘坐'
      ]
    };
  }

  private generateStorageSystem(blocks: BlockPlacement[], size: any): RedstoneCircuitResult {
    const baseX = 0, baseY = 0, baseZ = 0;
    const width = size.width || 5;
    const depth = size.depth || 5;

    for (let x = 0; x < width; x++) {
      for (let z = 0; z < depth; z++) {
        if (x % 2 === 0 && z % 2 === 0) {
          blocks.push({ x: baseX + x, y: baseY, z: baseZ + z, blockId: 'minecraft:hopper' });
          blocks.push({ x: baseX + x, y: baseY - 1, z: baseZ + z, blockId: 'minecraft:chest' });
          
          if (x > 0) {
            blocks.push({ x: baseX + x - 1, y: baseY, z: baseZ + z, blockId: 'minecraft:redstone_wire' });
          }
          if (z > 0) {
            blocks.push({ x: baseX + x, y: baseY, z: baseZ + z - 1, blockId: 'minecraft:redstone_wire' });
          }
        } else {
          blocks.push({ x: baseX + x, y: baseY, z: baseZ + z, blockId: 'minecraft:oak_planks' });
        }
      }
    }

    blocks.push({ x: baseX + width, y: baseY, z: baseZ, blockId: 'minecraft:dropper' });
    blocks.push({ x: baseX + width + 1, y: baseY, z: baseZ, blockId: 'minecraft:lever' });

    return {
      blocks,
      description: 'An organized item storage system with hoppers and chests',
      descriptionZh: '有序的物品存储系统带漏斗和箱子',
      tips: [
        '漏斗自动分类物品',
        '漏斗矿车可移动收集',
        '投掷器分配物品',
        '拉杆控制存储系统',
        '可扩展多个存储单元'
      ]
    };
  }

  private generateLightSensor(blocks: BlockPlacement[], size: any): RedstoneCircuitResult {
    const baseX = 0, baseY = 0, baseZ = 0;

    blocks.push({ x: baseX, y: baseY, z: baseZ, blockId: 'minecraft:daylight_detector' });
    blocks.push({ x: baseX + 1, y: baseY, z: baseZ, blockId: 'minecraft:redstone_wire' });
    blocks.push({ x: baseX + 2, y: baseY, z: baseZ, blockId: 'minecraft:redstone_torch' });
    blocks.push({ x: baseX + 2, y: baseY + 1, z: baseZ, blockId: 'minecraft:redstone_wire' });
    blocks.push({ x: baseX + 3, y: baseY, z: baseZ, blockId: 'minecraft:lever' });
    blocks.push({ x: baseX + 4, y: baseY, z: baseZ, blockId: 'minecraft:redstone_lamp' });

    return {
      blocks,
      description: 'A daylight sensor that controls redstone lamps',
      descriptionZh: '阳光探测器控制红石灯',
      tips: [
        '阳光探测器检测光照',
        '红石火把反转信号',
        '拉杆手动覆盖控制',
        '白天自动点亮',
        '夜间需要手动开启'
      ]
    };
  }

  private generateCombinationLock(blocks: BlockPlacement[], size: any): RedstoneCircuitResult {
    const baseX = 0, baseY = 0, baseZ = 0;
    const numButtons = 4;

    for (let i = 0; i < numButtons; i++) {
      const x = baseX + i * 2;
      blocks.push({ x, y: baseY, z: baseZ, blockId: 'minecraft:stone_button' });
      blocks.push({ x: x, y: baseY + 1, z: baseZ, blockId: 'minecraft:redstone_torch' });
      blocks.push({ x: x - 1, y: baseY, z: baseZ, blockId: 'minecraft:redstone_wire' });
    }

    for (let i = 0; i < numButtons - 1; i++) {
      const x = baseX + i * 2 + 1;
      blocks.push({ x, y: baseY, z: baseZ - 1, blockId: 'minecraft:redstone_repeater' });
      blocks.push({ x, y: baseY, z: baseZ - 2, blockId: 'minecraft:redstone_wire' });
    }

    blocks.push({ x: baseX + (numButtons - 1) * 2 + 1, y: baseY, z: baseZ - 2, blockId: 'minecraft:comparator' });
    blocks.push({ x: baseX + (numButtons - 1) * 2 + 1, y: baseY, z: baseZ - 3, blockId: 'minecraft:oak_door' });

    return {
      blocks,
      description: 'A 4-button combination lock using comparators',
      descriptionZh: '使用比较器的4按钮密码锁',
      tips: [
        '按钮对应特定序列',
        '比较器检测信号组合',
        '可调整按钮数量',
        '需要正确顺序激活',
        '密码正确时门打开'
      ]
    };
  }

  private generateSequentialLogic(blocks: BlockPlacement[], size: any, complexity: string): RedstoneCircuitResult {
    const baseX = 0, baseY = 0, baseZ = 0;
    const stages = complexity === 'advanced' ? 4 : (complexity === 'medium' ? 3 : 2);

    blocks.push({ x: baseX, y: baseY, z: baseZ, blockId: 'minecraft:lever' });
    
    for (let i = 0; i < stages; i++) {
      const x = baseX + i * 3;
      
      blocks.push({ x: x + 1, y: baseY, z: baseZ, blockId: 'minecraft:redstone_repeater' });
      blocks.push({ x: x + 1, y: baseY, z: baseZ + 1, blockId: 'minecraft:observer' });
      blocks.push({ x: x + 2, y: baseY, z: baseZ, blockId: 'minecraft:redstone_wire' });
      blocks.push({ x: x + 2, y: baseY, z: baseZ - 1, blockId: 'minecraft:redstone_torch' });
      
      blocks.push({ x: x + 2, y: baseY, z: baseZ + 1, blockId: 'minecraft:sticky_piston' });
      blocks.push({ x: x + 3, y: baseY, z: baseZ + 1, blockId: 'minecraft:slime_block' });
    }

    blocks.push({ x: baseX + stages * 3, y: baseY, z: baseZ, blockId: 'minecraft:redstone_lamp' });

    return {
      blocks,
      description: 'A sequential logic circuit using observers and pistons',
      descriptionZh: '使用观察者和活塞的顺序逻辑电路',
      tips: [
        '观察者检测活塞移动',
        '中继器添加延迟',
        '每级顺序触发',
        '史莱姆块传递信号',
        '可用于自动序列发生器'
      ]
    };
  }
}

export default RedstoneCircuitGenerator;
