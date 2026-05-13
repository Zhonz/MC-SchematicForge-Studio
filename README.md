# SchematicForge

MC投影工坊 - 新一代 Minecraft 智能投影生成与编辑工具

## 特性

- ✨ 现代化的 React + TypeScript 架构
- 🎨 精美的 UI 设计和流畅的用户体验
- 🎮 完整的方块放置、破坏、选择工具
- 🤖 强大的 AI 自动建筑系统
- ⚡ 高性能 Three.js 3D 渲染
- 🔧 企业级错误处理和日志系统
- 📊 实时性能监控和开发者工具
- 📦 支持 .schem 和 .litematic 格式导入导出

## 技术栈

- **框架**: React 18 + TypeScript 5
- **3D 渲染**: Three.js
- **状态管理**: Zustand
- **构建工具**: Vite
- **样式**: Tailwind CSS
- **测试**: Vitest + Testing Library

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 预览构建结果

```bash
npm run preview
```

### 类型检查

```bash
npm run type-check
```

### 运行测试

```bash
npm test
```

### 测试覆盖率

```bash
npm run test:coverage
```

## 项目结构

```
schematicforge/
├── src/
│   ├── components/       # React 组件
│   ├── services/         # 业务服务层
│   │   ├── errorService.ts       # 错误处理服务
│   │   ├── loggerService.ts      # 日志服务
│   │   ├── performanceService.ts # 性能监控服务
│   │   ├── cacheService.ts       # 缓存服务
│   │   └── configService.ts      # 配置管理服务
│   ├── stores/           # Zustand 状态管理
│   ├── utils/            # 工具函数库
│   ├── types/            # TypeScript 类型定义
│   └── test/             # 测试文件
├── .github/
│   └── workflows/        # GitHub Actions CI/CD
└── package.json
```

## 企业级特性

### 1. 完整的错误处理系统

- 结构化的错误对象
- 错误订阅和通知机制
- 操作包装器自动捕获错误

### 2. 强大的日志系统

- 多级日志 (debug, info, warn, error, fatal)
- 日志历史记录
- 日志订阅和导出

### 3. 实时性能监控

- FPS 监控
- 内存使用统计
- 渲染时间测量
- 方块计数追踪

### 4. 智能缓存策略

- TTL 过期机制
- 自动清理过期缓存
- 同步和异步缓存获取

### 5. 配置管理

- 持久化配置存储
- 类型安全的配置访问
- 配置变更订阅

### 6. CI/CD 流水线

- 自动类型检查
- 代码 linting
- 自动化测试
- 构建产物上传

## 开发者工具

应用内置了开发者工具面板，可通过工具栏右侧的按钮打开：

- **性能指标**: 查看 FPS、内存使用、渲染时间等
- **日志**: 浏览应用运行日志
- **错误**: 查看错误历史记录

## License

MIT
