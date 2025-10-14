# 🚗 Hướng Dẫn Sử Dụng APIs Cho Người Thuê Xe (EV Renter)

## 📋 Mục Lục
1. [Tổng Quan](#tổng-quan)
2. [Xác Thực (Authentication)](#xác-thực)
3. [Tìm Kiếm Xe](#tìm-kiếm-xe)
4. [Quy Trình Đặt Xe](#quy-trình-đặt-xe)
5. [Nhận Xe (Check-in)](#nhận-xe-check-in)
6. [Trả Xe (Check-out)](#trả-xe-check-out)
7. [Quản Lý Booking](#quản-lý-booking)

---

## 🌟 Tổng Quan

Hệ thống EV Station-based Rental System cung cấp các APIs cho phép người thuê xe:
- ✅ Tìm kiếm và xem thông tin xe có sẵn
- ✅ Đặt xe trước hoặc đến trực tiếp tại điểm
- ✅ Check-in nhận xe với hợp đồng điện tử
- ✅ Check-out trả xe và thanh toán các chi phí phát sinh

### URL Cơ Sở
```
http://localhost:5054/api
```

### Swagger UI
```
http://localhost:5054/swagger
```

---

## 🔐 Xác Thực (Authentication)

### 1. Đăng Ký Tài Khoản

**Endpoint:** `POST /api/Auth/Register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "fullName": "Nguyễn Văn A",
  "phoneNumber": "0123456789"
}
```

**Response:**
```json
{
  "isSuccess": true,
  "message": "User registered successfully",
  "data": {
    "id": "guid-here",
    "email": "user@example.com",
    "firstName": "Nguyễn Văn",
    "lastName": "A",
    "phoneNumber": "0123456789",
    "userRole": "EV Renter",
    "isActive": true,
    "createdAt": "2025-01-14T10:00:00Z"
  }
}
```

### 2. Đăng Nhập

**Endpoint:** `POST /api/Auth/Login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

**Response:**
```json
{
  "isSuccess": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh-token-here",
    "user": {
      "id": "guid-here",
      "email": "user@example.com",
      "firstName": "Nguyễn Văn",
      "lastName": "A",
      "userRole": "EV Renter"
    }
  }
}
```

**⚠️ Lưu ý:** Sử dụng `token` trong header `Authorization: Bearer {token}` cho các request tiếp theo.

---

## 🔍 Tìm Kiếm Xe

### 1. Xem Danh Sách Xe Có Sẵn

**Endpoint:** `GET /api/Cars/Search-Available`

**Query Parameters:**
| Tham số | Loại | Bắt buộc | Mô tả |
|---------|------|----------|-------|
| stationId | Guid | Không | Lọc theo trạm cụ thể |
| brand | string | Không | Lọc theo hãng xe (VinFast, Tesla, ...) |
| model | string | Không | Lọc theo model xe |
| minPrice | decimal | Không | Giá thuê tối thiểu (VNĐ/giờ) |
| maxPrice | decimal | Không | Giá thuê tối đa (VNĐ/giờ) |
| minBatteryLevel | decimal | Không | Mức pin tối thiểu (%) |
| page | int | Không | Trang hiện tại (mặc định: 1) |
| pageSize | int | Không | Số lượng/trang (mặc định: 20) |

**Example Request:**
```http
GET /api/Cars/Search-Available?brand=VinFast&minBatteryLevel=80&minPrice=50000&maxPrice=150000
Authorization: Bearer {your-token}
```

**Response:**
```json
{
  "isSuccess": true,
  "message": "Found 5 available cars",
  "data": [
    {
      "id": "car-guid-1",
      "brand": "VinFast",
      "model": "VF e34",
      "year": 2024,
      "color": "Trắng",
      "licensePlate": "30A-12345",
      "batteryCapacity": 42.0,
      "currentBatteryLevel": 95.0,
      "rentalPricePerHour": 100000,
      "isAvailable": true,
      "currentStationId": "station-guid",
      "currentStationName": "Trạm Quận 1",
      "isActive": true
    }
  ]
}
```

### 2. Xem Xe Tại Một Trạm

**Endpoint:** `GET /api/Cars/Get-Available-By-Station/{stationId}`

**Example Request:**
```http
GET /api/Cars/Get-Available-By-Station/station-guid-here
Authorization: Bearer {your-token}
```

### 3. Xem Chi Tiết Một Xe

**Endpoint:** `GET /api/Cars/Get-By-{id}`

**Example Request:**
```http
GET /api/Cars/Get-By-car-guid-here
Authorization: Bearer {your-token}
```

---

## 📅 Quy Trình Đặt Xe

### Bước 1: Tạo Booking

**Endpoint:** `POST /api/Bookings/Create`

**🎯 Hỗ trợ 2 loại đặt xe:**
1. **Đặt trước:** `pickupDateTime` trong tương lai
2. **Đến trực tiếp (Walk-in):** `pickupDateTime` = thời gian hiện tại hoặc trong vòng 30 phút

**Request:**
```http
POST /api/Bookings/Create?userId=your-user-id
Authorization: Bearer {your-token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "carId": "car-guid-here",
  "pickupStationId": "station-guid-here",
  "returnStationId": "station-guid-here",
  "pickupDateTime": "2025-01-15T10:00:00Z",
  "expectedReturnDateTime": "2025-01-15T18:00:00Z"
}
```

**Response:**
```json
{
  "isSuccess": true,
  "message": "",
  "data": {
    "bookingId": "booking-guid",
    "userId": "user-guid",
    "carId": "car-guid",
    "carInfo": "VinFast VF e34 (30A-12345)",
    "pickupStationName": "Trạm Quận 1",
    "pickupDateTime": "2025-01-15T10:00:00Z",
    "expectedReturnDateTime": "2025-01-15T18:00:00Z",
    "bookingStatus": "Pending",
    "totalAmount": 800000,
    "paymentStatus": "Pending"
  }
}
```

### Bước 2: Xác Nhận Sau Thanh Toán

**Endpoint:** `POST /api/Bookings/Confirm`

**Request Body:**
```json
{
  "bookingId": "booking-guid-here",
  "paymentMethod": "VNPay",
  "paymentTransactionId": "TXN123456789"
}
```

**Response:**
```json
{
  "isSuccess": true,
  "data": {
    "bookingId": "booking-guid",
    "bookingStatus": "Confirmed",
    "paymentStatus": "Paid",
    "totalAmount": 800000
  }
}
```

---

## 🚘 Nhận Xe (Check-in)

### Bước 3: Check-in Tại Trạm

**Endpoint:** `POST /api/Bookings/Check-In`

**📝 Quy trình:**
1. ✅ Đến trạm đúng giờ hẹn
2. ✅ Xác nhận với nhân viên
3. ✅ Kiểm tra tình trạng xe
4. ✅ Chụp ảnh xe (tùy chọn)
5. ✅ Ký hợp đồng điện tử (tự động tạo)
6. ✅ Nhận xe

**Request Body:**
```json
{
  "bookingId": "booking-guid-here",
  "checkInNotes": "Xe trong tình trạng tốt, đầy đủ phụ kiện",
  "checkInPhotoUrl": "https://storage.example.com/check-in-photos/photo1.jpg"
}
```

**Response:**
```json
{
  "isSuccess": true,
  "message": "Check-in thành công. Hợp đồng đã được tạo.",
  "data": {
    "bookingId": "booking-guid",
    "bookingStatus": "CheckedIn",
    "actualStartTime": "2025-01-15T10:05:00Z",
    "contractId": "contract-guid-here"
  }
}
```

**⚠️ Lưu ý:**
- Phải có trạng thái `Confirmed` mới được check-in
- Hợp đồng điện tử được tạo tự động
- Lưu URL ảnh để làm bằng chứng khi cần

---

## 🏁 Trả Xe (Check-out)

### Bước 4: Check-out Tại Trạm

**Endpoint:** `POST /api/Bookings/Check-Out`

**📝 Quy trình:**
1. ✅ Trả xe đúng điểm (hoặc điểm khác nếu được phép)
2. ✅ Nhân viên kiểm tra tình trạng xe
3. ✅ Chụp ảnh xe khi trả
4. ✅ Tính phí trễ hạn (nếu có)
5. ✅ Tính phí hư hỏng (nếu có)

**Request Body:**
```json
{
  "bookingId": "booking-guid-here",
  "checkOutNotes": "Xe trả đúng giờ, không có hư hỏng",
  "checkOutPhotoUrl": "https://storage.example.com/check-out-photos/photo1.jpg",
  "lateFee": 0,
  "damageFee": 0
}
```

**Response:**
```json
{
  "isSuccess": true,
  "message": "Check-out thành công",
  "data": {
    "bookingId": "booking-guid",
    "bookingStatus": "CheckedOut",
    "actualReturnDateTime": "2025-01-15T18:00:00Z",
    "totalAmount": 800000,
    "lateFee": 0,
    "damageFee": 0,
    "finalAmount": 800000,
    "paymentStatus": "Pending"
  }
}
```

**💰 Tính Phí Phát Sinh:**

| Loại Phí | Cách Tính |
|----------|-----------|
| **Phí trễ hạn** | Mỗi giờ trễ = giá thuê theo giờ × 1.5 |
| **Phí hư hỏng** | Do nhân viên đánh giá |
| **Tổng cộng** | TotalAmount + LateFee + DamageFee |

### Bước 5: Hoàn Tất Booking

**Endpoint:** `POST /api/Bookings/Complete-By-{bookingId}`

**Request:**
```http
POST /api/Bookings/Complete-By-booking-guid-here
Authorization: Bearer {your-token}
```

**Response:**
```json
{
  "isSuccess": true,
  "message": "Booking đã hoàn tất",
  "data": {
    "bookingId": "booking-guid",
    "bookingStatus": "Completed",
    "paymentStatus": "Paid",
    "finalAmount": 800000
  }
}
```

---

## 📊 Quản Lý Booking

### 1. Xem Booking Đang Hoạt Động

**Endpoint:** `GET /api/Bookings/Get-Active-By-User/{userId}`

**Response:**
```json
{
  "isSuccess": true,
  "data": {
    "bookingId": "booking-guid",
    "bookingStatus": "CheckedIn",
    "car": {
      "brand": "VinFast",
      "model": "VF e34",
      "licensePlate": "30A-12345"
    },
    "pickupStation": {
      "name": "Trạm Quận 1",
      "address": "123 Nguyễn Huệ, Q1, HCM"
    }
  }
}
```

### 2. Xem Lịch Sử Đặt Xe

**Endpoint:** `GET /api/Bookings/Get-History-By-User/{userId}`

**Response:**
```json
{
  "isSuccess": true,
  "data": [
    {
      "bookingId": "booking-guid-1",
      "carInfo": "VinFast VF e34 (30A-12345)",
      "pickupStationName": "Trạm Quận 1",
      "pickupDateTime": "2025-01-10T10:00:00Z",
      "actualReturnDateTime": "2025-01-10T18:00:00Z",
      "totalAmount": 800000,
      "bookingStatus": "Completed"
    }
  ]
}
```

### 3. Hủy Booking

**Endpoint:** `POST /api/Bookings/Cancel-By-{id}`

**Request:**
```http
POST /api/Bookings/Cancel-By-booking-guid?userId=your-user-id
Authorization: Bearer {your-token}
Content-Type: application/json

"Lý do hủy: Có việc đột xuất"
```

**Response:**
```json
{
  "isSuccess": true,
  "message": "Booking đã được hủy",
  "data": "Cancelled"
}
```

**⚠️ Chính Sách Hủy:**
- Hủy trước 24h: Hoàn tiền 100%
- Hủy trước 12h: Hoàn tiền 50%
- Hủy trong vòng 12h: Không hoàn tiền

### 4. Tính Toán Chi Phí

**Endpoint:** `GET /api/Bookings/Calculate-Cost`

**Query Parameters:**
```
?carId=car-guid&startTime=2025-01-15T10:00:00Z&endTime=2025-01-15T18:00:00Z
```

**Response:**
```json
{
  "isSuccess": true,
  "data": 800000,
  "message": "Estimated cost for 8 hours"
}
```

---

## 📱 Flow Diagram - Quy Trình Hoàn Chỉnh

```
┌─────────────────────────────────────────────────────────────┐
│ 1. ĐĂNG KÝ/ĐĂNG NHẬP                                        │
│    POST /api/Auth/Register hoặc /api/Auth/Login            │
│    ➜ Nhận JWT Token                                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. TÌM KIẾM XE                                              │
│    GET /api/Cars/Search-Available                           │
│    ➜ Chọn xe phù hợp (loại, giá, pin, trạm)                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. TẠO BOOKING                                              │
│    POST /api/Bookings/Create                                │
│    ➜ Status: Pending                                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. THANH TOÁN & XÁC NHẬN                                    │
│    POST /api/Bookings/Confirm                               │
│    ➜ Status: Confirmed                                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. CHECK-IN (NHẬN XE)                                       │
│    POST /api/Bookings/Check-In                              │
│    ➜ Kiểm tra xe, chụp ảnh, ký hợp đồng                    │
│    ➜ Status: CheckedIn                                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. SỬ DỤNG XE                                               │
│    ⏱️ Thời gian sử dụng                                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. CHECK-OUT (TRẢ XE)                                       │
│    POST /api/Bookings/Check-Out                             │
│    ➜ Kiểm tra xe, tính phí phát sinh                       │
│    ➜ Status: CheckedOut                                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. HOÀN TẤT                                                 │
│    POST /api/Bookings/Complete-By-{bookingId}               │
│    ➜ Thanh toán phí phát sinh                              │
│    ➜ Status: Completed                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚡ Ví Dụ Thực Tế

### Scenario: Thuê xe VinFast VF e34 trong 1 ngày

#### 1. Tìm xe phù hợp
```bash
curl -X GET "http://localhost:5054/api/Cars/Search-Available?brand=VinFast&minBatteryLevel=80" \
  -H "Authorization: Bearer {your-token}"
```

#### 2. Tạo booking
```bash
curl -X POST "http://localhost:5054/api/Bookings/Create?userId={your-user-id}" \
  -H "Authorization: Bearer {your-token}" \
  -H "Content-Type: application/json" \
  -d '{
    "carId": "{car-id}",
    "pickupStationId": "{station-id}",
    "pickupDateTime": "2025-01-15T08:00:00Z",
    "expectedReturnDateTime": "2025-01-15T20:00:00Z"
  }'
```

#### 3. Xác nhận booking
```bash
curl -X POST "http://localhost:5054/api/Bookings/Confirm" \
  -H "Authorization: Bearer {your-token}" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "{booking-id}",
    "paymentMethod": "VNPay",
    "paymentTransactionId": "TXN123"
  }'
```

#### 4. Check-in
```bash
curl -X POST "http://localhost:5054/api/Bookings/Check-In" \
  -H "Authorization: Bearer {your-token}" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "{booking-id}",
    "checkInNotes": "Xe tốt",
    "checkInPhotoUrl": "https://example.com/photo.jpg"
  }'
```

#### 5. Check-out
```bash
curl -X POST "http://localhost:5054/api/Bookings/Check-Out" \
  -H "Authorization: Bearer {your-token}" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "{booking-id}",
    "checkOutNotes": "Trả xe đúng giờ",
    "lateFee": 0,
    "damageFee": 0
  }'
```

---

## 🆘 Xử Lý Lỗi Thường Gặp

| Mã Lỗi | Nguyên Nhân | Giải Pháp |
|---------|-------------|-----------|
| 401 Unauthorized | Token hết hạn | Làm mới token bằng `/api/Auth/Refresh-Token` |
| 400 Bad Request | Dữ liệu không hợp lệ | Kiểm tra lại request body |
| 404 Not Found | Không tìm thấy tài nguyên | Kiểm tra lại ID |
| 409 Conflict | Xe đã được đặt | Chọn xe khác hoặc thời gian khác |

---

## 📞 Hỗ Trợ

Nếu cần hỗ trợ, vui lòng liên hệ:
- 📧 Email: support@evstation.com
- 📱 Hotline: 1900-xxxx
- 🌐 Website: https://evstation.com

---

**Phiên bản:** 1.0  
**Cập nhật lần cuối:** 14/01/2025

