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
  { id: 5, title: 'Kia EV6', customer: 'Do Thi E', status: 'booked', date: '2025-10-13', img: 'https://via.placeholder.com/440x280?text=Kia+EV6', facePhoto: 'https://via.placeholder.com/320x320.png?text=Face+E', idString: '555666777888', phone: '0901234567' },
  { id: 6, title: 'Volkswagen ID.4', customer: 'Pham Van F', status: 'booked', date: '2025-10-14', img: 'https://via.placeholder.com/440x280?text=VW+ID.4', facePhoto: 'https://via.placeholder.com/320x320.png?text=Face+F', idString: '111222333444', phone: '0919876543' },
  { id: 7, title: 'Hyundai Ioniq 5', customer: 'Le Thi G', status: 'completed', date: '2025-10-08', img: 'https://via.placeholder.com/440x280?text=Ioniq+5', facePhoto: 'https://via.placeholder.com/320x320.png?text=Face+G', idString: '222333444555', phone: '0933334444' },
  { id: 8, title: 'Tesla Model Y', customer: 'Tran Van H', status: 'denied', date: '2025-10-07', img: 'https://via.placeholder.com/440x280?text=Model+Y', facePhoto: 'https://via.placeholder.com/320x320.png?text=Face+H', idString: '333444555666', phone: '0944445555' },
  { id: 9, title: 'BYD Atto 3', customer: 'Nguyen Thi I', status: 'booked', date: '2025-10-06', img: 'https://via.placeholder.com/440x280?text=BYD+Atto+3', facePhoto: 'https://via.placeholder.com/320x320.png?text=Face+I', idString: '444555666777', phone: '0955556666' },
  { id: 10, title: 'VinFast VF8', customer: 'Hoang Van J', status: 'booked', date: '2025-10-05', img: 'https://via.placeholder.com/440x280?text=VF8', facePhoto: 'https://via.placeholder.com/320x320.png?text=Face+J', idString: '555666777999', phone: '0966667777' },
  { id: 11, title: 'Renault Zoe', customer: 'Bui Thi K', status: 'completed', date: '2025-10-04', img: 'https://via.placeholder.com/440x280?text=Zoe', facePhoto: 'https://via.placeholder.com/320x320.png?text=Face+K', idString: '666777888999', phone: '0977778888' },
  { id: 12, title: 'Honda e', customer: 'Ngo Van L', status: 'booked', date: '2025-10-03', img: 'https://via.placeholder.com/440x280?text=Honda+e', facePhoto: 'https://via.placeholder.com/320x320.png?text=Face+L', idString: '777888999000', phone: '0988889999' },
  { id: 13, title: 'Peugeot e-208', customer: 'Pham Minh M', status: 'booked', date: '2025-10-02', img: 'https://via.placeholder.com/440x280?text=e-208', facePhoto: 'https://via.placeholder.com/320x320.png?text=Face+M', idString: '888999000111', phone: '0911001100' },
  { id: 14, title: 'Volvo XC40 Recharge', customer: 'Tran Bao N', status: 'completed', date: '2025-10-01', img: 'https://via.placeholder.com/440x280?text=XC40+Recharge', facePhoto: 'https://via.placeholder.com/320x320.png?text=Face+N', idString: '999000111222', phone: '0922002200' },
  { id: 15, title: 'Audi Q4 e-tron', customer: 'Le Thanh O', status: 'denied', date: '2025-09-30', img: 'https://via.placeholder.com/440x280?text=Q4+e-tron', facePhoto: 'https://via.placeholder.com/320x320.png?text=Face+O', idString: '000111222333', phone: '0933003300' },
  { id: 16, title: 'Mercedes EQB', customer: 'Nguyen My P', status: 'booked', date: '2025-09-29', img: 'https://via.placeholder.com/440x280?text=EQB', facePhoto: 'https://via.placeholder.com/320x320.png?text=Face+P', idString: '111222333444', phone: '0944004400' },
  { id: 17, title: 'Skoda Enyaq iV', customer: 'Do Hai Q', status: 'booked', date: '2025-09-28', img: 'https://via.placeholder.com/440x280?text=Enyaq+iV', facePhoto: 'https://via.placeholder.com/320x320.png?text=Face+Q', idString: '222333444555', phone: '0955005500' },
  { id: 18, title: 'Porsche Taycan', customer: 'Bui Khang R', status: 'completed', date: '2025-09-27', img: 'https://via.placeholder.com/440x280?text=Taycan', facePhoto: 'https://via.placeholder.com/320x320.png?text=Face+R', idString: '333444555666', phone: '0966006600' },
  { id: 19, title: 'Tesla Model S', customer: 'Hoang Y S', status: 'booked', date: '2025-09-26', img: 'https://via.placeholder.com/440x280?text=Model+S', facePhoto: 'https://via.placeholder.com/320x320.png?text=Face+S', idString: '444555666777', phone: '0977007700' },
  { id: 20, title: 'Mini Cooper SE', customer: 'Ngo Linh T', status: 'denied', date: '2025-09-25', img: 'https://via.placeholder.com/440x280?text=Mini+SE', facePhoto: 'https://via.placeholder.com/320x320.png?text=Face+T', idString: '555666777888', phone: '0988008800' },
];

const initialVehicles = [
  { id: 1, name: 'Tesla Model 3', desc: 'Electric sedan', detail: 'Range: 350km', img: 'https://via.placeholder.com/440x280?text=Tesla+3' },
  { id: 2, name: 'Nissan Leaf', desc: 'Compact EV', detail: 'Range: 250km', img: 'https://via.placeholder.com/440x280?text=Nissan+Leaf' },
  { id: 3, name: 'BMW i3', desc: 'Urban EV', detail: 'Range: 200km', img: 'https://via.placeholder.com/440x280?text=BMW+i3' },
  { id: 4, name: 'Hyundai Kona', desc: 'SUV EV', detail: 'Range: 400km', img: 'https://via.placeholder.com/440x280?text=Hyundai+Kona' },
  { id: 5, name: 'Kia EV6', desc: 'Crossover EV', detail: 'Range: 500km', img: 'https://via.placeholder.com/440x280?text=Kia+EV6' },
  { id: 6, name: 'Volkswagen ID.4', desc: 'Compact SUV', detail: 'Range: 420km', img: 'https://via.placeholder.com/440x280?text=VW+ID.4' },
  { id: 7, name: 'Hyundai Ioniq 5', desc: 'Modern hatch', detail: 'Range: 480km', img: 'https://via.placeholder.com/440x280?text=Ioniq+5' },
  { id: 8, name: 'Tesla Model Y', desc: 'SUV EV', detail: 'Range: 505km', img: 'https://via.placeholder.com/440x280?text=Model+Y' },
  { id: 9, name: 'BYD Atto 3', desc: 'Affordable EV', detail: 'Range: 420km', img: 'https://via.placeholder.com/440x280?text=BYD+Atto+3' },
  { id: 10, name: 'VinFast VF8', desc: 'Midsize SUV', detail: 'Range: 471km', img: 'https://via.placeholder.com/440x280?text=VF8' },
  { id: 11, name: 'Renault Zoe', desc: 'City car', detail: 'Range: 390km', img: 'https://via.placeholder.com/440x280?text=Zoe' },
  { id: 12, name: 'Honda e', desc: 'Compact city EV', detail: 'Range: 220km', img: 'https://via.placeholder.com/440x280?text=Honda+e' },
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
