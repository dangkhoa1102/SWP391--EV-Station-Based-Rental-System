/**
 * Geocoding Service
 * Converts addresses to coordinates using Nominatim (OpenStreetMap)
 * No API key needed, but has rate limits (~1 request/second)
 * Uses localStorage to persist results across sessions
 */

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'
const STORAGE_KEY = 'ev_station_geocoding_cache'

// In-memory cache to avoid duplicate requests in same session
const geocodingCache = new Map()

/**
 * Load cache from localStorage on startup
 */
function loadCacheFromStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const data = JSON.parse(stored)
      // Restore Map from stored object
      Object.entries(data).forEach(([key, value]) => {
        geocodingCache.set(key, value)
      })
      console.log(`📦 Loaded ${geocodingCache.size} cached geocoding results from localStorage`)
      return true
    }
  } catch (error) {
    console.warn('⚠️ Failed to load geocoding cache from localStorage:', error.message)
  }
  return false
}

/**
 * Save cache to localStorage
 */
function saveCacheToStorage() {
  try {
    // Convert Map to object for JSON serialization
    const data = Object.fromEntries(geocodingCache)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.warn('⚠️ Failed to save geocoding cache to localStorage:', error.message)
  }
}

// Load cache from storage when service initializes
loadCacheFromStorage()

/**
 * Convert address to latitude/longitude using Nominatim
 * Tries multiple address formats if initial attempt fails
 * @param {string} address - Street address
 * @param {string} city - City/province name (helps with accuracy)
 * @returns {Promise<{lat: number, lng: number} | null>}
 */
export async function geocodeAddress(address, city = 'Vietnam') {
  if (!address || typeof address !== 'string') {
    return null
  }

  const cacheKey = `${address}|${city}`

  // Check cache first
  if (geocodingCache.has(cacheKey)) {
    const cached = geocodingCache.get(cacheKey)
    if (cached) {
      console.log(`📍 Geocoding cache hit for "${address}"`)
    }
    return cached
  }

  try {
    // Try multiple query formats - Nominatim for Vietnam needs simple format
    const addressParts = address.split(',').map(s => s.trim())
    const streetName = addressParts[0] || address
    
    const queries = [
      `${address}, Vietnam`,                    // Full address with country
      `${streetName}, ${city}, Vietnam`,        // Street + city + country  
      `${streetName} ${city} Vietnam`,          // Without commas (sometimes works better)
      address,                                   // Just the address
    ]

    console.log(`🔍 Geocoding address: "${address}" (city: "${city}")`)

    let results = null
    let lastQuery = ''

    for (const query of queries) {
      lastQuery = query
      
      const response = await fetch(
        `${NOMINATIM_URL}?q=${encodeURIComponent(query)}&format=json&limit=10&timeout=10&accept-language=vi&countrycodes=vn`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'EVStationRental-FE'
          }
        }
      )

      if (!response.ok) {
        continue
      }

      results = await response.json()

      // If we got results, try to find the best match
      if (Array.isArray(results) && results.length > 0) {
        // Prefer results that are specific locations (roads, buildings, etc) over administrative areas
        // But don't reject everything - we need to be more lenient
        const preferredResults = results.filter(r => {
          const type = (r.type || r.class || '').toLowerCase()
          const addressType = (r.addresstype || '').toLowerCase()
          // Accept roads, buildings, amenities, tourism spots, etc - reject only pure administrative
          return !['state', 'province', 'country'].includes(type) && 
                 !['state', 'province', 'country'].includes(addressType)
        })

        const resultsToCheck = preferredResults.length > 0 ? preferredResults : results
        
        // Prefer results that match the city/province in display name
        const bestResult = resultsToCheck.find(r => {
          const displayName = r.display_name?.toLowerCase() || ''
          const cityLower = city?.toLowerCase() || ''
          return cityLower && displayName.includes(cityLower)
        }) || resultsToCheck[0]

        const coords = {
          lat: parseFloat(bestResult.lat),
          lng: parseFloat(bestResult.lon)
        }

        // Validate coordinates
        if (!isNaN(coords.lat) && !isNaN(coords.lng)) {
          console.log(`✅ Geocoded "${address}" (via "${lastQuery}") → ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`)
          geocodingCache.set(cacheKey, coords)
          saveCacheToStorage() // Persist to localStorage
          return coords
        }
      }

      // Small delay between attempts
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // No results found
    console.warn(`⚠️ Could not geocode: "${address}" (tried: ${queries.join(' | ')})`)
    geocodingCache.set(cacheKey, null)
    saveCacheToStorage() // Persist failed attempt too
    return null
  } catch (error) {
    console.error(`❌ Geocoding error for "${address}":`, error.message)
    geocodingCache.set(cacheKey, null)
    saveCacheToStorage()
    return null
  }
}

/**
 * Batch geocode multiple addresses
 * With rate limiting (delay between requests)
 * @param {Array<{address: string, city?: string, id: any}>} items - Items to geocode
 * @param {number} delayMs - Delay between requests (default 500ms to respect rate limits)
 * @returns {Promise<Map<id, {lat, lng} | null>>}
 */
export async function geocodeAddressesBatch(items, delayMs = 500) {
  if (!Array.isArray(items) || items.length === 0) {
    console.warn('⚠️ geocodeAddressesBatch: Empty or invalid items array')
    return new Map()
  }

  const results = new Map()
  let successCount = 0

  for (const item of items) {
    const address = item.address || item.Address || ''
    const city = item.city || 'Vietnam'

    if (!address) {
      console.warn(`⚠️ Station ${item.id}: No address found - skipping geocoding`)
      results.set(item.id, null)
      continue
    }

    const coords = await geocodeAddress(address, city)
    if (coords) {
      successCount++
    }
    results.set(item.id, coords)

    // Rate limiting: wait before next request
    if (items.indexOf(item) < items.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }

  console.log(`🌍 Batch geocoding complete: ${successCount}/${items.length} stations geocoded`)
  return results
}

/**
 * Clear geocoding cache (useful if addresses change)
 */
export function clearGeocodingCache() {
  geocodingCache.clear()
  localStorage.removeItem(STORAGE_KEY)
  console.log('🗑️ Geocoding cache cleared (memory + localStorage)')
}

/**
 * Get cache stats
 */
export function getGeocodingCacheStats() {
  return {
    size: geocodingCache.size,
    entries: Array.from(geocodingCache.entries()),
    storageSize: localStorage.getItem(STORAGE_KEY)?.length || 0
  }
}

/**
 * Get coordinate from cache (for MapModal to use)
 * @param {string} address - Street address
 * @param {string} city - City/province name
 * @returns {{lat: number, lng: number} | null}
 */
export function getCoordinateFromCache(address, city = 'Vietnam') {
  const cacheKey = `${address}|${city}`
  return geocodingCache.get(cacheKey) || null
}
