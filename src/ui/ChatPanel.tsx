import { useState, useRef } from 'react'
import { useStore } from '../game/store'

const QUICK_REACTIONS = ['🔥', '😂', '😤', '👏', '🤯', '💀', '🎴', '🃏']

export function ChatPanel() {
  const showChat = useStore(s => s.ui.showChat)
  const chatMessages = useStore(s => s.ui.chatMessages)
  const addChatMessage = useStore(s => s.addChatMessage)
  const toggleChat = useStore(s => s.toggleChat)
  const localPlayerId = useStore(s => s.party.localPlayerId)
  const gameState = useStore(s => s.gameState)
  const [input, setInput] = useState('')

  const localPlayer = gameState?.players.find(p => p.id === localPlayerId)
  const playerName = localPlayer?.name ?? 'You'

  const send = () => {
    const text = input.trim().slice(0, 60)
    if (!text) return
    addChatMessage(localPlayerId, playerName, text)
    setInput('')
  }

  return (
    <>
      {/* Toggle button */}
      <button
        id="chat-toggle-btn"
        className="chat-toggle-btn"
        onClick={toggleChat}
        title="Toggle Chat"
      >
        💬
        {chatMessages.length > 0 && !showChat && (
          <span className="chat-badge">{Math.min(chatMessages.length, 9)}</span>
        )}
      </button>

      {/* Panel */}
      <div className={`chat-panel ${showChat ? 'chat-panel--open' : ''}`}>
        <div className="chat-header">
          <span>💬 Chat</span>
          <button className="chat-close" onClick={toggleChat}>×</button>
        </div>

        {/* Messages */}
        <div className="chat-messages">
          {chatMessages.slice(-8).map(msg => (
            <div key={msg.id} className={`chat-msg ${msg.playerId === localPlayerId ? 'chat-msg--self' : ''}`}>
              <span className="chat-msg-name">{msg.playerName}</span>
              <span className="chat-msg-text">{msg.text}</span>
            </div>
          ))}
        </div>

        {/* Quick reactions */}
        <div className="chat-reactions">
          {QUICK_REACTIONS.map(emoji => (
            <button
              key={emoji}
              className="chat-reaction-btn"
              onClick={() => addChatMessage(localPlayerId, playerName, emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="chat-input-row">
          <input
            className="chat-input"
            value={input}
            onChange={e => setInput(e.target.value.slice(0, 60))}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Say something..."
            maxLength={60}
          />
          <button className="chat-send-btn" onClick={send}>Send</button>
        </div>
      </div>
    </>
  )
}
