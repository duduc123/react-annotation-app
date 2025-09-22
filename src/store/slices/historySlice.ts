import { createSlice} from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { HistoryState, ChatSession } from '../types/chat';

const initialState: HistoryState = {
  sessions: [],
  currentSessionId: null,
};

export const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    // 保存会话到历史
    saveSession: (state, action: PayloadAction<ChatSession>) => {
      const session = action.payload;
      const existingIndex = state.sessions.findIndex(s => s.id === session.id);
      
      if (existingIndex !== -1) {
        state.sessions[existingIndex] = session;
      } else {
        state.sessions.unshift(session);
      }
      
      state.currentSessionId = session.id;
      
      // 保存到本地存储
      localStorage.setItem('chatHistory', JSON.stringify(state.sessions));
    },
    
    // 从历史中删除会话
    deleteSession: (state, action: PayloadAction<string>) => {
      state.sessions = state.sessions.filter(s => s.id !== action.payload);
      if (state.currentSessionId === action.payload) {
        state.currentSessionId = null;
      }
      
      // 更新本地存储
      localStorage.setItem('chatHistory', JSON.stringify(state.sessions));
    },
    
    // 设置当前会话ID
    setCurrentSessionId: (state, action: PayloadAction<string>) => {
      state.currentSessionId = action.payload;
    },
    
    // 加载历史会话（从本地存储）
    loadHistory: (state) => {
      try {
        const savedHistory = localStorage.getItem('chatHistory');
        if (savedHistory) {
          state.sessions = JSON.parse(savedHistory);
        }
      } catch (error) {
        console.error('Failed to load chat history:', error);
        state.sessions = [];
      }
    },
    
    // 清除所有历史
    clearHistory: (state) => {
      state.sessions = [];
      state.currentSessionId = null;
      localStorage.removeItem('chatHistory');
    },
  },
});

export const {
  saveSession,
  deleteSession,
  setCurrentSessionId,
  loadHistory,
  clearHistory,
} = historySlice.actions;

export default historySlice.reducer;
