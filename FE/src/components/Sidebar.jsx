import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/sidebar.css'

export default function Sidebar({ title = 'Menu', menuItems = [], isOpen = false, toggleSidebar, onSelect, activeKey }) {
  const navigate = useNavigate()

  // keep body class behavior for backward-compatibility with existing layout
  useEffect(() => {
    if (isOpen) document.body.classList.add('sidebar-open')
    else document.body.classList.remove('sidebar-open')
  }, [isOpen])

  function handleClick(item) {
    try {
      if (typeof item.onClick === 'function') item.onClick()
      else if (item.to) navigate(item.to)
    } catch (e) {
      console.warn('Sidebar navigation error', e)
    }
    if (typeof onSelect === 'function') onSelect(item.key)
  }

  return (
    <>
      {isOpen && <div className="sidebar-collider" onClick={toggleSidebar}></div>}

      <div className={`sidebar ${isOpen ? 'active' : ''}`}>
        <h2>{title}</h2>
        <div style={{ marginTop: '60px' }}></div>

        {Array.isArray(menuItems) && menuItems.map(item => (
          <button
            key={item.key}
            className={activeKey === item.key ? 'sidebar-item active' : 'sidebar-item'}
            onClick={() => handleClick(item)}
          >
            {item.icon && <i className={item.icon} aria-hidden />}
            <span style={{ marginLeft: item.icon ? 8 : 0 }}>{item.label}</span>
          </button>
        ))}
      </div>
    </>
  )
}
