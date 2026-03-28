/**
 * PartyLobby.tsx — Online multiplayer lobby
 */

import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { useUnoStore } from '../game/store';
import {
  createRoomId, getOrCreatePlayerId, getPlayerName, setPlayerName,
  getPlayerAvatar, setPlayerAvatar, buildJoinUrl, formatRoomCode, getRoomIdFromUrl,
} from '../party/roomManager';
import { usePartyRoom } from '../party/client';
import { sendMessage } from '../party/client';
import { HOUSE_RULE_LABELS } from '../game/houseRules';

const AVATARS = ['🎮', '🔥', '🤖', '👾', '🎯', '⚡', '💎', '🦊', '🐉', '🌟', '🎲', '🃏', '🦁', '🐺', '🌀', '🎪'];
const SEAT_COLORS = ['#DC143C', '#0047AB', '#FFBF00', '#50C878', '#8B00FF', '#FF007F', '#00FFFF'];
const QUICK_REACTIONS = ['🔥', '😂', '😤', '👏', '🤯', '💀'];

export function PartyLobby() {
  const { setScreen, roomInfo, chatMessages, sendChatMessage } = useUnoStore();

  const [mode, setMode] = useState<'landing' | 'create' | 'join' | 'waiting'>('landing');
  const [roomId, setRoomId] = useState('');
  const [joinInput, setJoinInput] = useState('');
  const [playerName, setPlayerNameLocal] = useState(getPlayerName());
  const [avatar, setAvatarLocal] = useState(getPlayerAvatar());
  const [showAvatars, setShowAvatars] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [copied, setCopied] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null!);

  const playerId = getOrCreatePlayerId();

  // Auto-join from URL
  useEffect(() => {
    const urlRoom = getRoomIdFromUrl();
    if (urlRoom) {
      setJoinInput(urlRoom);
      setMode('join');
    }
  }, []);

  const { isConnected, latency } = usePartyRoom(
    mode === 'waiting' || mode === 'create' ? roomId : null,
    mode === 'waiting' || mode === 'create' ? playerId : null,
    playerName, avatar
  );

  // Generate QR code
  useEffect(() => {
    if (roomId) {
      QRCode.toDataURL(buildJoinUrl(roomId), { width: 160, margin: 1, color: { dark: '#D4AF37', light: '#0A0A0F' } })
        .then(setQrDataUrl).catch(console.error);
    }
  }, [roomId]);

  // Scroll chat to bottom
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [chatMessages]);

  const handleCreate = () => {
    const id = createRoomId();
    setRoomId(id);
    setPlayerName(playerName);
    setPlayerAvatar(avatar);
    setMode('waiting');
  };

  const handleJoin = () => {
    const code = formatRoomCode(joinInput);
    if (code.length !== 6) return;
    setRoomId(code);
    setPlayerName(playerName);
    setPlayerAvatar(avatar);
    setMode('waiting');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(buildJoinUrl(roomId));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartGame = () => {
    sendMessage({ type: 'START_GAME', hostId: playerId });
  };

  const handleSendChat = () => {
    const text = chatInput.trim();
    if (!text) return;
    sendChatMessage(text);
    setChatInput('');
  };

  // ---- Render modes ----

  if (mode === 'waiting' && roomInfo) {
    return <WaitingRoom
      roomId={roomId}
      qrDataUrl={qrDataUrl}
      isHost={roomInfo.isHost}
      isConnected={isConnected}
      latency={latency}
      chatInput={chatInput}
      setChatInput={setChatInput}
      onSendChat={handleSendChat}
      onStartGame={handleStartGame}
      onBack={() => setMode('landing')}
      chatRef={chatRef}
      onReaction={(r: string) => sendChatMessage(r)}
      onCopy={handleCopy}
      copied={copied}
    />;
  }

  return (
    <div className="relative w-full h-full flex flex-col bg-casino-dark overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 glass-panel rounded-none border-x-0 border-t-0 px-6 py-4 flex items-center justify-between">
        <button className="text-casino-gold/60 hover:text-casino-gold transition-colors text-sm"
          onClick={() => mode === 'landing' ? setScreen('main-menu') : setMode('landing')}>
          ← Back
        </button>
        <div className="font-display text-casino-gold text-xl tracking-widest">PARTY MODE</div>
        <div className="w-16" />
      </div>

      <div className="flex-1 px-4 py-6 max-w-sm mx-auto w-full flex flex-col gap-6">
        {/* Player identity */}
        <div className="glass-panel p-4 flex items-center gap-4">
          <button className="avatar-emoji text-2xl w-12 h-12 flex-shrink-0" onClick={() => setShowAvatars(!showAvatars)}>
            {avatar}
          </button>
          <div className="flex-1">
            <div className="text-white/50 text-xs mb-1">Your Name</div>
            <input
              className="w-full bg-white/5 border border-casino-gold/20 rounded px-2 py-1 text-white text-sm outline-none focus:border-casino-gold/60"
              value={playerName}
              maxLength={16}
              onChange={(e) => setPlayerNameLocal(e.target.value)}
              placeholder="Player Name"
            />
          </div>
        </div>

        {showAvatars && (
          <div className="glass-panel p-3 grid grid-cols-8 gap-1 -mt-4 animate-scale-in">
            {AVATARS.map((av) => (
              <button key={av}
                className={`avatar-emoji text-lg w-8 h-8 ${avatar === av ? 'selected' : ''}`}
                onClick={() => { setAvatarLocal(av); setShowAvatars(false); }}>
                {av}
              </button>
            ))}
          </div>
        )}

        {mode === 'landing' && (
          <>
            <button id="btn-create-room" className="btn-gold w-full text-lg py-4 tracking-widest" onClick={handleCreate}>
              Create Room
            </button>
            <div className="text-center text-white/30 text-sm">or</div>
            <button id="btn-join-room" className="btn-ghost w-full text-lg py-4 tracking-widest" onClick={() => setMode('join')}>
              Join Room
            </button>
          </>
        )}

        {mode === 'join' && (
          <div className="flex flex-col gap-4">
            <div className="text-white/60 text-sm text-center">Enter Room Code</div>
            <input
              className="w-full bg-white/5 border border-casino-gold/30 rounded-lg px-4 py-3 text-center font-mono text-2xl text-casino-gold tracking-[0.4em] uppercase outline-none focus:border-casino-gold/80"
              placeholder="XXXXXX"
              value={joinInput}
              maxLength={6}
              onChange={(e) => setJoinInput(formatRoomCode(e.target.value))}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            />
            <button className="btn-gold w-full text-lg py-4" disabled={joinInput.length !== 6} onClick={handleJoin}>
              Join
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Waiting Room ----
function WaitingRoom({ roomId, qrDataUrl, isHost, isConnected, latency, chatInput, setChatInput,
  onSendChat, onStartGame, onBack, chatRef, onReaction, onCopy, copied }: any) {
  const { roomInfo, chatMessages } = useUnoStore();
  const players = roomInfo ? [] : []; // room players come from server via roomInfo

  return (
    <div className="w-full h-full flex flex-col bg-casino-dark overflow-hidden">
      {/* Header */}
      <div className="glass-panel rounded-none border-x-0 border-t-0 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <button className="text-casino-gold/60 hover:text-casino-gold text-sm" onClick={onBack}>← Leave</button>
        <div className="flex items-center gap-2">
          <div className={`connection-dot ${isConnected ? 'connected' : 'disconnected'}`} />
          <span className="font-display text-casino-gold text-sm tracking-widest">
            Room {roomId}
          </span>
          {isConnected && <span className="text-white/30 text-xs font-mono">{latency}ms</span>}
        </div>
        <div className="w-12" />
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Room info */}
        <div className="flex-1 flex flex-col gap-4 p-4 overflow-y-auto">
          {/* Room code + QR */}
          <div className="glass-panel p-4 flex flex-col items-center gap-3">
            <div className="room-code">{roomId}</div>
            <button
              className="btn-ghost text-sm px-4 py-2"
              onClick={onCopy}
            >
              {copied ? '✓ Copied!' : '📋 Copy Link'}
            </button>
            {qrDataUrl && (
              <img src={qrDataUrl} alt="Join QR Code" className="w-32 h-32 rounded-lg" />
            )}
          </div>

          {/* Player seats */}
          <div className="glass-panel p-3">
            <div className="text-casino-gold/60 text-xs font-mono uppercase tracking-widest mb-3">Players</div>
            <div className="flex flex-col gap-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                  <div className="w-2 h-2 rounded-full" style={{ background: SEAT_COLORS[i] }} />
                  <span className="text-white/30 text-sm font-mono">Seat {i + 1}</span>
                  <span className="text-white/20 text-xs">—</span>
                  <span className="text-white/25 text-xs">Waiting…</span>
                </div>
              ))}
            </div>
          </div>

          {/* Host controls */}
          {isHost ? (
            <button id="btn-start-party-game" className="btn-gold w-full py-4 text-lg tracking-widest" onClick={onStartGame}>
              Start Game
            </button>
          ) : (
            <div className="glass-panel p-4 text-center">
              <div className="text-white/40 text-sm">
                <span className="inline-block animate-pulse">●</span>
                {' '}Waiting for host to start…
              </div>
            </div>
          )}
        </div>

        {/* Right: Chat */}
        <div className="w-52 flex flex-col glass-panel-light border-l border-casino-gold/10 rounded-none">
          <div className="px-3 py-2 border-b border-casino-gold/10 text-casino-gold/50 text-xs uppercase tracking-widest flex-shrink-0">
            Chat
          </div>

          <div ref={chatRef} className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
            {chatMessages.map((msg) => (
              <div key={msg.id} className="text-xs">
                <span className="text-casino-gold/60 font-medium">{msg.playerName}: </span>
                <span className="text-white/70">{msg.text}</span>
              </div>
            ))}
          </div>

          {/* Quick reactions */}
          <div className="flex gap-1 p-2 border-t border-casino-gold/10 flex-shrink-0">
            {QUICK_REACTIONS.map((r) => (
              <button key={r} className="text-lg hover:scale-125 transition-transform" onClick={() => onReaction(r)}>
                {r}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="p-2 border-t border-casino-gold/10 flex gap-1 flex-shrink-0">
            <input
              className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white outline-none focus:border-casino-gold/40 min-w-0"
              placeholder="Message…"
              maxLength={60}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSendChat()}
            />
            <button className="text-casino-gold/60 hover:text-casino-gold text-sm flex-shrink-0" onClick={onSendChat}>
              ➤
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
