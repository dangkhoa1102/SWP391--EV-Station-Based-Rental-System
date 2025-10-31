# 🧪 Sample Data để Test API - EV Rental System

## 🚀 Cách chạy API
```bash
cd Monolithic
dotnet run
```
Sau đó mở: `https://localhost:5054/swagger` hoặc `http://localhost:5054/swagger`

## 📋 Sample Data để Test

### **1. Authentication**

#### Register User
```json
POST /api/Auth/Register
{
  "email": "test@example.com",
  "name": "Test User",
  "phoneNumber": "0123456789",
  "password": "Test123!@#"
}
```

#### Login User
```json
POST /api/Auth/Login
{
  "username": "test@example.com",
  "password": "Test123!@#"
}
```

**Lưu lại `token` và `userId` từ response!**

---

### **2. Tìm xe khả dụng**

```http
GET https://localhost:5054/api/Cars/Search-Available?page=1&pageSize=10
```

**Lưu lại `carId` từ response!**

---

### **3. Mainflow Test - Đặt xe + thanh toán đặt cọc**

```json
POST https://localhost:5054/api/Bookings/Create-With-Deposit?userId=YOUR_USER_ID
Authorization: Bearer YOUR_TOKEN

{
  "carId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "pickupStationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "returnStationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "pickupDateTime": "2024-12-01 10:00",
  "expectedReturnDateTime": "2024-12-01 18:00",
  "paymentMethod": "Cash",
  "transactionId": "TXN123456"
}
```

**Lưu lại `bookingId` từ response!**

---

### **4. Approve hợp đồng**

```json
POST https://localhost:5054/api/Bookings/Approve-Contract
Authorization: Bearer YOUR_TOKEN

{
  "bookingId": "YOUR_BOOKING_ID",
  "approveContract": true,
  "notes": "I agree to the terms and conditions"
}
```

---

### **5. Check-in + ký hợp đồng**

```json
POST https://localhost:5054/api/Bookings/Check-In-With-Contract
Authorization: Bearer YOUR_TOKEN

{
  "bookingId": "YOUR_BOOKING_ID",
  "staffId": "YOUR_USER_ID",
  "checkInNotes": "Car condition is good",
  "checkInPhotoUrl": "https://example.com/photo.jpg",
  "staffSignature": "John Doe - Staff",
  "customerSignature": "Jane Smith - Customer"
}
```

---

### **6. Check-out + thanh toán tiền thuê**

```json
POST https://localhost:5054/api/Bookings/Check-Out-With-Payment
Authorization: Bearer YOUR_TOKEN

{
  "bookingId": "YOUR_BOOKING_ID",
  "staffId": "YOUR_USER_ID",
  "checkOutNotes": "Car returned in good condition",
  "checkOutPhotoUrl": "https://example.com/return-photo.jpg",
  "lateFee": 0,
  "damageFee": 0,
  "paymentMethod": "Cash",
  "transactionId": "TXN789012"
}
```

---

## 🔍 Test các API khác

### **Xem booking của user**
```http
GET https://localhost:5054/api/Bookings/Get-By-User/YOUR_USER_ID
Authorization: Bearer YOUR_TOKEN
```

### **Xem chi tiết booking**
```http
GET https://localhost:5054/api/Bookings/Get-By-YOUR_BOOKING_ID
Authorization: Bearer YOUR_TOKEN
```

### **Tính chi phí booking**
```http
GET https://localhost:5054/api/Bookings/Calculate-Cost?carId=YOUR_CAR_ID&startTime=2024-12-01T10:00:00&endTime=2024-12-01T18:00:00
```

### **Kiểm tra xe có sẵn**
```json
POST https://localhost:5054/api/Bookings/Check-Availability
{
  "carId": "YOUR_CAR_ID",
  "startTime": "2024-12-01T10:00:00",
  "endTime": "2024-12-01T18:00:00"
}
```

---

## 📊 Expected Results

### **Booking Status Flow**
```
Pending → DepositPaid → ContractApproved → CheckedIn → Completed
```

### **Payment Status Flow**
```
Pending → DepositPaid → Completed
```

### **DateTime Format**
Tất cả DateTime sẽ hiển thị dạng: `2024-12-01 10:00` (không có phút giây)

---

## 🎯 Test Sequence

1. **Register/Login** → Lấy `token` và `userId`
2. **Search Cars** → Lấy `carId`
3. **Create Booking** → Lấy `bookingId`
4. **Approve Contract**
5. **Check-in**
6. **Check-out**
7. **Verify Completion**

---

## 🚨 Test Error Cases

### **Tạo booking với xe không khả dụng**
```json
POST https://localhost:5054/api/Bookings/Create-With-Deposit?userId=YOUR_USER_ID
{
  "carId": "00000000-0000-0000-0000-000000000000",
  "pickupStationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "returnStationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "pickupDateTime": "2024-12-01 10:00",
  "expectedReturnDateTime": "2024-12-01 18:00",
  "paymentMethod": "Cash",
  "transactionId": "TXN123456"
}
```

### **Approve contract với booking không đúng status**
```json
POST https://localhost:5054/api/Bookings/Approve-Contract
{
  "bookingId": "YOUR_BOOKING_ID",
  "approveContract": true,
  "notes": "Test rejection"
}
```

### **Check-in ngoài thời gian cho phép**
```json
POST https://localhost:5054/api/Bookings/Check-In-With-Contract
{
  "bookingId": "YOUR_BOOKING_ID",
  "staffId": "YOUR_USER_ID",
  "checkInNotes": "Late check-in",
  "checkInPhotoUrl": "https://example.com/photo.jpg",
  "staffSignature": "John Doe - Staff",
  "customerSignature": "Jane Smith - Customer"
}
```

---

## 📝 Sample GUIDs để test

### **Valid GUIDs (có thể dùng)**
- `3fa85f64-5717-4562-b3fc-2c963f66afa6`
- `550e8400-e29b-41d4-a716-446655440000`
- `6ba7b810-9dad-11d1-80b4-00c04fd430c8`

### **Invalid GUIDs (để test error)**
- `00000000-0000-0000-0000-000000000000`
- `invalid-guid-format`

---

## 🎯 Quick Test Checklist

- [ ] API chạy thành công (`dotnet run`)
- [ ] Swagger UI mở được (`https://localhost:7000/swagger`)
- [ ] Register user thành công
- [ ] Login lấy được token
- [ ] Search cars có kết quả
- [ ] Create booking thành công
- [ ] Approve contract thành công
- [ ] Check-in thành công
- [ ] Check-out thành công
- [ ] Verify booking completed

---

## 💡 Tips

1. **Luôn lưu lại** `token`, `userId`, `carId`, `bookingId` từ các response
2. **Sử dụng Swagger UI** để test dễ dàng nhất
3. **Kiểm tra response** để đảm bảo status đúng
4. **Test cả happy path và error cases**
5. **Kiểm tra database** sau khi test để xem data có được lưu không

**Chúc bạn test thành công! 🎉**
