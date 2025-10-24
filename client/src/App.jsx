import React, { useContext } from 'react'
import { Routes,Route } from 'react-router-dom'
import Login from './pages/Login'
import StudyTracker from './pages/StudyTracker'
import AdminPanel from './pages/AdminPanel'
import AdminSetup from './pages/AdminSetup'
import Navigation from './components/Navigation'
import { ToastContainer } from 'react-toastify';
import ProtectedRoute from './components/ProtectedRoute'
import { AppContent } from './context/AppContexts'


const App = () => {
  const { userData, isLoggedin, authChecked } = useContext(AppContent)
  
  const AdminOnlyRoute = ({ children }) => {
    if (!authChecked) {
      return <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <h1 className="text-2xl font-bold text-gray-900">Loading...</h1>
        </div>
      </div>
    }

    if (userData?.email !== 'admin@tracker.com') {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">Admin privileges required to access this page.</p>
            <p className="text-sm text-gray-500 mt-2">Current user: {userData?.email || 'Unknown'}</p>
          </div>
        </div>
      )
    }

    return children
  }
  
  const HomeComponent = () => {
    // Show loading while checking auth
    if (!authChecked) {
      return <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <h1 className="text-2xl font-bold text-gray-900">Loading...</h1>
        </div>
      </div>
    }

    // Check if user is admin and show admin panel
    if (userData?.email === 'admin@tracker.com') {
      return (
        <>
          <Navigation />
          <AdminPanel />
        </>
      )
    } else {
      // Show study tracker for regular users
      return (
        <>
          <Navigation />
          <StudyTracker />
        </>
      )
    }
  }

  return (
    <div>
      <ToastContainer/>
      <Routes>
        <Route path='/' element={
          <ProtectedRoute>
            <HomeComponent />
          </ProtectedRoute>
        }/>
        <Route path='/setup' element={
          <ProtectedRoute>
            <AdminOnlyRoute>
              <AdminSetup/>
            </AdminOnlyRoute>
          </ProtectedRoute>
        }/>
        <Route path='/login' element={<Login/>}/>
      </Routes>
    </div>
  )
}

export default App
