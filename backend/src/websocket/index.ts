import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { SessionManager } from '../services/SessionManager';
import type { WebSocketEvents } from '../../../shared/types';

export class WebSocketServer {
  private io: SocketIOServer;
  private sessionManager: SessionManager;

  constructor(httpServer: HttpServer, sessionManager: SessionManager) {
    this.sessionManager = sessionManager;

    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      path: '/socket.io',
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Join session room
      socket.on('join_session', async (data: WebSocketEvents['join_session']) => {
        try {
          const { sessionId } = data;
          socket.join(`session:${sessionId}`);
          console.log(`Client ${socket.id} joined session ${sessionId}`);

          // Notify client
          socket.emit('session_status', {
            sessionId,
            status: 'idle',
          });
        } catch (error) {
          socket.emit('error', {
            sessionId: data.sessionId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      });

      // Leave session room
      socket.on('leave_session', (data: WebSocketEvents['leave_session']) => {
        const { sessionId } = data;
        socket.leave(`session:${sessionId}`);
        console.log(`Client ${socket.id} left session ${sessionId}`);
      });

      // Send message to Claude CLI
      socket.on('send_message', async (data: WebSocketEvents['send_message']) => {
        try {
          const { sessionId, message } = data;

          // Notify that processing has started
          this.io.to(`session:${sessionId}`).emit('session_status', {
            sessionId,
            status: 'running',
          });

          // Send message through session manager
          await this.sessionManager.sendMessage(sessionId, message);
        } catch (error) {
          socket.emit('error', {
            sessionId: data.sessionId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });

          this.io.to(`session:${data.sessionId}`).emit('session_status', {
            sessionId: data.sessionId,
            status: 'error',
          });
        }
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });

    // Forward session events to WebSocket clients
    this.setupSessionEventForwarding();
  }

  private setupSessionEventForwarding(): void {
    // Forward parsed output to clients
    this.sessionManager.on('session_parsed_output', (data) => {
      const { sessionId, type, content, raw } = data;

      this.io.to(`session:${sessionId}`).emit('message_chunk', {
        sessionId,
        messageId: `msg-${Date.now()}`, // TODO: Generate proper message IDs
        chunk: content,
        type: type === 'code' ? 'code' : type === 'thinking' ? 'thinking' : 'text',
      });
    });

    // Forward raw output to clients (for debugging/advanced view)
    this.sessionManager.on('session_output', (data) => {
      const { sessionId, data: outputData } = data;

      // Could emit this for a raw terminal view
      // this.io.to(`session:${sessionId}`).emit('raw_output', outputData);
    });

    // Forward errors
    this.sessionManager.on('session_error', (data) => {
      const { sessionId, error } = data;

      this.io.to(`session:${sessionId}`).emit('error', {
        sessionId,
        error,
      });

      this.io.to(`session:${sessionId}`).emit('session_status', {
        sessionId,
        status: 'error',
      });
    });

    // Handle session exit
    this.sessionManager.on('session_exited', (data) => {
      const { sessionId } = data;

      this.io.to(`session:${sessionId}`).emit('session_status', {
        sessionId,
        status: 'idle',
      });
    });
  }

  getIO(): SocketIOServer {
    return this.io;
  }
}
