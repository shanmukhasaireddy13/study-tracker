import React, { useContext } from 'react'
import { Navigate } from 'react-router-dom'
import { AppContent } from '../context/AppContexts'

const ProtectedRoute = ({ children }) => {
  const { authChecked, isLoggedin } = useContext(AppContent)

  // still checking auth state - show nothing or a simple loader
  if (!authChecked) return <div className="p-6 text-center">Checking authentication...</div>

  // not logged in - redirect to login
  if (!isLoggedin) return <Navigate to="/login" replace />

  // logged in - render child routes/components
  return children
}

export default ProtectedRoute
