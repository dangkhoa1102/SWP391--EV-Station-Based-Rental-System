import React from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import UserProfile from './user/page/components/Profile/UserProfile'
import UpdateProfilePage from './user/page/components/Profile/UpdateProfilePage'
import HomePage from './user/page/components/Home/HomePage'
import CarListPage from './user/page/components/Car/CarListPage'
import CarDetail from './user/page/components/Car/CarDetail'
import PaymentPage from './user/page/components/Payment/PaymentPage'
import PaymentSuccess from './user/page/components/Payment/PaymentSuccess'
import PaymentCancel from './user/page/components/Payment/PaymentCancel'
import TransactionPage from './user/page/components/Transaction/TransactionPage'
import BookingHistory from './user/page/components/Booking/BookingHistory'
import StaffPage from './staff/page/StaffPage'
import AdminPage from './admin/page/AdminPage'
import Header from './components/Header'
import Footer from './components/Footer'


function AppShell(){
  const location = useLocation()
  const hideChrome = location.pathname.startsWith('/staff') || location.pathname.startsWith('/admin')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', flex: 1 }}>
      {!hideChrome && <Header />}
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/cars" element={<CarListPage />} />
          <Route path="/cars/:id" element={<CarDetail />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/payment-cancel" element={<PaymentCancel />} />
          <Route path="/transaction" element={<TransactionPage />} />
          <Route path="/booking-history" element={<BookingHistory />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/update-profile" element={<UpdateProfilePage />} />
          <Route path="/staff" element={<StaffPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>
      {!hideChrome && <Footer />}
    </div>
  )
}

export default function App(){
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}
