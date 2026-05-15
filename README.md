# SchematicForge Studio

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)
![React](https://img.shields.io/badge/React-18-blue.svg)
![Three.js](https://img.shields.io/badge/Three.js-r128-orange.svg)

**MC投影工坊 - 新一代 Minecraft 智能投影生成与编辑工具**

[English](#english) | [中文](#中文)

</div>

---

## 中文

### 📖 项目简介

SchematicForge Studio 是一款专为 Minecraft 玩家和建筑师设计的智能投影生成与编辑工具。它结合了现代 Web 技术、AI 智能建筑和强大的 3D 渲染引擎，为用户提供流畅、直观的建筑创作体验。

### ✨ 核心特性

#### 🎨 3D 可视化编辑

- **实时 3D 渲染** - 基于 Three.js 的高性能 3D 引擎
- **流畅的相机控制** - 支持旋转、缩放、平移等多种视角操作
- **方块浏览器** - 快速搜索和选择 Minecraft 方块
- **实时预览** - 所见即所得的编辑体验

#### 🤖 AI 智能建筑

- **自动建筑生成** - AI 驱动的智能建筑系统
- **多种建筑风格** - 支持现代、古典、中世纪等多种风格
- **参数化设计** - 通过参数控制建筑细节
- **智能优化** - 自动优化方块使用和结构稳定性

#### ⚡ Redstone 电路系统

- **电路生成器** - 自动生成复杂的 Redstone 电路
- **逻辑门** - 支持 AND、OR、NOT 等逻辑门
- **时序电路** - 支持时钟、计数器等时序电路
- **电路优化** - 自动优化电路布局

#### 📦 格式支持

- **.schem 格式** - 支持 Sponge Schematic 格式导入导出
- **.litematic 格式** - 支持 Litematic 格式导入导出
- **格式转换** - 不同格式之间的相互转换

#### 🔧 企业级架构

- **错误处理系统** - 完整的错误捕获、记录和通知机制
- **日志系统** - 多级日志记录，支持导出和分析
- **性能监控** - 实时 FPS、内存、渲染时间监控
- **智能缓存** - TTL 缓存机制，提升性能

### 🚀 快速开始

#### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0

#### 安装依赖

```bash
npm install
```

#### 开发模式

```bash
npm run dev
```

访问 http://localhost:5173 查看应用

#### 构建生产版本

```bash
npm run build
```

#### 预览构建结果

```bash
npm run preview
```

#### 运行测试

```bash
npm test                    # 运行所有测试
npm run test:coverage       # 运行测试并生成覆盖率报告
```

#### 代码质量检查

```bash
npm run lint               # ESLint 检查
npm run type-check         # TypeScript 类型检查
```

### 📁 项目结构

```
schematicforge/
├── src/
│   ├── components/          # React 组件
│   │   ├── ThreeScene.tsx          # 3D 场景渲染
│   │   ├── AIBuildingPanel.tsx     # AI 建筑面板
│   │   ├── BlockBrowser.tsx        # 方块浏览器
│   │   ├── Toolbar.tsx             # 工具栏
│   │   ├── StatusBar.tsx           # 状态栏
│   │   └── ...
│   ├── services/            # 业务服务层
│   │   ├── errorService.ts         # 错误处理服务
│   │   ├── loggerService.ts        # 日志服务
│   │   ├── performanceService.ts   # 性能监控服务
│   │   ├── cacheService.ts         # 缓存服务
│   │   └── configService.ts        # 配置管理服务
│   ├── stores/              # Zustand 状态管理
│   │   ├── appStore.ts             # 应用状态
│   │   ├── sceneStore.ts           # 场景状态
│   │   └── structureStore.ts       # 结构状态
│   ├── utils/               # 工具函数库
│   │   ├── arrayUtilsEnhanced.ts   # 数组工具
│   │   ├── objectUtilsEnhanced.ts  # 对象工具
│   │   ├── composite.ts            # 函数式编程工具
│   │   └── ...
│   ├── types/               # TypeScript 类型定义
│   └── test/                # 测试文件
├── .github/
│   └── workflows/           # GitHub Actions CI/CD
├── docs/                    # 文档
├── PERFORMANCE_OPTIMIZATION.md  # 性能优化文档
└── package.json
```

### 🎯 性能优化

本项目经过全面的性能优化，包括：

#### 渲染优化

- **对象池模式** - 复用 Three.js 对象，减少 GC 压力
- **实例化渲染** - 支持最多 5000 个方块实例
- **帧率控制** - 稳定的 60fps 渲染
- **阴影优化** - 平衡画质与性能的阴影配置

#### 工具函数优化

- **算法优化** - 使用 for 循环替代高阶函数，性能提升 15-40%
- **Set/Map 优化** - O(1) 查找替代 O(n) 数组查找
- **边界检查** - 完善的参数验证和类型保护

#### 构建优化

- **Tree-shaking** - 去除未使用代码
- **代码压缩** - 生产构建去除 console/debugger
- **预构建依赖** - 提升开发服务器启动速度

详细优化报告请查看 [PERFORMANCE_OPTIMIZATION.md](./PERFORMANCE_OPTIMIZATION.md)

### 🛠️ 技术栈

| 类别         | 技术                     |
| ------------ | ------------------------ |
| **框架**     | React 18 + TypeScript 5  |
| **3D 渲染**  | Three.js                 |
| **状态管理** | Zustand                  |
| **构建工具** | Vite                     |
| **样式**     | Tailwind CSS             |
| **测试**     | Vitest + Testing Library |
| **CI/CD**    | GitHub Actions           |
| **代码质量** | ESLint + Prettier        |

### 📊 企业级特性

#### 1. 完整的错误处理系统

```typescript
import { errorService } from '@/services/errorService'

errorService.onError(error => {
  console.error('捕获错误:', error)
})

const result = await errorService.wrapOperation(async () => {
  /* 操作 */
}, '操作名称')
```

#### 2. 强大的日志系统

```typescript
import { loggerService } from '@/services/loggerService'

loggerService.info('应用启动')
loggerService.warn('性能警告', { fps: 30 })
loggerService.error('发生错误', new Error('示例'))
```

#### 3. 实时性能监控

```typescript
import { performanceService } from '@/services/performanceService'

performanceService.startMonitoring()
const metrics = performanceService.getMetrics()
console.log('FPS:', metrics.fps)
```

#### 4. 智能缓存策略

```typescript
import { cacheService } from '@/services/cacheService'

cacheService.set('key', data, 60000) // 缓存 60 秒
const cached = cacheService.get('key')
```

### 🔄 CI/CD 流水线

项目配置了完整的 GitHub Actions CI/CD 流水线：

- ✅ **自动类型检查** - 每次 PR 自动运行 TypeScript 类型检查
- ✅ **代码 Linting** - ESLint 代码质量检查
- ✅ **自动化测试** - 运行所有单元测试和集成测试
- ✅ **构建验证** - 确保构建成功
- ✅ **产物上传** - 自动上传构建产物

### 🤝 贡献指南

我们欢迎所有形式的贡献！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### 📝 开发规范

- **代码风格** - 遵循 ESLint 和 Prettier 配置
- **提交信息** - 使用约定式提交 (Conventional Commits)
- **分支命名** - feature/bugfix/hotfix 前缀
- **测试覆盖** - 新功能必须包含测试

### 📜 更新日志

#### v1.0.0 (2026-05-15)

- ✨ 初始版本发布
- 🎨 完整的 3D 编辑功能
- 🤖 AI 智能建筑系统
- ⚡ Redstone 电路生成器
- 📦 .schem 和 .litematic 格式支持
- 🔧 企业级错误处理和日志系统
- 📊 实时性能监控
- 🚀 全面的性能优化

### 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

### 🙏 致谢

- [Three.js](https://threejs.org/) - 强大的 3D 渲染库
- [React](https://reactjs.org/) - 用户界面库
- [Vite](https://vitejs.dev/) - 下一代前端构建工具
- [Zustand](https://github.com/pmndrs/zustand) - 轻量级状态管理
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先的 CSS 框架

---

## English

### 📖 Introduction

SchematicForge Studio is an intelligent projection generation and editing tool designed for Minecraft players and architects. It combines modern web technologies, AI-driven building systems, and a powerful 3D rendering engine to provide a smooth and intuitive building creation experience.

### ✨ Core Features

#### 🎨 3D Visual Editing

- **Real-time 3D Rendering** - High-performance 3D engine based on Three.js
- **Smooth Camera Controls** - Support for rotation, zoom, pan, and more
- **Block Browser** - Quick search and selection of Minecraft blocks
- **Real-time Preview** - WYSIWYG editing experience

#### 🤖 AI Smart Building

- **Automatic Building Generation** - AI-driven intelligent building system
- **Multiple Architectural Styles** - Modern, classical, medieval, and more
- **Parametric Design** - Control building details through parameters
- **Smart Optimization** - Automatic optimization of block usage and structural stability

#### ⚡ Redstone Circuit System

- **Circuit Generator** - Automatically generate complex Redstone circuits
- **Logic Gates** - Support for AND, OR, NOT, and other logic gates
- **Sequential Circuits** - Support for clocks, counters, and other sequential circuits
- **Circuit Optimization** - Automatic optimization of circuit layout

#### 📦 Format Support

- **.schem Format** - Support for Sponge Schematic format import/export
- **.litematic Format** - Support for Litematic format import/export
- **Format Conversion** - Conversion between different formats

### 🚀 Quick Start

#### Requirements

- Node.js >= 18.0.0
- npm >= 9.0.0

#### Installation

```bash
npm install
```

#### Development Mode

```bash
npm run dev
```

Visit http://localhost:5173 to view the application

#### Build for Production

```bash
npm run build
```

### 🛠️ Tech Stack

| Category             | Technology               |
| -------------------- | ------------------------ |
| **Framework**        | React 18 + TypeScript 5  |
| **3D Rendering**     | Three.js                 |
| **State Management** | Zustand                  |
| **Build Tool**       | Vite                     |
| **Styling**          | Tailwind CSS             |
| **Testing**          | Vitest + Testing Library |
| **CI/CD**            | GitHub Actions           |

### 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

---

<div align="center">

**Made with ❤️ by SchematicForge Team**

[⬆ Back to Top](#schematicforge-studio)

</div>
