import React, { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import '../styles/MapModal.css'

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
    if (stations.length === 0 && !userLocation) return

    const bounds = L.latLngBounds([])
    let hasValidBounds = false

    if (userLocation) {
      bounds.extend([userLocation.lat, userLocation.lng])
      hasValidBounds = true
    }

    stations.forEach(station => {
      const coords = getStationCoordinates(station)
      if (coords) {
        bounds.extend([coords.lat, coords.lng])
        hasValidBounds = true
      }
    })

    if (hasValidBounds) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 })
    }
  }, [map, stations, userLocation])

  return null
}

// Fallback coordinates for known stations
function getStationCoordinates(station) {
  const stationCoordinates = {
    'District 1 - Nguyen Hue': { lat: 10.7743, lng: 106.7012 },
    'District 4 - Khanh Hoi': { lat: 10.7593, lng: 106.7058 },
    'Binh Thanh - Pearl Plaza': { lat: 10.7990, lng: 106.7095 },
    'District 7 - Phu My Hung': { lat: 10.7308, lng: 106.7193 },
    'Go Vap - Emart': { lat: 10.8376, lng: 106.6758 },
    'Tan Binh - Airport': { lat: 10.8184, lng: 106.6589 },
  }

  const name = station.stationName || station.name || station.Name
  const lat = station.latitude || station.Latitude
  const lng = station.longitude || station.Longitude

  if (lat && lng) {
    return { lat: parseFloat(lat), lng: parseFloat(lng) }
  }

  if (stationCoordinates[name]) {
    return stationCoordinates[name]
  }

  return null
}

export default function MapModal({ isOpen, onClose, stations, onSelectStation, selectedStationId, userLocation }) {
  const [mapKey, setMapKey] = useState(0)

  // Force re-render map when modal opens
  useEffect(() => {
    if (isOpen) {
      setMapKey(prev => prev + 1)
    }
  }, [isOpen])

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
            const coords = getStationCoordinates(station)
            if (!coords) return null

            const name = station.stationName || station.name || station.Name || 'Unknown Station'
            const address = station.address || station.Address || ''
            const stationId = station.id || station.Id || station.stationId
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
