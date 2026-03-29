import { useStore } from '../game/store'

export function MainMenu() {
  const setRoute = useStore(s => s.setRoute)

  return (
    <div className="mainmenu">
      {/* Animated background */}
      <div className="mainmenu-bg">
        <div className="mainmenu-glow mainmenu-glow--red" />
        <div className="mainmenu-glow mainmenu-glow--blue" />
        <div className="mainmenu-glow mainmenu-glow--gold" />
      </div>

      {/* Floating card decorations */}
      <div className="mainmenu-floating-cards">
        {['🔴','🟡','🟢','🔵','🃏'].map((c, i) => (
          <div
            key={i}
            className="mainmenu-float-card"
            style={{
              left: `${8 + i * 18}%`,
              animationDelay: `${i * 0.8}s`,
              animationDuration: `${4 + i * 0.5}s`,
            }}
          >
            {c}
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="mainmenu-content">
        {/* Logo */}
        <div className="mainmenu-logo-wrap">
          <div className="mainmenu-logo-ring" />
          <h1 className="mainmenu-title">
            {['U','N','O'].map((ch, i) => (
              <span key={i} className="mainmenu-title-letter" style={{ animationDelay: `${i * 0.2}s` }}>{ch}</span>
            ))}
          </h1>
          <p className="mainmenu-tagline">Cinematic Card Game</p>
        </div>

        {/* Buttons */}
        <div className="mainmenu-buttons">
          <button
            id="mainmenu-solo-btn"
            className="mainmenu-btn mainmenu-btn--primary"
            onClick={() => setRoute('solo-lobby')}
          >
            <span className="mainmenu-btn-icon">🎮</span>
            <span className="mainmenu-btn-text">
              <span className="mainmenu-btn-label">Solo Play</span>
              <span className="mainmenu-btn-sub">vs AI opponents</span>
            </span>
          </button>

          <button
            id="mainmenu-party-btn"
            className="mainmenu-btn mainmenu-btn--secondary"
            onClick={() => setRoute('party-lobby')}
          >
            <span className="mainmenu-btn-icon">🌐</span>
            <span className="mainmenu-btn-text">
              <span className="mainmenu-btn-label">Party Mode</span>
              <span className="mainmenu-btn-sub">play with friends</span>
            </span>
          </button>
        </div>

        {/* Footer */}
        <div className="mainmenu-footer">
          <span className="mainmenu-version">v1.0.0 · AAA Edition</span>
          <div className="mainmenu-color-dots">
            {['#e02020','#f5c817','#1fb851','#1a6fff'].map(c => (
              <div key={c} className="mainmenu-dot" style={{ background: c, boxShadow: `0 0 8px ${c}` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
