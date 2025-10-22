import React, { useEffect, useState, useRef } from 'react'
import API from '../../services/api'
import { uploadToCloudinary } from '../../utils/cloudinary'
import '../../styles/user_profile.css'

export default function UserProfile(){
  const [profile, setProfile] = useState({})
  const [documents, setDocuments] = useState({
    cccdFront: '',
    cccdBack: '',
    licenseFront: '',
    licenseBack: ''
  })
  const [uploading, setUploading] = useState({})
  const fileRefs = {
    cccdFront: useRef(null),
    cccdBack: useRef(null),
    licenseFront: useRef(null),
    licenseBack: useRef(null)
  }

  useEffect(()=>{
    const load = async ()=>{
      try{
        const data = await API.getMyProfile()
        setProfile(data || {})
        // Load documents if stored
        setDocuments({
          cccdFront: localStorage.getItem('cccdFront') || '',
          cccdBack: localStorage.getItem('cccdBack') || '',
          licenseFront: localStorage.getItem('licenseFront') || '',
          licenseBack: localStorage.getItem('licenseBack') || ''
        })
      }catch(e){
        // fallback to localStorage
        const userEmail = localStorage.getItem('userEmail')
        const username = localStorage.getItem('username')
        const userPhone = localStorage.getItem('userPhone')
        setProfile({ email: userEmail, fullName: username, phoneNumber: userPhone })
      }
    }
    load()
  },[])

  const handleFileUpload = async (type, file) => {
    if(!file) return
    if(!file.type.startsWith('image/')){ 
      alert('Please select an image file')
      return 
    }
    if(file.size > 5*1024*1024){ 
      alert('File must be <5MB')
      return 
    }
    
    setUploading(prev => ({...prev, [type]: true}))
    try{
      const res = await uploadToCloudinary(file)
      setDocuments(prev => ({...prev, [type]: res.url}))
      localStorage.setItem(type, res.url)
      
      // Optionally update backend
      const userId = localStorage.getItem('userId')
      if(userId){
        // await API.updateUserDocument(userId, type, res.url)
      }
    }catch(err){
      console.error(err)
      alert('Upload failed')
    }finally{
      setUploading(prev => ({...prev, [type]: false}))
    }
  }

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

        {/* Document Upload Section */}
        <div className="documents-section">
          <h3>Upload Documents</h3>
          <p className="documents-note">Please upload clear images of your ID card and driver's license (both sides)</p>
          
          <div className="documents-grid">
            {/* CCCD Front */}
            <div className="document-upload-box">
              <label>ID (Front)</label>
              <div className="upload-area" onClick={()=> fileRefs.cccdFront.current?.click()}>
                {documents.cccdFront ? (
                  <img src={documents.cccdFront} alt="CCCD Front" className="doc-preview" />
                ) : (
                  <div className="upload-placeholder">
                    <i className="fas fa-id-card"></i>
                    <span>Click to upload</span>
                  </div>
                )}
                {uploading.cccdFront && <div className="upload-overlay">Uploading...</div>}
              </div>
              <input ref={fileRefs.cccdFront} type="file" accept="image/*" style={{ display: 'none' }} onChange={e=> handleFileUpload('cccdFront', e.target.files?.[0])} />
            </div>

            {/* CCCD Back */}
            <div className="document-upload-box">
              <label>ID (Back)</label>
              <div className="upload-area" onClick={()=> fileRefs.cccdBack.current?.click()}>
                {documents.cccdBack ? (
                  <img src={documents.cccdBack} alt="CCCD Back" className="doc-preview" />
                ) : (
                  <div className="upload-placeholder">
                    <i className="fas fa-id-card"></i>
                    <span>Click to upload</span>
                  </div>
                )}
                {uploading.cccdBack && <div className="upload-overlay">Uploading...</div>}
              </div>
              <input ref={fileRefs.cccdBack} type="file" accept="image/*" style={{ display: 'none' }} onChange={e=> handleFileUpload('cccdBack', e.target.files?.[0])} />
            </div>

            {/* License Front */}
            <div className="document-upload-box">
              <label>Driver license (Front)</label>
              <div className="upload-area" onClick={()=> fileRefs.licenseFront.current?.click()}>
                {documents.licenseFront ? (
                  <img src={documents.licenseFront} alt="License Front" className="doc-preview" />
                ) : (
                  <div className="upload-placeholder">
                    <i className="fas fa-id-card-alt"></i>
                    <span>Click to upload</span>
                  </div>
                )}
                {uploading.licenseFront && <div className="upload-overlay">Uploading...</div>}
              </div>
              <input ref={fileRefs.licenseFront} type="file" accept="image/*" style={{ display: 'none' }} onChange={e=> handleFileUpload('licenseFront', e.target.files?.[0])} />
            </div>

            {/* License Back */}
            <div className="document-upload-box">
              <label>Driver license (Back)</label>
              <div className="upload-area" onClick={()=> fileRefs.licenseBack.current?.click()}>
                {documents.licenseBack ? (
                  <img src={documents.licenseBack} alt="License Back" className="doc-preview" />
                ) : (
                  <div className="upload-placeholder">
                    <i className="fas fa-id-card-alt"></i>
                    <span>Click to upload</span>
                  </div>
                )}
                {uploading.licenseBack && <div className="upload-overlay">Uploading...</div>}
              </div>
              <input ref={fileRefs.licenseBack} type="file" accept="image/*" style={{ display: 'none' }} onChange={e=> handleFileUpload('licenseBack', e.target.files?.[0])} />
            </div>
          </div>
        </div>

      </div>
    </main>
  )
}
