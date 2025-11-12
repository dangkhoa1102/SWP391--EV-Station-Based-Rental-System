import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import userApi from '../../../../services/userApi'
import './UpdateProfilePage.css'
import NotificationModal from '../../../../components/NotificationModal'

export default function UpdateProfilePage() {
  const navigate = useNavigate()
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
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [missingFields, setMissingFields] = useState([])
  const [notification, setNotification] = useState({ isOpen: false, type: 'info', title: '', message: '' })

  useEffect(() => {
    loadProfileData()
  }, [])

  const loadProfileData = async () => {
    try {
      setIsLoadingProfile(true)
      console.log('📥 Initializing profile form...')
      
      // Get user data from localStorage or context
      // The user data was already fetched during login
      const firstName = localStorage.getItem('userFirstName') || ''
      const lastName = localStorage.getItem('userLastName') || ''
      const phoneNumber = localStorage.getItem('userPhone') || ''
      
      console.log('✅ Profile initialized from localStorage')
      
      // Check which fields are empty (missing)
      // Only check these 4 required fields for rental
      const missing = []
      const address = localStorage.getItem('userAddress')
      const dateOfBirth = localStorage.getItem('userDateOfBirth')
      const driverLicenseNumber = localStorage.getItem('userDriverLicenseNumber')
      const driverLicenseExpiry = localStorage.getItem('userDriverLicenseExpiry')
      
      console.log('📋 Checking 4 required fields:')
      console.log('  Address:', address)
      console.log('  DateOfBirth:', dateOfBirth)
      console.log('  DriverLicenseNumber:', driverLicenseNumber)
      console.log('  DriverLicenseExpiry:', driverLicenseExpiry)
      
      if (!address || address.trim() === '') missing.push('address')
      if (!dateOfBirth || dateOfBirth.trim() === '') missing.push('dateOfBirth')
      if (!driverLicenseNumber || driverLicenseNumber.trim() === '') missing.push('driverLicenseNumber')
      if (!driverLicenseExpiry || driverLicenseExpiry.trim() === '') missing.push('driverLicenseExpiry')
      
      setMissingFields(missing)
      console.log('⚠️ Missing fields:', missing)
      
      // Prefill form with existing data from localStorage
      setFormData({
        firstName: firstName,
        lastName: lastName,
        phoneNumber: phoneNumber,
        address: localStorage.getItem('userAddress') || '',
        dateOfBirth: localStorage.getItem('userDateOfBirth') || '',
        yearOfBirth: localStorage.getItem('userYearOfBirth') || '',
        identityNumber: localStorage.getItem('userIdentityNumber') || '',
        driverLicenseNumber: localStorage.getItem('userDriverLicenseNumber') || '',
        driverLicenseExpiry: localStorage.getItem('userDriverLicenseExpiry') || '',
        driverLicenseClass: localStorage.getItem('userDriverLicenseClass') || ''
      })
    } catch (err) {
      console.error('❌ Error initializing profile:', err)
    } finally {
      setIsLoadingProfile(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    const newData = {
      ...formData,
      [name]: value
    }
    
    // Auto-extract year from dateOfBirth
    if (name === 'dateOfBirth' && value) {
      const year = new Date(value).getFullYear()
      newData.yearOfBirth = String(year)
      console.log(`📅 Extracted year ${year} from date ${value}`)
    }
    
    setFormData(newData)
  }

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Validation Error',
        message: 'First name is required'
      })
      return false
    }
    if (!formData.lastName.trim()) {
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Validation Error',
        message: 'Last name is required'
      })
      return false
    }
    if (!formData.phoneNumber.trim()) {
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Validation Error',
        message: 'Phone number is required'
      })
      return false
    }
    if (!formData.phoneNumber.match(/^[0-9]{10,11}$/)) {
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Validation Error',
        message: 'Phone number must be 10-11 digits'
      })
      return false
    }
    if (!formData.address.trim()) {
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Validation Error',
        message: 'Address is required'
      })
      return false
    }
    if (!formData.driverLicenseNumber.trim()) {
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Validation Error',
        message: 'Driver License Number is required'
      })
      return false
    }
    if (!formData.driverLicenseExpiry.trim()) {
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Validation Error',
        message: 'Driver License Expiry is required'
      })
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
      
      const updatePayload = {
        request: 'UpdateProfile',
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        address: formData.address || '',
        dateOfBirth: formData.dateOfBirth || '',
        yearOfBirth: formData.yearOfBirth ? String(formData.yearOfBirth) : '',
        identityNumber: formData.identityNumber || '',
        driverLicenseNumber: formData.driverLicenseNumber || '',
        driverLicenseExpiry: formData.driverLicenseExpiry || '',
        driverLicenseClass: formData.driverLicenseClass || ''
      }

      const res = await userApi.updateMyProfile(updatePayload)
      
      console.log('✅ Profile updated successfully:', res)
      
      // Store profile info locally for future reference
      localStorage.setItem('userFirstName', formData.firstName)
      localStorage.setItem('userLastName', formData.lastName)
      localStorage.setItem('userPhone', formData.phoneNumber)
      localStorage.setItem('userAddress', formData.address)
      localStorage.setItem('userDateOfBirth', formData.dateOfBirth)
      localStorage.setItem('userYearOfBirth', formData.yearOfBirth)
      localStorage.setItem('userIdentityNumber', formData.identityNumber)
      localStorage.setItem('userDriverLicenseNumber', formData.driverLicenseNumber)
      localStorage.setItem('userDriverLicenseExpiry', formData.driverLicenseExpiry)
      localStorage.setItem('userDriverLicenseClass', formData.driverLicenseClass)

      setNotification({
        isOpen: true,
        type: 'success',
        title: 'Success! ✅',
        message: 'Your profile has been updated successfully.',
        autoCloseMs: 2000,
        onAction: () => {
          navigate('/')
        },
        actionLabel: 'Go to Home'
      })
    } catch (err) {
      console.error('❌ Error updating profile:', err)
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Update Failed',
        message: err.response?.data?.message || 'Failed to update profile. Please try again.'
      })
    } finally {
      setLoading(false)
    }
  }

  if (isLoadingProfile) {
    return (
      <div className="update-profile-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading your profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="update-profile-page">
      <NotificationModal
        isOpen={notification.isOpen}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={() => setNotification({ ...notification, isOpen: false })}
        autoCloseMs={notification.autoCloseMs || 0}
        onAction={notification.onAction}
        actionLabel={notification.actionLabel}
      />

      <div className="container">
        <div className="page-header">
          <h1>✏️ Update Your Profile</h1>
          <p style={{ color: 'white' }}>Keep your information up to date to enjoy our services</p>
        </div>

        {missingFields.length > 0 && (
          <div className="warning-banner">
            <span className="warning-icon">⚠️</span>
            <div>
              <strong>Missing Information</strong>
              <p>Please complete the following fields: {missingFields.map(f => 
                f === 'address' ? 'Address' : 
                f === 'driverLicenseNumber' ? 'Driver License Number' :
                f === 'driverLicenseExpiry' ? 'Driver License Expiry' : f
              ).join(', ')}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="update-profile-form">
          {/* Basic Information Section */}
          <div className="form-section">
            <h2 className="section-title">👤 Basic Information</h2>
            
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

              <div className="form-group">
                <label htmlFor="address">
                  Address *
                  {missingFields.includes('address') && <span className="required-badge">Required</span>}
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="123 Main St, City, Country"
                  className={missingFields.includes('address') ? 'field-missing' : ''}
                  required
                />
              </div>
            </div>
          </div>

          {/* Birth Information Section */}
          <div className="form-section">
            <h2 className="section-title">🎂 Birth Information</h2>
            
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
                <label htmlFor="yearOfBirth">Year of Birth (Auto-filled)</label>
                <input
                  type="text"
                  id="yearOfBirth"
                  name="yearOfBirth"
                  value={formData.yearOfBirth}
                  disabled
                  placeholder="Will auto-fill from date above"
                  style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                />
              </div>
            </div>
          </div>

          {/* Driver License Section */}
          <div className="form-section">
            <h2 className="section-title">🚗 Driver License Information *</h2>
            
            <div className={`form-group ${missingFields.includes('driverLicenseNumber') ? 'field-missing-group' : ''}`}>
              <label htmlFor="driverLicenseNumber">
                Driver License Number *
                {missingFields.includes('driverLicenseNumber') && <span className="required-badge">Required</span>}
              </label>
              <input
                type="text"
                id="driverLicenseNumber"
                name="driverLicenseNumber"
                value={formData.driverLicenseNumber}
                onChange={handleChange}
                placeholder="ABC123456"
                className={missingFields.includes('driverLicenseNumber') ? 'field-missing' : ''}
                required
              />
            </div>

            <div className="form-row">
              <div className={`form-group ${missingFields.includes('driverLicenseExpiry') ? 'field-missing-group' : ''}`}>
                <label htmlFor="driverLicenseExpiry">
                  Driver License Expiry *
                  {missingFields.includes('driverLicenseExpiry') && <span className="required-badge">Required</span>}
                </label>
                <input
                  type="date"
                  id="driverLicenseExpiry"
                  name="driverLicenseExpiry"
                  value={formData.driverLicenseExpiry}
                  onChange={handleChange}
                  className={missingFields.includes('driverLicenseExpiry') ? 'field-missing' : ''}
                  required
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
          </div>

          {/* Additional Information Section */}
          <div className="form-section">
            <h2 className="section-title">📋 Additional Information</h2>
            
            <div className={`form-group ${missingFields.includes('identityNumber') ? 'field-missing-group' : ''}`}>
              <label htmlFor="identityNumber">
                Identity Number (CCCD) *
                {missingFields.includes('identityNumber') && <span className="required-badge">Required</span>}
              </label>
              <input
                type="text"
                id="identityNumber"
                name="identityNumber"
                value={formData.identityNumber}
                onChange={handleChange}
                placeholder="123456789012"
                className={missingFields.includes('identityNumber') ? 'field-missing' : ''}
                required
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate(-1)}
              disabled={loading}
            >
              ← Go Back
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? '⏳ Saving...' : '✅ Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
