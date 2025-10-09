# 🔄 Migration Guide - Booking Model Updates

## Tóm tắt thay đổi

Bạn đã xóa các trường sau khỏi model `Booking`:
- BatteryLevelAtPickup, BatteryLevelAtReturn
- OdometerAtPickup, OdometerAtReturn
- CleaningFee
- CheckInStaffId, CheckOutStaffId
- SpecialRequests
- DiscountPercentage, DiscountAmount

---

## 🚀 Các bước thực hiện

### Bước 1: Xóa Migration cũ (nếu có)

**⚠️ CHỈ LÀM NẾU CHƯA CHẠY MIGRATION TRƯỚC ĐÓ!**

```bash
cd EVStation-basedRentalSysteEM.Services.BookingAPI

# Xem danh sách migrations
dotnet ef migrations list

# Nếu có migration "InitialCreate" mà chưa chạy, xóa nó
dotnet ef migrations remove
```

---

### Bước 2: Tạo Migration mới

```bash
cd EVStation-basedRentalSysteEM.Services.BookingAPI

# Tạo migration với tên rõ ràng
dotnet ef migrations add SimplifyBookingModel

# Hoặc nếu đây là migration đầu tiên
dotnet ef migrations add InitialCreate
```

**Output mong đợi:**
```
Build started...
Build succeeded.
To undo this action, use 'ef migrations remove'
```

---

### Bước 3: Kiểm tra Migration

```bash
# Xem SQL sẽ được chạy
dotnet ef migrations script

# Hoặc xem chi tiết migration
code Migrations/[timestamp]_SimplifyBookingModel.cs
```

**Migration sẽ tạo bảng Bookings với các cột:**
- BookingId (PK)
- UserId, CarId, PickupStationId, ReturnStationId
- PickupDateTime, ExpectedReturnDateTime, ActualReturnDateTime
- BookingStatus
- CheckInDateTime, CheckOutDateTime
- CheckInNotes, CheckOutNotes
- CheckInPhotoUrl, CheckOutPhotoUrl
- HourlyRate, DailyRate, DepositAmount
- TotalAmount, ActualAmount
- LateFee, DamageFee
- PaymentStatus, PaymentMethod, PaymentId
- CancellationReason, CancelledAt
- AdminNotes
- CouponId
- CreatedAt, UpdatedAt, IsActive

**❌ KHÔNG có các cột:**
- BatteryLevelAtPickup, BatteryLevelAtReturn
- OdometerAtPickup, OdometerAtReturn
- CleaningFee
- CheckInStaffId, CheckOutStaffId
- SpecialRequests
- DiscountPercentage, DiscountAmount

---

### Bước 4: Cập nhật Database

```bash
# Chạy migration
dotnet ef database update
```

**Output mong đợi:**
```
Build started...
Build succeeded.
Applying migration '20241009_SimplifyBookingModel'.
Done.
```

---

### Bước 5: Verify Database

#### Kiểm tra bằng SQL Server Management Studio:

```sql
-- Xem cấu trúc bảng
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    CHARACTER_MAXIMUM_LENGTH, 
    IS_NULLABLE
FROM 
    INFORMATION_SCHEMA.COLUMNS
WHERE 
    TABLE_NAME = 'Bookings'
ORDER BY 
    ORDINAL_POSITION;

-- Đếm số cột
SELECT COUNT(*) as TotalColumns
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Bookings';
-- Should return: 31 columns
```

#### Hoặc kiểm tra qua dotnet:

```bash
# Xem connection string
dotnet user-secrets list

# Test connection
dotnet ef dbcontext info
```

---

## 🧪 Testing sau Migration

### Test 1: Tạo Booking mới

```bash
# Start API
dotnet run
```

```http
POST https://localhost:7000/api/booking/create
Content-Type: application/json

{
  "userId": "test_user",
  "carId": 1,
  "pickupStationId": 1,
  "returnStationId": 1,
  "pickupDateTime": "2024-10-20T09:00:00",
  "expectedReturnDateTime": "2024-10-21T09:00:00",
  "couponId": null
}
```

**Expected Response:**
```json
{
  "isSuccess": true,
  "message": "Booking created successfully. Please proceed to payment.",
  "data": {
    "bookingId": 1,
    "bookingStatus": "Pending",
    "totalAmount": 500000,
    "depositAmount": 2000000
  }
}
```

---

### Test 2: Check-in (Simplified)

```http
POST https://localhost:7000/api/booking/check-in
Content-Type: application/json

{
  "bookingId": 1,
  "checkInNotes": "Xe trong tình trạng tốt",
  "checkInPhotoUrl": "https://storage.example.com/photo.jpg",
  "checkInDateTime": "2024-10-20T09:00:00"
}
```

**Expected Response:**
```json
{
  "isSuccess": true,
  "message": "Check-in completed successfully. Enjoy your ride!"
}
```

---

### Test 3: Check-out (Simplified)

```http
POST https://localhost:7000/api/booking/check-out
Content-Type: application/json

{
  "bookingId": 1,
  "checkOutNotes": "Xe có vết xước nhỏ",
  "checkOutPhotoUrl": "https://storage.example.com/photo2.jpg",
  "checkOutDateTime": "2024-10-21T09:30:00",
  "lateFee": 25000,
  "damageFee": 100000
}
```

**Expected Response:**
```json
{
  "isSuccess": true,
  "message": "Check-out completed successfully. Please proceed to final payment.",
  "data": {
    "bookingStatus": "CheckedOut",
    "totalAmount": 500000,
    "lateFee": 25000,
    "damageFee": 100000,
    "actualAmount": 625000
  }
}
```

---

## 🔄 Rollback (Nếu cần)

### Nếu cần quay lại migration trước:

```bash
# Xem danh sách migrations
dotnet ef migrations list

# Rollback về migration trước
dotnet ef database update [PreviousMigrationName]

# Hoặc rollback tất cả
dotnet ef database update 0

# Xóa migration
dotnet ef migrations remove
```

---

## 📋 Checklist hoàn thành

Sau khi migration xong, kiểm tra:

- [ ] ✅ Database đã được update
- [ ] ✅ Bảng `Bookings` có đúng 31 cột
- [ ] ✅ API chạy không lỗi (`dotnet run`)
- [ ] ✅ Swagger UI hiển thị đúng (`https://localhost:7000/swagger`)
- [ ] ✅ Test create booking thành công
- [ ] ✅ Test check-in thành công
- [ ] ✅ Test check-out thành công
- [ ] ✅ Không có linter errors
- [ ] ✅ Không có runtime errors

---

## ⚠️ Troubleshooting

### Lỗi: "The name 'BatteryLevelAtPickup' does not exist"

**Nguyên nhân:** Code cũ còn reference đến trường đã xóa

**Giải pháp:**
```bash
# Clean và rebuild
dotnet clean
dotnet build
```

---

### Lỗi: "A network-related or instance-specific error"

**Nguyên nhân:** SQL Server chưa chạy hoặc connection string sai

**Giải pháp:**
```bash
# Kiểm tra SQL Server
# Check appsettings.json connection string
code appsettings.json
```

---

### Lỗi: "There is already an object named 'Bookings'"

**Nguyên nhân:** Bảng đã tồn tại

**Giải pháp:**
```sql
-- Drop table (⚠️ MẤT DỮ LIỆU!)
DROP TABLE Bookings;

-- Sau đó chạy lại migration
dotnet ef database update
```

---

## 📊 So sánh Before/After

### Before (Old Model):
```
40 properties in Booking class
Including: Battery levels, Odometer readings, Staff IDs, 
Special requests, Discount details, Cleaning fee
```

### After (New Model):
```
30 properties in Booking class
Focused on: Core booking data, Pricing, Payment, 
Check-in/out with notes and photos
```

**Giảm:** 10 properties (25% đơn giản hơn!)

---

## 🎯 Kết luận

Migration đã được chuẩn bị sẵn sàng! 

**Các thay đổi chính:**
1. ✅ Model đơn giản hơn
2. ✅ DTOs đã được cập nhật
3. ✅ Service layer đã được cập nhật
4. ✅ Không có linter errors
5. ✅ Sẵn sàng để chạy migration

**Chạy ngay:**
```bash
cd EVStation-basedRentalSysteEM.Services.BookingAPI
dotnet ef migrations add SimplifyBookingModel
dotnet ef database update
dotnet run
```

**Sau đó test API tại:** https://localhost:7000/swagger

Good luck! 🚀

