import { useEffect, useRef } from 'react'
import { useStore } from '../game/store'

export function UnoButton() {
  const ui = useStore(s => s.ui)
  const callUno = useStore(s => s.callUno)
  const localPlayerId = useStore(s => s.party.localPlayerId)
  const countdownRef = useRef<HTMLCanvasElement>(null!)

  const visible = ui.unoButtonVisible && ui.unoButtonPlayerId === localPlayerId

  useEffect(() => {
    if (!visible || !countdownRef.current) return
    const start = Date.now()
    const duration = 2000
    let raf: number

    const draw = () => {
      const canvas = countdownRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')!
      const W = canvas.width
      const progress = Math.max(0, 1 - (Date.now() - start) / duration)
      ctx.clearRect(0, 0, W, W)

      ctx.beginPath()
      ctx.arc(W / 2, W / 2, W / 2 - 2, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2)
      ctx.strokeStyle = '#f5c817'
      ctx.lineWidth = 3
      ctx.lineCap = 'round'
      ctx.stroke()

      if (progress > 0) raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [visible])

  if (!visible) return null

  return (
    <button
      id="uno-button"
      className="uno-button"
      onClick={() => callUno(localPlayerId)}
    >
      <span className="uno-button-text">UNO!</span>
      <canvas ref={countdownRef} width={72} height={72} className="uno-countdown" />
    </button>
  )
}
