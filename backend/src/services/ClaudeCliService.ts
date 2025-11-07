import { EventEmitter } from 'events';
import { spawn, ChildProcess } from 'child_process';
import stripAnsi from 'strip-ansi';

// Try to import node-pty, fallback to null if not available
let pty: any = null;
try {
  pty = require('node-pty-prebuilt-multiarch');
} catch (error) {
  console.warn('node-pty-prebuilt-multiarch not available, using fallback mode');
}

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
  private ptyProcess: any = null;
  private childProcess: ChildProcess | null = null;
  private sessionId: string;
  private workingDirectory: string;
  private cliPath: string;
  private buffer: string = '';
  private isRunning: boolean = false;
  private usePty: boolean = false;

  constructor(options: ClaudeCliOptions) {
    super();
    this.sessionId = options.sessionId;
    this.workingDirectory = options.workingDirectory;
    this.cliPath = options.cliPath || 'claude';
    this.usePty = pty !== null;
  }

  start(): void {
    if (this.ptyProcess || this.childProcess) {
      throw new Error('Claude CLI process already started');
    }

    try {
      if (this.usePty) {
        this.startWithPty();
      } else {
        this.startWithChildProcess();
      }
    } catch (error) {
      this.emit('error', {
        sessionId: this.sessionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  private startWithPty(): void {
    this.ptyProcess = pty.spawn(this.cliPath, [], {
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

    this.ptyProcess.onData((data: string) => {
      this.handleOutput(data);
    });

    this.ptyProcess.onExit(({ exitCode, signal }: any) => {
      this.isRunning = false;
      this.emit('exited', { sessionId: this.sessionId, exitCode, signal });
      this.ptyProcess = null;
    });
  }

  private startWithChildProcess(): void {
    this.childProcess = spawn(this.cliPath, [], {
      cwd: this.workingDirectory,
      env: {
        ...process.env,
        FORCE_COLOR: '1',
      },
      shell: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    this.isRunning = true;
    this.emit('started', { sessionId: this.sessionId });

    this.childProcess.stdout?.on('data', (data: Buffer) => {
      this.handleOutput(data.toString());
    });

    this.childProcess.stderr?.on('data', (data: Buffer) => {
      this.handleOutput(data.toString());
    });

    this.childProcess.on('exit', (code, signal) => {
      this.isRunning = false;
      this.emit('exited', {
        sessionId: this.sessionId,
        exitCode: code,
        signal
      });
      this.childProcess = null;
    });

    this.childProcess.on('error', (error) => {
      this.emit('error', {
        sessionId: this.sessionId,
        error: error.message,
      });
    });
  }

  sendMessage(message: string): void {
    if (!this.isRunning) {
      throw new Error('Claude CLI process not running');
    }

    if (this.usePty && this.ptyProcess) {
      this.ptyProcess.write(message + '\r');
    } else if (this.childProcess && this.childProcess.stdin) {
      this.childProcess.stdin.write(message + '\n');
    }

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
    if (this.ptyProcess) {
      this.ptyProcess.kill();
      this.ptyProcess = null;
    }

    if (this.childProcess) {
      this.childProcess.kill();
      this.childProcess = null;
    }

    this.isRunning = false;
    this.emit('terminated', { sessionId: this.sessionId });
  }

  resize(cols: number, rows: number): void {
    if (this.usePty && this.ptyProcess) {
      this.ptyProcess.resize(cols, rows);
    }
    // Child process doesn't support resize
  }

  getSessionId(): string {
    return this.sessionId;
  }

  getIsRunning(): boolean {
    return this.isRunning;
  }
}
