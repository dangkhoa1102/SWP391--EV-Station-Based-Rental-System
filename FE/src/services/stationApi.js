import { apiClient, SWAGGER_ROOT } from './api'

const stationApi = {
  // Get all stations
  getAllStations: async (pageNumber = 1, pageSize = 100) => {
    try {
      console.log('📍 Fetching stations from:', `${SWAGGER_ROOT}/Stations/Get-All`)
      const res = await apiClient.get('/Stations/Get-All', { params: { pageNumber, pageSize } })
      console.log('✅ Stations response:', res.data)
      const responseData = res.data
      
      if (Array.isArray(responseData)) {
        console.log('✅ Returning stations array:', responseData.length, 'items')
        return responseData
      }
      
      if (responseData.data && responseData.data.data && Array.isArray(responseData.data.data)) {
        console.log('✅ Returning stations from data.data.data:', responseData.data.data.length, 'items')
        return responseData.data.data
      }
      
      if (responseData.data && responseData.data.items && Array.isArray(responseData.data.items)) {
        console.log('✅ Returning stations from data.data.items:', responseData.data.items.length, 'items')
        return responseData.data.items
      }
      
      if (responseData.data && Array.isArray(responseData.data)) {
        console.log('✅ Returning stations from data.data:', responseData.data.length, 'items')
        return responseData.data
      }
      
      if (responseData.items && Array.isArray(responseData.items)) {
        console.log('✅ Returning stations from data.items:', responseData.items.length, 'items')
        return responseData.items
      }
      
      console.warn('⚠️ No stations found in response')
      return []
    } catch (e) {
      console.error('❌ Error fetching stations:', e.response?.data || e.message)
      return []
    }
  }
}

export default stationApi
