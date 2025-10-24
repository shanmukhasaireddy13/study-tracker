import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'

const StreakDashboard = ({ backendUrl }) => {
  const [streakData, setStreakData] = useState(null)
  const [recentEntries, setRecentEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStreakData()
    loadRecentEntries()
  }, [])

  const loadStreakData = async () => {
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
      setStreakData({
        currentStreak: 0,
        longestStreak: 0,
        totalStudyDays: 0,
        achievements: []
      })
    }
  }

  const loadRecentEntries = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/v1/study?limit=5`)
      if (data.success) {
        setRecentEntries(data.data)
      }
    } catch (error) {
      console.error('Failed to load recent entries:', error)
      setRecentEntries([])
    } finally {
      setLoading(false)
    }
  }

  const refreshData = async () => {
    setLoading(true)
    try {
      await Promise.all([loadStreakData(), loadRecentEntries()])
      toast.success('Data refreshed!')
    } catch (error) {
      toast.error('Failed to refresh data')
    } finally {
      setLoading(false)
    }
  }

  const getStreakEmoji = (streak) => {
    if (streak >= 30) return '🏆'
    if (streak >= 7) return '🔥'
    if (streak >= 3) return '⚡'
    return '📚'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="text-3xl">{getStreakEmoji(streakData?.currentStreak || 0)}</div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Study Progress</h1>
              <p className="text-sm text-gray-600">Track your learning journey</p>
            </div>
          </div>
          <button
            onClick={refreshData}
            disabled={loading}
            className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md flex items-center space-x-1"
          >
            <span>🔄</span>
            <span>Refresh</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{streakData?.currentStreak || 0}</div>
            <div className="text-xs text-gray-600">Current Streak</div>
          </div>
          <div className="bg-white rounded-lg border p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{streakData?.longestStreak || 0}</div>
            <div className="text-xs text-gray-600">Best Streak</div>
          </div>
          <div className="bg-white rounded-lg border p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{streakData?.totalStudyDays || 0}</div>
            <div className="text-xs text-gray-600">Total Days</div>
          </div>
          <div className="bg-white rounded-lg border p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{streakData?.achievements?.length || 0}</div>
            <div className="text-xs text-gray-600">Achievements</div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border">
              <div className="px-4 py-3 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
              </div>
              <div className="p-4">
                {recentEntries.length > 0 ? (
                  <div className="space-y-2">
                    {recentEntries.map((entry, index) => (
                      <div key={entry._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100">
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm">{entry.subject?.icon || '📚'}</span>
                              <span className="font-medium text-sm">{entry.subject?.name || 'Unknown'}</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {entry.lesson ? `Ch ${entry.lesson.chapterNumber}: ${entry.lesson.name}` : 'No lesson'}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{Math.floor(entry.totalTime / 60)}h {entry.totalTime % 60}m</div>
                          <div className="text-xs text-gray-500">Conf: {entry.confidence}/5</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <div className="text-2xl mb-2">📚</div>
                    <p className="text-sm">No recent activity</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Study Calendar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border">
              <div className="px-4 py-3 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Study Calendar</h2>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-7 gap-1 text-center">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                    <div key={index} className="text-xs font-medium text-gray-500 py-2">
                      {day}
                    </div>
                  ))}
                  {Array.from({ length: 35 }, (_, i) => {
                    const today = new Date()
                    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
                    const startDate = new Date(firstDay)
                    startDate.setDate(startDate.getDate() - firstDay.getDay())
                    const currentDate = new Date(startDate)
                    currentDate.setDate(startDate.getDate() + i)
                    
                    const hasStudied = streakData?.studyCalendar?.some(entry => {
                      const entryDate = new Date(entry.date)
                      return entryDate.toDateString() === currentDate.toDateString()
                    }) || false
                    
                    const isToday = currentDate.toDateString() === today.toDateString()
                    const isCurrentMonth = currentDate.getMonth() === today.getMonth()
                    
                    return (
                      <div 
                        key={i} 
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium ${
                          hasStudied 
                            ? 'bg-green-500 text-white' 
                            : isToday
                            ? 'bg-blue-100 text-blue-600 border border-blue-300'
                            : isCurrentMonth
                            ? 'bg-gray-100 text-gray-600'
                            : 'bg-gray-50 text-gray-400'
                        }`}
                        title={currentDate.toLocaleDateString() + (hasStudied ? ' (Studied)' : '')}
                      >
                        {currentDate.getDate()}
                      </div>
                    )
                  })}
                </div>
                <div className="mt-4 flex items-center justify-center space-x-4 text-xs">
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span>Studied</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
                    <span>Today</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Achievements */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border">
              <div className="px-4 py-3 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Achievements</h2>
              </div>
              <div className="p-4">
                {streakData?.achievements && streakData.achievements.length > 0 ? (
                  <div className="space-y-2">
                    {streakData.achievements.slice(0, 5).map((achievement, index) => (
                      <div key={index} className="flex items-center space-x-2 p-2 bg-yellow-50 rounded-md">
                        <span className="text-sm">🏆</span>
                        <div className="flex-1">
                          <div className="text-xs font-medium text-gray-900">{achievement.description}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(achievement.earnedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    <div className="text-xl mb-1">🎯</div>
                    <p className="text-xs">No achievements yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StreakDashboard
