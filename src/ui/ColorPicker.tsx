/**
 * ColorPicker.tsx — Full-screen wild color selection modal
 */

import React from 'react';
import { useUnoStore } from '../game/store';

const COLORS = [
  { id: 'red',    label: 'Red',    hex: '#E53E3E', glow: 'rgba(229,62,62,0.6)' },
  { id: 'blue',   label: 'Blue',   hex: '#3182CE', glow: 'rgba(49,130,206,0.6)' },
  { id: 'green',  label: 'Green',  hex: '#38A169', glow: 'rgba(56,161,105,0.6)' },
  { id: 'yellow', label: 'Yellow', hex: '#ECC94B', glow: 'rgba(236,201,75,0.6)' },
] as const;

export function ColorPicker() {
  const handleSetWildColor = useUnoStore((s) => s.handleSetWildColor);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }}
    >
      <div className="flex flex-col items-center gap-8 animate-scale-in">
        <h2 className="font-display text-casino-gold text-2xl tracking-widest text-gold-shimmer">
          Choose Color
        </h2>

        <div className="grid grid-cols-2 gap-6">
          {COLORS.map((c) => (
            <button
              key={c.id}
              id={`color-pick-${c.id}`}
              className="color-orb w-28 h-28 flex flex-col items-center justify-center gap-2 transition-transform hover:scale-110 active:scale-95"
              style={{
                background: `radial-gradient(circle at 40% 35%, ${c.hex}CC, ${c.hex}88)`,
                boxShadow: `0 0 32px ${c.glow}, 0 0 64px ${c.glow}55`,
                border: `2px solid ${c.hex}66`,
                color: c.hex,
              }}
              onClick={() => handleSetWildColor(c.id)}
            >
              <div
                className="w-16 h-16 rounded-full"
                style={{
                  background: `radial-gradient(circle at 35% 30%, white 0%, ${c.hex} 40%, ${c.hex}88 100%)`,
                  boxShadow: `0 0 20px ${c.glow}`,
                }}
              />
              <span
                className="font-display text-xs tracking-widest uppercase"
                style={{ color: c.hex, textShadow: `0 0 8px ${c.glow}` }}
              >
                {c.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
