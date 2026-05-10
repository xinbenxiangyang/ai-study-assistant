#!/bin/bash
# 心本向阳 - AI 学习助手 启动脚本
# 双击此文件即可启动应用

DIR="$(cd "$(dirname "$0")" && pwd)"
PYTHON="/Library/Frameworks/Python.framework/Versions/3.11/bin/python3.11"

echo "🌻 心本向阳 - 启动中..."

# Kill any existing processes on our ports
lsof -ti:8000 | xargs kill -9 2>/dev/null
lsof -ti:3000 | xargs kill -9 2>/dev/null

# Start backend
echo "  → 启动后端服务..."
cd "$DIR/backend"
$PYTHON -m uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Start frontend
echo "  → 启动前端服务..."
cd "$DIR/apps/student"
npx next dev --port 3000 &
FRONTEND_PID=$!

# Wait for servers
echo "  → 等待服务就绪..."
for i in $(seq 1 15); do
    if curl -s http://localhost:8000/api/health > /dev/null 2>&1; then
        break
    fi
    sleep 1
done

echo "  ✅ 后端就绪 (PID: $BACKEND_PID)"
echo "  ✅ 前端就绪 (PID: $FRONTEND_PID)"

# Open browser
echo "  🌐 打开浏览器..."
sleep 2
open "http://localhost:3000"

echo ""
echo "🌻 心本向阳已启动！"
echo "   浏览器访问: http://localhost:3000"
echo "   管理后台: http://localhost:3000/admin"
echo "   关闭此窗口可停止服务"
echo ""

# Trap Ctrl+C to clean up
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo '已停止服务'; exit 0" INT TERM

# Wait
wait
