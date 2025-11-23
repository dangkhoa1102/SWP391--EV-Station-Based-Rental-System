export function mapStatusFromRaw(raw) {
  if (raw === null || raw === undefined) return null
  if (typeof raw === 'number') {
    switch (raw) {
      case 1:
        return 'booked'
      case 2:
        return 'waiting_payment'
      case 3:
        return 'checked-in'
      case 4:
        return 'completed'
      case 0:
        return 'cancelled'
      default:
        return String(raw)
    }
  }
  const s = String(raw).toLowerCase()
  if (s === '1') return 'booked'
  if (s === '2') return 'waiting_payment'
  if (s === '3') return 'checked-in'
  if (s === '4') return 'completed'
  if (s === '0' || s.includes('cancel')) return 'cancelled'
  if (s.includes('book')) return 'booked'
  if (s.includes('wait')) return 'waiting_payment'
  if (s.includes('check')) return 'checked-in'
  if (s.includes('complete')) return 'completed'
  return s
}

export function formatBookingDate(d) {
  if (!d && d !== 0) return '—'
  const dt = new Date(d)
  if (isNaN(dt)) return String(d)
  return dt.toLocaleString()
}
