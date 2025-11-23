// src/components/Booking/BookingModal.jsx
import React, { useEffect, useState } from 'react';
import '../../styles/modals.css';
import StaffAPI from '../../../../services/staffApi';
import carApi from '../../../../services/carApi';
import authApi from '../../../../services/authApi';
import BookingModalLayout from '../../../../components/Booking/BookingModalLayout'
import { mapStatusFromRaw, formatBookingDate } from '../../../../utils/bookingUtils'

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
  const [carImage, setCarImage] = useState(null)
  const [qrCode, setQrCode] = useState('')
  const [userDetails, setUserDetails] = useState(null)
  const [loadingUserDetails, setLoadingUserDetails] = useState(false)

  useEffect(() => {
    if (!booking) return
    // Reset verifications on booking change
    setVerifiedFront(false)
    setVerifiedBack(false)
    setVerifiedLicenseFront(false)
    setVerifiedLicenseBack(false)
    setResolvedFullName('')
    setUserDetails(null)
    setCarImage(null)
    
    // Fetch car image
    const carId = booking.carId || booking.CarId
    if (carId) {
      carApi.getCarById(carId)
        .then(carDetails => {
          const imageUrl = carDetails?.imageUrl || carDetails?.ImageUrl || '/Picture/E car 1.jpg'
          setCarImage(imageUrl)
          console.log('🖼️ Loaded car image:', imageUrl)
        })
        .catch(err => {
          console.warn('⚠️ Failed to load car image:', err.message)
          setCarImage('/Picture/E car 1.jpg')
        })
    }
    
    // Resolve Customer name via bookingId -> userId -> User table (FirstName + LastName)
    const compose = (f, l) => [f, l].filter(Boolean).join(' ')
    const quick = booking.fullName || compose(booking.firstName, booking.lastName)
    const isPlaceholder = !quick || /^customer$/i.test(quick) || quick === '—'
    if (!isPlaceholder) { setResolvedFullName(quick) }
    
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
    
    // Fetch user details including CCCD/GPLX images
    async function fetchUserDetails() {
      if (!booking.userId) {
        console.warn('⚠️ No userId in booking')
        return
      }
      setLoadingUserDetails(true)
      try {
        console.log('🔍 Fetching user details for userId:', booking.userId)
        const user = await authApi.getUserById(booking.userId)
        if (!cancelled) {
          setUserDetails(user)
          console.log('✅ Fetched user details:', user)
          console.log('📷 CCCD Images:', {
            cccdFrontUrl: user?.cccdFrontUrl,
            identityFrontUrl: user?.identityFrontUrl,
            idFrontUrl: user?.idFrontUrl,
            cccdImageUrl_Front: user?.cccdImageUrl_Front,
            cccdBackUrl: user?.cccdBackUrl,
            identityBackUrl: user?.identityBackUrl,
            idBackUrl: user?.idBackUrl,
            cccdImageUrl_Back: user?.cccdImageUrl_Back,
          })
          console.log('🎓 GPLX Images:', {
            gplxFrontUrl: user?.gplxFrontUrl,
            driverLicenseFrontUrl: user?.driverLicenseFrontUrl,
            gplxImageUrl_Front: user?.gplxImageUrl_Front,
            gplxBackUrl: user?.gplxBackUrl,
            driverLicenseBackUrl: user?.driverLicenseBackUrl,
            gplxImageUrl_Back: user?.gplxImageUrl_Back,
          })
        }
      } catch (e) {
        console.warn('⚠️ Failed to fetch user details:', e?.message || e)
        console.error('Full error:', e)
        if (!cancelled) setUserDetails(null)
      } finally {
        if (!cancelled) setLoadingUserDetails(false)
      }
    }
    
    resolveName()
    fetchUserDetails()
    return () => { cancelled = true }
  }, [booking])

  if (!booking) return null;

  // For staff check-in, require both CCCD and Driver License front/back to be verified
  const canProceed = booking?.status === 'booked' ? (verifiedFront && verifiedBack && verifiedLicenseFront && verifiedLicenseBack) : false
  const onCancelClick = () => {
    if (!booking) return;
    const reason = window.prompt('Enter a reason for cancellation (optional):', '') || ''
    onCancel?.(booking, reason)
  }

  // Helpers for payment flow when status === 'checked-in' are in utils

  const handleConfirmCheckIn = async () => {
    if (!booking?.id) return
    setErrorMsg('')
    setActionLoading(true)
    try {
      // 1) Create payment (PaymentType = 'Rental')
      const p = await StaffAPI.createPayment(booking.id, 'Rental', 'Rental payment at check-in')
      // Persist booking id for success page to sync
      try { localStorage.setItem('currentBookingId', booking.id) } catch {}
      // Extract checkoutUrl and qrCode if present
      const url = p?.checkoutUrl || p?.data?.checkoutUrl || p?.url || ''
      const qr = p?.qrCode || p?.data?.qrCode || ''
      setCheckoutUrl(url)
      setQrCode(qr)
      setPaymentInfo(p)
      // Try to open checkoutUrl in a new tab for the user to pay
      if (url) {
        try { window.open(url, '_blank', 'noopener,noreferrer') } catch {}
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

  return (
    <div id="bookingModal" className="modal-overlay" style={{display: 'flex'}}>
      <div className="modal-content" style={{display:'flex', flexDirection:'column', width:'min(920px,95vw)', maxHeight:'90vh', overflow:'auto', margin:'0 auto'}}>
        <BookingModalLayout booking={booking} onClose={onClose} actions={null}>
          <div style={{display:'flex', gap:24, flexWrap:'wrap'}}>
            <div style={{flex:'0 0 220px', textAlign:'center', margin:'0 auto', display:'flex', flexDirection:'column', alignItems:'center'}}>
              <img id="modalImage" src={carImage || '/Picture/E car 1.jpg'} alt="Vehicle" onError={e => e.currentTarget.src = '/Picture/E car 1.jpg'} style={{width:'100%', height:160, borderRadius:8, objectFit:'cover', display:'block'}} />
              <h3 id="modalTitle" style={{marginTop:12}}>{booking.title}</h3>
              <div id="modalStatus" style={{marginTop:6}}>Status: {booking.statusLabel || booking.status}</div>
              <div id="modalVehicle" style={{marginTop:4, color:'#555'}}>Vehicle: {booking.title || booking.carName || booking.vehicleName || booking.car?.name || booking.car?.Name || '—'}</div>
              <div id="modalCustomer" style={{marginTop:6}}>
                Customer: {resolvedFullName || booking.fullName || [booking.firstName, booking.lastName].filter(Boolean).join(' ') || booking.customer || (loadingName ? 'Loading…' : '—')}
              </div>
              <div id="modalDate" style={{marginTop:2}}>Date: {formatBookingDate(booking.date)}</div>
            </div>

            <div style={{flex:'1 1 380px', display:'flex', flexDirection:'column', gap:14}}>
            {/* Pickup Date */}
            <div className="bg-gray-100" style={{padding:14, borderRadius:10, display:'flex', justifyContent:'space-between'}}>
              <span style={{fontWeight:600}}>Pickup Date:</span>
              <div style={{display:'flex', alignItems:'center', gap:12}}>
                <span id="pickupDate" style={{fontWeight:600}}>{booking.pickupDate || booking.startDate || booking.date || '—'}</span>
              </div>
            </div>

            {/* Return Date */}
            <div className="bg-gray-100" style={{padding:14, borderRadius:10, display:'flex', justifyContent:'space-between'}}>
              <span style={{fontWeight:600}}>Return Date:</span>
              <div style={{display:'flex', alignItems:'center', gap:12}}>
                <span id="returnDate" style={{fontWeight:600}}>{booking.returnDate || booking.endDate || '—'}</span>
              </div>
            </div>

            {/* CCCD/ID Number Display - from User API */}
            <div className="bg-gray-100" style={{padding:14, borderRadius:10, display:'flex', justifyContent:'space-between'}}>
              <span style={{fontWeight:600}}>ID Number (CMND/CCCD):</span>
              <div style={{display:'flex', alignItems:'center', gap:12}}>
                <span id="modalIDValue" style={{fontWeight:600}}>
                  {loadingUserDetails ? 'Loading...' : (userDetails?.identityNumber || userDetails?.idNumber || userDetails?.cmnd || booking.idString || '—')}
                </span>
              </div>
            </div>

            {/* Address Display - from User API */}
            <div className="bg-gray-100" style={{padding:14, borderRadius:10, display:'flex', justifyContent:'space-between'}}>
              <span style={{fontWeight:600}}>Address:</span>
              <div style={{display:'flex', alignItems:'center', gap:12}}>
                <span id="modalAddressValue" style={{fontWeight:600}}>
                  {loadingUserDetails ? 'Loading...' : (userDetails?.address || booking.address || '—')}
                </span>
              </div>
            </div>

            {/* CCCD Front/Back Images with verification checkboxes - only when status is Booked (1) */}
            {booking.status === 'booked' && (
              <div className="bg-gray-100" style={{padding:14, borderRadius:10}}>
                <div style={{fontWeight:600, marginBottom:8}}>CCCD Images: {loadingUserDetails && '(Loading...)'}</div>
                <div style={{display:'flex', gap:16, flexWrap:'wrap'}}>
                  <div style={{flex:'1 1 180px', minWidth:160}}>
                    <div style={{marginBottom:6}}>Front</div>
                    {(userDetails?.cccdFrontUrl || userDetails?.identityFrontUrl || userDetails?.idFrontUrl || userDetails?.cccdImageUrl_Front || booking.cccdFrontUrl) ? (
                      <a href={userDetails?.cccdFrontUrl || userDetails?.identityFrontUrl || userDetails?.idFrontUrl || userDetails?.cccdImageUrl_Front || booking.cccdFrontUrl} target="_blank" rel="noreferrer">
                        <img src={userDetails?.cccdFrontUrl || userDetails?.identityFrontUrl || userDetails?.idFrontUrl || userDetails?.cccdImageUrl_Front || booking.cccdFrontUrl} alt="CCCD Front" style={{width:'100%', height:120, objectFit:'cover', borderRadius:8, border:'1px solid #eee'}} />
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
                    {(userDetails?.cccdBackUrl || userDetails?.identityBackUrl || userDetails?.idBackUrl || userDetails?.cccdImageUrl_Back || booking.cccdBackUrl) ? (
                      <a href={userDetails?.cccdBackUrl || userDetails?.identityBackUrl || userDetails?.idBackUrl || userDetails?.cccdImageUrl_Back || booking.cccdBackUrl} target="_blank" rel="noreferrer">
                        <img src={userDetails?.cccdBackUrl || userDetails?.identityBackUrl || userDetails?.idBackUrl || userDetails?.cccdImageUrl_Back || booking.cccdBackUrl} alt="CCCD Back" style={{width:'100%', height:120, objectFit:'cover', borderRadius:8, border:'1px solid #eee'}} />
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
                <div style={{fontWeight:600, marginBottom:8}}>Driver License (GPLX) Images: {loadingUserDetails && '(Loading...)'}</div>
                <div style={{display:'flex', gap:16, flexWrap:'wrap'}}>
                  <div style={{flex:'1 1 180px', minWidth:160}}>
                    <div style={{marginBottom:6}}>Front</div>
                    {(userDetails?.gplxFrontUrl || userDetails?.driverLicenseFrontUrl || userDetails?.gplxImageUrl_Front || booking.gplxFrontUrl) ? (
                      <a href={userDetails?.gplxFrontUrl || userDetails?.driverLicenseFrontUrl || userDetails?.gplxImageUrl_Front || booking.gplxFrontUrl} target="_blank" rel="noreferrer">
                        <img src={userDetails?.gplxFrontUrl || userDetails?.driverLicenseFrontUrl || userDetails?.gplxImageUrl_Front || booking.gplxFrontUrl} alt="GPLX Front" style={{width:'100%', height:120, objectFit:'cover', borderRadius:8, border:'1px solid #eee'}} />
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
                    {(userDetails?.gplxBackUrl || userDetails?.driverLicenseBackUrl || userDetails?.gplxImageUrl_Back || booking.gplxBackUrl) ? (
                      <a href={userDetails?.gplxBackUrl || userDetails?.driverLicenseBackUrl || userDetails?.gplxImageUrl_Back || booking.gplxBackUrl} target="_blank" rel="noreferrer">
                        <img src={userDetails?.gplxBackUrl || userDetails?.driverLicenseBackUrl || userDetails?.gplxImageUrl_Back || booking.gplxBackUrl} alt="GPLX Back" style={{width:'100%', height:120, objectFit:'cover', borderRadius:8, border:'1px solid #eee'}} />
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

            {/* Phone - no checkbox, with call link - from User API */}
            <div className="bg-gray-100" style={{padding:14, borderRadius:10, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <span style={{fontWeight:600}}>Phone Number:</span>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span id="customerPhone" style={{padding:6}}>
                  {loadingUserDetails ? 'Loading...' : (userDetails?.phoneNumber || userDetails?.phone || booking.phone || '—')}
                </span>
                {(userDetails?.phoneNumber || userDetails?.phone || booking.phone) && (
                  <a href={`tel:${userDetails?.phoneNumber || userDetails?.phone || booking.phone}`} style={{background:'#1565c0', color:'#fff', padding:'6px 10px', borderRadius:6, textDecoration:'none'}}>Call</a>
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
                <button onClick={() => onProceed?.(booking, 'checkout')} style={{background:'#d32f2f', color:'#fff', width:'100%', padding:'12px', borderRadius:6, border:'none', cursor:'pointer', fontWeight:600, fontSize:14}}>
                  Check Out
                </button>
              )}
              {/* For pending or other statuses, hide actions per requirements */}
            </div>
            {errorMsg && (
              <div style={{marginTop:8, color:'#b00020'}}>{errorMsg}</div>
            )}
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
        </BookingModalLayout>
      </div>
    </div>
  );
}
