# MC投影工坊 SchematicForge Studio

> 🎮 **新一代 Minecraft 智能投影生成与编辑工具**  
> ✨ 一句话生成建筑 | 🧠 红石电路模拟 | 📖 Wiki 内置 | 🔧 一键导出投影

---

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-blue?style=for-the-badge" alt="Version">
  <img src="https://img.shields.io/badge/React-18+-00d8ff?style=for-the-badge&logo=react&logoColor=white" alt="React">
  <img src="https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=three.js&logoColor=white" alt="Three.js">
  <img src="https://img.shields.io/badge/Tauri-24C8DB?style=for-the-badge&logo=tauri&logoColor=white" alt="Tauri">
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License">
</p>

---

## 🌟 项目简介

**MC投影工坊** 是一个全平台的 Minecraft 智能投影生成与编辑器，集成了 **AI 建筑生成**、**红石电路模拟**、**Minecraft Wiki 查阅** 和 **投影文件导出** 功能。

### 为什么选择 MC投影工坊？

| 特性 | MC投影工坊 | 传统工具 |
|:---:|:---:|:---:|
| 🤖 **AI 生成建筑** | ✅ 一句话描述即可生成 | ❌ 手动搭建 |
| 🌐 **全平台支持** | ✅ Web + 桌面端 | ❌ 仅游戏内模组 |
| 🧠 **红石电路模拟** | ✅ 实时预览运行效果 | ❌ 需进入游戏测试 |
| 📖 **内置 Wiki** | ✅ 离线查阅 | ❌ 需浏览器搜索 |
| 💾 **投影导出** | ✅ Litematica / Schematic | ❌ 依赖模组 |
| 📱 **移动端适配** | ✅ 响应式设计 | ❌ 不支持 |

---

## 🎯 核心功能

### 🤖 AI 智能建筑生成

输入自然语言描述，AI 自动生成 Minecraft 建筑结构：

```
输入: "一座中世纪城堡，带塔楼和护城河"
输出: 完整 3D 建筑结构 + 投影文件
```

### 🎨 3D 场景编辑器

- **放置/破坏方块** - 支持 Minecraft 全部方块
- **视角控制** - 旋转、缩放、平移、第一/第三人称
- **选区操作** - 复制、粘贴、填充、镜像
- **多层编辑** - 支持多个子区域

### 🧠 红石电路模拟

- **实时预览** - 查看红石信号传播效果
- **逻辑门库** - 预置或门、与门、非门、异或门等
- **电路模板** - 常用红石电路一键加载
- **Tick 模拟** - 支持播放、暂停、快进、重置

### 📖 Minecraft Wiki 集成

- **离线查阅** - 无需联网即可查看详细信息
- **中英文切换** - 支持多语言显示
- **快速搜索** - 按名称、类别、用途搜索
- **关联内容** - 方块、物品、生物、机制全覆盖

### 🔧 投影文件导出

- **Litematica 格式** - 兼容 Litematica 模组
- **Schematic 格式** - 兼容 WorldEdit
- **材料清单** - 自动生成建筑所需材料表

---

## 🚀 本地开发

```bash
# 克隆项目
git clone https://github.com/Zhonz/MC-SchematicForge-Studio.git
cd MC-SchematicForge-Studio

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建桌面应用
npm run tauri build
```

---

## 🏗️ 技术架构

```
┌─────────────────────────────────────────────────────────────┐
│                        客户端层                              │
│  ┌──────────────────┐    ┌──────────────────────────────┐   │
│  │  Web 端          │    │  Tauri 桌面端                 │   │
│  │  React + Three.js│    │  共享 Web 代码 + Rust 后端    │   │
│  └──────────────────┘    └──────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                        服务端层                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │  API 网关    │  │  AI 服务     │  │  Wiki 缓存服务   │   │
│  │  Node.js     │  │  Python      │  │  Node.js         │   │
│  └──────────────┘  └──────────────┘  └──────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                        数据层                                │
│  PostgreSQL │ Redis │ S3/MinIO 文件存储                     │
└─────────────────────────────────────────────────────────────┘
```

### 技术栈

| 组件 | 技术 |
|------|------|
| **前端** | React 18 + Three.js + TypeScript |
| **桌面端** | Tauri 2.0 (Rust + WebView) |
| **AI 服务** | Python + PyTorch / BlockGPT API |
| **后端** | Node.js + PostgreSQL + Redis |
| **3D 渲染** | WebGL via Three.js |

---

## 📋 功能列表

### ✅ 已实现

- [x] 3D 场景基础渲染
- [x] 方块放置与破坏
- [x] 视角控制（旋转、缩放、平移）
- [x] 基础红石电路模拟
- [x] Litematica 格式导出
- [x] Wiki 内容查阅
- [x] AI 建筑生成（BlockGPT）
- [x] 响应式界面（手机/平板/桌面）

### 🚧 开发中

- [ ] 完整红石组件（中继器、比较器、活塞）
- [ ] 逻辑门预制库
- [ ] 实体系统（生物模型、AI 行为）
- [ ] 昼夜循环与生物生成
- [ ] Schematic 格式导出
- [ ] 本地 AI 生成（Mine-Builder）
- [ ] 多语言支持（中英文）
- [ ] 版本控制与协作编辑

### 📝 计划中

- [ ] AR/VR 支持
- [ ] 在线多人协作
- [ ] Minecraft 服务器同步
- [ ] 版本转换 (1.12 ↔ 1.20)
- [ ] 材质包自定义
- [ ] 红石电路分析工具

---

## 📚 使用指南

### 创建新场景

1. 点击 **新建场景** 按钮
2. 选择世界大小（默认 64×64×256）
3. 进入编辑模式

### 放置方块

1. 左侧方块浏览器中选择目标方块
2. 点击场景中的位置放置
3. 右键点击破坏方块

### AI 生成建筑

1. 点击顶部 **AI 生成** 按钮
2. 输入描述文字（如 "a cozy house with garden"）
3. 调整参数（尺寸、材料、复杂度）
4. 点击生成，等待 AI 输出
5. 预览并导入到场景

### 导出投影文件

1. 完成场景编辑
2. 点击 **导出** 按钮
3. 选择格式（Litematica / Schematic）
4. 下载投影文件
5. 将文件放入 Minecraft 的 `.minecraft/schematics/` 目录

---

## 🤝 贡献指南

欢迎贡献！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 提交 Pull Request

### 开发环境要求

- Node.js >= 20
- Rust >= 1.70
- Python >= 3.10 (用于 AI 服务)
- PostgreSQL >= 15

---

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE)

Wiki 内容遵循 [CC BY-NC-SA](https://creativecommons.org/licenses/by-nc-sa/4.0/) 协议

---

## 🙏 致谢

- [Litematica](https://github.com/maruohon/litematica) - 原版投影模组
- [Three.js](https://threejs.org) - 3D 渲染引擎
- [Tauri](https://tauri.app) - 跨平台框架
- [BlockGPT](https://blockgpt.ai) - AI 建筑生成服务
- [Minecraft Wiki](https://minecraft.wiki) - Wiki 内容来源
- [Mine-Builder](https://github.com/heartrue/Mine-Builder) - AI 生成参考

---

<p align="center">
  <sub>Made with ❤️ by the SchematicForge Studio team</sub>
</p>
