// adminCheckInAutomatic.js

const API_BASE_URL = 'http://localhost:5054/api';

/**
 * Get all check-in information automatically from bookingId
 * Admin only needs to provide: bookingId
 * Everything else is auto-fetched with admin's token
 */
export const getCheckInInfoAutomatic = async (bookingId) => {
  const adminToken = localStorage.getItem('token');

  if (!adminToken) {
    throw new Error('Please log in as admin');
  }

  try {
    // 1️⃣ Get Booking Details (includes userId, booking status, etc.)
    const bookingResponse = await fetch(`${API_BASE_URL}/Bookings/Get-By-${bookingId}`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!bookingResponse.ok) {
      throw new Error('Booking not found');
    }

    const bookingData = await bookingResponse.json();
    const booking = bookingData.data;

    // 2️⃣ Get Contract Details (includes contract confirmation status)
    const contractResponse = await fetch(`${API_BASE_URL}/Contracts/Get-By-Booking/${bookingId}`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!contractResponse.ok) {
      throw new Error('Contract not found');
    }

    const contractData = await contractResponse.json();
    const contract = contractData.data;
    
    console.log('📄 Contract data received:', contract);

    // 3️⃣ Get Payment Status (verify deposit paid)
    const paymentResponse = await fetch(`${API_BASE_URL}/Payment/booking/${bookingId}`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    const payments = await paymentResponse.json();
    const depositPayment = payments.find(p => p.paymentType === 0);

    // 4️⃣ Get Staff Information (current admin/staff ID from token)
    const adminUserData = JSON.parse(atob(adminToken.split('.')[1]));
    const staffId = adminUserData.nameid || adminUserData.sub;

    // 5️⃣ Validate all conditions
    const contractStatus = contract.Status;
    const contractConfirmed = contract.IsConfirmed;
    
    console.log('🔍 Contract validation:', {
      Status: contractStatus,
      IsConfirmed: contractConfirmed
    });
    
    const validation = {
      bookingStatusValid: booking.bookingStatus === 1,
      contractConfirmed: contractConfirmed === true,
      contractSigned: contractStatus === 1,
      depositPaid: depositPayment && depositPayment.paymentStatus === 1,
      allValid: booking.bookingStatus === 1 && 
                contractConfirmed === true && 
                contractStatus === 1 && 
                depositPayment && 
                depositPayment.paymentStatus === 1
    };

    // Return all auto-filled information
    return {
      bookingId: booking.bookingId,
      customerId: booking.userId,
      customerName: booking.userName,
      staffId: staffId,
      carInfo: booking.carInfo,
      stationName: booking.stationName,
      pickupDateTime: booking.pickupDateTime,
      contractId: contract.ContractId,
      contractConfirmed: contractConfirmed,
      contractStatus: contractStatus,
      depositPaymentStatus: depositPayment?.paymentStatus,
      validation: validation,
      readyForCheckIn: validation.allValid
    };

  } catch (error) {
    console.error('Error fetching check-in info:', error);
    throw error;
  }
};

/**
 * One-click check-in: Admin just provides bookingId and optional notes
 * Everything else is auto-fetched and auto-filled
 */
export const performAutoCheckIn = async (bookingId, checkInNotes = '', checkInPhotoUrl = null) => {
  const adminToken = localStorage.getItem('token');

  if (!adminToken) {
    throw new Error('Please log in as admin');
  }

  try {
    // Get all auto information first
    const checkInInfo = await getCheckInInfoAutomatic(bookingId);

    if (!checkInInfo.readyForCheckIn) {
      const errors = [];
      if (!checkInInfo.validation.bookingStatusValid) 
        errors.push('Booking status is not DepositPaid');
      if (!checkInInfo.validation.contractConfirmed) 
        errors.push('Contract is not confirmed');
      if (!checkInInfo.validation.contractSigned) 
        errors.push('Contract is not signed');
      if (!checkInInfo.validation.depositPaid) 
        errors.push('Deposit payment is not successful');
      
      throw new Error(`Cannot check in: ${errors.join(', ')}`);
    }

    // ✅ NOW: Call check-in API with AUTO-FILLED information
    const checkInResponse = await fetch(`${API_BASE_URL}/Bookings/Check-In-With-Contract`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        bookingId: checkInInfo.bookingId,
        staffId: checkInInfo.staffId,
        checkInNotes: checkInNotes || 'Car checked in successfully',
        checkInPhotoUrl: checkInPhotoUrl || null,
        staffSignature: 'placeholder',
        customerSignature: 'placeholder'
      })
    });

    if (!checkInResponse.ok) {
      const error = await checkInResponse.json();
      throw new Error(error.message || 'Check-in failed');
    }

    const result = await checkInResponse.json();
    return result;

  } catch (error) {
    console.error('Auto check-in failed:', error);
    throw error;
  }
};
