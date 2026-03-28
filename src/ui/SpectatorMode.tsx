/**
 * SpectatorMode.tsx — Free orbit camera + all-hands toggle
 */

import React, { useState } from 'react';
import { useUnoStore } from '../game/store';

export function SpectatorMode() {
  const game = useUnoStore((s) => s.game);
  const [showAllHands, setShowAllHands] = useState(false);

  if (!game) return null;

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 pointer-events-auto">
      <div className="glass-panel px-4 py-2 flex items-center gap-3 text-sm">
        <span className="text-white/50 text-xs uppercase tracking-widest font-mono">Spectating</span>
        <div className="gold-divider w-0 h-4 border-l border-casino-gold/20" />
        <span className="text-white/40 text-xs animate-pulse">Waiting for next game…</span>
      </div>

      <button
        className="btn-ghost text-xs px-4 py-1"
        onClick={() => setShowAllHands(!showAllHands)}
      >
        {showAllHands ? 'Hide' : 'Show'} All Hands
      </button>

      {showAllHands && (
        <div className="glass-panel p-3 flex flex-col gap-2 min-w-48">
          {game.players.map((p) => (
            <div key={p.id} className="flex items-center justify-between text-xs">
              <span className="text-white/60">{p.avatar} {p.name}</span>
              <span className="text-casino-gold/50 font-mono">{p.hand.length} cards</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
