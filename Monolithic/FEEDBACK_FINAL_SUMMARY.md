# Feedback System - Final Summary (Như Shopee Food)

## ✅ Hệ thống Feedback hiện tại

Hệ thống feedback hoạt động **GIỐNG HỆT SHOPEE FOOD**:
- ✅ Chỉ ai đã thuê xe (booking completed) mới có thể feedback
- ✅ Feedback gắn với cả booking VÀ xe
- ✅ Khi xem xe → thấy tất cả feedback của xe đó
- ✅ Có thống kê rating trung bình, tổng số feedback

---

## 📋 Các chức năng chính

### 1. **Tạo Feedback** (sau khi hoàn thành booking)

**Endpoint:**
```http
POST /api/Feedback/Create-By-User/{userId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "bookingId": "guid",
  "carId": "guid",
  "rating": 5,
  "comment": "Xe rất tốt!"
}
```

**Validation (6 levels):**
1. ✅ User ID hợp lệ (GUID format)
2. ✅ Booking tồn tại
3. ✅ Booking thuộc về user
4. ✅ **Booking status = Completed** (chỉ booking đã hoàn thành)
5. ✅ CarId khớp với booking
6. ✅ User chưa feedback booking này

**Response:**
```json
{
  "isSuccess": true,
  "message": "Feedback created successfully",
  "data": {
    "feedbackId": "guid",
    "userId": "guid-string",
    "userName": "John Doe",
    "bookingId": "guid",
    "carId": "guid",
    "carInfo": "Tesla Model 3 (ABC-123)",
    "rating": 5,
    "comment": "Xe rất tốt!",
    "isActive": true,
    "createdAt": "2025-10-27T10:00:00Z",
    "updatedAt": null
  }
}
```

---

### 2. **Xem tất cả feedback của xe** (như xem món trong menu)

**Endpoint:**
```http
GET /api/Feedback/Get-By-Car/{carId}
```

**Response:**
```json
{
  "isSuccess": true,
  "message": "Car feedbacks retrieved successfully",
  "data": [
    {
      "feedbackId": "guid-1",
      "userName": "User A",
      "bookingId": "booking-guid-1",
      "rating": 5,
      "comment": "Excellent!",
      "createdAt": "2025-10-20T10:00:00Z"
    },
    {
      "feedbackId": "guid-2",
      "userName": "User B",
      "bookingId": "booking-guid-2",
      "rating": 4,
      "comment": "Good car",
      "createdAt": "2025-10-18T14:00:00Z"
    }
  ]
}
```

---

### 3. **Xem thống kê feedback của xe**

**Endpoint:**
```http
GET /api/Feedback/Get-Summary-By-Car/{carId}
```

**Response:**
```json
{
  "isSuccess": true,
  "message": "Feedback statistics retrieved successfully",
  "data": {
    "carId": "guid",
    "carInfo": "Tesla Model 3 (ABC-123)",
    "averageRating": 4.5,
    "totalFeedbacks": 10,
    "recentFeedbacks": []
  }
}
```

---

### 4. **Xem feedback của user**

**Endpoint:**
```http
GET /api/Feedback/Get-By-User/{userId}
```

**Use case:** User xem lại tất cả feedback mình đã tạo

---

### 5. **Xem feedback theo booking**

**Endpoint:**
```http
GET /api/Feedback/Get-By-Booking/{bookingId}
```

**Use case:** Xem feedback của một đơn thuê cụ thể

---

### 6. **Cập nhật feedback**

**Endpoint:**
```http
PUT /api/Feedback/Update-By-{id}?userId={userId}
Authorization: Bearer {token}

{
  "rating": 4,
  "comment": "Updated comment"
}
```

**Validation:**
- ✅ Chỉ owner mới có thể update feedback của mình

---

### 7. **Xóa feedback** (soft delete)

**Endpoint:**
```http
DELETE /api/Feedback/Delete-By-{id}?userId={userId}
Authorization: Bearer {token}
```

**Validation:**
- ✅ Chỉ owner mới có thể delete feedback của mình
- ✅ Soft delete (set IsActive = false)

---

### 8. **Lấy tất cả feedbacks** (có phân trang)

**Endpoint:**
```http
GET /api/Feedback/Get-All?Page=1&PageSize=10
```

---

### 9. **Xem điểm trung bình của xe**

**Endpoint:**
```http
GET /api/Feedback/Get-Average-Rating-By-Car/{carId}
```

---

## 🎯 Flow hoàn chỉnh (giống Shopee Food)

### Scenario: User thuê xe và feedback

```
1. User tạo booking → BookingStatus = Pending
   ↓
2. User thanh toán deposit → BookingStatus = DepositPaid
   ↓
3. User check-in xe → BookingStatus = CheckedIn
   ↓
4. User sử dụng xe...
   ↓
5. User check-out xe → BookingStatus = CheckedOut
   ↓
6. User thanh toán tiền thuê → BookingStatus = Completed ✅
   ↓
7. 🎉 User CÓ THỂ FEEDBACK (POST /api/Feedback/Create-By-User/{userId})
   Request: { bookingId, carId, rating, comment }
   ↓
8. Feedback được tạo và gắn với:
   - Booking (bookingId)
   - Car (carId)
   - User (userId)
   ↓
9. Khi user khác xem xe này (GET /api/Feedback/Get-By-Car/{carId})
   → Thấy feedback của user này
   ↓
10. Rating trung bình của xe được cập nhật
```

---

## 🔒 Business Rules

### Rule 1: Chỉ booking completed mới feedback được
```
❌ Pending → Không feedback được
❌ DepositPaid → Không feedback được
❌ CheckedIn → Không feedback được
❌ CheckedOut → Không feedback được
✅ Completed → CÓ THỂ feedback
❌ Cancelled → Không feedback được
```

### Rule 2: Một booking chỉ được feedback 1 lần
- User không thể tạo nhiều feedback cho cùng 1 booking
- Nhưng có thể UPDATE feedback đã tạo

### Rule 3: Ownership
- Chỉ owner mới có thể update/delete feedback của mình
- Booking phải thuộc về user mới có thể feedback

### Rule 4: Data integrity
- CarId trong request phải khớp với CarId trong booking
- Đảm bảo feedback đúng xe

---

## 📊 Database Schema

### Feedback Model
```csharp
public class Feedback
{
    public Guid FeedbackId { get; set; }      // Primary key
    public Guid UserId { get; set; }          // Required - người tạo feedback
    public Guid BookingId { get; set; }       // Required - booking đã completed
    public Guid CarId { get; set; }           // Required - xe được feedback
    public int Rating { get; set; }           // Required - 1-5
    public string? Comment { get; set; }      // Optional - max 1000 chars
    public bool IsActive { get; set; }        // Soft delete flag
    public DateTime CreatedAt { get; set; }   
    public DateTime? UpdatedAt { get; set; }  
    
    // Navigation properties
    public virtual User User { get; set; }
    public virtual Booking Booking { get; set; }
    public virtual Car Car { get; set; }
}
```

---

## 🎨 Frontend Display Recommendations

### 1. Hiển thị trên trang chi tiết xe
```typescript
// Component: CarDetail.tsx
<div className="car-info">
  <h1>{car.name}</h1>
  <div className="rating">
    <StarRating value={car.averageRating} />
    <span>{car.averageRating.toFixed(1)}</span>
    <span>({car.totalFeedbacks} reviews)</span>
  </div>
</div>

<div className="feedbacks">
  <h2>Customer Reviews</h2>
  {feedbacks.map(feedback => (
    <FeedbackCard
      key={feedback.feedbackId}
      userName={feedback.userName}
      rating={feedback.rating}
      comment={feedback.comment}
      createdAt={feedback.createdAt}
    />
  ))}
</div>
```

### 2. Nút feedback sau khi hoàn thành booking
```typescript
// Component: BookingHistory.tsx
{booking.bookingStatus === 'Completed' && !booking.hasFeedback && (
  <Button onClick={() => openFeedbackModal(booking)}>
    Rate this car
  </Button>
)}
```

### 3. Danh sách xe - hiển thị rating
```typescript
// Component: CarCard.tsx
<div className="car-card">
  <img src={car.imageUrl} />
  <h3>{car.name}</h3>
  <div className="rating">
    <StarRating value={car.averageRating} />
    <span>({car.totalFeedbacks})</span>
  </div>
  <div className="price">{car.pricePerDay}</div>
</div>
```

---

## 🧪 Test Cases

### Test Case 1: ✅ Happy Path
```
Prerequisites:
- User có booking completed
- User chưa feedback booking này

Action: Tạo feedback

Expected: 
✅ Success
✅ Feedback được tạo
✅ Feedback hiện trên trang xe
```

### Test Case 2: ❌ Booking chưa completed
```
Prerequisites:
- User có booking CheckedIn (chưa completed)

Action: Tạo feedback

Expected:
❌ Error: "You can only feedback completed bookings"
```

### Test Case 3: ❌ Duplicate feedback
```
Prerequisites:
- User đã feedback booking này rồi

Action: Tạo feedback lần nữa

Expected:
❌ Error: "You have already submitted feedback for this booking"
```

### Test Case 4: ❌ Booking không thuộc user
```
Prerequisites:
- Booking thuộc về user khác

Action: User A cố tạo feedback cho booking của User B

Expected:
❌ Error: "You can only feedback your own bookings"
```

### Test Case 5: ❌ CarId không khớp
```
Prerequisites:
- Booking có carId = X
- Request gửi carId = Y

Action: Tạo feedback

Expected:
❌ Error: "Car ID does not match the booking"
```

---

## 📈 Benefits

### Cho User
1. ✅ Trải nghiệm giống Shopee Food - quen thuộc
2. ✅ Chỉ feedback sau khi dùng thực tế → feedback chất lượng
3. ✅ Có thể xem feedback trước khi thuê xe
4. ✅ Có thể update feedback nếu thay đổi ý kiến

### Cho Business
1. ✅ Feedback tin cậy (verified từ booking completed)
2. ✅ Tăng độ tin tưởng của khách hàng mới
3. ✅ Data insights về chất lượng xe
4. ✅ Giúp cải thiện dịch vụ

### Cho Platform
1. ✅ Clean data - không có spam/fake reviews
2. ✅ Truy xuất được nguồn gốc feedback (từ booking nào)
3. ✅ Có thể phân tích theo thời gian, theo xe, theo user

---

## 🚀 Deployment

### Cần làm:
1. ✅ Code đã rollback về option 1
2. ⚠️ **Migration đã tạo trước đó (`AddBookingIdToFeedback`) có thể apply**
   - Migration này chỉ thay đổi UpdatedAt thành nullable
   - **KHÔNG** có IsVerified field
   - **KHÔNG** có BookingId nullable

### Migration tiếp theo (nếu cần):
```bash
cd Monolithic

# Nếu app đang chạy, stop nó trước
# Sau đó:
dotnet ef database update
```

---

## 📝 API Documentation Summary

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/Get-All` | GET | No | Lấy tất cả feedbacks (phân trang) |
| `/Get-By-{id}` | GET | No | Xem chi tiết feedback |
| `/Get-By-Car/{carId}` | GET | No | Xem tất cả feedback của xe |
| `/Get-By-User/{userId}` | GET | No | Xem feedback của user |
| `/Get-By-Booking/{bookingId}` | GET | No | Xem feedback theo booking |
| `/Create-By-User/{userId}` | POST | **Yes** | Tạo feedback (cần booking completed) |
| `/Update-By-{id}` | PUT | **Yes** | Cập nhật feedback (chỉ owner) |
| `/Delete-By-{id}` | DELETE | **Yes** | Xóa feedback (chỉ owner) |
| `/Get-Summary-By-Car/{carId}` | GET | No | Thống kê feedback của xe |
| `/Get-Average-Rating-By-Car/{carId}` | GET | No | Điểm trung bình của xe |

---

## ✅ Conclusion

Hệ thống feedback hiện tại:
- ✅ Hoạt động **GIỐNG HỆT SHOPEE FOOD**
- ✅ Chỉ ai thuê xe (completed) mới feedback được
- ✅ Feedback tin cậy, verified
- ✅ Đầy đủ chức năng CRUD
- ✅ Validation chặt chẽ (6 levels)
- ✅ Sẵn sàng production

**Không cần thêm gì nữa!** 🎉

