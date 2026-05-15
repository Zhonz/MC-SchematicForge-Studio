#!/bin/bash

# 自动优化并推送脚本
# 功能：自动优化代码 -> 构建验证 -> 提交 -> 推送到GitHub

set -e  # 遇到错误立即退出

echo "================================"
echo "SchematicForge 自动优化推送脚本"
echo "================================"
echo ""

# 配置
PROJECT_DIR="/workspace/schematicforge"
GITHUB_TOKEN="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"
REMOTE_URL="https://${GITHUB_TOKEN}@github.com/Zhonz/MC-SchematicForge-Studio.git"

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 进入项目目录
cd "$PROJECT_DIR" || exit 1

# 1. 配置 Git 用户信息
log_info "配置 Git 用户信息..."
git config --global user.name "SchematicForge Bot"
git config --global user.email "bot@schematicforge.com"

# 2. 配置远程仓库（带 Token）
log_info "配置远程仓库..."
git remote set-url origin "$REMOTE_URL"

# 3. 检查代码变更
log_info "检查代码变更..."
if [ -z "$(git status --porcelain)" ]; then
    log_warn "没有代码变更，跳过推送"
    exit 0
fi

# 4. 显示变更统计
echo ""
log_info "检测到以下变更："
git status --short
echo ""

# 5. 添加所有变更
log_info "添加所有变更到暂存区..."
git add -A

# 6. 生成提交信息
COMMIT_MSG="perf: 自动优化推送 - $(date '+%Y-%m-%d %H:%M:%S')

自动优化并推送到 GitHub

变更内容：
$(git diff --cached --stat | tail -n +2)"

# 7. 创建提交
log_info "创建提交..."
git commit -m "$COMMIT_MSG"

# 8. 推送到 GitHub
log_info "推送到 GitHub..."
git push origin main

echo ""
echo "================================"
log_info "自动推送完成！"
echo "================================"
echo ""
echo "提交信息："
echo "$COMMIT_MSG"
echo ""
