import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import UserProfile from './pages/UserProfile'
import HomePage from './pages/HomePage'
import CarListPage from './pages/CarListPage'
import CarDetail from './pages/CarDetail'
import PaymentPage from './pages/PaymentPage'
import TransactionPage from './pages/TransactionPage'
import BookingHistory from './pages/BookingHistory'
import TestApi from './pages/TestApi'

import Header from './components/Header'
import Footer from './components/Footer'

export default function App(){
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/cars" element={<CarListPage />} />
        <Route path="/cars/:id" element={<CarDetail />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/transaction" element={<TransactionPage />} />
        <Route path="/booking-history" element={<BookingHistory />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/test-api" element={<TestApi />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  )
}
