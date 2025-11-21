import { create } from 'zustand';
import type { Project, Session, Message } from '../../../shared/types';

interface AppState {
  // Projects
  projects: Project[];
  selectedProject: Project | null;
  setProjects: (projects: Project[]) => void;
  setSelectedProject: (project: Project | null) => void;
  addProject: (project: Project) => void;
  updateProject: (project: Project) => void;
  removeProject: (projectId: string) => void;

  // Sessions
  sessions: Session[];
  activeSessions: string[]; // Session IDs of currently active (tabbed) sessions
  currentSessionId: string | null; // Currently focused session
  setSession: (sessions: Session[]) => void;
  addSession: (session: Session) => void;
  updateSession: (session: Session) => void;
  removeSession: (sessionId: string) => void;
  setActiveSessions: (sessionIds: string[]) => void;
  addActiveSession: (sessionId: string) => void;
  removeActiveSession: (sessionId: string) => void;
  setCurrentSessionId: (sessionId: string | null) => void;

  // Messages
  messages: Record<string, Message[]>; // sessionId -> messages
  setMessages: (sessionId: string, messages: Message[]) => void;
  addMessage: (sessionId: string, message: Message) => void;
  appendToLastMessage: (sessionId: string, chunk: string) => void;

  // UI State
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  sessionStatuses: Record<string, 'idle' | 'running' | 'error'>;
  setSessionStatus: (sessionId: string, status: 'idle' | 'running' | 'error') => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Projects
  projects: [],
  selectedProject: null,
  setProjects: (projects) => set({ projects }),
  setSelectedProject: (project) => set({ selectedProject: project }),
  addProject: (project) => set((state) => ({ projects: [...state.projects, project] })),
  updateProject: (project) =>
    set((state) => ({
      projects: state.projects.map((p) => (p.id === project.id ? project : p)),
      selectedProject: state.selectedProject?.id === project.id ? project : state.selectedProject,
    })),
  removeProject: (projectId) =>
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== projectId),
      selectedProject: state.selectedProject?.id === projectId ? null : state.selectedProject,
    })),

  // Sessions
  sessions: [],
  activeSessions: [],
  currentSessionId: null,
  setSession: (sessions) => set({ sessions }),
  addSession: (session) => set((state) => ({ sessions: [...state.sessions, session] })),
  updateSession: (session) =>
    set((state) => ({
      sessions: state.sessions.map((s) => (s.id === session.id ? session : s)),
    })),
  removeSession: (sessionId) =>
    set((state) => ({
      sessions: state.sessions.filter((s) => s.id !== sessionId),
      activeSessions: state.activeSessions.filter((id) => id !== sessionId),
      currentSessionId: state.currentSessionId === sessionId ? null : state.currentSessionId,
    })),
  setActiveSessions: (sessionIds) => set({ activeSessions: sessionIds }),
  addActiveSession: (sessionId) =>
    set((state) => {
      if (!state.activeSessions.includes(sessionId)) {
        return {
          activeSessions: [...state.activeSessions, sessionId],
          currentSessionId: sessionId,
        };
      }
      return { currentSessionId: sessionId };
    }),
  removeActiveSession: (sessionId) =>
    set((state) => {
      const newActiveSessions = state.activeSessions.filter((id) => id !== sessionId);
      return {
        activeSessions: newActiveSessions,
        currentSessionId:
          state.currentSessionId === sessionId
            ? newActiveSessions[newActiveSessions.length - 1] || null
            : state.currentSessionId,
      };
    }),
  setCurrentSessionId: (sessionId) => set({ currentSessionId: sessionId }),

  // Messages
  messages: {},
  setMessages: (sessionId, messages) =>
    set((state) => ({
      messages: { ...state.messages, [sessionId]: messages },
    })),
  addMessage: (sessionId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [sessionId]: [...(state.messages[sessionId] || []), message],
      },
    })),
  appendToLastMessage: (sessionId, chunk) =>
    set((state) => {
      const sessionMessages = state.messages[sessionId] || [];
      if (sessionMessages.length === 0) return state;

      const lastMessage = sessionMessages[sessionMessages.length - 1];
      if (lastMessage.role !== 'assistant') return state;

      const updatedMessages = [...sessionMessages];
      updatedMessages[updatedMessages.length - 1] = {
        ...lastMessage,
        content: lastMessage.content + chunk,
      };

      return {
        messages: {
          ...state.messages,
          [sessionId]: updatedMessages,
        },
      };
    }),

  // UI State
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  sessionStatuses: {},
  setSessionStatus: (sessionId, status) =>
    set((state) => ({
      sessionStatuses: { ...state.sessionStatuses, [sessionId]: status },
    })),
}));
