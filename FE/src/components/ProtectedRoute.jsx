import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Protect routes by role. If user is not allowed, redirect to '/'.
export default function ProtectedRoute({ children, requireStaff = false, requireAdmin = false }){
  const { user, token } = useAuth()

  // Determine role from user object or fallback to localStorage (authApi writes userRole there)
  const roleFromUser = user?.role || user?.Role || user?.roleName || user?.userRole || (Array.isArray(user?.roles) ? user.roles[0] : null)
  const roleFromStorage = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null
  const role = roleFromUser || roleFromStorage || ''

  const isStaff = role && (role.includes('Staff') || role.toLowerCase().includes('staff') || role === 'StationManager' || role.toLowerCase().includes('manager'))
  const isAdmin = role && (role.includes('Admin') || role.toLowerCase().includes('admin') || role === 'SystemAdmin' || role.toLowerCase().includes('administrator'))

  // If route requires staff, allow staff or admin; if requires admin, allow only admin.
  if(requireAdmin){
    if(!token || !isAdmin) return <Navigate to="/" replace />
    return children
  }

  if(requireStaff){
    if(!token || (!isStaff && !isAdmin)) return <Navigate to="/" replace />
    return children
  }

  // Default: require authentication for protected usage (if no specific role requested)
  if(!token) return <Navigate to="/" replace />
  return children
}
