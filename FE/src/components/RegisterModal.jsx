import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import UpdateProfileModal from './UpdateProfileModal'
import NotificationModal from './NotificationModal'

export default function RegisterModal(){
  const { showRegister, setShowRegister, register } = useAuth()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showUpdateProfile, setShowUpdateProfile] = useState(false)
  const [notification, setNotification] = useState({ isOpen: false, type: 'info', title: '', message: '' })
  const [isLoading, setIsLoading] = useState(false)

  if(!showRegister && !showUpdateProfile) return null

  async function handleSubmit(e){
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try{
      console.log('📝 Registering user:', email)
      await register(username, email, phone, password)
      
      // Show success notification
      setNotification({
        isOpen: true,
        type: 'success',
        title: 'Account Created! 🎉',
        message: 'Your account has been created successfully. Please complete your profile information.'
      })

      // Clear form
      setUsername('')
      setEmail('')
      setPhone('')
      setPassword('')
      
      // Close register modal and open update profile modal after 1.5s
      setTimeout(() => {
        console.log('⏱️ Timeout fired - closing register and opening profile modal')
        setShowRegister(false)
        setNotification({ ...notification, isOpen: false })
        setShowUpdateProfile(true)
        console.log('🎯 Update profile should now be visible')
      }, 1500)

    }catch(err){
      console.error('❌ Registration error:', err)
      const errorMsg = err.message || err.response?.data?.message || 'Registration failed'
      setError(errorMsg)
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Registration Failed',
        message: errorMsg
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleProfileUpdateSuccess = (profileData) => {
    console.log('✅ Profile updated successfully')
    setNotification({
      isOpen: true,
      type: 'success',
      title: 'Profile Updated! ✅',
      message: 'Your profile information has been saved. You can now start booking cars!'
    })

    setTimeout(() => {
      setShowUpdateProfile(false)
      setNotification({ ...notification, isOpen: false })
      setShowRegister(false) // Also make sure register is closed
      setEmail('')
    }, 2000)
  }

  // Show component if either register or update profile is open, or notification is showing
  if(!showRegister && !showUpdateProfile && !notification.isOpen) return null

  return (
    <>
      {/* Register Modal */}
      {showRegister && (
        <div className="modal-overlay" style={{ display: 'flex' }}>
          <div className="modal-content">
            <span className="close-btn" onClick={()=> setShowRegister(false)}>&times;</span>
            <h2>Register</h2>
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <input value={username} onChange={e=> setUsername(e.target.value)} placeholder="Full Name" required disabled={isLoading} />
                <i className="fas fa-user"></i>
              </div>
              <div className="input-group">
                <input type="email" value={email} onChange={e=> setEmail(e.target.value)} placeholder="Email" required disabled={isLoading} />
                <i className="fas fa-envelope"></i>
              </div>
              <div className="input-group">
                <input value={phone} onChange={e=> setPhone(e.target.value)} placeholder="Phone" required disabled={isLoading} />
                <i className="fas fa-phone"></i>
              </div>
              <div className="input-group">
                <input type="password" value={password} onChange={e=> setPassword(e.target.value)} placeholder="Password" required disabled={isLoading} />
                <i className="fas fa-lock"></i>
              </div>
              {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
              <button type="submit" disabled={isLoading}>{isLoading ? 'Creating Account...' : 'Create Account'}</button>
              <p className="modal-footer-text">
                Already have an account? <a href="#" onClick={(e)=>{ e.preventDefault(); setShowRegister(false); }}>Login here</a>
              </p>
            </form>
          </div>
        </div>
      )}

      {/* Update Profile Modal */}
      <UpdateProfileModal
        isOpen={showUpdateProfile}
        userEmail={email}
        onClose={() => {
          setShowUpdateProfile(false)
          setEmail('')
        }}
        onSuccess={handleProfileUpdateSuccess}
      />

      {/* Notification Modal */}
      <NotificationModal
        isOpen={notification.isOpen}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={() => setNotification({ ...notification, isOpen: false })}
      />
    </>
  )
}
