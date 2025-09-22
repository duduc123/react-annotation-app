import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { callDeepseekStream } from './utils';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { store } from '../../store';
import {
  startNewChat,
  addUserMessage,
  startAIResponse,
  updateAIResponse,
  completeAIResponse,
  setError,
  clearCurrentSession,
} from '../../store/slices/chatSlice';
import {
  saveSession,
  loadHistory,
  setCurrentSessionId,
} from '../../store/slices/historySlice';
import './ChatComponent.css';

const ChatComponent: React.FC = () => {
  const dispatch = useAppDispatch();
  const { currentSession, isLoading } = useAppSelector((state) => state.chat);
  const { sessions } = useAppSelector((state) => state.history);
  
  const [inputValue, setInputValue] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // 初始化时加载历史记录
  useEffect(() => {
    dispatch(loadHistory());
  }, [dispatch]);
  
  // 滚动到最新消息
  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [currentSession?.messages]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    setInputValue(e.target.value);
  };
  
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    
    // 如果没有当前会话，创建新会话
    if (!currentSession) {
      dispatch(startNewChat(inputValue.substring(0, 30) + (inputValue.length > 30 ? '...' : '')));
    }
    
    // 添加用户消息
    dispatch(addUserMessage(inputValue));
    const userMessage = inputValue;
    setInputValue('');
    
    // 开始AI回复
    dispatch(startAIResponse());

    const abortController = new AbortController();

    try {
      // 调用API获取流式响应
      await callDeepseekStream(
        currentSession?.messages || [],
        userMessage,
        (chunk: string) => {
          // 处理流式数据
          dispatch(updateAIResponse(chunk));
        },
        () => {
          // 流结束时的回调
          dispatch(completeAIResponse());
          // 保存会话到历史
          const currentSession = store.getState().chat.currentSession;
          if (currentSession) {
            dispatch(saveSession(currentSession));
          }
        },
        (error: Error) => {
          // 错误处理
          dispatch(setError(error.message));
        },
        abortController.signal // 传递 AbortController 的 signal
      );
    } catch (error) {
      const err = error as Error;
      dispatch(setError(err.message));
      abortController.abort();
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  
  const handleNewChat = () => {
    dispatch(clearCurrentSession());
    setInputValue('');
  };
  
  return (
    <div className="chat-container">
      <div className="chat-header">
        <button onClick={handleNewChat} className="new-chat-button">
          新建对话
        </button>
        <div className="chat-title">
          {currentSession ? currentSession.title : '新对话'}
        </div>
      </div>
      
      <div className="chat-messages">
        {!currentSession ? (
          <div className="empty-chat">
            <p>你好！有什么可以帮助你的吗？</p>
          </div>
        ) : (
          currentSession.messages.map((message) => (
            <div 
              key={message.id} 
              className={`message ${message.role}`}
            >
              <div className="message-content">
                {message.role === 'assistant' ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content}
                  </ReactMarkdown>
                ) : (
                  message.content
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="chat-input-container">
        <form onSubmit={handleSubmit} className="chat-form">
          <textarea
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="输入你的问题..."
            className="chat-input"
            rows={1}
            disabled={isLoading}
          />
          <button 
            type="submit" 
            className="send-button"
            disabled={!inputValue.trim() || isLoading}
          >
            {isLoading ? '发送中...' : '发送'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatComponent;
