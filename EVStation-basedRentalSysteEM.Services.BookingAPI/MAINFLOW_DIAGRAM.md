# 🚗 Mainflow Đặt Xe - Visual Diagram

## 📊 Complete Booking Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         EV STATION RENTAL SYSTEM                             │
│                              MAINFLOW ĐẶT XE                                 │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐
│   USER APP   │
└──────┬───────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. ĐĂNG KÝ & XÁC THỰC                                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐   │
│ │ Tạo tài khoản    │ ───> │ Upload giấy tờ   │ ───> │ Xác thực nhận    │   │
│ │ (Register)       │      │ (CMND, GPLX)     │      │ diện tại trạm    │   │
│ └──────────────────┘      └──────────────────┘      └──────────────────┘   │
│                                                                               │
│ API: POST /api/user/register                                                 │
│      POST /api/user/upload-documents                                         │
│      POST /api/user/verify-identity                                          │
└─────────────────────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. ĐẶT XE (BOOKING)                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│ a. TÌM ĐIỂM THUÊ TRÊN BẢN ĐỒ                                                │
│ ┌────────────────────────────────────────────────────────────────────────┐  │
│ │  🗺️  Xem bản đồ các trạm (Stations)                                    │  │
│ │  📍  Chọn trạm pickup & return                                          │  │
│ │  📅  Chọn thời gian thuê                                                │  │
│ └────────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
│ API: GET /api/station?latitude=X&longitude=Y&radius=5                        │
│      GET /api/booking/check-availability?carId=1&pickupDateTime=...          │
│                                                                               │
│ b. XEM DANH SÁCH XE CÓ SẴN                                                   │
│ ┌────────────────────────────────────────────────────────────────────────┐  │
│ │  🚗 Loại xe: VinFast VF8 2023                                           │  │
│ │  🔋 Pin: 95% (Max range: 400km)                                         │  │
│ │  💰 Giá: 50,000đ/giờ - 500,000đ/ngày                                    │  │
│ │  ⭐ Rating: 4.8/5 (120 reviews)                                         │  │
│ │  📸 [Hình ảnh xe]                                                       │  │
│ └────────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
│ API: GET /api/car?stationId=1&status=Available                               │
│                                                                               │
│ c. ĐẶT XE TRƯỚC HOẶC ĐẾN TRỰC TIẾP                                          │
│ ┌────────────────────────────────────────────────────────────────────────┐  │
│ │  ✅ Chọn xe                                                             │  │
│ │  ✅ Chọn thời gian pickup & return                                      │  │
│ │  ✅ Nhập yêu cầu đặc biệt (nếu có)                                      │  │
│ │  ✅ Áp dụng mã giảm giá (nếu có)                                        │  │
│ │  ✅ Xác nhận booking                                                    │  │
│ └────────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
│ API: POST /api/booking/create                                                │
│                                                                               │
│ Response:                                                                     │
│ {                                                                             │
│   "bookingId": 1001,                                                          │
│   "totalAmount": 500000,                                                      │
│   "depositAmount": 2000000,                                                   │
│   "bookingStatus": "Pending"                                                  │
│ }                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 💳 THANH TOÁN ĐẶT CỌC                                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│ │   MoMo       │  │   ZaloPay    │  │   VNPay      │  │   Thẻ        │     │
│ └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                                               │
│ Thanh toán: Tiền thuê (500,000đ) + Đặt cọc (2,000,000đ) = 2,500,000đ       │
│                                                                               │
│ API: POST /api/payment/create                                                │
│      POST /api/booking/1001/confirm (after payment success)                  │
│                                                                               │
│ Status: Pending → Confirmed ✅                                               │
└─────────────────────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. NHẬN XE (CHECK-IN)                                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│ a. CHECK-IN TẠI QUẦY/ỨNG DỤNG                                                │
│ ┌────────────────────────────────────────────────────────────────────────┐  │
│ │  Tại quầy:                                                              │  │
│ │  • Nhân viên quét QR code từ booking                                    │  │
│ │  • Xác thực danh tính (CMND + Face ID)                                  │  │
│ │  • Kiểm tra giấy phép lái xe                                            │  │
│ │                                                                          │  │
│ │  Qua app:                                                                │  │
│ │  • User scan QR code trên xe                                             │  │
│ │  • Hệ thống tự động check-in                                             │  │
│ └────────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
│ b. KÝ HỢP ĐỒNG ĐIỆN TỬ                                                       │
│ ┌────────────────────────────────────────────────────────────────────────┐  │
│ │  📄 Hợp đồng thuê xe                                                    │  │
│ │  • Thông tin người thuê                                                  │  │
│ │  • Thông tin xe                                                          │  │
│ │  • Thời gian thuê                                                        │  │
│ │  • Giá thuê & điều khoản                                                 │  │
│ │  • ✍️  Chữ ký điện tử                                                   │  │
│ └────────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
│ API: POST /api/contract/create                                               │
│                                                                               │
│ c. XÁC NHẬN BÀN GIAO CÙNG NHÂN VIÊN                                          │
│ ┌────────────────────────────────────────────────────────────────────────┐  │
│ │  ✅ Kiểm tra ngoại thất (scratches, dents)                              │  │
│ │  ✅ Kiểm tra nội thất (seats, dashboard)                                │  │
│ │  ✅ Kiểm tra pin: 98.5% 🔋                                              │  │
│ │  ✅ Kiểm tra đồng hồ km: 15,420 km 🛣️                                  │  │
│ │  ✅ Chụp ảnh 6 góc: 📸📸📸📸📸📸                                        │  │
│ │     (Front, Back, Left, Right, Interior, Dashboard)                     │  │
│ └────────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
│ API: POST /api/booking/check-in                                              │
│ {                                                                             │
│   "bookingId": 1001,                                                          │
│   "staffId": "staff_nguyen",                                                  │
│   "batteryLevelAtPickup": 98.5,                                               │
│   "odometerAtPickup": 15420,                                                  │
│   "checkInPhotoUrl": "https://..."                                            │
│ }                                                                             │
│                                                                               │
│ Status: Confirmed → CheckedIn ✅                                             │
└─────────────────────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🚗 SỬ DỤNG XE                                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ • Lái xe an toàn                                                             │
│ • Tuân thủ luật giao thông                                                   │
│ • Giữ xe sạch sẽ                                                             │
│ • Sạc pin khi cần thiết                                                      │
└─────────────────────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 4. TRẢ XE (CHECK-OUT)                                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│ a. TRẢ XE ĐÚNG ĐIỂM                                                          │
│ ┌────────────────────────────────────────────────────────────────────────┐  │
│ │  1. Lái xe đến trạm return                                               │  │
│ │  2. Đỗ xe vào slot được chỉ định                                         │  │
│ │  3. Thông báo trả xe qua app                                             │  │
│ └────────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
│ b. NHÂN VIÊN KIỂM TRA VÀ XÁC NHẬN TÌNH TRẠNG XE                             │
│ ┌────────────────────────────────────────────────────────────────────────┐  │
│ │  ✅ Kiểm tra ngoại thất (so sánh với ảnh check-in)                      │  │
│ │  ✅ Kiểm tra nội thất (vệ sinh, hư hỏng)                                │  │
│ │  ✅ Kiểm tra pin còn lại: 42% 🔋                                        │  │
│ │  ✅ Kiểm tra số km đã chạy: 15,580 km (đã chạy 160km)                   │  │
│ │  ✅ Chụp ảnh 6 góc: 📸📸📸📸📸📸                                        │  │
│ │                                                                          │  │
│ │  ⚠️  Phát hiện:                                                         │  │
│ │  • Vết xước nhỏ ở cửa sau bên phải → Phí hư hỏng: 100,000đ             │  │
│ │  • Trả xe trễ 30 phút → Phí trễ hạn: 25,000đ                            │  │
│ └────────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
│ API: POST /api/booking/check-out                                             │
│ {                                                                             │
│   "bookingId": 1001,                                                          │
│   "staffId": "staff_tran",                                                    │
│   "batteryLevelAtReturn": 42.0,                                               │
│   "odometerAtReturn": 15580,                                                  │
│   "lateFee": 25000,                                                           │
│   "damageFee": 100000,                                                        │
│   "cleaningFee": 0                                                            │
│ }                                                                             │
│                                                                               │
│ c. THANH TOÁN CÁC CHI PHÍ PHÁT SINH                                          │
│ ┌────────────────────────────────────────────────────────────────────────┐  │
│ │  Tổng kết chi phí:                                                       │  │
│ │  • Tiền thuê cơ bản:     500,000đ                                        │  │
│ │  • Phí trễ hạn:           25,000đ                                        │  │
│ │  • Phí hư hỏng:          100,000đ                                        │  │
│ │  • Phí vệ sinh:                0đ                                        │  │
│ │  ─────────────────────────────────                                       │  │
│ │  • TỔNG CỘNG:            625,000đ                                        │  │
│ │                                                                          │  │
│ │  Hoàn trả tiền đặt cọc:                                                  │  │
│ │  • Đặt cọc ban đầu:    2,000,000đ                                        │  │
│ │  • Trừ phụ phí:         -125,000đ                                        │  │
│ │  ─────────────────────────────────                                       │  │
│ │  • HOÀN TRẢ:           1,875,000đ ✅                                     │  │
│ └────────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
│ API: POST /api/payment/create (additional fees)                              │
│      POST /api/payment/refund (deposit refund)                               │
│      POST /api/booking/1001/complete                                         │
│                                                                               │
│ Status: CheckedOut → Completed ✅                                            │
└─────────────────────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 5. LỊCH SỬ & PHẢN TÍCH CHI TIÊU                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│ XEM LỊCH SỬ THUÊ XE                                                          │
│ ┌────────────────────────────────────────────────────────────────────────┐  │
│ │  📊 Tổng số chuyến: 15                                                   │  │
│ │  💰 Tổng chi tiêu: 7,500,000đ                                            │  │
│ │  📈 Trung bình/chuyến: 500,000đ                                          │  │
│ │                                                                          │  │
│ │  Lịch sử gần đây:                                                        │  │
│ │  ┌──────────────────────────────────────────────────────────────────┐   │  │
│ │  │ #1001 | VinFast VF8 | 15/10 - 16/10 | 625,000đ | ✅ Completed   │   │  │
│ │  │ #995  | VinFast VF5 | 01/10 - 02/10 | 400,000đ | ✅ Completed   │   │  │
│ │  │ #988  | VinFast VF9 | 20/09 - 21/09 | 600,000đ | ✅ Completed   │   │  │
│ │  └──────────────────────────────────────────────────────────────────┘   │  │
│ └────────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
│ THỐNG KÊ CHI TIÊU                                                            │
│ ┌────────────────────────────────────────────────────────────────────────┐  │
│ │  📊 Biểu đồ chi tiêu theo tháng                                          │  │
│ │  📈 Xu hướng thuê xe                                                     │  │
│ │  🚗 Loại xe thuê nhiều nhất: VinFast VF8                                │  │
│ │  💰 Chi phí trung bình: 500,000đ/chuyến                                 │  │
│ │  ⭐ Điểm thưởng tích lũy: 1,500 points                                  │  │
│ └────────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
│ API: GET /api/booking/history/john123                                        │
│      GET /api/analytics/user/john123                                         │
└─────────────────────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 📝 ĐÁNH GIÁ DỊCH VỤ (FEEDBACK)                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────────────────────────┐  │
│ │  ⭐⭐⭐⭐⭐ Rate your experience                                         │  │
│ │  💬 "Xe rất sạch sẽ, pin đầy đủ. Nhân viên nhiệt tình!"                │  │
│ │  📸 [Upload photos]                                                      │  │
│ └────────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
│ API: POST /api/feedback/create                                               │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                            🎉 HOÀN THÀNH!                                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📱 Mobile App User Journey

```
┌────────────┐
│ Open App   │
└─────┬──────┘
      │
      ▼
┌────────────┐      ┌────────────┐      ┌────────────┐
│ Login/     │ ───> │ View Map   │ ───> │ Select     │
│ Register   │      │ & Stations │      │ Station    │
└────────────┘      └────────────┘      └────────────┘
                                              │
                                              ▼
                                        ┌────────────┐
                                        │ Browse     │
                                        │ Available  │
                                        │ Cars       │
                                        └─────┬──────┘
                                              │
                                              ▼
                                        ┌────────────┐
                                        │ Select Car │
                                        │ & Dates    │
                                        └─────┬──────┘
                                              │
                                              ▼
                                        ┌────────────┐
                                        │ Review     │
                                        │ Booking    │
                                        └─────┬──────┘
                                              │
                                              ▼
                                        ┌────────────┐
                                        │ Payment    │
                                        └─────┬──────┘
                                              │
                                              ▼
                                        ┌────────────┐
                                        │ Booking    │
                                        │ Confirmed  │
                                        └─────┬──────┘
                                              │
                                              ▼
                                        ┌────────────┐
                                        │ Check-in   │
                                        │ (QR Scan)  │
                                        └─────┬──────┘
                                              │
                                              ▼
                                        ┌────────────┐
                                        │ Drive 🚗   │
                                        └─────┬──────┘
                                              │
                                              ▼
                                        ┌────────────┐
                                        │ Check-out  │
                                        │ (Return)   │
                                        └─────┬──────┘
                                              │
                                              ▼
                                        ┌────────────┐
                                        │ Final      │
                                        │ Payment    │
                                        └─────┬──────┘
                                              │
                                              ▼
                                        ┌────────────┐
                                        │ Feedback   │
                                        └────────────┘
```

---

## 🔄 Status Transition Diagram

```
                    ┌─────────────┐
                    │   Pending   │ ◄── Booking created
                    └──────┬──────┘
                           │
                    Payment completed
                           │
                           ▼
                    ┌─────────────┐
                    │  Confirmed  │ ◄── Ready for pickup
                    └──────┬──────┘
                           │
                    Check-in at station
                           │
                           ▼
                    ┌─────────────┐
                    │  CheckedIn  │ ◄── Car in use
                    └──────┬──────┘
                           │
                    Return to station
                           │
                           ▼
                    ┌─────────────┐
                    │ CheckedOut  │ ◄── Awaiting final payment
                    └──────┬──────┘
                           │
                    Final payment completed
                           │
                           ▼
                    ┌─────────────┐
                    │  Completed  │ ◄── Booking finished
                    └─────────────┘

                           │
                    User/Admin cancels
                           │
                           ▼
                    ┌─────────────┐
                    │  Cancelled  │
                    └─────────────┘
```

---

## 💡 Key Features Implemented

✅ **Complete Booking Flow** - From search to completion  
✅ **Real-time Availability Check** - Prevent double booking  
✅ **Dynamic Pricing** - Hourly vs Daily rates  
✅ **Coupon Support** - Discount codes  
✅ **Check-in/Check-out** - With photo documentation  
✅ **Damage Assessment** - Fair fee calculation  
✅ **Late Fee Calculation** - Automatic penalty  
✅ **Deposit Management** - Auto refund after deduction  
✅ **Booking History** - Track all rentals  
✅ **Status Tracking** - Real-time booking status  

---

## 🎯 Business Rules

### Pricing:
- **< 24 hours**: Hourly rate (50,000đ/hour)
- **≥ 24 hours**: Daily rate (500,000đ/day)
- **Deposit**: 2,000,000đ (refundable)

### Late Return:
- **Grace period**: 15 minutes free
- **Late fee**: 150% of hourly rate

### Cancellation:
- **> 24h before**: 100% refund
- **12-24h before**: 50% refund
- **< 12h before**: No refund

### Damage Assessment:
- **Minor scratch**: 50,000 - 200,000đ
- **Major damage**: 500,000 - 2,000,000đ
- **Total loss**: Full car value

---

## 📞 Support & Contact

For technical support or business inquiries:
- Email: support@evstation.com
- Hotline: 1900-xxxx
- App: In-app chat support

