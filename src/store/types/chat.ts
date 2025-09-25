export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'error';
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export interface ChatState {
  currentSession: ChatSession | null;
  isLoading: boolean;
  error: string | null;
}

export interface HistoryState {
  sessions: ChatSession[];
  currentSessionId: string | null;
}
