# ⚡ Quick Test Guide - EV Rental API

## 🚀 Chạy API
```bash
cd Monolithic
dotnet run
```
Mở: `https://localhost:5054/swagger` hoặc `http://localhost:5054/swagger`

## 📋 Test Sequence

### **1. Đăng ký/Đăng nhập**
```json
POST https://localhost:5054/api/Auth/Register
{
  "email": "test@example.com",
  "name": "Test User",
  "phoneNumber": "0123456789",
  "password": "Test123!@#"
}

POST https://localhost:5054/api/Auth/Login
{
  "username": "test@example.com",
  "password": "Test123!@#"
}
```
**→ Lưu `token` và `userId`**

### **2. Tìm xe**
```http
GET https://localhost:5054/api/Cars/Search-Available?page=1&pageSize=10
```
**→ Lưu `carId`**

### **3. Đặt xe + đặt cọc**
```json
POST https://localhost:5054/api/Bookings/Create-With-Deposit?userId=YOUR_USER_ID
Authorization: Bearer YOUR_TOKEN
{
  "carId": "YOUR_CAR_ID",
  "pickupStationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "returnStationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "pickupDateTime": "2024-12-01 10:00",
  "expectedReturnDateTime": "2024-12-01 18:00",
  "paymentMethod": "Cash",
  "transactionId": "TXN123456"
}
```
**→ Lưu `bookingId`**

### **4. Approve hợp đồng**
```json
POST https://localhost:5054/api/Bookings/Approve-Contract
Authorization: Bearer YOUR_TOKEN
{
  "bookingId": "YOUR_BOOKING_ID",
  "approveContract": true,
  "notes": "I agree"
}
```

### **5. Check-in**
```json
POST https://localhost:5054/api/Bookings/Check-In-With-Contract
Authorization: Bearer YOUR_TOKEN
{
  "bookingId": "YOUR_BOOKING_ID",
  "staffId": "YOUR_USER_ID",
  "checkInNotes": "Car good",
  "checkInPhotoUrl": "https://example.com/photo.jpg",
  "staffSignature": "John Doe",
  "customerSignature": "Jane Smith"
}
```

### **6. Check-out**
```json
POST https://localhost:5054/api/Bookings/Check-Out-With-Payment
Authorization: Bearer YOUR_TOKEN
{
  "bookingId": "YOUR_BOOKING_ID",
  "staffId": "YOUR_USER_ID",
  "checkOutNotes": "Car returned",
  "checkOutPhotoUrl": "https://example.com/return.jpg",
  "lateFee": 0,
  "damageFee": 0,
  "paymentMethod": "Cash",
  "transactionId": "TXN789012"
}
```

## ✅ Expected Results
- **Status Flow**: `Pending → DepositPaid → ContractApproved → CheckedIn → Completed`
- **DateTime Format**: `2024-12-01 10:00` (không có phút giây)
- **Deposit**: 30% của tổng tiền
- **Rental**: 70% của tổng tiền

## 🎯 Test Checklist
- [ ] API chạy OK
- [ ] Swagger mở được
- [ ] Register/Login OK
- [ ] Search cars OK
- [ ] Create booking OK
- [ ] Approve contract OK
- [ ] Check-in OK
- [ ] Check-out OK
- [ ] Verify completed

**Done! 🎉**
