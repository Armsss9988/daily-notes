const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  loadData: () => ipcRenderer.invoke('data:load'),
  saveData: (data) => ipcRenderer.invoke('data:save', data),
  onToggle: (cb) => ipcRenderer.on('hotkey:toggle', () => cb()),
  getTheme: () => ipcRenderer.invoke('theme:get'),
  setTheme: (theme) => ipcRenderer.invoke('theme:set', theme),
  onThemeChanged: (cb) => ipcRenderer.on('theme:changed', (_, theme) => cb(theme)),
  getStartOnBoot: () => ipcRenderer.invoke('app:getStartOnBoot'),
  setStartOnBoot: (value) => ipcRenderer.invoke('app:setStartOnBoot', value),
  generateReport: (noteText, date) => ipcRenderer.invoke('report:generate', { noteText, date }),
});
