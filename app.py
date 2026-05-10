#!/usr/bin/env python3.11
"""心本向阳 - AI 学习助手 桌面启动器"""
import subprocess
import sys
import os
import time
import threading
import webbrowser
import http.client
import signal

PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(PROJECT_DIR, 'backend')
FRONTEND_DIR = os.path.join(PROJECT_DIR, 'frontend')
PYTHON = sys.executable

backend_proc = None
frontend_proc = None
running = True


def check_port(port, timeout=30):
    """Wait for a port to become available."""
    for i in range(timeout):
        try:
            conn = http.client.HTTPConnection('localhost', port, timeout=1)
            conn.request('GET', '/api/health' if port == 8000 else '/')
            conn.getresponse()
            conn.close()
            return True
        except Exception:
            time.sleep(1)
    return False


def start_backend():
    global backend_proc
    env = os.environ.copy()
    env['DEV_MODE'] = 'true'
    backend_proc = subprocess.Popen(
        [PYTHON, '-m', 'uvicorn', 'main:app', '--host', '0.0.0.0', '--port', '8000', '--log-level', 'warning'],
        cwd=BACKEND_DIR,
        env=env,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def start_frontend():
    global frontend_proc
    env = os.environ.copy()
    env['NEXT_PUBLIC_DEV_MODE'] = 'true'
    env['NEXT_PUBLIC_API_URL'] = 'http://localhost:8000/api'
    env['NEXT_PUBLIC_SUPABASE_URL'] = 'https://placeholder.supabase.co'
    env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] = 'placeholder'
    frontend_proc = subprocess.Popen(
        ['npx', 'next', 'dev', '--port', '3000'],
        cwd=FRONTEND_DIR,
        env=env,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def stop_servers():
    global backend_proc, frontend_proc, running
    running = False
    for proc in [backend_proc, frontend_proc]:
        if proc:
            try:
                proc.terminate()
                proc.wait(timeout=3)
            except Exception:
                proc.kill()
    print('\n👋 心本向阳已停止')


def main():
    global running
    signal.signal(signal.SIGINT, lambda *_: stop_servers())
    signal.signal(signal.SIGTERM, lambda *_: stop_servers())

    print('🌻 心本向阳 - AI 学习助手')
    print('=' * 40)

    # Start backend
    print('  [1/2] 启动后端服务...', end=' ', flush=True)
    start_backend()
    if check_port(8000):
        print('✅')
    else:
        print('❌ 后端启动失败')
        stop_servers()
        sys.exit(1)

    # Start frontend
    print('  [2/2] 启动前端服务...', end=' ', flush=True)
    start_frontend()
    if check_port(3000, timeout=60):
        print('✅')
    else:
        print('❌ 前端启动失败')
        stop_servers()
        sys.exit(1)

    print('=' * 40)
    print('  🌐 正在打开浏览器...')
    time.sleep(1)
    webbrowser.open('http://localhost:3000')

    print(f'''
╔══════════════════════════════════════════╗
║         🌻 心本向阳 已启动！            ║
║                                          ║
║   学习助手: http://localhost:3000        ║
║   线性代数: http://localhost:3000/linear-algebra║
║   管理后台: http://localhost:3000/admin  ║
║                                          ║
║   按 Ctrl+C 停止服务                     ║
╚══════════════════════════════════════════╝
''')

    while running:
        time.sleep(1)


if __name__ == '__main__':
    main()
