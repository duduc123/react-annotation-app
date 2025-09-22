import { configureStore } from '@reduxjs/toolkit';
import chatReducer from './slices/chatSlice';
import historyReducer from './slices/historySlice';

export const store = configureStore({
  reducer: {
    chat: chatReducer,
    history: historyReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
