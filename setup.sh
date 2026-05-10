#!/bin/bash
# 心本向阳 - AI 学习助手 一键安装脚本
# 同学们只需运行此脚本即可完成安装

set -e

echo "🌻 心本向阳 - AI 学习助手 安装程序"
echo "=================================="
echo ""

# Check Python
if command -v python3.11 &> /dev/null; then
    PYTHON=python3.11
elif command -v python3 &> /dev/null; then
    PYTHON=python3
else
    echo "❌ 需要 Python 3.9+，请先安装: https://www.python.org/downloads/"
    exit 1
fi

echo "✅ Python: $($PYTHON --version)"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 需要 Node.js，请先安装: https://nodejs.org/"
    exit 1
fi
echo "✅ Node.js: $(node --version)"

# Install backend dependencies
echo ""
echo "📦 安装后端依赖..."
cd "$(dirname "$0")/backend"
$PYTHON -m pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple --quiet

# Install frontend dependencies
echo "📦 安装前端依赖..."
cd "$(dirname "$0")/frontend"
npm install --silent

# Build frontend
echo "🔨 构建前端..."
npm run build

# Done
echo ""
echo "=================================="
echo "✅ 安装完成！"
echo ""
echo "🌻 启动方式一：双击 launch.sh"
echo "🧠 启动方式二：cd electron && npm start"
echo ""
echo "请确保 backend/.env 中配置了有效的 API Key"
echo "=================================="
