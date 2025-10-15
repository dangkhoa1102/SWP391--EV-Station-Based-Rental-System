# 📊 ADMIN REPORTS & ANALYTICS API GUIDE

## 🎯 Tổng quan

API báo cáo và phân tích cho Admin, cung cấp insights về:
- 💰 Doanh thu theo điểm thuê
- 🚗 Tỷ lệ sử dụng xe
- ⏰ Giờ cao điểm
- 📈 Xu hướng doanh thu theo thời gian

---

## 🔐 Authentication

**Tất cả các API yêu cầu:**
- **Authorization Header:** `Bearer <JWT_TOKEN>`
- **Role Required:** `Admin`

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 1️⃣ BÁO CÁO DOANH THU THEO ĐIỂM THUÊ

### Endpoint: `GET /api/Admin/Reports/Revenue-By-Station`

**Mô tả:** Phân tích doanh thu chi tiết theo từng điểm thuê (station)

**Query Parameters:**
- `fromDate` (optional): Từ ngày (ISO 8601, default: 1 tháng trước)
- `toDate` (optional): Đến ngày (ISO 8601, default: hôm nay)

**Example Request:**
```http
GET /api/Admin/Reports/Revenue-By-Station?fromDate=2025-01-01&toDate=2025-01-31
Authorization: Bearer <token>
```

**Response:**
```json
{
  "isSuccess": true,
  "message": "Báo cáo doanh thu 5 điểm thuê từ 01/01/2025 đến 31/01/2025",
  "data": {
    "period": {
      "from": "2025-01-01T00:00:00Z",
      "to": "2025-01-31T23:59:59Z",
      "days": 31
    },
    "summary": {
      "totalRevenue": 125000000,
      "totalBookings": 450,
      "averageRevenuePerDay": 4032258,
      "numberOfStations": 5
    },
    "revenueByStation": [
      {
        "stationId": "abc123",
        "stationName": "Trạm EV Quận 1",
        "totalBookings": 150,
        "totalRevenue": 45000000,
        "averageRevenuePerBooking": 300000,
        "totalHours": 3600,
        "topCars": [
          {
            "carModel": "VinFast VF8",
            "bookingCount": 45,
            "revenue": 13500000
          },
          {
            "carModel": "Tesla Model 3",
            "bookingCount": 35,
            "revenue": 10500000
          }
        ]
      }
    ],
    "topPerformingStations": [
      {
        "stationId": "abc123",
        "stationName": "Trạm EV Quận 1",
        "totalRevenue": 45000000,
        "totalBookings": 150
      }
    ],
    "lowPerformingStations": [
      {
        "stationId": "xyz789",
        "stationName": "Trạm EV Quận 12",
        "totalRevenue": 5000000,
        "totalBookings": 20
      }
    ]
  }
}
```

**Use Cases:**
- Xác định điểm thuê có doanh thu cao nhất
- So sánh hiệu quả kinh doanh giữa các trạm
- Phát hiện trạm cần cải thiện hoặc đầu tư thêm
- Phân tích xe nào được ưa chuộng tại từng trạm

**Business Insights:**
- **Top Performing Stations:** Mô hình thành công để nhân rộng
- **Low Performing Stations:** Cần chiến lược marketing hoặc điều chỉnh giá
- **Top Cars per Station:** Tối ưu phân bổ xe theo nhu cầu địa phương

---

## 2️⃣ BÁO CÁO TỶ LỆ SỬ DỤNG XE

### Endpoint: `GET /api/Admin/Reports/Car-Utilization`

**Mô tả:** Phân tích tỷ lệ sử dụng (utilization rate) của từng xe

**Query Parameters:**
- `fromDate` (optional): Từ ngày (default: 1 tháng trước)
- `toDate` (optional): Đến ngày (default: hôm nay)

**Example Request:**
```http
GET /api/Admin/Reports/Car-Utilization?fromDate=2025-01-01&toDate=2025-01-31
Authorization: Bearer <token>
```

**Response:**
```json
{
  "isSuccess": true,
  "message": "Báo cáo tỷ lệ sử dụng xe",
  "data": {
    "period": {
      "from": "2025-01-01T00:00:00Z",
      "to": "2025-01-31T23:59:59Z",
      "days": 31
    },
    "summary": {
      "totalCars": 50,
      "averageUtilizationRate": 62.5,
      "highUtilization": 15,
      "mediumUtilization": 25,
      "lowUtilization": 10
    },
    "utilizationBreakdown": {
      "high": {
        "count": 15,
        "percentage": 30.0
      },
      "medium": {
        "count": 25,
        "percentage": 50.0
      },
      "low": {
        "count": 10,
        "percentage": 20.0
      }
    },
    "topPerformingCars": [
      {
        "carId": "car123",
        "brand": "VinFast",
        "model": "VF8",
        "licensePlate": "51A-12345",
        "currentStation": "Trạm EV Quận 1",
        "totalBookings": 45,
        "totalHoursUsed": 520.5,
        "utilizationRate": 85.2,
        "revenue": 15600000,
        "averageBatteryLevel": 75.5,
        "status": "Available"
      }
    ],
    "underutilizedCars": [
      {
        "carId": "car456",
        "brand": "Tesla",
        "model": "Model Y",
        "licensePlate": "51B-67890",
        "currentStation": "Trạm EV Quận 12",
        "totalBookings": 5,
        "totalHoursUsed": 120.0,
        "utilizationRate": 18.5,
        "revenue": 1500000,
        "averageBatteryLevel": 85.0,
        "status": "Available"
      }
    ],
    "allCars": [...]
  }
}
```

**Utilization Rate Formula:**
```
Utilization Rate (%) = (Total Hours Used / Total Available Hours) × 100

Total Available Hours = Days in Period × 24 hours
```

**Utilization Categories:**
- **High (≥70%):** Xe sử dụng hiệu quả, cần bảo trì thường xuyên
- **Medium (40-69%):** Mức sử dụng bình thường
- **Low (<40%):** Xe ít được sử dụng, cần xem xét lại vị trí hoặc giá cả

**Use Cases:**
- Xác định xe được sử dụng nhiều nhất
- Phát hiện xe ít sử dụng để điều phối hoặc giảm giá
- Lập kế hoạch bảo trì dựa trên mức độ sử dụng
- Tối ưu hóa đội xe (mua thêm hoặc loại bỏ)

**Business Actions:**
| Utilization Rate | Action |
|-----------------|--------|
| > 80% | Xem xét mua thêm xe cùng model |
| 60-80% | Mức tối ưu, duy trì |
| 40-60% | Cân nhắc điều chỉnh giá hoặc khuyến mãi |
| < 40% | Điều phối đến trạm khác hoặc giảm giá |
| < 20% | Cân nhắc loại bỏ hoặc bán lại |

---

## 3️⃣ PHÂN TÍCH GIỜ CAO ĐIỂM

### Endpoint: `GET /api/Admin/Reports/Peak-Hours`

**Mô tả:** Phân tích giờ cao điểm và patterns theo thời gian

**Query Parameters:**
- `fromDate` (optional): Từ ngày (default: 1 tháng trước)
- `toDate` (optional): Đến ngày (default: hôm nay)

**Example Request:**
```http
GET /api/Admin/Reports/Peak-Hours?fromDate=2025-01-01&toDate=2025-01-31
Authorization: Bearer <token>
```

**Response:**
```json
{
  "isSuccess": true,
  "message": "Phân tích giờ cao điểm",
  "data": {
    "period": {
      "from": "2025-01-01T00:00:00Z",
      "to": "2025-01-31T23:59:59Z",
      "days": 31
    },
    "summary": {
      "totalBookings": 450,
      "averageBookingsPerDay": 14.5,
      "peakHour": "08:00 - 09:00",
      "peakDay": "Friday"
    },
    "peakHours": {
      "top5BusiestHours": [
        {
          "hour": 8,
          "timeRange": "08:00 - 09:00",
          "totalBookings": 85,
          "averageBookingsPerDay": 2.74,
          "revenue": 25500000
        },
        {
          "hour": 17,
          "timeRange": "17:00 - 18:00",
          "totalBookings": 78,
          "averageBookingsPerDay": 2.52,
          "revenue": 23400000
        }
      ],
      "top5QuietestHours": [
        {
          "hour": 3,
          "timeRange": "03:00 - 04:00",
          "totalBookings": 2,
          "averageBookingsPerDay": 0.06,
          "revenue": 600000
        }
      ]
    },
    "hourlyDistribution": [
      {
        "hour": 0,
        "timeRange": "00:00 - 01:00",
        "totalBookings": 5,
        "averageBookingsPerDay": 0.16,
        "revenue": 1500000
      }
      // ... 24 entries (0-23)
    ],
    "weeklyDistribution": [
      {
        "dayOfWeek": "Monday",
        "dayNumber": 1,
        "totalBookings": 55,
        "averageBookingsPerWeek": 13.75,
        "revenue": 16500000
      },
      {
        "dayOfWeek": "Friday",
        "dayNumber": 5,
        "totalBookings": 95,
        "averageBookingsPerWeek": 23.75,
        "revenue": 28500000
      }
      // ... 7 entries
    ],
    "checkInCheckOutPattern": {
      "checkInsByHour": [
        { "hour": 0, "count": 5 },
        { "hour": 1, "count": 3 }
        // ... 24 entries
      ],
      "checkOutsByHour": [
        { "hour": 0, "count": 8 },
        { "hour": 1, "count": 5 }
        // ... 24 entries
      ]
    },
    "recommendations": [
      "Giờ cao điểm: 08:00 - 09:00, 17:00 - 18:00 - Cần đảm bảo đủ xe và nhân viên",
      "Giờ thấp điểm: 03:00 - 04:00, 02:00 - 03:00 - Có thể giảm nhân viên hoặc chạy khuyến mãi",
      "Ngày bận nhất: Friday - Lên lịch bảo trì vào các ngày ít khách hơn"
    ]
  }
}
```

**Use Cases:**
- **Staffing Optimization:** Tăng nhân viên vào giờ cao điểm
- **Pricing Strategy:** Dynamic pricing - tăng giá giờ cao điểm, giảm giá giờ thấp điểm
- **Maintenance Planning:** Lên lịch bảo trì vào giờ/ngày ít khách
- **Marketing Campaigns:** Chạy khuyến mãi vào giờ thấp điểm để tăng booking

**Peak Hours Patterns:**

**Typical Weekday Pattern:**
- **Morning Peak:** 7:00 - 9:00 (đi làm/đi học)
- **Lunch Peak:** 11:00 - 13:00 (đi ăn trưa)
- **Evening Peak:** 17:00 - 19:00 (tan sở)
- **Off-Peak:** 22:00 - 6:00 (đêm khuya)

**Weekend Pattern:**
- **Late Morning:** 9:00 - 11:00 (dậy muộn)
- **Afternoon:** 13:00 - 17:00 (đi chơi)
- **Evening:** 18:00 - 21:00 (ăn tối, giải trí)

**Business Actions:**
| Time Period | Strategy |
|------------|----------|
| Peak Hours | Tăng giá 20-30%, đảm bảo đủ xe, tăng nhân viên |
| Off-Peak Hours | Giảm giá 15-25%, chạy khuyến mãi "Happy Hours" |
| Weekend | Packages cho thuê cả ngày, ưu đãi family |
| Weekday Morning | Ưu đãi cho doanh nghiệp, khách thuê dài hạn |

---

## 4️⃣ XU HƯỚNG DOANH THU THEO THỜI GIAN

### Endpoint: `GET /api/Admin/Reports/Revenue-Trends`

**Mô tả:** Phân tích xu hướng doanh thu theo ngày/tuần/tháng

**Query Parameters:**
- `fromDate` (optional): Từ ngày (default: 3 tháng trước)
- `toDate` (optional): Đến ngày (default: hôm nay)
- `groupBy` (optional): `day`, `week`, `month` (default: `day`)

**Example Requests:**

**1. Trend theo ngày:**
```http
GET /api/Admin/Reports/Revenue-Trends?groupBy=day&fromDate=2025-01-01&toDate=2025-01-31
```

**2. Trend theo tuần:**
```http
GET /api/Admin/Reports/Revenue-Trends?groupBy=week&fromDate=2024-10-01&toDate=2025-01-31
```

**3. Trend theo tháng:**
```http
GET /api/Admin/Reports/Revenue-Trends?groupBy=month&fromDate=2024-01-01&toDate=2025-01-31
```

**Response (groupBy=day):**
```json
{
  "isSuccess": true,
  "message": "Báo cáo xu hướng doanh thu theo day",
  "data": {
    "period": {
      "from": "2025-01-01T00:00:00Z",
      "to": "2025-01-31T23:59:59Z",
      "groupBy": "day"
    },
    "summary": {
      "totalRevenue": 125000000,
      "totalBookings": 450,
      "averageBookingValue": 277778
    },
    "trends": [
      {
        "period": "2025-01-01",
        "date": "2025-01-01T00:00:00Z",
        "totalBookings": 12,
        "revenue": 3600000,
        "averageBookingValue": 300000
      },
      {
        "period": "2025-01-02",
        "date": "2025-01-02T00:00:00Z",
        "totalBookings": 15,
        "revenue": 4500000,
        "averageBookingValue": 300000
      }
      // ... all days in period
    ]
  }
}
```

**Response (groupBy=week):**
```json
{
  "trends": [
    {
      "period": "2025-W01",
      "year": 2025,
      "week": 1,
      "totalBookings": 85,
      "revenue": 25500000,
      "averageBookingValue": 300000
    },
    {
      "period": "2025-W02",
      "year": 2025,
      "week": 2,
      "totalBookings": 92,
      "revenue": 27600000,
      "averageBookingValue": 300000
    }
  ]
}
```

**Response (groupBy=month):**
```json
{
  "trends": [
    {
      "period": "2024-10",
      "year": 2024,
      "month": 10,
      "totalBookings": 380,
      "revenue": 114000000,
      "averageBookingValue": 300000
    },
    {
      "period": "2024-11",
      "year": 2024,
      "month": 11,
      "totalBookings": 420,
      "revenue": 126000000,
      "averageBookingValue": 300000
    }
  ]
}
```

**Use Cases:**
- Dự báo doanh thu cho kỳ tiếp theo
- Phát hiện trend tăng/giảm
- So sánh hiệu quả các chiến dịch marketing
- Lập ngân sách và kế hoạch kinh doanh

**Analysis Tips:**

**Trend Tăng trưởng:**
- Revenue tăng đều qua các kỳ → Business healthy
- Bookings tăng nhưng revenue không tăng tương ứng → Cần tăng giá hoặc upsell

**Trend Giảm:**
- Xem xét yếu tố mùa vụ (seasonality)
- Kiểm tra hoạt động của đối thủ
- Review feedback khách hàng

**Seasonality:**
- Cao điểm: Tết, nghỉ lễ, cuối tuần
- Thấp điểm: Giữa tuần, mùa mưa

---

## 📊 DASHBOARD INTEGRATION

Các APIs này được thiết kế để tích hợp vào Admin Dashboard:

### Recommended Dashboard Layout:

```
┌─────────────────────────────────────────┐
│  ADMIN DASHBOARD - ANALYTICS            │
├─────────────────────────────────────────┤
│                                         │
│  📊 Revenue Overview                    │
│  ├─ Total Revenue: 125M VND            │
│  ├─ This Month: 45M VND                │
│  └─ Growth: +15% vs last month         │
│                                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                         │
│  🏢 Top 5 Stations by Revenue           │
│  [Bar Chart from Revenue-By-Station]    │
│                                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                         │
│  🚗 Car Utilization Overview            │
│  ├─ Average: 62.5%                     │
│  ├─ High: 15 cars (30%)                │
│  ├─ Medium: 25 cars (50%)              │
│  └─ Low: 10 cars (20%)                 │
│  [Pie Chart from Car-Utilization]       │
│                                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                         │
│  ⏰ Peak Hours Analysis                 │
│  [Line Chart from Peak-Hours]           │
│  Peak: 08:00-09:00 (85 bookings)       │
│                                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                         │
│  📈 Revenue Trends (Last 3 months)      │
│  [Area Chart from Revenue-Trends]       │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🎯 BEST PRACTICES

### 1. Date Range Selection
✅ **Nên:**
- Default range: 30 ngày gần nhất
- Cho phép custom range nhưng giới hạn tối đa 1 năm
- Sử dụng UTC timezone cho consistency

❌ **Không nên:**
- Query quá dài (> 1 năm) → performance issues
- Không validate date range

### 2. Performance Optimization
✅ **Nên:**
- Cache kết quả cho các queries phổ biến
- Chỉ query completed bookings cho revenue reports
- Sử dụng pagination cho large datasets

### 3. Data Interpretation
✅ **Nên:**
- So sánh với cùng kỳ năm trước
- Xem xét yếu tố mùa vụ
- Kết hợp nhiều metrics để ra quyết định

---

## 📝 EXPORT & SHARING

### Export to Excel/CSV (Future Feature):
```http
GET /api/Admin/Reports/Revenue-By-Station?format=excel
GET /api/Admin/Reports/Car-Utilization?format=csv
```

### Schedule Reports (Future Feature):
```json
POST /api/Admin/Reports/Schedule
{
  "reportType": "Revenue-By-Station",
  "frequency": "weekly",
  "recipients": ["admin@example.com"],
  "format": "pdf"
}
```

---

## 🔧 TROUBLESHOOTING

### Issue 1: "No data available"
**Cause:** Không có bookings trong khoảng thời gian
**Solution:** Mở rộng date range hoặc kiểm tra database

### Issue 2: Revenue numbers seem low
**Cause:** Chỉ tính completed bookings
**Solution:** Đảm bảo bookings được đánh dấu "Completed" sau khi hoàn tất

### Issue 3: Peak hours không chính xác
**Cause:** Dữ liệu mẫu ít
**Solution:** Cần ít nhất 1 tháng data để có kết quả chính xác

---

## 📞 SUPPORT & FEEDBACK

Nếu bạn cần thêm metrics hoặc có đề xuất cải thiện báo cáo:
1. Liên hệ development team
2. Đề xuất custom reports
3. Request API mới

---

**Last Updated:** 2025-10-14  
**Version:** 1.0  
**API Base URL:** `https://localhost:7xxx/api/Admin/Reports`

