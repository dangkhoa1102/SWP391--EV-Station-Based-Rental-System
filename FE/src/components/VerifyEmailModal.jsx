import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import NotificationModal from './NotificationModal'
import authApi from '../services/authApi'

export default function VerifyEmailModal() {
  const { showVerifyEmail, setShowVerifyEmail, setShowLogin } = useAuth()
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [notification, setNotification] = useState({ isOpen: false, type: 'info', title: '', message: '' })
  const [isLoading, setIsLoading] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(0)

  useEffect(() => {
    if (resendCountdown <= 0) return undefined
    const timer = setTimeout(() => setResendCountdown(count => count - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCountdown])

  // Set email from context when modal opens
  useEffect(() => {
    if (showVerifyEmail && showVerifyEmail.email) {
      setEmail(showVerifyEmail.email)
      // Don't set initial countdown - wait for backend response
      setResendCountdown(0)
    }
  }, [showVerifyEmail])

  if (!showVerifyEmail) return null

  async function handleVerify(e) {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    if (!otp.trim()) {
      setError('Please enter the OTP')
      setIsLoading(false)
      return
    }

    try {
      await authApi.verifyEmail(email, otp)
      setNotification({ isOpen: true, type: 'success', title: 'Email Verified!', message: 'Your account is now active. You can log in.', autoCloseMs: 2000 })
      setTimeout(() => {
        setShowVerifyEmail(false)
        setShowLogin(true)
      }, 2000)
    } catch (err) {
      const message = err.message || err.response?.data?.message || 'Verification failed'
      setError(message)
      setNotification({ isOpen: true, type: 'error', title: 'Verification Failed', message, autoCloseMs: 3000 })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleResend() {
    setError('')
    setIsLoading(true)
    try {
      const response = await authApi.resendOtp(email)
      setNotification({ isOpen: true, type: 'success', title: 'OTP resent', message: 'Check your inbox again.', autoCloseMs: 2000 })
      // Use cooldown from backend response
      const cooldownSeconds = response?.data?.cooldownSeconds || 300 // fallback to 5 minutes
      setResendCountdown(cooldownSeconds)
    } catch (err) {
      const message = err.message || err.response?.data?.message || 'Failed to resend OTP'
      setError(message)
      setNotification({ isOpen: true, type: 'error', title: 'Error', message, autoCloseMs: 3000 })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className={`modal-overlay ${showVerifyEmail ? 'show' : ''}`}>
        <div className="modal-content">
          <span
            className="close-btn"
            onClick={() => setShowVerifyEmail(false)}
          >&times;</span>

          <form onSubmit={handleVerify}>
            <h2>Verify Your Email</h2>
            <p style={{ marginBottom: '1rem' }}>
              We've sent an OTP to <strong>{email}</strong>. Enter it below to verify your account.
            </p>
            <div className="input-group">
              <input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                disabled={isLoading}
                maxLength={6}
              />
              <i className="fas fa-key"></i>
            </div>
            {error && <div style={{ marginBottom: '10px', color: 'red' }}>{error}</div>}
            <button type="submit" disabled={isLoading}>{isLoading ? 'Verifying...' : 'Verify Email'}</button>
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
