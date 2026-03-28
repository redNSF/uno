/**
 * WinScreen.tsx — Cinematic win/lose overlay
 */

import React, { useEffect } from 'react';
import { useUnoStore } from '../game/store';

const TROPHY_FRAMES = ['🏆', '✨', '🏆', '🌟', '🏆'];

interface WinScreenProps {
  winnerId: string | null;
}

export function WinScreen({ winnerId }: WinScreenProps) {
  const { game, myPlayerId, setScreen } = useUnoStore();
  const startGame = useUnoStore((s) => s.startGame);

  if (!game || !winnerId) return null;

  const winner = game.players.find((p) => p.id === winnerId);
  const isMe = winnerId === myPlayerId;

  return (
    <div
      className="win-overlay fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)' }}
    >
      {/* Glow radial */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isMe
            ? 'radial-gradient(ellipse at center, rgba(212,175,55,0.2) 0%, transparent 70%)'
            : 'radial-gradient(ellipse at center, rgba(229,62,62,0.15) 0%, transparent 70%)',
        }}
      />

      <div className="flex flex-col items-center gap-8 relative z-10 animate-scale-in">
        {/* Trophy */}
        <div
          className="text-8xl animate-float select-none"
          style={{ filter: isMe ? 'drop-shadow(0 0 20px gold)' : 'drop-shadow(0 0 12px crimson)' }}
        >
          {isMe ? '🏆' : '💀'}
        </div>

        {/* Result text */}
        <div className="text-center">
          <div
            className={`font-display text-5xl font-bold tracking-widest ${isMe ? 'text-gold-shimmer' : 'text-red-400'}`}
          >
            {isMe ? 'VICTORY!' : 'DEFEAT'}
          </div>
          {!isMe && winner && (
            <div className="text-white/60 mt-2 font-mono text-sm">
              {winner.avatar} {winner.name} wins this round
            </div>
          )}
        </div>

        {/* Gold divider */}
        <div className="gold-divider w-48" />

        {/* Final scores */}
        <div className="flex flex-col gap-2 w-64">
          {game.players
            .slice()
            .sort((a, b) => a.hand.length - b.hand.length)
            .map((p, rank) => (
              <div key={p.id} className="flex items-center justify-between glass-panel-light px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-casino-gold/40 text-xs font-mono w-4">#{rank + 1}</span>
                  <span>{p.avatar}</span>
                  <span className={`text-sm ${p.id === myPlayerId ? 'text-casino-gold' : 'text-white/70'}`}>
                    {p.name}
                  </span>
                </div>
                <span className="text-white/40 text-xs font-mono">
                  {p.hand.length} cards
                </span>
              </div>
            ))}
        </div>

        {/* Actions */}
        <div className="flex gap-4 mt-2">
          <button
            id="btn-play-again"
            className="btn-gold px-8 py-3 text-sm tracking-widest"
            onClick={startGame}
          >
            Play Again
          </button>
          <button
            id="btn-main-menu-from-win"
            className="btn-ghost px-8 py-3 text-sm"
            onClick={() => setScreen('main-menu')}
          >
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
}
