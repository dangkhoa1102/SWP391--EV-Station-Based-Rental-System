import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function LoginModal(){
  const { showLogin, setShowLogin, login, setShowRegister } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  if(!showLogin) return null

  async function handleSubmit(e){
    e.preventDefault()
    try{
      await login(email, password)
    }catch(err){
      console.error(err)
      setError(err.message || 'Login failed')
    }
  }

  function switchToRegister(){
    setShowLogin(false)
    setShowRegister(true)
  }

  return (
    <div className="modal-overlay" style={{ display: 'flex' }}>
      <div className="modal-content">
        <span className="close-btn" onClick={()=> setShowLogin(false)}>&times;</span>
        <h2>LOGIN</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input type="email" value={email} onChange={e=> setEmail(e.target.value)} placeholder="Enter Email" required />
            <i className="fas fa-envelope"></i>
          </div>
          <div className="input-group">
            <input type="password" value={password} onChange={e=> setPassword(e.target.value)} placeholder="Enter Password" required />
            <i className="fas fa-lock"></i>
          </div>
          {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
          <button type="submit">Login</button>
          <p className="modal-footer-text">
            Don't have an account? <a href="#" onClick={(e)=>{ e.preventDefault(); switchToRegister(); }}>Register here</a>
          </p>
        </form>
      </div>
    </div>
  )
}
