import React, { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import '../styles/MapModal.css'
import { getGeocodingCacheStats, getCoordinateFromCache } from '../utils/geocodingService'

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

const selectedStationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [30, 49],
  iconAnchor: [15, 49],
  popupAnchor: [1, -40],
  shadowSize: [41, 41]
})

// Component to handle map bounds and centering
function MapController({ stations, userLocation }) {
  const map = useMap()

  useEffect(() => {
    if (!userLocation || !map) return

    try {
      // Add a small delay to ensure map is fully rendered
      const timer = setTimeout(() => {
        if (map && map._container) {
          map.setView([userLocation.lat, userLocation.lng], 14, {
            animate: true,
            duration: 1
          })
        }
      }, 100)

      return () => clearTimeout(timer)
    } catch (err) {
      console.warn('⚠️ Error setting map view:', err.message)
    }
  }, [map, userLocation])

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

  // Force re-render map when modal opens
  useEffect(() => {
    if (isOpen) {
      setMapKey(prev => prev + 1)
    }
  }, [isOpen])

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

    for (const station of stations) {
      const stationId = station.id || station.Id || station.stationId
      const address = station.address || station.Address || ''

      // Get from cache
      const coord = getCoordinateFromCache(address, 'Vietnam')
      if (coord) {
        availableCount++
      } else if (coord === null) {
        // Was already attempted but failed - don't retry
      } else {
        // undefined - never attempted, might need to geocode
        missingCount++
      }
      coords.set(stationId, coord)
    }

    // Show immediately if we have cached coordinates (even if not all)
    console.log(`✅ Using ${availableCount}/${stations.length} cached coordinates (${missingCount} never attempted)`)
    setStationCoords(coords)

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
        <button className="map-modal-close" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
      </div>
      <div className="map-container">
        <MapContainer
          key={mapKey}
          center={[center.lat, center.lng]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapController stations={stations} userLocation={userLocation} />

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

          {/* Station markers */}
          {stations.map((station) => {
            const stationId = station.id || station.Id || station.stationId
            const coords = stationCoords.get(stationId)
            
            // Skip if coordinates not available
            if (!coords) return null

            const name = station.stationName || station.name || station.Name || 'Unknown Station'
            const address = station.address || station.Address || ''
            const isSelected = stationId === selectedStationId

            return (
              <Marker
                key={stationId}
                position={[coords.lat, coords.lng]}
                icon={isSelected ? selectedStationIcon : stationIcon}
              >
                <Popup>
                  <div style={{ padding: '8px', minWidth: '200px' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#333' }}>
                      {name}
                    </h3>
                    <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#666' }}>
                      {address}
                    </p>
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
          })}
        </MapContainer>
      </div>
      <div className="map-modal-footer">
        <p>
          <i className="fas fa-info-circle"></i> Click on a marker to select a station
        </p>
      </div>
    </div>
  )
}
