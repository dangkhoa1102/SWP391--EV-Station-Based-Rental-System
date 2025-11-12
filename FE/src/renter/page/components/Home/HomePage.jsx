import React, { useEffect, useState, useRef } from 'react'
import stationApi from '../../../../services/stationApi'
import carApi from '../../../../services/carApi'
import { formatVND } from '../../../../utils/currency.js'
import { useToast } from '../../../../components/ToastProvider.jsx'
import SearchModal from '../../../../components/SearchModal.jsx'
import './home_page.css'

export default function HomePage(){
  const [stations, setStations] = useState([])
  const [cars, setCars] = useState([])
  const [loadingCars, setLoadingCars] = useState(true)
  const [carouselIndex, setCarouselIndex] = useState(0)
  const carInnerRef = useRef(null)
  const [userLocation, setUserLocation] = useState(null)
  const [searchOpen, setSearchOpen] = useState(false)

  // Slideshow state
  const [slideIndex, setSlideIndex] = useState(0)
  const slides = ['/Picture/E car 1.jpg', '/Picture/E car 3.png', '/Picture/E car 2.png']

  const overlayRef = useRef(null)
  const { showToast } = useToast()

  useEffect(()=>{
    // Get user's current location with high accuracy
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const accuracy = position.coords.accuracy
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
          console.log('📍 User location:', position.coords.latitude, position.coords.longitude)
          console.log('📏 Accuracy:', accuracy, 'meters')
          
          if (accuracy > 100) {
            console.warn('⚠️ Location accuracy is low (>' + accuracy + 'm). Position may not be precise.')
          }
        },
        (error) => {
          console.error('❌ Could not get user location:', error.message)
          // Default to Ho Chi Minh City center
          setUserLocation({ lat: 10.8231, lng: 106.6297 })
          showToast('Could not detect your location. Using default location.', 'warning', 3000)
        },
        {
          enableHighAccuracy: true,  // Request high accuracy (uses GPS if available)
          timeout: 10000,            // Wait max 10 seconds
          maximumAge: 0              // Don't use cached location
        }
      )
    } else {
      console.warn('Geolocation is not supported by this browser')
      setUserLocation({ lat: 10.8231, lng: 106.6297 })
      showToast('Your browser does not support geolocation', 'warning', 3000)
    }

    // load stations and cars
    const loadStations = async ()=>{
      try{
        if(!stationApi.getAllStations) {
          console.warn('stationApi.getAllStations not available')
          return
        }
        // stationApi.getAllStations already returns an array directly
        const list = await stationApi.getAllStations(1, 500)
        console.log('🏢 Loaded stations in HomePage:', list.length, 'items')
        setStations(list || [])
      }catch(e){ console.error('Failed to load stations', e) }
    }

    const loadCars = async ()=>{
      try{
        if(!carApi.getAllCars) {
          console.warn('carApi.getAllCars not available')
          setLoadingCars(false)
          return
        }
        setLoadingCars(true)
        // carApi.getAllCars already returns an array directly
        const list = await carApi.getAllCars(1, 100)
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
  function openSearchModal(){ setSearchOpen(true) }
  function closeSearchModal(){ setSearchOpen(false) }

  function handleSearch(searchData) {
    // Store rental context in localStorage
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
    
    // Navigate to car list page with search params
    const params = new URLSearchParams({ 
      location: searchData.location, 
      'pickup-date': searchData.pickupDate, 
      'pickup-time': searchData.pickupTime, 
      'return-date': searchData.returnDate, 
      'return-time': searchData.returnTime 
    })
    window.location.href = `/cars?${params.toString()}`
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
                  <div className="summary-value" id="summaryLocation">Select location</div>
                </div>
                <div className="summary-item" onClick={openSearchModal}>
                  <div className="summary-label">Pick-up Date</div>
                  <div className="summary-value">{new Date().toLocaleDateString()}</div>
                </div>
                <div className="summary-item" onClick={openSearchModal}>
                  <div className="summary-label">Pick-up Time</div>
                  <div className="summary-value">15:00</div>
                </div>
                <div className="summary-item" onClick={openSearchModal}>
                  <div className="summary-label">Return Date</div>
                  <div className="summary-value">{new Date(Date.now() + 24*60*60*1000).toLocaleDateString()}</div>
                </div>
                <div className="summary-item" onClick={openSearchModal}>
                  <div className="summary-label">Return Time</div>
                  <div className="summary-value">19:00</div>
                </div>
                <button
                  type="button"
                  className="btn-search"
                  onClick={openSearchModal}
                ><i className="fas fa-search"></i> SEARCH</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search Modal Component */}
      <SearchModal 
        isOpen={searchOpen}
        onClose={closeSearchModal}
        stations={stations}
        userLocation={userLocation}
        onSearch={handleSearch}
      />

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
