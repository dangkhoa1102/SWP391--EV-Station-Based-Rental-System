import React, { createContext, useContext, useEffect, useState } from 'react'
import authApi from '../services/authApi'

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
  const [showVerifyEmail, setShowVerifyEmail] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)

  useEffect(()=>{
    if(token){ localStorage.setItem('token', token) } else { localStorage.removeItem('token') }
  },[token])

  useEffect(()=>{
    if(user){ localStorage.setItem('user', JSON.stringify(user)); if(user.email) localStorage.setItem('userEmail', user.email) }
    else { localStorage.removeItem('user'); localStorage.removeItem('userEmail') }
  }, [user])

  // Keep auth state in sync across multiple tabs/windows. When another tab
  // updates localStorage (login/logout or role change), update this context's
  // `user` and `token` so components will re-render and honor new permissions.
  useEffect(()=>{
    function handleStorageEvent(e){
      try{
        if(!e){
          // Fallback: resync both values
          setToken(localStorage.getItem('token') || null)
          const raw = localStorage.getItem('user')
          setUser(raw ? JSON.parse(raw) : null)
          return
        }

        if(e.key === 'token'){
          setToken(localStorage.getItem('token') || null)
          return
        }

        if(e.key === 'user'){
          const raw = localStorage.getItem('user')
          try{ setUser(raw ? JSON.parse(raw) : null) }catch(_){ setUser(null) }
          return
        }

        // If userRole or stationId changed, resync user as a fallback so role checks
        // that read from `user` or `localStorage.userRole` will see the latest value.
        if(e.key === 'userRole' || e.key === 'stationId'){
          const raw = localStorage.getItem('user')
          try{ setUser(raw ? JSON.parse(raw) : null) }catch(_){ /* ignore */ }
          return
        }
      }catch(err){
        console.warn('Error handling storage event in AuthContext:', err)
      }
    }

    window.addEventListener('storage', handleStorageEvent)
    return ()=> window.removeEventListener('storage', handleStorageEvent)
  }, [])

  async function login(email, password){
    const res = await authApi.login(email, password)
    // authApi.login saves token to localStorage already but we keep state
    const newToken = res.token || res.payload?.token || res.raw?.token
    if(newToken) setToken(newToken)
    const payloadUser = res.payload?.user || res.raw?.user || (res.payload && res.payload.user) || JSON.parse(localStorage.getItem('user'))
    if(payloadUser) setUser(payloadUser)
    setShowLogin(false)
    return res
  }

  async function register(fullName, email, phoneNumber, password){
    const res = await authApi.register({ fullName, email, phoneNumber, password })
    return res
  }

  function logout(){
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('userEmail')
    localStorage.removeItem('stationId')
    localStorage.removeItem('userRole')
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
    showVerifyEmail,
    setShowVerifyEmail,
    showForgotPassword,
    setShowForgotPassword
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext
