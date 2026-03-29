import { useStore } from '../game/store'

export function SpectatorMode() {
  const gameState = useStore(s => s.gameState)
  const ui = useStore(s => s.ui)

  if (!ui.spectatorMode || !gameState) return null

  return (
    <div className="spectator-banner">
      <span className="spectator-icon">👁️</span>
      <span className="spectator-text">Spectating — Waiting for next game</span>
      <div className="spectator-pulse" />
    </div>
  )
}
