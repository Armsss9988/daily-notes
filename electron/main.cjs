const { app, BrowserWindow, ipcMain, globalShortcut, nativeTheme } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const { createTray } = require('./tray.cjs');

const DATA_FILE = path.join(app.getPath('userData'), 'notes.json');
const CONFIG_FILE = path.join(app.getPath('userData'), 'config.json');
let mainWindow = null;

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    }
  } catch (e) {}
  return { daily_notes: {}, notes: [] };
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function migrateData(data) {
  const dn = data.daily_notes || {};
  for (const d of Object.keys(dn)) {
    const val = dn[d];
    if (Array.isArray(val)) {
      if (val.length > 0) {
        let best = null;
        for (const n of val) {
          const c = n.c || { text: '', fmts: [] };
          if (c.text) best = c;
        }
        dn[d] = { c: best || val[val.length - 1].c || { text: '', fmts: [] } };
      } else {
        delete dn[d];
      }
    }
  }
  return data;
}

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    }
  } catch (e) {}
  return { theme: 'dark', width: 640, height: 560 };
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

const NVIDIA_MODEL = 'meta/llama-3.1-8b-instruct';
const NVIDIA_TEMPERATURE = 0.1;
const NVIDIA_MAX_TOKENS = 8192;
const NVIDIA_SYSTEM_PROMPT =
  'You are a helpful assistant. Extract learning items, questions, and gains from the daily notes. ' +
  'CRITICAL: Use keywords in notes to determine progress: "finish/done/complete" -> "Done", "learn/study/in progress" -> "In Progress", "plan/will/going to" -> "Not Started". ' +
  'Return ONLY raw JSON without markdown formatting or code blocks. ' +
  'Use this exact structure:\n' +
  '{"learning_items":[{"content":"...","progress":"..."}],"questions":"...","gains":["..."]}';

function generateContentFromNvidia(noteText) {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) return Promise.reject(new Error('NVIDIA_API_KEY not found in environment'));

  let safeNote = (noteText || '').replace(/!\[.*?\]\(.*?\)/g, '');
  safeNote = safeNote.replace(/<img[^>]*>/gi, '');
  safeNote = safeNote.replace(/\b\S*\.(png|jpg|jpeg|gif|webp|bmp|svg)\b/gi, '');
  safeNote = safeNote.trim() || '(none)';

  const body = JSON.stringify({
    model: NVIDIA_MODEL,
    messages: [
      { role: 'system', content: NVIDIA_SYSTEM_PROMPT },
      { role: 'user', content: safeNote },
    ],
    temperature: NVIDIA_TEMPERATURE,
    max_tokens: NVIDIA_MAX_TOKENS,
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'integrate.api.nvidia.com',
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          clearTimeout(timeout);
          if (res.statusCode < 200 || res.statusCode >= 300) {
            return reject(new Error('NVIDIA API returned status ' + res.statusCode + ': ' + data));
          }
          try {
            const json = JSON.parse(data);
            const raw = json.choices?.[0]?.message?.content || '';
            const cleaned = raw.replace(/^```(?:json)?\s*/gi, '').replace(/```\s*$/g, '').trim();
            const parsed = JSON.parse(cleaned);
            resolve({
              learning_items: parsed.learning_items || [],
              questions: parsed.questions || '',
              gains: parsed.gains || [],
            });
          } catch (e) {
            reject(new Error('Failed to parse NVIDIA response: ' + e.message + '\nRaw: ' + data));
          }
        });
        res.on('error', (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      }
    );
    const timeout = setTimeout(() => {
      req.destroy();
      reject(new Error('NVIDIA API request timed out after 30 seconds'));
    }, 30000);
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function createWindow() {
  const config = loadConfig();
  mainWindow = new BrowserWindow({
    width: config.width,
    height: config.height,
    x: config.x,
    y: config.y,
    minWidth: 520,
    minHeight: 440,
    icon: path.join(__dirname, '..', 'public', 'icon.png'),
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
    alwaysOnTop: true,
  });

  if (process.env.NODE_ENV === 'development' || process.argv.includes('--dev')) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'app', 'index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    nativeTheme.themeSource = config.theme === 'dark' ? 'dark' : 'light';
  });

  let saveTimer = null;
  function saveBounds() {
    const bounds = mainWindow.getBounds();
    saveConfig({ ...loadConfig(), x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height });
  }
  function debouncedSaveBounds() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(saveBounds, 300);
  }
  mainWindow.on('resize', debouncedSaveBounds);
  mainWindow.on('move', debouncedSaveBounds);

  mainWindow.on('close', (e) => {
    if (saveTimer) clearTimeout(saveTimer);
    saveBounds();
    if (!app.isQuitting) {
      e.preventDefault();
      hideWindow();
    }
  });

  mainWindow.on('minimize', () => { mainWindow.setSkipTaskbar(true); });
  mainWindow.on('restore', () => { mainWindow.setSkipTaskbar(false); });
  mainWindow.on('closed', () => { mainWindow = null; });
}

ipcMain.handle('data:load', () => {
  const data = loadData();
  return migrateData(data);
});

ipcMain.handle('data:save', (_, data) => {
  saveData(data);
});

ipcMain.handle('theme:get', () => {
  return loadConfig().theme || 'dark';
});

ipcMain.handle('theme:set', (_, theme) => {
  const config = loadConfig();
  config.theme = theme;
  saveConfig(config);
  nativeTheme.themeSource = theme === 'dark' ? 'dark' : 'light';
  if (mainWindow) mainWindow.webContents.send('theme:changed', theme);
});

ipcMain.handle('app:getStartOnBoot', () => {
  return app.getLoginItemSettings().openAtLogin;
});

const PYTHON = 'C:\\Users\\reed.le\\AppData\\Local\\Programs\\Python\\Python312\\python.exe';
const GENERATOR = (() => {
  const exeDir = path.dirname(app.getPath('exe'));
  const candidates = [
    path.join(exeDir, 'generate_report.py'),
    path.join(__dirname, '..', '..', 'generate_report.py'),
    path.join(__dirname, '..', 'generate_report.py'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return candidates[0];
})();

ipcMain.handle('report:create-draft', async (_, { content, date }) => {
  const { execFile } = require('child_process');
  const jsonStr = JSON.stringify(content);
  return new Promise((resolve, reject) => {
    const child = execFile(PYTHON, [GENERATOR, '--json', date || ''], {
      encoding: 'utf-8',
      timeout: 300000,
    }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || err.message));
      resolve();
    });
    child.stdin.write(jsonStr);
    child.stdin.end();
  });
});

ipcMain.handle('report:generate-content', async (_, noteText) => {
  return generateContentFromNvidia(noteText);
});

ipcMain.handle('app:setStartOnBoot', (_, value) => {
  app.setLoginItemSettings({ openAtLogin: value });
  const config = loadConfig();
  config.startOnBoot = value;
  saveConfig(config);
});

function hideWindow() {
  if (!mainWindow) return;
  const bounds = mainWindow.getBounds();
  saveConfig({ ...loadConfig(), x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height });
  mainWindow.setSkipTaskbar(true);
  mainWindow.minimize();
}

function showWindow() {
  if (!mainWindow) return;
  mainWindow.setSkipTaskbar(false);
  mainWindow.restore();
  mainWindow.focus();
}

app.whenReady().then(() => {
  app.isQuitting = false;
  const config = loadConfig();
  app.setLoginItemSettings({ openAtLogin: config.startOnBoot !== false });

  createWindow();
  createTray(mainWindow, showWindow, hideWindow);

  globalShortcut.register('Alt+Z', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        showWindow();
      } else {
        hideWindow();
      }
    }
  });

  app.on('activate', () => {
    if (mainWindow) showWindow();
  });
});

app.on('before-quit', () => { app.isQuitting = true; });

app.on('window-all-closed', () => {
  globalShortcut.unregisterAll();
});
