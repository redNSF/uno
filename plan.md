Build a cinematic, browser-based UNO card game that feels like it was
rendered in Unreal Engine 5. Supports 2–7 players: any mix of human
and AI. Quality bar: think AAA game studio, not web app.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TECH STACK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Vite + TypeScript
- Three.js (r160+)
- @react-three/fiber + @react-three/drei
- @react-three/postprocessing
- GSAP + @gsap/react
- Zustand
- Tailwind CSS
- Cannon-es (win sequence physics)
- Howler.js (spatial audio)
- PartyKit (WebSocket multiplayer server — partykit.io)
- nanoid (room ID generation)
- Leva (dev tuning panel)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PARTY SYSTEM OVERVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The game supports two modes — Solo and Party — selectable from
the main menu.

SOLO MODE:
1 human vs up to 6 AI opponents (2–7 players total)
All game logic runs client-side
AI difficulty: Easy / Medium / Hard per bot slot

PARTY MODE (online multiplayer):
2–7 human players in a shared room
Any unfilled slots are filled with AI bots
Host controls game settings and starts the match
Each player sees only their own hand (face-up),
all other hands are face-down
Uses PartyKit for real-time WebSocket sync

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MAIN MENU & LOBBY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Main Menu (full 3D scene as background — table with cards slowly
shuffling in idle loop):

[ SOLO PLAY ]
→ Opens solo lobby
→ Player selects 2–7 total players
→ Each non-human slot shows: [Human / Bot Easy / Bot Medium / Bot Hard]
→ Player names editable (click to rename)
→ Avatar picker: 8 emoji avatars per player
→ Click START GAME

[ PARTY ]
→ Two sub-options:
[ CREATE ROOM ] [ JOIN ROOM ]

CREATE ROOM flow:

- Generate a 6-character alphanumeric room code (nanoid)
- Host sees a lobby screen:
  - Room code displayed large with a copy button + QR code
  - Share link: uno.yourdomain.com/room/XXXXXX
  - Player list: host slot fills immediately, others show
    "Waiting…" with a pulsing dot
  - Each empty slot has a toggle: [Reserve for Human / Fill with Bot]
  - Game settings panel:
    Player count: 2–7
    AI difficulty (for bot slots): Easy / Medium / Hard
    House rules toggles:
    ✦ Stack Draw cards (Draw 2 chains)
    ✦ Jump-In (play identical card out of turn)
    ✦ Seven-Zero swap hands
    ✦ No-Mercy mode (Wild +4 always playable)
    ✦ Progressive UNO penalty
  - [ START GAME ] button (host only, enabled when ≥2 players joined)
  - Room auto-closes after 30 min of inactivity

JOIN ROOM flow:

- Input field for 6-character room code (auto-uppercase, auto-dash)
- OR scan QR code (mobile)
- OR click a shared link
- Player enters their name + picks an avatar
- Joins lobby and sees the same waiting room
- Can chat in lobby (simple text, emoji reactions only)
- Non-host players see a "Waiting for host to start…" state

Lobby UI design:

- Full dark casino aesthetic, gold accents
- Player slots rendered as physical seat cards around a
  mini table preview
- Connected players appear with a green dot + their avatar
- Disconnected players ghost out with a red dot
- Smooth slot-fill animation when someone joins

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MULTIPLAYER ARCHITECTURE (PartyKit)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Server (party/server.ts):
PartyKit server handles one room per game session.

State stored on server: - roomId, hostId - players[]: { id, name, avatar, isBot, isConnected, handSize } - gameState: full authoritative game state
(deck, discard, hands, currentPlayer, direction,
currentColor, drawStack, phase, settings) - chat: last 50 messages

Message types (client → server):
JOIN_ROOM { name, avatar }
LEAVE_ROOM {}
START_GAME {} (host only)
PLAY_CARD { cardId }
DRAW_CARD {}
PICK_COLOR { color }
CALL_UNO {}
JUMP_IN { cardId } (if house rule enabled)
CHAT_MSG { text }
KICK_PLAYER { playerId } (host only)

Message types (server → client):
ROOM_STATE { players, settings, phase }
GAME_STATE { publicState } — everything except other players' hands
YOUR_HAND { cards } — private, sent only to that player
PLAYER_JOINED { player }
PLAYER_LEFT { playerId }
GAME_EVENT { type, payload } — triggers animations client-side
CHAT_MSG { playerId, text, timestamp }
ERROR { code, message }

Authority model: - Server owns all game state — clients NEVER modify game state directly - Client sends intent (PLAY_CARD), server validates and broadcasts result - If validation fails, server sends ERROR back to that client only - AI bot turns are computed server-side to prevent desync - On reconnect: server replays current game state to rejoining client

Reconnection: - Player has 60 seconds to reconnect before their slot becomes a bot - Their hand is preserved during disconnection window - On rejoin: full state sync, animation fast-forward to current state - Rejoin using same playerId stored in localStorage

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
7-PLAYER TABLE LAYOUT (3D)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The 3D table scales dynamically based on player count.

Player seat positions (evenly distributed around oval table):

2 players: bottom, top
3 players: bottom, top-left, top-right
4 players: bottom, top, left, right
5 players: bottom, top-left, top-right, left, right
6 players: bottom, top, top-left, top-right, left, right
7 players: bottom + 6 evenly around the oval

Human player is always at the bottom (near camera).

Each seat has:

- A physical 3D nameplate (RoundedBoxGeometry, engraved text)
- Avatar rendered as a small circular texture above the nameplate
- Card hand fan positioned at that seat's angle
- A glowing ring under the seat when it's that player's turn
- Card count holographic badge floating above their hand

Camera adjustment by player count:

- More players → camera pulls back + raises angle slightly
- Smooth lerp transition when players join/leave lobby

Hand layout by seat angle:

- Bottom (human): standard curved fan, face-up, interactive
- All others: fan arc rotated to face toward table center, face-down
- The fan arc radius stays constant; spacing between cards compresses
  as hand grows beyond 10 cards

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3D SCENE SETUP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Camera:

- Perspective, FOV 45, angled 55° downward
- Subtle idle float (sin wave, very slow)
- On card hover: gentle dolly-in toward hovered card
- On special card play: dramatic push-in + shake (GSAP timeline)
- On 7-player layout: auto pull-back to fit all seats

Lighting:

- Ambient warm white, low intensity
- RectAreaLight above table center, golden tone
- Per-player colored point lights at each seat position —
  each player gets assigned a signature color from a palette
  (not just the 4 card colors; use: crimson, cobalt, amber,
  emerald, violet, rose, cyan)
- Active player's seat light brightens and pulses
- Rim light: cool blue from behind camera
- All lights cast soft shadows

Table:

- Oval felt surface (larger to accommodate 7 seats)
- Custom GLSL shader: microfiber noise, anisotropic sheen,
  dark green, gold trim, UNO watermark
- Dynamically scales table oval based on player count
- Physical chair meshes visible at each seat (low poly,
  dark wood + leather PBR)

Environment:

- HDR night casino environment
- Vignette, god rays from overhead light
- Dust particles floating in light beams

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CARD GEOMETRY & MATERIAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- RoundedBoxGeometry with real 3D thickness
- Front: CanvasTexture at 512×768, renders color/symbol/corners
- Holographic foil on wild cards: iridescent shimmer via
  fresnel + animated UV offset in ShaderMaterial
- Card back: guilloche pattern, deep red/navy, gold UNO
- GGX specular, subtle paper normal map, clearcoat on specials
- Flip animation: Y-axis 180°, material swap at 90° midpoint

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CARD ANIMATIONS (GSAP)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Deal: bezier arc from deck to each seat, staggered 80ms,
card flips face-up for human only, elastic land
Play: lift → arc to discard → spin → thud + camera shake
Special card shockwave ring on discard pile
Wild: prismatic light burst from 8 SpotLights
Draw: snap from deck → arc to hand → flip if human
Skip: 3D ⊘ symbol above targeted seat, spin + dissolve
Reverse: point lights rotate positions around table
Draw2: two ghost cards arc to target
Wild+4: full screen color shift + 4 explosive arcs
UNO call: particle cannon from seat + screen chromatic glitch
Win: physics cards fly, 300-piece confetti, bloom flood

Jump-In (house rule):
When a player plays out of turn, their card animates from
off-screen with a "JUMP IN!" text burst, camera whip-pans
to their seat

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
POST-PROCESSING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Always on: Bloom, Vignette, ChromaticAberration (subtle), SMAA
On events: DepthOfField (color picker), Noise/Scanlines (wild play),
ColorDepth desaturate (someone else wins), ToneMapping AgX

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AUDIO (Howler.js)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

All sfx positional 3D, sourced from the playing seat.
Tracks: card_deal, card_play, card_draw, shuffle, skip, reverse,
draw2, wild, wild4, uno_call, jump_in, win, lose, player_join,
player_leave, chat_ping.
Background: casino ambiance loop.
Master volume + sfx/music split in settings.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HUD / 2D OVERLAY (Tailwind + drei Html)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- World-anchored player badges (drei Html) at each seat
- Active player badge: glowing animated border
- Current color orb: center table, bloom-lit, morphs on change
- Draw pile count + draw stack badge
- UNO button: bottom right, red/orange, bounce idle,
  2-second call window with countdown ring
- Turn timer: arc progress bar around active player badge (15s),
  auto-draws on expire — in party mode skip auto-draw, just auto-pass
- Toast notifications: slide-in, backdrop blur
- Color picker: full-screen modal, 4 large color orbs with ripple
- Chat panel (party mode only):
  - Slide-in from right edge, toggleable
  - Shows last 8 messages
  - Emoji-only quick reactions: 🔥 😂 😤 👏 🤯 💀
  - Full text input (max 60 chars)
  - Chat pings are positional audio from that player's seat
- Win/lose overlay with full 3D scene continuing behind
- Settings panel: AI difficulty, house rules, audio, graphics quality

Spectator mode:
If a player is eliminated (house rule variant) or joins a
running game, they enter spectator mode:

- Camera freely orbits the table (drag to rotate)
- Can see all hands with a toggle
- Chat remains active
- "Waiting for next game" indicator

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GAME LOGIC
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Full UNO rules for 2–7 players:

- 108-card standard deck
- Draw stacking (toggleable house rule)
- Reverse = Skip in 2-player mode
- First card special effects
- UNO 2-second call window + penalty
- Auto-draw on no playable card, play if possible, else pass

House rules (all toggleable):
✦ Stack Draw Cards
✦ Jump-In (play identical card out of turn)
✦ Seven-Zero (7 = swap hands with chosen player,
0 = rotate all hands in direction)
✦ No-Mercy Wild +4 (always playable, no challenge)
✦ Challenge Wild +4 (target can challenge; if bluff,
challenger draws 0, bluffer draws 4)
✦ Progressive UNO (+2 penalty stacks if someone catches
you before your next turn)

AI engine:
Easy: random valid card
Medium: prefer matching color, save wilds, use specials
against leader
Hard: card counting, threat assessment per player,
optimal hand compression, withholds Wild+4 for
game-winning moments, exploits draw stacking chains

Zustand store (client):
gameSlice: publicGameState (from server), myHand (private)
partySlice: roomId, players, isHost, connectionStatus
uiSlice: toasts, modals, selectedCard, chatOpen
animSlice: animation queue, isAnimating

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FILE STRUCTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

src/
├── main.tsx
├── App.tsx
├── game/
│ ├── logic.ts — pure rules engine, deck, validation
│ ├── ai.ts — 3-tier AI decision engine
│ ├── houseRules.ts — pluggable rule modifiers
│ └── store.ts — Zustand slices
├── party/
│ ├── server.ts — PartyKit server (runs on edge)
│ ├── client.ts — PartyKit client wrapper + hooks
│ ├── messages.ts — shared message type definitions
│ └── roomManager.ts — room creation, join, reconnect logic
├── three/
│ ├── Scene.tsx — R3F Canvas, camera, environment
│ ├── Table.tsx — Oval felt table, scales to player count
│ ├── Seat.tsx — Per-seat: nameplate, chair, ring
│ ├── Card.tsx — 3D card mesh + materials
│ ├── CardHand.tsx — Fan layout rotated per seat angle
│ ├── DiscardPile.tsx
│ ├── DrawPile.tsx
│ ├── Particles.tsx — Reusable particle system
│ ├── Lighting.tsx — Dynamic per-seat point lights
│ └── PostFX.tsx
├── shaders/
│ ├── felt.vert.glsl / felt.frag.glsl
│ ├── card.frag.glsl — holographic foil
│ └── particles.frag.glsl
├── animations/
│ ├── dealAnimation.ts
│ ├── playAnimation.ts
│ ├── drawAnimation.ts
│ ├── specialFX.ts — skip/reverse/draw2/wild/wild4 FX
│ ├── jumpInAnimation.ts
│ └── winAnimation.ts
├── ui/
│ ├── MainMenu.tsx
│ ├── SoloLobby.tsx
│ ├── PartyLobby.tsx — create/join lobby UI
│ ├── HUD.tsx
│ ├── ColorPicker.tsx
│ ├── ChatPanel.tsx
│ ├── Toast.tsx
│ ├── UnoButton.tsx
│ ├── TurnTimer.tsx
│ ├── SpectatorMode.tsx
│ └── WinScreen.tsx
├── audio/
│ └── AudioManager.ts
├── textures/
│ └── CardTextureGenerator.ts
└── utils/
├── math.ts — bezier, lerp, seat position calculator
├── seatLayout.ts — computes 3D seat positions for N players
└── constants.ts

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUALITY REQUIREMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- 60fps target — instanced meshes, LOD, animation queue
- No teleporting cards — every transition animated
- TypeScript strict mode, no `any`
- Animations never block game logic
- Mobile-responsive: pinch-zoom hand, tap to play, chat collapses
- Party mode latency: optimistic UI for own actions,
  rollback on server rejection
- Graceful degradation: if WebSocket drops, show reconnect overlay
  with live countdown; game pauses for that player
- Build output: single deployable dist/ + party/server.ts
  deployable to PartyKit cloud with `npx partykit deploy`

Build order:

1. Game logic + Zustand (pure, fully tested)
2. PartyKit server + message protocol
3. Solo lobby + room lobby UI
4. Basic Three.js scene + dynamic seat layout
5. Card geometry + texture generator
6. Hand layout + hover + play interactions
7. Core animations (deal, play, draw)
8. AI engine (3 tiers)
9. Special card FX + post-processing
10. Chat + party UI polish
11. Audio integration
12. Win sequence + loading screen + final polish
