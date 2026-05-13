# 贡献指南

感谢你有兴趣为 SchematicForge 做出贡献！

## 开发指南

### 环境设置

1. Fork 并克隆仓库
2. 安装依赖: `npm install`
3. 启动开发服务器: `npm run dev`

### 代码规范

我们使用以下工具确保代码质量:

- **ESLint**: 代码质量检查
- **Prettier**: 代码格式化
- **TypeScript**: 静态类型检查

### Git 提交规范

每次提交前会自动运行:
1. `lint-staged: 对暂存的文件运行格式化和 lint
2. 类型检查

### 可用脚本

```bash
# 开发模式
npm run dev

# 类型检查
npm run type-check

# Lint 检查
npm run lint

# 自动修复 lint 问题
npm run lint:fix

# 格式化代码
npm run format

# 运行测试
npm test

# 构建生产版本
npm run build
```

### 提交 Pull Request

1. 创建一个新分支
2. 进行更改
3. 确保测试通过
4. 提交 PR
