#!/bin/bash
# 自动部署脚本 - 构建后自动上传到 GitHub

set -e  # 遇到错误立即退出

cd /workspace/schematicforge

echo "==============================================="
echo "   MC投影工坊 SchematicForge - 自动部署脚本"
echo "==============================================="
echo ""

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. 检查 Git 状态
echo -e "${YELLOW}[1/5] 检查 Git 状态...${NC}"
git status
echo ""

# 2. 运行类型检查
echo -e "${YELLOW}[2/5] 运行类型检查...${NC}"
if npm run type-check; then
    echo -e "${GREEN}✓ 类型检查通过${NC}"
else
    echo -e "${RED}✗ 类型检查失败${NC}"
    exit 1
fi
echo ""

# 3. 构建项目
echo -e "${YELLOW}[3/5] 构建项目...${NC}"
if npm run build; then
    echo -e "${GREEN}✓ 构建成功${NC}"
else
    echo -e "${RED}✗ 构建失败${NC}"
    exit 1
fi
echo ""

# 4. Git 操作
echo -e "${YELLOW}[4/5] 准备 Git 提交...${NC}"

# 添加所有更改
git add .

# 检查是否有更改
if git diff --cached --quiet; then
    echo -e "${YELLOW}⚠ 没有更改需要提交${NC}"
else
    # 创建提交信息
    COMMIT_MSG="chore: 自动部署 $(date '+%Y-%m-%d %H:%M:%S')"
    echo -e "提交信息: ${COMMIT_MSG}"
    
    if git commit -m "$COMMIT_MSG"; then
        echo -e "${GREEN}✓ 提交成功${NC}"
    else
        echo -e "${RED}✗ 提交失败${NC}"
        exit 1
    fi
fi
echo ""

# 5. 推送到 GitHub
echo -e "${YELLOW}[5/5] 推送到 GitHub...${NC}"

# 尝试使用 HTTPS 推送
git remote set-url origin https://github.com/Zhonz/MC-SchematicForge-Studio.git

if git push -u origin main; then
    echo ""
    echo -e "${GREEN}==============================================="
    echo "   ✓ 部署成功！"
    echo "   GitHub Actions 将自动构建和发布"
    echo "===============================================${NC}"
else
    echo ""
    echo -e "${RED}==============================================="
    echo "   ✗ 推送失败"
    echo ""
    echo "   请检查:"
    echo "   1. Git 认证配置"
    echo "   2. 网络连接"
    echo "   3. 仓库权限"
    echo "===============================================${NC}"
    exit 1
fi

echo ""
echo "🚀 部署流程完成！"
echo ""
echo "下一步："
echo "- 访问 https://github.com/Zhonz/MC-SchematicForge-Studio/actions 查看 GitHub Actions 构建状态"
echo "- 构建完成后会自动创建 Release"
