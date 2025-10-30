// src/components/Booking/BookingModal.jsx
import React, { useEffect, useState } from 'react';
import '../../styles/modals.css';

export default function BookingModal({ booking, onClose, onConfirm, onComplete, onDeny }) {
  const [verifiedId, setVerifiedId] = useState(false)
  const [verifiedFace, setVerifiedFace] = useState(false)
  const [verifiedPhone, setVerifiedPhone] = useState(false)

  useEffect(() => {
    if (!booking) return
    // Reset verifications on booking change; consider face verified only if API provided a face photo
    setVerifiedId(false)
    setVerifiedPhone(false)
    setVerifiedFace(!!booking.facePhoto)
  }, [booking])

  if (!booking) return null;

  const canDecide = verifiedId && verifiedFace && verifiedPhone

  return (
    <div id="bookingModal" className="modal-overlay" style={{display: 'flex'}}>
      <div className="modal-content" style={{display:'flex', flexDirection:'column', width:'min(920px,95vw)', maxHeight:'90vh', overflow:'auto'}}>
        <span className="close-btn" onClick={onClose}>&times;</span>
        <div style={{display:'flex', gap:24, flexWrap:'wrap'}}>
          <div style={{flex:'0 0 220px'}}>
            <img id="modalImage" src={booking.facePhoto || booking.img} alt="" style={{width:'100%', borderRadius:8, objectFit:'cover'}} />
            <h3 id="modalTitle" style={{marginTop:12}}>{booking.title}</h3>
            <div id="modalStatus">Status: {booking.status}</div>
            <div id="modalCustomer">Customer: {booking.customer}</div>
            <div id="modalDate">Date: {booking.date}</div>
          </div>

          <div style={{flex:'1 1 380px', display:'flex', flexDirection:'column', gap:14}}>
            <div className="bg-gray-100" style={{padding:14, borderRadius:10, display:'flex', justifyContent:'space-between'}}>
              <span style={{fontWeight:600}}>ID Card (CMND/CCCD):</span>
              <div style={{display:'flex', alignItems:'center', gap:12}}>
                <span id="modalIDValue" style={{fontWeight:600}}>{booking.idString || '—'}</span>
                <label><input type="checkbox" id="checkID" checked={verifiedId} onChange={e=>setVerifiedId(e.target.checked)} /> Verified</label>
              </div>
            </div>

            <div className="bg-gray-100" style={{padding:14, borderRadius:10, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <span style={{fontWeight:600}}>Face Photo:</span>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                {/* Staff does not upload; face photo should come from API if available */}
                {!booking.facePhoto && (
                  <span style={{color:'#b00020', fontWeight:600}}>No face photo provided by API</span>
                )}
                <label>
                  <input type="checkbox" id="checkFace" checked={verifiedFace} disabled={!booking.facePhoto} onChange={e=>setVerifiedFace(e.target.checked)} /> Verified
                </label>
              </div>
            </div>

            <div className="bg-gray-100" style={{padding:14, borderRadius:10, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <span style={{fontWeight:600}}>Phone Number:</span>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <input id="customerPhone" defaultValue={booking.phone} style={{padding:6}} onChange={() => {}} />
                <label><input type="checkbox" id="checkPhone" checked={verifiedPhone} onChange={e=>setVerifiedPhone(e.target.checked)} /> Verified</label>
              </div>
            </div>

            <div style={{background:'#e3f2fd', padding:14, borderRadius:10, display:'flex', gap:12, justifyContent:'center'}}>
              <button id="confirmBookingBtn" onClick={onConfirm} disabled={!canDecide} style={{background: canDecide ? '#43a047' : '#9e9e9e', color:'white', padding:'8px 16px', borderRadius:14}}>Confirm Booking</button>
              <button id="completeBookingBtn" onClick={onComplete} style={{background:'#1565c0', color:'white', padding:'8px 16px', borderRadius:14}}>Mark as Completed</button>
              <button id="denyBookingBtn" onClick={onDeny} disabled={!canDecide} style={{background: canDecide ? '#e53935' : '#9e9e9e', color:'white', padding:'8px 16px', borderRadius:14}}>Deny Booking</button>
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
