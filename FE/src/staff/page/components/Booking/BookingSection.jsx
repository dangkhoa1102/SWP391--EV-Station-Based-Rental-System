import React, { useState, useCallback, useRef } from 'react';
import BookingCard from '../../../../components/Booking/BookingCard';
import BookingModel from '../../../../components/Booking/BookingModel';
import WaitingPaymentCard from './WaitingPaymentCard';
import CheckInPaymentCard from './CheckInPaymentCard';
import BookingModal from './BookingModal';
import CheckInCard from './CheckInCard';
import CheckOutCard from './CheckOutCard';
import IncidentsModal from './IncidentsModal';
import StaffAPI from '../../../../services/staffApi';
import './Booking.css';

export default function BookingSection({ bookings, search, setSearch, statusFilter, setStatusFilter, onContinuePayment, onCancelBooking, onStatusUpdated }) {
  const [selected, setSelected] = useState(null);
  const [checkInFor, setCheckInFor] = useState(null);
  const [checkOutFor, setCheckOutFor] = useState(null);
  const [incidentsRefreshKey, setIncidentsRefreshKey] = useState(0);
  const [incidentsInitial, setIncidentsInitial] = useState([])
  
  // Memoize onStatusUpdated to prevent dependency changes
  const memoStatusUpdated = useCallback((bookingId) => {
    if (typeof onStatusUpdated === 'function') {
      onStatusUpdated(bookingId)
    }
  }, [onStatusUpdated])

  // Poll for checkout payment completion
  React.useEffect(() => {
    if (!checkOutFor?.id) return
    
    // Just wait for payment success page redirect, then close modal after a short delay
    const pollInterval = setInterval(async () => {
      try {
        const bookingIdFromStorage = localStorage.getItem('activeCheckOutBookingId')
        if (!bookingIdFromStorage) {
          // Payment was successful and redirected, close the modal
          console.log('✅ Checkout payment completed (user redirected)')
          clearInterval(pollInterval)
          setCheckOutFor(null)
          memoStatusUpdated(checkOutFor?.id)
          return
        }
      } catch (err) {
        console.warn('⏱️ Polling error:', err?.message)
      }
    }, 2000)
    
    return () => clearInterval(pollInterval)
  }, [checkOutFor?.id, memoStatusUpdated])

  // Poll for check-in payment success
  React.useEffect(() => {
    if (!checkInFor?.id) return

    // Track whether we've seen the active key for this booking.
    // Only treat the key being removed as completion if it was previously present.
    const seenCheckInKey = { current: false }

    const pollInterval = setInterval(() => {
      try {
        const bookingIdFromStorage = localStorage.getItem('activeCheckInBookingId')

        if (!seenCheckInKey.current) {
          // Not yet seen the key for this booking. Mark as seen only when it equals this booking id.
          if (bookingIdFromStorage === String(checkInFor.id)) {
            seenCheckInKey.current = true
            console.log('⏱️ Detected active check-in payment flow for', checkInFor.id)
          } else {
            // Payment not started for this booking; do nothing.
            return
          }
        } else {
          // Previously saw the key for this booking. Now if it's gone, consider it completed.
          if (!bookingIdFromStorage) {
            console.log('✅ Check-in payment completed (user redirected)')
            clearInterval(pollInterval)
            setCheckInFor(null)
            memoStatusUpdated(checkInFor?.id)
            return
          }

          // If storage contains a different booking id, reset seen flag
          if (bookingIdFromStorage && bookingIdFromStorage !== String(checkInFor.id)) {
            seenCheckInKey.current = false
          }
        }
      } catch (err) {
        console.warn('⏱️ Polling error (check-in):', err?.message)
      }
    }, 2000)

    return () => clearInterval(pollInterval)
  }, [checkInFor?.id, memoStatusUpdated])

  const filtered = bookings.filter(b =>
    (b.title.toLowerCase().includes(search.toLowerCase()) || (b.customer || '').toLowerCase().includes(search.toLowerCase()) || (b.userName || '').toLowerCase().includes(search.toLowerCase()) || (b.email || '').toLowerCase().includes(search.toLowerCase())) &&
    (statusFilter === '' || b.status === statusFilter)
  );

  const renderBookingCard = (b) => {
    if (b.uiStage === 'waiting-payment') {
      return <WaitingPaymentCard key={b.id} booking={b} onClick={() => setSelected(b)} />
    }
    if (b.uiStage === 'checkin-payment') {
      return <CheckInPaymentCard key={b.id} booking={b} onClick={() => setSelected(b)} />
    }
    return <BookingCard key={b.id} booking={b} onClick={() => setSelected(b)} />
  }

  return (
    <>
      <BookingModel
        bookings={filtered}
        renderBookingCard={renderBookingCard}
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      <BookingModal
        booking={selected}
        onClose={() => setSelected(null)}
        onProceed={(booking, action) => { 
          if (!booking) return
          if (action === 'checkout') {
            setCheckOutFor(booking)
            setSelected(null)
          } else {
            setCheckInFor(booking)
            setSelected(null)
          }
        }}
        onCancel={() => { if (selected) onCancelBooking?.(selected); }}
        onStatusUpdated={onStatusUpdated}
      />

      {checkInFor && (
        <CheckInCard
          booking={checkInFor}
          onClose={() => setCheckInFor(null)}
        />
      )}

      {checkOutFor && (
        <div style={{
          display:'flex', 
          gap:24, 
          position:'fixed', 
          top:0, 
          left:0, 
          right:0, 
          bottom:0, 
          background:'rgba(0,0,0,0.6)', 
          zIndex:1000, 
          alignItems:'center', 
          justifyContent:'center', 
          padding:20,
          overflow:'auto'
        }}>
          {/* Left: Checkout Modal */}
          <div style={{flex:'0 0 auto', width:'720px', maxWidth:'45vw', maxHeight:'90vh', overflow:'auto', flexShrink:0}}>
            <CheckOutCard
              booking={checkOutFor}
                onClose={() => setCheckOutFor(null)}
                onCheckedOut={(bookingId, incidents = []) => {
                  // bump refreshKey to force IncidentsModal to reload incidents
                  setIncidentsRefreshKey(k => k + 1)
                  // store immediate incidents (if any) to show in the modal
                  setIncidentsInitial(Array.isArray(incidents) ? incidents : [])
                  if (typeof onStatusUpdated === 'function') onStatusUpdated(bookingId)
                }}
            />
          </div>

          {/* Right: Incidents Modal */}
          <div style={{flex:'0 0 auto', width:'600px', maxWidth:'45vw', maxHeight:'90vh', overflow:'auto', flexShrink:0}}>
            <IncidentsModal 
              bookingId={checkOutFor?.id}
              refreshKey={incidentsRefreshKey}
              initialIncidents={incidentsInitial}
              onClose={() => { setCheckOutFor(null); setIncidentsInitial([]) }}
            />
          </div>
        </div>
      )}
    </>
  );
}
