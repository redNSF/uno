/**
 * ChatPanel.tsx — Slide-in chat panel for party mode
 */

import React, { useRef, useEffect, useState } from 'react';
import { useUnoStore } from '../game/store';

const QUICK_REACTIONS = ['🔥', '😂', '😤', '👏', '🤯', '💀'];

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChatPanel({ isOpen, onClose }: ChatPanelProps) {
  const { chatMessages, sendChatMessage, roomInfo } = useUnoStore();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null!);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const send = (text: string) => {
    if (!text.trim()) return;
    sendChatMessage(text);
    setInput('');
  };

  if (!isOpen) return null;

  return (
    <div className="chat-panel absolute right-0 top-0 h-full w-64 glass-panel-light border-l border-casino-gold/10 rounded-none flex flex-col z-20">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-casino-gold/10 flex-shrink-0">
        <span className="text-casino-gold/60 text-xs uppercase tracking-widest font-mono">Chat</span>
        <button className="text-white/40 hover:text-white text-xs" onClick={onClose}>✕</button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {chatMessages.length === 0 && (
          <div className="text-white/20 text-xs text-center mt-4">No messages yet…</div>
        )}
        {chatMessages.slice(-50).map((msg) => (
          <div key={msg.id} className={`text-xs ${msg.playerId === roomInfo?.playerId ? 'text-right' : ''}`}>
            <span className="text-casino-gold/50 font-medium">{msg.playerName}: </span>
            <span className="text-white/70">{msg.text}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Quick reactions */}
      <div className="flex gap-1 px-3 py-1 border-t border-casino-gold/10 flex-shrink-0">
        {QUICK_REACTIONS.map((r) => (
          <button
            key={r}
            className="text-base hover:scale-125 transition-transform"
            onClick={() => send(r)}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2 p-2 border-t border-casino-gold/10 flex-shrink-0">
        <input
          className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white outline-none focus:border-casino-gold/40 min-w-0"
          placeholder="Message…"
          maxLength={60}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send(input); }}
        />
        <button
          className="text-casino-gold/60 hover:text-casino-gold text-sm flex-shrink-0"
          onClick={() => send(input)}
        >
          ➤
        </button>
      </div>
    </div>
  );
}
