import React, { useEffect, useState, useRef } from 'react'
import stationApi from '../../../../services/stationApi'
import carApi from '../../../../services/carApi'
import './car_list_page.css'
import { formatVND } from '../../../../utils/currency'
import SearchModal from '../../../../components/SearchModal.jsx'

export default function CarListPage(){
  const [cars, setCars] = useState([])
  const [filteredCars, setFilteredCars] = useState([])
  const [loading, setLoading] = useState(true)
  const [stations, setStations] = useState([])
  const [filters, setFilters] = useState({
    brand: '',
    color: '',
    seats: '',
    year: '',
    priceMin: '',
    priceMax: ''
  })
  const [sortBy, setSortBy] = useState('default') // default, name-asc, name-desc, price-asc, price-desc

  // Search state - simplified to use SearchModal component
  const [searchData, setSearchData] = useState(() => {
    const today = new Date()
    const tomorrow = new Date(today.getTime() + 24*60*60*1000)
    return {
      location: '',
      locationName: 'Select location',
      pickupDate: today.toISOString().split('T')[0],
      pickupTime: '07:00',
      returnDate: tomorrow.toISOString().split('T')[0],
      returnTime: '24:00'
    }
  })
  const [searchModalOpen, setSearchModalOpen] = useState(false)
  const [userLocation, setUserLocation] = useState(null)

  useEffect(()=>{
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.error('❌ Could not get user location:', error.message)
          // Default to Ho Chi Minh City center
          setUserLocation({ lat: 10.8231, lng: 106.6297 })
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      )
    } else {
      setUserLocation({ lat: 10.8231, lng: 106.6297 })
    }

    loadStations()
    loadData()
  },[])

  const loadStations = async ()=>{
    try{
      const list = await stationApi.getAllStations(1, 500)
      setStations(list || [])
    }catch(e){ console.error('Failed to load stations', e) }
  }

  const loadData = async ()=>{
    try{
      setLoading(true)
      
      let selectedStationId = null
      let rentalContext = null
      
      // Try to use saved rentalContext (set by HomePage.submitSearch)
      try{
        const rc = JSON.parse(localStorage.getItem('rentalContext') || 'null')
        if(rc){
          selectedStationId = rc.stationId
          rentalContext = rc
          setSearchData(prev => ({
            ...prev,
            location: rc.stationId,
            locationName: rc.stationName,
            pickupDate: rc.pickupDate,
            pickupTime: rc.pickupTime,
            returnDate: rc.returnDate,
            returnTime: rc.returnTime
          }))
        }
      }catch(e){}

      // Load cars by station if available, otherwise load all cars
      let carsList = []
      if(selectedStationId && rentalContext){
        console.log('🔍 Loading cars for station:', selectedStationId)
        try{
          // Combine pickup date and time into datetime string without timezone conversion
          // Format: YYYY-MM-DDTHH:mm:ss (local time, not UTC)
          const pickupDateTime = `${rentalContext.pickupDate}T${rentalContext.pickupTime}:00`
          const returnDateTime = `${rentalContext.returnDate}T${rentalContext.returnTime}:00`
          
          console.log('📅 Pickup DateTime (local):', pickupDateTime)
          console.log('📅 Return DateTime (local):', returnDateTime)
          
          carsList = await carApi.getAvailableCarsByStation(selectedStationId, pickupDateTime, returnDateTime)
          console.log('✅ Found', carsList.length, 'cars at this station')
        }catch(err){
          console.error('Failed to load cars by station, falling back to all cars', err)
          carsList = await carApi.getAllCars(1, 100)
        }
      } else {
        carsList = await carApi.getAllCars(1, 100)
      }
      
      setCars(carsList || [])
      setFilteredCars(carsList || [])
    }catch(e){ 
      console.error(e) 
    }finally{ 
      setLoading(false) 
    }
  }

  // Search modal handlers
  function openSearchModal(){ 
    setSearchModalOpen(true)
  }
  
  function closeSearchModal(){ 
    setSearchModalOpen(false)
  }

  function handleSearch(newSearchData){
    // Update search data state
    setSearchData({
      location: newSearchData.location,
      locationName: newSearchData.locationName,
      pickupDate: newSearchData.pickupDate,
      pickupTime: newSearchData.pickupTime,
      returnDate: newSearchData.returnDate,
      returnTime: newSearchData.returnTime
    })

    // Save to localStorage
    const rentalContext = {
      stationId: newSearchData.location,
      stationName: newSearchData.locationName,
      pickupDate: newSearchData.pickupDate,
      pickupTime: newSearchData.pickupTime,
      returnDate: newSearchData.returnDate,
      returnTime: newSearchData.returnTime,
      createdAt: new Date().toISOString()
    }
    try{ localStorage.setItem('rentalContext', JSON.stringify(rentalContext)) }catch(e){}
    
    // Fetch cars available at the selected station
    setLoading(true)
    
    // Combine pickup date and time into datetime string without timezone conversion
    // Format: YYYY-MM-DDTHH:mm:ss (local time, not UTC)
    const pickupDateTime = `${newSearchData.pickupDate}T${newSearchData.pickupTime}:00`
    const returnDateTime = `${newSearchData.returnDate}T${newSearchData.returnTime}:00`
    
    console.log('📅 Pickup DateTime (local):', pickupDateTime)
    console.log('📅 Return DateTime (local):', returnDateTime)
    
    carApi.getAvailableCarsByStation(newSearchData.location, pickupDateTime, returnDateTime)
      .then(carsList => {
        setCars(carsList || [])
        setFilteredCars(carsList || [])
        setLoading(false)
        closeSearchModal()
      })
      .catch(err => {
        console.error('Failed to load station cars:', err)
        alert('Failed to load cars for this station')
        setLoading(false)
      })
  }

  // Auto-apply filters and sorting whenever cars, filters, or sortBy change
  useEffect(() => {
    let result = [...cars]
    
    // Apply filters
    if(filters.brand) result = result.filter(c => (c.brand||'').toLowerCase().includes(filters.brand.toLowerCase()))
    if(filters.color) result = result.filter(c => (c.color||'').toLowerCase().includes(filters.color.toLowerCase()))
    if(filters.seats) result = result.filter(c => c.seats === parseInt(filters.seats))
    if(filters.year) result = result.filter(c => c.year >= parseInt(filters.year))
    if(filters.priceMin) result = result.filter(c => parseFloat(c.rentalPricePerHour||0) >= parseFloat(filters.priceMin))
    if(filters.priceMax) result = result.filter(c => parseFloat(c.rentalPricePerHour||0) <= parseFloat(filters.priceMax))
    
    // Apply sorting
    if(sortBy === 'name-asc') {
      result.sort((a, b) => {
        const nameA = `${a.brand || ''} ${a.model || ''}`.trim().toLowerCase()
        const nameB = `${b.brand || ''} ${b.model || ''}`.trim().toLowerCase()
        return nameA.localeCompare(nameB)
      })
    } else if(sortBy === 'name-desc') {
      result.sort((a, b) => {
        const nameA = `${a.brand || ''} ${a.model || ''}`.trim().toLowerCase()
        const nameB = `${b.brand || ''} ${b.model || ''}`.trim().toLowerCase()
        return nameB.localeCompare(nameA)
      })
    } else if(sortBy === 'price-asc') {
      result.sort((a, b) => {
        const priceA = parseFloat(a.rentalPricePerHour || a.RentalPricePerHour || 0)
        const priceB = parseFloat(b.rentalPricePerHour || b.RentalPricePerHour || 0)
        return priceA - priceB
      })
    } else if(sortBy === 'price-desc') {
      result.sort((a, b) => {
        const priceA = parseFloat(a.rentalPricePerHour || a.RentalPricePerHour || 0)
        const priceB = parseFloat(b.rentalPricePerHour || b.RentalPricePerHour || 0)
        return priceB - priceA
      })
    }
    
    setFilteredCars(result)
  }, [cars, filters, sortBy])

  const resetFilters = ()=>{
    setFilters({brand:'',color:'',seats:'',year:'',priceMin:'',priceMax:''})
    setFilteredCars(cars)
  }

  const uniqueBrands = [...new Set(cars.map(c => c.brand).filter(Boolean))]
  const uniqueColors = [...new Set(cars.map(c => c.color).filter(Boolean))]
  const timeOptions = Array.from({ length: 18 }, (_,i)=> `${(6+i).toString().padStart(2,'0')}:00`)

  return (
    <main className="car-list-main">
      {/* Search Summary Bar - TOP LEVEL */}
      <div className="search-form-container">
        <div className="search-summary">
          <div className="summary-item" onClick={openSearchModal}>
            <div className="summary-label"><i className="fas fa-map-marker-alt"></i> Pick-up Location</div>
            <div className="summary-value">{searchData.locationName}</div>
          </div>
          <div className="summary-item" onClick={openSearchModal}>
            <div className="summary-label"><i className="fas fa-calendar"></i> Pick-up Date</div>
            <div className="summary-value">{new Date(searchData.pickupDate).toLocaleDateString()}</div>
          </div>
          <div className="summary-item" onClick={openSearchModal}>
            <div className="summary-label"><i className="fas fa-clock"></i> Pick-up Time</div>
            <div className="summary-value">{searchData.pickupTime}</div>
          </div>
          <div className="summary-item" onClick={openSearchModal}>
            <div className="summary-label"><i className="fas fa-calendar-check"></i> Return Date</div>
            <div className="summary-value">{new Date(searchData.returnDate).toLocaleDateString()}</div>
          </div>
          <div className="summary-item" onClick={openSearchModal}>
            <div className="summary-label"><i className="fas fa-clock"></i> Return Time</div>
            <div className="summary-value">{searchData.returnTime}</div>
          </div>
          <button className="btn-search-submit" onClick={openSearchModal}>
            <i className="fas fa-search"></i> Search Cars
          </button>
        </div>
      </div>

      <div className="container">
        {/* LEFT SIDEBAR - FILTERS */}
        <aside className="filters-sidebar">
          <h3 className="filters-title">Filters</h3>
          
          <div className="filter-section">
            <h4>Brand</h4>
            <div className="filter-group">
              <select value={filters.brand} onChange={e => setFilters({...filters, brand:e.target.value})}>
                <option value="">Any Brand</option>
                {uniqueBrands.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>

          <div className="filter-section">
            <h4>Color</h4>
            <div className="filter-group">
              <select value={filters.color} onChange={e => setFilters({...filters, color:e.target.value})}>
                <option value="">Any Color</option>
                {uniqueColors.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="filter-section">
            <h4>Specifications</h4>
            <div className="filter-group">
              <label>Seats</label>
              <select value={filters.seats} onChange={e => setFilters({...filters, seats:e.target.value})}>
                <option value="">Any</option>
                <option value="2">2</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="7">7</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Year (min)</label>
              <input type="number" min="1900" max="2100" placeholder="2020" value={filters.year} onChange={e => setFilters({...filters, year:e.target.value})} />
            </div>
          </div>

          <div className="filter-section">
            <h4>Price Range</h4>
            <div className="filter-group">
              <label>Min Price (VND/hour)</label>
              <input type="number" min="0" placeholder="0" value={filters.priceMin} onChange={e => setFilters({...filters, priceMin:e.target.value})} />
            </div>
            <div className="filter-group">
              <label>Max Price (VND/hour)</label>
              <input type="number" min="0" placeholder="999,000" value={filters.priceMax} onChange={e => setFilters({...filters, priceMax:e.target.value})} />
            </div>
          </div>

          <div className="filter-actions">
            <button type="button" className="btn-reset-filters" onClick={resetFilters}>Reset Filters</button>
          </div>
        </aside>

        {/* RIGHT CONTENT - CARS */}
        <div className="cars-content">
          {/* Cars Header */}
          <div className="cars-header">
            <div>
              <h2>Available Cars</h2>
              <div className="cars-count">Showing {filteredCars.length} cars</div>
            </div>
            <div className="sort-controls">
              <label htmlFor="sortBy">Sort by:</label>
              <select 
                id="sortBy"
                value={sortBy} 
                onChange={e => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="default">Default</option>
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="price-asc">Price (Low to High)</option>
                <option value="price-desc">Price (High to Low)</option>
              </select>
            </div>
          </div>

          {/* Car List */}
          <div className="car-list">
          {loading && <div style={{textAlign:'center',padding:'2rem'}}>Loading cars...</div>}
          {!loading && filteredCars.length === 0 && <div style={{textAlign:'center',padding:'2rem'}}>No cars found</div>}
          {!loading && filteredCars.map((car, idx)=>{
            const id = car.id || car.Id
            const name = `${car.brand || ''} ${car.model || 'Car'}`.trim()
            const img = car.imageUrl || car.image || '/Picture/E car 1.jpg'
            const price = parseFloat(car.rentalPricePerHour || car.RentalPricePerHour || 0)
            const seats = car.seats || car.Seats || 5
            const year = car.year || ''
            const color = car.color || 'N/A'
            
            return (
              <div className="car-card" key={idx} onClick={()=> window.location.href = `/cars/${id}`}>
                <div className="car-image">
                  <img src={img} alt={name} onError={e=> e.currentTarget.src='/Picture/E car 1.jpg'} />
                </div>
                <div className="car-info">
                  <div className="car-info-top">
                    <div>
                      <div className="car-name">{name}</div>
                      <div className="car-location">
                        <i className="fas fa-map-marker-alt"></i>
                        {searchData.locationName || 'Location'}
                      </div>
                    </div>
                    <div className="car-pricing">
                      <div className="car-price">{formatVND(price)}</div>
                      <div className="car-price-label">/hour</div>
                    </div>
                  </div>
                  <div className="car-details">
                    <span><i className="fas fa-palette"></i> {color}</span>
                    <span><i className="fas fa-calendar"></i> {year || 'N/A'}</span>
                    <span><i className="fas fa-users"></i> {seats} seats</span>
                  </div>
                </div>
              </div>
            )
          })}
          </div>
        </div> {/* End cars-content */}
      </div> {/* End container */}

      {/* Search Modal Component */}
      <SearchModal 
        isOpen={searchModalOpen}
        onClose={closeSearchModal}
        stations={stations}
        userLocation={userLocation}
        onSearch={handleSearch}
        currentSearchData={searchData}
      />
    </main>
  )
}
