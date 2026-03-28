/**
 * App.tsx — Root component with screen routing
 */

import React, { useEffect } from 'react';
import { useUnoStore } from './game/store';
import { MainMenu } from './ui/MainMenu';
import { SoloLobby } from './ui/SoloLobby';
import { PartyLobby } from './ui/PartyLobby';
import { Scene } from './three/Scene';
import { HUD } from './ui/HUD';
import { ChatPanel } from './ui/ChatPanel';
import { AudioManager } from './audio/AudioManager';
import { getRoomIdFromUrl } from './party/roomManager';

export default function App() {
  const screen = useUnoStore((s) => s.screen);
  const setScreen = useUnoStore((s) => s.setScreen);
  const roomInfo = useUnoStore((s) => s.roomInfo);
  const [chatOpen, setChatOpen] = React.useState(false);

  // Check URL for room join
  useEffect(() => {
    const roomId = getRoomIdFromUrl();
    if (roomId) setScreen('party-lobby');
  }, []);

  // Resume audio context on first interaction
  useEffect(() => {
    const handleInteraction = () => {
      AudioManager.resume();
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
    document.addEventListener('click', handleInteraction);
    document.addEventListener('keydown', handleInteraction);
    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  return (
    <div className="w-full h-full relative overflow-hidden bg-casino-dark">
      {/* Main Menu */}
      {screen === 'main-menu' && <MainMenu />}

      {/* Solo Lobby */}
      {screen === 'solo-lobby' && <SoloLobby />}

      {/* Party Lobby */}
      {screen === 'party-lobby' && <PartyLobby />}

      {/* Game Screen */}
      {screen === 'game' && (
        <>
          {/* 3D Scene fills the screen */}
          <div className="absolute inset-0">
            <Scene />
          </div>

          {/* HUD overlay */}
          <HUD />

          {/* Party chat toggle */}
          {roomInfo && (
            <button
              id="btn-chat-toggle"
              className="absolute bottom-6 right-6 z-20 glass-panel w-10 h-10 flex items-center justify-center text-casino-gold/60 hover:text-casino-gold transition-colors"
              onClick={() => setChatOpen((o) => !o)}
              title="Toggle chat"
              aria-label="Toggle chat panel"
            >
              💬
            </button>
          )}

          {/* Chat panel */}
          {roomInfo && (
            <ChatPanel isOpen={chatOpen} onClose={() => setChatOpen(false)} />
          )}
        </>
      )}
    </div>
  );
}
