# Admin Account Setup Complete ?

Tài kho?n admin ?ã ???c fix c?ng (hardcode) trong h? th?ng.

## ?? Tóm t?t

### Thông tin ??ng nh?p
- **Email**: `admin@ev.com`
- **Password**: `admin`
- **Role**: Admin
- **User ID**: `00000000-0000-0000-0000-000000000001`

### T?p tin liên quan

1. **Code Changes**:
   - `Monolithic/Data/EVStationBasedRentalSystemDbContext.cs` - Added seed data

2. **Database Migration**:
   - `Monolithic/Migrations/20251028082216_AddHardcodedAdminUser.cs` - Migration file
   - Migration ?ã ???c apply - Admin user ?ã có trong database

3. **Documentation**:
   - `ADMIN_ACCOUNT.md` - Thông tin chi ti?t tài kho?n
   - `SETUP_ADMIN_ACCOUNT.md` - H??ng d?n k? thu?t

4. **Test Resources**:
   - `test-admin-account.sh` - Bash script ?? test (bash/curl)
   - `test-admin-account.js` - Node.js script ?? test
   - `Admin-Account-Test.postman_collection.json` - Postman collection

---

## ?? Cách s? d?ng

### 1. Via Swagger UI
1. Truy c?p: `http://localhost:5000/swagger`
2. Click vào endpoint `POST /api/auth/Login`
3. Nh?p credentials:
   ```json
   {
     "email": "admin@ev.com",
     "password": "admin"
   }
   ```
4. Click "Execute"

### 2. Via Postman
1. Import file: `Admin-Account-Test.postman_collection.json`
2. Set `api_url` variable (default: `http://localhost:5000`)
3. Ch?y request "Admin Login"
4. Token s? t? l?u vào `access_token` variable
5. Ch?y "Get Current User Info" ?? verify

### 3. Via curl
```bash
# Login
curl -X POST http://localhost:5000/api/auth/Login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ev.com","password":"admin"}'

# L?y token t? response, sau ?ó:
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

### 4. Via bash script
```bash
chmod +x test-admin-account.sh
./test-admin-account.sh
```

### 5. Via Node.js script
```bash
npm install axios
node test-admin-account.js
```

---

## ?? Chi ti?t k? thu?t

### Password Hashing
- Algorithm: **SHA-256**
- Format: Base64 encoded
- Hash c?a "admin": `jGl25bVBBBW96Qi9Te4V37Fnqchz/Eu4qB9vKrRIqRg=`

### Seed Data Location
File: `EVStationBasedRentalSystemDbContext.cs`, method `OnModelCreating()`

```csharp
// Seed admin user
var adminUserId = Guid.Parse("00000000-0000-0000-0000-000000000001");
var adminUser = new User { ... };
builder.Entity<User>().HasData(adminUser);
```

### Database
- B?ng: `Users`
- Migration: `20251028082216_AddHardcodedAdminUser`
- Status: **Applied ?**

---

## ? Verification Checklist

- [x] DbContext updated v?i seed data
- [x] Migration created
- [x] Migration applied (database updated)
- [x] Admin user in database
- [x] Password correctly hashed
- [x] User role set to "Admin"
- [x] Account marked as active
- [x] Documentation created
- [x] Test resources provided

---

## ?? Login Response Example

```json
{
  "isSuccess": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "00000000-0000-0000-0000-000000000001",
      "email": "admin@ev.com",
      "firstName": "Admin",
      "lastName": "User",
      "userRole": "Admin",
      "isActive": true,
      "createdAt": "2025-10-28T08:22:15.871996Z"
    }
  }
}
```

---

## ?? B?o m?t

**C?NH BÁO**: Tài kho?n này là hardcoded ch? cho development/testing.

**Trong Production**:
- [ ] Thay ??i password ngay l?p t?c
- [ ] Ho?c xoá tài kho?n này và t?o qua admin dashboard
- [ ] Ho?c t?o migration m?i ?? xoá seed data

---

## ?? Testing

### Ki?m tra Login thành công
```bash
curl -s http://localhost:5000/api/auth/Login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ev.com","password":"admin"}' \
  | jq '.data.user'
```

### Ki?m tra Token ho?t ??ng
```bash
# G?i m?t request c?n authentication
curl -s http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <TOKEN>" \
  | jq '.'
```

### Ki?m tra Wrong Password
```bash
curl -s http://localhost:5000/api/auth/Login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ev.com","password":"wrong"}' \
  | jq '.message'
# K? v?ng: "Invalid email or password"
```

---

## ?? Related Files

- `Monolithic/Controllers/AuthController.cs` - Auth API endpoints
- `Monolithic/Services/Implementation/AuthServiceImpl.cs` - Auth business logic
- `Monolithic/Models/User.cs` - User model
- `Monolithic/Common/AppRoles.cs` - Role constants
- `Monolithic/DTOs/Auth/AuthDtos.cs` - DTO definitions

---

## ?? Troubleshooting

### Database not updated?
```bash
cd Monolithic
dotnet ef database update
```

### Migration not created?
```bash
cd Monolithic
dotnet ef migrations add AddHardcodedAdminUser
```

### Can't login?
1. Verify database has admin user:
   ```sql
   SELECT * FROM Users WHERE Email = 'admin@ev.com'
   ```
2. Check if API is running on correct port
3. Verify API_URL in test scripts

### Need to rollback?
```bash
cd Monolithic
dotnet ef database update <PreviousMigration>
# Ho?c
dotnet ef migrations remove AddHardcodedAdminUser
```

---

## ?? Support

N?u có v?n ??, hãy ki?m tra:
1. Migration ???c apply ch?a?
2. Database connection string ?úng ch?a?
3. API server ?ang ch?y ch?a?
4. Port number là bao nhiêu?

---

**Status**: ? Admin Account Setup Complete
**Last Updated**: October 28, 2025
**Ready for**: Development & Testing

