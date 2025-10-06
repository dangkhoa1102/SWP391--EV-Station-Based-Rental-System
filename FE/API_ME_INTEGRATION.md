# API Integration: /api/Auth/me

## Overview
The `/api/Auth/me` endpoint is used to fetch current authenticated user's information, including their `userId` and `email`. This is essential for features like change password that require the user's ID.

## Endpoint Details

### Request
```http
GET /api/Auth/me
Authorization: Bearer {token}
```

### Response (200 OK)
```json
{
  "userId": "8b00b538-c675-4f60-8400-9d956a5188e6",
  "email": "test4@gmail.com"
}
```

### Response Headers
```
Content-Type: application/json; charset=utf-8
Date: Mon, 06 Oct 2025 05:16:56 GMT
Server: Kestrel
```

## Implementation

### 1. Added to api.js
```javascript
getMe: async () => {
  try {
    console.log('Fetching current user info from:', API_BASE_URL + '/api/Auth/me');
    const response = await api.get('/api/Auth/me');
    console.log('User info response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Get user info error:', error);
    throw error.response?.data || { message: error.message };
  }
}
```

### 2. Used in user_profile.html

#### On Page Load
```javascript
window.addEventListener('DOMContentLoaded', async function() {
  try {
    const userData = await window.API.getMe();
    
    // Update localStorage with fresh data
    localStorage.setItem('userId', userData.userId);
    localStorage.setItem('userEmail', userData.email);
    
    // Display in form
    document.getElementById('email').value = userData.email;
    
  } catch (error) {
    console.error('Failed to fetch user data:', error);
    // Fallback to localStorage
  }
});
```

#### Before Change Password
```javascript
// Get userId from localStorage first
let userId = localStorage.getItem('userId');

// If no userId, fetch from API
if (!userId) {
  const userData = await window.API.getMe();
  userId = userData.userId;
  localStorage.setItem('userId', userId);
}

// Use userId for change password
await window.API.changePassword(userId, currentPassword, newPassword);
```

## Benefits

### ✅ Advantages
1. **Always Fresh Data**: Gets latest userId from server
2. **No Hardcoding**: No need to hardcode userId
3. **Auto Sync**: Syncs localStorage with server data
4. **Error Recovery**: Fetches userId even if localStorage is empty
5. **Security**: Uses Bearer token authentication

### ⚠️ Considerations
1. Requires valid JWT token
2. Returns 401 if token expired/invalid
3. Only returns userId and email (not full user profile)

## Flow Diagram

```
User Profile Page Load
         |
         v
Check Token Exists?
    |           |
   No          Yes
    |           |
    v           v
Redirect    Call /api/Auth/me
to Login         |
                 v
            Get Response
         (userId, email)
                 |
                 v
        Update localStorage
                 |
                 v
        Display in Form
                 |
                 v
    Ready for Change Password
```

## Error Handling

### Token Expired (401)
```javascript
// Handled by api.js interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = 'home_page.html';
    }
    return Promise.reject(error);
  }
);
```

### Network Error
```javascript
try {
  const userData = await window.API.getMe();
} catch (error) {
  // Fallback to localStorage
  const userId = localStorage.getItem('userId');
  const email = localStorage.getItem('userEmail');
  
  if (userId && email) {
    // Use cached data
  } else {
    // Ask user to login again
    showNotification('Please login again', 'error');
  }
}
```

## Testing

### Manual Test
1. Login with test account
2. Navigate to user profile page
3. Open Console (F12)
4. Check logs:
   ```
   Fetching user data from /api/Auth/me...
   User data received: { userId: "...", email: "..." }
   ✅ Updated userId: 8b00b538-c675-4f60-8400-9d956a5188e6
   ✅ Updated email: test4@gmail.com
   ```

### Test Change Password
1. Click "Change Password"
2. Fill in passwords
3. Check console for userId being used
4. Verify password changes successfully

## Comparison: Before vs After

### Before (Hardcoded)
```javascript
// ❌ Bad: Hardcoded userId
const userId = "8b090238-c078-4f60-8400-9d95dd218b88";
await API.changePassword(userId, oldPass, newPass);
```

### After (Dynamic)
```javascript
// ✅ Good: Fetch from API
const userData = await API.getMe();
const userId = userData.userId;
await API.changePassword(userId, oldPass, newPass);
```

## Related Endpoints

- `POST /api/Auth/login` - Login and get token
- `GET /api/Auth/me` - Get current user info ⭐
- `POST /api/Auth/change-password` - Change password
- `POST /api/Auth/refresh` - Refresh token
- `POST /api/Auth/logout` - Logout

## Status

✅ **Implemented and Working**
- API endpoint added to api.js
- Used in user_profile.html on page load
- Used before change password if userId missing
- Proper error handling
- Console logging for debugging

---

**Last Updated**: October 6, 2025
**Status**: Production Ready ✅
