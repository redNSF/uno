import { useStore } from '../game/store'

const ICON: Record<string, string> = {
  info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌',
}

export function Toast() {
  const toasts = useStore(s => s.ui.toasts)
  const removeToast = useStore(s => s.removeToast)

  if (toasts.length === 0) return null

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          <span className="toast-icon">{ICON[toast.type]}</span>
          <span className="toast-message">{toast.message}</span>
          <button className="toast-close" onClick={() => removeToast(toast.id)}>×</button>
        </div>
      ))}
    </div>
  )
}
