import React, { useState, useMemo } from 'react'
import '../styles/StationSelector.css'

/**
 * StationSelector Component - Replaces MapModal with dropdown-based selection
 * Features:
 * - Select by station suffix (e.g., "District 1", "District 2")
 * - Select station by name/address
 */
export default function StationSelector({ 
  isOpen, 
  onClose, 
  stations = [],
  onSelectStation,
  onSelectProvince,
  selectedStationId,
  selectedProvince,
  mode = 'station'
}) {
  const [selectionMode, setSelectionMode] = useState('suffix') // 'suffix' or 'station'
  const [selectedSuffix, setSelectedSuffix] = useState('')
  const [searchInput, setSearchInput] = useState('')

  // Initialize selectionMode from prop
  React.useEffect(() => {
    if (mode === 'province') {
      setSelectionMode('suffix')
      setSearchInput('')
    } else if (mode === 'station') {
      setSelectionMode('station')
      setSelectedSuffix('')
    }
  }, [mode, isOpen])

  // Extract unique suffixes from stations
  const suffixes = useMemo(() => {
    const suffixSet = new Set()
    stations.forEach(station => {
      const address = station.address || station.Address || ''
      // Extract suffix - e.g., "District 1", "Huyện Cần Thơ", etc.
      const parts = address.split(',')
      if (parts.length > 0) {
        const suffix = parts[parts.length - 1].trim()
        if (suffix) suffixSet.add(suffix)
      }
    })
    return Array.from(suffixSet).sort()
  }, [stations])

  // Filter stations by selected suffix
  const stationsBySuffix = useMemo(() => {
    if (selectionMode !== 'suffix' || !selectedSuffix) return []
    
    return stations.filter(station => {
      const address = station.address || station.Address || ''
      return address.endsWith(selectedSuffix)
    }).sort((a, b) => {
      const nameA = a.stationName || a.name || a.Name || ''
      const nameB = b.stationName || b.name || b.Name || ''
      return nameA.localeCompare(nameB)
    })
  }, [stations, selectedSuffix, selectionMode])

  // Search/Filter stations by name or address
  const filteredStations = useMemo(() => {
    if (selectionMode !== 'station') return []
    
    const query = searchInput.toLowerCase()
    return stations.filter(station => {
      const name = (station.stationName || station.name || station.Name || '').toLowerCase()
      const address = (station.address || station.Address || '').toLowerCase()
      return name.includes(query) || address.includes(query)
    }).sort((a, b) => {
      const nameA = a.stationName || a.name || a.Name || ''
      const nameB = b.stationName || b.name || b.Name || ''
      return nameA.localeCompare(nameB)
    })
  }, [stations, searchInput, selectionMode])

  if (!isOpen) return null

  return (
    <div className="station-selector-overlay">
      <div className="station-selector-modal">
        <div className="station-selector-header">
          <h3>
            <i className="fas fa-map-marker-alt"></i> 
            {mode === 'province' ? 'Select Province/City' : 'Select Pick-up Location'}
          </h3>
          <button className="station-selector-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Selection Mode Tabs - Only show when both modes are available */}
        {mode === undefined || mode === 'both' ? (
          <div className="station-selector-tabs">
            <button
              className={`tab-button ${selectionMode === 'suffix' ? 'active' : ''}`}
              onClick={() => {
                setSelectionMode('suffix')
                setSearchInput('')
              }}
            >
              <i className="fas fa-map-pin"></i> By District/Area
            </button>
            <button
              className={`tab-button ${selectionMode === 'station' ? 'active' : ''}`}
              onClick={() => {
                setSelectionMode('station')
                setSelectedSuffix('')
              }}
            >
              <i className="fas fa-search"></i> By Station Name
            </button>
          </div>
        ) : null}

        <div className="station-selector-content">
          {/* Mode 1: Select by Suffix/Province */}
          {selectionMode === 'suffix' && (
            <div className="selector-mode suffix-mode">
              <label className="selector-label">Choose District/Area:</label>
              <div className="suffix-list">
                {suffixes.length === 0 ? (
                  <div className="no-data">No districts/areas available</div>
                ) : (
                  suffixes.map(suffix => (
                    <button
                      key={suffix}
                      className={`suffix-button ${selectedSuffix === suffix || selectedProvince === suffix ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedSuffix(suffix)
                        // If in province mode, immediately select and close
                        if (mode === 'province' && onSelectProvince) {
                          onSelectProvince(suffix)
                        }
                      }}
                    >
                      <i className="fas fa-location-dot"></i>
                      {suffix}
                    </button>
                  ))
                )}
              </div>

              {/* Stations in selected suffix - Only show when mode is NOT 'province' */}
              {selectedSuffix && mode !== 'province' && (
                <div className="suffix-stations-container">
                  <label className="selector-label">
                    Stations in {selectedSuffix}:
                  </label>
                  <div className="stations-list">
                    {stationsBySuffix.length === 0 ? (
                      <div className="no-data">No stations in this area</div>
                    ) : (
                      stationsBySuffix.map(station => {
                        const stationId = station.id || station.Id || station.stationId
                        const name = station.stationName || station.name || station.Name || 'Unknown'
                        const address = station.address || station.Address || ''
                        const isSelected = stationId === selectedStationId

                        return (
                          <div
                            key={stationId}
                            className={`station-item ${isSelected ? 'selected' : ''}`}
                            onClick={() => onSelectStation(stationId, name, address)}
                          >
                            <div className="station-item-header">
                              <i className={`fas ${isSelected ? 'fa-check-circle' : 'fa-circle'}`}></i>
                              <span className="station-name">{name}</span>
                              {isSelected && <span className="selected-badge">Selected</span>}
                            </div>
                            <div className="station-address">{address}</div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mode 2: Search/Filter by Name/Address */}
          {selectionMode === 'station' && (
            <div className="selector-mode search-mode">
              <div className="search-input-group">
                <i className="fas fa-search"></i>
                <input
                  type="text"
                  placeholder="Search by station name or address..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="search-input"
                  autoFocus
                />
                {searchInput && (
                  <button
                    className="clear-search"
                    onClick={() => setSearchInput('')}
                  >
                    <i className="fas fa-times-circle"></i>
                  </button>
                )}
              </div>

              <div className="stations-list">
                {filteredStations.length === 0 ? (
                  <div className="no-data">
                    {searchInput ? 'No stations found matching your search' : 'Enter a search term'}
                  </div>
                ) : (
                  filteredStations.map(station => {
                    const stationId = station.id || station.Id || station.stationId
                    const name = station.stationName || station.name || station.Name || 'Unknown'
                    const address = station.address || station.Address || ''
                    const isSelected = stationId === selectedStationId

                    return (
                      <div
                        key={stationId}
                        className={`station-item ${isSelected ? 'selected' : ''}`}
                        onClick={() => onSelectStation(stationId, name, address)}
                      >
                        <div className="station-item-header">
                          <i className={`fas ${isSelected ? 'fa-check-circle' : 'fa-circle'}`}></i>
                          <span className="station-name">{name}</span>
                          {isSelected && <span className="selected-badge">Selected</span>}
                        </div>
                        <div className="station-address">{address}</div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>

        <div className="station-selector-footer">
          <p>
            <i className="fas fa-info-circle"></i> 
            {mode === 'province' 
              ? 'Click on a province/city to select it' 
              : mode === 'station'
              ? 'Search and click on a station to select it as your pick-up location'
              : 'Click on a station to select it as your pick-up location'}
          </p>
        </div>
      </div>
    </div>
  )
}
