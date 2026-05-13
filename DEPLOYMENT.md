# 部署指南

## 📋 自动部署工作流程

项目已经配置好完整的自动部署系统，每次推送到 GitHub 后会自动：
1. 运行 TypeScript 类型检查
2. 运行 ESLint 代码检查
3. 构建项目
4. 运行测试
5. 创建 GitHub Release 并上传构建产物

---

## 🚀 使用方法

### 方法 1: 完整部署（推荐）

运行完整的部署流程，包含类型检查和构建：

```bash
cd /workspace/schematicforge
npm run deploy

# 或者直接运行脚本
bash deploy.sh
```

**此命令会：**
1. ✓ 运行 TypeScript 类型检查
2. ✓ 构建项目
3. ✓ Git 自动提交
4. ✓ 推送到 GitHub
5. ✓ 触发 GitHub Actions 自动构建和发布

---

### 方法 2: 快速推送

如果已经确保代码质量，可以快速推送：

```bash
npm run quick-push

# 或者直接运行脚本
bash quick-push.sh
```

---

### 方法 3: 手动推送

也可以手动执行步骤：

```bash
# 1. 构建项目
npm run build

# 2. 添加更改
git add .

# 3. 提交
git commit -m "your message"

# 4. 推送
git push
```

---

## 📂 新增的部署脚本

### deploy.sh
完整部署脚本，包含类型检查和构建

### quick-push.sh
快速推送脚本，跳过完整检查

### 新增的 npm scripts
```json
{
  "deploy": "bash deploy.sh",
  "quick-push": "bash quick-push.sh"
}
```

---

## 🔧 GitHub Actions 工作流

项目已经配置了两个 GitHub Actions 工作流：

### 1. CI/CD Pipeline (ci.yml)
- 触发: Push 到 main/develop 分支, PR
- 功能: 类型检查、Lint、构建、测试

### 2. Build & Release (build-release.yml)
- 触发: Push 到 main 分支, Tag
- 功能: 自动构建并创建 GitHub Release

---

## 📊 查看构建状态

推送代码后，访问：

https://github.com/Zhonz/MC-SchematicForge-Studio/actions

查看 GitHub Actions 的构建进度和结果。

---

## 🎯 完整的自动化流程

```
npm run deploy
    ↓
[本地检查]
    ↓
git commit & push
    ↓
[GitHub Actions]
    ↓
自动构建 & 测试
    ↓
创建 GitHub Release ✓
    ↓
构建产物自动上传 🎉
```

---

## 📝 Release 产物说明

GitHub Release 会包含：
- `schematicforge-web.zip` - Web 版压缩包 (ZIP)
- `schematicforge-web.tar.gz` - Web 版压缩包 (TAR.GZ)

下载后解压，直接用浏览器打开 `index.html` 即可使用！

---

## ⚠️ 注意事项

1. **首次使用前**: 确保 Git 已经配置好认证
2. **权限问题**: 给脚本添加执行权限: `chmod +x deploy.sh quick-push.sh`
3. **GitHub Token**: 如需自动化，需要配置 GitHub Personal Access Token

---

## 🎉 开始使用

准备好了吗？现在就试试：

```bash
cd /workspace/schematicforge
npm run deploy
```

就这么简单！🚀
