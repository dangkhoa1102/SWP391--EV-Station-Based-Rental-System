# ?? Admin Account Quick Reference

## Credentials
```
Email:    admin@ev.com
Password: admin
Role:     Admin
ID:       00000000-0000-0000-0000-000000000001
```

## Login Endpoint
```
POST /api/auth/Login
```

## cURL Command (Quick Login)
```bash
curl -X POST http://localhost:5000/api/auth/Login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ev.com","password":"admin"}'
```

## Get Current User
```bash
# First get the token from login response
# Then use it:
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <your_token_here>"
```

## Postman
1. Import: `Admin-Account-Test.postman_collection.json`
2. Set variable: `api_url = http://localhost:5000`
3. Run: "Admin Login"
4. Run: "Get Current User Info"

## Swagger
1. Go to: `http://localhost:5000/swagger`
2. Find: POST `/api/auth/Login`
3. Try it out
4. Enter: `{"email":"admin@ev.com","password":"admin"}`

## Test Scripts
```bash
# Bash (curl):
bash test-admin-account.sh

# Node.js:
npm install axios
node test-admin-account.js
```

## Database
```sql
-- Check if admin exists:
SELECT * FROM Users WHERE Email = 'admin@ev.com'

-- Expected result:
-- UserId: 00000000-0000-0000-0000-000000000001
-- Email: admin@ev.com
-- UserRole: Admin
-- IsActive: 1 (true)
```

## Files
- Code: `Monolithic/Data/EVStationBasedRentalSystemDbContext.cs`
- Migration: `Monolithic/Migrations/20251028082216_AddHardcodedAdminUser.cs`
- Docs: `Monolithic/SETUP_COMPLETE_SUMMARY.md`

## Expected Login Response
```json
{
  "isSuccess": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "00000000-0000-0000-0000-000000000001",
      "email": "admin@ev.com",
      "firstName": "Admin",
      "lastName": "User",
      "userRole": "Admin",
      "isActive": true
    }
  }
}
```

## Common Issues
| Issue | Fix |
|-------|-----|
| Can't login | Verify database has admin user: `SELECT * FROM Users WHERE Email = 'admin@ev.com'` |
| Token not working | Check JWT config in `Program.cs`, verify token format: `Bearer <TOKEN>` |
| Migration not applied | Run: `dotnet ef database update` |
| Can't find migration | Migration file: `20251028082216_AddHardcodedAdminUser.cs` |

## Quick Test
```bash
# 1. Login
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/Login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ev.com","password":"admin"}' | jq -r '.data.token')

echo "Token: $TOKEN"

# 2. Use token
curl -s http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

## Status
- ? Setup Complete
- ? Database Updated
- ? Admin User Created
- ? Password Hashed (SHA-256)
- ? Ready to Use

## Links
- Docs: See `README_ADMIN_SETUP.md`
- Technical: See `SETUP_ADMIN_ACCOUNT.md`
- Account Info: See `ADMIN_ACCOUNT.md`
- Full Summary: See `SETUP_COMPLETE_SUMMARY.md`

---

**Ready to login! ??**

