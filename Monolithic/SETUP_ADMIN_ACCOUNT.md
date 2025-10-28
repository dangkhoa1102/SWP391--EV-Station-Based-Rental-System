# Setup Admin Account - H??ng d?n K? thu?t

## T?ng quan

Tài kho?n admin ?ã ???c c?u hình c?ng (hardcoded) trong c? s? d? li?u qua Entity Framework Core seed data. 

## Nh?ng thay ??i ???c th?c hi?n

### 1. File: `Monolithic/Data/EVStationBasedRentalSystemDbContext.cs`

**Thêm:**
- Namespace `System.Security.Cryptography` và `System.Text` ?? hashing password
- Method `HashPassword()` ?? mã hoá password SHA-256
- Seed data cho admin user trong method `OnModelCreating()`

**Chi ti?t seed data:**
```csharp
var adminUserId = Guid.Parse("00000000-0000-0000-0000-000000000001");
var adminUser = new User
{
    UserId = adminUserId,
    UserName = "admin@ev.com",
    Email = "admin@ev.com",
    FirstName = "Admin",
    LastName = "User",
    PasswordHash = HashPassword("admin"), // Password mã hoá
    UserRole = "Admin",
    IsActive = true,
    CreatedAt = DateTime.UtcNow,
    IsVerified = true
    // ...các fields khác null/default
};

builder.Entity<User>().HasData(adminUser);
```

### 2. Migration: `Monolithic/Migrations/20251028082216_AddHardcodedAdminUser.cs`

**T? ??ng t?o b?i EF Core v?i l?nh:**
```bash
dotnet ef migrations add AddHardcodedAdminUser
```

**N?i dung:**
- Insert user record v?i ID `00000000-0000-0000-0000-000000000001`
- Email: `admin@ev.com`
- UserName: `admin@ev.com`
- PasswordHash: SHA-256 hash c?a "admin"
- Role: "Admin"
- IsActive: true
- IsVerified: true

**Rollback:**
- Method `Down()` xoá record n?u c?n rollback

### 3. Database Update

**L?nh th?c thi:**
```bash
dotnet ef database update
```

**K?t qu?:** Admin user ???c insert vào b?ng `Users`

## Cách ??ng nh?p

### Via API:
```http
POST /api/auth/Login HTTP/1.1
Content-Type: application/json

{
  "email": "admin@ev.com",
  "password": "admin"
}
```

### Response (Success):
```json
{
  "isSuccess": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "...",
    "user": {
      "id": "00000000-0000-0000-0000-000000000001",
      "email": "admin@ev.com",
      "firstName": "Admin",
      "lastName": "User",
      "userRole": "Admin",
      "isActive": true
    }
  },
  "message": "Login successful"
}
```

## C?u trúc Roles

D?a trên `Monolithic/Common/AppRoles.cs`:
```csharp
public static class AppRoles
{
    public const string Admin = "Admin";
    public const string StationStaff = "Station Staff";
    public const string EVRenter = "EV Renter";
}
```

Admin user ???c gán role **"Admin"** - có quy?n cao nh?t trong h? th?ng.

## Password Hashing

Password ???c mã hoá s? d?ng **SHA-256**:

```csharp
private static string HashPassword(string password)
{
    using var sha256 = SHA256.Create();
    var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
    return Convert.ToBase64String(hashedBytes);
}
```

**Hash c?a "admin"**: `jGl25bVBBBW96Qi9Te4V37Fnqchz/Eu4qB9vKrRIqRg=`

## Xác minh trong Code

Xác minh password ???c th?c hi?n trong `AuthServiceImpl.LoginAsync()`:

```csharp
// Verify password
if (!VerifyPassword(request.Password, user.PasswordHash ?? ""))
{
    return ResponseDto<LoginResponseDto>.Failure("Invalid email or password");
}
```

Method `VerifyPassword()`:
```csharp
private bool VerifyPassword(string password, string hashedPassword)
{
    var hash = HashPassword(password);
    return hash == hashedPassword;
}
```

## Files liên quan

- `Monolithic/Controllers/AuthController.cs` - API endpoints
- `Monolithic/Services/Implementation/AuthServiceImpl.cs` - Business logic
- `Monolithic/Models/User.cs` - User model
- `Monolithic/DTOs/Auth/AuthDtos.cs` - DTO definitions
- `Monolithic/Common/AppRoles.cs` - Role definitions

## C?n th?n

?? **Quan tr?ng:**
- Tài kho?n này là c?ng (hardcoded) ch? cho phát tri?n/ki?m th?
- Trong production, c?n thay ??i password ho?c t?o tài kho?n m?i
- Khi update database l?n ??u tiên, migration này s? t? ??ng ch?y

## Rollback (n?u c?n)

?? xoá admin account này kh?i database:

```bash
cd Monolithic
dotnet ef migrations remove AddHardcodedAdminUser
```

Ho?c ch? rollback l?n cu?i:
```bash
dotnet ef database update 20251026082035_UpdateDb2
```
(thay th? timestamp cu?i cùng tr??c khi add admin user)

## Testing

B?n có th? test b?ng:

1. **Swagger UI**: `http://localhost:<port>/swagger`
2. **Postman**: POST request ??n `/api/auth/Login`
3. **curl**:
```bash
curl -X POST http://localhost:<port>/api/auth/Login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ev.com","password":"admin"}'
```

