import express, { Express, Request, Response } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { initializeDatabase } from './database';
import { SessionManager } from './services/SessionManager';
import { WebSocketServer } from './websocket';
import projectsRouter from './api/projects';
import sessionsRouter from './api/sessions';

// Load environment variables
dotenv.config();

const app: Express = express();
const httpServer = createServer(app);

// Configuration
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';
const DATABASE_PATH = process.env.DATABASE_PATH || path.join(__dirname, '../data/claude-webui.db');
const MAX_CONCURRENT_SESSIONS = parseInt(process.env.MAX_CONCURRENT_SESSIONS || '5');

// Initialize database
initializeDatabase(DATABASE_PATH);
console.log(`Database initialized at ${DATABASE_PATH}`);

// Initialize session manager
const sessionManager = new SessionManager(MAX_CONCURRENT_SESSIONS);
console.log(`Session manager initialized (max concurrent: ${MAX_CONCURRENT_SESSIONS})`);

// Initialize WebSocket server
const wsServer = new WebSocketServer(httpServer, sessionManager);
console.log('WebSocket server initialized');

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req: Request, res: Response, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api/projects', projectsRouter);
app.use('/api/sessions', sessionsRouter);

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    activeSessions: sessionManager.getActiveSessions().length,
    maxSessions: MAX_CONCURRENT_SESSIONS,
  });
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'Claude Code Web UI API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      projects: '/api/projects',
      sessions: '/api/sessions',
    },
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

// Start server
httpServer.listen(parseInt(PORT as string), HOST, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║          Claude Code Web UI - Server Running              ║
║                                                            ║
║  Server:   http://${HOST}:${PORT}                     ║
║  Database: ${DATABASE_PATH}                                ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  sessionManager.terminateAll();
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  sessionManager.terminateAll();
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
