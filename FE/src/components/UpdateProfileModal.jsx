import React, { useState } from 'react'
import API from '../user/services/userApi'
import './UpdateProfileModal.css'

/**
 * UpdateProfileModal - Allow user to fill profile info after registration
 * Props:
 *   - isOpen: boolean
 *   - userEmail: string (prefilled)
 *   - onClose: function
 *   - onSuccess: function (called after successful update)
 */
export default function UpdateProfileModal({ isOpen, userEmail, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    address: '',
    dateOfBirth: '',
    yearOfBirth: '',
    identityNumber: '',
    driverLicenseNumber: '',
    driverLicenseExpiry: '',
    driverLicenseClass: ''
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const [missingFields, setMissingFields] = useState([])

  React.useEffect(() => {
    if (isOpen) {
      // Try to get email from props or localStorage
      const email = userEmail || localStorage.getItem('userEmail') || ''
      console.log('📋 UpdateProfileModal opened with email:', email)
      
      // Load profile data from API
      loadProfileData()
    }
  }, [isOpen, userEmail])

  const loadProfileData = async () => {
    try {
      setIsLoadingProfile(true)
      console.log('📥 Loading profile data from API...')
      
      const profile = await API.getMe()
      
      console.log('✅ Profile data loaded:', profile)
      
      // Track which fields are missing/incomplete
      const missing = []
      if (!profile.address || profile.address.trim() === '') missing.push('address')
      if (!profile.driverLicenseNumber || profile.driverLicenseNumber.trim() === '') missing.push('driverLicenseNumber')
      if (!profile.driverLicenseExpiry || profile.driverLicenseExpiry.trim() === '') missing.push('driverLicenseExpiry')
      
      setMissingFields(missing)
      console.log('⚠️ Missing fields:', missing)
      
      // Prefill form with existing data
      setFormData({
        firstName: profile.firstName || profile.FirstName || '',
        lastName: profile.lastName || profile.LastName || '',
        phoneNumber: profile.phoneNumber || profile.PhoneNumber || '',
        address: profile.address || profile.Address || '',
        dateOfBirth: profile.dateOfBirth || profile.DateOfBirth || '',
        yearOfBirth: profile.yearOfBirth || profile.YearOfBirth || '',
        identityNumber: profile.identityNumber || profile.IdentityNumber || '',
        driverLicenseNumber: profile.driverLicenseNumber || profile.DriverLicenseNumber || '',
        driverLicenseExpiry: profile.driverLicenseExpiry || profile.DriverLicenseExpiry || '',
        driverLicenseClass: profile.driverLicenseClass || profile.DriverLicenseClass || ''
      })
    } catch (err) {
      console.error('❌ Error loading profile:', err)
      // Continue anyway, user can fill manually
    } finally {
      setIsLoadingProfile(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError('')
  }

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      setError('First name is required')
      return false
    }
    if (!formData.lastName.trim()) {
      setError('Last name is required')
      return false
    }
    if (!formData.phoneNumber.trim()) {
      setError('Phone number is required')
      return false
    }
    if (!formData.phoneNumber.match(/^[0-9]{10,11}$/)) {
      setError('Phone number must be 10-11 digits')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    try {
      console.log('📝 Updating profile with data:', formData)
      
      const userId = localStorage.getItem('userId')
      if (!userId) {
        setError('User ID not found')
        setLoading(false)
        return
      }

      // Call API to update profile
      const updatePayload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        address: formData.address || '',
        dateOfBirth: formData.dateOfBirth || '',
        yearOfBirth: formData.yearOfBirth ? parseInt(formData.yearOfBirth) : null,
        identityNumber: formData.identityNumber || '',
        driverLicenseNumber: formData.driverLicenseNumber || '',
        driverLicenseExpiry: formData.driverLicenseExpiry || '',
        driverLicenseClass: formData.driverLicenseClass || ''
      }

      // Use generic update endpoint or create specific one
      const res = await API.post(`/Users/${encodeURIComponent(userId)}/profile`, updatePayload)
      
      console.log('✅ Profile updated successfully:', res)
      
      // Store profile info locally
      localStorage.setItem('userFirstName', formData.firstName)
      localStorage.setItem('userLastName', formData.lastName)
      localStorage.setItem('userPhone', formData.phoneNumber)

      // Call success callback
      if (onSuccess) {
        onSuccess(formData)
      }

      onClose()
    } catch (err) {
      console.error('❌ Error updating profile:', err)
      setError(err.response?.data?.message || 'Failed to update profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) {
    console.log('🔍 UpdateProfileModal: isOpen is false, not rendering')
    return null
  }

  console.log('✅ UpdateProfileModal: Rendering with isOpen=true')

  if (isLoadingProfile) {
    return (
      <div className="modal-backdrop modal-backdrop-active">
        <div className="modal-content modal-update-profile">
          <div className="modal-header">
            <h2>Loading Profile...</h2>
          </div>
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <p>Loading your profile data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-backdrop modal-backdrop-active">
      <div className="modal-content modal-update-profile">
        <div className="modal-header">
          <h2>✏️ Complete Your Profile</h2>
          <p className="modal-subtitle">Please fill in your information to complete registration</p>
          {missingFields.length > 0 && (
            <p className="modal-subtitle" style={{ marginTop: '10px', fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>
              ⚠️ Missing: {missingFields.map(f => 
                f === 'address' ? 'Address' : 
                f === 'driverLicenseNumber' ? 'Driver License Number' :
                f === 'driverLicenseExpiry' ? 'Driver License Expiry' : f
              ).join(', ')}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="update-profile-form">
          {error && <div className="form-error">❌ {error}</div>}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name *</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="John"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="lastName">Last Name *</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Doe"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email (Pre-filled)</label>
              <input
                type="email"
                id="email"
                value={userEmail || localStorage.getItem('userEmail') || ''}
                disabled
                className="form-control-disabled"
              />
            </div>

            <div className="form-group">
              <label htmlFor="phoneNumber">Phone Number *</label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="0912345678"
                required
              />
            </div>
          </div>

          <div className={`form-group ${missingFields.includes('address') ? 'field-missing' : ''}`}>
            <label htmlFor="address">
              Address
              {missingFields.includes('address') && <span style={{ color: '#FF6B35', marginLeft: '4px' }}>⚠️ Required</span>}
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="123 Main St, City, Country"
              style={missingFields.includes('address') ? { borderColor: '#FF6B35', backgroundColor: '#fff5f0' } : {}}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="dateOfBirth">Date of Birth</label>
              <input
                type="date"
                id="dateOfBirth"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="yearOfBirth">Year of Birth</label>
              <input
                type="number"
                id="yearOfBirth"
                name="yearOfBirth"
                value={formData.yearOfBirth}
                onChange={handleChange}
                placeholder="1990"
                min="1900"
                max={new Date().getFullYear()}
              />
            </div>
          </div>

          <div className="form-divider">
            <span>Driver License Information</span>
          </div>

          <div className={`form-group ${missingFields.includes('driverLicenseNumber') ? 'field-missing' : ''}`}>
            <label htmlFor="driverLicenseNumber">
              Driver License Number
              {missingFields.includes('driverLicenseNumber') && <span style={{ color: '#FF6B35', marginLeft: '4px' }}>⚠️ Required</span>}
            </label>
            <input
              type="text"
              id="driverLicenseNumber"
              name="driverLicenseNumber"
              value={formData.driverLicenseNumber}
              onChange={handleChange}
              placeholder="ABC123456"
              style={missingFields.includes('driverLicenseNumber') ? { borderColor: '#FF6B35', backgroundColor: '#fff5f0' } : {}}
            />
          </div>

          <div className="form-row">
            <div className={`form-group ${missingFields.includes('driverLicenseExpiry') ? 'field-missing' : ''}`}>
              <label htmlFor="driverLicenseExpiry">
                Driver License Expiry
                {missingFields.includes('driverLicenseExpiry') && <span style={{ color: '#FF6B35', marginLeft: '4px' }}>⚠️ Required</span>}
              </label>
              <input
                type="date"
                id="driverLicenseExpiry"
                name="driverLicenseExpiry"
                value={formData.driverLicenseExpiry}
                onChange={handleChange}
                style={missingFields.includes('driverLicenseExpiry') ? { borderColor: '#FF6B35', backgroundColor: '#fff5f0' } : {}}
              />
            </div>

            <div className="form-group">
              <label htmlFor="driverLicenseClass">Driver License Class</label>
              <select
                id="driverLicenseClass"
                name="driverLicenseClass"
                value={formData.driverLicenseClass}
                onChange={handleChange}
              >
                <option value="">Select Class</option>
                <option value="A">Class A</option>
                <option value="A1">Class A1</option>
                <option value="B">Class B</option>
                <option value="C">Class C</option>
                <option value="D">Class D</option>
                <option value="E">Class E</option>
              </select>
            </div>
          </div>

          <div className="form-divider">
            <span>Additional Information (Optional)</span>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="identityNumber">Identity Number (CCCD)</label>
              <input
                type="text"
                id="identityNumber"
                name="identityNumber"
                value={formData.identityNumber}
                onChange={handleChange}
                placeholder="123456789012"
              />
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Skip for Now
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? '⏳ Updating...' : '✅ Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
