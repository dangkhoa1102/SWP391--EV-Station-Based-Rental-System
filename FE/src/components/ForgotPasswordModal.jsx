import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import NotificationModal from './NotificationModal'
import authApi from '../services/authApi'

export default function ForgotPasswordModal() {
  const { showForgotPassword, setShowForgotPassword, setShowLogin } = useAuth()
  const [stage, setStage] = useState('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [notification, setNotification] = useState({ isOpen: false, type: 'info', title: '', message: '' })
  const [isLoading, setIsLoading] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(0)

  useEffect(() => {
    if (resendCountdown <= 0) return undefined
    const timer = setTimeout(() => setResendCountdown(count => count - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCountdown])

  if (!showForgotPassword) return null

  async function handleSendOtp(e) {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    if (!email.trim()) {
      setError('Please enter your email')
      setIsLoading(false)
      return
    }

    try {
      await authApi.forgotPassword(email)
      setNotification({ isOpen: true, type: 'success', title: 'OTP sent', message: `Check ${email} for the code.`, autoCloseMs: 2000 })
      setStage('reset')
      setResendCountdown(60)
    } catch (err) {
      const message = err.message || err.response?.data?.message || 'Failed to send OTP'
      setError(message)
      setNotification({ isOpen: true, type: 'error', title: 'Error', message, autoCloseMs: 3000 })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleReset(e) {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    if (!otp.trim()) {
      setError('Enter OTP')
      setIsLoading(false)
      return
    }
    if (!newPassword.trim()) {
      setError('Enter new password')
      setIsLoading(false)
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      setIsLoading(false)
      return
    }

    try {
      await authApi.resetPassword(email, otp, newPassword)
      setNotification({ isOpen: true, type: 'success', title: 'Password reset!', message: 'Log in with your new password.', autoCloseMs: 2000 })
      resetForm()
      setShowForgotPassword(false)
      setShowLogin(true)
    } catch (err) {
      const message = err.message || err.response?.data?.message || 'Reset failed'
      setError(message)
      setNotification({ isOpen: true, type: 'error', title: 'Error', message, autoCloseMs: 3000 })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleResend() {
    setError('')
    setIsLoading(true)
    try {
      await authApi.resendOtp(email)
      setNotification({ isOpen: true, type: 'success', title: 'OTP resent', message: 'Check your inbox again.', autoCloseMs: 2000 })
      setResendCountdown(60)
    } catch (err) {
      const message = err.message || err.response?.data?.message || 'Failed to resend OTP'
      setError(message)
      setNotification({ isOpen: true, type: 'error', title: 'Error', message, autoCloseMs: 3000 })
    } finally {
      setIsLoading(false)
    }
  }

  function resetForm() {
    setEmail('')
    setOtp('')
    setNewPassword('')
    setConfirmPassword('')
    setStage('email')
    setError('')
  }

  return (
    <>
      <div className={`modal-overlay ${showForgotPassword ? 'show' : ''}`}>
        <div className="modal-content">
          <span
            className="close-btn"
            onClick={() => {
              resetForm()
              setShowForgotPassword(false)
            }}
          >&times;</span>

          {stage === 'email' && (
            <form onSubmit={handleSendOtp}>
              <h2>Forgotten password?</h2>
              <p style={{ marginBottom: '1rem' }}>Enter your email and we will send you an OTP.</p>
              <div className="input-group">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <i className="fas fa-envelope"></i>
              </div>
              {error && <div style={{ marginBottom: '10px', color: 'red' }}>{error}</div>}
              <button type="submit" disabled={isLoading}>{isLoading ? 'Sending...' : 'Send OTP'}</button>
            </form>
          )}

          {stage === 'reset' && (
            <form onSubmit={handleReset}>
              <h2>Reset password</h2>
              <p style={{ marginBottom: '1rem' }}>Enter the OTP we sent and set a new password.</p>
              <div className="input-group">
                <input
                  type="text"
                  placeholder="OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <i className="fas fa-key"></i>
              </div>
              <div className="input-group">
                <input
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <i className="fas fa-lock"></i>
              </div>
              <div className="input-group">
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <i className="fas fa-lock"></i>
              </div>
              {error && <div style={{ marginBottom: '10px', color: 'red' }}>{error}</div>}
              <button type="submit" disabled={isLoading}>{isLoading ? 'Resetting...' : 'Reset Password'}</button>
              <div style={{ marginTop: '0.75rem', fontSize: '0.9rem', color: '#666' }}>
                Didn't receive the code?
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isLoading || resendCountdown > 0}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: resendCountdown > 0 ? '#bbb' : '#ff6b35',
                    marginLeft: '6px',
                    textDecoration: 'underline',
                    cursor: resendCountdown > 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend OTP'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <NotificationModal
        isOpen={notification.isOpen}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))}
      />
    </>
  )
}
