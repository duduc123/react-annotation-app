import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  deleteSession,
  setCurrentSessionId,
} from '../../store/slices/historySlice';
import {
  loadSession,
  clearCurrentSession,
} from '../../store/slices/chatSlice';
import './Sidebar.css';

const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const dispatch = useAppDispatch();
  const { sessions, currentSessionId } = useAppSelector((state) => state.history);
  
  const handleSessionClick = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      dispatch(loadSession(session));
      dispatch(setCurrentSessionId(sessionId));
    }
  };
  
  const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    dispatch(deleteSession(sessionId));
    
    if (currentSessionId === sessionId) {
      dispatch(clearCurrentSession());
    }
  };
  
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };
  
  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {!isCollapsed && <h2>历史对话</h2>}
        <button 
          className="toggle-button"
          onClick={toggleSidebar}
          aria-label={isCollapsed ? "展开侧边栏" : "收起侧边栏"}
        >
          {isCollapsed ? '»' : '«'}
        </button>
      </div>
      
      {!isCollapsed && (
        <div className="sidebar-content">
          {sessions.length === 0 ? (
            <div className="empty-history">
              <p>暂无历史对话</p>
            </div>
          ) : (
            <ul className="session-list">
              {sessions.map((session) => (
                <li 
                  key={session.id}
                  className={`session-item ${currentSessionId === session.id ? 'active' : ''}`}
                  onClick={() => handleSessionClick(session.id)}
                >
                  <div className="session-title">{session.title}</div>
                  <div className="session-meta">
                    <span className="session-date">{formatDate(session.updatedAt)}</span>
                    <span className="session-message-count">
                      {session.messages.length} 条消息
                    </span>
                  </div>
                  <button 
                    className="delete-button"
                    onClick={(e) => handleDeleteSession(e, session.id)}
                  >
                    删除
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default Sidebar;
