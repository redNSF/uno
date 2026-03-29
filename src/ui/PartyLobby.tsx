import { useState, useEffect } from 'react'
import { nanoid } from 'nanoid'
import { useStore } from '../game/store'

const AVATARS = ['😎', '🤖', '👾', '🦊', '🐉', '🎭', '💎', '🔥']

export function PartyLobby() {
  const setRoute = useStore(s => s.setRoute)
  const roomId = useStore(s => s.party.roomId)
  const setRoomId = useStore(s => s.setRoomId)
  const localPlayerId = useStore(s => s.party.localPlayerId)
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose')
  const [joinInput, setJoinInput] = useState('')
  const [avatar, setAvatar] = useState('😎')
  const [playerName, setPlayerName] = useState('Player')
  const [copied, setCopied] = useState(false)

  // Generate room ID for create mode
  const generatedId = roomId ?? nanoid(6).toUpperCase()

  const handleCreate = () => {
    const id = nanoid(6).toUpperCase()
    setRoomId(id)
    setMode('create')
  }

  const handleJoin = () => {
    const id = joinInput.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
    if (id.length < 4) return
    setRoomId(id)
    setMode('create')
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomId ?? '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleStart = () => {
    // For now, start as solo with online flag set
    setRoute('game')
  }

  return (
    <div className="lobby-page">
      <div className="lobby-bg-cards">
        {['🃏', '🎴', '🃏', '🎴'].map((c, i) => (
          <div key={i} className="lobby-bg-card" style={{ animationDelay: `${i * 0.5}s`, left: `${10 + i * 20}%` }}>
            {c}
          </div>
        ))}
      </div>

      <div className="lobby-container">
        <button className="lobby-back-btn" onClick={() => setRoute('mainmenu')}>← Back</button>
        <h1 className="lobby-title">Party Mode</h1>

        {mode === 'choose' && (
          <div className="party-choose">
            <p className="lobby-subtitle">Play with friends online</p>
            <div className="party-choose-btns">
              <button className="party-mode-btn" onClick={handleCreate}>
                <span className="party-mode-icon">🏠</span>
                <span className="party-mode-label">Create Room</span>
                <span className="party-mode-desc">Host a new game</span>
              </button>
              <button className="party-mode-btn" onClick={() => setMode('join')}>
                <span className="party-mode-icon">🚪</span>
                <span className="party-mode-label">Join Room</span>
                <span className="party-mode-desc">Enter a room code</span>
              </button>
            </div>

            <div className="party-setup">
              <label className="party-setup-label">Your Name</label>
              <input
                className="lobby-name-input"
                value={playerName}
                onChange={e => setPlayerName(e.target.value.slice(0, 16))}
                placeholder="Enter your name"
              />
              <label className="party-setup-label">Avatar</label>
              <div className="lobby-avatar-grid">
                {AVATARS.map(av => (
                  <button
                    key={av}
                    className={`lobby-avatar-btn ${avatar === av ? 'active' : ''}`}
                    onClick={() => setAvatar(av)}
                  >{av}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {mode === 'join' && (
          <div className="party-join">
            <p className="lobby-subtitle">Enter the room code from your host</p>
            <input
              className="party-code-input"
              value={joinInput}
              onChange={e => setJoinInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
              placeholder="ABC123"
              maxLength={6}
            />
            <div className="party-join-btns">
              <button className="lobby-start-btn" onClick={handleJoin} disabled={joinInput.length < 4}>
                Join →
              </button>
              <button className="btn-secondary" onClick={() => setMode('choose')}>Cancel</button>
            </div>
          </div>
        )}

        {mode === 'create' && roomId && (
          <div className="party-room">
            <div className="party-room-code-box">
              <span className="party-room-label">Room Code</span>
              <span className="party-room-code">{roomId}</span>
              <button className="party-copy-btn" onClick={handleCopyCode}>
                {copied ? '✅ Copied!' : '📋 Copy'}
              </button>
            </div>

            <div className="party-waiting">
              <div className="party-waiting-dot" />
              <span>Waiting for players to join…</span>
            </div>

            <div className="party-player-slots">
              {/* Simulated local slot */}
              <div className="party-player-slot party-player-slot--connected">
                <span>{avatar}</span>
                <span>{playerName} (You)</span>
                <span className="party-conn-dot party-conn-dot--green" />
              </div>
              {[...Array(3)].map((_, i) => (
                <div key={i} className="party-player-slot party-player-slot--empty">
                  <span className="party-empty-label">Empty Seat</span>
                  <span className="party-conn-dot" />
                </div>
              ))}
            </div>

            <div className="party-note">
              <span>⚠️ PartyKit server required for live multiplayer. Solo mode available now.</span>
            </div>

            <button id="party-start-btn" className="lobby-start-btn" onClick={handleStart}>
              🃏 Start as Solo
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
