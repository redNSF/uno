import { useStore } from '../game/store'
import { SEAT_COLORS } from '../utils/constants'

export function WinScreen() {
  const gameState = useStore(s => s.gameState)
  const setRoute = useStore(s => s.setRoute)
  const resetGame = useStore(s => s.resetGame)
  const localPlayerId = useStore(s => s.party.localPlayerId)

  if (!gameState || (gameState.phase !== 'round-end' && gameState.phase !== 'game-end')) return null

  const winner = gameState.players.reduce((a, b) => a.score >= b.score ? a : b)
  const isWinner = winner.id === localPlayerId
  const isGameOver = gameState.phase === 'game-end'

  // Sorted scoreboard
  const sortedPlayers = [...gameState.players].sort((a, b) => b.score - a.score)

  const handlePlayAgain = () => {
    resetGame()
    setRoute('solo-lobby')
  }

  const handleMainMenu = () => {
    resetGame()
    setRoute('mainmenu')
  }

  return (
    <div className="win-screen-overlay">
      <div className="win-screen-modal">
        {/* Trophy */}
        <div className="win-trophy">{isWinner ? '🏆' : '💀'}</div>

        <h1 className="win-title">
          {isWinner ? 'YOU WIN!' : `${winner.name} Wins!`}
        </h1>
        <p className="win-subtitle">
          {isGameOver ? 'Game Over' : 'Round Complete'}
        </p>

        {/* Scoreboard */}
        <div className="win-scoreboard">
          {sortedPlayers.map((p, i) => (
            <div
              key={p.id}
              className="win-score-row"
              style={{ borderLeft: `3px solid ${SEAT_COLORS[p.seatIndex]}` }}
            >
              <span className="win-rank">#{i + 1}</span>
              <span className="win-avatar">{p.avatar}</span>
              <span className="win-name">{p.name}</span>
              <span className="win-pts">{p.score} pts</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="win-actions">
          <button id="win-play-again" className="btn-primary" onClick={handlePlayAgain}>
            🔄 Play Again
          </button>
          <button id="win-main-menu" className="btn-secondary" onClick={handleMainMenu}>
            🏠 Main Menu
          </button>
        </div>
      </div>
    </div>
  )
}
