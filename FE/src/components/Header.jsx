import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import NotificationModal from './NotificationModal'

export default function Header(){
  const { user, logout, setShowLogin, setShowRegister } = useAuth()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notification, setNotification] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  })

  function toggleUserMenu(){ setDropdownOpen(d => !d) }
  
  // Listen for update profile event from LoginModal
  useEffect(() => {
    const handleOpenUpdateProfile = () => {
      console.log('📋 Navigating to update profile page')
      navigate('/update-profile')
      setDropdownOpen(false)
    }
    
    window.addEventListener('openUpdateProfile', handleOpenUpdateProfile)
    return () => window.removeEventListener('openUpdateProfile', handleOpenUpdateProfile)
  }, [navigate])
  
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
  const isStaff = user && (user.userRole === 'Station Staff')

  const isAdmin = user && (user.userRole === 'Admin')

  return (
    <>
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
              {isAdmin && (
                <a href="/admin" className="admin-portal-btn">
                  <i className="fas fa-user-shield"></i> Admin Portal
                </a>
              )}
            </div>
            <div className="navbar-right">
              {!user && <button id="loginBtn" onClick={()=> setShowLogin(true)} className="login-nav-btn">Log in</button>}

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
                    <a href="/update-profile"> <i className="fas fa-edit"></i> Update Profile</a>
                    <a href="/booking-history"> <i className="fas fa-history"></i> Booking History</a>
                    <a href="#" onClick={(e)=>{ 
                      e.preventDefault()
                      const userEmail = user?.email || 'User'
                      logout()
                      setDropdownOpen(false)
                      setNotification({
                        isOpen: true,
                        type: 'success',
                        title: 'Logged Out Successfully! 👋',
                        message: `You have been logged out.\nGoodbye, ${userEmail}!`,
                        autoCloseMs: 2000
                      })
                      setTimeout(() => navigate('/'), 2000)
                    }}> <i className="fas fa-sign-out-alt"></i> Logout</a>
                  </div>
                </div>
              )}
            </div>
          </nav>
        </div>
      </header>
      
      <NotificationModal
        isOpen={notification.isOpen}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        autoCloseMs={notification.autoCloseMs}
        onClose={() => setNotification(prev => ({...prev, isOpen: false}))}
      />
    </>
  )
}
