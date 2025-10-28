// Cloudinary Configuration
const CLOUD_NAME = 'YOUR_CLOUD_NAME';  // Replace with your cloud name
const UPLOAD_PRESET = 'YOUR_UPLOAD_PRESET';  // Replace with your unsigned upload preset

// Upload file to Cloudinary
async function uploadToCloudinary(file) {
    if (!file) throw new Error('No file provided');
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        throw new Error('Only image files are allowed');
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB');
    }

    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', UPLOAD_PRESET);

        console.log('🔄 Uploading to Cloudinary...');
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Upload failed: ' + response.statusText);
        }

        const data = await response.json();
        console.log('✅ Upload successful:', data);
        
        return {
            url: data.secure_url,
            publicId: data.public_id,
            format: data.format,
            width: data.width,
            height: data.height
        };
    } catch (error) {
        console.error('❌ Upload failed:', error);
        throw error;
    }
}

// Generate transformed URL (resize, crop, etc)
function getTransformedUrl(originalUrl, options = {}) {
    if (!originalUrl) return '';
    
    // Extract base URL and file name
    const baseUrl = originalUrl.substring(0, originalUrl.lastIndexOf('/') + 1);
    const fileName = originalUrl.substring(originalUrl.lastIndexOf('/') + 1);
    
    // Build transformation string
    const transformations = [];
    
    if (options.width) transformations.push(`w_${options.width}`);
    if (options.height) transformations.push(`h_${options.height}`);
    if (options.crop) transformations.push(`c_${options.crop}`);
    if (options.gravity) transformations.push(`g_${options.gravity}`);
    if (options.quality) transformations.push(`q_${options.quality}`);
    
    const transformString = transformations.length > 0 
        ? transformations.join(',') + '/'
        : '';
    
    return baseUrl + transformString + fileName;
}

// Initialize avatar upload functionality
function initAvatarUpload() {
    const avatarInput = document.getElementById('avatarInput');
    const avatarPreview = document.getElementById('avatarPreview');
    const uploadStatus = document.getElementById('uploadStatus');
    const avatarWrapper = document.querySelector('.avatar-wrapper');

    if (!avatarInput || !avatarPreview || !uploadStatus || !avatarWrapper) {
        console.error('Required elements not found');
        return;
    }

    // Click handler for the avatar wrapper
    avatarWrapper.addEventListener('click', () => {
        avatarInput.click();
    });

    // File change handler
    avatarInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Show loading state
        uploadStatus.textContent = 'Uploading...';
        uploadStatus.classList.add('loading');
        uploadStatus.classList.remove('success', 'error');

        try {
            // Upload to Cloudinary
            const result = await uploadToCloudinary(file);

            // Update avatar preview with transformed URL
            const transformedUrl = getTransformedUrl(result.url, {
                width: 200,
                height: 200,
                crop: 'fill',
                gravity: 'face'
            });
            avatarPreview.src = transformedUrl;

            // Update user profile in your backend
            try {
                const userId = getCurrentUserId();
                if (!userId) throw new Error('User not logged in');
                
                await window.API.updateUserAvatar(userId, result.url);
                uploadStatus.textContent = 'Upload successful!';
                uploadStatus.classList.remove('loading');
                uploadStatus.classList.add('success');
            } catch (error) {
                console.error('Failed to update profile:', error);
                uploadStatus.textContent = 'Failed to update profile';
                uploadStatus.classList.remove('loading');
                uploadStatus.classList.add('error');
            }
        } catch (error) {
            console.error('Upload failed:', error);
            uploadStatus.textContent = error.message || 'Upload failed';
            uploadStatus.classList.remove('loading');
            uploadStatus.classList.add('error');
        }
    });
}

// Helper function to get current user ID
function getCurrentUserId() {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.id;
}

// Export functions for use in other files
window.CloudinaryConfig = {
    initAvatarUpload,
    uploadToCloudinary,
    getTransformedUrl
};
