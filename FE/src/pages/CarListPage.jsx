import React, { useEffect, useState, useRef } from 'react'
import API from '../services/api'
import '../styles/car_list_page.css'

export default function CarListPage(){
  const [cars, setCars] = useState([])
  const [filteredCars, setFilteredCars] = useState([])
  const [loading, setLoading] = useState(true)
  const [stations, setStations] = useState([])
  const [showLocationDropdown, setShowLocationDropdown] = useState(false)
  const [filters, setFilters] = useState({
    brand: '',
    color: '',
    seats: '',
    year: '',
    priceMin: '',
    priceMax: ''
  })

  // Search form state (copied from HomePage)
  const [searchData, setSearchData] = useState(() => {
    const today = new Date()
    const tomorrow = new Date(today.getTime() + 24*60*60*1000)
    return {
      location: '',
      locationName: 'Select location',
      pickupDate: today.toISOString().split('T')[0],
      pickupTime: '15:00',
      returnDate: tomorrow.toISOString().split('T')[0],
      returnTime: '19:00',
      calendarMode: null,
      currentMonth: today.getMonth(),
      currentYear: today.getFullYear()
    }
  })
  const [rentalDurationText, setRentalDurationText] = useState('')
  const [searchModalOpen, setSearchModalOpen] = useState(false)

  useEffect(()=>{
    loadStations()
    loadData()
  },[])

  const loadStations = async ()=>{
    try{
      const list = await API.getAllStations(1, 500)
      setStations(list || [])
    }catch(e){ console.error('Failed to load stations', e) }
  }

  const loadData = async ()=>{
    try{
      setLoading(true)
      
      let selectedStationId = null
      
      // Try to use saved rentalContext (set by HomePage.submitSearch)
      try{
        const rc = JSON.parse(localStorage.getItem('rentalContext') || 'null')
        if(rc){
          selectedStationId = rc.stationId
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
      if(selectedStationId){
        console.log('🔍 Loading cars for station:', selectedStationId)
        try{
          carsList = await API.getAvailableCarsByStation(selectedStationId)
          console.log('✅ Found', carsList.length, 'cars at this station')
        }catch(err){
          console.error('Failed to load cars by station, falling back to all cars', err)
          carsList = await API.getAllCars(1, 100)
        }
      } else {
        carsList = await API.getAllCars(1, 100)
      }
      
      setCars(carsList || [])
      setFilteredCars(carsList || [])
    }catch(e){ 
      console.error(e) 
    }finally{ 
      setLoading(false) 
    }
  }

  // Search form functions (copied from HomePage)
  function toggleLocation(id, name){
    setSearchData(d => ({ ...d, location: id, locationName: name }))
    setShowLocationDropdown(false)
  }

  function selectTime(type, time){
    setSearchData(d => ({ ...d, [type+'Time']: time }))
    updateRentalDuration()
  }

  function toggleCalendar(mode){
    setSearchData(d => ({ ...d, calendarMode: d.calendarMode === mode ? null : mode }))
  }

  function toggleTimePicker(type){
    const mode = `${type}-time`
    setSearchData(d => ({ ...d, calendarMode: d.calendarMode === mode ? null : mode }))
  }

  function changeMonth(delta){
    setSearchData(d => {
      let m = d.currentMonth + delta
      let y = d.currentYear
      if(m > 11){ m = 0; y++ }
      if(m < 0){ m = 11; y-- }
      return { ...d, currentMonth: m, currentYear: y }
    })
  }

  function selectDate(dateStr){
    setSearchData(d => {
      const updated = { ...d }
      if(d.calendarMode === 'pickup'){
        updated.pickupDate = dateStr
        const pickup = new Date(`${dateStr}T${d.pickupTime}`)
        const returnDt = new Date(`${d.returnDate}T${d.returnTime}`)
        if(returnDt <= pickup){
          updated.returnDate = dateStr
          const pickupHour = parseInt(d.pickupTime.split(':')[0])
          const newReturnHour = Math.min(pickupHour + 2, 23)
          updated.returnTime = `${newReturnHour.toString().padStart(2,'0')}:00`
        }
      } else {
        updated.returnDate = dateStr
      }
      updated.calendarMode = null
      updateRentalDuration(updated)
      return updated
    })
  }

  function updateRentalDuration(override){
    const d = override || searchData
    try{
      const pickup = new Date(`${d.pickupDate}T${d.pickupTime}`)
      const ret = new Date(`${d.returnDate}T${d.returnTime}`)
      const diffMs = ret - pickup
      const diffHours = Math.floor(diffMs / (1000*60*60))
      if(diffHours < 0) return setRentalDurationText('Invalid duration')
      if(diffHours === 0) return setRentalDurationText('Less than 1 hour')
      const days = Math.floor(diffHours / 24)
      const hours = diffHours % 24
      let txt = ''
      if(days > 0) txt += `${days} day${days>1? 's':''} `
      if(hours > 0) txt += `${hours} hour${hours>1? 's':''}`
      setRentalDurationText(txt.trim() || '0 hours')
    }catch(e){ setRentalDurationText('') }
  }

  function openSearchModal(){ 
    setSearchModalOpen(true)
    updateRentalDuration() 
  }
  
  function closeSearchModal(){ 
    setSearchModalOpen(false)
    setShowLocationDropdown(false)
    setSearchData(d => ({ ...d, calendarMode: null }))
  }

  function submitSearch(){
    if(!searchData.location){ alert('Please select a pick-up location'); return }
    const pickup = new Date(`${searchData.pickupDate}T${searchData.pickupTime}`)
    const ret = new Date(`${searchData.returnDate}T${searchData.returnTime}`)
    if(ret <= pickup){ alert('Return date and time must be after pick-up date and time.'); return }
    const diffHours = (ret - pickup) / (1000*60*60)
    if(diffHours < 1){ alert('Minimum rental duration is 1 hour.'); return }
    
    const rentalContext = {
      stationId: searchData.location,
      stationName: searchData.locationName,
      pickupDate: searchData.pickupDate,
      pickupTime: searchData.pickupTime,
      returnDate: searchData.returnDate,
      returnTime: searchData.returnTime,
      createdAt: new Date().toISOString()
    }
    try{ localStorage.setItem('rentalContext', JSON.stringify(rentalContext)) }catch(e){}
    
    // Fetch cars available at the selected station
    setLoading(true)
    API.getAvailableCarsByStation(searchData.location)
      .then(carsList => {
        setCars(carsList || [])
        setFilteredCars(carsList || [])
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load station cars:', err)
        alert('Failed to load cars for this station')
        setLoading(false)
      })
  }

  function renderCalendar(){
    const firstDay = new Date(searchData.currentYear, searchData.currentMonth, 1)
    const lastDay = new Date(searchData.currentYear, searchData.currentMonth + 1, 0)
    const today = new Date(); today.setHours(0,0,0,0)
    const cells = []
    for(let i=0;i<firstDay.getDay();i++) cells.push(<div key={`empty-${i}`} className="calendar-day"></div>)
    for(let day=1; day<= lastDay.getDate(); day++){
      const dateStr = `${searchData.currentYear}-${(searchData.currentMonth+1).toString().padStart(2,'0')}-${day.toString().padStart(2,'0')}`
      const dateObj = new Date(searchData.currentYear, searchData.currentMonth, day)
      const isToday = dateObj.toDateString() === today.toDateString()
      const isPast = dateObj < today
      const isSelected = dateStr === (searchData.calendarMode === 'pickup' ? searchData.pickupDate : searchData.returnDate)
      const classes = ['calendar-day']
      if(isPast) classes.push('disabled')
      if(isToday) classes.push('today')
      if(isSelected) classes.push('selected')
      cells.push(
        <div key={dateStr} className={classes.join(' ')} onClick={()=>{ if(!isPast) selectDate(dateStr) }}>{day}</div>
      )
    }
    return cells
  }

  const applyFilters = ()=>{
    let result = [...cars]
    if(filters.brand) result = result.filter(c => (c.brand||'').toLowerCase().includes(filters.brand.toLowerCase()))
    if(filters.color) result = result.filter(c => (c.color||'').toLowerCase().includes(filters.color.toLowerCase()))
    if(filters.seats) result = result.filter(c => c.seats === parseInt(filters.seats))
    if(filters.year) result = result.filter(c => c.year >= parseInt(filters.year))
    if(filters.priceMin) result = result.filter(c => parseFloat(c.rentalPricePerHour||0) >= parseFloat(filters.priceMin))
    if(filters.priceMax) result = result.filter(c => parseFloat(c.rentalPricePerHour||0) <= parseFloat(filters.priceMax))
    setFilteredCars(result)
  }

  const resetFilters = ()=>{
    setFilters({brand:'',color:'',seats:'',year:'',priceMin:'',priceMax:''})
    setFilteredCars(cars)
  }

  const uniqueBrands = [...new Set(cars.map(c => c.brand).filter(Boolean))]
  const uniqueColors = [...new Set(cars.map(c => c.color).filter(Boolean))]
  const timeOptions = Array.from({ length: 18 }, (_,i)=> `${(6+i).toString().padStart(2,'0')}:00`)

  return (
    <main className="car-list-main">
      <div className="container">
        {/* Search Summary Bar */}
        <div className="search-form" style={{marginBottom:'2rem'}}>
          <h2>Find Your Perfect Rental Car</h2>

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

        {/* Search Modal */}
        <div className={`search-modal ${searchModalOpen ? 'active' : ''}`} style={{ display: searchModalOpen ? 'block' : 'none' }} onClick={closeSearchModal}>
          <div className="search-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="search-modal-header">
              <h3>Search Cars</h3>
              <button className="search-modal-close" onClick={closeSearchModal}>&times;</button>
            </div>
            <div className="search-modal-body">
              <div className="search-field">
                <label><i className="fas fa-map-marker-alt"></i> Pick-up Location</label>
                <div className="search-input" onClick={()=> setShowLocationDropdown(!showLocationDropdown)}>
                  <i className="fas fa-map-marker-alt"></i>
                  <span>{searchData.locationName}</span>
                </div>
                <div className={`location-dropdown ${showLocationDropdown ? 'active':''}`}>
                  {stations.length === 0 && <div style={{ padding: 12, color: '#999' }}>No locations available</div>}
                  {stations.map((s, i)=>{
                    const name = s.stationName || s.name || 'Unknown'
                    const id = s.id || s.Id || s.stationId || i
                    return <div key={id} className="location-option" onClick={()=>{ toggleLocation(id, name); }}>{name}</div>
                  })}
                </div>
              </div>
              <div className="search-field-row">
                <div className="search-field">
                  <label><i className="fas fa-calendar"></i> Pick-up Date</label>
                  <div className="search-input" onClick={()=> toggleCalendar('pickup')}>
                    <i className="fas fa-calendar"></i>
                    <span>{new Date(searchData.pickupDate).toLocaleDateString()}</span>
                  </div>
                  {searchData.calendarMode === 'pickup' && (
                    <div className="calendar-dropdown active">
                      <div className="calendar-header">
                        <button onClick={()=> changeMonth(-1)}>&lt;</button>
                        <span>{new Date(searchData.currentYear, searchData.currentMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                        <button onClick={()=> changeMonth(1)}>&gt;</button>
                      </div>
                      <div className="calendar-weekdays">
                        <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
                      </div>
                      <div className="calendar-days">
                        {renderCalendar()}
                      </div>
                    </div>
                  )}
                </div>
                <div className="search-field">
                  <label><i className="fas fa-clock"></i> Pick-up Time</label>
                  <div className="search-input" onClick={()=> toggleTimePicker('pickup')}>
                    <i className="fas fa-clock"></i>
                    <span>{searchData.pickupTime}</span>
                  </div>
                  <div className={`time-picker-dropdown ${searchData.calendarMode === 'pickup-time' ? 'active' : ''}`}>
                    <div className="time-picker-label">Choose pick-up time</div>
                    <div className="time-picker-options">
                      {timeOptions.map(t=> <div key={t} className={`time-option ${t===searchData.pickupTime? 'selected':''}`} onClick={()=> selectTime('pickup', t)}>{t}</div>)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="search-field-row">
                <div className="search-field">
                  <label><i className="fas fa-calendar-check"></i> Return Date</label>
                  <div className="search-input" onClick={()=> toggleCalendar('return')}>
                    <i className="fas fa-calendar-check"></i>
                    <span>{new Date(searchData.returnDate).toLocaleDateString()}</span>
                  </div>
                  {searchData.calendarMode === 'return' && (
                    <div className="calendar-dropdown active">
                      <div className="calendar-header">
                        <button onClick={()=> changeMonth(-1)}>&lt;</button>
                        <span>{new Date(searchData.currentYear, searchData.currentMonth).toLocaleString('default', { month: 'numeric' })}</span>
                        <button onClick={()=> changeMonth(1)}>&gt;</button>
                      </div>
                      <div className="calendar-weekdays">
                        <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
                      </div>
                      <div className="calendar-days">
                        {renderCalendar()}
                      </div>
                    </div>
                  )}
                </div>
                <div className="search-field">
                  <label><i className="fas fa-clock"></i> Return Time</label>
                  <div className="search-input" onClick={()=> toggleTimePicker('return')}>
                    <i className="fas fa-clock"></i>
                    <span>{searchData.returnTime}</span>
                  </div>
                  <div className={`time-picker-dropdown ${searchData.calendarMode === 'return-time' ? 'active' : ''}`}>
                    <div className="time-picker-label">Choose return time</div>
                    <div className="time-picker-options">
                      {timeOptions.map(t=> <div key={t} className={`time-option ${t===searchData.returnTime? 'selected':''}`} onClick={()=> selectTime('return', t)}>{t}</div>)}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="rental-duration">
                <i className="fas fa-info-circle"></i>
                <div>
                  <strong>Rental Duration</strong>
                  <p>{rentalDurationText}</p>
                </div>
              </div>
            </div>

            <div className="search-modal-footer">
              <button className="btn-search-submit" onClick={()=>{ submitSearch(); closeSearchModal(); }}>
                <i className="fas fa-search"></i> Search Cars
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="filter-section">
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'1rem'}}>
            <h3>Filters</h3>
            <div style={{display:'flex',gap:'.5rem',alignItems:'center'}}>
              <small style={{color:'#666'}}>Showing {filteredCars.length} cars</small>
              <button type="button" className="btn-apply-filters" style={{background:'#eee',color:'#333',padding:'.4rem .8rem',borderRadius:'6px'}} onClick={resetFilters}>Reset</button>
              <button type="button" className="btn-apply-filters" onClick={applyFilters}>Apply Filters</button>
            </div>
          </div>
          <form style={{marginTop:'12px',display:'flex',gap:'12px',alignItems:'flex-end',flexWrap:'wrap'}}>
            <div className="filter-group" style={{flex:1,minWidth:'150px'}}>
              <label>Brand</label>
              <select value={filters.brand} onChange={e => setFilters({...filters, brand:e.target.value})}>
                <option value="">Any Brand</option>
                {uniqueBrands.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="filter-group" style={{flex:1,minWidth:'120px'}}>
              <label>Color</label>
              <select value={filters.color} onChange={e => setFilters({...filters, color:e.target.value})}>
                <option value="">Any Color</option>
                {uniqueColors.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="filter-group" style={{width:'100px'}}>
              <label>Seats</label>
              <select value={filters.seats} onChange={e => setFilters({...filters, seats:e.target.value})}>
                <option value="">Any</option>
                <option value="2">2</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="7">7</option>
              </select>
            </div>
            <div className="filter-group" style={{width:'120px'}}>
              <label>Year (min)</label>
              <input type="number" min="1900" max="2100" placeholder="2020" value={filters.year} onChange={e => setFilters({...filters, year:e.target.value})} />
            </div>
            <div className="filter-group" style={{width:'130px'}}>
              <label>Price min</label>
              <input type="number" min="0" placeholder="0" value={filters.priceMin} onChange={e => setFilters({...filters, priceMin:e.target.value})} />
            </div>
            <div className="filter-group" style={{width:'130px'}}>
              <label>Price max</label>
              <input type="number" min="0" placeholder="999" value={filters.priceMax} onChange={e => setFilters({...filters, priceMax:e.target.value})} />
            </div>
          </form>
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
                  <div className="car-name">{name} {year}</div>
                  <div className="car-location">{searchData.locationName || 'Location'}</div>
                  <div className="car-pricing">
                    <div className="car-price">{price}K/hour</div>
                  </div>
                  <div className="car-details">
                    <span>Color: {color}</span>
                    <span>Year: {year}</span>
                    <span>Seats: {seats}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
