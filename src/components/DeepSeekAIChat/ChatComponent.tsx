import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { callDeepseekStream } from './utils';
import './ChatComponent.css';

// 定义消息类型
export interface Message {
  id: number;
  content: string;
  role: 'user' | 'assistant' | 'error';
}

const ChatComponent: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // 滚动到最新消息
  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    setInputValue(e.target.value);
  };
  
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    
    // 添加用户消息
    const userMessage: Message = {
      id: Date.now(),
      content: inputValue,
      role: 'user'
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    
    // 添加一个空的消息用于AI回复
    const aiMessageId: number = Date.now() + 1;
    setMessages(prev => [...prev, { id: aiMessageId, content: '', role: 'assistant' }]);
    
    try {
      // 调用API获取流式响应
      await callDeepseekStream(
        messages,
        inputValue,
        (chunk: string) => {
          // 处理流式数据
          setMessages(prev => 
            prev.map(msg => 
              msg.id === aiMessageId 
                ? { ...msg, content: msg.content + chunk } 
                : msg
            )
          );
        },
        () => {
          // 流结束时的回调
          setIsLoading(false);
        },
        (error: Error) => {
          // 错误处理
          console.error('Error:', error);
          setMessages(prev => 
            prev.map(msg => 
              msg.id === aiMessageId 
                ? { ...msg, content: `错误: ${error.message}`, role: 'error' } 
                : msg
            )
          );
          setIsLoading(false);
        }
      );
    } catch (error) {
      console.error('Error in stream processing:', error);
      const err = error as Error;
      setMessages(prev => 
        prev.map(msg => 
          msg.id === aiMessageId 
            ? { ...msg, content: `处理错误: ${err.message}`, role: 'error' } 
            : msg
        )
      );
      setIsLoading(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  
  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="empty-chat">
            <p>你好！有什么可以帮助你的吗？</p>
          </div>
        ) : (
          messages.map((message) => (
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
