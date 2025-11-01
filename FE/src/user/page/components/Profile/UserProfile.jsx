import React, { useEffect, useState, useRef } from 'react'
import API from '../../../services/userApi'
import './user_profile.css'

export default function UserProfile(){
  const [profile, setProfile] = useState({})
  const [documents, setDocuments] = useState({
    cccdFront: '',
    cccdBack: '',
    licenseFront: '',
    licenseBack: ''
  })
  const [uploading, setUploading] = useState({})
  
  // Store selected files before upload
  const [selectedFiles, setSelectedFiles] = useState({
    cccdFront: null,
    cccdBack: null,
    licenseFront: null,
    licenseBack: null
  })
  
  const fileRefs = {
    cccdFront: useRef(null),
    cccdBack: useRef(null),
    licenseFront: useRef(null),
    licenseBack: useRef(null)
  }
  // Keep original uploaded URLs so we can revert previews when user cancels selection
  const originalDocsRef = useRef({})

  useEffect(()=>{
    const load = async ()=>{
      try{
        // Step 1: Fetch user profile info from /api/Users/Get-My-Profile
        console.log('📋 Fetching user profile from /api/Users/Get-My-Profile...')
        const profileData = await API.getMyProfile()
        console.log('👤 User profile:', profileData)
        setProfile(profileData || {})
        
        // Step 2: Fetch document URLs from /api/Auth/me
        console.log('📸 Fetching document URLs from /api/Auth/me...')
        const authRes = await API.getMe()
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
        // Save originals so a user can cancel selection and revert preview
        originalDocsRef.current = { cccdFront, cccdBack, licenseFront, licenseBack }
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
    
    // Store selected file
    setSelectedFiles(prev => ({...prev, [type]: file}))
    
    // Show preview immediately using FileReader
    const reader = new FileReader()
    reader.onload = (e) => {
      setDocuments(prev => ({...prev, [type]: e.target.result}))
    }
    reader.readAsDataURL(file)
    
    console.log(`📁 File selected for ${type}:`, file.name)
  }

  const removeSelectedFile = (type) => {
    // clear selected file and restore previous uploaded url if exists
    setSelectedFiles(prev => ({...prev, [type]: null}))
    const original = originalDocsRef.current?.[type] || ''
    setDocuments(prev => ({...prev, [type]: original}))
    // clear the file input value
    try { fileRefs[type]?.current && (fileRefs[type].current.value = '') } catch(e){}
  }
  
  // Upload CCCD (both front and back)
  const uploadCCCD = async () => {
    const frontFile = selectedFiles.cccdFront
    const backFile = selectedFiles.cccdBack
    
    if (!frontFile && !backFile) {
      alert('Please select at least one CCCD image')
      return
    }
    
    setUploading(prev => ({...prev, cccdFront: true, cccdBack: true}))
    try {
      console.log('📤 Uploading CCCD documents...')
      await API.uploadCCCD(frontFile, backFile)
      
      // Reload documents from API
      const authRes = await API.getMe()
      const authData = authRes || {}
      
      const cccdFront = authData.cccdImageUrl_Front || ''
      const cccdBack = authData.cccdImageUrl_Back || ''
      
      setDocuments(prev => ({...prev, cccdFront, cccdBack}))
      setSelectedFiles(prev => ({...prev, cccdFront: null, cccdBack: null}))
      
      alert('✅ CCCD uploaded successfully!')
    } catch (err) {
      console.error('❌ Error uploading CCCD:', err)
      alert(`❌ Upload failed: ${err.response?.data?.message || err.message}`)
    } finally {
      setUploading(prev => ({...prev, cccdFront: false, cccdBack: false}))
    }
  }
  
  // Upload GPLX (both front and back)
  const uploadGPLX = async () => {
    const frontFile = selectedFiles.licenseFront
    const backFile = selectedFiles.licenseBack
    
    if (!frontFile && !backFile) {
      alert('Please select at least one license image')
      return
    }
    
    setUploading(prev => ({...prev, licenseFront: true, licenseBack: true}))
    try {
      console.log('📤 Uploading license documents...')
      await API.uploadGPLX(frontFile, backFile)
      
      // Reload documents from API
      const authRes = await API.getMe()
      const authData = authRes || {}
      
      const licenseFront = authData.gplxImageUrl_Front || ''
      const licenseBack = authData.gplxImageUrl_Back || ''
      
      setDocuments(prev => ({...prev, licenseFront, licenseBack}))
      setSelectedFiles(prev => ({...prev, licenseFront: null, licenseBack: null}))
      
      alert('✅ License uploaded successfully!')
    } catch (err) {
      console.error('❌ Error uploading license:', err)
      alert(`❌ Upload failed: ${err.response?.data?.message || err.message}`)
    } finally {
      setUploading(prev => ({...prev, licenseFront: false, licenseBack: false}))
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
          <h3>Upload ID Card (CCCD)</h3>
          <p className="documents-note">Please upload clear images of your ID card (both sides)</p>
          
          <div className="documents-grid">
            {/* CCCD Front */}
            <div className="document-upload-box">
              <label>ID (Front)</label>
              <div className="upload-area" onClick={()=> fileRefs.cccdFront.current?.click()}>
                {documents.cccdFront && documents.cccdFront.trim() ? (
                  <img 
                    src={documents.cccdFront} 
                    alt="CCCD Front" 
                    className="doc-preview"
                    onLoad={() => console.log('✅ cccdFront image loaded')}
                    onError={(e) => console.error('❌ Failed to load cccdFront')}
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="upload-placeholder">
                    <i className="fas fa-id-card"></i>
                    <span>{selectedFiles.cccdFront ? selectedFiles.cccdFront.name : 'Click to select'}</span>
                  </div>
                )}
                {uploading.cccdFront && <div className="upload-overlay">Uploading...</div>}
              </div>
              <input ref={fileRefs.cccdFront} type="file" accept="image/*" style={{ display: 'none' }} onChange={e=> handleFileUpload('cccdFront', e.target.files?.[0])} />
              <div className="doc-actions">
                {selectedFiles.cccdFront && (
                  <span className="doc-badge">{selectedFiles.cccdFront.name}</span>
                )}
                {selectedFiles.cccdFront && (
                  <button type="button" className="remove-file-btn" onClick={()=> removeSelectedFile('cccdFront')}>Remove</button>
                )}
              </div>
            </div>

            {/* CCCD Back */}
            <div className="document-upload-box">
              <label>ID (Back)</label>
              <div className="upload-area" onClick={()=> fileRefs.cccdBack.current?.click()}>
                {documents.cccdBack && documents.cccdBack.trim() ? (
                  <img 
                    src={documents.cccdBack} 
                    alt="CCCD Back" 
                    className="doc-preview"
                    onLoad={() => console.log('✅ cccdBack image loaded')}
                    onError={(e) => console.error('❌ Failed to load cccdBack')}
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="upload-placeholder">
                    <i className="fas fa-id-card"></i>
                    <span>{selectedFiles.cccdBack ? selectedFiles.cccdBack.name : 'Click to select'}</span>
                  </div>
                )}
                {uploading.cccdBack && <div className="upload-overlay">Uploading...</div>}
              </div>
              <input ref={fileRefs.cccdBack} type="file" accept="image/*" style={{ display: 'none' }} onChange={e=> handleFileUpload('cccdBack', e.target.files?.[0])} />
              <div className="doc-actions">
                {selectedFiles.cccdBack && (
                  <span className="doc-badge">{selectedFiles.cccdBack.name}</span>
                )}
                {selectedFiles.cccdBack && (
                  <button type="button" className="remove-file-btn" onClick={()=> removeSelectedFile('cccdBack')}>Remove</button>
                )}
              </div>
            </div>
          </div>
          
          <button 
            className="btn-upload-docs" 
            onClick={uploadCCCD}
            disabled={!selectedFiles.cccdFront && !selectedFiles.cccdBack}
          >
            <i className="fas fa-upload"></i> Upload ID Card
          </button>
        </div>

        {/* Driver License Upload Section */}
        <div className="documents-section">
          <h3>Upload Driver License (GPLX)</h3>
          <p className="documents-note">Please upload clear images of your driver's license (both sides)</p>
          
          <div className="documents-grid">
            {/* License Front */}
            <div className="document-upload-box">
              <label>Driver license (Front)</label>
              <div className="upload-area" onClick={()=> fileRefs.licenseFront.current?.click()}>
                {documents.licenseFront && documents.licenseFront.trim() ? (
                  <img 
                    src={documents.licenseFront} 
                    alt="License Front" 
                    className="doc-preview"
                    onLoad={() => console.log('✅ licenseFront image loaded')}
                    onError={(e) => console.error('❌ Failed to load licenseFront')}
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="upload-placeholder">
                    <i className="fas fa-id-card-alt"></i>
                    <span>{selectedFiles.licenseFront ? selectedFiles.licenseFront.name : 'Click to select'}</span>
                  </div>
                )}
                {uploading.licenseFront && <div className="upload-overlay">Uploading...</div>}
              </div>
              <input ref={fileRefs.licenseFront} type="file" accept="image/*" style={{ display: 'none' }} onChange={e=> handleFileUpload('licenseFront', e.target.files?.[0])} />
              <div className="doc-actions">
                {selectedFiles.licenseFront && (
                  <span className="doc-badge">{selectedFiles.licenseFront.name}</span>
                )}
                {selectedFiles.licenseFront && (
                  <button type="button" className="remove-file-btn" onClick={()=> removeSelectedFile('licenseFront')}>Remove</button>
                )}
              </div>
            </div>

            {/* License Back */}
            <div className="document-upload-box">
              <label>Driver license (Back)</label>
              <div className="upload-area" onClick={()=> fileRefs.licenseBack.current?.click()}>
                {documents.licenseBack && documents.licenseBack.trim() ? (
                  <img 
                    src={documents.licenseBack} 
                    alt="License Back" 
                    className="doc-preview"
                    onLoad={() => console.log('✅ licenseBack image loaded')}
                    onError={(e) => console.error('❌ Failed to load licenseBack')}
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="upload-placeholder">
                    <i className="fas fa-id-card-alt"></i>
                    <span>{selectedFiles.licenseBack ? selectedFiles.licenseBack.name : 'Click to select'}</span>
                  </div>
                )}
                {uploading.licenseBack && <div className="upload-overlay">Uploading...</div>}
              </div>
              <input ref={fileRefs.licenseBack} type="file" accept="image/*" style={{ display: 'none' }} onChange={e=> handleFileUpload('licenseBack', e.target.files?.[0])} />
              <div className="doc-actions">
                {selectedFiles.licenseBack && (
                  <span className="doc-badge">{selectedFiles.licenseBack.name}</span>
                )}
                {selectedFiles.licenseBack && (
                  <button type="button" className="remove-file-btn" onClick={()=> removeSelectedFile('licenseBack')}>Remove</button>
                )}
              </div>
            </div>
          </div>
          
          <button 
            className="btn-upload-docs" 
            onClick={uploadGPLX}
            disabled={!selectedFiles.licenseFront && !selectedFiles.licenseBack}
          >
            <i className="fas fa-upload"></i> Upload Driver License
          </button>
        </div>

      </div>
    </main>
  )
}
