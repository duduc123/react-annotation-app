import { createSlice } from '@reduxjs/toolkit';
import type {PayloadAction} from '@reduxjs/toolkit';
import type { ChatState, Message, ChatSession } from '../types/chat';

const initialState: ChatState = {
  currentSession: null,
  isLoading: false,
  error: null,
};

export const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    // 开始新对话
    startNewChat: (state, action: PayloadAction<string>) => {
      const newSession: ChatSession = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: action.payload,
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      state.currentSession = newSession;
      state.error = null;
    },
    
    // 添加用户消息
    addUserMessage: (state, action: PayloadAction<string>) => {
      if (!state.currentSession) return;
      
      const userMessage: Message = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        content: action.payload,
        role: 'user',
        timestamp: Date.now(),
      };
      
      state.currentSession.messages.push(userMessage);
      state.currentSession.updatedAt = Date.now();
    },
    
    // 开始AI回复
    startAIResponse: (state) => {
      if (!state.currentSession) return;
      
      const aiMessage: Message = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        content: '',
        role: 'assistant',
        timestamp: Date.now(),
      };
      
      state.currentSession.messages.push(aiMessage);
      state.isLoading = true;
      state.error = null;
    },
    
    // 更新AI回复内容
    updateAIResponse: (state, action: PayloadAction<string>) => {
      if (!state.currentSession) return;
      
      const lastMessage = state.currentSession.messages[state.currentSession.messages.length - 1];
      if (lastMessage && lastMessage.role === 'assistant') {
        lastMessage.content += action.payload;
      }
    },
    
    // 完成AI回复
    completeAIResponse: (state) => {
      state.isLoading = false;
      if (state.currentSession) {
        state.currentSession.updatedAt = Date.now();
      }
    },
    
    // 设置错误
    setError: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
      
      if (state.currentSession) {
        const lastMessage = state.currentSession.messages[state.currentSession.messages.length - 1];
        if (lastMessage && lastMessage.role === 'assistant') {
          lastMessage.role = 'error';
          lastMessage.content = action.payload;
        }
      }
    },
    
    // 加载历史会话
    loadSession: (state, action: PayloadAction<ChatSession>) => {
      state.currentSession = action.payload;
      state.error = null;
    },
    
    // 清除当前会话
    clearCurrentSession: (state) => {
      state.currentSession = null;
      state.error = null;
    },
  },
});

export const {
  startNewChat,
  addUserMessage,
  startAIResponse,
  updateAIResponse,
  completeAIResponse,
  setError,
  loadSession,
  clearCurrentSession,
} = chatSlice.actions;

export default chatSlice.reducer;
