import React, { useEffect, useState, useRef } from 'react'
import API from '../../../services/userApi.js'
import { formatVND } from '../../../../utils/currency.js'
import { useToast } from '../../../../components/ToastProvider.jsx'
import './home_page.css'

export default function HomePage(){
  const [stations, setStations] = useState([])
  const [cars, setCars] = useState([])
  const [loadingCars, setLoadingCars] = useState(true)
  const [carouselIndex, setCarouselIndex] = useState(0)
  const carInnerRef = useRef(null)
  const [showLocationDropdown, setShowLocationDropdown] = useState(false)

  // Slideshow state
  const [slideIndex, setSlideIndex] = useState(0)
  const slides = ['/Picture/E car 1.jpg', '/Picture/E car 3.png', '/Picture/E car 2.png']

  // Search modal state
  const [searchOpen, setSearchOpen] = useState(false)
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

  const overlayRef = useRef(null)
  const { showToast } = useToast()

  useEffect(()=>{
    // load stations and cars
    const loadStations = async ()=>{
      try{
        if(!API.getAllStations) {
          console.warn('API.getAllStations not available')
          return
        }
        // API.getAllStations already returns an array directly
        const list = await API.getAllStations(1, 500)
        console.log('🏢 Loaded stations in HomePage:', list.length, 'items')
        setStations(list || [])
      }catch(e){ console.error('Failed to load stations', e) }
    }

    const loadCars = async ()=>{
      try{
        if(!API.getAllCars) {
          console.warn('API.getAllCars not available')
          setLoadingCars(false)
          return
        }
        setLoadingCars(true)
        // API.getAllCars already returns an array directly
        const list = await API.getAllCars(1, 100)
        console.log('🚗 Loaded cars in HomePage:', list.length, 'items')
        setCars(list || [])
      }catch(e){ console.error('Failed to load cars', e) }
      finally{ setLoadingCars(false) }
    }

    loadStations(); loadCars();
  },[])

  // Hero slideshow autoplay (looping). Pauses while the search modal is open.
  useEffect(()=>{
    if(searchOpen) return // pause while search modal is open
    const id = setInterval(()=>{
      setSlideIndex(i => (i + 1) % slides.length)
    }, 6000)
    return ()=> clearInterval(id)
  }, [slides.length, searchOpen])

  // Car carousel autoplay disabled; user will navigate with prev/next buttons.

  useEffect(()=>{
    // apply transform
    const el = carInnerRef.current
    if(!el) return
    const firstCard = el.querySelector('.car-card-item')
    if(!firstCard) return
    const cardWidth = firstCard.offsetWidth
    const gap = 20
    const transformAmount = carouselIndex * (cardWidth + gap)
    el.style.transform = `translateX(-${transformAmount}px)`
  },[carouselIndex, cars])

  // Sticky overlay behavior
  useEffect(()=>{
    const handleScroll = ()=>{
      const overlay = overlayRef.current
      if(!overlay) return
      const header = document.querySelector('.header')
      const headerHeight = header ? header.offsetHeight : 80
      const shouldSticky = window.scrollY > headerHeight + 50
      // Toggle sticky class and set inline top so the fixed overlay sits below the header
      if(shouldSticky){
        overlay.classList.add('sticky')
        // set top to header height so it does not hide behind the header
        overlay.style.top = `${headerHeight}px`
      } else {
        overlay.classList.remove('sticky')
        // reset top to allow absolute positioning inside hero
        overlay.style.top = ''
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return ()=> window.removeEventListener('scroll', handleScroll)
  },[])

  // Search modal helpers
  function openSearchModal(){ setSearchOpen(true); updateRentalDuration() }
  function closeSearchModal(){ setSearchOpen(false) }

  function toggleLocation(id, name){
    setSearchData(d => ({ ...d, location: id, locationName: name }))
    setShowLocationDropdown(false) // Close dropdown after selection
  }

  function selectTime(type, time){
    // Update state and compute rental duration using the new state immediately
    setSearchData(d => {
      const next = { ...d, [type+'Time']: time }
      updateRentalDuration(next)
      return next
    })
  }

  // Advance carousel safely (limited to number of cards)
  function nextCarousel(){
    const el = carInnerRef.current
    if(!el) return
    const firstCard = el.querySelector('.car-card-item')
    if(!firstCard) return
    const visible = Math.floor(el.parentElement.offsetWidth / (firstCard.offsetWidth + 20)) || 1
    const total = Math.min(cars.length, 10)
    const maxIndex = Math.max(0, Math.ceil(total - visible))
    setCarouselIndex(i => Math.min(maxIndex, i + 1))
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
        // adjust return if before pickup
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
    const params = new URLSearchParams({ location: searchData.location, 'pickup-date': searchData.pickupDate, 'pickup-time': searchData.pickupTime, 'return-date': searchData.returnDate, 'return-time': searchData.returnTime })
    window.location.href = `/cars?${params.toString()}`
  }

  // Helper to render calendar days
  function renderCalendar(){
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December']
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

  // Time options
  const timeOptions = Array.from({ length: 18 }, (_,i)=> `${(6+i).toString().padStart(2,'0')}:00`)

  return (
    <main>
      <section className="hero-slideshow">
        <div className="slideshow-container">
          {slides.map((img, idx)=> (
            <div key={idx} className={`slide fade ${idx === slideIndex ? 'active' : ''}`}>
              <img src={img} alt={`Electric Car ${idx + 1}`} />
            </div>
          ))}
        </div>

        <div className="search-form-overlay" id="searchFormOverlay" ref={overlayRef}>
          <div className="container">
            <div className="search-form-wrapper">
              <h2>Find Your Perfect Rental Car</h2>
              <div className="search-summary">
                <div className="summary-item" onClick={openSearchModal}>
                  <div className="summary-label">Pick-up Location</div>
                  <div className="summary-value" id="summaryLocation">{searchData.locationName}</div>
                </div>
                <div className="summary-item" onClick={openSearchModal}>
                  <div className="summary-label">Pick-up Date</div>
                  <div className="summary-value">{new Date(searchData.pickupDate).toLocaleDateString()}</div>
                </div>
                <div className="summary-item" onClick={openSearchModal}>
                  <div className="summary-label">Pick-up Time</div>
                  <div className="summary-value">{searchData.pickupTime}</div>
                </div>
                <div className="summary-item" onClick={openSearchModal}>
                  <div className="summary-label">Return Date</div>
                  <div className="summary-value">{new Date(searchData.returnDate).toLocaleDateString()}</div>
                </div>
                <div className="summary-item" onClick={openSearchModal}>
                  <div className="summary-label">Return Time</div>
                  <div className="summary-value">{searchData.returnTime}</div>
                </div>
                <button
                  type="button"
                  className="btn-search"
                  onClick={() => {
                    // If a pick-up location is selected, run the search.
                    // Otherwise show a clear prompt asking the user to choose a location.
                    if (searchData.location) {
                      submitSearch()
                    } else {
                      // Use toast to show a non-blocking, friendly message
                      // anchor the toast to the pick-up location element for clarity
                      const anchorEl = document.getElementById('summaryLocation')
                      showToast('Please select a pick-up location before searching.', 'error', 3500, anchorEl)
                    }
                  }}
                ><i className="fas fa-search"></i> SEARCH</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className={`search-modal ${searchOpen ? 'active' : ''}`} id="searchModal" style={{ display: searchOpen ? 'block' : 'none' }}>
        <div className="search-modal-content">
          <div className="search-modal-header">
            <h3>Search Cars</h3>
            <button className="search-modal-close" onClick={closeSearchModal}>&times;</button>
          </div>
          <div className="search-modal-body">
            <div className="search-field">
              <label><i className="fas fa-map-marker-alt"></i> Pick-up Location</label>
              <div className="search-input" onClick={()=> setShowLocationDropdown(!showLocationDropdown)}>
                <i className="fas fa-map-marker-alt"></i>
                <span id="selectedLocation">{searchData.locationName}</span>
              </div>
              <div className={`location-dropdown ${showLocationDropdown ? 'active':''}`} id="locationDropdown">
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
                  <span id="selectedPickupDate">{new Date(searchData.pickupDate).toLocaleDateString()}</span>
                </div>
                {/* Calendar dropdown for pickup date */}
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
                <div className={`time-picker-dropdown ${searchData.calendarMode === 'pickup-time' ? 'active' : ''}`} id="pickupTimePicker">
                  <div className="time-picker-label">Choose pick-up time</div>
                  <div className="time-picker-options">
                    {timeOptions.map(t=> <div key={t} className={`time-option ${t===searchData.pickupTime? 'selected':''}`} data-time={t} onClick={()=> selectTime('pickup', t)}>{t}</div>)}
                  </div>
                </div>
              </div>
            </div>

            <div className="search-field-row">
              <div className="search-field">
                <label><i className="fas fa-calendar-check"></i> Return Date</label>
                <div className="search-input" onClick={()=> toggleCalendar('return')}>
                  <i className="fas fa-calendar-check"></i>
                  <span id="selectedReturnDate">{new Date(searchData.returnDate).toLocaleDateString()}</span>
                </div>
                {/* Calendar dropdown for return date */}
                {searchData.calendarMode === 'return' && (
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
                <label><i className="fas fa-clock"></i> Return Time</label>
                <div className="search-input" onClick={()=> toggleTimePicker('return')}>
                  <i className="fas fa-clock"></i>
                  <span>{searchData.returnTime}</span>
                </div>
                <div className={`time-picker-dropdown ${searchData.calendarMode === 'return-time' ? 'active' : ''}`} id="returnTimePicker">
                  <div className="time-picker-label">Choose return time</div>
                  <div className="time-picker-options">
                    {timeOptions.map(t=> <div key={t} className={`time-option ${t===searchData.returnTime? 'selected':''}`} data-time={t} onClick={()=> selectTime('return', t)}>{t}</div>)}
                  </div>
                </div>
              </div>
            </div>

            <div className="rental-duration">
              <i className="fas fa-info-circle"></i>
              <div>
                <strong>Rental Duration</strong>
                <p id="rentalDurationText">{rentalDurationText}</p>
              </div>
            </div>

            <div className="rental-warning">
              <i className="fas fa-exclamation-circle"></i>
              <p>Minimum rental duration is 1 hour. Same-day rentals are available. To ensure cars are properly prepared and meet environmental standards, please book at least 2 hours in advance.</p>
            </div>

            <button className="btn-search-submit" onClick={submitSearch}><i className="fas fa-search"></i> Search Cars</button>
          </div>
        </div>
      </div>

      <section className="car-section" data-type="models">
        <div className="container">
          <div className="car-section-header"><h2>Our Electric Car Models</h2></div>
          <div className="car-carousel-wrapper">
            <button className="carousel-nav prev-carousel" onClick={()=> setCarouselIndex(i=> Math.max(0, i-1))}><i className="fas fa-chevron-left"></i></button>
            <div className="car-carousel-container" id="carCarouselContainer">
              <div className="car-carousel-inner" id="carCarouselInner" ref={carInnerRef}>
                {loadingCars && <div className="car-card-item loading-placeholder" style={{ textAlign: 'center', padding: 20 }}>Loading cars...</div>}
                {!loadingCars && cars.slice(0,10).map((car, idx)=>{
                  const carId = car.id || car.Id || car.carId
                  const carName = car.name || car.Name || car.model || car.modelName || 'Unknown'
                  const imageUrl = car.imageUrl || car.ImageUrl || car.image || '/Picture/E car 1.jpg'
                  const pricePerHour = parseFloat(car.rentalPricePerHour || car.RentalPricePerHour || 0)
                  const seats = car.seats || car.Seats
                  return (
                    <div className="car-card-item" key={idx}>
                      <div className="car-image">
                        <img src={imageUrl} alt={carName} onError={(e)=> e.currentTarget.src = '/Picture/E car 1.jpg'} />
                      </div>
                      <div className="car-info">
                        <h3 className="car-name">{carName}</h3>
                        <div className="car-price-simple"><span className="price-amount">{formatVND(pricePerHour)}</span><span className="price-label">/hour</span></div>
                        <div className="car-specs">{seats ? <span><i className="fas fa-users"></i> {seats} Seats</span> : null}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            <button className="carousel-nav next-carousel" onClick={()=> nextCarousel()}><i className="fas fa-chevron-right"></i></button>
          </div>
        </div>
      </section>
    </main>
  )
}
