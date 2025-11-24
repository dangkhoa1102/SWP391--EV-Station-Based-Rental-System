import React from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import UserProfile from './renter/page/components/Profile/UserProfile'
import UpdateProfilePage from './renter/page/components/Profile/UpdateProfilePage'
import HomePage from './renter/page/components/Home/HomePage'
import CarListPage from './renter/page/components/Car/CarListPage'
import CarDetail from './renter/page/components/Car/CarDetail'
import PaymentPage from './renter/page/components/Payment/PaymentPage'
import PaymentSuccess from './renter/page/components/Payment/PaymentSuccess'
import PaymentCancel from './renter/page/components/Payment/PaymentCancel'
import TransactionPage from './renter/page/components/Transaction/TransactionPage'
import BookingHistory from './renter/page/components/Booking/BookingHistory'
import TestApi from './renter/page/TestApi'
import StaffPage from './staff/page/StaffPage'
import AdminPage from './admin/page/AdminPage'
import ProtectedRoute from './components/ProtectedRoute'
import Header from './components/Header'
import Footer from './components/Footer'
import CreateContract from './renter/page/components/Contract/CreateContract'
import ContractList from './renter/page/components/Contract/ContractList'
import ContractDetail from './renter/page/components/Contract/ContractDetail'
import ConfirmContract from './renter/page/components/Contract/ConfirmContract'
import DownloadLatestContract from './renter/page/components/Contract/DownloadLatestContract'


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
          <Route path="/contract/new" element={<CreateContract />} />
          <Route path="/contract/list" element={<ContractList />} />
          <Route path="/contract/:id" element={<ContractDetail />} />
          <Route path="/contract/download-latest" element={<DownloadLatestContract />} />
          <Route path="/xac-nhan-hop-dong" element={<ConfirmContract />} />
          <Route path="/staff" element={
            <ProtectedRoute requireStaff>
              <StaffPage />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute requireAdmin>
              <AdminPage />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
      {!hideChrome && <Footer />}
    </div>
  )
}

export default function App(){
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppShell />
    </BrowserRouter>
  )
}
