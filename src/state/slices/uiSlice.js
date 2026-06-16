import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { loadTheme } from '../../data/repositories/configRepo';

export const initializeTheme = createAsyncThunk('ui/initTheme', async () => {
  const theme = await loadTheme();
  return theme || 'dark';
});

const initialState = {
  theme: 'dark',
  themeReady: false,
  activeTab: 'daily',
  sidebarOpen: false,
  showFormat: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme(state, action) { state.theme = action.payload; },
    toggleTheme(state) { state.theme = state.theme === 'dark' ? 'light' : 'dark'; },
    setActiveTab(state, action) { state.activeTab = action.payload; },
    setSidebarOpen(state, action) { state.sidebarOpen = action.payload; },
    setShowFormat(state, action) { state.showFormat = action.payload; },
  },
  extraReducers: (builder) => {
    builder.addCase(initializeTheme.fulfilled, (state, action) => {
      state.theme = action.payload;
      state.themeReady = true;
    });
  },
});

export const { setTheme, toggleTheme, setActiveTab, setSidebarOpen, setShowFormat } = uiSlice.actions;
export default uiSlice.reducer;
