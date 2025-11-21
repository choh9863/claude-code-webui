import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { Message } from '../../../shared/types';
import { User, Bot } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';

  // Parse code blocks from content
  const renderContent = () => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(message.content)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        const text = message.content.slice(lastIndex, match.index);
        parts.push(
          <div key={`text-${lastIndex}`} className="whitespace-pre-wrap">
            {text}
          </div>
        );
      }

      // Add code block
      const language = match[1] || 'text';
      const code = match[2];
      parts.push(
        <div key={`code-${match.index}`} className="my-2 rounded-lg overflow-hidden">
          <div className="bg-slate-700 px-3 py-1 text-xs text-slate-300">{language}</div>
          <SyntaxHighlighter
            language={language}
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              borderRadius: 0,
              fontSize: '0.875rem',
            }}
          >
            {code}
          </SyntaxHighlighter>
        </div>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < message.content.length) {
      const text = message.content.slice(lastIndex);
      parts.push(
        <div key={`text-${lastIndex}`} className="whitespace-pre-wrap">
          {text}
        </div>
      );
    }

    return parts.length > 0 ? parts : <div className="whitespace-pre-wrap">{message.content}</div>;
  };

  return (
    <div className={`flex gap-3 p-4 ${isUser ? 'bg-slate-800' : 'bg-slate-900'}`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-blue-600' : 'bg-green-600'
        }`}
      >
        {isUser ? <User size={18} /> : <Bot size={18} />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-slate-300 mb-1">
          {isUser ? 'You' : 'Claude'}
        </div>
        <div className="text-slate-200 text-sm leading-relaxed">{renderContent()}</div>

        {/* Metadata */}
        {message.metadata && (
          <div className="mt-2 text-xs text-slate-500">
            {message.metadata.status && (
              <span className="mr-2">Status: {message.metadata.status}</span>
            )}
            {message.metadata.toolCalls && message.metadata.toolCalls.length > 0 && (
              <span>Tools used: {message.metadata.toolCalls.length}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
