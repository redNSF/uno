/**
 * HUD.tsx — In-game overlay: badges, color orb, timers
 */

import React, { useEffect, useRef } from 'react';
import { useUnoStore } from '../game/store';
import { UnoButton } from './UnoButton';
import { ColorPicker } from './ColorPicker';
import { Toast } from './Toast';
import { TurnTimer } from './TurnTimer';
import { WinScreen } from './WinScreen';
import { getPlayableCards } from '../game/logic';

const CARD_COLORS = ['red', 'blue', 'green', 'yellow'] as const;

const COLOR_HEX: Record<string, string> = {
  red: '#E53E3E',
  blue: '#3182CE',
  green: '#38A169',
  yellow: '#ECC94B',
};

export function HUD() {
  const game = useUnoStore((s) => s.game);
  const myPlayerId = useUnoStore((s) => s.myPlayerId);
  const pendingWildColor = useUnoStore((s) => s.pendingWildColor);
  const toasts = useUnoStore((s) => s.toasts);
  const handleDrawCard = useUnoStore((s) => s.handleDrawCard);
  const handlePass = useUnoStore((s) => s.handlePass);
  const setScreen = useUnoStore((s) => s.setScreen);

  if (!game) return null;

  const currentPlayer = game.players[game.currentPlayerIndex];
  const isMyTurn = currentPlayer?.id === myPlayerId;
  const myPlayer = game.players.find((p) => p.id === myPlayerId);
  const topCard = game.discardPile[game.discardPile.length - 1];
  const currentColor = game.currentColor;

  // UNO button visible when I have exactly 1 card and window is open
  const showUnoButton =
    game.unoCallWindow &&
    (game.unoCallWindowPlayer === myPlayerId || (myPlayer && myPlayer.hand.length === 1));

  // Playable cards
  const playableCards = myPlayer
    ? getPlayableCards(game, myPlayerId!)
    : [];
  const hasPlayableCard = playableCards.length > 0;
  const canDraw = isMyTurn && game.phase === 'playing';

  if (game.phase === 'game-end') {
    return (
      <>
        <WinScreen winnerId={game.winner} />
        <ToastList toasts={toasts} />
      </>
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* Current color orb — center bottom */}
      <div className="absolute bottom-32 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none">
        <div
          className={`color-orb-center w-12 h-12 ${currentColor}`}
          style={{
            background: `radial-gradient(circle, ${COLOR_HEX[currentColor]}BB 0%, ${COLOR_HEX[currentColor]} 60%, ${COLOR_HEX[currentColor]}88 100%)`,
            boxShadow: `0 0 24px ${COLOR_HEX[currentColor]}BB, 0 0 48px ${COLOR_HEX[currentColor]}55`,
          }}
        />
        <span className="text-white/50 text-xs font-mono uppercase tracking-widest">
          {currentColor}
        </span>
      </div>

      {/* Draw pile count — top left */}
      <div className="absolute top-4 left-4 glass-panel px-3 py-2 text-center">
        <div className="text-casino-gold/80 text-xs font-mono">{game.deck.length}</div>
        <div className="text-white/30 text-[10px]">Deck</div>
      </div>

      {/* Draw stack badge */}
      {game.drawStack > 0 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 glass-panel px-4 py-2 animate-bounce-uno">
          <div className="text-card-red font-display text-lg font-bold">
            +{game.drawStack}
          </div>
        </div>
      )}

      {/* Active player indicator */}
      <div className="absolute top-4 right-4 glass-panel px-3 py-2 flex items-center gap-2">
        <div
          className="w-2 h-2 rounded-full animate-pulse"
          style={{ background: currentPlayer?.signatureColor ?? '#D4AF37' }}
        />
        <span className="text-white/70 text-xs font-medium">
          {isMyTurn ? 'Your Turn' : `${currentPlayer?.name}'s Turn`}
        </span>
      </div>

      {/* Turn timer */}
      {isMyTurn && (
        <div className="absolute top-16 right-4 pointer-events-none">
          <TurnTimer durationSeconds={15} />
        </div>
      )}

      {/* Bottom action bar */}
      {isMyTurn && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 pointer-events-auto">
          {canDraw && !hasPlayableCard && (
            <button className="btn-gold px-6 py-3 text-sm" onClick={handleDrawCard}>
              Draw Card
            </button>
          )}
          {canDraw && hasPlayableCard && game.drawStack > 0 && (
            <button className="btn-ghost px-6 py-3 text-sm" onClick={handleDrawCard}>
              Draw +{game.drawStack}
            </button>
          )}
          {isMyTurn && !hasPlayableCard && (
            <button className="btn-ghost px-4 py-3 text-sm text-white/50" onClick={handlePass}>
              Pass
            </button>
          )}
        </div>
      )}

      {/* UNO Button */}
      {showUnoButton && (
        <div className="absolute bottom-6 right-6 pointer-events-auto">
          <UnoButton />
        </div>
      )}

      {/* Wild color picker */}
      {pendingWildColor && (
        <div className="pointer-events-auto">
          <ColorPicker />
        </div>
      )}

      {/* Toasts */}
      <ToastList toasts={toasts} />
    </div>
  );
}

function ToastList({ toasts }: { toasts: any[] }) {
  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 flex flex-col gap-2 items-center pointer-events-none z-50">
      {toasts.map((t) => <Toast key={t.id} toast={t} />)}
    </div>
  );
}
