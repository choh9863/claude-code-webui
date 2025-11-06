import { ClaudeCliSession, ClaudeCliOptions } from './ClaudeCliService';
import { SessionModel } from '../models/Session';
import { ProjectModel } from '../models/Project';
import { MessageModel } from '../models/Message';
import { EventEmitter } from 'events';

export class SessionManager extends EventEmitter {
  private sessions: Map<string, ClaudeCliSession> = new Map();
  private maxConcurrentSessions: number;

  constructor(maxConcurrentSessions: number = 5) {
    super();
    this.maxConcurrentSessions = maxConcurrentSessions;
  }

  async createSession(sessionId: string): Promise<ClaudeCliSession> {
    // Check if we've reached the limit
    const runningSessions = Array.from(this.sessions.values()).filter(s => s.getIsRunning());
    if (runningSessions.length >= this.maxConcurrentSessions) {
      throw new Error(`Maximum concurrent sessions (${this.maxConcurrentSessions}) reached`);
    }

    // Check if session already exists
    if (this.sessions.has(sessionId)) {
      const existing = this.sessions.get(sessionId)!;
      if (existing.getIsRunning()) {
        return existing;
      }
      // If exists but not running, remove it
      this.removeSession(sessionId);
    }

    // Get session info from database
    const sessionData = SessionModel.findById(sessionId);
    if (!sessionData) {
      throw new Error(`Session ${sessionId} not found in database`);
    }

    // Get project info to get working directory
    const project = ProjectModel.findById(sessionData.projectId);
    if (!project) {
      throw new Error(`Project ${sessionData.projectId} not found`);
    }

    // Create CLI session
    const cliSession = new ClaudeCliSession({
      sessionId,
      workingDirectory: project.directoryPath,
      cliPath: process.env.CLAUDE_CLI_PATH || 'claude',
    });

    // Set up event forwarding
    cliSession.on('output', (data) => {
      this.emit('session_output', data);
    });

    cliSession.on('parsed_output', (data) => {
      this.emit('session_parsed_output', data);

      // Auto-save if enabled
      if (sessionData.autoSaveEnabled) {
        this.saveOutput(sessionId, data);
      }
    });

    cliSession.on('error', (data) => {
      this.emit('session_error', data);
    });

    cliSession.on('exited', (data) => {
      this.emit('session_exited', data);
      this.removeSession(sessionId);
    });

    // Start the CLI process
    cliSession.start();

    // Store the session
    this.sessions.set(sessionId, cliSession);

    return cliSession;
  }

  getSession(sessionId: string): ClaudeCliSession | undefined {
    return this.sessions.get(sessionId);
  }

  hasSession(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }

  async sendMessage(sessionId: string, message: string): Promise<void> {
    let session = this.sessions.get(sessionId);

    // If session doesn't exist or not running, create it
    if (!session || !session.getIsRunning()) {
      session = await this.createSession(sessionId);
    }

    // Get session data for auto-save check
    const sessionData = SessionModel.findById(sessionId);

    // Save user message if auto-save is enabled
    if (sessionData?.autoSaveEnabled) {
      MessageModel.create(sessionId, 'user', message);
      SessionModel.touchUpdatedAt(sessionId);
    }

    // Send message to Claude CLI
    session.sendMessage(message);
  }

  private saveOutput(sessionId: string, data: any): void {
    try {
      // Save assistant output to database
      if (data.content && data.type !== 'error') {
        const metadata = {
          type: data.type,
          raw: data.raw,
        };

        MessageModel.create(sessionId, 'assistant', data.content, metadata);
        SessionModel.touchUpdatedAt(sessionId);
      }
    } catch (error) {
      console.error('Error saving output:', error);
    }
  }

  terminateSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.terminate();
      this.sessions.delete(sessionId);
    }
  }

  private removeSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  terminateAll(): void {
    for (const [sessionId, session] of this.sessions.entries()) {
      session.terminate();
    }
    this.sessions.clear();
  }

  getActiveSessions(): string[] {
    return Array.from(this.sessions.keys()).filter(sessionId => {
      const session = this.sessions.get(sessionId);
      return session && session.getIsRunning();
    });
  }

  getSessionCount(): number {
    return this.sessions.size;
  }
}
