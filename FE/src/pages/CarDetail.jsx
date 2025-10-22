import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import API from '../services/api'

export default function CarDetail(){
  const { id } = useParams()
  const [car, setCar] = useState(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(()=>{
    const load = async ()=>{
      try{
        setLoading(true)
        const data = await API.getCarById(id)
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

  if(loading) return <div style={{ padding: '2rem' }}><p>Loading...</p></div>
  if(!car) return <div style={{ padding: '2rem' }}><p>Car not found</p></div>

  const imageUrl = car.imageUrl || car.image || '/Picture/E car 1.jpg'
  const name = `${car.brand || ''} ${car.model || 'Car'}`.trim()
  const price = parseFloat(car.rentalPricePerHour || car.RentalPricePerHour || 0)

  return (
    <main style={{ padding: '2rem' }}>
      <div className="container">
        <div className="car-detail">
          <img src={imageUrl} alt={name} style={{ width: '100%', maxHeight: 400, objectFit: 'cover', borderRadius: 8 }} />
          <h2>{name}</h2>
          <p style={{fontSize: '1.5rem', color: '#ff6a00', fontWeight: 'bold'}}>${price.toFixed(2)}/hour</p>
          <p>{car.description || car.Description || 'No description available'}</p>
          <div style={{marginTop: '1rem'}}>
            <p><strong>Brand:</strong> {car.brand || 'N/A'}</p>
            <p><strong>Color:</strong> {car.color || 'N/A'}</p>
            <p><strong>Seats:</strong> {car.seats || 'N/A'}</p>
            <p><strong>Year:</strong> {car.year || 'N/A'}</p>
            <p><strong>Battery Capacity:</strong> {car.batteryCapacity || 'N/A'} km</p>
          </div>
          <button 
            style={{
              marginTop: '2rem',
              padding: '1rem 2rem',
              background: 'linear-gradient(135deg, #ff6a00, #ee0979)',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: '1.1rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
            onClick={()=> {
              localStorage.setItem('selectedCarId', car.id || car.Id)
              window.location.href = '/payment'
            }}
          >
            Book Now
          </button>
        </div>
      </div>
    </main>
  )
}
