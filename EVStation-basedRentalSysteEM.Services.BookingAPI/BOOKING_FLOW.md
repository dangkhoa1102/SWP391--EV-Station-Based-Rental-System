# 🚗 Mainflow Đặt Xe Chi Tiết

## Tổng quan quy trình

```
┌─────────────────────────────────────────────────────────────────┐
│                    EV STATION RENTAL FLOW                        │
└─────────────────────────────────────────────────────────────────┘

1. ĐĂNG KÝ & XÁC THỰC
   ├─ Tạo tài khoản
   ├─ Upload giấy phép lái xe, CMND/CCCD
   └─ Xác thực nhận diện tại điểm thuê
   
2. ĐẶT XE
   ├─ a. Tìm điểm thuê trên bản đồ
   ├─ b. Xem danh sách xe có sẵn (loại, dung lượng pin, giá)
   └─ c. Đặt xe trước hoặc đến trực tiếp điểm thuê
   
3. NHẬN XE
   ├─ a. Check-in tại quầy/ứng dụng
   ├─ b. Ký hợp đồng điện tử (hoặc giấy tờ tại chỗ)
   └─ c. Xác nhận bàn giao cùng nhân viên (check tình trạng xe, chụp ảnh)
   
4. TRẢ XE
   ├─ a. Trả xe đúng điểm (hoặc giấy tờ tại chỗ)
   ├─ b. Nhân viên kiểm tra và xác nhận tình trạng xe
   └─ c. Thanh toán các chi phí phát sinh (nếu có)
   
5. LỊCH SỬ & PHẢN TÍCH CHI TIÊU
   └─ Xem lịch sử thuê xe, thống kê chi phí
```

---

## Chi tiết từng bước

### 1️⃣ ĐĂNG KÝ & XÁC THỰC

#### Người dùng (EV Renter):
- **Tạo tài khoản** qua app/website
- **Upload tài liệu**:
  - Giấy phép lái xe (Driver's License)
  - CMND/CCCD/Passport
  - Ảnh selfie để xác thực khuôn mặt
- **Xác thực nhận diện** tại điểm thuê lần đầu

#### API Calls:
```http
POST /api/user/register
POST /api/user/upload-documents
POST /api/user/verify-identity
```

---

### 2️⃣ ĐẶT XE (BOOKING)

#### a. Tìm điểm thuê trên bản đồ

**User Journey:**
1. Mở app/website
2. Xem bản đồ các trạm (stations) gần đó
3. Chọn trạm pickup và return
4. Chọn thời gian thuê

**API Calls:**
```http
GET /api/station?latitude=10.762622&longitude=106.660172&radius=5
GET /api/booking/check-availability?carId=1&pickupDateTime=...&returnDateTime=...
```

#### b. Xem danh sách xe có sẵn

**Thông tin hiển thị:**
- Loại xe (Brand, Model, Year)
- Dung lượng pin hiện tại (Battery Level)
- Quãng đường tối đa (Max Range)
- Giá thuê (Hourly/Daily Rate)
- Hình ảnh xe
- Đánh giá từ người dùng khác

**API Calls:**
```http
GET /api/car?stationId=1&status=Available&batteryLevel>=50
```

#### c. Đặt xe trước hoặc đến trực tiếp

**Đặt xe trước (Pre-booking):**
```http
POST /api/booking/create
{
  "userId": "user123",
  "carId": 1,
  "pickupStationId": 1,
  "returnStationId": 2,
  "pickupDateTime": "2024-10-10T10:00:00",
  "expectedReturnDateTime": "2024-10-11T10:00:00",
  "specialRequests": "Cần xe có ghế trẻ em"
}
```

**Thanh toán đặt cọc:**
```http
POST /api/payment/create
{
  "bookingId": 123,
  "amount": 2000000,
  "paymentMethod": "MoMo"
}
```

**Xác nhận booking sau thanh toán:**
```http
POST /api/booking/123/confirm
```

---

### 3️⃣ NHẬN XE (CHECK-IN)

#### a. Check-in tại quầy/ứng dụng

**Tại quầy:**
- Nhân viên quét QR code từ booking
- Xác thực danh tính (CMND + khuôn mặt)
- Kiểm tra giấy phép lái xe

**Qua app:**
- User scan QR code trên xe
- Hệ thống tự động check-in

**API Call:**
```http
POST /api/booking/check-in
{
  "bookingId": 123,
  "staffId": "staff001",
  "batteryLevelAtPickup": 95.5,
  "odometerAtPickup": 12500,
  "checkInNotes": "Xe trong tình trạng tốt",
  "checkInPhotoUrl": "https://..."
}
```

#### b. Ký hợp đồng điện tử

**Hợp đồng bao gồm:**
- Thông tin người thuê
- Thông tin xe
- Thời gian thuê
- Giá thuê và điều khoản
- Chữ ký điện tử

**API Call:**
```http
POST /api/contract/create
{
  "bookingId": 123,
  "contractType": "Rental",
  "terms": "..."
}
```

#### c. Xác nhận bàn giao

**Checklist:**
- ✅ Kiểm tra ngoại thất (scratches, dents)
- ✅ Kiểm tra nội thất (seats, dashboard)
- ✅ Kiểm tra pin (battery level)
- ✅ Kiểm tra đồng hồ km (odometer)
- ✅ Chụp ảnh 6 góc (front, back, left, right, interior, dashboard)

**Photos:**
```
📸 Front view
📸 Back view
📸 Left side
📸 Right side
📸 Interior
📸 Dashboard (showing battery & odometer)
```

---

### 4️⃣ TRẢ XE (CHECK-OUT)

#### a. Trả xe đúng điểm

**User Journey:**
1. Lái xe đến trạm return
2. Đỗ xe vào slot được chỉ định
3. Thông báo trả xe qua app

**API Call:**
```http
POST /api/booking/check-out
{
  "bookingId": 123,
  "staffId": "staff002",
  "batteryLevelAtReturn": 45.0,
  "odometerAtReturn": 12650,
  "checkOutNotes": "Xe có vết xước nhỏ ở cửa sau",
  "checkOutPhotoUrl": "https://..."
}
```

#### b. Nhân viên kiểm tra

**Checklist:**
- ✅ Kiểm tra ngoại thất (so sánh với ảnh check-in)
- ✅ Kiểm tra nội thất (vệ sinh, hư hỏng)
- ✅ Kiểm tra pin còn lại
- ✅ Kiểm tra số km đã chạy
- ✅ Chụp ảnh 6 góc

**Tính toán chi phí phát sinh:**

```javascript
// Late Fee (Phí trễ hạn)
if (actualReturnTime > expectedReturnTime) {
  const lateHours = Math.ceil((actualReturnTime - expectedReturnTime) / 3600000);
  lateFee = lateHours * hourlyRate * 1.5; // 150% giá thường
}

// Damage Fee (Phí hư hỏng)
if (hasDamage) {
  damageFee = assessDamage(); // Nhân viên đánh giá
}

// Cleaning Fee (Phí vệ sinh)
if (isDirty) {
  cleaningFee = 100000; // Fixed fee
}

// Total
actualAmount = totalAmount + lateFee + damageFee + cleaningFee;
```

#### c. Thanh toán chi phí phát sinh

**Nếu có phụ phí:**
```http
POST /api/payment/create
{
  "bookingId": 123,
  "amount": 50000,
  "paymentType": "AdditionalFee",
  "description": "Damage fee"
}
```

**Hoàn thành booking:**
```http
POST /api/booking/123/complete
```

**Hoàn trả tiền đặt cọc:**
```http
POST /api/payment/refund
{
  "bookingId": 123,
  "amount": 1950000,
  "reason": "Deposit refund after deducting damage fee"
}
```

---

### 5️⃣ LỊCH SỬ & PHẢN TÍCH CHI TIÊU

#### Xem lịch sử thuê xe

**API Call:**
```http
GET /api/booking/history/user123
```

**Response:**
```json
{
  "totalBookings": 15,
  "totalSpent": 7500000,
  "averagePerBooking": 500000,
  "bookings": [
    {
      "bookingId": 123,
      "carInfo": "VinFast VF8 2023",
      "pickupStation": "Trạm Q1 - Nguyễn Huệ",
      "returnStation": "Trạm Q3 - Võ Văn Tần",
      "pickupDateTime": "2024-10-10T10:00:00",
      "returnDateTime": "2024-10-11T10:00:00",
      "duration": "24 hours",
      "distance": "150 km",
      "totalAmount": 550000,
      "status": "Completed"
    }
  ]
}
```

#### Thống kê chi tiêu

**Dashboard hiển thị:**
- 📊 Tổng chi tiêu theo tháng
- 📈 Xu hướng thuê xe
- 🚗 Loại xe thuê nhiều nhất
- 💰 Chi phí trung bình mỗi chuyến
- ⭐ Điểm thưởng tích lũy

---

## 📱 User Experience Flow

```
┌──────────────┐
│   Open App   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  View Map    │ ◄─── Tìm trạm gần nhất
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Select Car   │ ◄─── Xem xe có sẵn
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Book & Pay   │ ◄─── Đặt xe & thanh toán
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Check-in    │ ◄─── Nhận xe tại trạm
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Drive 🚗    │ ◄─── Sử dụng xe
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Check-out   │ ◄─── Trả xe tại trạm
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Final Payment│ ◄─── Thanh toán phụ phí (nếu có)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Feedback   │ ◄─── Đánh giá dịch vụ
└──────────────┘
```

---

## 🔐 Security & Validation

### Check-in Validation:
- ✅ Booking must be "Confirmed"
- ✅ Current time within pickup window (±30 mins)
- ✅ User identity verified
- ✅ Car is available at station

### Check-out Validation:
- ✅ Booking must be "CheckedIn"
- ✅ Car returned to correct station
- ✅ Damage assessment completed
- ✅ Photos uploaded

---

## 📊 Business Rules

### Pricing:
- Hourly rate: < 24 hours
- Daily rate: ≥ 24 hours (cheaper per hour)
- Deposit: 20-30% of estimated total

### Late Return:
- Grace period: 15 minutes
- Late fee: 150% of hourly rate

### Cancellation:
- Free cancellation: > 24 hours before pickup
- 50% refund: 12-24 hours before pickup
- No refund: < 12 hours before pickup

---

## 🎯 Next Steps

1. Implement Payment integration (MoMo, ZaloPay, VNPay)
2. Add real-time car tracking
3. Implement push notifications
4. Add loyalty program
5. Integrate with Google Maps for navigation

