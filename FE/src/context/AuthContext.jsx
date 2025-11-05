import React, { createContext, useContext, useEffect, useState } from 'react'
import API from '../services/api'
import UserAPI from '../user/services/userApi'

const AuthContext = createContext(null)

export function useAuth(){
  return useContext(AuthContext)
}

export function AuthProvider({ children }){
  const [user, setUser] = useState(() => {
    try{ return JSON.parse(localStorage.getItem('user')) || null }catch(e){ return null }
  })
  const [token, setToken] = useState(() => localStorage.getItem('token') || null)
  const [showLogin, setShowLogin] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [needsProfileUpdate, setNeedsProfileUpdate] = useState(false)
  const [profileData, setProfileData] = useState(null)

  useEffect(()=>{
    if(token){ localStorage.setItem('token', token) } else { localStorage.removeItem('token') }
  },[token])

  useEffect(()=>{
    if(user){ localStorage.setItem('user', JSON.stringify(user)); if(user.email) localStorage.setItem('userEmail', user.email) }
    else { localStorage.removeItem('user'); localStorage.removeItem('userEmail') }
  }, [user])

  // Check if renter profile is incomplete after login
  const checkProfileCompletion = async (userRole) => {
    try {
      // Only check for renter role
      if (userRole !== 'renter' && userRole !== 'Renter') {
        console.log('⏭️ User is not a renter, skipping profile check')
        return false
      }

      console.log('📋 Checking renter profile completion...')
      const profileData = await UserAPI.getMyProfile()
      console.log('📄 Profile data:', profileData)

      // Check if any required fields are missing (null or empty)
      const incompleteFields = []
      if (!profileData?.address && profileData?.address !== false) incompleteFields.push('Address')
      if (!profileData?.dateOfBirth && profileData?.dateOfBirth !== false) incompleteFields.push('Date of Birth')
      if (!profileData?.driverLicenseNumber && profileData?.driverLicenseNumber !== false) incompleteFields.push('Driver License Number')
      if (!profileData?.driverLicenseExpiry && profileData?.driverLicenseExpiry !== false) incompleteFields.push('Driver License Expiry')

      if (incompleteFields.length > 0) {
        console.log('⚠️ Profile incomplete, missing fields:', incompleteFields)
        setProfileData(profileData)
        setNeedsProfileUpdate(true)
        return true
      } else {
        console.log('✅ Profile complete')
        setNeedsProfileUpdate(false)
        return false
      }
    } catch (err) {
      console.error('❌ Error checking profile:', err)
      return false
    }
  }

  async function login(email, password){
    const res = await API.login(email, password)
    // API.login saves token to localStorage already but we keep state
    const newToken = res.token || res.payload?.token || res.raw?.token
    if(newToken) setToken(newToken)
    const payloadUser = res.payload?.user || res.raw?.user || (res.payload && res.payload.user) || JSON.parse(localStorage.getItem('user'))
    if(payloadUser) {
      setUser(payloadUser)
      
      // Check profile completion for renter users
      const userRole = payloadUser.role || payloadUser.Role || 'renter'
      await checkProfileCompletion(userRole)
    }
    setShowLogin(false)
    return res
  }

  async function register(fullName, email, phoneNumber, password){
    const res = await API.register(fullName, email, phoneNumber, password)
    return res
  }

  function logout(){
    setToken(null)
    setUser(null)
    setNeedsProfileUpdate(false)
    setProfileData(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('userEmail')
  }

  const value = {
    user,
    token,
    login,
    logout,
    register,
    showLogin,
    setShowLogin,
    showRegister,
    setShowRegister,
    needsProfileUpdate,
    setNeedsProfileUpdate,
    profileData,
    setProfileData,
    checkProfileCompletion
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext
