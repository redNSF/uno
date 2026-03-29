import { useEffect, useRef } from 'react'
import { useStore } from '../game/store'
import { TIMING, SEAT_COLORS } from '../utils/constants'

const COLOR_HEX: Record<string, string> = {
  red: '#e02020', yellow: '#f5c817', green: '#1fb851', blue: '#1a6fff', wild: '#c084fc',
}

export function HUD() {
  const gameState = useStore(s => s.gameState)
  const ui = useStore(s => s.ui)
  const anim = useStore(s => s.anim)
  const drawCardAction = useStore(s => s.drawCardAction)

  if (!gameState || gameState.phase === 'idle' || gameState.phase === 'dealing') return null

  const { players, currentPlayerIndex, activeColor, drawStack, direction } = gameState
  const currentPlayer = players[currentPlayerIndex]
  const isHumanTurn = currentPlayer?.isHuman

  return (
    <div className="hud-overlay">
      {/* Top bar: direction + draw stack */}
      <div className="hud-top-bar">
        <div className="hud-direction" title={direction === 1 ? 'Clockwise' : 'Counter-clockwise'}>
          <span style={{ fontSize: 22, transform: direction === -1 ? 'scaleX(-1)' : 'none', display: 'inline-block' }}>↻</span>
          <span className="hud-label">Turn Order</span>
        </div>

        {drawStack > 0 && (
          <div className="hud-draw-stack" style={{ background: COLOR_HEX[activeColor] + '33', borderColor: COLOR_HEX[activeColor] }}>
            <span className="hud-draw-stack-count">+{drawStack}</span>
            <span className="hud-label">Draw Stack</span>
          </div>
        )}

        {/* Active color indicator */}
        <div className="hud-color-orb-container">
          <div
            className="hud-color-orb"
            style={{ background: COLOR_HEX[activeColor], boxShadow: `0 0 18px ${COLOR_HEX[activeColor]}` }}
          />
          <span className="hud-label">{activeColor.toUpperCase()}</span>
        </div>
      </div>

      {/* Bottom: current player + deck draw button */}
      <div className="hud-bottom">
        {isHumanTurn && (
          <div className="hud-actions" style={{ marginBottom: '100px' }}>
            <p className="hud-instruction glow-text">
              {anim.selectedCardId
                ? 'Click again to play!'
                : 'Your Turn!'}
            </p>
          </div>
        )}

        <button
           className="uno-button"
           onClick={() => alert("UNO! (Not fully implemented)")}
        >
          <span className="uno-button-text">CALL<br/>UNO</span>
        </button>
      </div>

      {/* Turn timer */}
      {isHumanTurn && <TurnTimer startedAt={gameState.turnStartedAt} />}
    </div>
  )
}

// ── Turn Timer ───────────────────────────────────────────────────────────────
function TurnTimer({ startedAt }: { startedAt: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null!)
  const timeoutMs = TIMING.TURN_TIMEOUT_MS
  const drawCardAction = useStore(s => s.drawCardAction)

  useEffect(() => {
    let raf: number
    const draw = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')!
      const W = canvas.width
      const elapsed = Date.now() - startedAt
      const progress = Math.max(0, 1 - elapsed / timeoutMs)

      ctx.clearRect(0, 0, W, W)

      // Background ring
      ctx.beginPath()
      ctx.arc(W / 2, W / 2, W / 2 - 4, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(255,255,255,0.1)'
      ctx.lineWidth = 5
      ctx.stroke()

      // Progress arc
      const startAngle = -Math.PI / 2
      const endAngle = startAngle + progress * Math.PI * 2
      const hue = progress * 120  // green → red
      ctx.beginPath()
      ctx.arc(W / 2, W / 2, W / 2 - 4, startAngle, endAngle)
      ctx.strokeStyle = `hsl(${hue}, 80%, 55%)`
      ctx.lineWidth = 5
      ctx.lineCap = 'round'
      ctx.stroke()

      // Text
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 13px Inter'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(`${Math.ceil(progress * (timeoutMs / 1000))}s`, W / 2, W / 2)

      if (progress > 0) {
        raf = requestAnimationFrame(draw)
      } else {
        // Auto-draw on timeout
        drawCardAction()
      }
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [startedAt, timeoutMs, drawCardAction])

  return (
    <canvas
      ref={canvasRef}
      width={56}
      height={56}
      className="hud-timer-canvas"
    />
  )
}
