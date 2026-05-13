#!/bin/bash
# 快速推送脚本 - 跳过完整构建检查，直接推送

cd /workspace/schematicforge

echo "==============================================="
echo "   快速推送 (跳过完整检查)"
echo "==============================================="
echo ""

# 添加所有更改
git add .

# 创建提交信息
COMMIT_MSG="update: $(date '+%Y-%m-%d %H:%M:%S')"

# 提交
if git commit -m "$COMMIT_MSG" 2>/dev/null; then
    echo "✓ 提交成功"
else
    echo "⚠ 没有更改或提交失败"
fi

# 推送
git remote set-url origin https://github.com/Zhonz/MC-SchematicForge-Studio.git
git push -u origin main

echo ""
echo "✓ 推送到 GitHub 完成！"
