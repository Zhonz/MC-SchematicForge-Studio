export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  target?: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  highlight?: boolean;
  action?: {
    type: 'click' | 'hover' | 'keypress' | 'none';
    selector?: string;
    key?: string;
    description: string;
  };
  nextButton?: string;
  skipButton?: string;
  optional?: boolean;
}

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  category: 'beginner' | 'intermediate' | 'advanced' | 'tips';
  difficulty: 1 | 2 | 3 | 4 | 5;
  duration: string;
  steps: TutorialStep[];
  prerequisites?: string[];
  tags?: string[];
  icon?: string;
}

export interface TutorialProgress {
  tutorialId: string;
  completedSteps: string[];
  currentStep: number;
  completedAt?: Date;
  startedAt: Date;
}

export interface TutorialState {
  isActive: boolean;
  currentTutorial: Tutorial | null;
  currentStepIndex: number;
  progress: TutorialProgress[];
  isCompleted: Record<string, boolean>;
}

export const TUTORIALS: Tutorial[] = [
  {
    id: 'getting-started',
    title: '快速入门',
    description: '了解 SchematicForge Studio 的基本界面和操作方式',
    category: 'beginner',
    difficulty: 1,
    duration: '3 分钟',
    icon: '🚀',
    tags: ['基础', '界面', '入门'],
    steps: [
      {
        id: 'welcome',
        title: '欢迎使用 SchematicForge Studio',
        description: '这是一个功能强大的 Minecraft 建筑编辑器。接下来的几分钟内，我们将带你了解基本操作。',
        position: 'center',
        highlight: false,
        nextButton: '开始学习',
      },
      {
        id: 'toolbar-intro',
        title: '工具栏',
        description: '这是工具栏，包含所有建筑工具。从这里你可以选择放置或破坏方块。',
        target: '[data-tutorial="toolbar"]',
        position: 'bottom',
        highlight: true,
        nextButton: '下一步',
      },
      {
        id: 'toolbar-tools',
        title: '选择工具',
        description: '点击放置工具可以进入放置模式，点击破坏工具可以进入破坏模式。',
        target: '[data-tutorial="tool-select"]',
        position: 'bottom',
        highlight: true,
        nextButton: '明白了',
      },
      {
        id: 'viewport-intro',
        title: '3D 视角',
        description: '这是 3D 视角区域，显示你的建筑。你可以在这里查看和编辑你的作品。',
        target: '[data-tutorial="viewport"]',
        position: 'center',
        highlight: true,
        nextButton: '继续',
      },
      {
        id: 'block-browser-intro',
        title: '方块选择器',
        description: '从方块选择器中选择你想要放置的方块类型。',
        target: '[data-tutorial="block-browser"]',
        position: 'right',
        highlight: true,
        nextButton: '好',
      },
      {
        id: 'first-block',
        title: '放置你的第一个方块',
        description: '现在来试试放置一个方块！确保在放置模式下，左键点击地面放置方块。',
        target: '[data-tutorial="viewport"]',
        position: 'center',
        highlight: true,
        action: {
          type: 'click',
          description: '在地面上点击放置方块',
        },
        nextButton: '太棒了！',
      },
      {
        id: 'camera-intro',
        title: '视角控制',
        description: '在视角区域，你可以使用以下方式控制视角：\n\n• 按住鼠标中键并拖动：旋转视角\n• 鼠标滚轮：缩放\n• 按住 Shift + 左键：平移视角',
        target: '[data-tutorial="viewport"]',
        position: 'center',
        highlight: true,
        nextButton: '完成入门',
      },
    ],
  },
  {
    id: 'camera-controls',
    title: '视角控制详解',
    description: '深入学习各种视角控制技巧',
    category: 'beginner',
    difficulty: 2,
    duration: '5 分钟',
    icon: '📷',
    tags: ['视角', '相机', '控制'],
    prerequisites: ['getting-started'],
    steps: [
      {
        id: 'rotate-intro',
        title: '旋转视角',
        description: '在 Blender 风格的编辑器中，按住中键拖动可以旋转视角。这是 3D 编辑中最常用的操作。',
        target: '[data-tutorial="viewport"]',
        position: 'center',
        highlight: true,
        nextButton: '继续',
      },
      {
        id: 'zoom-intro',
        title: '缩放视角',
        description: '使用鼠标滚轮可以缩放视角。向上滚动放大，向下滚动缩小。',
        target: '[data-tutorial="viewport"]',
        position: 'center',
        highlight: true,
        nextButton: '下一步',
      },
      {
        id: 'pan-intro',
        title: '平移视角',
        description: '在放置模式下，按住 Shift + 左键拖动可以平移视角，这样可以查看建筑的各个部分。',
        target: '[data-tutorial="viewport"]',
        position: 'center',
        highlight: true,
        nextButton: '了解了',
      },
      {
        id: 'view-presets',
        title: '预设视角',
        description: '使用右上角的视角按钮可以快速切换到预设角度：正面、背面、左侧、右侧、顶部和等轴测视图。',
        target: '[data-tutorial="view-controls"]',
        position: 'left',
        highlight: true,
        nextButton: '完成',
      },
    ],
  },
  {
    id: 'mobile-gestures',
    title: '移动端手势操作',
    description: '在手机和平板上使用触控手势控制视角',
    category: 'beginner',
    difficulty: 1,
    duration: '4 分钟',
    icon: '📱',
    tags: ['移动端', '触控', '手势'],
    steps: [
      {
        id: 'touch-rotate',
        title: '单指拖动旋转',
        description: '在移动设备上，单指拖动可以旋转视角，就像按住中键一样。',
        target: '[data-tutorial="viewport"]',
        position: 'center',
        highlight: true,
        nextButton: '继续',
      },
      {
        id: 'pinch-zoom',
        title: '双指捏合缩放',
        description: '使用双指捏合动作可以缩放视角。两只手指张开是放大，收拢是缩小。',
        target: '[data-tutorial="viewport"]',
        position: 'center',
        highlight: true,
        nextButton: '下一步',
      },
      {
        id: 'two-finger-pan',
        title: '双指平移',
        description: '双指同时拖动可以平移视角。',
        target: '[data-tutorial="viewport"]',
        position: 'center',
        highlight: true,
        nextButton: '明白了',
      },
      {
        id: 'two-finger-rotate',
        title: '双指旋转缩放',
        description: '双指同时移动时，可以同时进行平移和缩放。两只手指的相对位置决定了缩放比例。',
        target: '[data-tutorial="viewport"]',
        position: 'center',
        highlight: true,
        nextButton: '完成',
      },
    ],
  },
  {
    id: 'block-placement',
    title: '方块放置技巧',
    description: '学习高效放置方块的各种技巧',
    category: 'intermediate',
    difficulty: 2,
    duration: '6 分钟',
    icon: '🧱',
    tags: ['放置', '建筑', '效率'],
    prerequisites: ['getting-started'],
    steps: [
      {
        id: 'ground-placement',
        title: '在地面上放置',
        description: '在放置模式下，直接点击地面就可以放置方块。方块会自动对齐到网格。',
        target: '[data-tutorial="viewport"]',
        position: 'center',
        highlight: true,
        action: {
          type: 'click',
          description: '在地面上点击放置方块',
        },
        nextButton: '继续',
      },
      {
        id: 'face-placement',
        title: '在方块表面放置',
        description: '点击现有方块的任意表面，可以在相邻位置放置新方块。这对于建筑墙壁很有用。',
        target: '[data-tutorial="viewport"]',
        position: 'center',
        highlight: true,
        nextButton: '试试看',
      },
      {
        id: 'stacking',
        title: '堆叠方块',
        description: '点击现有方块的顶部，可以向上堆叠方块。这是建造柱子和高塔的基础。',
        target: '[data-tutorial="viewport"]',
        position: 'center',
        highlight: true,
        nextButton: '明白了',
      },
      {
        id: 'breaking-blocks',
        title: '破坏方块',
        description: '切换到破坏模式后，点击任意方块即可将其删除。',
        target: '[data-tutorial="toolbar"]',
        position: 'bottom',
        highlight: true,
        action: {
          type: 'click',
          selector: '[data-tutorial="break-tool"]',
          description: '点击破坏工具',
        },
        nextButton: '切换到破坏模式',
      },
      {
        id: 'quick-toggle',
        title: '快速切换',
        description: '使用键盘快捷键可以快速切换模式：\n\n• V：放置模式\n• B：破坏模式\n• X：选择模式',
        target: '[data-tutorial="viewport"]',
        position: 'center',
        highlight: false,
        nextButton: '完成本教程',
      },
    ],
  },
  {
    id: 'advanced-tips',
    title: '高级技巧',
    description: '提升效率的高级技巧和快捷键',
    category: 'advanced',
    difficulty: 4,
    duration: '8 分钟',
    icon: '⚡',
    tags: ['高级', '快捷键', '效率'],
    prerequisites: ['block-placement', 'camera-controls'],
    steps: [
      {
        id: 'keyboard-shortcuts',
        title: '常用快捷键',
        description: '掌握这些快捷键可以大大提升效率：\n\n• Ctrl+Z：撤销\n• Ctrl+Shift+Z：重做\n• Delete：删除选中的方块\n• Ctrl+A：全选\n• Ctrl+D：复制选中',
        position: 'center',
        highlight: false,
        nextButton: '继续',
      },
      {
        id: 'camera-animation',
        title: '相机动画',
        description: '使用平滑的相机动画可以创建专业的演示效果。在视图菜单中可以找到动画选项。',
        target: '[data-tutorial="menu-bar"]',
        position: 'bottom',
        highlight: true,
        nextButton: '下一步',
      },
      {
        id: 'grid-snapping',
        title: '网格吸附',
        description: '方块会自动吸附到网格。如果需要精确放置，可以调整网格大小设置。',
        position: 'center',
        highlight: false,
        nextButton: '完成',
      },
    ],
  },
  {
    id: 'redstone-basics',
    title: '红石基础',
    description: '学习红石电路的基本原理',
    category: 'intermediate',
    difficulty: 3,
    duration: '10 分钟',
    icon: '⚡',
    tags: ['红石', '电路', '机械'],
    prerequisites: ['block-placement'],
    steps: [
      {
        id: 'redstone-intro',
        title: '红石介绍',
        description: '红石是 Minecraft 中的电路系统，可以创建自动门、陷阱、农场等各种机械装置。',
        position: 'center',
        highlight: false,
        nextButton: '开始学习',
      },
      {
        id: 'redstone-torch',
        title: '红石火把',
        description: '红石火把是最基本的能量来源。它会持续向相邻的红石线或方块提供信号。',
        target: '[data-tutorial="block-browser"]',
        position: 'right',
        highlight: true,
        nextButton: '继续',
      },
      {
        id: 'redstone-wire',
        title: '红石粉',
        description: '红石粉可以传输红石信号，最多传输15格。信号强度会随着距离递减。',
        position: 'center',
        highlight: true,
        nextButton: '下一步',
      },
      {
        id: 'simple-circuit',
        title: '创建简单电路',
        description: '让我们创建一个简单的电路：放置一个红石火把，它会自动激活旁边的红石线。',
        position: 'center',
        highlight: true,
        action: {
          type: 'none',
          description: '尝试放置红石组件',
        },
        nextButton: '继续',
      },
    ],
  },
  {
    id: 'structure-import',
    title: '导入建筑结构',
    description: '学习如何导入和放置预设建筑结构',
    category: 'intermediate',
    difficulty: 2,
    duration: '5 分钟',
    icon: '📦',
    tags: ['导入', '结构', '预设'],
    steps: [
      {
        id: 'structure-panel',
        title: '结构面板',
        description: '在右侧面板中，你可以看到各种预设的建筑结构，包括刷怪塔、农场等。',
        target: '[data-tutorial="structure-panel"]',
        position: 'right',
        highlight: true,
        nextButton: '继续',
      },
      {
        id: 'select-structure',
        title: '选择结构',
        description: '点击任意结构可以看到预览和详细信息，包括尺寸和生成物。',
        position: 'right',
        highlight: true,
        nextButton: '选择结构',
      },
      {
        id: 'place-structure',
        title: '放置结构',
        description: '选中的结构会以半透明预览形式显示，点击地面即可放置。',
        position: 'center',
        highlight: true,
        nextButton: '完成',
      },
    ],
  },
];

export const CATEGORY_LABELS: Record<Tutorial['category'], string> = {
  beginner: '入门',
  intermediate: '进阶',
  advanced: '高级',
  tips: '技巧',
};

export const DIFFICULTY_LABELS: Record<number, string> = {
  1: '非常简单',
  2: '简单',
  3: '中等',
  4: '困难',
  5: '专家',
};

export function getTutorialById(id: string): Tutorial | undefined {
  return TUTORIALS.find((t) => t.id === id);
}

export function getTutorialsByCategory(category: Tutorial['category']): Tutorial[] {
  return TUTORIALS.filter((t) => t.category === category);
}

export function getTutorialsByDifficulty(difficulty: number): Tutorial[] {
  return TUTORIALS.filter((t) => t.difficulty === difficulty);
}

export function getRecommendedTutorials(completedIds: string[]): Tutorial[] {
  return TUTORIALS.filter((tutorial) => {
    if (completedIds.includes(tutorial.id)) return false;
    if (!tutorial.prerequisites) return true;
    return tutorial.prerequisites.every((prereq) => completedIds.includes(prereq));
  }).slice(0, 3);
}

export function calculateTutorialProgress(tutorial: Tutorial, completedSteps: string[]): number {
  return Math.round((completedSteps.length / tutorial.steps.length) * 100);
}
