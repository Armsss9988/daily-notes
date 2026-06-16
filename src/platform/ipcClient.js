const api = window.api;

export const ipcClient = {
  loadData: () => api?.loadData() ?? Promise.resolve(null),
  saveData: (data) => api?.saveData(data),
  getTheme: () => api?.getTheme() ?? Promise.resolve('dark'),
  setTheme: (theme) => api?.setTheme(theme),
};
