import React, { useState, useRef, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';

interface InputBoxProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export const InputBox: React.FC<InputBoxProps> = ({ onSendMessage, disabled = false }) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  };

  return (
    <div className="border-t border-slate-700 bg-slate-800 p-4">
      <div className="flex gap-2 items-end">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Type your message... (Ctrl+Enter to send)"
          disabled={disabled}
          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          rows={1}
          style={{ minHeight: '48px', maxHeight: '200px' }}
        />
        <button
          onClick={handleSend}
          disabled={disabled || !message.trim()}
          className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-lg text-white transition-colors flex items-center gap-2"
          title="Send message (Ctrl+Enter)"
        >
          <Send size={18} />
        </button>
      </div>
      <div className="mt-2 text-xs text-slate-500">
        Press <kbd className="px-1 py-0.5 bg-slate-700 rounded">Ctrl+Enter</kbd> to send
      </div>
    </div>
  );
};
