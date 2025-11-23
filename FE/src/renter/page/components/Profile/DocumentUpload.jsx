import React, { useState } from 'react'
import NotificationModal from '../../../../components/NotificationModal'
import authApi from '../../../../services/authApi'
import './document_upload.css'

export default function DocumentUpload({
  documents,
  setDocuments,
  onDocumentUploadSuccess
}) {
  const [selectedFiles, setSelectedFiles] = useState({
    cccdFront: null,
    cccdBack: null,
    licenseFront: null,
    licenseBack: null
  })

  const [uploading, setUploading] = useState({})
  const [notification, setNotification] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  })

  const handleFileUpload = (type, file) => {
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Invalid File Type',
        message: 'Please select an image file (JPG, PNG, etc.)'
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 25 * 1024 * 1024) {
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'File Too Large',
        message: 'Please select a file smaller than 25MB'
      })
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      const previewUrl = e.target.result
      setDocuments(prev => ({
        ...prev,
        [type]: previewUrl
      }))
    }
    reader.readAsDataURL(file)

    // Store selected file
    setSelectedFiles(prev => ({
      ...prev,
      [type]: file
    }))
  }

  const uploadCCCD = async () => {
    const frontFile = selectedFiles.cccdFront
    const backFile = selectedFiles.cccdBack

    if (!frontFile && !backFile) {
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'No Files Selected',
        message: 'Please select at least one CCCD image'
      })
      return
    }

    setUploading(prev => ({...prev, cccdFront: true, cccdBack: true}))

    try {
      await authApi.uploadCCCD(frontFile, backFile)
      
      const authRes = await authApi.getMe()
      const authData = authRes || {}
      
      setDocuments(prev => ({
        ...prev,
        cccdFront: authData.cccdImageUrl_Front || '',
        cccdBack: authData.cccdImageUrl_Back || ''
      }))

      setSelectedFiles(prev => ({
        ...prev,
        cccdFront: null,
        cccdBack: null
      }))

      setNotification({
        isOpen: true,
        type: 'success',
        title: 'Upload Successful',
        message: '✅ CCCD uploaded successfully!',
        autoCloseMs: 2000
      })

      if (onDocumentUploadSuccess) {
        onDocumentUploadSuccess()
      }
    } catch (err) {
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Upload Failed',
        message: err.response?.data?.message || 'Failed to upload CCCD'
      })
    } finally {
      setUploading(prev => ({...prev, cccdFront: false, cccdBack: false}))
    }
  }

  const uploadGPLX = async () => {
    const frontFile = selectedFiles.licenseFront
    const backFile = selectedFiles.licenseBack

    if (!frontFile && !backFile) {
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'No Files Selected',
        message: 'Please select at least one driver license image'
      })
      return
    }

    setUploading(prev => ({...prev, licenseFront: true, licenseBack: true}))

    try {
      await authApi.uploadGPLX(frontFile, backFile)
      
      const authRes = await authApi.getMe()
      const authData = authRes || {}
      
      setDocuments(prev => ({
        ...prev,
        licenseFront: authData.gplxImageUrl_Front || '',
        licenseBack: authData.gplxImageUrl_Back || ''
      }))

      setSelectedFiles(prev => ({
        ...prev,
        licenseFront: null,
        licenseBack: null
      }))

      setNotification({
        isOpen: true,
        type: 'success',
        title: 'Upload Successful',
        message: '✅ Driver License uploaded successfully!',
        autoCloseMs: 2000
      })

      if (onDocumentUploadSuccess) {
        onDocumentUploadSuccess()
      }
    } catch (err) {
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Upload Failed',
        message: err.response?.data?.message || 'Failed to upload driver license'
      })
    } finally {
      setUploading(prev => ({...prev, licenseFront: false, licenseBack: false}))
    }
  }

  return (
    <>
      {/* Document Upload Section */}
      <div className="document-upload-section">
        <h2 className="document-upload-title">📸 Upload Documents</h2>
        <p className="document-upload-description">Upload clear images of your ID card and driver license (both sides)</p>

        {/* CCCD Upload */}
        <div className="document-upload-subsection">
          <h3>ID Card (CCCD)</h3>
          <div className="documents-grid">
            {/* CCCD Front */}
            <div className="document-upload-box">
              <label>ID Card (Front)</label>
              <div className="upload-area" onClick={() => document.getElementById('cccdFront-input').click()}>
                {documents.cccdFront && documents.cccdFront.trim() ? (
                  <img
                    src={documents.cccdFront}
                    alt="CCCD Front"
                    className="doc-preview"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="upload-placeholder">
                    <i className="fas fa-id-card"></i>
                    <span>Click to select</span>
                  </div>
                )}
                {uploading.cccdFront && <div className="upload-overlay">Uploading...</div>}
              </div>
              <input
                id="cccdFront-input"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => handleFileUpload('cccdFront', e.target.files?.[0])}
              />
            </div>

            {/* CCCD Back */}
            <div className="document-upload-box">
              <label>ID Card (Back)</label>
              <div className="upload-area" onClick={() => document.getElementById('cccdBack-input').click()}>
                {documents.cccdBack && documents.cccdBack.trim() ? (
                  <img
                    src={documents.cccdBack}
                    alt="CCCD Back"
                    className="doc-preview"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="upload-placeholder">
                    <i className="fas fa-id-card"></i>
                    <span>Click to select</span>
                  </div>
                )}
                {uploading.cccdBack && <div className="upload-overlay">Uploading...</div>}
              </div>
              <input
                id="cccdBack-input"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => handleFileUpload('cccdBack', e.target.files?.[0])}
              />
            </div>
          </div>
          <button
            type="button"
            className="btn-upload-docs"
            onClick={uploadCCCD}
            disabled={!selectedFiles.cccdFront && !selectedFiles.cccdBack || uploading.cccdFront || uploading.cccdBack}
          >
            <i className="fas fa-upload"></i> Upload ID Card
          </button>
        </div>

        {/* GPLX Upload */}
        <div className="document-upload-subsection">
          <h3>Driver License (GPLX)</h3>
          <div className="documents-grid">
            {/* License Front */}
            <div className="document-upload-box">
              <label>Driver License (Front)</label>
              <div className="upload-area" onClick={() => document.getElementById('licenseFront-input').click()}>
                {documents.licenseFront && documents.licenseFront.trim() ? (
                  <img
                    src={documents.licenseFront}
                    alt="License Front"
                    className="doc-preview"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="upload-placeholder">
                    <i className="fas fa-id-card-alt"></i>
                    <span>Click to select</span>
                  </div>
                )}
                {uploading.licenseFront && <div className="upload-overlay">Uploading...</div>}
              </div>
              <input
                id="licenseFront-input"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => handleFileUpload('licenseFront', e.target.files?.[0])}
              />
            </div>

            {/* License Back */}
            <div className="document-upload-box">
              <label>Driver License (Back)</label>
              <div className="upload-area" onClick={() => document.getElementById('licenseBack-input').click()}>
                {documents.licenseBack && documents.licenseBack.trim() ? (
                  <img
                    src={documents.licenseBack}
                    alt="License Back"
                    className="doc-preview"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="upload-placeholder">
                    <i className="fas fa-id-card-alt"></i>
                    <span>Click to select</span>
                  </div>
                )}
                {uploading.licenseBack && <div className="upload-overlay">Uploading...</div>}
              </div>
              <input
                id="licenseBack-input"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => handleFileUpload('licenseBack', e.target.files?.[0])}
              />
            </div>
          </div>
          <button
            type="button"
            className="btn-upload-docs"
            onClick={uploadGPLX}
            disabled={!selectedFiles.licenseFront && !selectedFiles.licenseBack || uploading.licenseFront || uploading.licenseBack}
          >
            <i className="fas fa-upload"></i> Upload Driver License
          </button>
        </div>
      </div>

      {/* Notification Modal */}
      <NotificationModal
        isOpen={notification.isOpen}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        autoCloseMs={notification.autoCloseMs}
        onClose={() => setNotification(prev => ({...prev, isOpen: false}))}
      />
    </>
  )
}
