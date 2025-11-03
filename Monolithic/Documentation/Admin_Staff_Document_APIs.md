# Admin & Staff APIs for Staff Assignment & Document Management

## T?ng quan
?ã t?o thành công 2 nhóm API:
1. **Admin APIs** - Qu?n lý vi?c gán staff vào station
2. **Staff APIs** - Qu?n lý gi?y t? c?a user (CCCD & GPLX verification)

## ????? **Admin APIs - Staff Assignment Management**

### 1. **Gán Staff vào Station**
```http
POST /api/Admin/Staff/Assign-To-Station
Authorization: Bearer {admin_token}
Content-Type: application/json

{
    "staffId": "guid",
    "stationId": "guid", 
    "reason": "optional string"
}
```

**Response:**
```json
{
    "isSuccess": true,
    "message": "?ã gán [StaffName] vào station [StationName]",
  "data": {
        "staffId": "guid",
        "staffName": "string",
        "staffEmail": "string",
     "previousStationId": "guid or null",
     "previousStationName": "string or null",
        "newStationId": "guid",
     "newStationName": "string",
    "assignedBy": "Admin",
      "assignedAt": "datetime",
        "reason": "string or null"
    }
}
```

### 2. **G? Staff kh?i Station**
```http
POST /api/Admin/Staff/Unassign-From-Station
Authorization: Bearer {admin_token}
Content-Type: application/json

{
    "staffId": "guid",
    "reason": "optional string"
}
```

### 3. **L?y danh sách t?t c? Staff**
```http
GET /api/Admin/Staff/Get-All
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
    "isSuccess": true,
    "message": "Tìm th?y X staff",
    "data": [
        {
            "userId": "guid",
        "fullName": "string",
  "email": "string", 
     "phoneNumber": "string",
            "isActive": true,
     "stationId": "guid or null",
   "stationName": "string or null",
   "createdAt": "datetime",
    "isAssigned": true/false
        }
    ]
}
```

### 4. **L?y danh sách Staff ch?a ???c gán**
```http
GET /api/Admin/Staff/Unassigned
Authorization: Bearer {admin_token}
```

## ?? **Staff APIs - Document Management**

### 1. **Staff: L?y thông tin gi?y t? c?a User**
```http
GET /api/Staff/Users/{userId}/Documents
Authorization: Bearer {staff_token}
```

**Response:**
```json
{
    "isSuccess": true,
    "message": "L?y thông tin gi?y t? thành công",
    "data": {
        "userId": "guid",
     "fullName": "string",
        "email": "string",
        "phoneNumber": "string",
        "userRole": "EVRenter",
     "cccdImageUrl_Front": "string or null",
  "cccdImageUrl_Back": "string or null", 
 "gplxImageUrl_Front": "string or null",
        "gplxImageUrl_Back": "string or null",
        "driverLicenseNumber": "string or null",
        "driverLicenseExpiry": "dateonly or null",
     "isVerified": true/false,
      "createdAt": "datetime",
  "updatedAt": "datetime or null"
    }
}
```

### 2. **Staff: L?y danh sách User c?n xác minh gi?y t?**
```http
GET /api/Staff/Users/Pending-Verification
Authorization: Bearer {staff_token}
```

**Response:** Tr? v? danh sách user có `isVerified = false` và ?ã upload ít nh?t 1 lo?i gi?y t?.

### 3. **Staff: Xác minh gi?y t? c?a User**
```http
POST /api/Staff/Users/Verify-Documents
Authorization: Bearer {staff_token}
Content-Type: application/json

{
    "userId": "guid",
    "isVerified": true/false,
    "verificationNotes": "optional string"
}
```

**Response:**
```json
{
    "isSuccess": true,
    "message": "Staff ?ã xác minh gi?y t? c?a [UserName]. Ghi chú: [notes]",
    "data": ""
}
```

### 4. **Staff: Th?ng kê xác minh gi?y t?**
```http
GET /api/Staff/Users/Document-Statistics
Authorization: Bearer {staff_token}
```

**Response:**
```json
{
    "isSuccess": true,
    "message": "Th?ng kê xác minh gi?y t?",
    "data": {
        "totalEVRenters": 100,
        "verifiedUsers": 45,
        "usersWithCCCD": 80,
        "usersWithGPLX": 70,
        "pendingVerification": 35,
        "verificationRate": 45.0,
        "documentCompletionRate": {
       "cccd": 80.0,
            "gplx": 70.0
        }
    }
}
```

### 5. **Staff: Xem thông tin cá nhân và station ???c gán**
```http
GET /api/Staff/My-Profile
Authorization: Bearer {staff_token}
```

**Response:**
```json
{
    "isSuccess": true,
    "message": "L?y thông tin profile thành công",
    "data": {
  "userId": "guid",
        "fullName": "string",
        "email": "string",
        "phoneNumber": "string",
        "userRole": "StationStaff",
        "isActive": true,
        "createdAt": "datetime",
        "assignedStation": {
 "stationId": "guid",
          "stationName": "string",
            "stationAddress": "string",
            "totalSlots": 20,
          "availableSlots": 15
        },
        "isAssignedToStation": true
    }
}
```

## ?? **Authorization Requirements**

### Admin APIs:
- **Role:** `Admin` only
- **Header:** `Authorization: Bearer {admin_jwt_token}`

### Staff APIs:
- **Role:** `StationStaff` or `Admin`
- **Header:** `Authorization: Bearer {staff_jwt_token}`
- **Content-Type:** `application/json` (for POST requests)

## ?? **DTOs Used**

### AssignStaffToStationDto
```csharp
public class AssignStaffToStationDto
{
    public Guid StaffId { get; set; }
public Guid StationId { get; set; }
    public string? Reason { get; set; }
}
```

### StaffAssignmentResponseDto
```csharp
public class StaffAssignmentResponseDto
{
    public Guid StaffId { get; set; }
    public string StaffName { get; set; }
    public string StaffEmail { get; set; }
    public Guid? PreviousStationId { get; set; }
    public string? PreviousStationName { get; set; }
    public Guid NewStationId { get; set; }
    public string NewStationName { get; set; }
    public string AssignedBy { get; set; }
 public DateTime AssignedAt { get; set; }
    public string? Reason { get; set; }
}
```

### UserDocumentDetailsDto
```csharp
public class UserDocumentDetailsDto
{
    public Guid UserId { get; set; }
    public string FullName { get; set; }
    public string Email { get; set; }
  public string? PhoneNumber { get; set; }
    public string UserRole { get; set; }
    public string? CccdImageUrl_Front { get; set; }
 public string? CccdImageUrl_Back { get; set; }
    public string? GplxImageUrl_Front { get; set; }
    public string? GplxImageUrl_Back { get; set; }
    public string? DriverLicenseNumber { get; set; }
    public DateOnly? DriverLicenseExpiry { get; set; }
    public bool IsVerified { get; set; }
  public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
```

### VerifyUserDocumentsDto
```csharp
public class VerifyUserDocumentsDto
{
    public Guid UserId { get; set; }
    public bool IsVerified { get; set; }
    public string? VerificationNotes { get; set; }
}
```

## ?? **Testing**

### Test Admin - Staff Assignment
1. **T?o Staff User:** S? d?ng API t?o user v?i role `StationStaff`
2. **T?o Station:** S? d?ng API t?o station  
3. **Test Assign:** Admin g?i API assign staff vào station
4. **Verify:** Ki?m tra staff ?ã ???c gán b?ng API `Get-All`

### Test Staff - Document Management
1. **Upload Documents:** EVRenter upload CCCD/GPLX qua AuthController
2. **Staff Login:** Staff ??ng nh?p và l?y JWT token
3. **View Pending:** Staff xem danh sách user c?n xác minh
4. **View Details:** Staff xem chi ti?t gi?y t? c?a user c? th?
5. **Verify:** Staff xác minh ho?c t? ch?i gi?y t?
6. **Statistics:** Staff xem th?ng kê t?ng quan

## ?? **Workflow**

### Admin - Staff Management Workflow:
1. Admin t?o user v?i role `StationStaff`
2. Admin gán staff vào station c? th?
3. Staff nh?n ???c quy?n truy c?p station ?ó
4. Admin có th? chuy?n staff sang station khác
5. Admin có th? g? staff kh?i station

### Staff - Document Verification Workflow:
1. EVRenter upload CCCD/GPLX qua `/api/Auth/cccd` và `/api/Auth/gplx`
2. Staff th?y user trong danh sách pending verification
3. Staff xem chi ti?t gi?y t? và th?c hi?n xác minh
4. User ???c c?p nh?t tr?ng thái `isVerified = true`
5. User có th? s? d?ng ??y ?? tính n?ng c?a h? th?ng

## ?? **L?u ý quan tr?ng**

### Admin APIs:
- Ch? Admin m?i có quy?n gán/g? staff
- Staff ch? có th? ???c gán vào 1 station t?i m?t th?i ?i?m
- Ch? user có role `StationStaff` m?i có th? ???c gán vào station

### Staff APIs:
- **Staff và Admin** ??u có quy?n xác minh gi?y t?
- Document verification ch? áp d?ng cho user có role `EVRenter`
- Staff ch? có th? xem/xác minh gi?y t? c?a EVRenter
- T?t c? các thao tác xác minh ??u ???c log v?i thông tin staff th?c hi?n

### Security:
- JWT token b?t bu?c cho t?t c? APIs
- Role-based authorization ???c áp d?ng strict
- Input validation ??y ?? cho t?t c? endpoints
- Error handling và logging ???c implement ??y ??