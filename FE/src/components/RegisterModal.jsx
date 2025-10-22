import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function RegisterModal(){
  const { showRegister, setShowRegister, register } = useAuth()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  if(!showRegister) return null

  async function handleSubmit(e){
    e.preventDefault()
    try{
      await register(username, email, phone, password)
      setShowRegister(false)
    }catch(err){
      console.error(err)
      setError(err.message || 'Registration failed')
    }
  }

  return (
    <div className="modal-overlay" style={{ display: 'flex' }}>
      <div className="modal-content">
        <span className="close-btn" onClick={()=> setShowRegister(false)}>&times;</span>
        <h2>Register</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input value={username} onChange={e=> setUsername(e.target.value)} placeholder="Username" required />
            <i className="fas fa-user"></i>
          </div>
          <div className="input-group">
            <input type="email" value={email} onChange={e=> setEmail(e.target.value)} placeholder="Email" required />
            <i className="fas fa-envelope"></i>
          </div>
          <div className="input-group">
            <input value={phone} onChange={e=> setPhone(e.target.value)} placeholder="Phone" required />
            <i className="fas fa-phone"></i>
          </div>
          <div className="input-group">
            <input type="password" value={password} onChange={e=> setPassword(e.target.value)} placeholder="Password" required />
            <i className="fas fa-lock"></i>
          </div>
          {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
          <button type="submit">Create Account</button>
          <p className="modal-footer-text">
            Already have an account? <a href="#" onClick={(e)=>{ e.preventDefault(); setShowRegister(false); }}>Login here</a>
          </p>
        </form>
      </div>
    </div>
  )
}
