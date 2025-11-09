import React from 'react'
import './NotificationModal.css'

/**
 * Reusable Notification Modal
 * Props:
 *   - isOpen: boolean
 *   - type: 'success' | 'error' | 'info' | 'warning'
 *   - title: string
 *   - message: string | array of strings
 *   - onClose: function (close button or auto-close)
 *   - actionLabel: string (optional, for primary button)
 *   - onAction: function (optional, for primary button)
 *   - autoCloseMs: number (optional, auto-close after ms, default none)
 */
export default function NotificationModal({
  isOpen,
  type = 'info', // success, error, info, warning
  title,
  message,
  onClose,
  actionLabel = 'OK',
  onAction,
  autoCloseMs = null
}) {
  React.useEffect(() => {
    if (!isOpen || !autoCloseMs) return
    const timer = setTimeout(onClose, autoCloseMs)
    return () => clearTimeout(timer)
  }, [isOpen, autoCloseMs, onClose])

  if (!isOpen) return null

  const handleAction = () => {
    if (onAction) onAction()
    onClose()
  }

  const icon = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️'
  }[type] || 'ℹ️'

  return (
    <div className={`notification-backdrop notification-${type}`}>
      <div className={`notification-modal notification-${type}`}>
        <div className="notification-header">
          <span className="notification-icon">{icon}</span>
          <h3 className="notification-title">{title}</h3>
          <button className="notification-close" onClick={onClose}>✕</button>
        </div>

        <div className="notification-body">
          {Array.isArray(message) ? (
            <ul>
              {message.map((msg, idx) => (
                <li key={idx}>{msg}</li>
              ))}
            </ul>
          ) : (
            <p>{message}</p>
          )}
        </div>

        <div className="notification-footer">
          <button className="btn-close" onClick={onClose}>
            Close
          </button>
          {onAction && (
            <button className={`btn-action btn-${type}`} onClick={handleAction}>
              {actionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
