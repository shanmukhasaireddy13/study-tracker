import React, { useContext, useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { AppContent } from '../context/AppContexts'
import axios from 'axios'

const Navigation = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { backendUrl, setIsLoggedin, setUserData, userData } = useContext(AppContent)
  const [streakData, setStreakData] = useState(null)

  const isActive = (path) => {
    return location.pathname === path
  }

  const isAdmin = userData?.email === 'admin@tracker.com'

  const loadStreakData = async () => {
    if (isAdmin) return // Don't load streak data for admin
    
    try {
      // First refresh the streak to ensure it's up to date
      await axios.post(`${backendUrl}/api/v1/streak/refresh`)
      
      // Then get the updated streak data
      const { data } = await axios.get(`${backendUrl}/api/v1/streak`)
      if (data.success) {
        setStreakData(data.data)
      }
    } catch (error) {
      console.error('Failed to load streak data:', error)
    }
  }

  useEffect(() => {
    if (userData && !isAdmin) {
      loadStreakData()
    }
  }, [userData, isAdmin])

  const logout = async () => {
    try {
      axios.defaults.withCredentials = true
      const { data } = await axios.post(backendUrl + '/api/v1/auth/logout')
      if (data.success) {
        setIsLoggedin(false)
        setUserData(false)
        navigate('/login')
      }
    } catch (e) {}
  }

  return (
    <nav className='bg-white shadow-sm border-b sticky top-0 z-40'>
      <div className='max-w-7xl mx-auto px-3 sm:px-4 lg:px-8'>
        <div className='flex justify-between items-center py-3 sm:py-4'>
          {/* Logo and Title */}
          <div className='flex items-center space-x-2 sm:space-x-4'>
            <div className='text-xl sm:text-2xl'>📚</div>
            <div className='hidden sm:block'>
              <h1 className='text-lg sm:text-xl font-bold text-gray-900'>
                {isAdmin ? 'Admin Dashboard' : 'Study Tracker'}
              </h1>
              <p className='text-xs sm:text-sm text-gray-600'>
                {isAdmin ? 'Manage subjects and monitor progress' : 'Track your daily preparation'}
              </p>
            </div>
            <div className='sm:hidden'>
              <h1 className='text-sm font-bold text-gray-900'>
                {isAdmin ? 'Admin' : 'Study'}
              </h1>
            </div>
          </div>

          {/* Navigation Links */}
          <div className='hidden sm:flex space-x-4 lg:space-x-6'>
            {!isAdmin && (
              <button
                onClick={() => navigate('/')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/') 
                    ? 'bg-green-100 text-green-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                📚 Study Tracker
              </button>
            )}
            {isAdmin && (
              <>
                <button
                  onClick={() => navigate('/')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/') 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  🏠 Dashboard
                </button>
                <button
                  onClick={() => navigate('/setup')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/setup') 
                      ? 'bg-orange-100 text-orange-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  ⚙️ Setup
                </button>
              </>
            )}
          </div>

          {/* User Info, Streak, and Logout */}
          <div className='flex items-center space-x-4'>
            {/* Streak Display - Only for students */}
            {!isAdmin && streakData && (
              <div className='flex items-center space-x-2 bg-gradient-to-r from-orange-100 to-red-100 px-3 py-2 rounded-lg border border-orange-200'>
                <span className='text-lg'>🔥</span>
                <div className='text-right'>
                  <div className='text-sm font-bold text-orange-700'>{streakData.currentStreak || 0}</div>
                  <div className='text-xs text-orange-600'>Streak</div>
                </div>
              </div>
            )}
            
            <div className='text-right'>
              <div className='text-sm font-medium text-gray-900'>{userData?.name}</div>
              <div className='text-xs text-gray-500'>
                {isAdmin ? 'Administrator' : 'Student'}
              </div>
            </div>
            <button 
              onClick={logout} 
              className='px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors'
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navigation
