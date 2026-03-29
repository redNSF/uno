import { useStore } from '../game/store'
import type { CardColor } from '../utils/constants'

const COLORS: { color: CardColor; hex: string; label: string; emoji: string }[] = [
  { color: 'red',    hex: '#e02020', label: 'Red',    emoji: '🔴' },
  { color: 'yellow', hex: '#f5c817', label: 'Yellow', emoji: '🟡' },
  { color: 'green',  hex: '#1fb851', label: 'Green',  emoji: '🟢' },
  { color: 'blue',   hex: '#1a6fff', label: 'Blue',   emoji: '🔵' },
]

export function ColorPicker() {
  const showColorPicker = useStore(s => s.ui.showColorPicker)
  const selectColor = useStore(s => s.selectColor)

  if (!showColorPicker) return null

  return (
    <div className="color-picker-overlay">
      <div className="color-picker-backdrop" />
      <div className="color-picker-modal">
        <h2 className="color-picker-title">Choose a Color</h2>
        <div className="color-picker-grid">
          {COLORS.map(({ color, hex, label, emoji }) => (
            <button
              key={color}
              id={`color-pick-${color}`}
              className="color-picker-orb"
              onClick={() => selectColor(color)}
              style={{ '--orb-color': hex } as React.CSSProperties}
            >
              <span className="color-orb-glow" style={{ background: hex }} />
              <span className="color-orb-emoji">{emoji}</span>
              <span className="color-orb-label">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
