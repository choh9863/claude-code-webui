import { io, Socket } from 'socket.io-client';
import type { WebSocketEvents } from '../../../shared/types';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

    this.socket = io(SOCKET_URL, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
    });

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinSession(sessionId: string): void {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.emit('join_session', { sessionId });
  }

  leaveSession(sessionId: string): void {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.emit('leave_session', { sessionId });
  }

  sendMessage(sessionId: string, message: string): void {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.emit('send_message', { sessionId, message });
  }

  onMessageChunk(callback: (data: WebSocketEvents['message_chunk']) => void): void {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.on('message_chunk', callback);
  }

  onSessionStatus(callback: (data: WebSocketEvents['session_status']) => void): void {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.on('session_status', callback);
  }

  onError(callback: (data: WebSocketEvents['error']) => void): void {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.on('error', callback);
  }

  offMessageChunk(callback: (data: WebSocketEvents['message_chunk']) => void): void {
    if (this.socket) {
      this.socket.off('message_chunk', callback);
    }
  }

  offSessionStatus(callback: (data: WebSocketEvents['session_status']) => void): void {
    if (this.socket) {
      this.socket.off('session_status', callback);
    }
  }

  offError(callback: (data: WebSocketEvents['error']) => void): void {
    if (this.socket) {
      this.socket.off('error', callback);
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();
