import React from 'react';
import ChatComponent from '../components/DeepSeekAIChat/ChatComponent';
import Sidebar from '../components/DeepSeekAIChat/Sidebar';
import './AIChatPage.css';

const AIChatPage: React.FC = () => {
  return (
    <div className="chat-layout">
      <Sidebar />
      <ChatComponent />
    </div>
  );
};

export default AIChatPage;
