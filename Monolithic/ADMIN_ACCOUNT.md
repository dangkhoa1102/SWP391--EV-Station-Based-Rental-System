# Admin Account Information

## Hardcoded Admin Account

M?t tài kho?n Admin ?ã ???c t?o s?n trong h? th?ng v?i các thông tin sau:

### Thông tin ??ng nh?p:
- **Email**: `admin@ev.com`
- **Password**: `admin`
- **Role**: Admin
- **Status**: Active

### Cách s? d?ng:

1. **??ng nh?p qua API**:
   ```
   POST /api/auth/Login
   {
     "email": "admin@ev.com",
     "password": "admin"
   }
   ```

2. **Response s? ch?a**:
   - Access Token (JWT)
   - Refresh Token
   - User information v?i role "Admin"

### Thông tin k? thu?t:

- **User ID**: `00000000-0000-0000-0000-000000000001`
- **Password Hash** (SHA-256): `jGl25bVBBBW96Qi9Te4V37Fnqchz/Eu4qB9vKrRIqRg=`
- **First Name**: Admin
- **Last Name**: User
- **Created At**: Th?i ?i?m ch?y migration

### Ghi chú:

- Tài kho?n này ???c t?o thông qua Entity Framework Core seed data
- Migration: `20251028082216_AddHardcodedAdminUser.cs`
- ?? xoá tài kho?n này, hãy t?o migration m?i ?? xoá data ho?c thay ??i c?u hình OnModelCreating
- Password ???c hash b?ng SHA-256 tr??c khi l?u trong database

### B?o m?t:

?? **C?nh báo**: Tài kho?n này ???c hardcode ch? cho m?c ?ích phát tri?n và ki?m th?. 
Trong môi tr??ng production, b?n nên:
- Thay ??i password ngay l?p t?c
- Ho?c t?o tài kho?n qua quá trình ??ng ký thông th??ng
- Ho?c t?o tài kho?n t? admin dashboard

