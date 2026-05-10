const { app, BrowserWindow, dialog } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

let mainWindow = null;
let backendProcess = null;
let frontendProcess = null;

const isDev = process.argv.includes('--dev');
const BACKEND_PORT = 8000;
const FRONTEND_PORT = 3000;
const PROJECT_ROOT = path.join(__dirname, '..');

// ── Backend ──────────────────────────────────────────────────
function startBackend() {
  const pythonCmd = process.platform === 'darwin'
    ? '/Library/Frameworks/Python.framework/Versions/3.11/bin/python3.11'
    : 'python3';

  const env = {
    ...process.env,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
    DEV_MODE: 'true',
  };

  backendProcess = spawn(pythonCmd, [
    '-m', 'uvicorn', 'main:app',
    '--host', '0.0.0.0',
    '--port', String(BACKEND_PORT),
  ], {
    cwd: path.join(PROJECT_ROOT, 'backend'),
    env,
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  backendProcess.stdout.on('data', (data) => {
    console.log('[backend]', data.toString().trim());
  });
  backendProcess.stderr.on('data', (data) => {
    console.log('[backend]', data.toString().trim());
  });
  backendProcess.on('error', (err) => {
    console.error('Failed to start backend:', err.message);
  });
}

// ── Frontend ─────────────────────────────────────────────────
function startFrontend() {
  if (isDev) {
    // Dev mode: use Next.js dev server
    frontendProcess = spawn('npx', ['next', 'dev', '--port', String(FRONTEND_PORT)], {
      cwd: path.join(PROJECT_ROOT, 'frontend'),
      env: {
        ...process.env,
        NEXT_PUBLIC_DEV_MODE: 'true',
        NEXT_PUBLIC_API_URL: `http://localhost:${BACKEND_PORT}/api`,
        NEXT_PUBLIC_SUPABASE_URL: 'https://placeholder.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'placeholder',
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  }
}

// ── Wait for server ──────────────────────────────────────────
function waitForServer(port, maxRetries = 30) {
  return new Promise((resolve, reject) => {
    let retries = 0;
    const check = () => {
      http.get(`http://localhost:${port}/api/health`, (res) => {
        if (res.statusCode === 200) resolve(true);
        else retry();
      }).on('error', () => retry());
    };
    const retry = () => {
      retries++;
      if (retries >= maxRetries) {
        reject(new Error(`Server on port ${port} did not start`));
      } else {
        setTimeout(check, 1000);
      }
    };
    check();
  });
}

// ── Create Window ────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 960,
    minHeight: 600,
    title: '心本向阳 - AI 学习助手',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    titleBarStyle: 'hiddenInset',
    show: false,
  });

  mainWindow.loadURL(`http://localhost:${FRONTEND_PORT}`);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ── App Lifecycle ────────────────────────────────────────────
app.whenReady().then(async () => {
  // Start backend first
  console.log('Starting backend...');
  startBackend();

  try {
    console.log('Waiting for backend...');
    await waitForServer(BACKEND_PORT);
    console.log('Backend is ready!');
  } catch (e) {
    console.error('Backend failed to start:', e.message);
    dialog.showErrorBox('启动失败', '后端服务无法启动，请检查 Python 环境和 API Key 配置。');
    app.quit();
    return;
  }

  // In dev mode, start frontend dev server
  if (isDev) {
    console.log('Starting frontend dev server...');
    startFrontend();
    try {
      await waitForServer(FRONTEND_PORT, 60);
      console.log('Frontend is ready!');
    } catch (e) {
      console.error('Frontend failed to start:', e.message);
    }
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  // Cleanup child processes
  if (backendProcess) {
    backendProcess.kill('SIGTERM');
    backendProcess = null;
  }
  if (frontendProcess) {
    frontendProcess.kill('SIGTERM');
    frontendProcess = null;
  }
});
