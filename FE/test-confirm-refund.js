// Test script for Confirm Refund functionality
// This can be run in browser console to test the API

console.log('🧪 Testing Confirm Refund functionality...')

// Test with a sample booking ID (replace with real ID when testing)
const testBookingId = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'

// Simulate the API call
async function testConfirmRefund() {
  try {
    // Make sure you're logged in as Staff first
    const token = localStorage.getItem('token')
    if (!token) {
      console.error('❌ No token found. Please login as Staff first.')
      return
    }

    console.log('🔐 Using token:', token.substring(0, 20) + '...')
    
    // Test the API endpoint
    const response = await fetch(`http://localhost:5173/api/Bookings/Confirm-Refund/${testBookingId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    console.log('📡 Response status:', response.status)
    
    const data = await response.json()
    console.log('📦 Response data:', data)
    
    if (response.ok && data.isSuccess) {
      console.log('✅ Confirm Refund API test successful!')
      console.log('📊 Updated booking:', data.data)
    } else {
      console.warn('⚠️ API responded with error:', data.message || 'Unknown error')
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Instructions
console.log(`
📋 Instructions for testing:
1. Make sure you're logged in as Station Staff
2. Replace 'testBookingId' with a real booking ID that has status 'Cancelled (Pending Refund)'
3. Run: testConfirmRefund()

To find bookings with pending refunds, you can:
1. Go to Staff page -> Booking section
2. Filter by "Cancelled (Pending Refund)" status
3. Copy a booking ID from the console logs or inspect element
4. Replace the testBookingId variable above
5. Run testConfirmRefund()
`)

// Make function available globally
window.testConfirmRefund = testConfirmRefund