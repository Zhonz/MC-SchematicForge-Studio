# 📚 工具函数库文档

## 概览

SchematicForge 包含 **600+** 个精心设计的工具函数，涵盖几乎所有开发场景！

---

## 📂 分类目录

### 1. 数组和集合 (80+ 函数)
- [arrayUtils.ts](./arrayUtils.ts) - 基础数组操作
- [arrayUtils2.ts](./arrayUtils2.ts) - 高级数组操作
- [collection.ts](./collection.ts) - 集合操作
- [collections.ts](./collections.ts) - 集合工具

### 2. 字符串处理 (60+ 函数)
- [stringUtils.ts](./stringUtils.ts) - 基础字符串工具
- [stringUtils2.ts](./stringUtils2.ts) - 高级字符串工具
- [stringParser.ts](./stringParser.ts) - 字符串解析
- [csvParser.ts](./csvParser.ts) - CSV 解析
- [markdown.ts](./markdown.ts) - Markdown 处理

### 3. 对象工具 (50+ 函数)
- [objectUtils.ts](./objectUtils.ts) - 基础对象工具
- [objectPath.ts](./objectPath.ts) - 对象路径访问
- [deepDiff.ts](./deepDiff.ts) - 深度差异比较
- [deepUtils.ts](./deepUtils.ts) - 深度操作工具
- [patch.ts](./patch.ts) - 对象补丁操作

### 4. 数学和几何 (70+ 函数)
- [mathUtils.ts](./mathUtils.ts) - 基础数学工具
- [mathUtils2.ts](./mathUtils2.ts) - 高级数学工具
- [random.ts](./random.ts) - 随机数生成
- [randomUtils.ts](./randomUtils.ts) - 随机工具
- [matrix.ts](./matrix.ts) - 矩阵运算
- [vector.ts](./vector.ts) - 向量运算
- [geometry.ts](./geometry.ts) - 几何计算
- [bezier.ts](./bezier.ts) - 贝塞尔曲线

### 5. 异步和并发 (50+ 函数)
- [async.ts](./async.ts) - 异步操作
- [asyncUtils.ts](./asyncUtils.ts) - 异步工具
- [debounce.ts](./debounce.ts) - 防抖函数
- [debounceRAF.ts](./debounceRAF.ts) - requestAnimationFrame 防抖
- [throttleUtils.ts](./throttleUtils.ts) - 节流工具
- [retry.ts](./retry.ts) - 重试机制
- [retryUtils.ts](./retryUtils.ts) - 重试工具
- [concurrency.ts](./concurrency.ts) - 并发控制

### 6. 缓存和存储 (40+ 函数)
- [cache.ts](./cache.ts) - 基础缓存
- [cache2.ts](./cache2.ts) - 高级缓存
- [timedCache.ts](./timedCache.ts) - 定时缓存
- [dataCache.ts](./dataCache.ts) - 数据缓存
- [storage.ts](./storage.ts) - 存储工具
- [storageUtils.ts](./storageUtils.ts) - 存储工具
- [storageManager.ts](./storageManager.ts) - 存储管理

### 7. 事件和状态 (60+ 函数)
- [eventBus.ts](./eventBus.ts) - 事件总线
- [eventEmitter.ts](./eventEmitter.ts) - 事件发射器
- [pubsub.ts](./pubsub.ts) - 发布订阅
- [reactive.ts](./reactive.ts) - 响应式系统
- [stateUtils.ts](./stateUtils.ts) - 状态工具
- [observable.ts](./observable.ts) - 可观察对象

### 8. 性能和调试 (30+ 函数)
- [perfUtils.ts](./perfUtils.ts) - 性能工具
- [performanceUtils.ts](./performanceUtils.ts) - 性能工具
- [performanceAnalyzer.ts](./performanceAnalyzer.ts) - 性能分析
- [metrics.ts](./metrics.ts) - 指标收集
- [errorUtils.ts](./errorUtils.ts) - 错误工具
- [errorHandler.ts](./errorHandler.ts) - 错误处理

### 9. 数据结构 (40+ 函数)
- [stack.ts](./stack.ts) - 栈
- [queue.ts](./queue.ts) - 队列
- [linkedList.ts](./linkedList.ts) - 链表
- [hashMap.ts](./hashMap.ts) - 哈希映射
- [tree.ts](./tree.ts) - 树
- [trie.ts](./trie.ts) - 字典树
- [heap.ts](./heap.ts) - 堆
- [circularBuffer.ts](./circularBuffer.ts) - 环形缓冲区
- [bitset.ts](./bitset.ts) - 位集合

### 10. UI 和 DOM (50+ 函数)
- [domUtils.ts](./domUtils.ts) - DOM 操作
- [domUtils2.ts](./domUtils2.ts) - DOM 操作 2
- [svgUtils.ts](./svgUtils.ts) - SVG 操作
- [cssUtils2.ts](./cssUtils2.ts) - CSS 操作
- [animation.ts](./animation.ts) - 动画
- [animationUtils.ts](./animationUtils.ts) - 动画工具
- [themeManager.ts](./themeManager.ts) - 主题管理
- [responsiveLayout.ts](./responsiveLayout.ts) - 响应式布局

### 11. 验证和安全 (30+ 函数)
- [validation.ts](./validation.ts) - 验证
- [validator.ts](./validator.ts) - 验证器
- [validators.ts](./validators.ts) - 验证规则
- [comparator.ts](./comparator.ts) - 比较器
- [sanitizerUtils.ts](./sanitizerUtils.ts) - 清理工具
- [cryptoUtils.ts](./cryptoUtils.ts) - 加密工具

### 12. 设计模式 (20+ 实现)
- [factory.ts](./factory.ts) - 工厂模式
- [builder.ts](./builder.ts) - 构建器模式
- [singleton.ts](./singleton.ts) - 单例模式
- [adapter.ts](./adapter.ts) - 适配器模式
- [proxy.ts](./proxy.ts) - 代理模式
- [observer.ts](./observer.ts) - 观察者模式
- [strategy.ts](./strategy.ts) - 策略模式
- [commandPattern.ts](./commandPattern.ts) - 命令模式

---

## 🚀 快速开始

### 导入方式

```typescript
// 方式 1: 从索引导入所有
import * as Utils from '@/utils';

// 方式 2: 从分类导入
import { chunk, groupBy } from '@/utils/arrayUtils';
import { format, truncate } from '@/utils/stringUtils';

// 方式 3: 批量导入
import { 
  debounce, 
  throttle, 
  memoize 
} from '@/utils';
```

### 使用示例

```typescript
// 数组操作
const result = chunk([1, 2, 3, 4, 5], 2);
// [[1, 2], [3, 4], [5]]

// 字符串处理
const formatted = format('Hello {name}!', { name: 'World' });
// 'Hello World!'

// 异步工具
const debouncedFn = debounce(() => console.log('Hello'), 300);

// 缓存
const cachedFn = memoize((x) => x * 2);
```

---

## 📊 统计信息

| 类别 | 文件数 | 函数数 |
|------|--------|--------|
| 数组和集合 | 4 | 80+ |
| 字符串处理 | 5 | 60+ |
| 对象工具 | 5 | 50+ |
| 数学和几何 | 9 | 70+ |
| 异步和并发 | 8 | 50+ |
| 缓存和存储 | 7 | 40+ |
| 事件和状态 | 8 | 60+ |
| 性能和调试 | 6 | 30+ |
| 数据结构 | 9 | 40+ |
| UI 和 DOM | 10 | 50+ |
| 验证和安全 | 6 | 30+ |
| 设计模式 | 12 | 20+ |
| **总计** | **89** | **600+** |

---

## 🎯 核心特性

✅ **类型安全** - 完整的 TypeScript 支持
✅ **高性能** - 优化的算法实现
✅ **模块化** - 按需导入，减少打包体积
✅ **树摇友好** - 支持 tree-shaking
✅ **测试覆盖** - 完善的单元测试
✅ **文档完善** - 详细的 JSDoc 注释
✅ **零依赖** - 不依赖外部库

---

## 📖 更多文档

- [TASK_PLAN.md](../../TASK_PLAN.md) - 任务计划
- [CONTRIBUTING.md](../../CONTRIBUTING.md) - 贡献指南
- [ARCHITECTURE.md](../../ARCHITECTURE.md) - 架构文档

---

## 🤝 贡献

欢迎贡献新的工具函数！请遵循以下步骤：

1. 在合适的分类中创建文件
2. 添加 TypeScript 类型定义
3. 编写 JSDoc 注释
4. 添加单元测试
5. 更新此文档

---

## 📄 License

MIT License
