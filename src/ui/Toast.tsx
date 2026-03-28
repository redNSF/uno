/**
 * Toast.tsx — Slide-in notification toasts
 */

import React from 'react';
import { Toast as ToastType } from '../game/store';

const TYPE_STYLES: Record<string, { border: string; icon: string; glow: string }> = {
  info:    { border: 'border-casino-gold/30', icon: 'ℹ️', glow: '' },
  success: { border: 'border-green-400/40',  icon: '✅', glow: 'rgba(72,187,120,0.2)' },
  warning: { border: 'border-yellow-400/40', icon: '⚠️', glow: 'rgba(236,201,75,0.2)' },
  error:   { border: 'border-red-400/40',    icon: '❌', glow: 'rgba(252,129,129,0.2)' },
  uno:     { border: 'border-red-500/60',    icon: '🎴', glow: 'rgba(229,62,62,0.4)' },
  skip:    { border: 'border-red-400/40',    icon: '⊘',  glow: 'rgba(229,62,62,0.2)' },
  reverse: { border: 'border-blue-400/40',   icon: '↺',  glow: 'rgba(49,130,206,0.2)' },
  draw:    { border: 'border-red-400/40',    icon: '+',  glow: 'rgba(229,62,62,0.2)' },
  wild:    { border: 'border-purple-400/40', icon: '🌈', glow: 'rgba(139,0,255,0.2)' },
};

interface ToastProps {
  toast: ToastType;
}

export function Toast({ toast }: ToastProps) {
  const style = TYPE_STYLES[toast.type] ?? TYPE_STYLES.info;

  return (
    <div
      className={`toast glass-panel border ${style.border} px-4 py-2 flex items-center gap-2 min-w-36 animate-slide-in-up`}
      style={{
        boxShadow: style.glow ? `0 0 20px ${style.glow}` : undefined,
      }}
    >
      <span className="text-sm">{style.icon}</span>
      <span className="text-white/90 text-sm font-medium">{toast.message}</span>
    </div>
  );
}
