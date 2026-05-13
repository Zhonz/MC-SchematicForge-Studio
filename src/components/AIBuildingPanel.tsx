import { useState, useCallback } from 'react';
import { AIBuildingCore, BuildingConfig, AIGenerationRequest, GenerationProgress } from '@/utils/aiBuildingCore';
import { AIBuildingOptimizer } from '@/utils/aiBuildingOptimizer';
import { RedstoneCircuitGenerator, RedstoneCircuitConfig, RedstoneCircuitType } from '@/utils/redstoneCircuitGenerator';
import { useSceneStore } from '@/stores/sceneStore';
import { BlockPlacement } from '@/types';

export interface AIBuildingPanelProps {
  onClose?: () => void;
}

type TabType = 'building' | 'redstone';

const BuildingTypes = [
  { value: 'house', label: '房屋', icon: '🏠' },
  { value: 'tower', label: '塔楼', icon: '🏰' },
  { value: 'castle', label: '城堡', icon: '🏯' },
  { value: 'village', label: '村庄', icon: '🏘️' },
  { value: 'farm', label: '农场', icon: '🌾' },
  { value: 'bridge', label: '桥梁', icon: '🌉' },
  { value: 'wall', label: '城墙', icon: '🧱' }
];

const BuildingStyles = [
  { value: 'rustic', label: '乡村风格' },
  { value: 'modern', label: '现代风格' },
  { value: 'medieval', label: '中世纪风格' },
  { value: 'fantasy', label: '奇幻风格' },
  { value: 'industrial', label: '工业风格' }
];

const MaterialPresets = [
  {
    name: '木制',
    materials: {
      primary: 'minecraft:oak_planks',
      secondary: 'minecraft:spruce_planks',
      accent: 'minecraft:glass',
      roof: 'minecraft:oak_stairs',
      foundation: 'minecraft:cobblestone'
    }
  },
  {
    name: '石制',
    materials: {
      primary: 'minecraft:stone',
      secondary: 'minecraft:stone_bricks',
      accent: 'minecraft:glass_pane',
      roof: 'minecraft:stone_stairs',
      foundation: 'minecraft:cobblestone'
    }
  },
  {
    name: '别墅',
    materials: {
      primary: 'minecraft:quartz_block',
      secondary: 'minecraft:smooth_stone',
      accent: 'minecraft:glass',
      roof: 'minecraft:quartz_stairs',
      foundation: 'minecraft:polished_andesite'
    }
  },
  {
    name: '城堡',
    materials: {
      primary: 'minecraft:cobblestone',
      secondary: 'minecraft:mossy_cobblestone',
      accent: 'minecraft:iron_bars',
      roof: 'minecraft:cobblestone_stairs',
      foundation: 'minecraft:stone'
    }
  }
];

const RedstoneTypes = [
  { value: 'lever_switch', label: '拉杆开关', icon: '⚡', difficulty: '简单' },
  { value: 'button_door', label: '按钮门', icon: '🚪', difficulty: '简单' },
  { value: 'pressure_plate_trap', label: '压力板陷阱', icon: '💥', difficulty: '简单' },
  { value: 'piston_pusher', label: '活塞推送器', icon: '➡️', difficulty: '中等' },
  { value: 'redstone_clock', label: '红石脉冲', icon: '⏱️', difficulty: '中等' },
  { value: 'tnt_cannon', label: 'TNT大炮', icon: '💣', difficulty: '中等' },
  { value: 'auto_farm', label: '自动农场', icon: '🌾', difficulty: '中等' },
  { value: 'elevator', label: '电梯', icon: '🛗', difficulty: '高级' },
  { value: 'storage_system', label: '存储系统', icon: '📦', difficulty: '高级' },
  { value: 'light_sensor', label: '光感器', icon: '☀️', difficulty: '高级' },
  { value: 'combination_lock', label: '密码锁', icon: '🔐', difficulty: '高级' },
  { value: 'sequential_logic', label: '顺序逻辑', icon: '🔢', difficulty: '高级' }
];

export const AIBuildingPanel: React.FC<AIBuildingPanelProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('building');
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">🤖 AI 智能生成器</h2>
              <p className="text-blue-100 text-sm mt-1">人工智能自动生成 Minecraft 建筑结构和红石电路</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('building')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'building'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              🏠 建筑生成
            </button>
            <button
              onClick={() => setActiveTab('redstone')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'redstone'
                  ? 'text-red-600 border-b-2 border-red-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              ⚡ 红石电路
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {activeTab === 'building' && <BuildingTab />}
          {activeTab === 'redstone' && <RedstoneTab />}
        </div>
      </div>
    </div>
  );
};

const BuildingTab: React.FC = () => {
  const [config, setConfig] = useState<Partial<BuildingConfig>>({
    type: 'house',
    size: { width: 10, height: 8, depth: 10 },
    style: 'rustic',
    materials: MaterialPresets[0].materials,
    features: []
  });

  const [description, setDescription] = useState('');
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(0);

  const setBlocks = useSceneStore((state) => state.setBlocks);

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setProgress({ stage: 'analyzing', progress: 0, message: '准备生成...' });

    try {
      const aiCore = AIBuildingCore.getInstance();
      const request: AIGenerationRequest = {
        description: description || `${config.type} - ${config.style}`,
        config
      };

      const blocks = await aiCore.generateStructure(request, setProgress);

      const blockMap = new Map<string, BlockPlacement>();
      blocks.forEach(block => {
        const key = `${block.x},${block.y},${block.z}`;
        blockMap.set(key, block);
      });

      setBlocks(blockMap);

      setProgress({
        stage: 'complete',
        progress: 100,
        message: `生成完成！共 ${blocks.length} 个方块`
      });

      setTimeout(() => {
        setIsGenerating(false);
        setProgress(null);
      }, 2000);

    } catch (error) {
      console.error('生成失败:', error);
      setProgress({
        stage: 'complete',
        progress: 0,
        message: '生成失败，请重试'
      });
      setIsGenerating(false);
    }
  }, [config, description, setBlocks]);

  const handleOptimize = useCallback(() => {
    const sceneStore = useSceneStore.getState();
    const blocks = Array.from(sceneStore.blocks.values());
    
    if (blocks.length === 0) {
      alert('没有可优化的建筑结构');
      return;
    }

    const optimizer = AIBuildingOptimizer.getInstance();
    const result = optimizer.optimize(blocks, config as BuildingConfig);

    const blockMap = new Map<string, BlockPlacement>();
    result.optimizedBlocks.forEach(block => {
      const key = `${block.x},${block.y},${block.z}`;
      blockMap.set(key, block);
    });

    setBlocks(blockMap);
    alert(`优化完成！\n${result.improvements.join('\n')}\n\n剩余 ${result.optimizedBlocks.length} 个方块`);
  }, [config, setBlocks]);

  const handlePresetChange = (index: number) => {
    setSelectedPreset(index);
    setConfig(prev => ({
      ...prev,
      materials: MaterialPresets[index].materials
    }));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              建筑类型
            </label>
            <div className="grid grid-cols-4 gap-2">
              {BuildingTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setConfig(prev => ({ ...prev, type: type.value as BuildingConfig['type'] }))}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    config.type === type.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="text-2xl">{type.icon}</div>
                  <div className="text-xs mt-1">{type.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              建筑风格
            </label>
            <select
              value={config.style}
              onChange={(e) => setConfig(prev => ({ ...prev, style: e.target.value as BuildingConfig['style'] }))}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {BuildingStyles.map((style) => (
                <option key={style.value} value={style.value}>
                  {style.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                宽度
              </label>
              <input
                type="number"
                value={config.size?.width || 10}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  size: { ...prev.size!, width: parseInt(e.target.value) || 10 }
                }))}
                min="5"
                max="50"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                高度
              </label>
              <input
                type="number"
                value={config.size?.height || 8}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  size: { ...prev.size!, height: parseInt(e.target.value) || 8 }
                }))}
                min="4"
                max="30"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                深度
              </label>
              <input
                type="number"
                value={config.size?.depth || 10}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  size: { ...prev.size!, depth: parseInt(e.target.value) || 10 }
                }))}
                min="5"
                max="50"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              材质预设
            </label>
            <div className="grid grid-cols-2 gap-2">
              {MaterialPresets.map((preset, index) => (
                <button
                  key={preset.name}
                  onClick={() => handlePresetChange(index)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    selectedPreset === index
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="font-medium">{preset.name}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {Object.keys(preset.materials).length} 种材质
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              建筑描述（可选）
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="描述你想要的建筑特点..."
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3">📊 当前配置</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">类型:</span>
                <span className="font-medium">
                  {BuildingTypes.find(t => t.value === config.type)?.label}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">风格:</span>
                <span className="font-medium">
                  {BuildingStyles.find(s => s.value === config.style)?.label}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">尺寸:</span>
                <span className="font-medium">
                  {config.size?.width} × {config.size?.height} × {config.size?.depth}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">材质:</span>
                <span className="font-medium">
                  {MaterialPresets[selectedPreset]?.name}
                </span>
              </div>
            </div>
          </div>

          {isGenerating && progress && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-3">⏳ 生成进度</h3>
              <div className="mb-3">
                <div className="flex justify-between text-sm text-blue-600 mb-1">
                  <span>{progress.message}</span>
                  <span>{progress.progress}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress.progress}%` }}
                  />
                </div>
              </div>
              <div className="text-xs text-blue-600">
                阶段: {progress.stage === 'analyzing' && '📝 分析中'}
                {progress.stage === 'designing' && '🎨 设计中'}
                {progress.stage === 'building' && '🧱 生成中'}
                {progress.stage === 'optimizing' && '✨ 优化中'}
                {progress.stage === 'complete' && '✅ 完成'}
              </div>
            </div>
          )}

          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 mb-3">💡 使用提示</h3>
            <ul className="text-sm text-green-700 space-y-2">
              <li>• 选择建筑类型和风格，系统会自动生成对应的结构</li>
              <li>• 调整尺寸参数可以改变建筑的大小</li>
              <li>• 材质预设提供不同的视觉效果</li>
              <li>• 生成后可以使用优化功能提升建筑质量</li>
              <li>• 点击"添加到场景"将建筑放置到当前场景</li>
            </ul>
          </div>

          <div className="bg-amber-50 rounded-lg p-4">
            <h3 className="font-semibold text-amber-800 mb-3">⚠️ 注意事项</h3>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• 较大的建筑可能需要更长的生成时间</li>
              <li>• 建议先生成小型建筑熟悉功能</li>
              <li>• 优化功能会改进建筑的结构和美观度</li>
              <li>• 可以使用变换功能旋转或镜像建筑</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 px-6 py-4 flex items-center justify-between rounded-lg">
        <div className="flex gap-3">
          <button
            onClick={handleOptimize}
            disabled={isGenerating}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            🧹 优化建筑
          </button>
          <button
            onClick={() => {
              const optimizer = AIBuildingOptimizer.getInstance();
              const sceneStore = useSceneStore.getState();
              const blocks = Array.from(sceneStore.blocks.values());
              if (blocks.length > 0) {
                const transformed = optimizer.transformStructure(blocks, 'rotate-90');
                const blockMap = new Map<string, BlockPlacement>();
                transformed.forEach(block => {
                  const key = `${block.x},${block.y},${block.z}`;
                  blockMap.set(key, block);
                });
                setBlocks(blockMap);
              }
            }}
            disabled={isGenerating}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            🔄 旋转90°
          </button>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
          >
            {isGenerating ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                生成中...
              </>
            ) : (
              <>
                🚀 生成建筑
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const RedstoneTab: React.FC = () => {
  const [selectedCircuit, setSelectedCircuit] = useState<RedstoneCircuitType | null>(null);
  const [complexity, setComplexity] = useState<'simple' | 'medium' | 'advanced'>('simple');
  const [circuitInfo, setCircuitInfo] = useState<{
    description: string;
    tips: string[];
  } | null>(null);

  const setBlocks = useSceneStore((state) => state.setBlocks);

  const handleCircuitSelect = (type: RedstoneCircuitType) => {
    setSelectedCircuit(type);
    
    const generator = RedstoneCircuitGenerator.getInstance();
    const config: RedstoneCircuitConfig = {
      type,
      complexity
    };
    
    const result = generator.generate(config);
    setCircuitInfo({
      description: result.descriptionZh,
      tips: result.tips
    });
  };

  const handleGenerateCircuit = useCallback(() => {
    if (!selectedCircuit) {
      alert('请先选择一个红石电路类型');
      return;
    }

    const generator = RedstoneCircuitGenerator.getInstance();
    const config: RedstoneCircuitConfig = {
      type: selectedCircuit,
      complexity
    };
    
    const result = generator.generate(config);
    
    const blockMap = new Map<string, BlockPlacement>();
    result.blocks.forEach(block => {
      const key = `${block.x},${block.y},${block.z}`;
      blockMap.set(key, block);
    });

    setBlocks(blockMap);
    
    alert(`✅ 红石电路生成完成！\n\n${result.descriptionZh}\n\n方块数量: ${result.blocks.length}\n\n提示:\n${result.tips.map(t => `• ${t}`).join('\n')}`);
  }, [selectedCircuit, complexity, setBlocks]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              选择红石电路类型
            </label>
            <div className="grid grid-cols-3 gap-3">
              {RedstoneTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => handleCircuitSelect(type.value as RedstoneCircuitType)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedCircuit === type.value
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-red-300 hover:bg-red-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{type.icon}</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      type.difficulty === '简单' ? 'bg-green-100 text-green-700' :
                      type.difficulty === '中等' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {type.difficulty}
                    </span>
                  </div>
                  <div className="font-medium text-sm">{type.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              电路复杂度
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setComplexity('simple')}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                  complexity === 'simple'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-green-300'
                }`}
              >
                🟢 简单
              </button>
              <button
                onClick={() => setComplexity('medium')}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                  complexity === 'medium'
                    ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                    : 'border-gray-200 hover:border-yellow-300'
                }`}
              >
                🟡 中等
              </button>
              <button
                onClick={() => setComplexity('advanced')}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                  complexity === 'advanced'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 hover:border-red-300'
                }`}
              >
                🔴 高级
              </button>
            </div>
          </div>

          {circuitInfo && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">📝 电路说明</h3>
              <p className="text-sm text-blue-700 mb-3">{circuitInfo.description}</p>
              
              <h4 className="font-medium text-blue-800 mb-2">💡 建造提示:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                {circuitInfo.tips.map((tip, index) => (
                  <li key={index}>• {tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-lg p-6">
            <h3 className="font-bold text-2xl mb-4 flex items-center gap-2">
              <span className="text-3xl">⚡</span>
              <span className="text-red-800">红石电路生成器</span>
            </h3>
            
            <div className="space-y-3 text-sm text-red-700">
              <p>
                <strong>红石系统</strong>是 Minecraft 中用于创建复杂电路和自动化的机制。
                使用红石元件，你可以建造各种有用的设备和机关。
              </p>
              
              <div>
                <strong className="text-red-800">主要红石元件:</strong>
                <ul className="mt-2 space-y-1">
                  <li>• <strong>红石粉</strong> - 传导信号</li>
                  <li>• <strong>红石火把</strong> - 提供信号/反相器</li>
                  <li>• <strong>红石中继器</strong> - 延迟/放大信号</li>
                  <li>• <strong>红石比较器</strong> - 比较/测量信号</li>
                  <li>• <strong>观察者</strong> - 检测方块变化</li>
                  <li>• <strong>活塞/粘性活塞</strong> - 推动方块</li>
                  <li>• <strong>漏斗</strong> - 物品传输</li>
                  <li>• <strong>投掷器/发射器</strong> - 分发物品</li>
                </ul>
              </div>

              <div>
                <strong className="text-red-800">信号等级:</strong>
                <p className="mt-1">
                  红石信号强度范围为 0-15，每经过一个方块减少1级。
                  中继器可以恢复信号强度到15级。
                </p>
              </div>

              <div>
                <strong className="text-red-800">信号方向:</strong>
                <p className="mt-1">
                  红石粉可以向所有相邻方向传导信号。
                  中继器和比较器只能单向传导。
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <h3 className="font-semibold text-purple-800 mb-3">🎯 常见应用场景</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2 text-purple-700">
                <span>🏠</span>
                <span>自动门</span>
              </div>
              <div className="flex items-center gap-2 text-purple-700">
                <span>🚪</span>
                <span>密码锁</span>
              </div>
              <div className="flex items-center gap-2 text-purple-700">
                <span>💡</span>
                <span>灯光控制</span>
              </div>
              <div className="flex items-center gap-2 text-purple-700">
                <span>🌾</span>
                <span>自动农场</span>
              </div>
              <div className="flex items-center gap-2 text-purple-700">
                <span>📦</span>
                <span>物品分类</span>
              </div>
              <div className="flex items-center gap-2 text-purple-700">
                <span>⏱️</span>
                <span>脉冲发生器</span>
              </div>
              <div className="flex items-center gap-2 text-purple-700">
                <span>🛗</span>
                <span>垂直运输</span>
              </div>
              <div className="flex items-center gap-2 text-purple-700">
                <span>💣</span>
                <span>TNT大炮</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-2">💻 技术细节</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 游戏刻 (tick) = 0.05秒 = 1/20秒</li>
              <li>• 红石粉传导延迟: 0刻</li>
              <li>• 红石中继器延迟: 1-4刻 (可调)</li>
              <li>• 活塞伸出: 2刻</li>
              <li>• 粘性活塞拉回: 3刻</li>
              <li>• 观察者检测: 1刻</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 px-6 py-4 flex items-center justify-between rounded-lg">
        <div className="text-sm text-gray-600">
          {selectedCircuit ? (
            <span>已选择: <strong className="text-red-600">
              {RedstoneTypes.find(t => t.value === selectedCircuit)?.label}
            </strong></span>
          ) : (
            <span>请选择一个红石电路类型</span>
          )}
        </div>

        <button
          onClick={handleGenerateCircuit}
          disabled={!selectedCircuit}
          className="px-6 py-2 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg hover:from-red-700 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
        >
          ⚡ 生成红石电路
        </button>
      </div>
    </div>
  );
};

export default AIBuildingPanel;
