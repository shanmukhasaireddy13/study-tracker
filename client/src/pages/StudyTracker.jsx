import React, { useContext, useEffect, useState } from 'react'
import axios from 'axios'
import { AppContent } from '../context/AppContexts'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import ProgressDashboard from '../components/ProgressDashboard'
import ExamCountdown from '../components/ExamCountdown'
import StudyEntryForm from '../components/StudyEntryForm'
import StreakDashboard from '../components/StreakDashboard'

const StudyTracker = () => {
  const navigate = useNavigate()
  const { backendUrl, userData, isLoggedin, authChecked, setIsLoggedin, setUserData } = useContext(AppContent)
  const [subjects, setSubjects] = useState([])
  const [studyEntries, setStudyEntries] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [stats, setStats] = useState(null)
  const [filterSubject, setFilterSubject] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [activeTab, setActiveTab] = useState('tracker')

  const loadSubjects = async () => {
    try {
      const { data } = await axios.get(backendUrl + '/api/v1/subjects')
      if (data.success) {
        setSubjects(data.data)
        if (data.data.length === 0) {
          // Initialize default subjects if none exist
          await initializeSubjects()
        }
      }
    } catch (error) {
      toast.error('Failed to load subjects')
    }
  }

  const initializeSubjects = async () => {
    try {
      const { data } = await axios.get(backendUrl + '/api/v1/subjects/init')
      if (data.success) {
        setSubjects(data.data)
        toast.success('Subjects initialized successfully!')
      }
    } catch (error) {
      toast.error('Failed to initialize subjects')
    }
  }

  const loadStudyEntries = async () => {
    try {
      let url = backendUrl + '/api/v1/study'
      const params = new URLSearchParams()
      if (filterSubject) params.append('subject', filterSubject)
      if (filterDate) params.append('date', filterDate)
      if (params.toString()) url += '?' + params.toString()

      const { data } = await axios.get(url)
      if (data.success) {
        setStudyEntries(data.data)
      }
    } catch (error) {
      toast.error('Failed to load study entries')
    }
  }

  const loadStats = async () => {
    try {
      const { data } = await axios.get(backendUrl + '/api/v1/study/stats')
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Failed to load statistics:', error)
      toast.error('Failed to load statistics')
    }
  }

  const deleteStudyEntry = async (id) => {
    if (window.confirm('Are you sure you want to delete this study entry?')) {
      try {
        const { data } = await axios.delete(backendUrl + '/api/v1/study/' + id)
        if (data.success) {
          toast.success('Study entry deleted successfully!')
          loadStudyEntries()
          loadStats()
        }
      } catch (error) {
        toast.error('Failed to delete study entry')
      }
    }
  }

  const handleFormSuccess = () => {
    loadStudyEntries()
    loadStats()
    // Show success message and close form
    toast.success('Study entry saved! Your progress has been updated.')
  }

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const getConfidenceColor = (confidence) => {
    if (confidence >= 4) return 'text-green-600'
    if (confidence >= 3) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getCompletedActivities = (entry) => {
    const activities = []
    if (entry.reading?.completed) activities.push('📖 Reading')
    if (entry.grammar?.completed) activities.push('📝 Grammar')
    if (entry.writing?.completed) activities.push('✍️ Writing')
    if (entry.mathPractice?.completed) {
      // Show different icons based on subject
      if (entry.subject?.name === 'Maths') {
        activities.push('🔢 Math')
      } else {
        activities.push('🧮 Math')
      }
    }
    if (entry.sciencePractice?.completed) {
      // Show different icons based on subject
      if (entry.subject?.name === 'Biology') {
        activities.push('🧬 Biology')
      } else {
        activities.push('⚗️ Physics/Chemistry')
      }
    }
    if (entry.socialPractice?.completed) activities.push('🌍 Social')
    return activities
  }

  useEffect(() => {
    if (!authChecked) return
    if (!isLoggedin) return
    loadSubjects()
    loadStudyEntries()
    loadStats()
  }, [authChecked, isLoggedin])

  useEffect(() => {
    loadStudyEntries()
  }, [filterSubject, filterDate])

  if (!authChecked || !isLoggedin) {
    return <div className="p-6 text-center">Loading...</div>
  }

  return (
    <div className='min-h-screen bg-gray-50'>

      {/* Tabs */}
      <div className='bg-white border-b'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <nav className='flex space-x-8'>
            <button
              onClick={() => setActiveTab('tracker')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'tracker'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📚 Study Tracker
            </button>
            <button
              onClick={() => setActiveTab('progress')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'progress'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📊 Progress Dashboard
            </button>
            <button
              onClick={() => setActiveTab('streak')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'streak'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🔥 Streak & Revision
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'streak' ? (
        <StreakDashboard backendUrl={backendUrl} />
      ) : activeTab === 'progress' ? (
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
          <ProgressDashboard />
        </div>
      ) : (
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
          {/* Exam Countdown */}
          <div className='mb-6'>
            <ExamCountdown />
          </div>

          {/* Main Content */}
          <div className='space-y-6'>
            {/* Stats Overview */}
            {stats && (
              <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                <div className='bg-white p-4 rounded-lg shadow-sm border'>
                  <div className='text-sm text-gray-600'>Total Study Time</div>
                  <div className='text-2xl font-bold text-blue-600'>{formatDuration(stats.totalStudyTime)}</div>
                </div>
                <div className='bg-white p-4 rounded-lg shadow-sm border'>
                  <div className='text-sm text-gray-600'>Total Entries</div>
                  <div className='text-2xl font-bold text-green-600'>{stats.totalEntries}</div>
                </div>
                <div className='bg-white p-4 rounded-lg shadow-sm border'>
                  <div className='text-sm text-gray-600'>Avg Confidence</div>
                  <div className='text-2xl font-bold text-purple-600'>{stats.averageConfidence?.toFixed(1) || 0}/5</div>
                </div>
                <div className='bg-white p-4 rounded-lg shadow-sm border'>
                  <div className='text-sm text-gray-600'>Period</div>
                  <div className='text-2xl font-bold text-orange-600 capitalize'>{stats.period}</div>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className='bg-white p-4 rounded-lg shadow-sm border'>
              <div className='flex flex-wrap gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>Filter by Subject</label>
                  <select 
                    value={filterSubject} 
                    onChange={(e) => setFilterSubject(e.target.value)}
                    className='border border-gray-300 rounded-lg px-3 py-2'
                  >
                    <option value=''>All Subjects</option>
                    {subjects.map(subject => (
                      <option key={subject._id} value={subject._id}>
                        {subject.icon} {subject.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>Filter by Date</label>
                  <input 
                    type='date' 
                    value={filterDate} 
                    onChange={(e) => setFilterDate(e.target.value)}
                    className='border border-gray-300 rounded-lg px-3 py-2'
                  />
                </div>
              </div>
            </div>

            {/* Study Entries */}
            <div className='bg-white rounded-lg shadow-sm border'>
              <div className='p-4 border-b'>
                <h2 className='text-lg font-semibold text-gray-900'>Recent Study Entries</h2>
              </div>
              <div className='divide-y'>
                {studyEntries.length === 0 ? (
                  <div className='p-8 text-center text-gray-500'>
                    <div className='text-4xl mb-2'>📚</div>
                    <p>No study entries found. Start tracking your preparation!</p>
                  </div>
                ) : (
                  studyEntries.map(entry => (
                    <div key={entry._id} className='p-4 hover:bg-gray-50'>
                      <div className='flex justify-between items-start'>
                        <div className='flex-1'>
                          <div className='flex items-center space-x-2 mb-2'>
                            <span className='text-lg'>{entry.subject?.icon}</span>
                            <span className='font-medium text-gray-900'>{entry.subject?.name}</span>
                            {entry.lesson && (
                              <>
                                <span className='text-sm text-gray-500'>•</span>
                                <span className='text-sm text-gray-500'>Chapter {entry.lesson.chapterNumber}: {entry.lesson.name}</span>
                              </>
                            )}
                          </div>
                          
                          <div className='flex flex-wrap gap-2 mb-2'>
                            {getCompletedActivities(entry).map((activity, index) => (
                              <span key={index} className='bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full'>
                                {activity}
                              </span>
                            ))}
                          </div>

                          <div className='flex items-center space-x-4 text-sm text-gray-500'>
                            <span>⏱️ {formatDuration(entry.totalTime)}</span>
                            <span className={`font-medium ${getConfidenceColor(entry.confidence)}`}>
                              Confidence: {entry.confidence}/5
                            </span>
                            <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
                          </div>

                          {/* Show details for completed activities */}
                          {entry.reading?.completed && entry.reading.lessonName && (
                            <div className='text-sm text-gray-600 mt-2'>
                              <strong>Reading:</strong> {entry.reading.lessonName}
                            </div>
                          )}
                          {entry.grammar?.completed && entry.grammar.topic && (
                            <div className='text-sm text-gray-600 mt-2'>
                              <strong>Grammar:</strong> {entry.grammar.topic}
                            </div>
                          )}
                          {entry.writing?.completed && entry.writing.topic && (
                            <div className='text-sm text-gray-600 mt-2'>
                              <strong>Writing:</strong> {entry.writing.topic}
                            </div>
                          )}
                        </div>
                        <button 
                          onClick={() => deleteStudyEntry(entry._id)}
                          className='text-red-600 hover:text-red-800 text-sm'
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile-Optimized Floating Action Button */}
      <button 
        onClick={() => setShowAddForm(true)}
        className='fab-mobile'
        title='Add Study Entry'
      >
        +
      </button>

      {/* Study Entry Form */}
      {showAddForm && (
        <StudyEntryForm 
          subjects={subjects}
          onClose={() => setShowAddForm(false)}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  )
}

export default StudyTracker
