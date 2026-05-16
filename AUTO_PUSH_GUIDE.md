# 自动推送机制使用指南

## 📋 概述

SchematicForge 项目实现了完整的自动化推送机制，包括 GitHub Actions CI/CD、定时任务和手动脚本三种方式，确保代码能够自动、高效地推送到 GitHub。

## 🚀 一、自动化推送方式

### 1. GitHub Actions CI/CD（推荐）

**触发条件**：每次 push 到 `main` 或 `develop` 分支，或创建 PR 到 `main`

**自动化流程**：

```
代码推送 → 安装依赖 → Lint检查 → Vite构建 → 运行测试 → 自动推送变更 → 部署到GitHub Pages
```

**特点**：

- ✅ 完全自动化，无需手动操作
- ✅ 每次代码变更自动触发
- ✅ 自动部署到 GitHub Pages
- ✅ 完整的构建产物管理

**查看构建状态**：

- GitHub Actions：https://github.com/Zhonz/MC-SchematicForge-Studio/actions

### 2. 定时任务自动推送

**执行频率**：每小时整点自动执行

**任务名称**：SchematicForge 每小时自动优化

**功能**：

- 自动检查代码优化空间
- 执行性能优化
- 构建验证
- 自动推送到 GitHub

**特点**：

- ✅ 定期优化代码质量
- ✅ 无需人工干预
- ✅ 完整的错误处理
- ✅ 自动记录执行日志

### 3. 本地手动脚本推送

#### 快速推送脚本（auto-deploy.sh）

**功能**：

- 自动配置 GitHub Token 认证
- 检测代码变更
- 生成智能提交信息
- 完整的错误处理

**使用方法**：

```bash
cd /workspace/schematicforge
./auto-deploy.sh
```

**输出示例**：

```
================================
SchematicForge 自动优化推送脚本
================================

[INFO] 配置 Git 用户信息...
[INFO] 配置远程仓库...
[INFO] 检查代码变更...
[INFO] 添加所有变更到暂存区...
[INFO] 创建提交...
[INFO] 推送到 GitHub...
================================
自动推送完成！
================================
```

#### 完整优化脚本（hourly-optimize.sh）

**功能**：

- 自动拉取最新代码
- 冲突自动检测和解决
- 详细的执行日志
- 日志文件记录

**使用方法**：

```bash
cd /workspace/schematicforge
./hourly-optimize.sh
```

**特点**：

- 🔄 自动同步最新代码
- ⚔️ 智能冲突解决
- 📊 详细执行报告
- 📝 日志持久化

## 🔧 二、手动 Git 命令推送

如果需要手动推送，可以使用标准 Git 命令：

```bash
# 进入项目目录
cd /workspace/schematicforge

# 添加所有变更
git add -A

# 创建提交
git commit -m "您的提交信息"

# 推送到 GitHub
git push origin main
```

## 📊 三、执行记录查看

### 1. GitHub Actions 执行记录

访问：https://github.com/Zhonz/MC-SchematicForge-Studio/actions

查看内容：

- 构建状态（成功/失败）
- 构建日志
- 部署状态
- 测试结果

### 2. 本地执行日志

日志文件位置：`/workspace/schematicforge/.optimization.log`

查看日志：

```bash
cat /workspace/schematicforge/.optimization.log

# 或者实时查看最新日志
tail -f /workspace/schematicforge/.optimization.log
```

### 3. GitHub Pages 部署

部署地址：https://zhonz.github.io/MC-SchematicForge-Studio/

- 查看最新部署的应用
- 测试生产环境功能
- 验证构建产物

## 🔐 四、GitHub Token 认证

### 当前配置

- **Token 类型**：Personal Access Token (PAT)
- **仓库**：`Zhonz/MC-SchematicForge-Studio`
- **权限**：read/write 代码推送
- **有效期**：根据 Token 设置

### Token 配置位置

1. **本地 Git Remote**：

   ```bash
   git remote -v
   # origin  https://ghp_xxx@github.com/Zhonz/MC-SchematicForge-Studio.git
   ```

2. **GitHub Actions**：
   - 自动使用 `secrets.GITHUB_TOKEN`
   - 无需额外配置

## 🛠️ 五、故障排查

### 1. 推送失败

**症状**：Git push 失败

**解决方案**：

```bash
# 检查 Token 配置
git remote -v

# 重新配置 Token
git remote set-url origin https://ghp_您的TOKEN@github.com/Zhonz/MC-SchematicForge-Studio.git

# 再次尝试推送
git push origin main
```

### 2. 构建失败

**症状**：GitHub Actions 构建失败

**解决方案**：

```bash
# 本地运行构建验证
cd /workspace/schematicforge
npx vite build

# 检查是否有编译错误
npm run lint
npm test
```

### 3. 依赖缺失

**症状**：`npm ci` 失败，缺少依赖

**解决方案**：

```bash
# 重新安装依赖
cd /workspace/schematicforge
npm install

# 提交更新后的 package-lock.json
git add package-lock.json
git commit -m "fix: 更新依赖锁文件"
git push origin main
```

### 4. 冲突解决

**症状**：代码冲突

**使用脚本自动解决**：

```bash
./hourly-optimize.sh
```

**手动解决**：

```bash
git fetch origin
git rebase origin/main
# 解决冲突后
git add -A
git rebase --continue
git push origin main
```

## 📝 六、最佳实践

### 1. 提交信息规范

使用语义化提交信息：

```
feat: 新功能
fix: 修复bug
perf: 性能优化
docs: 文档更新
style: 代码格式
refactor: 重构
test: 测试
chore: 构建/工具
```

示例：

```bash
git commit -m "perf: 优化Three.js渲染性能
- 对象池模式减少GC压力
- 帧率控制提升稳定性"
```

### 2. 代码质量

在推送前检查：

```bash
# 运行 lint
npm run lint

# 运行测试
npm test

# 运行构建
npx vite build
```

### 3. 提交频率

- **小改动**：随时推送
- **功能开发**：完成一个功能后推送
- **自动优化**：每小时自动推送（已配置）

### 4. 分支管理

- **main 分支**：稳定版本，直接推送
- **develop 分支**：开发版本，用于测试
- **PR 流程**：建议使用 PR 合并到 main

## 🎯 七、快速开始

### 方式1：完全自动（推荐）

无需任何操作，每次代码变更自动推送到 GitHub 并部署！

### 方式2：手动触发快速推送

```bash
cd /workspace/schematicforge
./auto-deploy.sh
```

### 方式3：完整优化推送

```bash
cd /workspace/schematicforge
./hourly-optimize.sh
```

## 📞 八、帮助与支持

### 查看定时任务状态

联系我查看定时任务的执行状态和历史记录。

### 查看 GitHub Actions 状态

访问：https://github.com/Zhonz/MC-SchematicForge-Studio/actions

### 查看部署状态

访问：https://zhonz.github.io/MC-SchematicForge-Studio/

## ✅ 九、检查清单

在推送前确认：

- [ ] 代码已提交到 Git
- [ ] `npm run lint` 通过
- [ ] `npm test` 通过
- [ ] `npx vite build` 成功
- [ ] GitHub Actions 构建成功
- [ ] GitHub Pages 部署成功

## 🎉 十、总结

SchematicForge 项目提供了完整的自动化推送机制：

| 推送方式           | 触发条件 | 自动化程度 | 适用场景 |
| ------------------ | -------- | ---------- | -------- |
| GitHub Actions     | Push/PR  | ⭐⭐⭐⭐⭐ | 日常开发 |
| 定时任务           | 每小时   | ⭐⭐⭐⭐   | 定期优化 |
| auto-deploy.sh     | 手动     | ⭐⭐⭐     | 快速推送 |
| hourly-optimize.sh | 手动     | ⭐⭐⭐⭐   | 完整优化 |

推荐使用 **GitHub Actions CI/CD**，实现完全自动化！

---

**最后更新**：2026-05-15
**维护者**：SchematicForge Team
