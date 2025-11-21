// Shared types between frontend and backend

export interface Project {
  id: string;
  name: string;
  description: string | null;
  directoryPath: string;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  projectId: string;
  name: string;
  autoSaveEnabled: boolean;
  contextCompressionEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata: MessageMetadata | null;
  createdAt: string;
}

export interface MessageMetadata {
  toolCalls?: ToolCall[];
  thinkingBlocks?: ThinkingBlock[];
  codeBlocks?: CodeBlock[];
  status?: 'pending' | 'streaming' | 'completed' | 'error';
  error?: string;
  type?: string; // Output type from CLI parser (text, code, thinking, tool, error)
  raw?: string;  // Raw ANSI output from CLI
}

export interface ToolCall {
  id: string;
  name: string;
  parameters: Record<string, any>;
  result?: string;
}

export interface ThinkingBlock {
  id: string;
  content: string;
}

export interface CodeBlock {
  id: string;
  language: string;
  code: string;
  fileName?: string;
}

// WebSocket Events
export interface WebSocketEvents {
  // Client to Server
  join_session: { sessionId: string };
  leave_session: { sessionId: string };
  send_message: { sessionId: string; message: string };

  // Server to Client
  message_start: { sessionId: string; messageId: string };
  message_chunk: { sessionId: string; messageId: string; chunk: string; type: 'text' | 'code' | 'thinking' };
  message_complete: { sessionId: string; messageId: string };
  thinking_start: { sessionId: string; messageId: string };
  thinking_chunk: { sessionId: string; messageId: string; chunk: string };
  thinking_complete: { sessionId: string; messageId: string };
  tool_use: { sessionId: string; messageId: string; tool: ToolCall };
  error: { sessionId: string; error: string };
  session_status: { sessionId: string; status: 'idle' | 'running' | 'error' };
}

// API Request/Response types
export interface CreateProjectRequest {
  name: string;
  description?: string;
  directoryPath?: string; // Optional - auto-generated if not provided
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  directoryPath?: string;
}

export interface CreateSessionRequest {
  projectId: string;
  name: string;
  autoSaveEnabled?: boolean;
  contextCompressionEnabled?: boolean;
}

export interface UpdateSessionRequest {
  name?: string;
  autoSaveEnabled?: boolean;
  contextCompressionEnabled?: boolean;
}

export interface SendMessageRequest {
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
