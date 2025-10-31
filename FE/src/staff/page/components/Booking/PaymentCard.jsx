import React, { useEffect, useMemo, useState } from 'react'
import StaffAPI from '../../../services/staffApi'

function formatVND(n) {
  try {
    const x = Number(n) || 0
    return x.toLocaleString('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })
  } catch {
    return `${n} VND`
  }
}

export default function PaymentCard({ booking, onClose }) {
  const [expandedBooking, setExpandedBooking] = useState(booking)
  const [amount, setAmount] = useState(0)
  const [checkoutUrl, setCheckoutUrl] = useState('')
  const [qrImageUrl, setQrImageUrl] = useState('')
  const [qrText, setQrText] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [resolvedFullName, setResolvedFullName] = useState('')

  const deposit = useMemo(() => {
    if (!expandedBooking) return 0
    const total = Number(
      expandedBooking.totalAmount ?? expandedBooking.TotalAmount ?? expandedBooking.totalPrice ?? expandedBooking.TotalPrice ?? expandedBooking.amount ?? expandedBooking.Amount ?? 0
    )
    if (!Number.isFinite(total) || total <= 0) return 0
    return Math.round(total * 0.3)
  }, [expandedBooking])

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!booking?.id) {
        setError('Missing booking id')
        setLoading(false)
        return
      }
      try {
        // Resolve user full name regardless of totals presence
        try {
          const { firstName, lastName } = await StaffAPI.getUserNameByBookingId(booking.id)
          if (mounted) setResolvedFullName([firstName, lastName].filter(Boolean).join(' '))
        } catch {}

        // Load full booking details for accurate totals if not present
        if (!booking.totalAmount && !booking.TotalAmount) {
          try {
            const b = await StaffAPI.getBookingById(booking.id)
            if (!mounted) return
            setExpandedBooking(prev => ({ ...prev, ...b }))
          } catch (e) {
            // Soft fail, continue with given booking
          }
        }
        const depositAmt = deposit || Math.round(Number(booking.depositAmount ?? booking.DepositAmount ?? 0))
        setAmount(Math.max(1, depositAmt || 0))

        // Create a payment session
        try {
          const res = await StaffAPI.post('/Payment/create', {
            bookingId: booking.id,
            amount: Math.max(1, depositAmt || 0)
          })
          const data = res?.data || res || {}
          const pay = data?.payment || data
          const cu = data.checkoutUrl || pay.checkoutUrl || data.url || pay.url || ''
          const qrUrl = data.qrUrl || data.qrCodeUrl || pay.qrUrl || pay.qrCodeUrl || ''
          const qrBase64 = data.qrCode || pay.qrCode || ''
          const qrContent = data.qrContent || data.qrText || data.payUrl || pay.payUrl || cu || ''
          if (cu) setCheckoutUrl(cu)
          if (qrUrl) setQrImageUrl(qrUrl)
          else if (qrBase64) setQrImageUrl(qrBase64.startsWith('data:') ? qrBase64 : `data:image/png;base64,${qrBase64}`)
          else if (qrContent) setQrText(qrContent)
        } catch (e) {
          console.error('Payment create error:', e?.response?.data || e?.message)
          setError('Could not create a payment session. You can still collect cash or try again later.')
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking?.id])

  const resolvedQrImage = useMemo(() => {
    if (qrImageUrl) return qrImageUrl
    if (qrText) return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(qrText)}`
    if (checkoutUrl) return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(checkoutUrl)}`
    return ''
  }, [qrImageUrl, qrText, checkoutUrl])

  const openCheckout = () => {
    if (checkoutUrl) window.open(checkoutUrl, '_blank', 'noopener,noreferrer')
  }

  if (!booking) return null

  return (
    <div className="modal-overlay" style={{ display: 'flex' }}>
      <div className="modal-content" style={{ display: 'flex', flexDirection: 'column', width: 'min(740px, 95vw)', maxHeight: '90vh', overflow: 'auto', margin:'0 auto' }}>
        <span className="close-btn" onClick={onClose}>&times;</span>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {/* Left summary similar to BookingCard */}
          <div style={{ flex: '1 1 320px', minWidth: 280 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <img
                src={booking.img || expandedBooking?.carImageUrl || expandedBooking?.car?.imageUrl || 'https://via.placeholder.com/160x100?text=Car'}
                alt="car"
                style={{ width: 160, height: 100, objectFit: 'cover', borderRadius: 8, border: '1px solid #eee' }}
              />
              <div>
                <h3 style={{ margin: '4px 0 6px' }}>{booking.title || expandedBooking?.carName || 'Vehicle'}</h3>
                <div style={{ color: '#666' }}>Booking ID: {booking.id}</div>
                <div style={{ marginTop: 6, color:'#333' }}>
                  Customer: {resolvedFullName || booking.fullName || [booking.firstName, booking.lastName].filter(Boolean).join(' ') || booking.customer || expandedBooking?.userFullName || '—'}
                </div>
              </div>
            </div>
            <div style={{ height: 1, background: '#eee', margin: '14px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span>Total</span>
              <span style={{ fontWeight: 700 }}>{formatVND(expandedBooking?.totalAmount ?? expandedBooking?.TotalAmount ?? 0)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Deposit (30%)</span>
              <span style={{ fontWeight: 700 }}>{formatVND(amount)}</span>
            </div>
          </div>

          {/* Right QR section */}
          <div style={{ flex: '1 1 280px', minWidth: 260 }}>
            <h3 style={{ marginTop: 0 }}>Scan to pay</h3>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 240 }}>
              {loading ? (
                <div>Preparing QR...</div>
              ) : resolvedQrImage ? (
                <img src={resolvedQrImage} alt="Payment QR" style={{ width: 240, height: 240, objectFit: 'contain', background: '#fff', padding: 8, borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }} />
              ) : (
                <div style={{ color: '#888' }}>QR will appear here</div>
              )}
            </div>
            <div style={{ textAlign: 'center', marginTop: 8, color: '#444' }}>Amount: <strong>{formatVND(amount)}</strong></div>
            {error && (
              <div style={{ background: '#fff7e6', color: '#8a6d3b', padding: '8px 12px', borderRadius: 6, border: '1px solid #ffe1b3', marginTop: 10 }}>
                {error}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button onClick={openCheckout} disabled={!checkoutUrl} style={{ flex: 1, padding: '10px 12px', borderRadius: 10, background: checkoutUrl ? '#1565c0' : '#9e9e9e', color: '#fff', border: 'none' }}>Open Checkout</button>
              <button onClick={onClose} style={{ padding: '10px 12px', borderRadius: 10, background: '#f5f5f5', color: '#333', border: '1px solid #ddd' }}>Done</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
