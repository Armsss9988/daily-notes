import { ipcClient } from '../../platform/ipcClient';

export async function loadTheme() {
  return await ipcClient.getTheme();
}

export async function saveTheme(theme) {
  await ipcClient.setTheme(theme);
}
