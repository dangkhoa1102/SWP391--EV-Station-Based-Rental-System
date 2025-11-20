import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import authApi from '../../../../services/authApi'
import './user_profile.css'
import DocumentUpload from './DocumentUpload'

export default function UserProfile(){
  const navigate = useNavigate()
  const [profile, setProfile] = useState({})
  const [documents, setDocuments] = useState({
    cccdFront: '',
    cccdBack: '',
    licenseFront: '',
    licenseBack: ''
  })

  useEffect(()=>{
    const load = async ()=>{
      try{
        // Step 1: Fetch user profile info from /api/Users/Get-My-Profile
        console.log('📋 Fetching user profile from /api/Users/Get-My-Profile...')
  const profileData = await authApi.getMyProfile()
        console.log('👤 User profile:', profileData)
        setProfile(profileData || {})
        
        // Step 2: Fetch document URLs from /api/Auth/me
        console.log('📸 Fetching document URLs from /api/Auth/me...')
  const authRes = await authApi.getMe()
        console.log('🔐 Auth response from /api/Auth/me:', authRes)
        
        // Extract data - authRes is already extracted data from getMe()
        const authData = authRes || {}
        console.log('📄 Extracted auth data:', authData)
        
        // Load documents - check if URLs exist and are not null
        // Note: API returns cccdImageUrl_Front (capital F), not cccdImageUrl_front
        const cccdFront = (authData.cccdImageUrl_Front && authData.cccdImageUrl_Front.trim()) ? authData.cccdImageUrl_Front : ''
        const cccdBack = (authData.cccdImageUrl_Back && authData.cccdImageUrl_Back.trim()) ? authData.cccdImageUrl_Back : ''
        const licenseFront = (authData.gplxImageUrl_Front && authData.gplxImageUrl_Front.trim()) ? authData.gplxImageUrl_Front : ''
        const licenseBack = (authData.gplxImageUrl_Back && authData.gplxImageUrl_Back.trim()) ? authData.gplxImageUrl_Back : ''
        
        console.log('🖼️ Loaded document URLs:', {cccdFront, cccdBack, licenseFront, licenseBack})
        
        setDocuments({
          cccdFront,
          cccdBack,
          licenseFront,
          licenseBack
        })
      }catch(e){
        console.error('❌ Error loading profile:', e)
        // fallback to localStorage
        const userEmail = localStorage.getItem('userEmail')
        const username = localStorage.getItem('username')
        const userPhone = localStorage.getItem('userPhone')
        setProfile({ email: userEmail, fullName: username, phoneNumber: userPhone })
        setDocuments({
          cccdFront: localStorage.getItem('cccdFront') || '',
          cccdBack: localStorage.getItem('cccdBack') || '',
          licenseFront: localStorage.getItem('licenseFront') || '',
          licenseBack: localStorage.getItem('licenseBack') || ''
        })
      }
    }
    load()
  },[])

  return (
    <main className="profile-main">
      <div className="profile-container">
        <h2>USER PROFILE</h2>

        {/* Profile Fields */}
        <div className="profile-field">
          <label>Full Name</label>
          <input type="text" value={profile.firstName ? `${profile.firstName} ${profile.lastName}` : (profile.fullName || '')} readOnly />
        </div>

        <div className="profile-field">
          <label>Email</label>
          <input type="email" value={profile.email || ''} readOnly />
        </div>

        <div className="profile-field">
          <label>Phone Number</label>
          <input type="tel" value={profile.phoneNumber || ''} readOnly />
        </div>

        {/* Document Upload Component */}
        <DocumentUpload
          documents={documents}
          setDocuments={setDocuments}
          onDocumentUploadSuccess={() => {
            console.log('📄 Document upload successful')
          }}
        />

        {/* Update Profile Button */}
        <div className="profile-actions">
          <button 
            className="btn-update-profile"
            onClick={() => navigate('/update-profile')}
          >
            <i className="fas fa-edit"></i> Update Profile Information
          </button>
        </div>

      </div>
    </main>
  )
}
