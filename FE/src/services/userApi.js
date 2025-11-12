import { apiClient } from './api'

const userApi = {
  // Get my profile -> GET /Users/Get-My-Profile
  getMyProfile: async () => {
    const res = await apiClient.get('/Users/Get-My-Profile')
    return res.data?.data || res.data || {}
  },

  // Update my profile -> PUT /Users/Update-My-Profile
  updateMyProfile: async (profileData) => {
    try {
      console.log('✏️ Updating user profile:', profileData)
      const res = await apiClient.put('/Users/Update-My-Profile', profileData)
      console.log('✅ Profile updated:', res.data)
      return res.data?.data || res.data || {}
    } catch (e) {
      console.error('❌ Error updating profile:', e.response?.data || e.message)
      throw e
    }
  },

  // Change password -> POST /Users/Change-Password
  changePassword: async (currentPassword, newPassword) => {
    try {
      console.log('🔐 Changing password')
      const res = await apiClient.post('/Users/Change-Password', { currentPassword, newPassword })
      console.log('✅ Password changed successfully')
      return res.data?.data || res.data || {}
    } catch (e) {
      console.error('❌ Error changing password:', e.response?.data || e.message)
      throw e
    }
  },

  // Update user avatar -> POST /Users/{userId}/avatar
  updateUserAvatar: async (userId, avatarUrl) => {
    try {
      console.log('📷 Updating avatar for user:', userId)
      const res = await apiClient.post(`/Users/${encodeURIComponent(userId)}/avatar`, { avatarUrl })
      console.log('✅ Avatar updated:', res.data)
      return res.data?.data || res.data || {}
    } catch (e) {
      console.error('❌ Error updating avatar:', e.response?.data || e.message)
      throw e
    }
  },

  // Get user by ID -> GET /Users/Get-By-{id}
  getUserById: async (userId) => {
    try {
      console.log('👤 Fetching user by ID:', userId)
      const res = await apiClient.get(`/Users/Get-By-${encodeURIComponent(userId)}`)
      console.log('✅ User data:', res.data)
      return res.data?.data || res.data || {}
    } catch (e) {
      console.error('❌ Error fetching user:', e.response?.data || e.message)
      throw e
    }
  },

  // Search users -> GET /Users/Search
  searchUsers: async (email, pageNumber = 1, pageSize = 10) => {
    try {
      console.log('🔍 Searching users by email:', email)
      const res = await apiClient.get('/Users/Search', {
        params: { email, pageNumber, pageSize }
      })
      console.log('✅ Search results:', res.data)
      // Handle different response formats
      if (Array.isArray(res.data)) return res.data
      if (res.data?.data && Array.isArray(res.data.data)) return res.data.data
      if (res.data?.items && Array.isArray(res.data.items)) return res.data.items
      return res.data || []
    } catch (e) {
      console.error('❌ Error searching users:', e.response?.data || e.message)
      return []
    }
  },

  // Deactivate user account -> PATCH /Users/Deactivate-By-{id}
  deactivateUser: async (userId, reason = '') => {
    try {
      const id = encodeURIComponent(userId)
      const query = reason ? `?reason=${encodeURIComponent(reason)}` : ''
      const attempts = [
        `/Users/Deactivate-By-${id}${query}`,
        `/User/Deactivate-By-${id}${query}`
      ]
      for (const url of attempts) {
        try {
          const res = await apiClient.patch(url, reason ? { reason } : {})
          const body = res?.data
          return body && typeof body === 'object' && 'data' in body ? body.data : body
        } catch (e) {
          const code = e?.response?.status
          if (code && code !== 404 && code !== 405) throw e
        }
      }
      throw new Error('Deactivate user endpoint not found')
    } catch (e) {
      console.error('❌ Error deactivating user:', e.message)
      throw e
    }
  },

  // Activate user account -> PATCH /Users/Activate-By-{id}
  activateUser: async (userId) => {
    try {
      const id = encodeURIComponent(userId)
      const attempts = [
        `/Users/Activate-By-${id}`,
        `/User/Activate-By-${id}`
      ]
      for (const url of attempts) {
        try {
          const res = await apiClient.patch(url, {})
          const body = res?.data
          return body && typeof body === 'object' && 'data' in body ? body.data : body
        } catch (e) {
          const code = e?.response?.status
          if (code && code !== 404 && code !== 405) throw e
        }
      }
      throw new Error('Activate user endpoint not found')
    } catch (e) {
      console.error('❌ Error activating user:', e.message)
      throw e
    }
  },

  // Update user role -> PATCH /Users/Update-Role-By-{id}
  updateUserRole: async (userId, newRole) => {
    try {
      const id = encodeURIComponent(userId)
      const attempts = [
        `/Users/Update-Role-By-${id}`,
        `/User/Update-Role-By-${id}`
      ]
      for (const url of attempts) {
        try {
          const res = await apiClient.patch(url, { role: newRole })
          const body = res?.data
          return body && typeof body === 'object' && 'data' in body ? body.data : body
        } catch (e) {
          const code = e?.response?.status
          if (code && code !== 404 && code !== 405) throw e
        }
      }
      throw new Error('Update user role endpoint not found')
    } catch (e) {
      console.error('❌ Error updating user role:', e.message)
      throw e
    }
  },

  // Update user profile by admin -> PUT /Users/Update-Profile-By-{userId}
  updateUserProfileByAdmin: async (userId, profileData) => {
    try {
      const id = encodeURIComponent(userId)
      const attempts = [
        `/Users/Update-Profile-By-${id}`,
        `/User/Update-Profile-By-${id}`
      ]
      for (const url of attempts) {
        try {
          const res = await apiClient.put(url, profileData)
          const body = res?.data
          return body && typeof body === 'object' && 'data' in body ? body.data : body
        } catch (e) {
          const code = e?.response?.status
          if (code && code !== 404 && code !== 405) throw e
        }
      }
      throw new Error('Update user profile endpoint not found')
    } catch (e) {
      console.error('❌ Error updating user profile:', e.message)
      throw e
    }
  },

  // Get total user count -> GET /Users/Get-Total-Count
  getTotalUserCount: async () => {
    try {
      const attempts = [
        `/Users/Get-Total-Count`,
        `/User/Get-Total-Count`
      ]
      for (const url of attempts) {
        try {
          const res = await apiClient.get(url)
          const body = res?.data
          const result = body && typeof body === 'object' && 'data' in body ? body.data : body
          return result?.totalCount || result?.count || result || 0
        } catch (e) {
          const code = e?.response?.status
          if (code && code !== 404 && code !== 405) throw e
        }
      }
      return 0
    } catch (e) {
      console.error('❌ Error getting total user count:', e.message)
      return 0
    }
  },

  // Get user statistics by role -> GET /Users/Get-Statistics-By-Role
  getUserStatisticsByRole: async () => {
    try {
      const attempts = [
        `/Users/Get-Statistics-By-Role`,
        `/User/Get-Statistics-By-Role`,
        `/Users/Statistics-By-Role`
      ]
      for (const url of attempts) {
        try {
          const res = await apiClient.get(url)
          const body = res?.data
          const result = body && typeof body === 'object' && 'data' in body ? body.data : body
          return result || {}
        } catch (e) {
          const code = e?.response?.status
          if (code && code !== 404 && code !== 405) throw e
        }
      }
      return {}
    } catch (e) {
      console.error('❌ Error getting user statistics:', e.message)
      return {}
    }
  }
}

export default userApi
