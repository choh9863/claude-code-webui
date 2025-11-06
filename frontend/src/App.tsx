import React, { useEffect, useState } from 'react';
import { useAppStore } from './store';
import { projectsAPI, sessionsAPI } from './services/api';
import { socketService } from './services/socket';
import { Sidebar } from './components/Sidebar';
import { SessionTabs } from './components/SessionTabs';
import { ChatArea } from './components/ChatArea';
import { InputBox } from './components/InputBox';
import { CreateProjectModal } from './components/CreateProjectModal';
import { CreateSessionModal } from './components/CreateSessionModal';
import { Menu, Wifi, WifiOff } from 'lucide-react';
import type { Session } from '../../shared/types';

function App() {
  const {
    projects,
    sessions,
    activeSessions,
    currentSessionId,
    messages,
    sidebarOpen,
    sessionStatuses,
    setProjects,
    setSession,
    setMessages,
    addProject,
    addSession,
    addActiveSession,
    removeActiveSession,
    setCurrentSessionId,
    setSidebarOpen,
    setSessionStatus,
    addMessage,
    appendToLastMessage,
  } = useAppStore();

  const [isConnected, setIsConnected] = useState(false);
  const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false);
  const [createSessionModalOpen, setCreateSessionModalOpen] = useState(false);
  const [selectedProjectForSession, setSelectedProjectForSession] = useState<string>('');

  // Initialize: Load projects and sessions
  useEffect(() => {
    const init = async () => {
      try {
        const [projectsRes, sessionsRes] = await Promise.all([
          projectsAPI.getAll(),
          sessionsAPI.getAll(),
        ]);

        if (projectsRes.success && projectsRes.data) {
          setProjects(projectsRes.data);
        }

        if (sessionsRes.success && sessionsRes.data) {
          setSession(sessionsRes.data);
        }
      } catch (error) {
        console.error('Failed to initialize:', error);
      }
    };

    init();
  }, []);

  // Initialize WebSocket
  useEffect(() => {
    const socket = socketService.connect();

    socket.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    return () => {
      socketService.disconnect();
    };
  }, []);

  // Handle session selection
  const handleSelectSession = async (sessionId: string) => {
    // Add to active sessions if not already
    addActiveSession(sessionId);

    // Join WebSocket room
    socketService.joinSession(sessionId);

    // Load messages if not already loaded
    if (!messages[sessionId]) {
      try {
        const res = await sessionsAPI.getMessages(sessionId);
        if (res.success && res.data) {
          setMessages(sessionId, res.data);
        }
      } catch (error) {
        console.error('Failed to load messages:', error);
      }
    }
  };

  // Handle close session tab
  const handleCloseSession = (sessionId: string) => {
    socketService.leaveSession(sessionId);
    removeActiveSession(sessionId);
  };

  // Handle send message
  const handleSendMessage = async (message: string) => {
    if (!currentSessionId) return;

    // Add user message to UI immediately
    addMessage(currentSessionId, {
      id: `temp-${Date.now()}`,
      sessionId: currentSessionId,
      role: 'user',
      content: message,
      metadata: null,
      createdAt: new Date().toISOString(),
    });

    // Add placeholder for assistant response
    addMessage(currentSessionId, {
      id: `temp-assistant-${Date.now()}`,
      sessionId: currentSessionId,
      role: 'assistant',
      content: '',
      metadata: { status: 'streaming' },
      createdAt: new Date().toISOString(),
    });

    // Send via WebSocket
    socketService.sendMessage(currentSessionId, message);
  };

  // Set up WebSocket event listeners for all sessions
  useEffect(() => {
    const handleMessageChunk = (data: any) => {
      // Update message for any active session, not just the current one
      appendToLastMessage(data.sessionId, data.chunk);
    };

    const handleSessionStatus = (data: any) => {
      // Update status for any session
      setSessionStatus(data.sessionId, data.status);
    };

    const handleError = (data: any) => {
      console.error('Session error:', data.error);
      addMessage(data.sessionId, {
        id: `error-${Date.now()}`,
        sessionId: data.sessionId,
        role: 'system',
        content: `Error: ${data.error}`,
        metadata: { status: 'error', error: data.error },
        createdAt: new Date().toISOString(),
      });
    };

    socketService.onMessageChunk(handleMessageChunk);
    socketService.onSessionStatus(handleSessionStatus);
    socketService.onError(handleError);

    return () => {
      socketService.offMessageChunk(handleMessageChunk);
      socketService.offSessionStatus(handleSessionStatus);
      socketService.offError(handleError);
    };
  }, []); // Empty dependency array - set up once on mount

  // Handle create project
  const handleCreateProject = async (
    name: string,
    directoryPath: string,
    description?: string
  ) => {
    try {
      const res = await projectsAPI.create({ name, directoryPath, description });
      if (res.success && res.data) {
        addProject(res.data);
      }
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  // Handle create session
  const handleCreateSession = async (
    projectId: string,
    name: string,
    autoSaveEnabled: boolean,
    contextCompressionEnabled: boolean
  ) => {
    try {
      const res = await sessionsAPI.create({
        projectId,
        name,
        autoSaveEnabled,
        contextCompressionEnabled,
      });
      if (res.success && res.data) {
        addSession(res.data);
      }
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  // Organize sessions by project
  const sessionsByProject: Record<string, Session[]> = {};
  sessions.forEach((session) => {
    if (!sessionsByProject[session.projectId]) {
      sessionsByProject[session.projectId] = [];
    }
    sessionsByProject[session.projectId].push(session);
  });

  const currentSession = sessions.find((s) => s.id === currentSessionId);
  const currentMessages = currentSessionId ? messages[currentSessionId] || [] : [];
  const currentStatus = currentSessionId ? sessionStatuses[currentSessionId] || 'idle' : 'idle';

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100">
      {/* Sidebar */}
      {sidebarOpen && (
        <Sidebar
          projects={projects}
          sessions={sessionsByProject}
          onSelectSession={handleSelectSession}
          onCreateProject={() => setCreateProjectModalOpen(true)}
          onCreateSession={(projectId) => {
            setSelectedProjectForSession(projectId);
            setCreateSessionModalOpen(true);
          }}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-14 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-slate-700 rounded transition-colors"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-lg font-semibold">Claude Code Web UI</h1>
          </div>

          <div className="flex items-center gap-2">
            {isConnected ? (
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <Wifi size={16} />
                Connected
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <WifiOff size={16} />
                Disconnected
              </div>
            )}
          </div>
        </div>

        {/* Session Tabs */}
        <SessionTabs
          sessions={sessions}
          activeSessionIds={activeSessions}
          currentSessionId={currentSessionId}
          onSelectSession={setCurrentSessionId}
          onCloseSession={handleCloseSession}
        />

        {/* Chat Area */}
        {currentSessionId ? (
          <>
            <ChatArea messages={currentMessages} sessionStatus={currentStatus} />
            <InputBox
              onSendMessage={handleSendMessage}
              disabled={currentStatus === 'running'}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500">
            <div className="text-center">
              <div className="text-6xl mb-4">🚀</div>
              <div className="text-xl">Welcome to Claude Code Web UI</div>
              <div className="text-sm mt-2">
                Create a project and session to get started
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateProjectModal
        isOpen={createProjectModalOpen}
        onClose={() => setCreateProjectModalOpen(false)}
        onSubmit={handleCreateProject}
      />
      <CreateSessionModal
        isOpen={createSessionModalOpen}
        projectId={selectedProjectForSession}
        onClose={() => setCreateSessionModalOpen(false)}
        onSubmit={handleCreateSession}
      />
    </div>
  );
}

export default App;
