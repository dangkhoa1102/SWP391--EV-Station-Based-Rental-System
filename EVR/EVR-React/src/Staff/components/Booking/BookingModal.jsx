// src/components/Booking/BookingModal.jsx
import React from 'react';

export default function BookingModal({ booking, onClose, onConfirm, onComplete, onDeny }) {
  if (!booking) return null;

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
                <span id="modalIDValue" style={{fontWeight:600}}>{booking.idString}</span>
                <label><input type="checkbox" id="checkID" /> Verified</label>
              </div>
            </div>

            <div className="bg-gray-100" style={{padding:14, borderRadius:10, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <span style={{fontWeight:600}}>Face Photo:</span>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <input id="uploadFace" type="file" accept="image/*" disabled={!!booking.facePhoto} />
                <label><input type="checkbox" id="checkFace" defaultChecked={!!booking.facePhoto} /> Verified</label>
              </div>
            </div>

            <div className="bg-gray-100" style={{padding:14, borderRadius:10, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <span style={{fontWeight:600}}>Phone Number:</span>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <input id="customerPhone" defaultValue={booking.phone} style={{padding:6}} />
                <label><input type="checkbox" id="checkPhone" /> Verified</label>
              </div>
            </div>

            <div style={{background:'#e3f2fd', padding:14, borderRadius:10, display:'flex', gap:12, justifyContent:'center'}}>
              <button id="confirmBookingBtn" onClick={onConfirm} style={{background:'#43a047', color:'white', padding:'8px 16px', borderRadius:14}}>Confirm Booking</button>
              <button id="completeBookingBtn" onClick={onComplete} style={{background:'#1565c0', color:'white', padding:'8px 16px', borderRadius:14}}>Mark as Completed</button>
              <button id="denyBookingBtn" onClick={onDeny} style={{background:'#e53935', color:'white', padding:'8px 16px', borderRadius:14}}>Deny Booking</button>
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
