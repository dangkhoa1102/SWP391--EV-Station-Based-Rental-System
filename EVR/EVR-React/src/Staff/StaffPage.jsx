import React, { useState, useEffect } from 'react';
import './StaffPage.css';

import Header from './components/Header';
import Sidebar from './components/Sidebar';
import BookingSection from './components/Booking/BookingSection';
import VehicleSection from './components/Vehicle/VehicleSection';
import ProfileSection from './components/Profile/ProfileSection';

const initialBookings = [
  { id: 1, title: 'Tesla Model 3', customer: 'Nguyen Van A', status: 'booked', date: '2025-10-10', img: 'https://via.placeholder.com/440x280?text=Tesla+3', facePhoto: 'https://via.placeholder.com/320x320.png?text=Face+A', idString: '012345678901', phone: '0912345678' },
  { id: 2, title: 'Nissan Leaf', customer: 'Tran Thi B', status: 'denied', date: '2025-10-11', img: 'https://via.placeholder.com/440x280?text=Nissan+Leaf', facePhoto: 'https://via.placeholder.com/320x320.png?text=Face+B', idString: '987654321098', phone: '0987654321' },
  { id: 3, title: 'BMW i3', customer: 'Le Van C', status: 'completed', date: '2025-10-09', img: 'https://via.placeholder.com/440x280?text=BMW+i3', facePhoto: 'https://via.placeholder.com/320x320.png?text=Face+C', idString: '123123123123', phone: '0911222333' },
  { id: 4, title: 'Hyundai Kona', customer: 'Pham Thi D', status: 'booked', date: '2025-10-12', img: 'https://via.placeholder.com/440x280?text=Hyundai+Kona', facePhoto: 'https://via.placeholder.com/320x320.png?text=Face+D', idString: '321321321321', phone: '0900111222' },
];

const initialVehicles = [
  { id: 1, name: 'Tesla Model 3', desc: 'Electric sedan', detail: 'Range: 350km', img: 'https://via.placeholder.com/440x280?text=Tesla+3' },
  { id: 2, name: 'Nissan Leaf', desc: 'Compact EV', detail: 'Range: 250km', img: 'https://via.placeholder.com/440x280?text=Nissan+Leaf' },
  { id: 3, name: 'BMW i3', desc: 'Urban EV', detail: 'Range: 200km', img: 'https://via.placeholder.com/440x280?text=BMW+i3' },
  { id: 4, name: 'Hyundai Kona', desc: 'SUV EV', detail: 'Range: 400km', img: 'https://via.placeholder.com/440x280?text=Hyundai+Kona' },
];

export default function StaffPage() {
  const [section, setSection] = useState('booking');
  const [bookings, setBookings] = useState(initialBookings);
  const [vehicles, setVehicles] = useState(initialVehicles);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Booking actions
  const confirmBooking = (id) => setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'booked' } : b));
  const completeBooking = (id) => setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'completed' } : b));
  const denyBooking = (id) => setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'denied' } : b));

  // Vehicle actions
  const addVehicle = (vehicle) => setVehicles(prev => [...prev, vehicle]);
  const removeVehicle = (id) => setVehicles(prev => prev.filter(v => v.id !== id));
  const updateVehicle = (id, payload) => setVehicles(prev => prev.map(v => v.id === id ? { ...v, ...payload } : v));

  // Handle global body class to trigger CSS margin transitions
  useEffect(() => {
    if (sidebarVisible) {
      document.body.classList.add('sidebar-open');
    } else {
      document.body.classList.remove('sidebar-open');
    }
  }, [sidebarVisible]);

  return (
    <div className="app-layout">
      <Header />

      {/* Hover trigger zone */}
      <div
        className="sidebar-hover-zone"
        onMouseEnter={() => setSidebarVisible(true)}
      />

      {/* Sidebar that slides and affects content */}
      <div
        className={`sidebar-wrapper ${sidebarVisible ? 'visible' : ''}`}
        onMouseLeave={() => setSidebarVisible(false)}
      >
        <Sidebar onSelect={setSection} isOpen={true} />
      </div>

      <main className={`main-content ${sidebarVisible ? 'shifted' : ''}`}>
        {section === 'booking' && (
          <BookingSection
            bookings={bookings}
            search={search}
            setSearch={setSearch}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            onConfirm={confirmBooking}
            onComplete={completeBooking}
            onDeny={denyBooking}
          />
        )}
        {section === 'vehicle' && (
          <VehicleSection
            vehicles={vehicles}
            onAdd={addVehicle}
            onRemove={removeVehicle}
            onUpdate={updateVehicle}
          />
        )}
        {section === 'profile' && <ProfileSection />}
      </main>
    </div>
  );
}
