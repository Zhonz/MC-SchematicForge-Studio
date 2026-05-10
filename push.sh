#!/bin/bash
# Push script for MC-SchematicForge-Studio
# Run this in your local terminal after cloning or in the project directory

cd /workspace/schematicforge

echo "=== MC投影工坊 SchematicForge Studio - Push Script ==="
echo ""
echo "选择认证方式:"
echo "1. HTTPS (需要输入用户名/token)"
echo "2. SSH (需要配置 SSH key)"
echo ""
read -p "选择 (1/2): " choice

if [ "$choice" = "1" ]; then
    git remote set-url origin https://github.com/Zhonz/MC-SchematicForge-Studio.git
    echo "已设置 HTTPS remote"
    echo "注意: 需要使用 GitHub Personal Access Token 代替密码"
    echo "生成 Token: https://github.com/settings/tokens"
    git push -u origin main
elif [ "$choice" = "2" ]; then
    git remote set-url origin git@github.com:Zhonz/MC-SchematicForge-Studio.git
    echo "已设置 SSH remote"
    git push -u origin main
else
    echo "无效选择"
    exit 1
fi
