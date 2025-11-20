/**
 * Validation utility for user profile completion
 * Checks if user has filled in all required profile fields
 */

/**
 * Check if user profile is complete
 * @param {Object} profile - User profile object from API
 * @param {Object} documents - Document URLs object (cccdFront, cccdBack, licenseFront, licenseBack)
 * @returns {Object} { isComplete: boolean, missingFields: string[] }
 */
export const isProfileComplete = (profile = {}, documents = {}) => {
  const missingFields = []

  // Check personal information
  if (!profile.fullName || profile.fullName.trim() === '') {
    missingFields.push('Full Name')
  }

  if (!profile.email || profile.email.trim() === '') {
    missingFields.push('Email')
  }

  if (!profile.phoneNumber || profile.phoneNumber.trim() === '') {
    missingFields.push('Phone Number')
  }

  if (!profile.dateOfBirth || profile.dateOfBirth.trim() === '') {
    missingFields.push('Date of Birth')
  }

  // Check documents (CCCD and License)
  if (!documents.cccdFront || documents.cccdFront.trim() === '') {
    missingFields.push('CCCD Front Image')
  }

  if (!documents.cccdBack || documents.cccdBack.trim() === '') {
    missingFields.push('CCCD Back Image')
  }

  if (!documents.licenseFront || documents.licenseFront.trim() === '') {
    missingFields.push('Driver License Front Image')
  }

  if (!documents.licenseBack || documents.licenseBack.trim() === '') {
    missingFields.push('Driver License Back Image')
  }

  return {
    isComplete: missingFields.length === 0,
    missingFields
  }
}

/**
 * Get human-readable message about missing profile fields
 * @param {string[]} missingFields - Array of missing field names
 * @returns {string} Formatted message
 */
export const getMissingFieldsMessage = (missingFields = []) => {
  if (missingFields.length === 0) {
    return 'Profile is complete'
  }

  if (missingFields.length === 1) {
    return `Missing: ${missingFields[0]}`
  }

  if (missingFields.length <= 3) {
    return `Missing: ${missingFields.join(', ')}`
  }

  return `Missing ${missingFields.length} profile fields. Please complete your profile.`
}
