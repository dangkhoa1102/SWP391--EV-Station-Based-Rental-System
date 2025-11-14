import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import NotificationModal from './NotificationModal'
import UpdateProfileModal from './UpdateProfileModal'
import authApi from '../services/authApi'

export default function LoginModal(){
  const { showLogin, setShowLogin, login, setShowRegister } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [notification, setNotification] = useState({ isOpen: false, type: 'info', title: '', message: '' })
  const [isLoading, setIsLoading] = useState(false)
  const [showUpdateProfileModal, setShowUpdateProfileModal] = useState(false)

  if(!showLogin && !notification.isOpen) return null

  const checkProfileCompleteness = async (userId) => {
    try {
      console.log('📋 Checking profile completeness for user:', userId)
      const profile = await authApi.getMyProfile()
      
      console.log('👤 Profile data from /Users/Get-My-Profile:', profile)
      
      // Check if any critical field is null
      const incompletFields = []
      if (!profile.address || profile.address.trim() === '') incompletFields.push('Address')
      if (!profile.dateOfBirth || profile.dateOfBirth.trim() === '') incompletFields.push('Date of Birth')
      if (!profile.driverLicenseNumber || profile.driverLicenseNumber.trim() === '') incompletFields.push('Driver License Number')
      if (!profile.driverLicenseExpiry || profile.driverLicenseExpiry.trim() === '') incompletFields.push('Driver License Expiry')
      
      if (incompletFields.length > 0) {
        console.log('⚠️ Incomplete profile fields:', incompletFields)
        // Don't show notification here, UpdateProfileModal will show directly
        return true // Profile is incomplete
      }
      
      console.log('✅ Profile is complete')
      return false // Profile is complete
    } catch (err) {
      console.error('❌ Error checking profile:', err)
      return false // Assume complete on error
    }
  }

  async function handleSubmit(e){
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try{
      console.log('🔐 Logging in user:', email)
      const loginResult = await login(email, password)
      
      // Check if user role is 'Renter' and profile is complete
      const userRole = localStorage.getItem('userRole') || loginResult?.role
      console.log('👥 User role:', userRole)
      
      // Check if user is a renter (role contains 'Renter' or 'Customer')
      const isRenter = userRole && (userRole.includes('Renter') || userRole.includes('Customer'))
      console.log('🎯 Is renter?', isRenter)
      
      if (isRenter) {
        const isIncomplete = await checkProfileCompleteness(localStorage.getItem('userId'))
        
        if (isIncomplete) {
          // Show update profile modal directly instead of using events
          console.log('🎯 Opening UpdateProfileModal directly')
          setShowUpdateProfileModal(true)
          setShowLogin(false)
          setIsLoading(false)
          return
        }
      }
      
      // Profile is complete or not renter, proceed with normal flow
      setNotification({
        isOpen: true,
        type: 'success',
        title: 'Login Successful! ✅',
        message: 'Welcome back! You are now logged in.'
      })

      // Clear form and close
      setEmail('')
      setPassword('')
      setTimeout(() => {
        setShowLogin(false)
        setNotification({ ...notification, isOpen: false })
      }, 1500)

    }catch(err){
      console.error('❌ Login error:', err)
      const errorMsg = err.message || err.response?.data?.message || 'Login failed'
      setError(errorMsg)
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Login Failed',
        message: errorMsg
      })
    } finally {
      setIsLoading(false)
    }
  }

  function switchToRegister(){
    setShowLogin(false)
    setShowRegister(true)
  }

  return (
    <>
      {/* Login Modal */}
      {showLogin && (
        <div className="modal-overlay" style={{ display: 'flex' }}>
          <div className="modal-content">
            <span className="close-btn" onClick={()=> setShowLogin(false)}>&times;</span>
            <h2>LOGIN</h2>
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <input type="email" value={email} onChange={e=> setEmail(e.target.value)} placeholder="Enter Email" required disabled={isLoading} />
                <i className="fas fa-envelope"></i>
              </div>
              <div className="input-group">
                <input type="password" value={password} onChange={e=> setPassword(e.target.value)} placeholder="Enter Password" required disabled={isLoading} />
                <i className="fas fa-lock"></i>
              </div>
              {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
              <button type="submit" disabled={isLoading}>{isLoading ? 'Logging in...' : 'Login'}</button>
              <p className="modal-footer-text">
                Don't have an account? <a href="#" onClick={(e)=>{ e.preventDefault(); switchToRegister(); }}>Register here</a>
              </p>
            </form>
          </div>
        </div>
      )}

      // Notification Modal
      <NotificationModal
        isOpen={notification.isOpen}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={() => setNotification({ ...notification, isOpen: false })}
      />

      {/* Update Profile Modal - shown directly when profile is incomplete */}
      <UpdateProfileModal
        isOpen={showUpdateProfileModal}
        userEmail={localStorage.getItem('userEmail') || email}
        onClose={() => {
          setShowUpdateProfileModal(false)
          // After closing profile modal, show success message
          setNotification({
            isOpen: true,
            type: 'success',
            title: 'Login Successful! ✅',
            message: 'Your profile has been updated. Welcome!'
          })
          setTimeout(() => {
            setShowLogin(false)
            setNotification({ ...notification, isOpen: false })
          }, 1500)
        }}
        onSuccess={() => {
          console.log('✅ Profile updated successfully after login')
          setShowUpdateProfileModal(false)
        }}
      />
    </>
  )
}
