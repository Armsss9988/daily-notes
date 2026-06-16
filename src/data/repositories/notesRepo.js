import { ipcClient } from '../../platform/ipcClient';

export async function loadNotes() {
  const data = await ipcClient.loadData();
  return data;
}

export async function saveNotes(data) {
  await ipcClient.saveData(data);
}
