# FEC Electric Car Rental - Frontend Project

## 📁 Project Structure

```
FE/
├── CSS/                          # Modular CSS files
│   ├── shared.css               # Common components (notifications, modals, user menu)
│   ├── home_page.css            # Home page specific styles
│   ├── booking_history.css      # Booking history page styles
│   ├── payment_page.css         # Payment page styles
│   └── user_profile.css         # User profile page styles
│
├── api.js                       # Centralized API configuration
├── style.css                    # Global styles
│
├── home_page.html               # Main landing page with auth
├── user_profile.html            # User profile & change password
├── booking_history.html         # Booking history page
├── payment_page.html            # Payment page
├── car_list_page.html          # Car listing page
├── car_detail.html             # Car detail page
│
├── package.json                 # NPM dependencies
└── README.md                    # This file
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm start
# or
npx http-server -p 8080
```

### 3. Access Application
- **Local**: http://127.0.0.1:8080/home_page.html
- **Network**: http://192.168.1.10:8080/home_page.html

## 🔧 Configuration

### Backend API Configuration
Edit `api.js`:
```javascript
const API_BASE_URL = 'https://localhost:7001';
```

### Important Notes
- Backend runs on HTTPS port 7001
- Accept HTTPS certificate warning in browser first
- CORS must be configured on backend

## 🔐 Authentication System

### Login
- **Endpoint**: `POST /api/Auth/login`
- **Fields**: `username` (accepts email), `password`
- **Response**: 
  ```json
  {
    "user": {
      "id": "user-uuid",
      "name": "username",
      "email": "user@email.com",
      "phoneNumber": "1234567890"
    },
    "token": "jwt-token",
    "refreshToken": "refresh-token",
    "tokenExpiry": "2025-10-13T02:10:07Z"
  }
  ```

### Registration
- **Endpoint**: `POST /api/Auth/register`
- **Fields**: `Name`, `Email`, `PhoneNumber`, `Password`, `ConfirmPassword`, `Role`
- **Validation**:
  - Password: min 8 chars, uppercase, lowercase, digit, special character
  - Phone: 10-11 digits
  - Email: valid format

### Change Password
- **Endpoint**: `POST /api/Auth/change-password`
- **Fields**: `userId`, `currentPassword`, `newPassword`
- **Requirements**: User must be logged in with valid userId

## 📦 Features

### ✅ Implemented
- User registration with validation
- Email-based login system
- JWT token authentication
- Auto-save user data to localStorage
- User profile page with data loading
- Change password with validation
- Password visibility toggle
- Responsive notification system
- User menu dropdown
- Modal dialogs for auth

### 🚧 To Be Implemented
- Car search functionality
- Booking system
- Payment processing
- Booking history
- Car details page

## 🎨 UI Components

### Modals
- Login modal
- Registration modal
- Change password modal

### Notifications
- Success messages (green)
- Error messages (red)
- Auto-dismiss after 3 seconds

### Forms
- Inline validation
- Password strength indicator
- Show/hide password toggle
- Placeholder hints

## 💾 LocalStorage Data

```javascript
// Saved on login
localStorage.setItem('token', response.token);
localStorage.setItem('refreshToken', response.refreshToken);
localStorage.setItem('userId', response.user.id);
localStorage.setItem('username', response.user.name);
localStorage.setItem('userEmail', response.user.email);
localStorage.setItem('userPhone', response.user.phoneNumber);
```

## 🐛 Troubleshooting

### CORS Errors
1. Ensure backend CORS is configured before `app.Build()`
2. Accept HTTPS certificate at https://localhost:7001
3. Check browser console for specific errors

### Login Issues
1. Clear localStorage: `localStorage.clear()`
2. Hard refresh: `Ctrl + Shift + R`
3. Check backend is running on port 7001
4. Verify credentials in Swagger

### Password Change Issues
1. Ensure userId is saved after login
2. Check console: `localStorage.getItem('userId')`
3. Logout and login again if userId is null

## 📝 API Endpoints Reference

### Authentication
- `POST /api/Auth/login` - User login
- `POST /api/Auth/register` - User registration
- `POST /api/Auth/change-password` - Change password
- `POST /api/Auth/refresh` - Refresh token
- `POST /api/Auth/logout` - Logout

## 🔒 Security Notes

- Passwords never logged or stored in plain text
- JWT tokens stored in localStorage
- Bearer token sent in Authorization header
- Token expiry handled automatically
- 401 responses trigger auto-logout

## 📱 Browser Support

- Chrome/Edge: ✅ Fully supported
- Firefox: ✅ Fully supported
- Safari: ✅ Fully supported
- Mobile browsers: ✅ Responsive design

## 🛠️ Development

### File Naming Convention
- HTML files: lowercase with underscores (e.g., `user_profile.html`)
- CSS files: lowercase with underscores (e.g., `user_profile.css`)
- JS files: lowercase (e.g., `api.js`)

### CSS Architecture
- `style.css`: Global styles, header, footer
- `CSS/shared.css`: Shared components (notifications, modals)
- `CSS/[page].css`: Page-specific styles

### Code Style
- Use `const` and `let`, avoid `var`
- Async/await for API calls
- Try-catch for error handling
- Console logging for debugging
- Comments for complex logic

## 📄 License

© 2025 FEC. All rights reserved.

## 👥 Team

- Frontend: Electric Car Rental Team
- Backend: .NET Core API
- Database: SQL Server

---

**Last Updated**: October 6, 2025
**Version**: 1.0.0
