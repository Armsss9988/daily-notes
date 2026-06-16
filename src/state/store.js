import { configureStore } from '@reduxjs/toolkit';
import notesReducer from './slices/notesSlice';
import uiReducer from './slices/uiSlice';
import { createPersistMiddleware } from './middlewares/persistMiddleware';

export const store = configureStore({
  reducer: { notes: notesReducer, ui: uiReducer },
  middleware: (getDefault) => getDefault().concat(createPersistMiddleware()),
});
