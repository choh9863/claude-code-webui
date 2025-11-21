import React from 'react';
import { X } from 'lucide-react';
import type { Session } from '../../../shared/types';

interface SessionTabsProps {
  sessions: Session[];
  activeSessionIds: string[];
  currentSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onCloseSession: (sessionId: string) => void;
}

export const SessionTabs: React.FC<SessionTabsProps> = ({
  sessions,
  activeSessionIds,
  currentSessionId,
  onSelectSession,
  onCloseSession,
}) => {
  const activeSessions = activeSessionIds
    .map((id) => sessions.find((s) => s.id === id))
    .filter((s): s is Session => s !== undefined);

  if (activeSessions.length === 0) {
    return null;
  }

  return (
    <div className="flex gap-1 bg-slate-800 border-b border-slate-700 overflow-x-auto px-2 py-1">
      {activeSessions.map((session) => {
        const isActive = session.id === currentSessionId;

        return (
          <div
            key={session.id}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg cursor-pointer transition-colors ${
              isActive
                ? 'bg-slate-900 text-slate-100'
                : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
            }`}
            onClick={() => onSelectSession(session.id)}
          >
            <span className="text-sm whitespace-nowrap">{session.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCloseSession(session.id);
              }}
              className="p-0.5 hover:bg-slate-600 rounded transition-colors"
              title="Close session"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
