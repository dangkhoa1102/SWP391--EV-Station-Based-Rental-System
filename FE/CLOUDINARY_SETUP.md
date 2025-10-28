# Cloudinary Setup Guide

## 🌥️ Hướng dẫn cấu hình Cloudinary cho User Profile Avatar Upload

### Bước 1: Tạo Cloudinary Account

1. Truy cập [Cloudinary Console](https://cloudinary.com/console)
2. Đăng ký tài khoản miễn phí
3. Sau khi đăng ký, bạn sẽ có:
   - Cloud name
   - API Key
   - API Secret

### Bước 2: Tạo Upload Preset

1. Trong Cloudinary Console, vào **Settings** → **Upload**
2. Scroll xuống phần **Upload presets**
3. Click **Add upload preset**
4. Cấu hình:
   - **Signing Mode**: Unsigned
   - **Folder**: `users` (hoặc tùy chọn)
   - **Allowed formats**: Select `Image` only
   - **Max file size**: 5MB

5. Click **Save**
6. Ghi nhớ tên preset (ví dụ: `user_uploads`)

### Bước 3: Cập nhật Config

Mở file `cloudinary-config.js` và cập nhật:

```javascript
const CLOUD_NAME = 'your_cloud_name';       // từ Dashboard
const UPLOAD_PRESET = 'your_upload_preset';  // preset vừa tạo
```

### Bước 4: Thêm vào HTML

Trong file có sử dụng upload (ví dụ: `user_profile.html`), thêm script:

```html
<script src="../cloudinary-config.js"></script>
```

### Bước 5: Test Upload

1. Mở trang user profile
2. Click vào avatar để upload ảnh
3. Kiểm tra Console:
   - ✅ "Uploading to Cloudinary..."
   - ✅ "Upload successful"
   - ✅ Avatar hiển thị với URL mới

### 📋 Kiểm tra trong Cloudinary

1. Media Library sẽ hiển thị ảnh đã upload
2. Trong folder `users/` (nếu đã set)
3. Có thể xem transformations và URL

## 💡 Tips

### Image Transformations
Dùng `getTransformedUrl()` để resize/crop ảnh:

```javascript
// Original URL from upload
const originalUrl = "https://res.cloudinary.com/demo/image/upload/sample.jpg";

// Get transformed URL (ví dụ: resize 200x200)
const avatarUrl = getTransformedUrl(originalUrl, {
    width: 200,
    height: 200,
    crop: 'fill',
    gravity: 'face'
});
```

### Security
- Dùng **unsigned** upload preset: an toàn cho client-side vì giới hạn được:
  - File types (chỉ image)
  - Max size (5MB)
  - Folder destination
  - No API key exposed

### Quota Free Tier
- 25 credits/month (~25GB storage)
- Unlimited transformations
- Unlimited delivery

## ⚠️ Lưu ý

1. **File Types**: Chỉ accept image files
2. **File Size**: Max 5MB
3. **URL Format**: Luôn dùng `secure_url` (https)
4. **Transformations**: Nên resize server-side để tối ưu

## 🔧 Troubleshooting

### "Upload failed"
- Check CLOUD_NAME và UPLOAD_PRESET
- Kiểm tra file size < 5MB
- Verify file là image type

### "Invalid upload preset"
- Check preset tồn tại và đã set unsigned
- Verify preset name chính xác

### Image không hiển thị
- Dùng `secure_url` từ response
- Kiểm tra URL có valid không
- Clear browser cache

## 🚀 Next Steps

1. **Backend Integration**:
   ```javascript
   // Lưu avatar URL vào user profile
   await window.API.updateUserAvatar(userId, imageUrl);
   ```

2. **Cleanup cũ**:
   - Xóa ảnh cũ trên Cloudinary khi update
   - Dùng public_id để track

3. **Tối ưu**:
   - Thêm loading indicator
   - Preview trước khi upload
   - Compress client-side nếu cần