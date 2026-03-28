/**
 * roomManager.ts — Room creation, join, reconnect
 * Persists playerId in localStorage
 */

import { nanoid } from 'nanoid';

const PLAYER_ID_KEY = 'uno_player_id';
const PLAYER_NAME_KEY = 'uno_player_name';
const PLAYER_AVATAR_KEY = 'uno_player_avatar';

export function getOrCreatePlayerId(): string {
  let id = localStorage.getItem(PLAYER_ID_KEY);
  if (!id) {
    id = `p-${nanoid(10)}`;
    localStorage.setItem(PLAYER_ID_KEY, id);
  }
  return id;
}

export function getPlayerName(): string {
  return localStorage.getItem(PLAYER_NAME_KEY) ?? 'Player';
}

export function setPlayerName(name: string) {
  localStorage.setItem(PLAYER_NAME_KEY, name.slice(0, 20));
}

export function getPlayerAvatar(): string {
  return localStorage.getItem(PLAYER_AVATAR_KEY) ?? '🎮';
}

export function setPlayerAvatar(avatar: string) {
  localStorage.setItem(PLAYER_AVATAR_KEY, avatar);
}

export function createRoomId(): string {
  // 6-char uppercase alphanumeric (e.g. "XB4K2Z")
  return nanoid(6).toUpperCase();
}

export function formatRoomCode(raw: string): string {
  return raw.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 6);
}

export function buildJoinUrl(roomId: string): string {
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  return `${base}?room=${roomId}`;
}

export function getRoomIdFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get('room');
}
