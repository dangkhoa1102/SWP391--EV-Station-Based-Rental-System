import React, { useState } from 'react';
import '../../styles/modals.css';

export default function CreateIncidentModal({ open, onClose, onSubmit, bookings = [] }) {
  const [bookingId, setBookingId] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  // Only allow creating incidents for bookings that are in Checked-in state.
  // Different backends may represent status differently; prefer normalized `status` if present.
  const allowedBookings = (bookings || []).filter(b => {
    const s = String(b?.status || '').toLowerCase();
    const label = String(b?.statusLabel || '').toLowerCase();
    const code = Number(b?.bookingStatus)

    // Accept when normalized status explicitly indicates checked-in
    const isStatusChecked = ['checked-in', 'checkedin', 'checked_in', 'checked in', 'checked'].includes(s)
    // Accept when numeric status code equals the checked-in code (3 in our mapping)
    const isCodeChecked = Number.isFinite(code) && code === 3

    // Accept label that clearly indicates checked-in, but reject labels that say "waiting" or "pending"
    const isLabelChecked = (
      label.includes('checked-in') ||
      label.includes('checked in') ||
      (label.includes('checked') && !label.includes('wait') && !label.includes('waiting') && !label.includes('pending'))
    )

    return isStatusChecked || isCodeChecked || isLabelChecked
  })

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate file types and sizes
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      const maxSize = 25 * 1024 * 1024; // 25MB
      
      if (!validTypes.includes(file.type)) {
        setError(`Invalid file type: ${file.name}. Only JPG, PNG, GIF allowed.`);
        return false;
      }
      if (file.size > maxSize) {
        setError(`File too large: ${file.name}. Max 25MB per file.`);
        return false;
      }
      return true;
    });

    setImages(validFiles);
    
    // Create previews
    const previews = validFiles.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    
    // Revoke URL to free memory
    URL.revokeObjectURL(imagePreviews[index]);
    
    setImages(newImages);
    setImagePreviews(newPreviews);
  };

  const handleSubmit = async () => {
    setError('');
    
    if (!bookingId) {
      setError('Please select a booking');
      return;
    }
    
    if (!description.trim()) {
      setError('Please provide incident description');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('bookingId', bookingId);
      formData.append('description', description.trim());
      
      images.forEach(image => {
        formData.append('images', image);
      });

      await onSubmit(formData);
      
      // Reset form
      setBookingId('');
      setDescription('');
      setImages([]);
      imagePreviews.forEach(url => URL.revokeObjectURL(url));
      setImagePreviews([]);
      onClose();
    } catch (e) {
      setError(e?.message || 'Failed to create incident');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{display: 'flex'}}>
      <div className="modal-content" style={{maxWidth: '650px', width: '90%', maxHeight: '90vh', overflow: 'auto'}}>
        <span className="close-btn" onClick={onClose}>&times;</span>
        
        <h3 style={{marginTop: 0, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px'}}>
          <i className="fas fa-exclamation-triangle" style={{color: '#f59e0b'}}></i>
          Report Incident
        </h3>

        {error && (
          <div style={{
            background: '#fee2e2',
            color: '#b91c1c',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '14px'
          }}>
            <i className="fas fa-exclamation-circle"></i> {error}
          </div>
        )}

        <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
          {/* Booking Selection */}
          <div>
            <label style={{display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px'}}>
              Select Booking <span style={{color: '#dc2626'}}>*</span>
            </label>
            {allowedBookings.length === 0 ? (
              <div style={{padding: '10px', border: '1px solid #f3f4f6', borderRadius: 8, color: '#6b7280'}}>No bookings in "Checked-in" state available.</div>
            ) : (
              <select
                value={bookingId}
                onChange={e => setBookingId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              >
                <option value="">-- Select Booking --</option>
                {allowedBookings.map(booking => (
                  <option key={booking.id} value={booking.id}>
                    Booking #{String(booking.id).slice(0, 8)} - {booking.title || booking.vehicleName || 'Vehicle'} ({booking.statusLabel || booking.status})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Description */}
          <div>
            <label style={{display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px'}}>
              Incident Description <span style={{color: '#dc2626'}}>*</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the incident in detail..."
              rows={5}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
          </div>

          {/* Image Upload */}
          <div>
            <label style={{display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px'}}>
              Upload Images (Optional)
            </label>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.gif"
              multiple
              onChange={handleImageChange}
              disabled={allowedBookings.length === 0}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: allowedBookings.length === 0 ? 'not-allowed' : 'pointer',
                opacity: allowedBookings.length === 0 ? 0.6 : 1
              }}
            />
            <p style={{fontSize: '12px', color: '#6b7280', marginTop: '4px'}}>
              Max 25MB per file. Formats: JPG, PNG, GIF
            </p>
          </div>

          {/* Image Previews */}
          {imagePreviews.length > 0 && (
            <div>
              <label style={{display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px'}}>
                Preview ({imagePreviews.length} image{imagePreviews.length > 1 ? 's' : ''})
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                gap: '12px'
              }}>
                {imagePreviews.map((preview, index) => (
                  <div key={index} style={{position: 'relative'}}>
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      style={{
                        width: '100%',
                        height: '120px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        border: '2px solid #e5e7eb'
                      }}
                    />
                    <button
                      onClick={() => removeImage(index)}
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        background: '#dc2626',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px'}}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '10px 24px',
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || allowedBookings.length === 0}
            style={{
              padding: '10px 24px',
              background: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Creating...
              </>
            ) : (
              <>
                <i className="fas fa-plus"></i>
                Create Incident
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
