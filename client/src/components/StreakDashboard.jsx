import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { formatIndianDate, getIndianDateString, isTodayIndian, isYesterdayIndian } from '../utils/timezone'
import { useDataCache } from '../context/DataCacheContext'

const StreakDashboard = ({ backendUrl }) => {
  const { fetchStreakData, fetchStudyEntries, fetchRevisionPlan, invalidateCache } = useDataCache()
  const [streakData, setStreakData] = useState(null)
  const [recentEntries, setRecentEntries] = useState([])
  const [revisionPlan, setRevisionPlan] = useState([])
  const [subjects, setSubjects] = useState([])
  const [selectedSubject, setSelectedSubject] = useState(null)
  const [subjectStats, setSubjectStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('streak') // 'streak' or 'revision'

  useEffect(() => {
    loadStreakData()
    loadRecentEntries()
    if (activeSection === 'revision') {
      loadRevisionPlan()
    }
  }, [activeSection])

  const loadStreakData = async (forceRefresh = false) => {
    try {
      const { data } = await fetchStreakData(forceRefresh)
      setStreakData(data)
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

  const loadRecentEntries = async (forceRefresh = false) => {
    try {
      const { data } = await fetchStudyEntries({ limit: 5 }, forceRefresh)
      setRecentEntries(data)
    } catch (error) {
      console.error('Failed to load recent entries:', error)
      setRecentEntries([])
    } finally {
      setLoading(false)
    }
  }

  const loadSubjects = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/v1/subjects`)
      if (data.success) {
        setSubjects(data.data)
      }
    } catch (error) {
      console.error('Failed to load subjects:', error)
      setSubjects([])
    }
  }

  const loadRevisionPlan = async () => {
    try {
      // Get entries from the last 60 days for revision planning
      const sixtyDaysAgo = new Date()
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)
      
      const { data } = await axios.get(`${backendUrl}/api/v1/study?limit=100&dateFrom=${sixtyDaysAgo.toISOString()}`)
      if (data.success) {
        const revisionPlan = createRevisionPlan(data.data)
        setRevisionPlan(revisionPlan)
      }
    } catch (error) {
      console.error('Failed to load revision plan:', error)
      setRevisionPlan([])
    }
  }

  const createRevisionPlan = (entries) => {
    const plan = []
    const today = new Date()
    
    // Group entries by subject and lesson
    const groupedEntries = {}
    
    entries.forEach(entry => {
      if (entry.subject && entry.lesson) {
        const key = `${entry.subject._id}-${entry.lesson._id}`
        if (!groupedEntries[key]) {
          groupedEntries[key] = {
            subject: entry.subject,
            lesson: entry.lesson,
            entries: [],
            lastStudied: null,
            averageConfidence: 0,
            totalTime: 0
          }
        }
        
        groupedEntries[key].entries.push(entry)
        groupedEntries[key].totalTime += entry.totalTime || 0
        
        // Update last studied date
        if (!groupedEntries[key].lastStudied || new Date(entry.createdAt) > new Date(groupedEntries[key].lastStudied)) {
          groupedEntries[key].lastStudied = entry.createdAt
        }
      }
    })
    
    // Calculate statistics and plan revision dates
    Object.values(groupedEntries).forEach(group => {
      if (group.entries.length > 0) {
        // Calculate average confidence
        const totalConfidence = group.entries.reduce((sum, entry) => sum + (entry.confidence || 0), 0)
        group.averageConfidence = Math.round((totalConfidence / group.entries.length) * 10) / 10
        
        // Calculate days since last study
        const daysSinceStudy = Math.floor((today - new Date(group.lastStudied)) / (1000 * 60 * 60 * 24))
        
        // Plan revision date based on confidence and time
        const revisionDate = calculateRevisionDate(group.averageConfidence, daysSinceStudy)
        const priority = calculatePriority(group.averageConfidence, daysSinceStudy)
        
        plan.push({
          ...group,
          daysSinceStudy,
          revisionDate,
          priority,
          status: getRevisionStatus(revisionDate, today)
        })
      }
    })
    
    // Sort by priority and revision date
    return plan.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority // Lower number = higher priority
      }
      return new Date(a.revisionDate) - new Date(b.revisionDate)
    })
  }

  const calculateRevisionDate = (confidence, daysSinceStudy) => {
    const today = new Date()
    let daysToAdd = 0
    
    // High confidence (4-5): Review after longer intervals
    if (confidence >= 4) {
      if (daysSinceStudy >= 14) daysToAdd = 0 // Overdue
      else if (daysSinceStudy >= 7) daysToAdd = 3 // Soon
      else daysToAdd = 7 // Future
    }
    // Medium confidence (3): Review more frequently
    else if (confidence >= 3) {
      if (daysSinceStudy >= 7) daysToAdd = 0 // Overdue
      else if (daysSinceStudy >= 3) daysToAdd = 2 // Soon
      else daysToAdd = 5 // Future
    }
    // Low confidence (1-2): Review very soon
    else {
      if (daysSinceStudy >= 3) daysToAdd = 0 // Overdue
      else if (daysSinceStudy >= 1) daysToAdd = 1 // Tomorrow
      else daysToAdd = 2 // Day after tomorrow
    }
    
    const revisionDate = new Date(today)
    revisionDate.setDate(today.getDate() + daysToAdd)
    return revisionDate
  }

  const calculatePriority = (confidence, daysSinceStudy) => {
    // Priority 1: High urgency (low confidence + long time)
    if (confidence <= 2 && daysSinceStudy >= 7) return 1
    if (confidence <= 3 && daysSinceStudy >= 14) return 1
    
    // Priority 2: Medium urgency
    if (confidence <= 2 && daysSinceStudy >= 3) return 2
    if (confidence <= 3 && daysSinceStudy >= 7) return 2
    if (confidence <= 4 && daysSinceStudy >= 21) return 2
    
    // Priority 3: Low urgency
    return 3
  }

  const getRevisionStatus = (revisionDate, today) => {
    const daysDiff = Math.floor((revisionDate - today) / (1000 * 60 * 60 * 24))
    
    if (daysDiff < 0) return 'overdue'
    if (daysDiff === 0) return 'today'
    if (daysDiff <= 2) return 'soon'
    return 'scheduled'
  }

  const loadLessons = async (subjectId) => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/v1/lessons?subject=${subjectId}`)
      if (data.success) {
        setLessons(data.data)
      }
    } catch (error) {
      console.error('Failed to load lessons:', error)
      setLessons([])
    }
  }

  const calculateSubjectStats = (entries) => {
    const stats = {}
    
    entries.forEach(entry => {
      if (entry.subject) {
        const subjectId = entry.subject._id
        if (!stats[subjectId]) {
          stats[subjectId] = {
            subject: entry.subject,
            lastStudied: entry.createdAt,
            totalEntries: 0,
            totalTime: 0,
            averageConfidence: 0,
            confidenceSum: 0,
            lessons: {}
          }
        }
        
        stats[subjectId].totalEntries++
        stats[subjectId].totalTime += entry.totalTime || 0
        stats[subjectId].confidenceSum += entry.confidence || 0
        
        // Update last studied date (most recent)
        if (new Date(entry.createdAt) > new Date(stats[subjectId].lastStudied)) {
          stats[subjectId].lastStudied = entry.createdAt
        }
        
        // Track lesson statistics
        if (entry.lesson) {
          const lessonId = entry.lesson._id
          if (!stats[subjectId].lessons[lessonId]) {
            stats[subjectId].lessons[lessonId] = {
              lesson: entry.lesson,
              entries: [],
              totalTime: 0,
              confidenceSum: 0
            }
          }
          stats[subjectId].lessons[lessonId].entries.push(entry)
          stats[subjectId].lessons[lessonId].totalTime += entry.totalTime || 0
          stats[subjectId].lessons[lessonId].confidenceSum += entry.confidence || 0
        }
      }
    })
    
    // Calculate averages
    Object.keys(stats).forEach(subjectId => {
      stats[subjectId].averageConfidence = stats[subjectId].totalEntries > 0 
        ? Math.round((stats[subjectId].confidenceSum / stats[subjectId].totalEntries) * 10) / 10
        : 0
      
      // Calculate lesson averages
      Object.keys(stats[subjectId].lessons).forEach(lessonId => {
        const lesson = stats[subjectId].lessons[lessonId]
        lesson.averageConfidence = lesson.entries.length > 0
          ? Math.round((lesson.confidenceSum / lesson.entries.length) * 10) / 10
          : 0
      })
    })
    
    return stats
  }

  const refreshData = async () => {
    setLoading(true)
    try {
      await Promise.all([loadStreakData(), loadRecentEntries()])
      if (activeSection === 'revision') {
        await loadRevisionPlan()
      }
      toast.success('Data refreshed!')
    } catch (error) {
      toast.error('Failed to refresh data')
    } finally {
      setLoading(false)
    }
  }

  const getRevisionStatusColor = (status) => {
    switch (status) {
      case 'overdue': return 'text-red-600 bg-red-50 border-red-200'
      case 'today': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'soon': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      default: return 'text-green-600 bg-green-50 border-green-200'
    }
  }

  const getRevisionStatusIcon = (status) => {
    switch (status) {
      case 'overdue': return '🚨'
      case 'today': return '📅'
      case 'soon': return '⏰'
      default: return '📋'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 1: return 'text-red-600 bg-red-100'
      case 2: return 'text-yellow-600 bg-yellow-100'
      default: return 'text-green-600 bg-green-100'
    }
  }

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 1: return '🔴'
      case 2: return '🟡'
      default: return '🟢'
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

        {/* Section Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveSection('streak')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeSection === 'streak'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🔥 Streak Tracking
          </button>
          <button
            onClick={() => setActiveSection('revision')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeSection === 'revision'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📚 Revision Planner
          </button>
        </div>

        {/* Content based on active section */}
        {activeSection === 'streak' ? (
          <>
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
                        const todayIST = new Date()
                        const firstDay = new Date(todayIST.getFullYear(), todayIST.getMonth(), 1)
                        const startDate = new Date(firstDay)
                        startDate.setDate(startDate.getDate() - firstDay.getDay())
                        const currentDate = new Date(startDate)
                        currentDate.setDate(startDate.getDate() + i)
                        
                        // Check if this date has study entries (using Indian timezone)
                        const hasStudied = streakData?.studyCalendar?.some(entry => {
                          const entryDateIST = new Date(entry.date)
                          const currentDateIST = new Date(currentDate)
                          
                          // Compare dates in Indian timezone
                          const entryDateStr = getIndianDateString(entryDateIST)
                          const currentDateStr = getIndianDateString(currentDateIST)
                          
                          return entryDateStr === currentDateStr
                        }) || false
                        
                        const isToday = isTodayIndian(currentDate)
                        const isCurrentMonth = currentDate.getMonth() === todayIST.getMonth()
                        
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
                            title={`${formatIndianDate(currentDate)}${hasStudied ? ' (Studied)' : ''}`}
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
          </>
        ) : (
          /* Revision Planner */
          <div className="space-y-6">
            {/* Revision Plan Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg border p-4 text-center">
                <div className="text-2xl font-bold text-red-600">
                  {revisionPlan.filter(item => item.status === 'overdue').length}
                </div>
                <div className="text-xs text-gray-600">Overdue</div>
              </div>
              <div className="bg-white rounded-lg border p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {revisionPlan.filter(item => item.status === 'today').length}
                </div>
                <div className="text-xs text-gray-600">Today</div>
              </div>
              <div className="bg-white rounded-lg border p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {revisionPlan.filter(item => item.status === 'soon').length}
                </div>
                <div className="text-xs text-gray-600">This Week</div>
              </div>
              <div className="bg-white rounded-lg border p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {revisionPlan.filter(item => item.status === 'scheduled').length}
                </div>
                <div className="text-xs text-gray-600">Scheduled</div>
              </div>
            </div>

            {/* Revision Plan List */}
            <div className="bg-white rounded-lg border">
              <div className="px-4 py-3 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Revision Plan</h2>
                <p className="text-sm text-gray-600 mt-1">Smart revision schedule based on your study history</p>
              </div>
              <div className="p-4">
                {revisionPlan.length > 0 ? (
                  <div className="space-y-3">
                    {revisionPlan.map((item, index) => (
                      <div key={`${item.subject._id}-${item.lesson._id}`} className={`p-4 rounded-lg border ${getRevisionStatusColor(item.status)}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="text-lg">{getRevisionStatusIcon(item.status)}</div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="text-lg">{item.subject.icon}</span>
                                <span className="font-medium">{item.subject.name}</span>
                                <span className="text-gray-400">•</span>
                                <span className="text-sm text-gray-600">
                                  Ch {item.lesson.chapterNumber}: {item.lesson.name}
                                </span>
                              </div>
                              <div className="flex items-center space-x-4 mt-2 text-xs">
                                <span className={`px-2 py-1 rounded ${getPriorityColor(item.priority)}`}>
                                  {getPriorityIcon(item.priority)} Priority {item.priority}
                                </span>
                                <span className="text-gray-500">
                                  Last studied: {item.daysSinceStudy === 0 ? 'Today' : 
                                               item.daysSinceStudy === 1 ? 'Yesterday' : 
                                               `${item.daysSinceStudy} days ago`}
                                </span>
                                <span className="text-gray-500">
                                  Avg confidence: {item.averageConfidence}/5
                                </span>
                                <span className="text-gray-500">
                                  {item.entries.length} sessions
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {formatIndianDate(item.revisionDate)}
                            </div>
                            <div className="text-xs text-gray-500 capitalize">
                              {item.status}
                            </div>
                            <div className="text-xs text-gray-500">
                              {Math.floor(item.totalTime / 60)}h {item.totalTime % 60}m total
                            </div>
                          </div>
                        </div>
                        
                        {/* Study Activities Summary */}
                        <div className="mt-3 flex flex-wrap gap-1">
                          {item.entries.some(entry => entry.reading?.completed) && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">📖 Reading</span>
                          )}
                          {item.entries.some(entry => entry.grammar?.completed) && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">📝 Grammar</span>
                          )}
                          {item.entries.some(entry => entry.writing?.completed) && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">✍️ Writing</span>
                          )}
                          {item.entries.some(entry => entry.mathPractice?.completed) && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">🔢 Math</span>
                          )}
                          {item.entries.some(entry => entry.sciencePractice?.completed) && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">⚗️ Science</span>
                          )}
                          {item.entries.some(entry => entry.socialPractice?.completed) && (
                            <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded">🌍 Social</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <div className="text-2xl mb-2">📚</div>
                    <p className="text-sm">No revision plan available</p>
                    <p className="text-xs text-gray-400 mt-1">Start studying to generate your personalized revision schedule</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default StreakDashboard
