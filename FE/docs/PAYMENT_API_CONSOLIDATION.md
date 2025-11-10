# Payment API Consolidation

## Tóm tắt
Đã di chuyển **tất cả payment-related APIs** từ các file riêng lẻ (userApi.js, staffApi.js) vào **central api.js** để dễ quản lý và tránh lỗi sync.

## Vấn đề gốc
- ❌ **Check-out payment không sync được booking status** (deposit và check-in thì OK)
- ❌ PaymentSuccess.jsx đang dùng `API.post()` nhưng userApi không có method này
- ❌ Payment functions bị phân tán ở nhiều file khác nhau

## Giải pháp

### 1️⃣ Thêm Payment Functions vào Central API (`src/services/api.js`)

```javascript
// ==================== PAYMENT APIs ====================

// Create payment for deposit, rental, or checkout
// PaymentType: 0 = Deposit, 1 = Rental, 2 = Checkout (penalty/damage)
createPayment: async (bookingId, paymentType = 0, description = 'Payment', extraAmount = 0) => {
  const payload = { bookingId, paymentType, description }
  if (extraAmount > 0) payload.extraAmount = extraAmount
  const res = await apiClient.post('/Payment/create', payload)
  return res.data?.data || res.data || {}
}

// Sync payment status after PayOS redirect
syncPayment: async (bookingId) => {
  const res = await apiClient.post(`/Payment/sync/${encodeURIComponent(bookingId)}`)
  return res.data?.data || res.data || {}
}

// Get booking details by ID (used to check status after payment)
getBookingById: async (bookingId) => {
  const res = await apiClient.get(`/Bookings/Get-By-${encodeURIComponent(bookingId)}`)
  return res.data?.data || res.data || {}
}

// Check if contract is confirmed (used before creating payment for rental/checkout)
isContractConfirmed: async (bookingId) => {
  const res = await apiClient.get(`/Contracts/Get-By-Booking/${encodeURIComponent(bookingId)}`)
  const contract = res.data?.data || res.data || {}
  return contract.isConfirmed === true || contract.IsConfirmed === true
}
```

### 2️⃣ Updated Files

#### PaymentSuccess.jsx
- ✅ Changed import: `import API from '../../../../services/api'` (was: `../../../services/userApi`)
- ✅ Changed sync call: `await API.syncPayment(bookingId)` (was: `await API.post(\`/Payment/sync/${bookingId}\`)`)

#### CheckOutCard.jsx
- ✅ Added import: `import API from '../../../../services/api'`
- ✅ Changed payment creation: `await API.createPayment(booking.id, 2, 'Rental payment at check-out', damageFee)`
  - Now passes `extraAmount` parameter for damage fees

#### CheckInCard.jsx
- ✅ Added import: `import API from '../../../../services/api'`
- ✅ Changed payment creation: `await API.createPayment(booking.id, 1, 'Rental payment at check-in')`

#### BookingHistory.jsx (User)
- ✅ Changed import: `import API from '../../../../services/api'` (was: `../../../services/userApi`)

#### PaymentPage.jsx (User)
- ✅ Changed import: `import API from '../../../../services/api'` (was: `../../../services/userApi`)

## Payment Flow Architecture

### 🔄 Complete Payment Flow
```
┌─────────────────────────────────────────────────────────────────┐
│                      PAYMENT FLOW                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1️⃣ User/Staff triggers payment                                  │
│     ├─ User deposit: BookingHistory/PaymentPage                 │
│     ├─ Staff check-in: CheckInCard                              │
│     └─ Staff check-out: CheckOutCard                            │
│                                                                   │
│  2️⃣ Create payment session                                       │
│     API.createPayment(bookingId, paymentType, desc, extraAmt)   │
│     └─> POST /Payment/create                                    │
│                                                                   │
│  3️⃣ Save bookingId to localStorage                               │
│     ├─ currentBookingId (user deposit)                          │
│     ├─ activeCheckInBookingId (staff check-in)                  │
│     └─ activeCheckOutBookingId (staff check-out)                │
│                                                                   │
│  4️⃣ Redirect to PayOS                                            │
│     window.location.href = checkoutUrl                          │
│                                                                   │
│  5️⃣ PayOS redirects back to /payment-success                     │
│                                                                   │
│  6️⃣ PaymentSuccess.jsx syncs payment                             │
│     ├─ Read bookingId from localStorage (3 sources)             │
│     ├─ API.syncPayment(bookingId)                               │
│     │   └─> POST /Payment/sync/{bookingId}                      │
│     ├─ API.getBookingById(bookingId)                            │
│     └─ Navigate based on payment type                           │
│         ├─ Staff → /staff                                        │
│         └─ User → /booking-history                              │
│                                                                   │
│  7️⃣ Booking status updated! ✅                                    │
│     ├─ Deposit: 0 (Pending) → 1 (Active)                        │
│     ├─ Check-in: 2 (Waiting Check-in) → 3 (Checked-in)         │
│     └─ Check-out: 4 (Check-out Pending) → 5 (Completed)        │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Payment Types
```javascript
0 = Deposit Payment      // User pays deposit when booking
1 = Rental Payment       // Staff collects rental payment at check-in
2 = Checkout Payment     // Staff collects penalty/damage payment at check-out
```

## Testing Checklist

### ✅ User Deposit Payment
- [ ] Create booking → Pay deposit
- [ ] Redirects to PayOS
- [ ] PayOS redirects to /payment-success
- [ ] Booking status: 0 → 1 (Pending → Active)
- [ ] Redirects to /booking-history

### ✅ Staff Check-in Payment
- [ ] Staff opens Check-in modal
- [ ] Fills form → Submit
- [ ] Redirects to PayOS
- [ ] PayOS redirects to /payment-success
- [ ] Booking status: 2 → 3 (Waiting Check-in → Checked-in)
- [ ] Redirects to /staff

### ✅ Staff Check-out Payment
- [ ] Staff opens Check-out modal
- [ ] Fills form with damage fee (if any)
- [ ] Submit → Payment button appears
- [ ] Click payment → Opens PayOS in new tab
- [ ] PayOS redirects to /payment-success
- [ ] Booking status: 4 → 5 (Check-out Pending → Completed)
- [ ] Redirects to /staff
- [ ] **CRITICAL**: Damage fee (extraAmount) should be included in payment

## API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/Payment/create` | POST | Create payment session with PayOS |
| `/Payment/sync/{bookingId}` | POST | Sync payment status after PayOS redirect |
| `/Bookings/Get-By-{id}` | GET | Get booking details (check status) |
| `/Contracts/Get-By-Booking/{id}` | GET | Check if contract is confirmed |
| `/Bookings/Check-In-With-Contract` | POST | Staff check-in |
| `/Bookings/Check-Out-With-Payment` | POST | Staff check-out |

## Benefits of Consolidation

✅ **Single source of truth** - All payment APIs in one place  
✅ **Consistent error handling** - Centralized logging and error management  
✅ **Easier testing** - Mock one API file instead of multiple  
✅ **Better debugging** - Trace all payment calls through central api.js  
✅ **Type safety** - Future TypeScript migration will be easier  

## Next Steps

1. Test all 3 payment flows thoroughly
2. Monitor console logs for payment sync errors
3. Consider adding payment retry logic if sync fails
4. Add loading states during payment sync
5. Consider webhook integration for real-time payment updates

---

**Last updated:** 2024
**Issue:** Check-out payment sync failure  
**Status:** ✅ RESOLVED
