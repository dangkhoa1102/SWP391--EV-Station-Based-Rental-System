// src/components/Booking/BookingModal.jsx
import React, { useEffect, useState } from 'react';
import '../../styles/modals.css';
import StaffAPI from '../../../services/staffApi';

export default function BookingModal({ booking, onClose, onProceed, onCancel }) {
  const [verifiedFront, setVerifiedFront] = useState(false)
  const [verifiedBack, setVerifiedBack] = useState(false)
  const [verifiedLicenseFront, setVerifiedLicenseFront] = useState(false)
  const [verifiedLicenseBack, setVerifiedLicenseBack] = useState(false)
  const [resolvedFullName, setResolvedFullName] = useState('')
  const [loadingName, setLoadingName] = useState(false)

  useEffect(() => {
    if (!booking) return
    // Reset verifications on booking change
    setVerifiedFront(false)
    setVerifiedBack(false)
    setVerifiedLicenseFront(false)
    setVerifiedLicenseBack(false)
    setResolvedFullName('')
    // Resolve Customer name via bookingId -> userId -> User table (FirstName + LastName)
    const compose = (f, l) => [f, l].filter(Boolean).join(' ')
  const quick = booking.fullName || compose(booking.firstName, booking.lastName)
  const isPlaceholder = !quick || /^customer$/i.test(quick) || quick === '—'
  if (!isPlaceholder) { setResolvedFullName(quick); return }
    if (!booking.id) return
    let cancelled = false
    async function resolveName() {
      setLoadingName(true)
      try {
        const { firstName, lastName } = await StaffAPI.getUserNameByBookingId(booking.id)
        if (!cancelled) setResolvedFullName(compose(firstName, lastName))
      } catch (e) {
        // ignore, fall back to provided booking fields
      } finally {
        if (!cancelled) setLoadingName(false)
      }
    }
    resolveName()
    return () => { cancelled = true }
  }, [booking])

  if (!booking) return null;

  const canProceed = booking?.status === 'booked' ? (verifiedFront && verifiedBack) : false
  const onCancelClick = () => {
    if (!booking) return;
    const reason = window.prompt('Enter a reason for cancellation (optional):', '') || ''
    onCancel?.(booking, reason)
  }

  return (
    <div id="bookingModal" className="modal-overlay" style={{display: 'flex'}}>
      <div className="modal-content" style={{display:'flex', flexDirection:'column', width:'min(920px,95vw)', maxHeight:'90vh', overflow:'auto', margin:'0 auto'}}>
        <span className="close-btn" onClick={onClose}>&times;</span>
        <div style={{display:'flex', gap:24, flexWrap:'wrap'}}>
          <div style={{flex:'0 0 220px', textAlign:'center', margin:'0 auto', display:'flex', flexDirection:'column', alignItems:'center'}}>
            <img id="modalImage" src={booking.facePhoto || booking.img} alt="" style={{width:'100%', borderRadius:8, objectFit:'cover', display:'block'}} />
            <h3 id="modalTitle" style={{marginTop:12}}>{booking.title}</h3>
            <div id="modalStatus" style={{marginTop:6}}>Status: {booking.statusLabel || booking.status}</div>
            <div id="modalVehicle" style={{marginTop:4, color:'#555'}}>Vehicle: {booking.title || booking.carName || booking.vehicleName || booking.car?.name || booking.car?.Name || '—'}</div>
            <div id="modalCustomer" style={{marginTop:6}}>
              Customer: {resolvedFullName || booking.fullName || [booking.firstName, booking.lastName].filter(Boolean).join(' ') || booking.customer || (loadingName ? 'Loading…' : '—')}
            </div>
            <div id="modalDate" style={{marginTop:2}}>Date: {booking.date}</div>
          </div>

          <div style={{flex:'1 1 380px', display:'flex', flexDirection:'column', gap:14}}>
            {/* CCCD/ID Number Display */}
            <div className="bg-gray-100" style={{padding:14, borderRadius:10, display:'flex', justifyContent:'space-between'}}>
              <span style={{fontWeight:600}}>ID Number (CMND/CCCD):</span>
              <div style={{display:'flex', alignItems:'center', gap:12}}>
                <span id="modalIDValue" style={{fontWeight:600}}>{booking.idString || '—'}</span>
              </div>
            </div>

            {/* Address Display (from user table) */}
            <div className="bg-gray-100" style={{padding:14, borderRadius:10, display:'flex', justifyContent:'space-between'}}>
              <span style={{fontWeight:600}}>Address:</span>
              <div style={{display:'flex', alignItems:'center', gap:12}}>
                <span id="modalAddressValue" style={{fontWeight:600}}>{booking.address || '—'}</span>
              </div>
            </div>

            {/* CCCD Front/Back Images with verification checkboxes - only when status is Booked (1) */}
            {booking.status === 'booked' && (
              <div className="bg-gray-100" style={{padding:14, borderRadius:10}}>
                <div style={{fontWeight:600, marginBottom:8}}>CCCD Images:</div>
                <div style={{display:'flex', gap:16, flexWrap:'wrap'}}>
                  <div style={{flex:'1 1 180px', minWidth:160}}>
                    <div style={{marginBottom:6}}>Front</div>
                    {booking.cccdFrontUrl ? (
                      <a href={booking.cccdFrontUrl} target="_blank" rel="noreferrer">
                        <img src={booking.cccdFrontUrl} alt="CCCD Front" style={{width:'100%', height:120, objectFit:'cover', borderRadius:8, border:'1px solid #eee'}} />
                      </a>
                    ) : (
                      <div style={{height:120, display:'flex', alignItems:'center', justifyContent:'center', background:'#fafafa', border:'1px dashed #ddd', borderRadius:8, color:'#999'}}>No image</div>
                    )}
                    <label style={{display:'block', marginTop:6}}>
                      <input type="checkbox" checked={verifiedFront} onChange={e=>setVerifiedFront(e.target.checked)} /> Verified
                    </label>
                  </div>
                  <div style={{flex:'1 1 180px', minWidth:160}}>
                    <div style={{marginBottom:6}}>Back</div>
                    {booking.cccdBackUrl ? (
                      <a href={booking.cccdBackUrl} target="_blank" rel="noreferrer">
                        <img src={booking.cccdBackUrl} alt="CCCD Back" style={{width:'100%', height:120, objectFit:'cover', borderRadius:8, border:'1px solid #eee'}} />
                      </a>
                    ) : (
                      <div style={{height:120, display:'flex', alignItems:'center', justifyContent:'center', background:'#fafafa', border:'1px dashed #ddd', borderRadius:8, color:'#999'}}>No image</div>
                    )}
                    <label style={{display:'block', marginTop:6}}>
                      <input type="checkbox" checked={verifiedBack} onChange={e=>setVerifiedBack(e.target.checked)} /> Verified
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Driver License (GPLX) Images with verification checkboxes - only when status is Booked (1) */}
            {booking.status === 'booked' && (
              <div className="bg-gray-100" style={{padding:14, borderRadius:10}}>
                <div style={{fontWeight:600, marginBottom:8}}>Driver License (GPLX) Images:</div>
                <div style={{display:'flex', gap:16, flexWrap:'wrap'}}>
                  <div style={{flex:'1 1 180px', minWidth:160}}>
                    <div style={{marginBottom:6}}>Front</div>
                    {booking.gplxFrontUrl ? (
                      <a href={booking.gplxFrontUrl} target="_blank" rel="noreferrer">
                        <img src={booking.gplxFrontUrl} alt="GPLX Front" style={{width:'100%', height:120, objectFit:'cover', borderRadius:8, border:'1px solid #eee'}} />
                      </a>
                    ) : (
                      <div style={{height:120, display:'flex', alignItems:'center', justifyContent:'center', background:'#fafafa', border:'1px dashed #ddd', borderRadius:8, color:'#999'}}>No image</div>
                    )}
                    <label style={{display:'block', marginTop:6}}>
                      <input type="checkbox" checked={verifiedLicenseFront} onChange={e=>setVerifiedLicenseFront(e.target.checked)} /> Verified
                    </label>
                  </div>
                  <div style={{flex:'1 1 180px', minWidth:160}}>
                    <div style={{marginBottom:6}}>Back</div>
                    {booking.gplxBackUrl ? (
                      <a href={booking.gplxBackUrl} target="_blank" rel="noreferrer">
                        <img src={booking.gplxBackUrl} alt="GPLX Back" style={{width:'100%', height:120, objectFit:'cover', borderRadius:8, border:'1px solid #eee'}} />
                      </a>
                    ) : (
                      <div style={{height:120, display:'flex', alignItems:'center', justifyContent:'center', background:'#fafafa', border:'1px dashed #ddd', borderRadius:8, color:'#999'}}>No image</div>
                    )}
                    <label style={{display:'block', marginTop:6}}>
                      <input type="checkbox" checked={verifiedLicenseBack} onChange={e=>setVerifiedLicenseBack(e.target.checked)} /> Verified
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Phone - no checkbox, with call link */}
            <div className="bg-gray-100" style={{padding:14, borderRadius:10, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <span style={{fontWeight:600}}>Phone Number:</span>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span id="customerPhone" style={{padding:6}}>{booking.phone || '—'}</span>
                {booking.phone && (
                  <a href={`tel:${booking.phone}`} style={{background:'#1565c0', color:'#fff', padding:'6px 10px', borderRadius:6, textDecoration:'none'}}>Call</a>
                )}
              </div>
            </div>

            {/* Actions */}
            <div style={{display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap'}}>
              <button id="checkInBtn" onClick={() => onProceed?.(booking)} disabled={!canProceed} style={{background: canProceed ? '#43a047' : '#9e9e9e', color:'white', padding:'8px 16px', borderRadius:14}}>
                Check In
              </button>
              <button onClick={onCancelClick} style={{background:'#fb8c00', color:'#fff', padding:'8px 16px', borderRadius:14}}>
                Cancel Booking
              </button>
            </div>
          </div>
        </div>

  <div id="modalTransactionInfo" style={{marginTop:24, width:'100%', display: booking.status === 'completed' ? 'block' : 'none'}}>
          <h4>Transaction Details</h4>
          <ul style={{fontSize:'1rem'}}>
            <li>Find rental location on map</li>
            <li>View available vehicles (type, battery, price)</li>
            <li>Book in advance or on-site</li>
            <li>Check-in at counter/app</li>
            <li>Sign electronic contract</li>
            <li>Confirm handover with staff (vehicle check, photo)</li>
            <li>Return vehicle at rental location</li>
            <li>Staff checks and confirms vehicle condition</li>
            <li>Pay any additional fees</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
