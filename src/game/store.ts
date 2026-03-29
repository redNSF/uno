import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { GameState, Card, Player, GameEvent } from './logic'
import { createInitialGameState, playCard, drawCards, resolveDrawStack, getTopCard, getValidPlays } from './logic'
import type { HouseRules } from './houseRules'
import { DEFAULT_HOUSE_RULES } from './houseRules'
import { aiDecide } from './ai'
import type { CardColor, AiLevel, Route } from '../utils/constants'
import { TIMING, GAME_LIMITS } from '../utils/constants'
import { nanoid } from 'nanoid'

// ─── UI Slice ─────────────────────────────────────────────────────────────
interface ToastItem {
  id: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
}

interface UiState {
  route: Route
  toasts: ToastItem[]
  showColorPicker: boolean
  colorPickerResolve: ((color: CardColor) => void) | null
  showChat: boolean
  chatMessages: { id: string; playerId: string; playerName: string; text: string; ts: number }[]
  spectatorMode: boolean
  unoButtonVisible: boolean
  unoButtonPlayerId: string | null
}

// ─── Animation Slice ──────────────────────────────────────────────────────
interface AnimState {
  isDealing: boolean
  animQueue: { type: string; payload: Record<string, unknown> }[]
  hoveredCardId: string | null
  selectedCardId: string | null
}

// ─── Party Slice ──────────────────────────────────────────────────────────
interface PartyState {
  roomId: string | null
  localPlayerId: string
  isOnline: boolean
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error'
}

// ─── Full Store ────────────────────────────────────────────────────────────
interface UnoStore {
  // Game
  gameState: GameState | null
  houseRules: HouseRules
  events: GameEvent[]

  // UI
  ui: UiState

  // Animations
  anim: AnimState

  // Party
  party: PartyState

  // Actions
  initGame: (playerConfigs: { name: string; isHuman: boolean; aiLevel?: AiLevel; avatar: string }[]) => void
  playCardAction: (cardId: string, pickedColor?: CardColor) => Promise<void>
  drawCardAction: () => Promise<void>
  callUno: (playerId: string) => void
  selectColor: (color: CardColor) => void
  resetGame: () => void

  setRoute: (route: Route) => void
  setHouseRules: (rules: Partial<HouseRules>) => void
  addToast: (message: string, type?: ToastItem['type']) => void
  removeToast: (id: string) => void
  toggleChat: () => void
  addChatMessage: (playerId: string, playerName: string, text: string) => void

  setHoveredCard: (id: string | null) => void
  setSelectedCard: (id: string | null) => void

  setRoomId: (id: string | null) => void
  setConnectionStatus: (status: PartyState['connectionStatus']) => void
}

// ─── AI Turn Runner ────────────────────────────────────────────────────────
let _aiTimer: ReturnType<typeof setTimeout> | null = null

function scheduleAiTurn(store: () => UnoStore) {
  if (_aiTimer) clearTimeout(_aiTimer)
  const delay = TIMING.AI_THINK_MIN_MS + Math.random() * (TIMING.AI_THINK_MAX_MS - TIMING.AI_THINK_MIN_MS)
  _aiTimer = setTimeout(() => {
    const s = store()
    const gs = s.gameState
    if (!gs || gs.phase !== 'playing') return
    const player = gs.players[gs.currentPlayerIndex]
    if (player.isHuman) return

    const level = player.aiLevel ?? 'medium'
    const decision = aiDecide(gs, gs.currentPlayerIndex, level, s.houseRules.stackDrawCards)

    if (decision.action === 'draw') {
      s.drawCardAction()
    } else if (decision.card) {
      s.playCardAction(decision.card.id, decision.pickedColor)
    }
  }, delay)
}

// ─── Store Creation ────────────────────────────────────────────────────────
export const useStore = create<UnoStore>()(
  subscribeWithSelector((set, get) => ({
    gameState: null,
    houseRules: DEFAULT_HOUSE_RULES,
    events: [],

    ui: {
      route: 'mainmenu',
      toasts: [],
      showColorPicker: false,
      colorPickerResolve: null,
      showChat: false,
      chatMessages: [],
      spectatorMode: false,
      unoButtonVisible: false,
      unoButtonPlayerId: null,
    },

    anim: {
      isDealing: false,
      animQueue: [],
      hoveredCardId: null,
      selectedCardId: null,
    },

    party: {
      roomId: null,
      localPlayerId: localStorage.getItem('uno_player_id') ?? nanoid(),
      isOnline: false,
      connectionStatus: 'disconnected',
    },

    // ── Init Game ──────────────────────────────────────────────────────────
    initGame: (playerConfigs) => {
      const players = playerConfigs.map((cfg, i) => ({
        id: i === 0 ? get().party.localPlayerId : nanoid(),
        name: cfg.name,
        isHuman: cfg.isHuman,
        aiLevel: cfg.aiLevel,
        seatIndex: i,
        score: 0,
        isConnected: true,
        avatar: cfg.avatar,
      }))
      const gs = createInitialGameState(players)
      set({
        gameState: { ...gs, phase: 'dealing' },
        events: [],
        anim: { ...get().anim, isDealing: true },
      })
      // After deal animation
      setTimeout(() => {
        set(s => ({
          gameState: s.gameState ? { ...s.gameState, phase: 'playing' } : null,
          anim: { ...s.anim, isDealing: false },
        }))
        const gs2 = get().gameState
        if (gs2 && !gs2.players[gs2.currentPlayerIndex].isHuman) {
          scheduleAiTurn(get)
        }
      }, TIMING.DEAL_STAGGER_MS * 7 * playerConfigs.length + 1500)
    },

    // ── Play Card ──────────────────────────────────────────────────────────
    playCardAction: async (cardId, pickedColor) => {
      const gs = get().gameState
      if (!gs || gs.phase !== 'playing') return
      const idx = gs.currentPlayerIndex
      const card = gs.players[idx].hand.find(c => c.id === cardId)
      if (!card) return

      // If wild and no color picked, show color picker
      let resolvedColor = pickedColor
      if ((card.value === 'wild' || card.value === 'wild4') && !pickedColor) {
        resolvedColor = await new Promise<CardColor>(resolve => {
          set(s => ({ ui: { ...s.ui, showColorPicker: true, colorPickerResolve: resolve } }))
        })
      }

      const { newState, events } = playCard(gs, idx, card, resolvedColor)

      // Handle draw stack auto-resolution for next player if needed
      let finalState = newState
      if (newState.drawStack > 0 && newState.phase === 'playing') {
        const nextPlayer = newState.players[newState.currentPlayerIndex]
        if (!nextPlayer.isHuman) {
          // AI: check if can stack
          if (!get().houseRules.stackDrawCards) {
            const resolved = resolveDrawStack(newState)
            finalState = resolved.newState
            events.push(...resolved.events)
          }
        }
      }

      set(s => ({
        gameState: finalState,
        events: [...s.events, ...events],
        anim: { ...s.anim, selectedCardId: null, hoveredCardId: null },
      }))

      // Toast events
      for (const e of events) {
        if (e.type === 'UNO') {
          const name = gs.players.find(p => p.id === e.playerId)?.name
          get().addToast(`${name} has UNO! 🔥`, 'warning')
          set(s => ({ ui: { ...s.ui, unoButtonVisible: true, unoButtonPlayerId: e.playerId } }))
          setTimeout(() => set(s => ({ ui: { ...s.ui, unoButtonVisible: false, unoButtonPlayerId: null } })), TIMING.UNO_CALL_WINDOW_MS)
        }
        if (e.type === 'ROUND_END') {
          const name = gs.players.find(p => p.id === e.winnerId)?.name
          get().addToast(`${name} wins the round! +${e.score} pts 🏆`, 'success')
        }
      }

      // Schedule AI if applicable
      const next = finalState.players[finalState.currentPlayerIndex]
      if (finalState.phase === 'playing' && !next.isHuman) {
        scheduleAiTurn(get)
      }
    },

    // ── Draw Card ──────────────────────────────────────────────────────────
    drawCardAction: async () => {
      const gs = get().gameState
      if (!gs || gs.phase !== 'playing') return
      const idx = gs.currentPlayerIndex

      // Draw stack resolution
      if (gs.drawStack > 0) {
        const { newState, events } = resolveDrawStack(gs)
        set(s => ({ gameState: newState, events: [...s.events, ...events] }))
        const next = newState.players[newState.currentPlayerIndex]
        if (!next.isHuman) scheduleAiTurn(get)
        return
      }

      const { newState, drawn } = drawCards(gs, idx, 1)
      let finalState = newState

      // Auto-play if house rule enabled
      const drew = drawn[0]
      if (drew && get().houseRules.autoPlayDrawn) {
        const topCard = getTopCard(newState)
        const valid = getValidPlays([drew], topCard, newState.activeColor, newState.drawStack, get().houseRules.stackDrawCards)
        if (valid.length > 0) {
          const { newState: played, events } = playCard(newState, idx, drew)
          finalState = played
          set(s => ({ gameState: finalState, events: [...s.events, ...events] }))
          const next = finalState.players[finalState.currentPlayerIndex]
          if (finalState.phase === 'playing' && !next.isHuman) scheduleAiTurn(get)
          return
        }
      }

      // Just advance turn after drawing
      finalState = {
        ...newState,
        currentPlayerIndex: newState.players[newState.currentPlayerIndex].isHuman
          ? (newState.currentPlayerIndex + newState.direction + newState.players.length) % newState.players.length
          : newState.currentPlayerIndex,
      }

      // Only advance turn for human draw (AI turn advances via AI logic)
      const player = gs.players[idx]
      if (player.isHuman) {
        finalState = {
          ...newState,
          currentPlayerIndex: ((idx + gs.direction) % gs.players.length + gs.players.length) % gs.players.length,
          turnStartedAt: Date.now(),
        }
      }

      set(s => ({ gameState: finalState }))
      const next = finalState.players[finalState.currentPlayerIndex]
      if (!next.isHuman) scheduleAiTurn(get)
    },

    // ── Call UNO ──────────────────────────────────────────────────────────
    callUno: (playerId) => {
      set(s => {
        if (!s.gameState) return {}
        const players = s.gameState.players.map(p =>
          p.id === playerId ? { ...p, calledUno: true } : p
        )
        return { gameState: { ...s.gameState, players } }
      })
      get().addToast('UNO! 🎴', 'warning')
    },

    // ── Select Color ───────────────────────────────────────────────────────
    selectColor: (color) => {
      const resolve = get().ui.colorPickerResolve
      if (resolve) resolve(color)
      set(s => ({ ui: { ...s.ui, showColorPicker: false, colorPickerResolve: null } }))
    },

    // ── Reset ──────────────────────────────────────────────────────────────
    resetGame: () => {
      if (_aiTimer) clearTimeout(_aiTimer)
      set({ gameState: null, events: [] })
    },

    // ── UI Actions ─────────────────────────────────────────────────────────
    setRoute: (route) => set(s => ({ ui: { ...s.ui, route } })),

    setHouseRules: (rules) => set(s => ({
      houseRules: { ...s.houseRules, ...rules }
    })),

    addToast: (message, type = 'info') => {
      const id = nanoid()
      set(s => ({ ui: { ...s.ui, toasts: [...s.ui.toasts, { id, message, type }] } }))
      setTimeout(() => get().removeToast(id), TIMING.TOAST_DURATION_MS)
    },

    removeToast: (id) => {
      set(s => ({ ui: { ...s.ui, toasts: s.ui.toasts.filter(t => t.id !== id) } }))
    },

    toggleChat: () => set(s => ({ ui: { ...s.ui, showChat: !s.ui.showChat } })),

    addChatMessage: (playerId, playerName, text) => {
      const id = nanoid()
      const msg = { id, playerId, playerName, text, ts: Date.now() }
      set(s => ({
        ui: {
          ...s.ui,
          chatMessages: [...s.ui.chatMessages.slice(-GAME_LIMITS.MAX_CHAT_MESSAGES + 1), msg],
        }
      }))
    },

    // ── Anim Actions ───────────────────────────────────────────────────────
    setHoveredCard: (id) => set(s => ({ anim: { ...s.anim, hoveredCardId: id } })),
    setSelectedCard: (id) => set(s => ({ anim: { ...s.anim, selectedCardId: id } })),

    // ── Party Actions ──────────────────────────────────────────────────────
    setRoomId: (id) => set(s => ({ party: { ...s.party, roomId: id } })),
    setConnectionStatus: (status) => set(s => ({ party: { ...s.party, connectionStatus: status } })),
  }))
)

// Persist player ID
useStore.subscribe(
  s => s.party.localPlayerId,
  id => localStorage.setItem('uno_player_id', id)
)
