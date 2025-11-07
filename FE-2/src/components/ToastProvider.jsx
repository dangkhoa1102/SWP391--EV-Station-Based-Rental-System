import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import '../styles/toast.css'

const ToastContext = createContext(null)

export function ToastProvider({ children }){
  const [toasts, setToasts] = useState([])

  // showToast(message, type = 'info', duration = 3500, anchorElement = null)
  const showToast = useCallback((message, type = 'info', duration = 3500, anchorElement = null) => {
    const id = Date.now() + Math.random()

    let pos = null
    try{
      if(anchorElement && typeof anchorElement.getBoundingClientRect === 'function'){
        const r = anchorElement.getBoundingClientRect()
        // position just below the element, centered
        const top = Math.round(r.top + r.height + 8)
        const left = Math.round(r.left + (r.width / 2))
        pos = { top, left }
      }
    }catch(e){ pos = null }

    setToasts(t => [...t, { id, message, type, pos }])

    // auto remove
    setTimeout(() => {
      setToasts(t => t.filter(x => x.id !== id))
    }, duration)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(t => t.filter(x => x.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-viewport" aria-live="polite">
        {toasts.filter(t => !t.pos).map(t => (
          <div key={t.id} className={`toast ${t.type}`} onClick={() => removeToast(t.id)}>
            <div className="toast-message">{t.message}</div>
            <button className="toast-close" aria-label="Close">×</button>
          </div>
        ))}
      </div>

      {toasts.filter(t => t.pos).map(t => (
        <div
          key={t.id}
          className={`toast ${t.type} anchored`}
          style={{ position: 'fixed', top: `${t.pos.top}px`, left: `${t.pos.left}px`, transform: 'translateX(-50%)' }}
          onClick={() => removeToast(t.id)}
        >
          <div className="toast-message">{t.message}</div>
          <button className="toast-close" aria-label="Close">×</button>
        </div>
      ))}
    </ToastContext.Provider>
  )
}

export function useToast(){
  const ctx = useContext(ToastContext)
  if(!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export default ToastProvider
