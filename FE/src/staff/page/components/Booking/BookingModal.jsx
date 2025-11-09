// src/components/Booking/BookingModal.jsx
import React, { useEffect, useState } from 'react';
import '../../styles/modals.css';
import StaffAPI from '../../../services/staffApi';

export default function BookingModal({ booking, onClose, onProceed, onCancel, onStatusUpdated }) {
  const [verifiedFront, setVerifiedFront] = useState(false)
  const [verifiedBack, setVerifiedBack] = useState(false)
  const [verifiedLicenseFront, setVerifiedLicenseFront] = useState(false)
  const [verifiedLicenseBack, setVerifiedLicenseBack] = useState(false)
  const [resolvedFullName, setResolvedFullName] = useState('')
  const [loadingName, setLoadingName] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [paymentInfo, setPaymentInfo] = useState(null)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [lastSyncAt, setLastSyncAt] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [checkoutUrl, setCheckoutUrl] = useState('')
  const [qrCode, setQrCode] = useState('')
  const [showCheckOutModal, setShowCheckOutModal] = useState(false)
  const [checkOutNotes, setCheckOutNotes] = useState('')
  const [damageFee, setDamageFee] = useState(0)
  const [checkOutResult, setCheckOutResult] = useState(null)

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

  // Helpers for payment flow when status === 'checked-in'
  const mapStatusFromRaw = (raw) => {
    let status = 'booked'
    if (raw != null && (typeof raw === 'number' || /^\d+$/.test(String(raw)))) {
      const code = Number(raw)
      if (code === 0) status = 'pending'
      else if (code === 1) status = 'booked'
      else if (code === 2) status = 'checked-in'
      else if (code === 3) status = 'completed'
      else if (code === 4) status = 'denied'
    } else {
      const s = String(raw || '').toLowerCase()
      if (s.includes('pending') || s.includes('wait')) status = 'pending'
      else if (s.includes('check') && s.includes('in')) status = 'checked-in'
      else if (s.includes('complete') || s.includes('finish')) status = 'completed'
      else if (s.includes('deny') || s.includes('reject') || s.includes('cancel')) status = 'denied'
      else status = 'booked'
    }
    return status
  }

  const handleConfirmCheckIn = async () => {
    if (!booking?.id) return
    setErrorMsg('')
    setActionLoading(true)
    try {
      // 1) Create payment (use numeric enum 1 for Rental per backend)
      // Also persist booking id and a return path so the payment success page can redirect back to staff
      try { localStorage.setItem('currentBookingId', booking.id) } catch {}
      try { localStorage.setItem('postPaymentReturn', '/staff') } catch {}
      const p = await StaffAPI.createPayment(booking.id, 1, 'Rental payment at check-in')
      // Extract checkoutUrl and qrCode if present
      const url = p?.checkoutUrl || p?.data?.checkoutUrl || p?.url || ''
      const qr = p?.qrCode || p?.data?.qrCode || ''
      setCheckoutUrl(url)
      setQrCode(qr)
      setPaymentInfo(p)
      // Try to open checkoutUrl in a new tab for the user to pay
      if (url) {
        try {
          // Redirect current tab so that PayOS can callback to our app and we can continue flow
          window.location.href = url
        } catch (err) {
          try { window.open(url, '_blank', 'noopener,noreferrer') } catch {}
        }
      }
    } catch (e) {
      // If already exists, some backends may return 409 or validation error — continue to sync
      const code = e?.response?.status
      if (code && code !== 400 && code !== 409) {
        setActionLoading(false)
        setErrorMsg(e?.response?.data?.message || e?.message || 'Failed to create payment')
        return
      }
    }
    // Do not auto-sync here; user will scan/pay then we can Retry Sync
    setActionLoading(false)
  }

  const handleRetrySync = async () => {
    if (!booking?.id) return
    setErrorMsg('')
    setActionLoading(true)
    try {
      await StaffAPI.syncPaymentStatus(booking.id)
      setLastSyncAt(new Date())
      const fresh = await StaffAPI.getBookingById(booking.id)
      const rawStatus = fresh?.statusCode ?? fresh?.StatusCode ?? fresh?.bookingStatus ?? fresh?.BookingStatus ?? fresh?.status ?? fresh?.Status
      const mapped = mapStatusFromRaw(rawStatus)
      if (mapped && mapped !== booking.status) {
        onStatusUpdated?.(booking.id, mapped)
        onClose?.()
        return
      }
      alert('Synced. Status unchanged; try again shortly if the gateway is still processing.')
    } catch (e) {
      setErrorMsg(e?.response?.data?.message || e?.message || 'Retry sync failed')
    } finally {
      setActionLoading(false)
    }
  }

  const handleViewPayment = async () => {
    if (!booking?.id) return
    setPaymentLoading(true)
    setErrorMsg('')
    try {
      const p = await StaffAPI.getPaymentByBooking(booking.id)
      setPaymentInfo(p)
    } catch (e) {
      setErrorMsg(e?.response?.data?.message || e?.message || 'Unable to load payment info')
    } finally {
      setPaymentLoading(false)
    }
  }

  const handleCheckOut = async () => {
    if (!booking?.id) return
    setErrorMsg('')
    setActionLoading(true)
    try {
      // Get current staffId from localStorage or resolve it
      let staffId = localStorage.getItem('staffId')
      if (!staffId) {
        staffId = await StaffAPI.resolveStaffId()
      }
      
      const payload = {
        bookingId: booking.id,
        staffId: staffId,
        actualReturnDateTime: new Date().toISOString(),
        checkOutNotes: checkOutNotes,
        checkOutPhotoUrl: '', // Can be extended for photo upload
        damageFee: Number(damageFee) || 0
      }
      
      const result = await StaffAPI.checkOutBooking(payload)
      setCheckOutResult(result)
      
      // Close checkout modal and update booking
      setShowCheckOutModal(false)
      if (onStatusUpdated) {
        onStatusUpdated(booking.id, 'checked-out-pending-payment')
      }
    } catch (e) {
      setErrorMsg(e?.message || 'Check-out failed')
    } finally {
      setActionLoading(false)
    }
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
              {booking.status === 'booked' && (
                <>
                  <button id="checkInBtn" onClick={() => onProceed?.(booking)} disabled={!canProceed} style={{background: canProceed ? '#43a047' : '#9e9e9e', color:'white', padding:'8px 16px', borderRadius:14}}>
                    Check In
                  </button>
                  <button onClick={onCancelClick} style={{background:'#fb8c00', color:'#fff', padding:'8px 16px', borderRadius:14}}>
                    Cancel Booking
                  </button>
                </>
              )}
              {booking.status === 'checked-in' && (
                <>
                  <button onClick={handleConfirmCheckIn} disabled={actionLoading} style={{background:'#43a047', color:'#fff', padding:'8px 16px', borderRadius:14}}>
                    {actionLoading ? 'Processing…' : 'Confirm Check In'}
                  </button>
                  <button onClick={handleRetrySync} disabled={actionLoading} style={{background:'#1565c0', color:'#fff', padding:'8px 16px', borderRadius:14}}>
                    Retry Sync
                  </button>
                  <button onClick={handleViewPayment} disabled={paymentLoading} style={{background:'#455a64', color:'#fff', padding:'8px 16px', borderRadius:14}}>
                    {paymentLoading ? 'Loading…' : 'View Payment Status'}
                  </button>
                </>
              )}
              {booking.status === 'completed' && (
                <>
                  <button onClick={() => setShowCheckOutModal(true)} disabled={actionLoading} style={{background:'#d32f2f', color:'#fff', padding:'8px 16px', borderRadius:14}}>
                    Check Out
                  </button>
                </>
              )}
              {/* For pending or other statuses, hide actions per requirements */}
            </div>
            {errorMsg && (
              <div style={{marginTop:8, color:'#b00020'}}>{errorMsg}</div>
            )}
            {lastSyncAt && (
              <div style={{marginTop:4, color:'#555', fontSize:12}}>Last sync: {lastSyncAt.toLocaleTimeString()}</div>
            )}
            {(qrCode || checkoutUrl) && (
              <div style={{marginTop:12, padding:12, border:'1px solid #e0e0e0', borderRadius:8}}>
                <div style={{fontWeight:600, marginBottom:6}}>Complete Payment</div>
                {qrCode ? (
                  <div style={{display:'flex', alignItems:'center', gap:16, flexWrap:'wrap'}}>
                    <img alt="Pay QR" src={qrCode} style={{width:160, height:160, objectFit:'contain', border:'1px solid #eee', borderRadius:6}} />
                    <div style={{color:'#555'}}>Scan the QR to pay. After payment completes, use "Retry Sync" to update the booking.</div>
                  </div>
                ) : (
                  <div style={{color:'#555'}}>Open the checkout to complete your payment, then return and press "Retry Sync".</div>
                )}
                {checkoutUrl && (
                  <div style={{marginTop:10}}>
                    <a href={checkoutUrl} target="_blank" rel="noreferrer" style={{background:'#1565c0', color:'#fff', padding:'8px 14px', borderRadius:10, textDecoration:'none'}}>Open Checkout</a>
                  </div>
                )}
              </div>
            )}
            {paymentInfo && (
              <div style={{marginTop:12, padding:12, border:'1px solid #eee', borderRadius:8}}>
                <div style={{fontWeight:600, marginBottom:6}}>Payment</div>
                <div>Status: {String(paymentInfo.status || paymentInfo.Status || paymentInfo.paymentStatus || '—')}</div>
                <div>Gateway: {String(paymentInfo.gatewayStatus || paymentInfo.GatewayStatus || paymentInfo.providerStatus || '—')}</div>
                <div>Amount: {paymentInfo.amount ?? paymentInfo.Amount ?? '—'}</div>
                <div>Transaction: {paymentInfo.transactionId || paymentInfo.TransactionId || paymentInfo.txnId || '—'}</div>
                <div>Updated: {paymentInfo.updatedAt || paymentInfo.UpdatedAt || paymentInfo.lastUpdated || '—'}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Check-Out Modal (Bước 5) */}
      {showCheckOutModal && (
        <div className="modal-overlay" style={{display: 'flex'}}>
          <div className="modal-content" style={{display:'flex', flexDirection:'column', width:'min(600px,95vw)', maxHeight:'90vh', overflow:'auto', margin:'0 auto'}}>
            <span className="close-btn" onClick={() => setShowCheckOutModal(false)}>&times;</span>
            <h2 style={{marginTop:0}}>Check Out Vehicle</h2>
            
            <div style={{flex:1, display:'flex', flexDirection:'column', gap:12}}>
              {/* Booking Info */}
              <div style={{padding:12, background:'#f5f5f5', borderRadius:8}}>
                <div><strong>Booking:</strong> {booking?.title || booking?.carName || 'Vehicle'}</div>
                <div><strong>Customer:</strong> {resolvedFullName || booking?.fullName || '—'}</div>
                <div><strong>Expected Return:</strong> {booking?.expectedReturnDateTime || booking?.date || '—'}</div>
              </div>

              {/* Check-Out Notes */}
              <div>
                <label style={{display:'block', marginBottom:6, fontWeight:600}}>Check-Out Notes (optional)</label>
                <textarea 
                  value={checkOutNotes} 
                  onChange={e => setCheckOutNotes(e.target.value)}
                  style={{width:'100%', height:80, padding:8, borderRadius:6, border:'1px solid #ddd', fontFamily:'inherit'}}
                  placeholder="E.g., Vehicle condition, scratches, maintenance notes..."
                />
              </div>

              {/* Damage Fee */}
              <div>
                <label style={{display:'block', marginBottom:6, fontWeight:600}}>Damage Fee (VND)</label>
                <input 
                  type="number" 
                  value={damageFee} 
                  onChange={e => setDamageFee(e.target.value)}
                  style={{width:'100%', padding:10, borderRadius:6, border:'1px solid #ddd', fontSize:14}}
                  placeholder="0"
                  min="0"
                />
              </div>

              {/* Error */}
              {errorMsg && (
                <div style={{padding:10, background:'#ffebee', color:'#b00020', borderRadius:6}}>
                  {errorMsg}
                </div>
              )}

              {/* Check-Out Result Info */}
              {checkOutResult && (
                <div style={{padding:12, background:'#e8f5e9', borderRadius:8, border:'1px solid #4caf50'}}>
                  <div style={{fontWeight:600, marginBottom:8}}>Check-Out Complete</div>
                  <div><strong>Rental Amount:</strong> {checkOutResult?.rentalAmount || checkOutResult?.RentalAmount || '—'} VND</div>
                  <div><strong>Late Fee:</strong> {checkOutResult?.lateFee || checkOutResult?.LateFee || 0} VND</div>
                  <div><strong>Damage Fee:</strong> {checkOutResult?.damageFee || checkOutResult?.DamageFee || 0} VND</div>
                  <div><strong>Extra Payment:</strong> {checkOutResult?.extraAmount || checkOutResult?.ExtraAmount || 0} VND</div>
                  <div><strong>Refund:</strong> {checkOutResult?.refundAmount || checkOutResult?.RefundAmount || 0} VND</div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{display:'flex', gap:10, justifyContent:'center', marginTop:16}}>
              <button 
                onClick={handleCheckOut} 
                disabled={actionLoading} 
                style={{background:'#43a047', color:'#fff', padding:'10px 20px', borderRadius:10, border:'none', cursor:actionLoading?'not-allowed':'pointer'}}
              >
                {actionLoading ? 'Processing...' : 'Complete Check Out'}
              </button>
              <button 
                onClick={() => setShowCheckOutModal(false)} 
                style={{background:'#f5f5f5', color:'#333', padding:'10px 20px', borderRadius:10, border:'1px solid #ddd', cursor:'pointer'}}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
