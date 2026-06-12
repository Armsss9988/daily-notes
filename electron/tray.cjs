const { Tray, Menu, nativeImage, app } = require('electron');
const path = require('path');

let tray = null;

function buildMenu(mainWindow, showFn, hideFn) {
  const startOnBoot = app.getLoginItemSettings().openAtLogin;
  return Menu.buildFromTemplate([
    {
      label: 'Show/Hide',
      click: () => {
        if (mainWindow) {
          if (mainWindow.isMinimized()) showFn();
          else hideFn();
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Launch at startup',
      type: 'checkbox',
      checked: startOnBoot,
      click: (item) => {
        app.setLoginItemSettings({ openAtLogin: item.checked });
        const configPath = path.join(app.getPath('userData'), 'config.json');
        try {
          const config = JSON.parse(require('fs').readFileSync(configPath, 'utf-8'));
          config.startOnBoot = item.checked;
          require('fs').writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
        } catch (e) {}
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => { app.isQuitting = true; app.quit(); },
    },
  ]);
}

function createTray(mainWindow, showFn, hideFn) {
  const iconPath = path.join(__dirname, '..', 'public', 'tray-icon.png');
  let trayIcon;
  try {
    trayIcon = nativeImage.createFromPath(iconPath);
  } catch (e) {
    trayIcon = nativeImage.createEmpty();
  }

  tray = new Tray(trayIcon);
  tray.setToolTip('Daily Notes');
  tray.setContextMenu(buildMenu(mainWindow, showFn, hideFn));
  tray.on('double-click', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) showFn();
      else hideFn();
    }
  });

  return tray;
}

module.exports = { createTray };
