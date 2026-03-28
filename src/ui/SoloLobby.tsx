/**
 * SoloLobby.tsx — Configure 2–7 players for solo play
 */

import React, { useState } from 'react';
import { useUnoStore, LobbyPlayerConfig } from '../game/store';
import { HouseRuleKey, HOUSE_RULE_LABELS, HOUSE_RULE_DESCRIPTIONS } from '../game/houseRules';

const AVATARS = ['🎮', '🔥', '🤖', '👾', '🎯', '⚡', '💎', '🦊', '🐉', '🌟', '🎲', '🃏', '🦁', '🐺', '🌀', '🎪'];
const BOT_NAMES = ['Alex', 'Nova', 'Rex', 'Luna', 'Zara', 'Orion'];
const SEAT_COLORS = ['#DC143C', '#0047AB', '#FFBF00', '#50C878', '#8B00FF', '#FF007F', '#00FFFF'];

type PlayerType = LobbyPlayerConfig['type'];

const PLAYER_TYPE_LABELS: Record<PlayerType, string> = {
  'human': 'You',
  'bot-easy': 'Bot — Easy',
  'bot-medium': 'Bot — Medium',
  'bot-hard': 'Bot — Hard',
  'empty': 'Empty',
};

function SeatCard({ config, index, onChange, isDisabled }: {
  config: LobbyPlayerConfig;
  index: number;
  onChange: (cfg: Partial<LobbyPlayerConfig>) => void;
  isDisabled: boolean;
}) {
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(config.name);
  const [showAvatars, setShowAvatars] = useState(false);

  const color = SEAT_COLORS[index];
  const isEmpty = config.type === 'empty';

  const cycleType = () => {
    const types: PlayerType[] = ['bot-easy', 'bot-medium', 'bot-hard', 'empty'];
    if (index === 0) return; // can't change human slot
    const current = types.indexOf(config.type as PlayerType) ?? 0;
    const next = types[(current + 1) % types.length];
    const newName = next !== 'empty' ? (BOT_NAMES[index - 1] ?? `Bot ${index}`) : '';
    const newAvatar = next !== 'empty' ? '🤖' : '';
    onChange({ type: next, name: newName, avatar: newAvatar });
  };

  return (
    <div
      className={`seat-card p-4 flex flex-col gap-3 transition-all duration-200 ${isEmpty ? 'opacity-40' : 'opacity-100'}`}
      style={{ borderColor: isEmpty ? 'rgba(212,175,55,0.1)' : `${color}40` }}
    >
      {/* Seat header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ background: color, boxShadow: `0 0 8px ${color}` }}
          />
          <span className="text-casino-gold/60 text-xs font-mono uppercase tracking-widest">
            Seat {index + 1}
          </span>
        </div>

        {index !== 0 && !isDisabled && (
          <button
            className="text-xs text-white/40 hover:text-casino-gold/80 transition-colors"
            onClick={cycleType}
          >
            {PLAYER_TYPE_LABELS[config.type]} ▾
          </button>
        )}
        {index === 0 && (
          <span className="text-xs text-casino-gold/40 font-mono">HUMAN</span>
        )}
      </div>

      {!isEmpty && (
        <>
          {/* Avatar */}
          <div className="flex items-center gap-3">
            <button
              className="avatar-emoji text-2xl w-12 h-12"
              onClick={() => setShowAvatars(!showAvatars)}
              title="Change avatar"
            >
              {config.avatar || '👤'}
            </button>

            {/* Name */}
            {editingName ? (
              <input
                autoFocus
                className="flex-1 bg-white/5 border border-casino-gold/30 rounded px-2 py-1 text-sm text-white outline-none focus:border-casino-gold/70"
                value={nameVal}
                maxLength={16}
                onChange={(e) => setNameVal(e.target.value)}
                onBlur={() => { setEditingName(false); onChange({ name: nameVal || config.name }); }}
                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
              />
            ) : (
              <span
                className="flex-1 text-white font-medium cursor-pointer hover:text-casino-gold/80 transition-colors"
                onClick={() => !isDisabled && setEditingName(true)}
                title="Click to rename"
              >
                {config.name}
              </span>
            )}
          </div>

          {/* Avatar grid */}
          {showAvatars && (
            <div className="grid grid-cols-8 gap-1">
              {AVATARS.map((av) => (
                <button
                  key={av}
                  className={`avatar-emoji text-lg w-8 h-8 ${config.avatar === av ? 'selected' : ''}`}
                  onClick={() => { onChange({ avatar: av }); setShowAvatars(false); }}
                >
                  {av}
                </button>
              ))}
            </div>
          )}

          {/* Difficulty badge */}
          {config.type !== 'human' && (
            <span className={`text-xs px-2 py-0.5 rounded-full border font-mono w-fit
              ${config.type === 'bot-easy' ? 'difficulty-easy' : ''}
              ${config.type === 'bot-medium' ? 'difficulty-medium' : ''}
              ${config.type === 'bot-hard' ? 'difficulty-hard' : ''}
            `}>
              {config.type === 'bot-easy' ? 'EASY' : config.type === 'bot-medium' ? 'MEDIUM' : 'HARD'}
            </span>
          )}
        </>
      )}

      {isEmpty && (
        <div className="text-center text-white/20 text-sm py-2">Empty Slot</div>
      )}
    </div>
  );
}

// ---- Solo Lobby ----

export function SoloLobby() {
  const { lobbyPlayers, houseRules, setLobbyPlayer, setHouseRule, startGame, setScreen } = useUnoStore();
  const [showRules, setShowRules] = useState(false);

  const activePlayers = lobbyPlayers.filter((p) => p.type !== 'empty');
  const canStart = activePlayers.length >= 2;

  const houseRuleKeys = Object.keys(houseRules) as HouseRuleKey[];

  return (
    <div className="relative w-full h-full flex flex-col bg-casino-dark overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 glass-panel rounded-none border-x-0 border-t-0 px-6 py-4 flex items-center justify-between">
        <button
          className="text-casino-gold/60 hover:text-casino-gold transition-colors text-sm"
          onClick={() => setScreen('main-menu')}
        >
          ← Back
        </button>
        <div className="font-display text-casino-gold text-xl tracking-widest">
          SOLO PLAY
        </div>
        <button
          className="text-casino-gold/60 hover:text-casino-gold transition-colors text-sm"
          onClick={() => setShowRules(!showRules)}
        >
          Rules ⚙
        </button>
      </div>

      <div className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full">
        {/* Player count */}
        <div className="mb-4 flex items-center gap-3">
          <span className="text-white/60 text-sm">Players:</span>
          {[2, 3, 4, 5, 6, 7].map((n) => (
            <button
              key={n}
              className={`w-8 h-8 rounded-full border text-sm font-mono transition-all
                ${activePlayers.length === n
                  ? 'bg-casino-gold text-casino-dark border-casino-gold font-bold'
                  : 'border-casino-gold/30 text-casino-gold/50 hover:border-casino-gold/60'
                }`}
              onClick={() => {
                for (let i = 1; i < 7; i++) {
                  if (i < n) {
                    if (lobbyPlayers[i].type === 'empty') {
                      setLobbyPlayer(i, {
                        type: 'bot-medium',
                        name: BOT_NAMES[i - 1] ?? `Bot ${i}`,
                        avatar: '🤖',
                      });
                    }
                  } else {
                    setLobbyPlayer(i, { type: 'empty', name: '', avatar: '' });
                  }
                }
              }}
            >
              {n}
            </button>
          ))}
        </div>

        {/* Player Seats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {lobbyPlayers.map((cfg, i) => (
            <SeatCard
              key={i}
              config={cfg}
              index={i}
              onChange={(changes) => setLobbyPlayer(i, changes)}
              isDisabled={false}
            />
          ))}
        </div>

        {/* House Rules */}
        {showRules && (
          <div className="glass-panel p-4 mb-6 animate-scale-in">
            <div className="font-display text-casino-gold text-sm tracking-widest mb-4">HOUSE RULES</div>
            <div className="grid grid-cols-1 gap-3">
              {houseRuleKeys.map((key) => (
                <label key={key} className="flex items-center justify-between gap-4 cursor-pointer group">
                  <div>
                    <div className="text-white text-sm group-hover:text-casino-gold/90 transition-colors">
                      {HOUSE_RULE_LABELS[key]}
                    </div>
                    <div className="text-white/40 text-xs mt-0.5">{HOUSE_RULE_DESCRIPTIONS[key]}</div>
                  </div>
                  <button
                    role="switch"
                    aria-checked={houseRules[key] as boolean}
                    onClick={() => setHouseRule(key, !houseRules[key] as any)}
                    className={`relative w-10 h-5 rounded-full transition-all flex-shrink-0
                      ${houseRules[key] ? 'bg-casino-gold' : 'bg-white/10'}`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all
                        ${houseRules[key] ? 'left-5' : 'left-0.5'}`}
                    />
                  </button>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Start button */}
        <button
          id="btn-start-game"
          className="btn-gold w-full text-xl py-5 tracking-widest"
          disabled={!canStart}
          onClick={startGame}
        >
          {canStart ? 'Start Game' : `Need at least 2 players`}
        </button>
      </div>
    </div>
  );
}
