import { apiClient, SWAGGER_ROOT } from './api'

const carApi = {
  // Get all cars
  getAllCars: async (pageNumber = 1, pageSize = 100) => {
    try {
      console.log('🚗 Fetching cars from:', `${SWAGGER_ROOT}/Cars/Get-All`)
      const res = await apiClient.get('/Cars/Get-All', { params: { pageNumber, pageSize } })
      console.log('✅ Cars response:', res.data)
      const responseData = res.data
      
      if (Array.isArray(responseData)) {
        console.log('✅ Returning cars array:', responseData.length, 'items')
        return responseData
      }
      
      if (responseData.data && responseData.data.data && Array.isArray(responseData.data.data)) {
        console.log('✅ Returning cars from data.data.data:', responseData.data.data.length, 'items')
        return responseData.data.data
      }
      
      if (responseData.data && responseData.data.items && Array.isArray(responseData.data.items)) {
        console.log('✅ Returning cars from data.data.items:', responseData.data.items.length, 'items')
        return responseData.data.items
      }
      
      if (responseData.data && Array.isArray(responseData.data)) {
        console.log('✅ Returning cars from data.data:', responseData.data.length, 'items')
        return responseData.data
      }
      
      if (responseData.items && Array.isArray(responseData.items)) {
        console.log('✅ Returning cars from data.items:', responseData.items.length, 'items')
        return responseData.items
      }
      
      console.warn('⚠️ No cars found in response')
      return []
    } catch (e) {
      console.error('❌ Error fetching cars:', e.response?.data || e.message)
      return []
    }
  },

  // Get car by ID
  getCarById: async (carId) => {
    try {
      console.log('🚗 Fetching car details for ID:', carId)
      const res = await apiClient.get(`/Cars/Get-By-${encodeURIComponent(carId)}`)
      console.log('✅ Car detail response:', res.data)
      const responseData = res.data
      
      if (responseData.id || responseData.Id) {
        console.log('✅ Returning car object directly')
        return responseData
      }
      
      if (responseData.data && responseData.data.data && (responseData.data.data.id || responseData.data.data.Id)) {
        console.log('✅ Returning car from data.data.data')
        return responseData.data.data
      }
      
      if (responseData.data && (responseData.data.id || responseData.data.Id)) {
        console.log('✅ Returning car from data.data')
        return responseData.data
      }
      
      console.warn('⚠️ No car found in response')
      return null
    } catch (e) {
      console.error('❌ Error fetching car details:', e.response?.data || e.message)
      throw e
    }
  },

  // Get available cars by station
  getAvailableCarsByStation: async (stationId) => {
    try {
      console.log('🚗 Fetching available cars for station:', stationId)
      const res = await apiClient.get(`/Cars/Get-Available-By-Station/${encodeURIComponent(stationId)}`)
      console.log('✅ Available cars response:', res.data)
      const responseData = res.data
      
      if (Array.isArray(responseData)) {
        console.log('✅ Returning available cars array:', responseData.length, 'items')
        return responseData
      }
      
      if (responseData.data && responseData.data.data && Array.isArray(responseData.data.data)) {
        console.log('✅ Returning available cars from data.data.data:', responseData.data.data.length, 'items')
        return responseData.data.data
      }
      
      if (responseData.data && responseData.data.items && Array.isArray(responseData.data.items)) {
        console.log('✅ Returning available cars from data.data.items:', responseData.data.items.length, 'items')
        return responseData.data.items
      }
      
      if (responseData.data && Array.isArray(responseData.data)) {
        console.log('✅ Returning available cars from data.data:', responseData.data.length, 'items')
        return responseData.data
      }
      
      if (responseData.items && Array.isArray(responseData.items)) {
        console.log('✅ Returning available cars from data.items:', responseData.items.length, 'items')
        return responseData.items
      }
      
      console.warn('⚠️ No available cars found in response')
      return []
    } catch (e) {
      console.error('❌ Error fetching available cars:', e.response?.data || e.message)
      throw e
    }
  }
}

export default carApi
