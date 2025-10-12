# 📚 Booking API - Examples & Testing Guide

## Base URL
```
https://localhost:7000/api/booking
```

---

## 🔍 Complete Booking Flow Example

### Scenario: User "John" thuê xe VinFast VF8 trong 1 ngày

---

### **STEP 1: Tìm xe có sẵn**

```http
GET /api/booking/check-availability?carId=1&pickupDateTime=2024-10-15T09:00:00&returnDateTime=2024-10-16T09:00:00
```

**Response:**
```json
{
  "isSuccess": true,
  "data": {
    "isAvailable": true
  }
}
```

---

### **STEP 2: Tạo booking**

```http
POST /api/booking/create
Content-Type: application/json

{
  "userId": "john123",
  "carId": 1,
  "pickupStationId": 1,
  "returnStationId": 1,
  "pickupDateTime": "2024-10-15T09:00:00",
  "expectedReturnDateTime": "2024-10-16T09:00:00",
  "specialRequests": "Cần xe sạch sẽ, có ghế trẻ em",
  "couponId": null
}
```

**Response:**
```json
{
  "isSuccess": true,
  "message": "Booking created successfully. Please proceed to payment.",
  "data": {
    "bookingId": 1001,
    "userId": "john123",
    "carId": 1,
    "pickupStationId": 1,
    "returnStationId": 1,
    "pickupDateTime": "2024-10-15T09:00:00",
    "expectedReturnDateTime": "2024-10-16T09:00:00",
    "bookingStatus": "Pending",
    "hourlyRate": 50000,
    "dailyRate": 500000,
    "depositAmount": 2000000,
    "totalAmount": 500000,
    "paymentStatus": "Pending",
    "createdAt": "2024-10-10T14:30:00"
  }
}
```

---

### **STEP 3: Thanh toán (Call PaymentAPI)**

```http
POST /api/payment/create
Content-Type: application/json

{
  "bookingId": 1001,
  "amount": 2500000,
  "paymentMethod": "MoMo",
  "description": "Deposit + Rental fee for booking #1001"
}
```

**After payment success, update booking:**

```http
POST /api/booking/1001/confirm
```

**Response:**
```json
{
  "isSuccess": true,
  "message": "Booking confirmed successfully",
  "data": {
    "bookingId": 1001,
    "bookingStatus": "Confirmed",
    "paymentStatus": "Paid"
  }
}
```

---

### **STEP 4: Check-in (Nhận xe)**

**Time: 2024-10-15 09:00 AM**

```http
POST /api/booking/check-in
Content-Type: application/json

{
  "bookingId": 1001,
  "staffId": "staff_nguyen",
  "batteryLevelAtPickup": 98.5,
  "odometerAtPickup": 15420,
  "checkInNotes": "Xe trong tình trạng tốt. Đã kiểm tra đầy đủ.",
  "checkInPhotoUrl": "https://storage.evstation.com/checkin/1001-front.jpg",
  "checkInDateTime": "2024-10-15T09:05:00"
}
```

**Response:**
```json
{
  "isSuccess": true,
  "message": "Check-in completed successfully. Enjoy your ride!",
  "data": {
    "bookingId": 1001,
    "bookingStatus": "CheckedIn",
    "checkInDateTime": "2024-10-15T09:05:00",
    "batteryLevelAtPickup": 98.5,
    "odometerAtPickup": 15420
  }
}
```

---

### **STEP 5: Check-out (Trả xe)**

**Time: 2024-10-16 09:30 AM (Trễ 30 phút)**

```http
POST /api/booking/check-out
Content-Type: application/json

{
  "bookingId": 1001,
  "staffId": "staff_tran",
  "batteryLevelAtReturn": 42.0,
  "odometerAtReturn": 15580,
  "checkOutNotes": "Xe có vết xước nhỏ ở cửa sau bên phải. Nội thất sạch sẽ.",
  "checkOutPhotoUrl": "https://storage.evstation.com/checkout/1001-damage.jpg",
  "checkOutDateTime": "2024-10-16T09:30:00",
  "lateFee": 25000,
  "damageFee": 100000,
  "cleaningFee": 0
}
```

**Response:**
```json
{
  "isSuccess": true,
  "message": "Check-out completed successfully. Please proceed to final payment.",
  "data": {
    "bookingId": 1001,
    "bookingStatus": "CheckedOut",
    "checkOutDateTime": "2024-10-16T09:30:00",
    "batteryLevelAtReturn": 42.0,
    "odometerAtReturn": 15580,
    "totalAmount": 500000,
    "lateFee": 25000,
    "damageFee": 100000,
    "cleaningFee": 0,
    "actualAmount": 625000
  }
}
```

**Calculation:**
- Base rental: 500,000 VND
- Late fee (30 mins): 25,000 VND
- Damage fee: 100,000 VND
- **Total: 625,000 VND**

---

### **STEP 6: Thanh toán phụ phí**

```http
POST /api/payment/create
Content-Type: application/json

{
  "bookingId": 1001,
  "amount": 125000,
  "paymentMethod": "MoMo",
  "description": "Additional fees (late + damage)"
}
```

---

### **STEP 7: Hoàn thành booking**

```http
POST /api/booking/1001/complete
```

**Response:**
```json
{
  "isSuccess": true,
  "message": "Booking completed successfully. Thank you for using our service!",
  "data": {
    "bookingId": 1001,
    "bookingStatus": "Completed",
    "paymentStatus": "Paid",
    "totalAmount": 500000,
    "actualAmount": 625000,
    "depositRefund": 1875000
  }
}
```

**Deposit Refund Calculation:**
- Original deposit: 2,000,000 VND
- Additional fees: 125,000 VND
- **Refund: 1,875,000 VND**

---

## 📋 Other API Examples

### Get Booking by ID

```http
GET /api/booking/1001
```

**Response:**
```json
{
  "isSuccess": true,
  "data": {
    "bookingId": 1001,
    "userId": "john123",
    "carId": 1,
    "carInfo": "VinFast VF8 2023",
    "pickupStationId": 1,
    "pickupStationName": "Trạm Q1 - Nguyễn Huệ",
    "returnStationId": 1,
    "returnStationName": "Trạm Q1 - Nguyễn Huệ",
    "pickupDateTime": "2024-10-15T09:00:00",
    "expectedReturnDateTime": "2024-10-16T09:00:00",
    "actualReturnDateTime": "2024-10-16T09:30:00",
    "bookingStatus": "Completed",
    "totalAmount": 500000,
    "actualAmount": 625000
  }
}
```

---

### Get User's Bookings

```http
GET /api/booking/user/john123
```

**Response:**
```json
{
  "isSuccess": true,
  "data": [
    {
      "bookingId": 1001,
      "carInfo": "VinFast VF8 2023",
      "pickupDateTime": "2024-10-15T09:00:00",
      "bookingStatus": "Completed",
      "totalAmount": 625000
    },
    {
      "bookingId": 995,
      "carInfo": "VinFast VF5 2023",
      "pickupDateTime": "2024-10-01T10:00:00",
      "bookingStatus": "Completed",
      "totalAmount": 400000
    }
  ]
}
```

---

### Get Bookings by Status

```http
GET /api/booking/status/Confirmed
```

**Response:**
```json
{
  "isSuccess": true,
  "data": [
    {
      "bookingId": 1002,
      "userId": "mary456",
      "carId": 2,
      "pickupDateTime": "2024-10-20T14:00:00",
      "bookingStatus": "Confirmed"
    }
  ]
}
```

---

### Cancel Booking

```http
POST /api/booking/1002/cancel
Content-Type: application/json

"Có việc đột xuất, không thể đi được"
```

**Response:**
```json
{
  "isSuccess": true,
  "message": "Booking cancelled successfully",
  "data": {
    "bookingId": 1002,
    "bookingStatus": "Cancelled",
    "cancellationReason": "Có việc đột xuất, không thể đi được",
    "cancelledAt": "2024-10-12T10:30:00",
    "refundAmount": 2500000
  }
}
```

---

### Update Booking

```http
PUT /api/booking/1002
Content-Type: application/json

{
  "userId": "mary456",
  "carId": 2,
  "pickupStationId": 1,
  "returnStationId": 2,
  "pickupDateTime": "2024-10-20T15:00:00",
  "expectedReturnDateTime": "2024-10-21T15:00:00",
  "specialRequests": "Cần xe có camera hành trình"
}
```

**Response:**
```json
{
  "isSuccess": true,
  "message": "Booking updated successfully",
  "data": {
    "bookingId": 1002,
    "pickupDateTime": "2024-10-20T15:00:00",
    "expectedReturnDateTime": "2024-10-21T15:00:00"
  }
}
```

---

### Get Booking History

```http
GET /api/booking/history/john123
```

**Response:**
```json
{
  "isSuccess": true,
  "data": [
    {
      "bookingId": 1001,
      "carInfo": "VinFast VF8 2023",
      "pickupDateTime": "2024-10-15T09:00:00",
      "returnDateTime": "2024-10-16T09:30:00",
      "totalAmount": 625000,
      "bookingStatus": "Completed"
    },
    {
      "bookingId": 995,
      "carInfo": "VinFast VF5 2023",
      "pickupDateTime": "2024-10-01T10:00:00",
      "returnDateTime": "2024-10-02T10:00:00",
      "totalAmount": 400000,
      "bookingStatus": "Completed"
    }
  ]
}
```

---

### Get Upcoming Bookings

```http
GET /api/booking/upcoming
```

**Response:**
```json
{
  "isSuccess": true,
  "data": [
    {
      "bookingId": 1003,
      "userId": "peter789",
      "carId": 3,
      "pickupDateTime": "2024-10-18T08:00:00",
      "bookingStatus": "Confirmed"
    },
    {
      "bookingId": 1004,
      "userId": "lisa321",
      "carId": 4,
      "pickupDateTime": "2024-10-19T10:00:00",
      "bookingStatus": "Confirmed"
    }
  ]
}
```

---

## 🧪 Testing Scenarios

### Scenario 1: Booking xe ngắn hạn (< 24 giờ)

```http
POST /api/booking/create
{
  "userId": "test_user",
  "carId": 1,
  "pickupStationId": 1,
  "returnStationId": 1,
  "pickupDateTime": "2024-10-15T14:00:00",
  "expectedReturnDateTime": "2024-10-15T18:00:00"
}
```

**Expected:**
- Duration: 4 hours
- Pricing: 4 × 50,000 = 200,000 VND

---

### Scenario 2: Booking xe dài hạn (≥ 24 giờ)

```http
POST /api/booking/create
{
  "userId": "test_user",
  "carId": 1,
  "pickupStationId": 1,
  "returnStationId": 2,
  "pickupDateTime": "2024-10-15T09:00:00",
  "expectedReturnDateTime": "2024-10-17T09:00:00"
}
```

**Expected:**
- Duration: 48 hours (2 days)
- Pricing: 2 × 500,000 = 1,000,000 VND

---

### Scenario 3: Trả xe trễ

```http
POST /api/booking/check-out
{
  "bookingId": 1001,
  "staffId": "staff_test",
  "batteryLevelAtReturn": 50.0,
  "odometerAtReturn": 15500,
  "checkOutDateTime": "2024-10-16T11:00:00",
  "lateFee": 100000,
  "damageFee": 0,
  "cleaningFee": 0
}
```

**Expected:**
- Late: 2 hours
- Late fee: 2 × 50,000 × 1.5 = 150,000 VND

---

### Scenario 4: Xe bị hư hỏng

```http
POST /api/booking/check-out
{
  "bookingId": 1001,
  "staffId": "staff_test",
  "batteryLevelAtReturn": 45.0,
  "odometerAtReturn": 15600,
  "checkOutNotes": "Gương chiếu hậu bị vỡ",
  "damageFee": 500000
}
```

**Expected:**
- Damage fee: 500,000 VND
- Total: Base + Damage = 500,000 + 500,000 = 1,000,000 VND

---

### Scenario 5: Hủy booking

```http
POST /api/booking/1002/cancel
"Thay đổi kế hoạch du lịch"
```

**Expected:**
- Status: Cancelled
- Refund policy applied based on cancellation time

---

## 🔍 Error Handling Examples

### Error 1: Xe không có sẵn

```http
POST /api/booking/create
{
  "carId": 1,
  "pickupDateTime": "2024-10-15T09:00:00",
  "expectedReturnDateTime": "2024-10-16T09:00:00"
}
```

**Response:**
```json
{
  "isSuccess": false,
  "message": "Car is not available for the selected dates",
  "errors": null
}
```

---

### Error 2: Booking không tồn tại

```http
GET /api/booking/99999
```

**Response:**
```json
{
  "isSuccess": false,
  "message": "Booking not found",
  "errors": null
}
```

---

### Error 3: Invalid status transition

```http
POST /api/booking/check-out
{
  "bookingId": 1001
}
```

**Response (if booking status is "Pending"):**
```json
{
  "isSuccess": false,
  "message": "Cannot check-out booking with status: Pending",
  "errors": null
}
```

---

## 📊 Performance Testing

### Load Test: Create 100 bookings

```bash
for i in {1..100}
do
  curl -X POST https://localhost:7000/api/booking/create \
    -H "Content-Type: application/json" \
    -d "{\"userId\":\"user$i\",\"carId\":1,\"pickupStationId\":1,\"returnStationId\":1,\"pickupDateTime\":\"2024-10-15T09:00:00\",\"expectedReturnDateTime\":\"2024-10-16T09:00:00\"}"
done
```

---

## 🎯 Integration Testing

Test full flow from booking to completion:

```bash
# 1. Create booking
BOOKING_ID=$(curl -X POST .../create | jq -r '.data.bookingId')

# 2. Confirm booking
curl -X POST .../booking/$BOOKING_ID/confirm

# 3. Check-in
curl -X POST .../booking/check-in -d {...}

# 4. Check-out
curl -X POST .../booking/check-out -d {...}

# 5. Complete
curl -X POST .../booking/$BOOKING_ID/complete
```

---

## 📝 Notes

- All timestamps are in UTC
- Amounts are in VND (Vietnamese Dong)
- Battery levels are in percentage (0-100)
- Odometer readings are in kilometers

---

## 🔗 Related APIs

- **CarAPI**: `/api/car`
- **StationAPI**: `/api/station`
- **PaymentAPI**: `/api/payment`
- **UserAPI**: `/api/user`
- **CouponAPI**: `/api/coupon`

