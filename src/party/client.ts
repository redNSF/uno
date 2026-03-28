/**
 * client.ts — PartyKit Client Wrapper + React Hooks
 */

import PartySocket from 'partysocket';
import { useEffect, useRef, useState, useCallback } from 'react';
import { ClientMessage, ServerMessage } from '../../party/messages';
import { useUnoStore } from '../game/store';

const PARTYKIT_HOST = import.meta.env.VITE_PARTYKIT_HOST ?? 'localhost:1999';

// ---- Low-level socket manager ----

let _socket: PartySocket | null = null;

export function connectToRoom(roomId: string, playerId: string): PartySocket {
  if (_socket) {
    _socket.close();
  }
  _socket = new PartySocket({
    host: PARTYKIT_HOST,
    room: roomId,
    id: playerId,
  });
  return _socket;
}

export function disconnectFromRoom() {
  _socket?.close();
  _socket = null;
}

export function sendMessage(msg: ClientMessage) {
  _socket?.send(JSON.stringify(msg));
}

// ---- React Hooks ----

export function usePartyRoom(roomId: string | null, playerId: string | null, playerName: string, avatar: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [latency, setLatency] = useState(0);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pingTimestampRef = useRef<number>(0);

  const { setRoomInfo, addChatMessage, game } = useUnoStore();

  useEffect(() => {
    if (!roomId || !playerId) return;

    const socket = connectToRoom(roomId, playerId);

    socket.addEventListener('open', () => {
      setIsConnected(true);
      // Send join message
      sendMessage({ type: 'JOIN_ROOM', playerId, playerName, avatar });
      setRoomInfo({ roomId, playerId, playerName, isHost: false, isConnected: true, latency: 0 });

      // Start ping
      pingIntervalRef.current = setInterval(() => {
        pingTimestampRef.current = Date.now();
        sendMessage({ type: 'PING', timestamp: pingTimestampRef.current });
      }, 5000);
    });

    socket.addEventListener('close', () => {
      setIsConnected(false);
      setRoomInfo(null);
    });

    socket.addEventListener('message', (event: MessageEvent) => {
      const msg: ServerMessage = JSON.parse(event.data as string);
      handleServerMessage(msg, playerId, setLatency, pingTimestampRef);
    });

    return () => {
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      disconnectFromRoom();
      setIsConnected(false);
      setRoomInfo(null);
    };
  }, [roomId, playerId]);

  const send = useCallback((msg: ClientMessage) => sendMessage(msg), []);

  return { isConnected, latency, send };
}

function handleServerMessage(
  msg: ServerMessage,
  myPlayerId: string,
  setLatency: (v: number) => void,
  pingRef: React.MutableRefObject<number>
) {
  const store = useUnoStore.getState();

  switch (msg.type) {
    case 'PONG':
      setLatency(Date.now() - pingRef.current);
      break;

    case 'ROOM_STATE':
      store.setRoomInfo({
        roomId: msg.roomId,
        playerId: myPlayerId,
        playerName: store.roomInfo?.playerName ?? '',
        isHost: msg.hostId === myPlayerId,
        isConnected: true,
        latency: 0,
      });
      break;

    case 'GAME_STATE':
      // Merge received state with ours (server authoritative)
      // In solo mode we don't use this, in party mode the full state arrives here
      break;

    case 'YOUR_HAND':
      // Update our hand from server
      if (msg.playerId === myPlayerId && store.game) {
        // Could update hand from server – in party mode server is authoritative
      }
      break;

    case 'CHAT_MSG':
      store.addChatMessage({
        playerId: msg.playerId,
        playerName: msg.playerName,
        text: msg.text,
      });
      break;

    case 'GAME_EVENT':
      // Trigger animations for received events
      const action = msg.action;
      break;

    case 'ERROR':
      store.showToast(msg.message, 'error');
      break;
  }
}

export function useSendMessage() {
  return useCallback((msg: ClientMessage) => sendMessage(msg), []);
}
