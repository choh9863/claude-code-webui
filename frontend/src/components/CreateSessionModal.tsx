import React, { useState } from 'react';
import { X } from 'lucide-react';

interface CreateSessionModalProps {
  isOpen: boolean;
  projectId: string;
  onClose: () => void;
  onSubmit: (projectId: string, name: string, autoSave: boolean, compression: boolean) => void;
}

export const CreateSessionModal: React.FC<CreateSessionModalProps> = ({
  isOpen,
  projectId,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [contextCompressionEnabled, setContextCompressionEnabled] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(projectId, name.trim(), autoSaveEnabled, contextCompressionEnabled);
      setName('');
      setAutoSaveEnabled(true);
      setContextCompressionEnabled(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-slate-100">Create New Session</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-700 rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Session Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Feature Development"
              required
            />
          </div>

          <div className="mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoSaveEnabled}
                onChange={(e) => setAutoSaveEnabled(e.target.checked)}
                className="w-4 h-4 bg-slate-900 border border-slate-700 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-300">
                Auto-save messages (default: enabled)
              </span>
            </label>
            <p className="text-xs text-slate-500 mt-1 ml-6">
              Automatically save chat history to database
            </p>
          </div>

          <div className="mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={contextCompressionEnabled}
                onChange={(e) => setContextCompressionEnabled(e.target.checked)}
                className="w-4 h-4 bg-slate-900 border border-slate-700 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-300">
                Enable context compression
              </span>
            </label>
            <p className="text-xs text-slate-500 mt-1 ml-6">
              Compress older messages to save context space
            </p>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
            >
              Create Session
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
