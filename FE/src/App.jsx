import React from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import UserProfile from './user/page/UserProfile'
import HomePage from './user/page/HomePage'
import CarListPage from './user/page/CarListPage'
import CarDetail from './user/page/CarDetail'
import PaymentPage from './user/page/PaymentPage'
import PaymentSuccess from './user/page/PaymentSuccess'
import TransactionPage from './user/page/TransactionPage'
import BookingHistory from './user/page/BookingHistory'
import TestApi from './user/page/TestApi'
import StaffPage from './staff/page/StaffPage'

import Header from './components/Header'
import Footer from './components/Footer'
import StaffPage from './staff/page/StaffPage'

function AppShell(){
  const location = useLocation()
  const hideChrome = location.pathname.startsWith('/staff') || location.pathname.startsWith('/admin')
  return (
    <>
      {!hideChrome && <Header />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/cars" element={<CarListPage />} />
        <Route path="/cars/:id" element={<CarDetail />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/transaction" element={<TransactionPage />} />
        <Route path="/booking-history" element={<BookingHistory />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/staff" element={<StaffPage />} />
        <Route path="/test-api" element={<TestApi />} />
        <Route path="/staff" element={<StaffPage />} />
      </Routes>
      {!hideChrome && <Footer />}
    </>
  )
}

export default function App(){
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}
