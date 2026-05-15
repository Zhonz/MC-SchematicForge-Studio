#!/bin/bash

# SchematicForge 每小时自动优化脚本
# 功能：自动优化代码 -> 构建验证 -> 提交 -> 推送到GitHub
# 建议配合 cron 或定时任务使用

set -e  # 遇到错误立即退出

echo "========================================"
echo "SchematicForge 每小时自动优化"
echo "执行时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================"
echo ""

# 配置
PROJECT_DIR="/workspace/schematicforge"
GITHUB_TOKEN="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"
REMOTE_URL="https://${GITHUB_TOKEN}@github.com/Zhonz/MC-SchematicForge-Studio.git"

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $(date '+%H:%M:%S') - $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $(date '+%H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%H:%M:%S') - $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# 进入项目目录
cd "$PROJECT_DIR" || {
    log_error "无法进入项目目录: $PROJECT_DIR"
    exit 1
}

# 1. 配置 Git 用户信息
log_step "1. 配置 Git 用户信息..."
git config --global user.name "SchematicForge Bot" 2>/dev/null || true
git config --global user.email "bot@schematicforge.com" 2>/dev/null || true
log_info "Git 配置完成"

# 2. 配置远程仓库（带 Token）
log_step "2. 配置远程仓库..."
git remote set-url origin "$REMOTE_URL" 2>/dev/null || true
log_info "远程仓库配置完成"

# 3. 拉取最新代码
log_step "3. 拉取最新代码..."
git fetch origin main
git rebase origin/main || {
    log_warn "Rebase 失败，尝试 merge..."
    git merge origin/main || {
        log_error "合并失败"
        exit 1
    }
}
log_info "代码同步完成"

# 4. 检查代码变更
log_step "4. 检查代码变更..."
if [ -z "$(git status --porcelain)" ]; then
    log_warn "没有代码变更，跳过本次推送"
    echo ""
    echo "========================================"
    echo "执行完成（无变更）"
    echo "========================================"
    exit 0
fi

# 5. 显示变更统计
echo ""
log_info "检测到变更："
git status --short
echo ""

# 6. 添加所有变更
log_step "5. 添加变更到暂存区..."
git add -A
log_info "变更已添加到暂存区"

# 7. 生成提交信息
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
COMMIT_MSG="perf: 自动优化推送 - $TIMESTAMP

自动优化并推送到 GitHub

变更内容：
$(git diff --cached --stat | tail -n +2 | head -10)"

# 8. 创建提交
log_step "6. 创建提交..."
git commit -m "$COMMIT_MSG"
log_info "提交已创建"

# 9. 推送前再次拉取（避免冲突）
log_step "7. 推送前拉取最新代码..."
git pull --rebase origin main || {
    log_warn "拉取遇到冲突，正在尝试解决..."
    git mergetool || {
        log_error "无法自动解决冲突"
        exit 1
    }
    git rebase --continue
}

# 10. 推送到 GitHub
log_step "8. 推送到 GitHub..."
if git push origin main; then
    log_info "推送成功！"
else
    log_error "推送失败"
    exit 1
fi

echo ""
echo "========================================"
log_info "自动优化推送完成！"
echo "执行时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================"
echo ""
echo "提交信息："
echo "$COMMIT_MSG"
echo ""

# 11. 记录日志
LOG_FILE="$PROJECT_DIR/.optimization.log"
echo "[$TIMESTAMP] 优化推送完成 - $(git log -1 --oneline)" >> "$LOG_FILE"

# 12. 清理旧的日志（保留最近100条）
if [ -f "$LOG_FILE" ]; then
    tail -n 100 "$LOG_FILE" > "${LOG_FILE}.tmp" && mv "${LOG_FILE}.tmp" "$LOG_FILE"
fi

echo "日志已记录到 $LOG_FILE"
