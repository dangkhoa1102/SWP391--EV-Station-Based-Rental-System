# 🚀 Quick Reference Card - FEC Project

## 📂 Project Files (15 Essential)

### Core Application
```
home_page.html          - Main page (login/register/search)
user_profile.html       - User profile & change password
booking_history.html    - Booking history
payment_page.html       - Payment processing
car_list_page.html     - Car listings
car_detail.html        - Car details
```

### Styles
```
style.css              - Global styles
CSS/shared.css         - Shared components
CSS/home_page.css      - Home page styles
CSS/booking_history.css - Booking styles
CSS/payment_page.css   - Payment styles
CSS/user_profile.css   - Profile styles
```

### Scripts & Config
```
api.js                 - API configuration
package.json           - Dependencies
README.md              - Documentation
```

## 🎯 Common Commands

```bash
# Start server
npm start
npx http-server -p 8080

# Install dependencies
npm install

# View files
Get-ChildItem

# Clean project (if needed)
.\cleanup.ps1
```

## 🔗 Important URLs

- **Local**: http://127.0.0.1:8080/home_page.html
- **Backend**: https://localhost:7001
- **Swagger**: https://localhost:7001/swagger

## 🔑 API Endpoints

```javascript
POST /api/Auth/login           // Login
POST /api/Auth/register        // Register
POST /api/Auth/change-password // Change password
POST /api/Auth/refresh         // Refresh token
POST /api/Auth/logout          // Logout
```

## 💾 LocalStorage Keys

```javascript
token          // JWT token
refreshToken   // Refresh token
userId         // User ID (UUID)
username       // User name
userEmail      // User email
userPhone      // User phone
tokenExpiry    // Token expiration
```

## 🐛 Quick Fixes

### CORS Error
1. Accept HTTPS cert at https://localhost:7001
2. Check backend CORS config
3. Ensure backend is running

### Login Failed
1. Clear localStorage: `localStorage.clear()`
2. Hard refresh: `Ctrl + Shift + R`
3. Check credentials in Swagger

### Change Password Not Working
1. Check userId: `localStorage.getItem('userId')`
2. Logout and login again
3. Verify backend is running

## 📱 Test Account

```
Email: test4@gmail.com
Password: [your password]
```

## 🎨 Color Scheme

```css
Primary: #ff6b35
Secondary: #004e89
Success: #28a745
Error: #dc3545
Warning: #ffc107
```

## 📦 Project Stats

- **Files**: 15 essential files
- **Lines of Code**: ~2000+ lines
- **Dependencies**: http-server, axios
- **Browser Support**: Modern browsers
- **Mobile**: Responsive design

## 🔍 File Sizes

```
home_page.html      ~34 KB
user_profile.html   ~12 KB
style.css           ~27 KB
api.js              ~6 KB
```

---

**Version**: 1.0.0
**Status**: Production Ready ✅
**Last Updated**: October 6, 2025
