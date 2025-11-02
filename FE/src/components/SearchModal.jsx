import React, { useState, useEffect } from 'react'
import MapModal from './MapModal.jsx'
import '../styles/SearchModal.css'

export default function SearchModal({ 
  isOpen, 
  onClose, 
  stations = [],
  userLocation = null,
  onSearch 
}) {
  const [showMapModal, setShowMapModal] = useState(false)
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

  // Time options (6:00 - 23:00)
  const timeOptions = Array.from({ length: 18 }, (_,i)=> `${(6+i).toString().padStart(2,'0')}:00`)

  // Update rental duration whenever dates/times change
  useEffect(() => {
    updateRentalDuration()
  }, [searchData.pickupDate, searchData.pickupTime, searchData.returnDate, searchData.returnTime])

  // Reset scroll position when modal opens
  useEffect(() => {
    if (isOpen) {
      const modalBody = document.querySelector('.search-modal-body')
      if (modalBody) {
        modalBody.scrollTop = 0
      }
    }
  }, [isOpen])

  function handleClose() {
    setShowMapModal(false)
    onClose()
  }

  function openMapModal() {
    setShowMapModal(true)
  }

  function handleSelectStationFromMap(id, name, address) {
    setSearchData(d => ({ ...d, location: id, locationName: name }))
    setShowMapModal(false)
  }

  function toggleCalendar(mode) {
    setSearchData(d => ({ ...d, calendarMode: d.calendarMode === mode ? null : mode }))
  }

  function toggleTimePicker(type) {
    const mode = `${type}-time`
    setSearchData(d => ({ ...d, calendarMode: d.calendarMode === mode ? null : mode }))
  }

  function changeMonth(delta) {
    setSearchData(d => {
      let m = d.currentMonth + delta
      let y = d.currentYear
      if(m > 11){ m = 0; y++ }
      if(m < 0){ m = 11; y-- }
      return { ...d, currentMonth: m, currentYear: y }
    })
  }

  function selectDate(dateStr) {
    setSearchData(d => {
      const updated = { ...d }
      if(d.calendarMode === 'pickup'){
        updated.pickupDate = dateStr
        // Adjust return if before pickup
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
      return updated
    })
  }

  function selectTime(type, time) {
    setSearchData(d => ({ ...d, [type+'Time']: time, calendarMode: null }))
  }

  function updateRentalDuration() {
    try{
      const pickup = new Date(`${searchData.pickupDate}T${searchData.pickupTime}`)
      const ret = new Date(`${searchData.returnDate}T${searchData.returnTime}`)
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

  function handleSubmitSearch() {
    if(!searchData.location){ 
      alert('Please select a pick-up location')
      return 
    }
    const pickup = new Date(`${searchData.pickupDate}T${searchData.pickupTime}`)
    const ret = new Date(`${searchData.returnDate}T${searchData.returnTime}`)
    if(ret <= pickup){ 
      alert('Return date and time must be after pick-up date and time.')
      return 
    }
    const diffHours = (ret - pickup) / (1000*60*60)
    if(diffHours < 1){ 
      alert('Minimum rental duration is 1 hour.')
      return 
    }
    
    // Call parent's onSearch callback
    if(onSearch) {
      onSearch(searchData)
    }
  }

  function renderCalendar() {
    const firstDay = new Date(searchData.currentYear, searchData.currentMonth, 1)
    const lastDay = new Date(searchData.currentYear, searchData.currentMonth + 1, 0)
    const today = new Date(); today.setHours(0,0,0,0)
    const cells = []
    
    // Empty cells before first day
    for(let i=0;i<firstDay.getDay();i++) {
      cells.push(<div key={`empty-${i}`} className="calendar-day"></div>)
    }
    
    // Days of month
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
        <div key={dateStr} className={classes.join(' ')} onClick={()=>{ if(!isPast) selectDate(dateStr) }}>
          {day}
        </div>
      )
    }
    return cells
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop (only when map is not open) */}
      {!showMapModal && (
        <div className="search-modal-backdrop" onClick={handleClose}></div>
      )}

      {/* Map Modal */}
      <MapModal 
        isOpen={showMapModal} 
        onClose={() => setShowMapModal(false)}
        stations={stations}
        onSelectStation={handleSelectStationFromMap}
        selectedStationId={searchData.location}
        userLocation={userLocation}
      />

      {/* Search Modal */}
      <div className={`search-modal ${isOpen ? 'active' : ''} ${showMapModal ? 'with-map' : ''}`}>
        <div className="search-modal-content">
          <div className="search-modal-header">
            <h3>Search Cars</h3>
            <button className="search-modal-close" onClick={handleClose}>&times;</button>
          </div>
          
          <div className="search-modal-body">
            {/* Pick-up Location */}
            <div className="search-field">
              <label><i className="fas fa-map-marker-alt"></i> Pick-up Location</label>
              <div className="search-input" onClick={openMapModal}>
                <i className="fas fa-map-marker-alt"></i>
                <span>{searchData.locationName}</span>
              </div>
            </div>

            {/* Pick-up Date & Time */}
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
                    {timeOptions.map(t=> (
                      <div key={t} className={`time-option ${t===searchData.pickupTime? 'selected':''}`} onClick={()=> selectTime('pickup', t)}>
                        {t}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Return Date & Time */}
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
                <div className={`time-picker-dropdown ${searchData.calendarMode === 'return-time' ? 'active' : ''}`}>
                  <div className="time-picker-label">Choose return time</div>
                  <div className="time-picker-options">
                    {timeOptions.map(t=> (
                      <div key={t} className={`time-option ${t===searchData.returnTime? 'selected':''}`} onClick={()=> selectTime('return', t)}>
                        {t}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Rental Duration */}
            <div className="rental-duration">
              <i className="fas fa-info-circle"></i>
              <div>
                <strong>Rental Duration</strong>
                <p>{rentalDurationText}</p>
              </div>
            </div>

            {/* Warning */}
            <div className="rental-warning">
              <i className="fas fa-exclamation-circle"></i>
              <p>Minimum rental duration is 1 hour. Same-day rentals are available. To ensure cars are properly prepared and meet environmental standards, please book at least 2 hours in advance.</p>
            </div>

            {/* Submit Button */}
            <button className="btn-search-submit" onClick={handleSubmitSearch}>
              <i className="fas fa-search"></i> Search Cars
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
