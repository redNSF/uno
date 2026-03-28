/**
 * UnoButton.tsx — Pulsing UNO call button
 */

import React from 'react';
import { useUnoStore } from '../game/store';

export function UnoButton() {
  const handleCallUno = useUnoStore((s) => s.handleCallUno);
  const game = useUnoStore((s) => s.game);
  const myPlayerId = useUnoStore((s) => s.myPlayerId);

  // Countdown ring shows 2s window
  const isWindow = game?.unoCallWindow;

  return (
    <div className="relative flex items-center justify-center">
      {/* Countdown ring */}
      {isWindow && (
        <svg
          className="absolute"
          width="96"
          height="96"
          style={{ transform: 'rotate(-90deg)' }}
        >
          <circle
            cx="48" cy="48" r="44"
            fill="none"
            stroke="rgba(229,62,62,0.3)"
            strokeWidth="4"
          />
          <circle
            className="turn-timer-arc"
            cx="48" cy="48" r="44"
            fill="none"
            stroke="#FC8181"
            strokeWidth="4"
            strokeDasharray="276"
            strokeDashoffset="0"
            style={{
              animation: 'countdown-ring 2s linear forwards',
              strokeLinecap: 'round',
            }}
          />
        </svg>
      )}

      <button
        id="btn-uno"
        className="uno-button"
        onClick={handleCallUno}
        aria-label="Call UNO"
      >
        UNO
      </button>
    </div>
  );
}
