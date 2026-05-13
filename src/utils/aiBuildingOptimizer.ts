import { BlockPlacement, BlockProperties } from '@/types';
import { BLOCKS, getBlockById } from '@/utils/blocks';
import { BuildingConfig } from './aiBuildingCore';

export interface OptimizationOptions {
  materialQuality: 'low' | 'medium' | 'high';
  structuralIntegrity: boolean;
  aestheticScore: boolean;
  performanceMode: boolean;
  preserveOriginal: boolean;
}

export interface OptimizationResult {
  originalBlocks: BlockPlacement[];
  optimizedBlocks: BlockPlacement[];
  improvements: string[];
  warnings: string[];
  stats: {
    blocksRemoved: number;
    blocksAdded: number;
    materialsOptimized: number;
    structureValidated: boolean;
    aestheticScore: number;
  };
}

export class AIBuildingOptimizer {
  private static instance: AIBuildingOptimizer;

  static getInstance(): AIBuildingOptimizer {
    if (!AIBuildingOptimizer.instance) {
      AIBuildingOptimizer.instance = new AIBuildingOptimizer();
    }
    return AIBuildingOptimizer.instance;
  }

  optimize(
    blocks: BlockPlacement[],
    config: BuildingConfig,
    options: Partial<OptimizationOptions> = {}
  ): OptimizationResult {
    const opts: OptimizationOptions = {
      materialQuality: 'medium',
      structuralIntegrity: true,
      aestheticScore: true,
      performanceMode: false,
      preserveOriginal: false,
      ...options
    };

    let optimized = [...blocks];
    const improvements: string[] = [];
    const warnings: string[] = [];

    if (opts.structuralIntegrity) {
      const integrityResult = this.ensureStructuralIntegrity(optimized, config);
      optimized = integrityResult.blocks;
      if (integrityResult.fixed > 0) {
        improvements.push(`修复了 ${integrityResult.fixed} 个结构问题`);
      }
      warnings.push(...integrityResult.warnings);
    }

    if (opts.materialQuality !== 'low') {
      const materialResult = this.optimizeMaterials(optimized, config, opts.materialQuality);
      optimized = materialResult.blocks;
      if (materialResult.improved > 0) {
        improvements.push(`优化了 ${materialResult.improved} 个方块材质`);
      }
    }

    if (opts.aestheticScore) {
      const aestheticResult = this.enhanceAesthetics(optimized, config);
      optimized = aestheticResult.blocks;
      if (aestheticResult.enhanced > 0) {
        improvements.push(`增强了 ${aestheticResult.enhanced} 个美学细节`);
      }
      warnings.push(...aestheticResult.warnings);
    }

    if (opts.performanceMode) {
      const perfResult = this.optimizePerformance(optimized);
      optimized = perfResult.blocks;
      if (perfResult.reduced > 0) {
        improvements.push(`减少了 ${perfResult.reduced} 个冗余方块以提升性能`);
      }
    }

    const finalResult = this.removeRedundantBlocks(optimized);
    const removedCount = optimized.length - finalResult.blocks.length;
    if (removedCount > 0) {
      improvements.push(`移除了 ${removedCount} 个冗余方块`);
    }
    optimized = finalResult.blocks;

    return {
      originalBlocks: blocks,
      optimizedBlocks: optimized,
      improvements,
      warnings,
      stats: {
        blocksRemoved: blocks.length - optimized.length,
        blocksAdded: 0,
        materialsOptimized: improvements.filter(i => i.includes('材质')).length,
        structureValidated: warnings.length === 0,
        aestheticScore: this.calculateAestheticScore(optimized, config)
      }
    };
  }

  private ensureStructuralIntegrity(
    blocks: BlockPlacement[],
    config: BuildingConfig
  ): { blocks: BlockPlacement[]; fixed: number; warnings: string[] } {
    let fixed = 0;
    const warnings: string[] = [];
    const blockMap = new Map<string, BlockPlacement>();
    
    blocks.forEach(block => {
      const key = `${block.x},${block.y},${block.z}`;
      blockMap.set(key, block);
    });

    const newBlocks: BlockPlacement[] = [];

    blocks.forEach(block => {
      const blockData = getBlockById(block.blockId);
      if (!blockData) {
        warnings.push(`方块 ${block.blockId} 未在数据库中找到`);
        return;
      }

      if (!blockData.transparent && block.y > 0) {
        const belowKey = `${block.x},${block.y - 1},${block.z}`;
        const belowBlock = blockMap.get(belowKey);
        
        if (!belowBlock) {
          const hasFoundation = this.hasFoundationBelow(block.x, block.y, block.z, blockMap);
          if (!hasFoundation) {
            newBlocks.push({
              ...block,
              y: block.y - 1,
              blockId: config.materials.foundation
            });
            fixed++;
          }
        }
      }

      newBlocks.push(block);
    });

    return { blocks: newBlocks, fixed, warnings };
  }

  private hasFoundationBelow(
    x: number,
    y: number,
    z: number,
    blockMap: Map<string, BlockPlacement>
  ): boolean {
    for (let checkY = y - 1; checkY >= 0; checkY--) {
      const key = `${x},${checkY},${z}`;
      const block = blockMap.get(key);
      if (block) {
        const blockData = getBlockById(block.blockId);
        return !!(blockData && !blockData.transparent);
      }
    }
    return false;
  }

  private optimizeMaterials(
    blocks: BlockPlacement[],
    config: BuildingConfig,
    quality: 'low' | 'medium' | 'high'
  ): { blocks: BlockPlacement[]; improved: number } {
    let improved = 0;
    
    const optimized = blocks.map(block => {
      const blockData = getBlockById(block.blockId);
      if (!blockData) return block;

      if (block.y === 0 && block.blockId !== config.materials.foundation) {
        improved++;
        return { ...block, blockId: config.materials.foundation };
      }

      if (block.y >= config.size.height - 2 && block.blockId !== config.materials.roof) {
        if (quality === 'high') {
          improved++;
          return { ...block, blockId: config.materials.roof };
        }
      }

      return block;
    });

    return { blocks: optimized, improved };
  }

  private enhanceAesthetics(
    blocks: BlockPlacement[],
    config: BuildingConfig
  ): { blocks: BlockPlacement[]; enhanced: number; warnings: string[] } {
    let enhanced = 0;
    const warnings: string[] = [];
    const blockMap = new Map<string, BlockPlacement>();
    
    blocks.forEach(block => {
      const key = `${block.x},${block.y},${block.z}`;
      blockMap.set(key, block);
    });

    const newBlocks: BlockPlacement[] = [];

    blocks.forEach(block => {
      const neighbors = this.getNeighborCount(block.x, block.y, block.z, blockMap);
      
      if (neighbors.total === 6 && block.blockId === config.materials.primary) {
        const cornerCheck = this.isCornerPosition(block.x, block.z, config.size);
        if (!cornerCheck) {
          const shouldAddDetail = Math.random() > 0.9;
          if (shouldAddDetail) {
            newBlocks.push(block);
            enhanced++;
            return;
          }
        }
      }

      if (neighbors.total === 5 && block.blockId === config.materials.secondary) {
        if (this.isExposedSurface(block.x, block.y, block.z, blockMap)) {
          const shouldAddDetail = Math.random() > 0.7;
          if (shouldAddDetail) {
            newBlocks.push(block);
            enhanced++;
            return;
          }
        }
      }

      newBlocks.push(block);
    });

    return { blocks: newBlocks, enhanced, warnings };
  }

  private getNeighborCount(
    x: number,
    y: number,
    z: number,
    blockMap: Map<string, BlockPlacement>
  ): { total: number; air: number; solid: number } {
    const directions = [
      [1, 0, 0], [-1, 0, 0],
      [0, 1, 0], [0, -1, 0],
      [0, 0, 1], [0, 0, -1]
    ];

    let total = 0;
    let air = 0;
    let solid = 0;

    directions.forEach(([dx, dy, dz]) => {
      const key = `${x + dx},${y + dy},${z + dz}`;
      if (blockMap.has(key)) {
        total++;
        solid++;
      } else {
        air++;
      }
    });

    return { total, air, solid };
  }

  private isCornerPosition(x: number, z: number, size: { width: number; depth: number }): boolean {
    return (x === 0 || x === size.width - 1) && (z === 0 || z === size.depth - 1);
  }

  private isExposedSurface(
    x: number,
    y: number,
    z: number,
    blockMap: Map<string, BlockPlacement>
  ): boolean {
    const aboveKey = `${x},${y + 1},${z}`;
    return !blockMap.has(aboveKey);
  }

  private optimizePerformance(blocks: BlockPlacement[]): { blocks: BlockPlacement[]; reduced: number } {
    const blockMap = new Map<string, BlockPlacement>();
    blocks.forEach(block => {
      const key = `${block.x},${block.y},${block.z}`;
      if (!blockMap.has(key)) {
        blockMap.set(key, block);
      }
    });

    const reduced = blocks.length - blockMap.size;
    return {
      blocks: Array.from(blockMap.values()),
      reduced
    };
  }

  private removeRedundantBlocks(blocks: BlockPlacement[]): { blocks: BlockPlacement[]; redundant: number } {
    const blockMap = new Map<string, BlockPlacement>();
    
    blocks.forEach(block => {
      const key = `${block.x},${block.y},${block.z}`;
      if (!blockMap.has(key)) {
        blockMap.set(key, block);
      }
    });

    const uniqueBlocks: BlockPlacement[] = [];
    let redundantCount = 0;

    blockMap.forEach((block, key) => {
      uniqueBlocks.push(block);
    });

    redundantCount = blocks.length - uniqueBlocks.length;

    return { blocks: uniqueBlocks, redundant: redundantCount };
  }

  private calculateAestheticScore(blocks: BlockPlacement[], config: BuildingConfig): number {
    if (blocks.length === 0) return 0;

    let score = 50;

    const materialUsage = new Set<string>();
    blocks.forEach(block => materialUsage.add(block.blockId));
    
    if (materialUsage.size >= 3) score += 10;
    if (materialUsage.size >= 5) score += 10;

    const hasFoundation = blocks.some(b => b.y === 0);
    if (hasFoundation) score += 10;

    const heightVariation = this.calculateHeightVariation(blocks);
    if (heightVariation > 2) score += 15;

    const hasWindows = blocks.some(b => 
      b.blockId.includes('glass') || b.blockId.includes('window')
    );
    if (hasWindows) score += 10;

    const hasDoors = blocks.some(b => b.blockId.includes('door'));
    if (hasDoors) score += 5;

    return Math.min(100, score);
  }

  private calculateHeightVariation(blocks: BlockPlacement[]): number {
    if (blocks.length === 0) return 0;

    const heights = blocks.map(b => b.y);
    const max = Math.max(...heights);
    const min = Math.min(...heights);

    return max - min;
  }

  validateStructure(blocks: BlockPlacement[], config: BuildingConfig): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (blocks.length === 0) {
      issues.push('结构为空');
      return { valid: false, issues };
    }

    const blockMap = new Map<string, BlockPlacement>();
    blocks.forEach(block => {
      const key = `${block.x},${block.y},${block.z}`;
      blockMap.set(key, block);
    });

    let floatingBlocks = 0;
    blocks.forEach(block => {
      const blockData = getBlockById(block.blockId);
      if (blockData && !blockData.transparent && block.y > 0) {
        const belowKey = `${block.x},${block.y - 1},${block.z}`;
        if (!blockMap.has(belowKey)) {
          floatingBlocks++;
        }
      }
    });

    if (floatingBlocks > 0) {
      issues.push(`发现 ${floatingBlocks} 个悬浮方块`);
    }

    const yPositions = blocks.map(b => b.y);
    const minY = Math.min(...yPositions);
    if (minY > 0) {
      issues.push('结构底部不在地面层');
    }

    const hasFoundation = blocks.some(b => b.y === minY);
    if (!hasFoundation) {
      issues.push('缺少地基层');
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  addDetails(
    blocks: BlockPlacement[],
    config: BuildingConfig,
    detailType: 'windows' | 'doors' | 'lights' | 'decoration'
  ): BlockPlacement[] {
    const newBlocks = [...blocks];
    const blockMap = new Map<string, BlockPlacement>();
    
    blocks.forEach(block => {
      const key = `${block.x},${block.y},${block.z}`;
      blockMap.set(key, block);
    });

    const { width, depth, height } = config.size;

    switch (detailType) {
      case 'windows':
        this.addWindows(newBlocks, blockMap, width, depth, height, config);
        break;
      case 'doors':
        this.addDoors(newBlocks, blockMap, width, depth, config);
        break;
      case 'lights':
        this.addLights(newBlocks, blockMap, width, depth, height, config);
        break;
      case 'decoration':
        this.addDecorations(newBlocks, blockMap, width, depth, config);
        break;
    }

    return newBlocks;
  }

  private addWindows(
    blocks: BlockPlacement[],
    blockMap: Map<string, BlockPlacement>,
    width: number,
    depth: number,
    height: number,
    config: BuildingConfig
  ): void {
    for (let y = 2; y < height - 2; y++) {
      for (let x = 1; x < width - 1; x++) {
        if (x % 3 === 1) {
          const frontKey = `${x},${y},0`;
          const backKey = `${x},${y},${depth - 1}`;
          
          if (blockMap.has(frontKey)) {
            const block = blockMap.get(frontKey)!;
            if (block.blockId === config.materials.primary) {
              blocks.push({ x, y, z: 0, blockId: config.materials.accent });
            }
          }
          
          if (blockMap.has(backKey)) {
            const block = blockMap.get(backKey)!;
            if (block.blockId === config.materials.primary) {
              blocks.push({ x, y, z: depth - 1, blockId: config.materials.accent });
            }
          }
        }
      }
    }
  }

  private addDoors(
    blocks: BlockPlacement[],
    blockMap: Map<string, BlockPlacement>,
    width: number,
    depth: number,
    config: BuildingConfig
  ): void {
    const doorX = Math.floor(width / 2);
    const doorZ = 0;
    
    blocks.push({ x: doorX, y: 1, z: doorZ, blockId: 'minecraft:oak_door' });
    blocks.push({ x: doorX, y: 2, z: doorZ, blockId: 'minecraft:oak_door' });
  }

  private addLights(
    blocks: BlockPlacement[],
    blockMap: Map<string, BlockPlacement>,
    width: number,
    depth: number,
    height: number,
    config: BuildingConfig
  ): void {
    for (let y = 2; y < height - 1; y++) {
      for (let x = 2; x < width - 2; x += 4) {
        for (let z = 2; z < depth - 2; z += 4) {
          const key = `${x},${y},${z}`;
          if (blockMap.has(key)) {
            blocks.push({ x, y: y + 1, z, blockId: 'minecraft:torch' });
          }
        }
      }
    }
  }

  private addDecorations(
    blocks: BlockPlacement[],
    blockMap: Map<string, BlockPlacement>,
    width: number,
    depth: number,
    config: BuildingConfig
  ): void {
    blocks.push({
      x: Math.floor(width / 2),
      y: 0,
      z: Math.floor(depth / 2),
      blockId: 'minecraft:flower_pot'
    });

    if (width >= 6 && depth >= 6) {
      blocks.push({
        x: 1,
        y: 1,
        z: 1,
        blockId: 'minecraft:oak_sign'
      });
    }
  }

  transformStructure(
    blocks: BlockPlacement[],
    transform: 'mirror-x' | 'mirror-z' | 'rotate-90' | 'rotate-180' | 'scale-up' | 'scale-down'
  ): BlockPlacement[] {
    switch (transform) {
      case 'mirror-x':
        return this.mirrorOnX(blocks);
      case 'mirror-z':
        return this.mirrorOnZ(blocks);
      case 'rotate-90':
        return this.rotate90(blocks);
      case 'rotate-180':
        return this.rotate180(blocks);
      case 'scale-up':
        return this.scale(blocks, 2);
      case 'scale-down':
        return this.scale(blocks, 0.5);
      default:
        return blocks;
    }
  }

  private mirrorOnX(blocks: BlockPlacement[]): BlockPlacement[] {
    let maxX = 0;
    blocks.forEach(b => { if (b.x > maxX) maxX = b.x; });
    
    return blocks.map(b => ({
      ...b,
      x: maxX - b.x
    }));
  }

  private mirrorOnZ(blocks: BlockPlacement[]): BlockPlacement[] {
    let maxZ = 0;
    blocks.forEach(b => { if (b.z > maxZ) maxZ = b.z; });
    
    return blocks.map(b => ({
      ...b,
      z: maxZ - b.z
    }));
  }

  private rotate90(blocks: BlockPlacement[]): BlockPlacement[] {
    let maxX = 0, maxZ = 0;
    blocks.forEach(b => {
      if (b.x > maxX) maxX = b.x;
      if (b.z > maxZ) maxZ = b.z;
    });
    
    return blocks.map(b => ({
      ...b,
      x: b.z,
      z: maxX - b.x
    }));
  }

  private rotate180(blocks: BlockPlacement[]): BlockPlacement[] {
    let maxX = 0, maxZ = 0;
    blocks.forEach(b => {
      if (b.x > maxX) maxX = b.x;
      if (b.z > maxZ) maxZ = b.z;
    });
    
    return blocks.map(b => ({
      ...b,
      x: maxX - b.x,
      z: maxZ - b.z
    }));
  }

  private scale(blocks: BlockPlacement[], factor: number): BlockPlacement[] {
    return blocks.map(b => ({
      ...b,
      x: Math.round(b.x * factor),
      y: Math.round(b.y * factor),
      z: Math.round(b.z * factor)
    }));
  }
}

export default AIBuildingOptimizer;
