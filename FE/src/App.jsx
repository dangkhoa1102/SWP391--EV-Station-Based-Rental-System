import React from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import UserProfile from './user/page/UserProfile'
import HomePage from './user/page/HomePage'
import CarListPage from './user/page/CarListPage'
import CarDetail from './user/page/CarDetail'
import PaymentPage from './user/page/PaymentPage'
import TransactionPage from './user/page/TransactionPage'
import BookingHistory from './user/page/BookingHistory'
import TestApi from './user/page/TestApi'

import Header from './components/Header'
import Footer from './components/Footer'
import StaffPage from './staff/page/StaffPage'
import AdminPage from './admin/page/AdminPage'

function RoutedAppFrame() {
  const location = useLocation();
  const hideFrame = location.pathname.startsWith('/staff') || location.pathname.startsWith('/admin');
  return (
    <>
      {!hideFrame && <Header />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/cars" element={<CarListPage />} />
        <Route path="/cars/:id" element={<CarDetail />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/transaction" element={<TransactionPage />} />
        <Route path="/booking-history" element={<BookingHistory />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/test-api" element={<TestApi />} />

        {/* Backoffice routes */}
        <Route path="/staff" element={<StaffPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
      {!hideFrame && <Footer />}
    </>
  );
}

export default function App(){
  return (
    <BrowserRouter>
      <RoutedAppFrame />
    </BrowserRouter>
  )
}
