# API Quick Reference

## ?? **Admin APIs** (Role: Admin only)
**Base URL:** `/api/Admin`

### Staff Management
- `POST /Staff/Assign-To-Station` - Gán staff vào station
- `POST /Staff/Unassign-From-Station` - G? staff kh?i station
- `GET /Staff/Get-All` - Danh sách t?t c? staff
- `GET /Staff/Unassigned` - Danh sách staff ch?a gán

## ????? **Staff APIs** (Role: StationStaff + Admin)
**Base URL:** `/api/Staff`

### Document Verification  
- `GET /Users/{userId}/Documents` - Xem gi?y t? user
- `GET /Users/Pending-Verification` - User c?n xác minh
- `POST /Users/Verify-Documents` - Xác minh gi?y t?
- `GET /Users/Document-Statistics` - Th?ng kê xác minh

### Profile
- `GET /My-Profile` - Thông tin cá nhân + station

## ?? **Key Points**
- **Admin** qu?n lý staff assignment
- **Staff** th?c hi?n document verification
- T?t c? API ??u yêu c?u JWT authentication
- Document verification ch? cho EVRenter
- Staff assignment ch? cho StationStaff