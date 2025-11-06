import * as pty from 'node-pty';
import { EventEmitter } from 'events';
import stripAnsi from 'strip-ansi';

export interface ClaudeCliOptions {
  sessionId: string;
  workingDirectory: string;
  cliPath?: string;
}

export interface OutputChunk {
  type: 'text' | 'code' | 'thinking' | 'tool' | 'error';
  content: string;
  raw: string;
}

export class ClaudeCliSession extends EventEmitter {
  private process: pty.IPty | null = null;
  private sessionId: string;
  private workingDirectory: string;
  private cliPath: string;
  private buffer: string = '';
  private isRunning: boolean = false;

  constructor(options: ClaudeCliOptions) {
    super();
    this.sessionId = options.sessionId;
    this.workingDirectory = options.workingDirectory;
    this.cliPath = options.cliPath || 'claude';
  }

  start(): void {
    if (this.process) {
      throw new Error('Claude CLI process already started');
    }

    try {
      this.process = pty.spawn(this.cliPath, [], {
        name: 'xterm-color',
        cols: 120,
        rows: 30,
        cwd: this.workingDirectory,
        env: {
          ...process.env,
          TERM: 'xterm-256color',
          COLORTERM: 'truecolor',
        },
      });

      this.isRunning = true;
      this.emit('started', { sessionId: this.sessionId });

      this.process.onData((data: string) => {
        this.handleOutput(data);
      });

      this.process.onExit(({ exitCode, signal }) => {
        this.isRunning = false;
        this.emit('exited', { sessionId: this.sessionId, exitCode, signal });
        this.process = null;
      });
    } catch (error) {
      this.emit('error', {
        sessionId: this.sessionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  sendMessage(message: string): void {
    if (!this.process || !this.isRunning) {
      throw new Error('Claude CLI process not running');
    }

    // Send the message with newline
    this.process.write(message + '\r');
    this.emit('message_sent', { sessionId: this.sessionId, message });
  }

  private handleOutput(data: string): void {
    this.buffer += data;

    // Emit raw output
    this.emit('output', {
      sessionId: this.sessionId,
      data,
      raw: data,
    });

    // Parse and emit structured output
    const parsed = this.parseOutput(data);
    if (parsed) {
      this.emit('parsed_output', {
        sessionId: this.sessionId,
        ...parsed,
      });
    }
  }

  private parseOutput(data: string): OutputChunk | null {
    // Remove ANSI codes for parsing
    const cleanData = stripAnsi(data);

    // Detect code blocks (```...```)
    if (cleanData.includes('```')) {
      return {
        type: 'code',
        content: cleanData,
        raw: data,
      };
    }

    // Detect thinking blocks (usually in specific format)
    if (cleanData.includes('<thinking>') || cleanData.includes('</thinking>')) {
      return {
        type: 'thinking',
        content: cleanData,
        raw: data,
      };
    }

    // Detect tool usage
    if (cleanData.includes('Tool:') || cleanData.includes('Function call:')) {
      return {
        type: 'tool',
        content: cleanData,
        raw: data,
      };
    }

    // Detect errors
    if (cleanData.toLowerCase().includes('error') || cleanData.toLowerCase().includes('failed')) {
      return {
        type: 'error',
        content: cleanData,
        raw: data,
      };
    }

    // Default to text
    return {
      type: 'text',
      content: cleanData,
      raw: data,
    };
  }

  terminate(): void {
    if (this.process) {
      this.process.kill();
      this.process = null;
      this.isRunning = false;
      this.emit('terminated', { sessionId: this.sessionId });
    }
  }

  resize(cols: number, rows: number): void {
    if (this.process) {
      this.process.resize(cols, rows);
    }
  }

  getSessionId(): string {
    return this.sessionId;
  }

  getIsRunning(): boolean {
    return this.isRunning;
  }
}
