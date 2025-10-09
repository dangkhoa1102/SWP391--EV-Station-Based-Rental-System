# EV Station Booking API

API quản lý đặt xe trong hệ thống cho thuê xe điện tại trạm (EV Station-Based Rental System).

## 🚗 Mainflow Đặt Xe (Car Rental Flow)

### **1. Đăng ký & Xác thực (Registration & Authentication)**
- Tạo tài khoản, upload giấy phép lái xe, CMND/CCCD
- Xác thực nhận diện tại điểm thuê

### **2. Đặt xe (Booking)**

#### **a. Tìm điểm thuê trên bản đồ**
```http
GET /api/booking/check-availability?carId=1&pickupDateTime=2024-10-10T10:00:00&returnDateTime=2024-10-11T10:00:00
```

#### **b. Xem danh sách xe có sẵn (loại, dung lượng pin, giá)**
```http
GET /api/car?stationId=1&status=Available
```

#### **c. Đặt xe trước hoặc đến trực tiếp điểm thuê**
```http
POST /api/booking/create
Content-Type: application/json

{
  "userId": "user123",
  "carId": 1,
  "pickupStationId": 1,
  "returnStationId": 2,
  "pickupDateTime": "2024-10-10T10:00:00",
  "expectedReturnDateTime": "2024-10-11T10:00:00",
  "specialRequests": "Cần xe có ghế trẻ em",
  "couponId": 5
}
```

**Response:**
```json
{
  "isSuccess": true,
  "message": "Booking created successfully. Please proceed to payment.",
  "data": {
    "bookingId": 123,
    "totalAmount": 500000,
    "depositAmount": 2000000,
    "bookingStatus": "Pending"
  }
}
```

### **3. Nhận xe (Check-in)**

#### **a. Check-in tại quầy/ứng dụng**
```http
POST /api/booking/check-in
Content-Type: application/json

{
  "bookingId": 123,
  "staffId": "staff001",
  "batteryLevelAtPickup": 95.5,
  "odometerAtPickup": 12500,
  "checkInNotes": "Xe trong tình trạng tốt",
  "checkInPhotoUrl": "https://storage.example.com/checkin-123.jpg"
}
```

#### **b. Ký hợp đồng điện tử (hoặc giấy tờ tại chỗ)**
- Hệ thống tự động tạo contract khi check-in thành công

#### **c. Xác nhận bàn giao cùng nhân viên (check tình trạng xe, chụp ảnh)**
- Battery level: 95.5%
- Odometer: 12,500 km
- Photos: Front, Back, Left, Right, Interior

### **4. Trả xe (Check-out)**

#### **a. Trả xe đúng điểm (hoặc giấy tờ tại chỗ)**
```http
POST /api/booking/check-out
Content-Type: application/json

{
  "bookingId": 123,
  "staffId": "staff002",
  "batteryLevelAtReturn": 45.0,
  "odometerAtReturn": 12650,
  "checkOutNotes": "Xe có vết xước nhỏ ở cửa sau",
  "checkOutPhotoUrl": "https://storage.example.com/checkout-123.jpg",
  "lateFee": 0,
  "damageFee": 50000,
  "cleaningFee": 0
}
```

#### **b. Nhân viên kiểm tra và xác nhận tình trạng xe**
- Battery level: 45%
- Odometer: 12,650 km (đã chạy 150km)
- Damage assessment: Vết xước nhỏ - 50,000 VND

#### **c. Xác nhận bàn giao cùng nhân viên (check tình trạng xe, chụp ảnh)**

### **5. Thanh toán các chi phí phát sinh (nếu có)**

```http
POST /api/booking/123/complete
```

**Các chi phí có thể phát sinh:**
- ✅ Phí trễ hạn (Late Fee): Nếu trả xe muộn
- ✅ Phí hư hỏng (Damage Fee): Nếu xe bị hư hỏng
- ✅ Phí vệ sinh (Cleaning Fee): Nếu xe quá bẩn

**Response:**
```json
{
  "isSuccess": true,
  "message": "Booking completed successfully. Thank you for using our service!",
  "data": {
    "bookingId": 123,
    "totalAmount": 500000,
    "lateFee": 0,
    "damageFee": 50000,
    "cleaningFee": 0,
    "actualAmount": 550000,
    "bookingStatus": "Completed"
  }
}
```

### **6. Lịch sử & Phản tích chi tiêu**

```http
GET /api/booking/history/user123
```

**Response:**
```json
{
  "isSuccess": true,
  "data": [
    {
      "bookingId": 123,
      "carInfo": "VinFast VF8 2023",
      "pickupDateTime": "2024-10-10T10:00:00",
      "returnDateTime": "2024-10-11T10:00:00",
      "totalAmount": 550000,
      "bookingStatus": "Completed"
    }
  ]
}
```

## 📊 Booking Status Flow

```
Pending → Confirmed → CheckedIn → CheckedOut → Completed
   ↓
Cancelled
```

- **Pending**: Đang chờ thanh toán
- **Confirmed**: Đã thanh toán, chờ nhận xe
- **CheckedIn**: Đã nhận xe, đang sử dụng
- **CheckedOut**: Đã trả xe, chờ thanh toán phụ phí
- **Completed**: Hoàn thành
- **Cancelled**: Đã hủy

## 🔧 Database Schema

### Booking Table
```sql
- BookingId (PK)
- UserId (FK to UserAPI)
- CarId (FK to CarAPI)
- PickupStationId (FK to StationAPI)
- ReturnStationId (FK to StationAPI)
- PickupDateTime
- ExpectedReturnDateTime
- ActualReturnDateTime
- BookingStatus
- CheckInDateTime
- CheckOutDateTime
- BatteryLevelAtPickup
- BatteryLevelAtReturn
- OdometerAtPickup
- OdometerAtReturn
- HourlyRate
- DailyRate
- DepositAmount
- TotalAmount
- ActualAmount
- LateFee
- DamageFee
- CleaningFee
- PaymentStatus
- PaymentMethod
- CheckInStaffId
- CheckOutStaffId
- CouponId
- DiscountAmount
- CreatedAt
- UpdatedAt
```

## 🚀 Setup Instructions

### 1. Update Connection String
Edit `appsettings.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=YOUR_SERVER;Database=EVStationBookingDB;..."
  }
}
```

### 2. Run Migrations
```bash
dotnet ef migrations add InitialCreate
dotnet ef database update
```

### 3. Run the API
```bash
dotnet run
```

### 4. Access Swagger UI
```
https://localhost:7000/swagger
```

## 📝 API Endpoints Summary

### Booking Management
- `POST /api/booking/create` - Tạo booking mới
- `POST /api/booking/{id}/confirm` - Xác nhận booking sau thanh toán
- `POST /api/booking/check-in` - Check-in nhận xe
- `POST /api/booking/check-out` - Check-out trả xe
- `POST /api/booking/{id}/complete` - Hoàn thành booking
- `GET /api/booking/{id}` - Lấy thông tin booking
- `GET /api/booking/user/{userId}` - Lấy booking của user
- `POST /api/booking/{id}/cancel` - Hủy booking
- `PUT /api/booking/{id}` - Cập nhật booking

### Availability & History
- `GET /api/booking/check-availability` - Kiểm tra xe có sẵn
- `GET /api/booking/history/{userId}` - Lịch sử đặt xe
- `GET /api/booking/upcoming` - Các booking sắp tới

## 🔗 Inter-Service Communication

Booking API giao tiếp với:
- **CarAPI**: Lấy thông tin xe, cập nhật trạng thái xe
- **StationAPI**: Lấy thông tin trạm, kiểm tra slot
- **PaymentAPI**: Xử lý thanh toán
- **CouponAPI**: Áp dụng mã giảm giá
- **UserAPI**: Xác thực người dùng
- **ContractAPI**: Tạo hợp đồng điện tử

## 📞 Support

For issues or questions, contact the development team.

