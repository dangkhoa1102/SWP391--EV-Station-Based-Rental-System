import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Header(){
  const { user, logout, setShowLogin, setShowRegister } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  function toggleUserMenu(){ setDropdownOpen(d => !d) }
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownOpen && !event.target.closest('.user-menu')) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [dropdownOpen])

  // Check if user is Staff (role check)
  const isStaff = user && (user.userRole === 'Station Staff' || user.role === 'Staff' || user.Role === 'Staff')

  return (
    <header className="header">
      <div className="container header-container">
        <div className="logo"><a href="/">FEC</a></div>
        <nav className="nav">
          <div className="navbar-left">
            {isStaff && (
              <a href="/staff" className="staff-portal-btn">
                <i className="fas fa-user-shield"></i> Staff Portal
              </a>
            )}
          </div>
          <div className="navbar-right">
            {!user && <button id="loginBtn" onClick={()=> setShowLogin(true)} className="login-nav-btn">Login</button>}

            {user && (
              <div className="user-menu">
                <button className="user-menu-btn" onClick={toggleUserMenu}>
                  <i className="fas fa-user-circle"></i>
                  <i className="fas fa-chevron-down"></i>
                </button>
                <div className={`user-dropdown ${dropdownOpen ? 'show' : ''}`}>
                  <div className="dropdown-header">
                    <i className="fas fa-user-circle"></i>
                    <span id="userEmail">{user.email || 'User Account'}</span>
                  </div>
                  <hr />
                  <a href="/profile"> <i className="fas fa-user-cog"></i> User Profile</a>
                  <a href="/booking-history"> <i className="fas fa-history"></i> Booking History</a>
                  <a href="#" onClick={(e)=>{ e.preventDefault(); logout(); setDropdownOpen(false); }}> <i className="fas fa-sign-out-alt"></i> Logout</a>
                </div>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}
