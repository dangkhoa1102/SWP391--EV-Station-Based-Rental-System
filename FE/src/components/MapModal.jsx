import React, { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import '../styles/MapModal.css'
import { getGeocodingCacheStats, getCoordinateFromCache, clearGeocodingCache } from '../utils/geocodingService'

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Custom marker icons
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

const stationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

const bookmarkedStationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

// Component to handle map bounds and centering
function MapController({ stations, userLocation, stationCoords }) {
  const map = useMap()

  useEffect(() => {
    if (!map || !stations || stations.length === 0) return

    try {
      const timer = setTimeout(() => {
        if (!map || !map._container) return

        // Collect all valid station coordinates
        const stationMarkers = []
        let validStationsCount = 0
        
        for (const station of stations) {
          const stationId = station.id || station.Id || station.stationId
          const coord = stationCoords.get(stationId)
          if (coord && Number.isFinite(coord.lat) && Number.isFinite(coord.lng)) {
            stationMarkers.push([coord.lat, coord.lng])
            validStationsCount++
          } else {
            console.warn(`⚠️ Station ${stationId} has invalid coords:`, coord)
          }
        }

        console.log(`🎯 Valid station markers for map: ${validStationsCount}/${stations.length}`)
        console.log(`📍 Station markers array:`, stationMarkers.slice(0, 5).map((m, i) => ` [${i}]: [${m[0]}, ${m[1]}]`).join(', '), validStationsCount > 5 ? `... +${validStationsCount - 5} more` : '')

        // Helper: Calculate distance between two coordinates using Haversine formula
        const getDistanceKm = (lat1, lon1, lat2, lon2) => {
          const R = 6371; // Earth radius in km
          const dLat = ((lat2 - lat1) * Math.PI) / 180
          const dLon = ((lon2 - lon1) * Math.PI) / 180
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat1 * Math.PI) / 180) *
              Math.cos((lat2 * Math.PI) / 180) *
              Math.sin(dLon / 2) *
              Math.sin(dLon / 2)
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
          return R * c;
        }

        // If we have station markers, fit bounds to show them all
        if (stationMarkers.length > 0) {
          try {
            // Priority: Zoom to user location first if available
            if (userLocation) {
              console.log(`🔄 Zooming to user location: [${userLocation.lat}, ${userLocation.lng}]`)
              map.setView([userLocation.lat, userLocation.lng], 14, { 
                animate: true,
                duration: 0.5
              })
              console.log(`🗺️ Zoomed to user location with zoom level 14`)
            } else {
              // Fallback: fit all station markers if no user location
              const stationsToFit = stationMarkers
              
              console.log(`📏 Building bounds from ${stationsToFit.length} coordinates...`)
              const bounds = L.latLngBounds(stationsToFit)
              console.log(`📐 Bounds calculated: NE: ${bounds.getNorthEast()}, SW: ${bounds.getSouthWest()}`)
              
              console.log(`🔄 Calling fitBounds...`)
              map.fitBounds(bounds, { 
                padding: [50, 50],
                animate: true,
                duration: 0.5
              })
              console.log(`🗺️ Fitted map bounds`)
              console.log(`🎯 Map zoom after fitBounds: ${map.getZoom()}`)
            }
          } catch (boundsErr) {
            console.warn('⚠️ Error fitting bounds:', boundsErr.message)
            // Fallback: center on user location
            if (userLocation) {
              map.setView([userLocation.lat, userLocation.lng], 10)
            }
          }
        } else if (userLocation) {
          // No stations, just center on user
          map.setView([userLocation.lat, userLocation.lng], 12)
        }
      }, 100)

      return () => clearTimeout(timer)
    } catch (err) {
      console.warn('⚠️ Error in MapController:', err.message)
    }
  }, [map, stations, userLocation, stationCoords])

  return null
}

// Note: Station geocoding is now handled on page load in HomePage
// using geocodeAddressesBatch() which populates the geocoding cache
// MapModal simply uses the cached coordinates without re-geocoding

export default function MapModal({ isOpen, onClose, stations, onSelectStation, selectedStationId, userLocation }) {
  const [mapKey, setMapKey] = useState(0)
  const [stationCoords, setStationCoords] = useState(new Map())
  const [cacheStats, setCacheStats] = useState(null)
  const [isLoadingNewCoords, setIsLoadingNewCoords] = useState(false)
  const [coordsReady, setCoordsReady] = useState(false)
  const [duplicates, setDuplicates] = useState([])
  const [bookmarkedStations, setBookmarkedStations] = useState(() => {
    const saved = localStorage.getItem('bookmarkedStations')
    return saved ? JSON.parse(saved) : []
  })

  const toggleBookmark = (stationId) => {
    setBookmarkedStations(prev => {
      const newBookmarks = prev.includes(stationId) 
        ? prev.filter(id => id !== stationId) 
        : [...prev, stationId]
      localStorage.setItem('bookmarkedStations', JSON.stringify(newBookmarks))
      return newBookmarks
    })
  }

  const handleClearCacheAndReload = () => {
    if (confirm('Clear geocoding cache and reload? This will re-geocode all stations with the latest logic.')) {
      clearGeocodingCache()
      window.location.reload()
    }
  }

  // Get geocoded coordinates from cache when modal opens
  useEffect(() => {
    if (!isOpen || !stations || stations.length === 0) return

    // Get cache stats to see what's been geocoded
    const stats = getGeocodingCacheStats()
    setCacheStats(stats)
    console.log(`📊 Geocoding cache stats:`, stats)

    // Build coordinate map from cache
    const coords = new Map()
    let availableCount = 0
    let missingCount = 0
    const stationsWithoutCoords = []

    for (const station of stations) {
      const stationId = station.id || station.Id || station.stationId
      const address = station.address || station.Address || ''
      const name = station.stationName || station.name || station.Name || 'Unknown'

      // Get from cache
      const coord = getCoordinateFromCache(address, 'Vietnam')
      if (coord && Number.isFinite(coord.lat) && Number.isFinite(coord.lng)) {
        coords.set(stationId, coord)
        availableCount++
      } else if (coord === null) {
        // Was already attempted but failed - don't retry
        stationsWithoutCoords.push(`${name} (address: "${address}" - geocoding failed)`)
      } else if (coord && (!Number.isFinite(coord.lat) || !Number.isFinite(coord.lng))) {
        // Invalid coords from cache
        stationsWithoutCoords.push(`${name} (address: "${address}" - invalid coords: lat=${coord.lat}, lng=${coord.lng})`)
      } else {
        // undefined - never attempted, might need to geocode
        missingCount++
        stationsWithoutCoords.push(`${name} (address: "${address}" - not geocoded yet)`)
      }
    }

    // Show immediately if we have cached coordinates (even if not all)
    console.log(`✅ Using ${availableCount}/${stations.length} cached coordinates (${missingCount} never attempted)`)
    if (stationsWithoutCoords.length > 0) {
      console.log(`⚠️ Stations without valid coordinates (${stationsWithoutCoords.length}):`, stationsWithoutCoords)
    }
    
    // Log all coordinates in stationCoords map and check for duplicates
    console.log(`📋 stationCoords map contents (${coords.size} entries):`)
    const coordCounts = new Map()
    let loggedCount = 0
    for (const [id, coord] of coords) {
      if (coord) {
        const key = `${coord.lat.toFixed(6)},${coord.lng.toFixed(6)}`
        coordCounts.set(key, (coordCounts.get(key) || 0) + 1)
      }
      if (loggedCount < 10) {
        console.log(`  - ID: ${id} => ${coord ? `[${coord.lat}, ${coord.lng}]` : 'null'}`)
        loggedCount++
      }
    }
    const duplicates = Array.from(coordCounts.entries()).filter(([_, count]) => count > 1)
    if (duplicates.length > 0) {
      console.warn(`⚠️ Found ${duplicates.length} duplicate coordinates:`, duplicates.map(([key, count]) => `${key} (${count} stations)`).join(', '))
    }
    setDuplicates(duplicates)
    
    // Set coords and mark as ready TOGETHER
    setStationCoords(coords)
    setCoordsReady(true)  // Mark coords as ready after state update

    // Only show loading if there are actually NEW stations to geocode
    // Don't show it if all stations either succeeded or failed before
    if (missingCount > 0) {
      setIsLoadingNewCoords(true)
    } else {
      setIsLoadingNewCoords(false)
    }
  }, [isOpen, stations])

  if (!isOpen) return null

  const center = userLocation || { lat: 10.8231, lng: 106.6297 }

  return (
    <div className={`map-modal ${isOpen ? 'active' : ''}`}>
      <div className="map-modal-header">
        <h3>
          <i className="fas fa-map-marked-alt"></i> Select Location on Map
        </h3>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="map-modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
      </div>
      <div className="map-container">
        <MapContainer
          key={mapKey}
          center={[center.lat, center.lng]}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapController stations={stations} userLocation={userLocation} stationCoords={stationCoords} />

          {/* User location marker */}
          {userLocation && (
            <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
              <Popup>
                <div style={{ padding: '4px' }}>
                  <strong>Your Location</strong>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Station markers - render all markers directly */}
          {coordsReady && (() => {
              let renderedCount = 0
              let skippedCount = 0
              const markers = stations.map((station, idx) => {
                const stationId = station.id || station.Id || station.stationId
                const coords = stationCoords.get(stationId)
                const name = station.stationName || station.name || station.Name || 'Unknown Station'
                const address = station.address || station.Address || ''
                
                // Log all stations for complete debugging
                console.log(`📍 Station ${idx}: "${name}" | ID: ${stationId} | Coords: ${coords ? `[${coords.lat}, ${coords.lng}]` : 'MISSING'}`)
                
                // Skip if coordinates not available
                if (!coords) {
                  skippedCount++
                  return null
                }

                renderedCount++

                const isSelected = stationId === selectedStationId
                const isBookmarked = bookmarkedStations.includes(stationId)
                const icon = isSelected ? selectedStationIcon : (isBookmarked ? bookmarkedStationIcon : stationIcon)

                return (
                  <Marker
                    key={stationId}
                    position={[coords.lat, coords.lng]}
                    icon={icon}
                  >
                    <Popup>
                      <div style={{ padding: '8px', minWidth: '200px' }}>
                        <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#333' }}>
                          {name}
                        </h3>
                        <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#666' }}>
                          {address}
                        </p>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                          <button
                            onClick={() => toggleBookmark(stationId)}
                            style={{
                              background: isBookmarked ? '#4caf50' : '#2196f3',
                              color: 'white',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              flex: 1
                            }}
                          >
                            {isBookmarked ? '★ Bookmarked' : '☆ Bookmark'}
                          </button>
                        </div>
                        <button
                          onClick={() => onSelectStation(stationId, name, address)}
                          style={{
                            background: '#ff6b35',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            width: '100%'
                          }}
                        >
                          {isSelected ? '✓ Selected' : 'Select Location'}
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                )
              })
              console.log(`📍 Total markers rendered: ${renderedCount}, skipped: ${skippedCount}`)
              if (renderedCount + skippedCount !== stations.length) {
                console.error(`⚠️ MISMATCH: Expected ${stations.length} total but got ${renderedCount + skippedCount}`)
              }
              return markers
            })()}
        </MapContainer>
      </div>
      <div className="map-modal-footer">
        <p>
          <i className="fas fa-info-circle"></i> Click on a marker to select a station
          {duplicates.length > 0 && (
            <span style={{ color: '#f44336', marginLeft: '16px' }}>
              {/* ⚠️ {duplicates.length} duplicate coordinate(s) detected - click "Clear Cache" to fix */}
            </span>
          )}
        </p>
      </div>
    </div>
  )
}
