import React, { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import type { Message } from '../../../shared/types';
import { Loader2 } from 'lucide-react';

interface ChatAreaProps {
  messages: Message[];
  sessionStatus: 'idle' | 'running' | 'error';
}

export const ChatArea: React.FC<ChatAreaProps> = ({ messages, sessionStatus }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-900">
      {messages.length === 0 ? (
        <div className="h-full flex items-center justify-center text-slate-500">
          <div className="text-center">
            <div className="text-6xl mb-4">💬</div>
            <div className="text-lg">Start a conversation with Claude</div>
            <div className="text-sm mt-2">Type a message below to begin</div>
          </div>
        </div>
      ) : (
        <div>
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {/* Loading indicator */}
          {sessionStatus === 'running' && (
            <div className="flex gap-3 p-4 bg-slate-900">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
                <Loader2 size={18} className="animate-spin" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-300 mb-1">Claude</div>
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-slate-500 rounded-full animate-pulse" />
                  <span
                    className="w-2 h-2 bg-slate-500 rounded-full animate-pulse"
                    style={{ animationDelay: '0.2s' }}
                  />
                  <span
                    className="w-2 h-2 bg-slate-500 rounded-full animate-pulse"
                    style={{ animationDelay: '0.4s' }}
                  />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
};
