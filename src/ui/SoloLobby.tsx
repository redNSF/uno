import { useState } from 'react'
import { useStore } from '../game/store'
import type { AiLevel } from '../utils/constants'
import { AI_LEVELS, GAME_LIMITS } from '../utils/constants'
import { DEFAULT_HOUSE_RULES } from '../game/houseRules'
import { DISPLAY_NAMES, RULE_DESCRIPTIONS } from '../game/houseRules'

const AVATARS = ['😎', '🤖', '👾', '🦊', '🐉', '🎭', '💎', '🔥']
const AI_COLORS: Record<AiLevel, string> = {
  easy: '#1fb851',
  medium: '#f5c817',
  hard: '#e02020',
}

type SlotType = 'human' | AiLevel
interface Slot { name: string; type: SlotType; avatar: string }

const defaultSlots = (): Slot[] => [
  { name: 'You', type: 'human', avatar: '😎' },
  { name: 'Bot Alpha', type: 'medium', avatar: '🤖' },
  { name: 'Bot Beta', type: 'medium', avatar: '👾' },
  { name: 'Bot Gamma', type: 'easy', avatar: '🦊' },
]

export function SoloLobby() {
  const setRoute = useStore(s => s.setRoute)
  const initGame = useStore(s => s.initGame)
  const setHouseRules = useStore(s => s.setHouseRules)
  const houseRules = useStore(s => s.houseRules)

  const [slots, setSlots] = useState<Slot[]>(defaultSlots)
  const [showRules, setShowRules] = useState(false)

  const updateSlot = (i: number, patch: Partial<Slot>) =>
    setSlots(s => s.map((slot, idx) => idx === i ? { ...slot, ...patch } : slot))

  const addSlot = () => {
    if (slots.length >= GAME_LIMITS.MAX_PLAYERS) return
    setSlots(s => [...s, { name: `Bot ${String.fromCharCode(68 + s.length - 4)}`, type: 'medium', avatar: AVATARS[s.length % AVATARS.length] }])
  }

  const removeSlot = (i: number) => {
    if (i === 0 || slots.length <= GAME_LIMITS.MIN_PLAYERS) return
    setSlots(s => s.filter((_, idx) => idx !== i))
  }

  const handleStart = () => {
    initGame(slots.map(s => ({
      name: s.name,
      isHuman: s.type === 'human',
      aiLevel: s.type !== 'human' ? s.type as AiLevel : undefined,
      avatar: s.avatar,
    })))
    setRoute('game')
  }

  return (
    <div className="lobby-page">
      {/* Background floating cards */}
      <div className="lobby-bg-cards">
        {['🟥', '🟨', '🟩', '🟦'].map((c, i) => (
          <div key={i} className="lobby-bg-card" style={{ animationDelay: `${i * 0.7}s`, left: `${15 + i * 18}%` }}>
            {c}
          </div>
        ))}
      </div>

      <div className="lobby-container">
        <button className="lobby-back-btn" onClick={() => setRoute('mainmenu')}>← Back</button>

        <h1 className="lobby-title">Solo Game</h1>
        <p className="lobby-subtitle">{slots.length} of {GAME_LIMITS.MAX_PLAYERS} seats filled</p>

        {/* Seat configurator */}
        <div className="lobby-seats">
          {slots.map((slot, i) => (
            <div key={i} className={`lobby-seat ${slot.type === 'human' ? 'lobby-seat--human' : ''}`}>
              {/* Avatar picker */}
              <div className="lobby-avatar-grid">
                {AVATARS.map(av => (
                  <button
                    key={av}
                    className={`lobby-avatar-btn ${slot.avatar === av ? 'active' : ''}`}
                    onClick={() => updateSlot(i, { avatar: av })}
                  >
                    {av}
                  </button>
                ))}
              </div>

              {/* Name input */}
              <input
                className="lobby-name-input"
                value={slot.name}
                onChange={e => updateSlot(i, { name: e.target.value.slice(0, 16) })}
                disabled={i === 0}
                placeholder="Player name"
              />

              {/* Type selector (AI level or Human) */}
              {i !== 0 && (
                <div className="lobby-type-selector">
                  {(AI_LEVELS as readonly AiLevel[]).map(level => (
                    <button
                      key={level}
                      className={`lobby-type-btn ${slot.type === level ? 'active' : ''}`}
                      style={slot.type === level ? { background: AI_COLORS[level] + '33', borderColor: AI_COLORS[level] } : {}}
                      onClick={() => updateSlot(i, { type: level })}
                    >
                      {level[0].toUpperCase() + level.slice(1)}
                    </button>
                  ))}
                </div>
              )}

              {/* Remove button */}
              {i > 0 && slots.length > GAME_LIMITS.MIN_PLAYERS && (
                <button className="lobby-remove-btn" onClick={() => removeSlot(i)}>✕</button>
              )}
            </div>
          ))}

          {/* Add slot */}
          {slots.length < GAME_LIMITS.MAX_PLAYERS && (
            <button className="lobby-add-btn" onClick={addSlot}>
              <span>+</span>
              <span>Add Player</span>
            </button>
          )}
        </div>

        {/* House Rules */}
        <button className="lobby-rules-toggle" onClick={() => setShowRules(r => !r)}>
          ⚙️ House Rules {showRules ? '▲' : '▼'}
        </button>

        {showRules && (
          <div className="lobby-rules-grid">
            {(Object.keys(DEFAULT_HOUSE_RULES) as (keyof typeof DEFAULT_HOUSE_RULES)[])
              .filter(k => k !== 'targetScore')
              .map(key => (
                <label key={key} className="lobby-rule-toggle" title={RULE_DESCRIPTIONS[key]}>
                  <div className="lobby-rule-info">
                    <span className="lobby-rule-name">{DISPLAY_NAMES[key]}</span>
                    <span className="lobby-rule-desc">{RULE_DESCRIPTIONS[key]}</span>
                  </div>
                  <div
                    className={`toggle-switch ${((houseRules as unknown) as Record<string, boolean>)[key] ? 'on' : ''}`}
                    onClick={() => setHouseRules({ [key]: !((houseRules as unknown) as Record<string, boolean>)[key] })}
                  >
                    <div className="toggle-knob" />
                  </div>
                </label>
              ))}
            <label className="lobby-rule-toggle">
              <div className="lobby-rule-info">
                <span className="lobby-rule-name">Points to Win</span>
                <span className="lobby-rule-desc">Game ends when a player reaches this score.</span>
              </div>
              <select
                className="lobby-score-select"
                value={houseRules.targetScore}
                onChange={e => setHouseRules({ targetScore: Number(e.target.value) })}
              >
                {[200, 300, 500, 1000].map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </label>
          </div>
        )}

        <button
          id="solo-start-btn"
          className="lobby-start-btn"
          onClick={handleStart}
          disabled={slots.length < GAME_LIMITS.MIN_PLAYERS}
        >
          🃏 Start Game
        </button>
      </div>
    </div>
  )
}
