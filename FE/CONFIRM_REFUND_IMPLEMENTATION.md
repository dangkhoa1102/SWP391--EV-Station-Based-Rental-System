# Confirm Refund Feature - Implementation Guide

## Overview
Added "Confirm Refund" button functionality for bookings with status "Cancelled (Pending Refund)" in the Staff interface.

## What was implemented:

### 1. Backend API Integration
- Added `confirmRefund()` method to `staffApi.js` 
- Calls `/Bookings/Confirm-Refund/{bookingId}` POST endpoint
- Requires "Station Staff" role authentication

### 2. Frontend UI Components
- **BookingModal.jsx**: Added "Confirm Refund" button in modal when status is `cancelled-pending`
- **BookingCard.jsx**: Added "Confirm Refund" button directly on cards when status is `cancelled-pending`  
- **BookingTable.jsx**: Added "Confirm Refund" button in Actions column for table view
- **BookingSection.jsx**: Added handler logic and prop passing

### 3. Status Mapping Updates
- Updated status mapping to include code `6 = 'cancelled-pending'`
- Added dropdown filter option for "Cancelled (Pending Refund)" status
- Updated CSS styles for the new status and buttons

## How to test:

### Prerequisites
1. Login as **Station Staff** (required role for the API)
2. Have a booking with status "Cancelled (Pending Refund)" (status code 6)

### Testing Steps
1. Go to Staff dashboard → Booking section
2. Look for bookings with red "Cancelled (Pending Refund)" status
3. You should see a green "✅ Confirm Refund" button in:
   - The booking card directly
   - The Details modal when clicked  
   - The Actions column in table view

### Expected Behavior
1. Click "Confirm Refund" button
2. See confirmation dialog with booking details
3. After confirming:
   - API call to `/Bookings/Confirm-Refund/{bookingId}`
   - Success message shown
   - Booking status updated to "Cancelled" (status code 7)
   - Button disappears (no longer pending refund)

## API Details
- **Endpoint**: `POST /Bookings/Confirm-Refund/{bookingId}`
- **Auth**: Requires `Authorization: Bearer {token}` with "Station Staff" role
- **Response**: `ResponseDto<BookingDto>` with updated booking data

## File Changes Made:

### Services
- `FE/src/services/staffApi.js` - Added `confirmRefund()` method

### Components  
- `FE/src/staff/page/components/Booking/BookingModal.jsx` - Added button and handler
- `FE/src/staff/page/components/Booking/BookingSection.jsx` - Added prop passing and handler
- `FE/src/staff/page/components/Booking/BookingTable.jsx` - Added button in Actions column
- `FE/src/components/Booking/BookingCard.jsx` - Added button on cards

### Styles
- `FE/src/styles/booking.css` - Added CSS for confirm refund button and layout

### Testing
- `FE/test-confirm-refund.js` - Manual testing script for console

## Console Testing
For manual API testing, load `test-confirm-refund.js` in browser console:
```javascript
// 1. Make sure logged in as Staff
// 2. Replace testBookingId with real booking ID  
// 3. Run:
testConfirmRefund()
```

## Notes
- Only shows for bookings with status exactly `cancelled-pending` (code 6)
- Button automatically disappears after successful confirmation
- Requires proper Staff authentication to work
- All UI components (card, modal, table) now support the feature consistently