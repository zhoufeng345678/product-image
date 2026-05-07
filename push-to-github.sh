#!/bin/bash
# 自动推送 product-image 代码到 GitHub
# 在网络恢复后运行此脚本

echo "=== 开始推送 product-image 代码到 GitHub ==="
echo "时间: $(date)"
echo ""

# 1. 推送前端代码
echo "1. 推送前端代码..."
cd /var/www/crazydream.site/app/product-image
echo "当前目录: $(pwd)"
echo "Git 状态:"
git status --short
echo ""

echo "尝试推送到 GitHub..."
if git push origin main; then
    echo "✅ 前端代码推送成功!"
else
    echo "❌ 前端代码推送失败，错误码: $?"
    echo "尝试使用强制推送..."
    if git push --force-with-lease origin main; then
        echo "✅ 前端代码强制推送成功!"
    else
        echo "❌ 前端代码强制推送也失败"
    fi
fi
echo ""

# 2. 设置并推送后端代码
echo "2. 设置并推送后端代码..."
cd /var/www/crazydream.site/app/product-image-server
echo "当前目录: $(pwd)"
echo "Git 状态:"
git status --short
echo ""

# 检查是否已设置远程仓库
if ! git remote | grep -q origin; then
    echo "未设置远程仓库，正在设置..."
    echo "请选择后端代码存储方案:"
    echo "1. 创建独立仓库: https://github.com/zhoufeng345678/product-image-server"
    echo "2. 合并到现有仓库的 server/ 目录"
    echo ""
    echo "默认使用方案1 (独立仓库)"
    
    # 设置远程仓库
    git remote add origin https://github.com/zhoufeng345678/product-image-server.git
    echo "✅ 已设置远程仓库"
fi

echo "尝试推送到 GitHub..."
if git push -u origin master; then
    echo "✅ 后端代码推送成功!"
else
    echo "❌ 后端代码推送失败，错误码: $?"
fi
echo ""

# 3. 显示最终状态
echo "=== 推送完成 ==="
echo "前端仓库: https://github.com/zhoufeng345678/product-image"
echo "后端仓库: https://github.com/zhoufeng345678/product-image-server"
echo "时间: $(date)"