# Claude Code Web UI

A modern web-based user interface for Claude CLI, providing enhanced accessibility and usability with visual project management, session handling, and real-time streaming.

## Features

- **Project Organization**: Create and manage multiple projects with directory-based organization
- **Session Management**: Multiple concurrent sessions with auto-save and context compression options
- **Real-time Streaming**: Live display of Claude's responses, code blocks, and thinking process
- **Parallel Sessions**: Run multiple Claude CLI sessions simultaneously with tab-based interface
- **External Access**: Host on your network and access from any device
- **Auto-save**: Automatically save chat history (configurable per session)
- **Context Compression**: Optional message compression to manage context limits

## Architecture

- **Backend**: Node.js + Express + TypeScript + Socket.io + SQLite
- **Frontend**: React + Vite + TypeScript + TailwindCSS + Zustand
- **CLI Integration**: Uses `node-pty` (when available) or child_process to spawn and control Claude CLI processes

## Prerequisites

- **Node.js 18+** (tested on 18.x, 20.x, and 22.x)
- npm 8+ (comes with Node.js)
- Claude CLI installed and authenticated (`claude` command available)
- Modern web browser

> **Note**: This project uses `node-pty-prebuilt-multiarch` as an optional dependency. On Node 20 and below, it provides enhanced terminal features (PTY support with ANSI colors). On Node 22+, it gracefully falls back to standard child process mode. Both modes are fully functional.

## Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd claude-code-webui
```

2. **Install backend dependencies**
```bash
cd backend
npm install
```

3. **Install frontend dependencies**
```bash
cd ../frontend
npm install
```

4. **Set up environment variables**

From the project root:
```bash
# Backend .env
cp .env.example backend/.env

# Frontend .env (optional, uses defaults)
cp frontend/.env.example frontend/.env
```

The default settings should work out of the box. You can edit these files later if needed.

## Development

1. **Start the backend server**
```bash
cd backend
npm run dev
```

2. **Start the frontend dev server** (in a new terminal)
```bash
cd frontend
npm run dev
```

3. **Open your browser**
Navigate to `http://localhost:5173`

## Production Build

1. **Build the frontend**
```bash
cd frontend
npm run build
```

2. **Build the backend**
```bash
cd backend
npm run build
```

3. **Start the production server**
```bash
cd backend
npm start
```

## Usage

1. **Create a Project**
   - Click "New Project" in the sidebar
   - Enter project name, directory path, and optional description
   - The directory path should point to where you want Claude CLI to run

2. **Create a Session**
   - Click the "+" icon next to a project
   - Enter session name and configure options:
     - Auto-save: Automatically save messages to database
     - Context compression: Compress older messages

3. **Start Chatting**
   - Click on a session to open it
   - Type your message in the input box
   - Press Ctrl+Enter or click Send
   - Watch Claude's response stream in real-time

4. **Multiple Sessions**
   - Open multiple sessions as tabs
   - Each session runs independently
   - Switch between sessions with tabs

## Configuration

### Backend Environment Variables

- `PORT`: Server port (default: 3001)
- `HOST`: Server host (default: 0.0.0.0 for external access)
- `DATABASE_PATH`: SQLite database path
- `CORS_ORIGIN`: CORS allowed origin
- `MAX_CONCURRENT_SESSIONS`: Maximum parallel Claude CLI processes
- `CLAUDE_CLI_PATH`: Path to Claude CLI executable (default: "claude")

### Frontend Environment Variables

- `VITE_API_URL`: Backend API URL
- `VITE_SOCKET_URL`: WebSocket server URL

## External Access

To access from other devices on your network:

1. Ensure `HOST=0.0.0.0` in backend `.env`
2. Find your machine's IP address
3. Access from other devices using `http://<your-ip>:5173`

For production, consider:
- Setting up a reverse proxy (nginx, Apache)
- Using HTTPS with SSL certificates
- Implementing authentication

## Troubleshooting

**npm install shows warnings about node-pty-prebuilt-multiarch**
- This is expected on Node 22+ since node-pty doesn't have prebuilt binaries for Node 22
- The application will automatically use fallback mode (child_process) instead
- All features will work normally, though terminal color support may be limited
- If you want full PTY features with ANSI colors, use Node 20 or below

**Claude CLI not found**
- Ensure Claude CLI is installed: `which claude`
- Set `CLAUDE_CLI_PATH` in backend `.env` if not in PATH

**Connection errors**
- Check that backend server is running on correct port
- Verify WebSocket connection in browser console
- Check CORS settings if accessing from different origin

**Database errors**
- Ensure `data/` directory is writable
- Check SQLite database permissions

## Project Structure

```
claude-code-webui/
├── backend/
│   ├── src/
│   │   ├── api/           # REST API routes
│   │   ├── database/      # Database setup
│   │   ├── models/        # Database models
│   │   ├── services/      # Business logic
│   │   ├── websocket/     # WebSocket handlers
│   │   └── server.ts      # Main server file
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # API & WebSocket clients
│   │   ├── store/         # Zustand state management
│   │   ├── styles/        # CSS styles
│   │   ├── App.tsx        # Main app component
│   │   └── main.tsx       # Entry point
│   └── package.json
└── shared/
    └── types.ts           # Shared TypeScript types
```

## License

MIT License - see LICENSE file for details

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
