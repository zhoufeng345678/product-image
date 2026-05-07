#!/bin/bash
# 测试网络连接，特别是到 GitHub 的连接

echo "=== 网络连接测试 ==="
echo "时间: $(date)"
echo ""

# 测试基本网络
echo "1. 测试基本网络连接:"
if ping -c 2 8.8.8.8 >/dev/null 2>&1; then
    echo "✅ 可以访问 8.8.8.8 (Google DNS)"
else
    echo "❌ 无法访问 8.8.8.8"
fi

if ping -c 2 114.114.114.114 >/dev/null 2>&1; then
    echo "✅ 可以访问 114.114.114.114 (国内 DNS)"
else
    echo "❌ 无法访问 114.114.114.114"
fi
echo ""

# 测试 GitHub 访问
echo "2. 测试 GitHub 访问:"
echo "测试 GitHub API..."
if curl -s --max-time 10 https://api.github.com >/dev/null 2>&1; then
    echo "✅ 可以访问 GitHub API"
else
    echo "❌ 无法访问 GitHub API"
fi

echo "测试 GitHub 主页..."
if curl -s --max-time 10 https://github.com >/dev/null 2>&1; then
    echo "✅ 可以访问 GitHub 主页"
else
    echo "❌ 无法访问 GitHub 主页"
fi

echo "测试特定仓库..."
if curl -s --max-time 10 https://github.com/zhoufeng345678/product-image >/dev/null 2>&1; then
    echo "✅ 可以访问 product-image 仓库"
else
    echo "❌ 无法访问 product-image 仓库"
fi
echo ""

# 测试 Git 协议
echo "3. 测试 Git 协议连接:"
echo "测试 HTTPS 协议..."
if timeout 5 git ls-remote https://github.com/zhoufeng345678/product-image.git HEAD >/dev/null 2>&1; then
    echo "✅ HTTPS 协议连接正常"
else
    echo "❌ HTTPS 协议连接失败"
fi

echo "测试 SSH 协议..."
if timeout 5 ssh -T git@github.com 2>&1 | grep -q "successfully authenticated"; then
    echo "✅ SSH 协议连接正常"
else
    echo "❌ SSH 协议连接失败或未配置"
fi
echo ""

# 显示当前 Git 配置
echo "4. 当前 Git 配置:"
cd /var/www/crazydream.site/app/product-image
echo "远程仓库URL:"
git config --get remote.origin.url
echo ""

echo "=== 测试完成 ==="
echo "如果网络测试通过但推送失败，可能是认证或仓库权限问题"
echo "请检查 GitHub token 是否有效"