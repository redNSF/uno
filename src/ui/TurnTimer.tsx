/**
 * TurnTimer.tsx — Circular arc countdown
 */

import React, { useEffect, useRef, useState } from 'react';
import { useUnoStore } from '../game/store';

interface TurnTimerProps {
  durationSeconds: number;
}

const RADIUS = 22;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function TurnTimer({ durationSeconds }: TurnTimerProps) {
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const handleDrawCard = useUnoStore((s) => s.handleDrawCard);
  const game = useUnoStore((s) => s.game);
  const myPlayerId = useUnoStore((s) => s.myPlayerId);
  const isMyTurn = game?.players[game.currentPlayerIndex]?.id === myPlayerId;
  const turnStartTime = game?.turnStartTime ?? Date.now();

  useEffect(() => {
    setTimeLeft(durationSeconds);

    if (!isMyTurn) return;

    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - turnStartTime) / 1000;
      const remaining = Math.max(0, durationSeconds - elapsed);
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(intervalRef.current!);
        // Auto-draw on timeout
        handleDrawCard();
      }
    }, 250);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isMyTurn, turnStartTime]);

  const progress = timeLeft / durationSeconds;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  const color = timeLeft > 8 ? '#48BB78' : timeLeft > 4 ? '#ECC94B' : '#FC8181';

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: 56, height: 56 }}
      role="timer"
      aria-label={`${Math.ceil(timeLeft)}s remaining`}
    >
      <svg width="56" height="56" style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
        {/* Background circle */}
        <circle
          cx="28" cy="28" r={RADIUS}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="3"
        />
        {/* Progress arc */}
        <circle
          cx="28" cy="28" r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.25s linear, stroke 0.5s ease' }}
        />
      </svg>
      <span
        className="font-mono text-xs font-bold"
        style={{ color, textShadow: `0 0 6px ${color}` }}
      >
        {Math.ceil(timeLeft)}
      </span>
    </div>
  );
}
