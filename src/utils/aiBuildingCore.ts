import { BlockPlacement, BlockProperties } from '@/types';
import { BLOCKS } from '@/utils/blocks';

export interface BuildingConfig {
  type: 'house' | 'tower' | 'castle' | 'village' | 'farm' | 'bridge' | 'wall' | 'custom';
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
}

export interface AIGenerationRequest {
  description: string;
  config: Partial<BuildingConfig>;
  seed?: number;
}

export interface GenerationProgress {
  stage: 'analyzing' | 'designing' | 'building' | 'optimizing' | 'complete';
  progress: number;
  message: string;
}

export class AIBuildingCore {
  private static instance: AIBuildingCore;
  private structureCache: Map<string, BlockPlacement[]>;

  static getInstance(): AIBuildingCore {
    if (!AIBuildingCore.instance) {
      AIBuildingCore.instance = new AIBuildingCore();
    }
    return AIBuildingCore.instance;
  }

  constructor() {
    this.structureCache = new Map();
  }

  async generateStructure(
    request: AIGenerationRequest,
    onProgress?: (progress: GenerationProgress) => void
  ): Promise<BlockPlacement[]> {
    const cacheKey = JSON.stringify(request);
    
    if (this.structureCache.has(cacheKey)) {
      onProgress?.({
        stage: 'complete',
        progress: 100,
        message: '从缓存加载结构'
      });
      return this.structureCache.get(cacheKey)!;
    }

    const config = this.mergeConfig(request);
    
    onProgress?.({
      stage: 'analyzing',
      progress: 10,
      message: '分析建筑需求...'
    });

    await this.delay(300);

    onProgress?.({
      stage: 'designing',
      progress: 30,
      message: '设计建筑结构...'
    });

    const structure = await this.designStructure(config, request);

    onProgress?.({
      stage: 'building',
      progress: 60,
      message: '生成建筑方块...'
    });

    const blocks = await this.generateBlocks(structure, config);

    onProgress?.({
      stage: 'optimizing',
      progress: 85,
      message: '优化结构...'
    });

    const optimized = this.optimizeStructure(blocks, config);

    onProgress?.({
      stage: 'complete',
      progress: 100,
      message: '建筑生成完成！'
    });

    this.structureCache.set(cacheKey, optimized);
    return optimized;
  }

  private mergeConfig(request: AIGenerationRequest): BuildingConfig {
    const defaults: BuildingConfig = {
      type: 'house',
      size: { width: 10, height: 8, depth: 10 },
      style: 'rustic',
      materials: {
        primary: 'minecraft:oak_planks',
        secondary: 'minecraft:stone',
        accent: 'minecraft:glass',
        roof: 'minecraft:oak_stairs',
        foundation: 'minecraft:cobblestone'
      },
      features: []
    };

    return {
      ...defaults,
      ...request.config,
      materials: { ...defaults.materials, ...request.config.materials }
    };
  }

  private async designStructure(config: BuildingConfig, request: AIGenerationRequest): Promise<any> {
    const { type, size } = config;
    
    switch (type) {
      case 'house':
        return this.designHouse(size, config);
      case 'tower':
        return this.designTower(size, config);
      case 'castle':
        return this.designCastle(size, config);
      case 'village':
        return this.designVillage(size, config);
      case 'farm':
        return this.designFarm(size, config);
      case 'bridge':
        return this.designBridge(size, config);
      case 'wall':
        return this.designWall(size, config);
      default:
        return this.designCustomHouse(size, config);
    }
  }

  private designHouse(size: { width: number; height: number; depth: number }, config: BuildingConfig) {
    const structure = {
      type: 'house',
      floors: Math.ceil(size.height / 4),
      rooms: this.calculateRooms(size),
      features: {
        hasPorch: size.width >= 8,
        hasSecondFloor: size.height >= 6,
        hasBasement: config.style === 'medieval' || config.style === 'fantasy',
        hasAttic: config.style === 'rustic' || config.style === 'medieval',
        windowCount: Math.floor(size.width / 3),
        doorPosition: 'center'
      }
    };

    return structure;
  }

  private designTower(size: { width: number; height: number; depth: number }, config: BuildingConfig) {
    return {
      type: 'tower',
      baseWidth: Math.min(size.width, 7),
      floors: Math.ceil(size.height / 4),
      features: {
        hasSpiralStaircase: true,
        hasBalcony: size.height >= 12,
        hasFlagPole: config.style === 'fantasy' || config.style === 'medieval',
        hasWatchtower: true,
        windowPerFloor: 1,
        isCrenellated: config.style === 'medieval'
      }
    };
  }

  private designCastle(size: { width: number; height: number; depth: number }, config: BuildingConfig) {
    return {
      type: 'castle',
      walls: {
        width: size.width,
        height: Math.min(size.height, 8),
        depth: size.depth,
        thickness: config.style === 'fantasy' ? 3 : 2
      },
      towers: Math.max(4, Math.floor(Math.min(size.width, size.depth) / 6)),
      features: {
        hasMoat: config.style === 'medieval',
        hasDrawbridge: true,
        hasGatehouse: true,
        hasBattlements: config.style === 'medieval' || config.style === 'fantasy',
        hasCourtyard: true
      }
    };
  }

  private designVillage(size: { width: number; height: number; depth: number }, config: BuildingConfig) {
    const houseCount = Math.floor((size.width * size.depth) / 50);
    return {
      type: 'village',
      structures: Array(houseCount).fill(null).map((_, i) => ({
        type: 'house',
        position: {
          x: (i % 3) * 8,
          z: Math.floor(i / 3) * 8
        },
        size: { width: 6, height: 5, depth: 6 }
      })),
      features: {
        hasWell: true,
        hasPaths: true,
        hasFarmland: true,
        hasFences: true
      }
    };
  }

  private designFarm(size: { width: number; height: number; depth: number }, config: BuildingConfig) {
    return {
      type: 'farm',
      plots: Math.floor((size.width * size.depth) / 25),
      features: {
        hasBarn: size.width >= 12,
        hasFencing: true,
        hasWaterChannel: true,
        hasCropField: true,
        hasWindmill: config.style === 'rustic' && size.width >= 16
      }
    };
  }

  private designBridge(size: { width: number; height: number; depth: number }, config: BuildingConfig) {
    return {
      type: 'bridge',
      length: size.depth,
      width: size.width,
      features: {
        hasRailings: true,
        hasSupportPillars: size.depth > 10,
        isCovered: config.style === 'rustic' || config.style === 'medieval',
        archStyle: config.style === 'medieval' || config.style === 'fantasy'
      }
    };
  }

  private designWall(size: { width: number; height: number; depth: number }, config: BuildingConfig) {
    return {
      type: 'wall',
      length: size.width,
      height: Math.min(size.height, 6),
      thickness: config.style === 'medieval' ? 2 : 1,
      features: {
        hasBattlements: config.style === 'medieval' || config.style === 'fantasy',
        hasTowers: Math.floor(size.width / 15),
        hasGate: size.width >= 8
      }
    };
  }

  private designCustomHouse(size: { width: number; height: number; depth: number }, config: BuildingConfig) {
    return this.designHouse(size, config);
  }

  private calculateRooms(size: { width: number; height: number; depth: number }): number {
    return Math.max(1, Math.floor((size.width * size.depth) / 25));
  }

  private async generateBlocks(structure: any, config: BuildingConfig): Promise<BlockPlacement[]> {
    const blocks: BlockPlacement[] = [];
    const { size } = config;

    switch (structure.type) {
      case 'house':
        this.generateHouse(blocks, size, config);
        break;
      case 'tower':
        this.generateTower(blocks, size, config);
        break;
      case 'castle':
        this.generateCastle(blocks, size, config);
        break;
      case 'village':
        this.generateVillage(blocks, structure, config);
        break;
      case 'farm':
        this.generateFarm(blocks, size, config);
        break;
      case 'bridge':
        this.generateBridge(blocks, size, config);
        break;
      case 'wall':
        this.generateWall(blocks, size, config);
        break;
    }

    return blocks;
  }

  private generateHouse(blocks: BlockPlacement[], size: { width: number; height: number; depth: number }, config: BuildingConfig) {
    const { width, height, depth } = size;
    const { materials } = config;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        for (let z = 0; z < depth; z++) {
          const isFoundation = y < 1;
          const isWall = y >= 1 && y < height - 1;
          const isRoof = y >= height - 1;
          const isCorner = (x === 0 || x === width - 1) && (z === 0 || z === depth - 1);
          const isDoor = y === 1 && z === Math.floor(depth / 2) && (x === 0 || x === width - 1);
          const isWindow = isWall && y >= 2 && y <= height - 3 && 
                          !isCorner && 
                          !isDoor && 
                          x > 0 && x < width - 1 && 
                          z > 0 && z < depth - 1 &&
                          this.isWindowPosition(x, z, width, depth);

          if (isFoundation) {
            blocks.push({ x, y, z, blockId: materials.foundation });
          } else if (isRoof) {
            this.generateRoofBlock(blocks, x, y, z, width, depth, materials.roof);
          } else if (isDoor) {
            blocks.push({ x, y, z, blockId: 'minecraft:oak_door' });
          } else if (isWindow && this.isWindowBlock(x, z, width, depth)) {
            blocks.push({ x, y, z, blockId: materials.accent });
          } else if (isWall) {
            blocks.push({ x, y, z, blockId: materials.primary });
          }
        }
      }
    }

    if (config.features.includes('porch') || size.width >= 8) {
      this.generatePorch(blocks, width, depth, height, materials);
    }
  }

  private generateRoofBlock(blocks: BlockPlacement[], x: number, y: number, z: number, width: number, depth: number, roofMaterial: string) {
    const halfWidth = width / 2;
    const halfDepth = depth / 2;
    
    const distFromCenter = Math.max(Math.abs(x - halfWidth), Math.abs(z - halfDepth));
    const maxDist = Math.max(halfWidth, halfDepth);
    const heightOffset = Math.floor((1 - distFromCenter / maxDist) * 2);

    blocks.push({ x, y: y + heightOffset, z, blockId: roofMaterial });
  }

  private generatePorch(blocks: BlockPlacement[], width: number, depth: number, height: number, materials: BuildingConfig['materials']) {
    const porchDepth = Math.min(3, Math.floor(depth / 3));
    const porchWidth = width;
    
    for (let x = Math.floor(width / 4); x < width - Math.floor(width / 4); x++) {
      blocks.push({ x, y: height - 1, z: depth, blockId: materials.primary });
      blocks.push({ x, y: height, z: depth, blockId: materials.roof });
    }

    for (let z = depth + 1; z <= depth + porchDepth; z++) {
      for (let x = Math.floor(width / 4); x < width - Math.floor(width / 4); x++) {
        blocks.push({ x, y: height - 1, z, blockId: materials.foundation });
      }
    }
  }

  private isWindowPosition(x: number, z: number, width: number, depth: number): boolean {
    const windowSpacing = 2;
    return (x % windowSpacing === 1) || (z % windowSpacing === 1);
  }

  private isWindowBlock(x: number, z: number, width: number, depth: number): boolean {
    const windowSpacing = 2;
    const isOnWallX = z === 0 || z === depth - 1;
    const isOnWallZ = x === 0 || x === width - 1;
    
    return (isOnWallX && x % windowSpacing === 1) || 
           (isOnWallZ && z % windowSpacing === 1);
  }

  private generateTower(blocks: BlockPlacement[], size: { width: number; height: number; depth: number }, config: BuildingConfig) {
    const { width, height, depth } = size;
    const towerWidth = Math.min(width, 7);
    const towerDepth = Math.min(depth, 7);
    const { materials } = config;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < towerWidth; x++) {
        for (let z = 0; z < towerDepth; z++) {
          const isFoundation = y < 1;
          const isWall = y >= 1 && y < height - 1;
          const isRoof = y >= height - 1;
          const isCorner = (x === 0 || x === towerWidth - 1) && (z === 0 || z === towerDepth - 1);
          const isWindow = isWall && y % 3 === 2 && !isCorner;

          if (isFoundation) {
            blocks.push({ x, y, z, blockId: materials.foundation });
          } else if (isRoof) {
            this.generateTowerRoof(blocks, x, y, z, towerWidth, towerDepth, height, materials);
          } else if (isWindow) {
            blocks.push({ x, y, z, blockId: materials.accent });
          } else if (isWall) {
            blocks.push({ x, y, z, blockId: materials.primary });
          }
        }
      }
    }

    if (config.style === 'medieval' || config.style === 'fantasy') {
      this.generateBattlements(blocks, towerWidth, towerDepth, height, materials);
    }

    if (height >= 12) {
      this.generateBalcony(blocks, towerWidth, towerDepth, Math.floor(height / 2), materials);
    }
  }

  private generateTowerRoof(blocks: BlockPlacement[], x: number, y: number, z: number, width: number, depth: number, height: number, materials: BuildingConfig['materials']) {
    const centerX = width / 2;
    const centerZ = depth / 2;
    const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(z - centerZ, 2));
    const roofHeight = height - y;
    
    if (dist <= roofHeight) {
      blocks.push({ x, y, z, blockId: materials.roof });
    }
  }

  private generateBattlements(blocks: BlockPlacement[], width: number, depth: number, height: number, materials: BuildingConfig['materials']) {
    const battlementHeight = 1;
    const spacing = 2;
    
    for (let x = 0; x < width; x += spacing) {
      blocks.push({ x, y: height, z: 0, blockId: materials.secondary });
      blocks.push({ x, y: height, z: depth - 1, blockId: materials.secondary });
    }
    
    for (let z = 0; z < depth; z += spacing) {
      blocks.push({ x: 0, y: height, z, blockId: materials.secondary });
      blocks.push({ x: width - 1, y: height, z, blockId: materials.secondary });
    }
  }

  private generateBalcony(blocks: BlockPlacement[], width: number, depth: number, height: number, materials: BuildingConfig['materials']) {
    const balconyWidth = Math.floor(width / 2);
    const balconyDepth = 2;
    const startX = Math.floor((width - balconyWidth) / 2);
    
    for (let x = startX; x < startX + balconyWidth; x++) {
      for (let z = 0; z < balconyDepth; z++) {
        blocks.push({ x, y: height, z, blockId: materials.foundation });
      }
    }

    for (let x = startX; x < startX + balconyWidth; x++) {
      blocks.push({ x, y: height + 1, z: 0, blockId: materials.secondary });
      blocks.push({ x, y: height + 1, z: balconyDepth - 1, blockId: materials.secondary });
    }
  }

  private generateCastle(blocks: BlockPlacement[], size: { width: number; height: number; depth: number }, config: BuildingConfig) {
    const { width, height, depth } = size;
    const wallThickness = config.style === 'fantasy' ? 3 : 2;
    const wallHeight = Math.min(height, 8);
    const { materials } = config;

    for (let y = 0; y < wallHeight; y++) {
      for (let x = 0; x < width; x++) {
        for (let z = 0; z < depth; z++) {
          const isOnEdge = x < wallThickness || x >= width - wallThickness || 
                          z < wallThickness || z >= depth - wallThickness;
          
          if (isOnEdge) {
            blocks.push({ x, y, z, blockId: materials.secondary });
          } else if (y === 0) {
            blocks.push({ x, y, z, blockId: materials.foundation });
          }
        }
      }
    }

    const towerCount = Math.max(4, Math.floor(Math.min(width, depth) / 6));
    const spacing = Math.floor(Math.min(width, depth) / (towerCount / 2));
    
    for (let i = 0; i < towerCount; i++) {
      const tx = (i % 2) * (width - wallThickness * 2) + wallThickness;
      const tz = Math.floor(i / 2) * spacing + wallThickness;
      this.generateTower(blocks, { width: 5, height: wallHeight + 3, depth: 5 }, config);
    }

    if (config.style === 'medieval') {
      this.generateMoat(blocks, width, depth, materials);
    }

    this.generateGate(blocks, width, depth, wallHeight, materials);
  }

  private generateMoat(blocks: BlockPlacement[], width: number, depth: number, materials: BuildingConfig['materials']) {
    const moatWidth = 3;
    const moatDepth = 2;

    for (let x = -moatWidth; x < width + moatWidth; x++) {
      for (let z = -moatWidth; z < depth + moatWidth; z++) {
        if (x < 0 || x >= width || z < 0 || z >= depth) {
          if (x >= -moatWidth && x < width + moatWidth && 
              z >= -moatWidth && z < depth + moatWidth) {
            for (let y = -moatDepth; y < 0; y++) {
              blocks.push({ x, y, z, blockId: 'minecraft:water' });
            }
          }
        }
      }
    }
  }

  private generateGate(blocks: BlockPlacement[], width: number, depth: number, height: number, materials: BuildingConfig['materials']) {
    const gateWidth = 4;
    const gateHeight = 3;
    const startX = Math.floor((width - gateWidth) / 2);
    
    for (let y = 0; y < gateHeight; y++) {
      for (let x = startX; x < startX + gateWidth; x++) {
        for (let z = 0; z < depth; z++) {
          const isEdge = x === startX || x === startX + gateWidth - 1;
          if (isEdge && y < height) {
            blocks.push({ x, y, z, blockId: materials.secondary });
          }
        }
      }
    }
  }

  private generateVillage(blocks: BlockPlacement[], structure: any, config: BuildingConfig) {
    structure.structures.forEach((house: any) => {
      const houseBlocks = this.generateHouseForVillage(house.size, config);
      houseBlocks.forEach(block => {
        blocks.push({
          ...block,
          x: block.x + house.position.x,
          z: block.z + house.position.z
        });
      });
    });

    if (structure.features.hasWell) {
      this.generateWell(blocks, Math.floor(structure.structures.length / 2) * 8, 0, config);
    }

    if (structure.features.hasPaths) {
      this.generatePaths(blocks, structure.structures.length, config);
    }
  }

  private generateHouseForVillage(size: { width: number; height: number; depth: number }, config: BuildingConfig): BlockPlacement[] {
    const blocks: BlockPlacement[] = [];
    const houseConfig = { ...config, type: 'house' as const };
    this.generateHouse(blocks, size, houseConfig);
    return blocks;
  }

  private generateWell(blocks: BlockPlacement[], x: number, z: number, config: BuildingConfig) {
    const { materials } = config;
    const wellRadius = 2;

    for (let dx = -wellRadius; dx <= wellRadius; dx++) {
      for (let dz = -wellRadius; dz <= wellRadius; dz++) {
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist <= wellRadius) {
          blocks.push({ x: x + dx, y: 0, z: z + dz, blockId: 'minecraft:water' });
          if (dist >= wellRadius - 1) {
            blocks.push({ x: x + dx, y: 1, z: z + dz, blockId: materials.foundation });
          }
        }
      }
    }
  }

  private generatePaths(blocks: BlockPlacement[], houseCount: number, config: BuildingConfig) {
    for (let i = 0; i < houseCount; i++) {
      const pathX = (i % 3) * 8 + 3;
      for (let z = 0; z < 20; z++) {
        blocks.push({ x: pathX, y: 0, z, blockId: 'minecraft:cobblestone' });
      }
    }
  }

  private generateFarm(blocks: BlockPlacement[], size: { width: number; height: number; depth: number }, config: BuildingConfig) {
    const { width, depth } = size;
    const { materials } = config;

    for (let x = 0; x < width; x++) {
      for (let z = 0; z < depth; z++) {
        blocks.push({ x, y: 0, z, blockId: 'minecraft:dirt' });
      }
    }

    const plotSize = 5;
    for (let px = 0; px < width; px += plotSize + 1) {
      for (let pz = 0; pz < depth; pz += plotSize + 1) {
        for (let x = px; x < px + plotSize && x < width; x++) {
          for (let z = pz; z < pz + plotSize && z < depth; z++) {
            blocks.push({ x, y: 1, z, blockId: 'minecraft:farmland' });
          }
        }
      }
    }

    if (width >= 12) {
      this.generateBarn(blocks, width, depth, config);
    }

    this.generateFencing(blocks, width, depth, materials);
  }

  private generateBarn(blocks: BlockPlacement[], width: number, depth: number, config: BuildingConfig) {
    const barnWidth = 8;
    const barnHeight = 6;
    const barnDepth = 6;
    const startX = Math.floor(width / 2) - Math.floor(barnWidth / 2);
    const startZ = depth - barnDepth - 2;
    const { materials } = config;

    for (let y = 0; y < barnHeight; y++) {
      for (let x = startX; x < startX + barnWidth; x++) {
        for (let z = startZ; z < startZ + barnDepth; z++) {
          if (y === 0) {
            blocks.push({ x, y, z, blockId: materials.foundation });
          } else if (y === barnHeight - 1) {
            blocks.push({ x, y, z, blockId: materials.primary });
          } else {
            blocks.push({ x, y, z, blockId: materials.secondary });
          }
        }
      }
    }
  }

  private generateFencing(blocks: BlockPlacement[], width: number, depth: number, materials: BuildingConfig['materials']) {
    for (let x = 0; x < width; x++) {
      blocks.push({ x, y: 1, z: 0, blockId: materials.foundation.replace('cobblestone', 'oak_fence') });
      blocks.push({ x, y: 1, z: depth - 1, blockId: materials.foundation.replace('cobblestone', 'oak_fence') });
    }
    for (let z = 0; z < depth; z++) {
      blocks.push({ x: 0, y: 1, z, blockId: materials.foundation.replace('cobblestone', 'oak_fence') });
      blocks.push({ x: width - 1, y: 1, z, blockId: materials.foundation.replace('cobblestone', 'oak_fence') });
    }
  }

  private generateBridge(blocks: BlockPlacement[], size: { width: number; height: number; depth: number }, config: BuildingConfig) {
    const { width, depth } = size;
    const { materials } = config;

    for (let x = 0; x < width; x++) {
      for (let z = 0; z < depth; z++) {
        blocks.push({ x, y: 0, z, blockId: materials.foundation });

        if (z % 4 === 0 && width > 3) {
          for (let y = -2; y < 0; y++) {
            blocks.push({ x: Math.floor(width / 2), y, z, blockId: materials.secondary });
          }
        }
      }
    }

    for (let x = 0; x < width; x++) {
      for (let z = 0; z < depth; z++) {
        blocks.push({ x, y: 1, z, blockId: materials.primary });
      }
    }

    if (config.style === 'rustic' || config.style === 'medieval') {
      for (let z = 0; z < depth; z += 3) {
        blocks.push({ x: 0, y: 2, z, blockId: materials.secondary });
        blocks.push({ x: width - 1, y: 2, z, blockId: materials.secondary });
        blocks.push({ x: 0, y: 3, z, blockId: materials.secondary });
        blocks.push({ x: width - 1, y: 3, z, blockId: materials.secondary });
      }
    }
  }

  private generateWall(blocks: BlockPlacement[], size: { width: number; height: number; depth: number }, config: BuildingConfig) {
    const { width, height, depth } = size;
    const wallThickness = config.style === 'medieval' ? 2 : 1;
    const wallHeight = Math.min(height, 6);
    const { materials } = config;

    for (let y = 0; y < wallHeight; y++) {
      for (let x = 0; x < width; x++) {
        for (let z = 0; z < depth; z++) {
          if (z < wallThickness) {
            blocks.push({ x, y, z, blockId: materials.secondary });
          }
        }
      }
    }

    if (config.style === 'medieval' || config.style === 'fantasy') {
      for (let x = 0; x < width; x += 3) {
        blocks.push({ x, y: wallHeight, z: 0, blockId: materials.secondary });
        blocks.push({ x, y: wallHeight + 1, z: 0, blockId: materials.secondary });
      }
    }

    const towerCount = Math.floor(width / 15);
    for (let i = 0; i < towerCount; i++) {
      const tx = Math.floor((i + 1) * width / (towerCount + 1));
      this.generateTower(blocks, { width: 5, height: wallHeight + 2, depth: 5 }, config);
    }

    if (width >= 8) {
      const gateWidth = 4;
      const gateHeight = 3;
      const startX = Math.floor((width - gateWidth) / 2);
      
      for (let y = 0; y < gateHeight; y++) {
        for (let x = startX; x < startX + gateWidth; x++) {
          blocks.push({ x, y, z: 0, blockId: 'minecraft:air' });
        }
      }
    }
  }

  private optimizeStructure(blocks: BlockPlacement[], config: BuildingConfig): BlockPlacement[] {
    const blockMap = new Map<string, BlockPlacement>();
    blocks.forEach(block => {
      const key = `${block.x},${block.y},${block.z}`;
      blockMap.set(key, block);
    });

    const optimized: BlockPlacement[] = [];
    blockMap.forEach(block => {
      optimized.push(block);
    });

    return optimized.sort((a, b) => {
      if (a.y !== b.y) return a.y - b.y;
      if (a.x !== b.x) return a.x - b.x;
      return a.z - b.z;
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  clearCache(): void {
    this.structureCache.clear();
  }
}

export default AIBuildingCore;
