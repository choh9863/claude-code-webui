import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Plus, Folder, MessageSquare, Settings } from 'lucide-react';
import { useAppStore } from '../store';
import type { Project, Session } from '../../../shared/types';

interface SidebarProps {
  projects: Project[];
  sessions: Record<string, Session[]>;
  onSelectSession: (sessionId: string) => void;
  onCreateProject: () => void;
  onCreateSession: (projectId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  projects,
  sessions,
  onSelectSession,
  onCreateProject,
  onCreateSession,
}) => {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const currentSessionId = useAppStore((state) => state.currentSessionId);

  const toggleProject = (projectId: string) => {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  return (
    <div className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-lg font-semibold text-slate-100">Projects</h2>
        <button
          onClick={onCreateProject}
          className="mt-2 w-full flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm text-white transition-colors"
        >
          <Plus size={16} />
          New Project
        </button>
      </div>

      {/* Projects List */}
      <div className="flex-1 overflow-y-auto">
        {projects.map((project) => {
          const projectSessions = sessions[project.id] || [];
          const isExpanded = expandedProjects.has(project.id);

          return (
            <div key={project.id} className="border-b border-slate-700">
              {/* Project Header */}
              <div
                className="flex items-center gap-2 p-3 hover:bg-slate-700 cursor-pointer transition-colors"
                onClick={() => toggleProject(project.id)}
              >
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <Folder size={16} className="text-blue-400" />
                <span className="text-sm text-slate-200 flex-1 truncate">{project.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateSession(project.id);
                  }}
                  className="p-1 hover:bg-slate-600 rounded"
                  title="New Session"
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Sessions List */}
              {isExpanded && (
                <div className="bg-slate-900">
                  {projectSessions.length === 0 ? (
                    <div className="px-8 py-2 text-xs text-slate-500">No sessions</div>
                  ) : (
                    projectSessions.map((session) => (
                      <div
                        key={session.id}
                        className={`flex items-center gap-2 px-8 py-2 hover:bg-slate-700 cursor-pointer transition-colors ${
                          currentSessionId === session.id ? 'bg-slate-700' : ''
                        }`}
                        onClick={() => onSelectSession(session.id)}
                      >
                        <MessageSquare size={14} className="text-green-400" />
                        <span className="text-sm text-slate-300 flex-1 truncate">
                          {session.name}
                        </span>
                        {session.autoSaveEnabled && (
                          <span className="text-xs text-slate-500" title="Auto-save enabled">
                            💾
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}

        {projects.length === 0 && (
          <div className="p-4 text-center text-slate-500 text-sm">
            No projects yet. Create one to get started!
          </div>
        )}
      </div>
    </div>
  );
};
