import { BlockPlacement } from '@/types';
import { AIBuildingCore, BuildingConfig, AIGenerationRequest, GenerationProgress } from './aiBuildingCore';
import { AIBuildingOptimizer, OptimizationOptions } from './aiBuildingOptimizer';

export interface AIBuildingAPI {
  generate: (
    config: Partial<BuildingConfig>,
    onProgress?: (progress: GenerationProgress) => void
  ) => Promise<BlockPlacement[]>;
  
  optimize: (
    blocks: BlockPlacement[],
    options?: Partial<OptimizationOptions>
  ) => Promise<BlockPlacement[]>;
  
  validate: (blocks: BlockPlacement[]) => Promise<{
    valid: boolean;
    issues: string[];
  }>;
  
  transform: (
    blocks: BlockPlacement[],
    transform: 'mirror-x' | 'mirror-z' | 'rotate-90' | 'rotate-180' | 'scale-up' | 'scale-down'
  ) => Promise<BlockPlacement[]>;
  
  addDetails: (
    blocks: BlockPlacement[],
    detailType: 'windows' | 'doors' | 'lights' | 'decoration'
  ) => Promise<BlockPlacement[]>;
  
  clearCache: () => void;
}

export class AIBuildingService implements AIBuildingAPI {
  private static instance: AIBuildingService;
  private core: AIBuildingCore;
  private optimizer: AIBuildingOptimizer;

  static getInstance(): AIBuildingService {
    if (!AIBuildingService.instance) {
      AIBuildingService.instance = new AIBuildingService();
    }
    return AIBuildingService.instance;
  }

  constructor() {
    this.core = AIBuildingCore.getInstance();
    this.optimizer = AIBuildingOptimizer.getInstance();
  }

  async generate(
    config: Partial<BuildingConfig>,
    onProgress?: (progress: GenerationProgress) => void
  ): Promise<BlockPlacement[]> {
    const request: AIGenerationRequest = {
      description: `${config.type || 'house'} - ${config.style || 'rustic'}`,
      config
    };

    return this.core.generateStructure(request, onProgress);
  }

  async optimize(
    blocks: BlockPlacement[],
    options?: Partial<OptimizationOptions>
  ): Promise<BlockPlacement[]> {
    const config: BuildingConfig = {
      type: 'house',
      size: this.calculateSize(blocks),
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

    const result = this.optimizer.optimize(blocks, config, options);
    return result.optimizedBlocks;
  }

  async validate(blocks: BlockPlacement[]): Promise<{
    valid: boolean;
    issues: string[];
  }> {
    const config: BuildingConfig = {
      type: 'house',
      size: this.calculateSize(blocks),
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

    return this.optimizer.validateStructure(blocks, config);
  }

  async transform(
    blocks: BlockPlacement[],
    transform: 'mirror-x' | 'mirror-z' | 'rotate-90' | 'rotate-180' | 'scale-up' | 'scale-down'
  ): Promise<BlockPlacement[]> {
    return this.optimizer.transformStructure(blocks, transform);
  }

  async addDetails(
    blocks: BlockPlacement[],
    detailType: 'windows' | 'doors' | 'lights' | 'decoration'
  ): Promise<BlockPlacement[]> {
    const config: BuildingConfig = {
      type: 'house',
      size: this.calculateSize(blocks),
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

    return this.optimizer.addDetails(blocks, config, detailType);
  }

  clearCache(): void {
    this.core.clearCache();
  }

  private calculateSize(blocks: BlockPlacement[]): { width: number; height: number; depth: number } {
    if (blocks.length === 0) {
      return { width: 10, height: 8, depth: 10 };
    }

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    blocks.forEach(block => {
      minX = Math.min(minX, block.x);
      maxX = Math.max(maxX, block.x);
      minY = Math.min(minY, block.y);
      maxY = Math.max(maxY, block.y);
      minZ = Math.min(minZ, block.z);
      maxZ = Math.max(maxZ, block.z);
    });

    return {
      width: maxX - minX + 1,
      height: maxY - minY + 1,
      depth: maxZ - minZ + 1
    };
  }
}

export const aiBuildingService = AIBuildingService.getInstance();

export default AIBuildingService;
