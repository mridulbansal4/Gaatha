import { useStore } from '../../state/store.jsx'

const ACCENT = { success: 'var(--success)', error: 'var(--error)', info: 'var(--brand-accent)', warning: 'var(--warning)' }

export function ToastStack() {
  const { toasts } = useStore()
  if (!toasts.length) return null
  return (
    <div className="toast-stack">
      {toasts.map((t) => (
        <div className="toast" key={t.id} role="status">
          <span className="toast-accent" style={{ background: ACCENT[t.kind] || 'var(--brand-accent)' }} />
          <div>
            <div className="toast-title">{t.title}</div>
            {t.body && <div className="toast-body">{t.body}</div>}
          </div>
        </div>
      ))}
    </div>
  )
}
