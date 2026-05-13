# 项目架构文档

## 目录结构

```
schematicforge/
├── src/
│   ├── components/       # React 组件层
│   │   ├── AIBuildingPanel.tsx    # AI 建筑面板
│   │   ├── BlockBrowser.tsx       # 方块浏览器
│   │   ├── SceneViewport.tsx      # 场景视口
│   │   └── ...
│   ├── services/       # 业务服务层 (新增)
│   │   ├── errorService.ts       # 错误处理服务
│   │   ├── loggerService.ts      # 日志服务
│   │   ├── performanceService.ts # 性能监控服务
│   │   ├── cacheService.ts       # 缓存服务
│   │   └── configService.ts      # 配置管理服务
│   ├── stores/         # Zustand 状态管理
│   │   ├── appStore.ts           # 应用全局状态
│   │   ├── sceneStore.ts         # 场景状态
│   │   └── structureStore.ts     # 结构状态
│   ├── utils/          # 工具函数库
│   │   ├── aiBuildingCore.ts     # AI 建筑核心
│   │   ├── redstoneCircuitGenerator.ts # 红石电路生成器
│   │   └── ...
│   ├── types/          # TypeScript 类型定义
│   │   └── index.ts
│   ├── styles/         # 全局样式
│   ├── data/           # 静态数据
│   ├── test/           # 测试文件
│   ├── App.tsx         # 主应用组件
│   └── main.tsx        # 应用入口
├── .github/
│   └── workflows/    # GitHub Actions CI/CD
├── .vscode/
│   ├── settings.json
│   └── extensions.json
├── .eslintrc.cjs
├── .prettierrc
└── package.json
```

## 架构分层

### 1. 组件层 (Components)
- 负责 UI 渲染
- 使用 Zustand 从 stores 获取状态
- 调用 services 处理业务逻辑
- 尽可能保持纯函数和无状态

### 2. 状态管理层 (Stores)
- 使用 Zustand 管理全局状态
- 状态变更逻辑集中在 stores
- 提供订阅和更新机制
- 与 services 层交互

### 3. 服务层 (Services)
- 封装业务逻辑
- 提供可复用的服务实例
- 错误处理和日志记录
- 性能监控
- 配置管理

### 4. 工具层 (Utils)
- 纯函数工具
- 无副作用
- 可独立测试

### 5. 类型层 (Types)
- 集中的 TypeScript 类型定义
- 类型安全保障

## 数据流

```
用户操作 → 组件 → Store → Service → 状态更新 → 组件重渲染
              ↓
            日志记录
              ↓
            错误处理
```

## 设计原则

### 1. 单一职责
每个模块只负责一件事

### 2. 依赖倒置
- 组件依赖服务抽象
- 服务不依赖具体实现

### 3. 可测试性
- 纯函数优先
- 依赖注入友好

### 4. 可扩展性
- 模块化设计
- 插件架构思想

## 开发规范

### 新增功能流程
1. 在 `types/` 定义类型
2. 在 `services/` 实现业务逻辑
3. 在 `stores/` 管理状态
4. 在 `components/` 构建 UI
5. 在 `test/` 编写测试

### 错误处理规范
- 使用 errorService 处理错误
- 错误要包含 code, message, severity
- 错误需要被记录

### 日志规范
- 使用 loggerService 记录日志
- 不同级别使用不同方法
- 日志要包含足够上下文
