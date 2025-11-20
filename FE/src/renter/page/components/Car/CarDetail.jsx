import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import carApi from '../../../../services/carApi'
import authApi from '../../../../services/authApi'
import NotificationModal from '../../../../components/NotificationModal'
import './car_detail.css'
import { formatVND } from '../../../../utils/currency'
import { isProfileComplete, getMissingFieldsMessage } from '../../../../utils/profileValidation'

export default function CarDetail(){
  const { id } = useParams()
  const navigate = useNavigate()
  const [car, setCar] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState({})
  const [documents, setDocuments] = useState({})
  const [profileComplete, setProfileComplete] = useState(false)
  const [notification, setNotification] = useState({
    isOpen: false,
    type: 'error',
    title: '',
    message: ''
  })
  
  useEffect(()=>{
    const loadProfile = async () => {
      try {
        const profileData = await authApi.getMyProfile()
        setProfile(profileData || {})
        
        const authRes = await authApi.getMe()
        const authData = authRes || {}
        
        const docs = {
          cccdFront: authData.cccdImageUrl_Front || '',
          cccdBack: authData.cccdImageUrl_Back || '',
          licenseFront: authData.gplxImageUrl_Front || '',
          licenseBack: authData.gplxImageUrl_Back || ''
        }
        setDocuments(docs)
        
        const { isComplete } = isProfileComplete(profileData, docs)
        setProfileComplete(isComplete)
      } catch (e) {
        console.error('❌ Error loading profile:', e)
        setProfileComplete(false)
      }
    }
    loadProfile()
  }, [])
  
  useEffect(()=>{
    const load = async ()=>{
      try{
        setLoading(true)
        const data = await carApi.getCarById(id)
        setCar(data)
      }catch(e){ 
        console.error(e)
      }
      finally{ 
        setLoading(false) 
      }
    }
    if(id) load()
  },[id])

  if(loading) return (
    <main className="car-detail-main">
      <div className="container">
        <div className="loading-message">Loading...</div>
      </div>
    </main>
  )
  
  if(!car) return (
    <main className="car-detail-main">
      <div className="container">
        <div className="error-message">Car not found</div>
      </div>
    </main>
  )

  const imageUrl = car.imageUrl || car.image || '/Picture/E car 1.jpg'
  const name = `${car.brand || ''} ${car.model || 'Car'}`.trim()
  const price = parseFloat(car.rentalPricePerHour || car.RentalPricePerHour || 0)

  return (
    <main className="car-detail-main">
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={() => setNotification(prev => ({...prev, isOpen: false}))}
        type={notification.type}
        title={notification.title}
        message={notification.message}
      />
      <div className="container">
        <button className="back-btn" onClick={()=> navigate('/cars')}>
          <i className="fas fa-arrow-left"></i> Back to Cars
        </button>
        
        <div className="car-detail-grid">
          <div className="car-left-section">
            <div className="car-image-section">
              <div className="main-image">
                <img src={imageUrl} alt={name} onError={e=> e.currentTarget.src='/Picture/E car 1.jpg'} />
              </div>
            </div>

            <div className="car-specs">
              <h3>Car Information</h3>
              <div className="specs-grid">
                <div className="spec-item">
                  <i className="fas fa-car"></i>
                  <div className="spec-info">
                    <div className="spec-label">Brand</div>
                    <div className="spec-value">{car.brand || 'N/A'}</div>
                  </div>
                </div>
                <div className="spec-item">
                  <i className="fas fa-palette"></i>
                  <div className="spec-info">
                    <div className="spec-label">Color</div>
                    <div className="spec-value">{car.color || 'N/A'}</div>
                  </div>
                </div>
                <div className="spec-item">
                  <i className="fas fa-users"></i>
                  <div className="spec-info">
                    <div className="spec-label">Seats</div>
                    <div className="spec-value">{car.seats || 'N/A'}</div>
                  </div>
                </div>
                <div className="spec-item">
                  <i className="fas fa-calendar"></i>
                  <div className="spec-info">
                    <div className="spec-label">Year</div>
                    <div className="spec-value">{car.year || 'N/A'}</div>
                  </div>
                </div>
                <div className="spec-item">
                  <i className="fas fa-battery-full"></i>
                  <div className="spec-info">
                    <div className="spec-label">Battery Range</div>
                    <div className="spec-value">{car.batteryCapacity || 'N/A'} km</div>
                  </div>
                </div>
                <div className="spec-item">
                  <i className="fas fa-cog"></i>
                  <div className="spec-info">
                    <div className="spec-label">Transmission</div>
                    <div className="spec-value">{car.transmission || 'Automatic'}</div>
                  </div>
                </div>
              </div>
            </div>

            {car.description && (
              <div className="car-description">
                <h3>Description</h3>
                <p>{car.description || car.Description}</p>
              </div>
            )}
          </div>

          <div className="car-right-section">
            <div className="pricing-card">
              <div className="car-header">
                <h1 className="car-title">{name}</h1>
                {car.year && <span className="car-year">{car.year}</span>}
              </div>

              <div className="price-section">
                <div className="price-label">Rental Price</div>
                  <div className="price-value">{formatVND(price)}/hour</div>
                  <div className="price-note">Estimated daily rate: {formatVND(Math.round(price * 24))}/day</div>
              </div>

              <div className="rental-info">
                <h3>Rental Details</h3>
                <div className="info-item">
                  <i className="fas fa-clock"></i>
                  <span>Minimum rental: 1 hour</span>
                </div>
                <div className="info-item">
                  <i className="fas fa-shield-alt"></i>
                  <span>Insurance included</span>
                </div>
                <div className="info-item">
                  <i className="fas fa-gas-pump"></i>
                  <span>Fuel policy: Same to same</span>
                </div>
                <div className="info-item">
                  <i className="fas fa-map-marked-alt"></i>
                  <span>Unlimited mileage</span>
                </div>
              </div>

              <button 
                className="book-now-btn"
                onClick={()=> {
                  if (!profileComplete) {
                    const { missingFields } = isProfileComplete(profile, documents)
                    setNotification({
                      isOpen: true,
                      type: 'warning',
                      title: '⚠️ Incomplete Profile',
                      message: `Please complete your profile before booking.\n\nMissing fields:\n${missingFields.join(', ')}\n\nYou will be redirected to update your profile.`
                    })
                    setTimeout(() => {
                      navigate('/profile')
                    }, 2000)
                    return
                  }
                  localStorage.setItem('selectedCarId', car.id || car.Id)
                  navigate('/payment')
                }}
              >
                <i className="fas fa-check-circle"></i> {profileComplete ? 'Book Now' : 'Complete Profile First'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
