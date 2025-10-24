import React, { useContext, useEffect, useState, useMemo } from 'react'
import { AppContent } from '../context/AppContexts'
import axios from 'axios'
import { toast } from 'react-toastify'
import AdminProgressDashboard from '../components/AdminProgressDashboard'

const AdminPanel = () => {
  const { backendUrl, userData } = useContext(AppContent)
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(false)
  
  // Data states
  const [studentPerformance, setStudentPerformance] = useState([])
  const [systemAnalytics, setSystemAnalytics] = useState(null)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [studentDetails, setStudentDetails] = useState(null)
  const [viewingStudentProgress, setViewingStudentProgress] = useState(false)
  const [subjects, setSubjects] = useState([])
  const [lessons, setLessons] = useState([])
  const [stats, setStats] = useState(null)
  const [profile, setProfile] = useState(null)
  
  // Form states
  const [subjectForm, setSubjectForm] = useState({
    name: '',
    totalMarks: '',
    color: '#3B82F6',
    icon: '📚',
    description: ''
  })
  
  const [lessonForm, setLessonForm] = useState({
    name: '',
    chapterNumber: '',
    subject: '',
    description: ''
  })

  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  // Filters and search
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('totalStudyTime')
  const [filterBy, setFilterBy] = useState('all')

  useEffect(() => {
    if (userData?.email !== 'admin@tracker.com') {
      toast.error('Access denied. Admin privileges required.')
      return
    }
    
    loadAllData()
  }, [userData])

  const loadAllData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        loadStudentPerformance(),
        loadSystemAnalytics(),
        loadSubjects(),
        loadLessons(),
        loadStats(),
        loadProfile()
      ])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const viewStudentProgress = (student) => {
    setSelectedStudent(student)
    setViewingStudentProgress(true)
  }

  const backToStudents = () => {
    setViewingStudentProgress(false)
    setSelectedStudent(null)
  }

  const loadStudentPerformance = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/v1/admin/students/performance`)
      if (data.success) {
        setStudentPerformance(data.data.students)
      }
    } catch (error) {
      console.error('Failed to load student performance:', error)
    }
  }

  const loadSystemAnalytics = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/v1/admin/analytics`)
      if (data.success) {
        setSystemAnalytics(data.data)
      }
    } catch (error) {
      console.error('Failed to load system analytics:', error)
    }
  }

  const loadSubjects = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/v1/admin/subjects`)
      if (data.success) {
        setSubjects(data.data)
      }
    } catch (error) {
      console.error('Failed to load subjects:', error)
    }
  }

  const loadLessons = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/v1/admin/lessons/by-subject`)
      if (data.success) {
        setLessons(data.data)
      }
    } catch (error) {
      console.error('Failed to load lessons:', error)
    }
  }

  const loadStats = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/v1/admin/stats`)
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const loadProfile = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/v1/admin/profile`)
      if (data.success) {
        setProfile(data.data)
        setProfileForm({
          name: data.data.name,
          email: data.data.email,
          password: '',
          confirmPassword: ''
        })
      }
    } catch (error) {
      console.error('Failed to load profile:', error)
    }
  }

  const loadStudentDetails = async (studentId) => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/v1/admin/students/${studentId}/performance`)
      if (data.success) {
        setStudentDetails(data.data)
      }
    } catch (error) {
      console.error('Failed to load student details:', error)
      toast.error('Failed to load student details')
    }
  }

  // Filtered and sorted students
  const filteredStudents = useMemo(() => {
    let filtered = studentPerformance

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(student => 
        student.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.student.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (filterBy !== 'all') {
      filtered = filtered.filter(student => {
        switch (filterBy) {
          case 'active':
            return student.performance.recentActivity > 0
          case 'inactive':
            return student.performance.recentActivity === 0
          case 'high_performers':
            return student.performance.averageConfidence >= 4
          case 'struggling':
            return student.performance.averageConfidence < 3
          default:
            return true
        }
      })
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'totalStudyTime':
          return b.performance.totalStudyTime - a.performance.totalStudyTime
        case 'totalEntries':
          return b.performance.totalEntries - a.performance.totalEntries
        case 'averageConfidence':
          return b.performance.averageConfidence - a.performance.averageConfidence
        case 'currentStreak':
          return b.performance.currentStreak - a.performance.currentStreak
        case 'name':
          return a.student.name.localeCompare(b.student.name)
        default:
          return 0
      }
    })

    return filtered
  }, [studentPerformance, searchTerm, sortBy, filterBy])

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const getPerformanceColor = (confidence) => {
    if (confidence >= 4) return 'text-green-600'
    if (confidence >= 3) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getPerformanceBadge = (confidence) => {
    if (confidence >= 4) return 'bg-green-100 text-green-800'
    if (confidence >= 3) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  // Form handlers
  const handleSubjectSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await axios.post(`${backendUrl}/api/v1/admin/subjects`, subjectForm)
      if (data.success) {
        toast.success('Subject created successfully!')
        setSubjectForm({ name: '', totalMarks: '', color: '#3B82F6', icon: '📚', description: '' })
        loadSubjects()
      }
    } catch (error) {
      toast.error('Failed to create subject')
    } finally {
      setLoading(false)
    }
  }

  const handleLessonSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const formData = {
        subject: lessonForm.subject,
        name: lessonForm.name,
        description: lessonForm.description
      }
      
      if (lessonForm.chapterNumber && lessonForm.chapterNumber.trim() !== '') {
        formData.chapterNumber = parseInt(lessonForm.chapterNumber)
      }
      
      const { data } = await axios.post(`${backendUrl}/api/v1/admin/lessons`, formData)
      if (data.success) {
        toast.success('Lesson created successfully!')
        setLessonForm({ name: '', chapterNumber: '', subject: '', description: '' })
        loadLessons()
      }
    } catch (error) {
      toast.error('Failed to create lesson')
    } finally {
      setLoading(false)
    }
  }

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    
    if (profileForm.password && profileForm.password !== profileForm.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (profileForm.password && profileForm.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      const { data } = await axios.put(`${backendUrl}/api/v1/admin/profile`, {
        name: profileForm.name,
        password: profileForm.password || undefined
      })
      
      if (data.success) {
        toast.success('Profile updated successfully!')
        setProfileForm({ ...profileForm, password: '', confirmPassword: '' })
        loadProfile()
      }
    } catch (error) {
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const deleteSubject = async (subjectId) => {
    if (window.confirm('Are you sure you want to delete this subject?')) {
      try {
        const { data } = await axios.delete(`${backendUrl}/api/v1/admin/subjects/${subjectId}`)
        if (data.success) {
          toast.success('Subject deleted successfully!')
          loadSubjects()
        }
      } catch (error) {
        toast.error('Failed to delete subject')
      }
    }
  }

  const deleteLesson = async (lessonId) => {
    if (window.confirm('Are you sure you want to delete this lesson?')) {
      try {
        const { data } = await axios.delete(`${backendUrl}/api/v1/admin/lessons/${lessonId}`)
        if (data.success) {
          toast.success('Lesson deleted successfully!')
          loadLessons()
        }
      } catch (error) {
        toast.error('Failed to delete lesson')
      }
    }
  }

  // Check if user is admin
  if (!userData) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='text-4xl mb-4'>⏳</div>
          <h1 className='text-2xl font-bold text-gray-900 mb-2'>Loading...</h1>
          <p className='text-gray-600'>Please wait while we verify your access.</p>
        </div>
      </div>
    )
  }

  if (userData?.email !== 'admin@tracker.com') {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='text-6xl mb-4'>🚫</div>
          <h1 className='text-2xl font-bold text-gray-900 mb-2'>Access Denied</h1>
          <p className='text-gray-600'>Admin privileges required to access this page.</p>
          <p className='text-sm text-gray-500 mt-2'>Current user: {userData?.email || 'Unknown'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-purple-50 to-blue-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
        {/* Header */}
        <div className='mb-8 bg-white rounded-lg shadow-sm border p-6'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-4'>
              <div className='text-4xl'>👑</div>
              <div>
                <h1 className='text-3xl font-bold text-gray-900'>Admin Dashboard</h1>
                <p className='text-gray-600 mt-2'>Comprehensive student performance monitoring and system management</p>
                <div className='mt-2'>
                  <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800'>
                    Admin Access
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={loadAllData}
              disabled={loading}
              className='px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium'
            >
              {loading ? 'Refreshing...' : '🔄 Refresh Data'}
            </button>
          </div>
        </div>

        {/* Student Progress Dashboard */}
        {viewingStudentProgress && selectedStudent && (
          <div className='mb-8'>
            <AdminProgressDashboard 
              selectedStudent={selectedStudent} 
              onBack={backToStudents}
            />
          </div>
        )}

        {/* System Overview Stats */}
        {systemAnalytics && (
          <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
            <div className='bg-white p-6 rounded-lg shadow-sm border'>
              <div className='flex items-center'>
                <div className='text-2xl text-blue-600'>👥</div>
                <div className='ml-4'>
                  <div className='text-sm text-gray-600'>Total Students</div>
                  <div className='text-2xl font-bold text-gray-900'>{systemAnalytics.overview.totalStudents}</div>
                </div>
              </div>
            </div>
            <div className='bg-white p-6 rounded-lg shadow-sm border'>
              <div className='flex items-center'>
                <div className='text-2xl text-green-600'>📝</div>
                <div className='ml-4'>
                  <div className='text-sm text-gray-600'>Total Entries</div>
                  <div className='text-2xl font-bold text-gray-900'>{systemAnalytics.overview.totalEntries}</div>
                </div>
              </div>
            </div>
            <div className='bg-white p-6 rounded-lg shadow-sm border'>
              <div className='flex items-center'>
                <div className='text-2xl text-purple-600'>⏱️</div>
                <div className='ml-4'>
                  <div className='text-sm text-gray-600'>Total Study Time</div>
                  <div className='text-2xl font-bold text-gray-900'>{formatDuration(systemAnalytics.overview.totalStudyTime)}</div>
                </div>
              </div>
            </div>
            <div className='bg-white p-6 rounded-lg shadow-sm border'>
              <div className='flex items-center'>
                <div className='text-2xl text-orange-600'>⭐</div>
                <div className='ml-4'>
                  <div className='text-sm text-gray-600'>Avg Confidence</div>
                  <div className='text-2xl font-bold text-gray-900'>{systemAnalytics.overview.averageConfidence.toFixed(1)}/5</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className='border-b border-gray-200 mb-6'>
          <nav className='-mb-px flex space-x-8 overflow-x-auto'>
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📊 Overview
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'students'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              👥 Students ({studentPerformance.length})
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'analytics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📈 Analytics
            </button>
            <button
              onClick={() => setActiveTab('subjects')}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'subjects'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📚 Subjects
            </button>
            <button
              onClick={() => setActiveTab('lessons')}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'lessons'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📖 Lessons
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'profile'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              👤 Profile
            </button>
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <div className='bg-white rounded-lg shadow-sm border p-6'>
              <h2 className='text-lg font-semibold text-gray-900 mb-4'>Quick Actions</h2>
              <div className='space-y-3'>
                <button
                  onClick={() => setActiveTab('students')}
                  className='w-full text-left p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors'
                >
                  <div className='flex items-center space-x-3'>
                    <span className='text-2xl'>👥</span>
                    <div>
                      <div className='font-medium text-gray-900'>View All Students</div>
                      <div className='text-sm text-gray-500'>Monitor student performance and progress</div>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className='w-full text-left p-4 border-2 border-green-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors'
                >
                  <div className='flex items-center space-x-3'>
                    <span className='text-2xl'>📈</span>
                    <div>
                      <div className='font-medium text-gray-900'>System Analytics</div>
                      <div className='text-sm text-gray-500'>View detailed system performance metrics</div>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('subjects')}
                  className='w-full text-left p-4 border-2 border-purple-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors'
                >
                  <div className='flex items-center space-x-3'>
                    <span className='text-2xl'>📚</span>
                    <div>
                      <div className='font-medium text-gray-900'>Manage Subjects</div>
                      <div className='text-sm text-gray-500'>Add, edit, or delete subjects</div>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('lessons')}
                  className='w-full text-left p-4 border-2 border-orange-200 rounded-lg hover:bg-orange-50 hover:border-orange-300 transition-colors'
                >
                  <div className='flex items-center space-x-3'>
                    <span className='text-2xl'>📖</span>
                    <div>
                      <div className='font-medium text-gray-900'>Manage Lessons</div>
                      <div className='text-sm text-gray-500'>Add, edit, or delete lessons</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className='bg-white rounded-lg shadow-sm border p-6'>
              <h2 className='text-lg font-semibold text-gray-900 mb-4'>Top Performers</h2>
              <div className='space-y-3'>
                {studentPerformance.slice(0, 5).map((student, index) => (
                  <div key={student.student.id} className='flex items-center justify-between p-3 border rounded-lg'>
                    <div className='flex items-center space-x-3'>
                      <div className='text-lg font-bold text-gray-400'>#{index + 1}</div>
                      <div>
                        <div className='font-medium text-gray-900'>{student.student.name}</div>
                        <div className='text-sm text-gray-500'>{formatDuration(student.performance.totalStudyTime)}</div>
                      </div>
                    </div>
                    <div className='text-right'>
                      <div className={`text-sm font-medium ${getPerformanceColor(student.performance.averageConfidence)}`}>
                        {student.performance.averageConfidence}/5
                      </div>
                      <div className='text-xs text-gray-500'>{student.performance.totalEntries} entries</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className='space-y-6'>
            {/* Filters and Search */}
            <div className='bg-white rounded-lg shadow-sm border p-6'>
              <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>Search Students</label>
                  <input
                    type='text'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder='Search by name or email...'
                    className='w-full border border-gray-300 rounded-lg px-3 py-2'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>Filter By</label>
                  <select
                    value={filterBy}
                    onChange={(e) => setFilterBy(e.target.value)}
                    className='w-full border border-gray-300 rounded-lg px-3 py-2'
                  >
                    <option value='all'>All Students</option>
                    <option value='active'>Active (Recent Activity)</option>
                    <option value='inactive'>Inactive</option>
                    <option value='high_performers'>High Performers (4+ Confidence)</option>
                    <option value='struggling'>Struggling (&lt;3 Confidence)</option>
                  </select>
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className='w-full border border-gray-300 rounded-lg px-3 py-2'
                  >
                    <option value='totalStudyTime'>Study Time</option>
                    <option value='totalEntries'>Total Entries</option>
                    <option value='averageConfidence'>Confidence</option>
                    <option value='currentStreak'>Current Streak</option>
                    <option value='name'>Name</option>
                  </select>
                </div>
                <div className='flex items-end'>
                  <button
                    onClick={() => {
                      setSearchTerm('')
                      setFilterBy('all')
                      setSortBy('totalStudyTime')
                    }}
                    className='w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50'
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>

            {/* Students List */}
            <div className='bg-white rounded-lg shadow-sm border'>
              <div className='p-6 border-b'>
                <h2 className='text-lg font-semibold text-gray-900'>Student Performance ({filteredStudents.length} students)</h2>
              </div>
              <div className='divide-y'>
                {filteredStudents.map(student => (
                  <div key={student.student.id} className='p-6 hover:bg-gray-50'>
                    <div className='flex items-center justify-between'>
                      <div className='flex-1'>
                        <div className='flex items-center space-x-4'>
                          <div>
                            <h3 className='text-lg font-medium text-gray-900'>{student.student.name}</h3>
                            <p className='text-sm text-gray-500'>{student.student.email}</p>
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getPerformanceBadge(student.performance.averageConfidence)}`}>
                            {student.performance.averageConfidence}/5 Confidence
                          </div>
                        </div>
                        
                        <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mt-4'>
                          <div>
                            <div className='text-sm text-gray-600'>Study Time</div>
                            <div className='text-lg font-semibold text-gray-900'>{formatDuration(student.performance.totalStudyTime)}</div>
                          </div>
                          <div>
                            <div className='text-sm text-gray-600'>Total Entries</div>
                            <div className='text-lg font-semibold text-gray-900'>{student.performance.totalEntries}</div>
                          </div>
                          <div>
                            <div className='text-sm text-gray-600'>Current Streak</div>
                            <div className='text-lg font-semibold text-gray-900'>{student.performance.currentStreak} days</div>
                          </div>
                          <div>
                            <div className='text-sm text-gray-600'>Recent Activity</div>
                            <div className='text-lg font-semibold text-gray-900'>{student.performance.recentActivity} entries</div>
                          </div>
                        </div>

                        {student.performance.lastStudyDate && (
                          <div className='mt-2 text-sm text-gray-500'>
                            Last studied: {new Date(student.performance.lastStudyDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      
                      <div className='ml-6 flex space-x-2'>
                        <button
                          onClick={() => {
                            setSelectedStudent(student)
                            loadStudentDetails(student.student.id)
                          }}
                          className='px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium'
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => viewStudentProgress(student.student)}
                          className='px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium'
                        >
                          View Progress
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Student Details Modal */}
        {selectedStudent && studentDetails && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
            <div className='bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto'>
              <div className='p-6 border-b'>
                <div className='flex items-center justify-between'>
                  <h2 className='text-xl font-semibold text-gray-900'>
                    {selectedStudent.student.name} - Detailed Performance
                  </h2>
                  <button
                    onClick={() => {
                      setSelectedStudent(null)
                      setStudentDetails(null)
                    }}
                    className='text-gray-400 hover:text-gray-600'
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              <div className='p-6 space-y-6'>
                {/* Performance Overview */}
                <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                  <div className='bg-blue-50 p-4 rounded-lg'>
                    <div className='text-sm text-blue-600'>Total Study Time</div>
                    <div className='text-2xl font-bold text-blue-900'>{formatDuration(studentDetails.performance.totalStudyTime)}</div>
                  </div>
                  <div className='bg-green-50 p-4 rounded-lg'>
                    <div className='text-sm text-green-600'>Total Entries</div>
                    <div className='text-2xl font-bold text-green-900'>{studentDetails.performance.totalEntries}</div>
                  </div>
                  <div className='bg-purple-50 p-4 rounded-lg'>
                    <div className='text-sm text-purple-600'>Avg Confidence</div>
                    <div className='text-2xl font-bold text-purple-900'>{studentDetails.performance.averageConfidence}/5</div>
                  </div>
                  <div className='bg-orange-50 p-4 rounded-lg'>
                    <div className='text-sm text-orange-600'>Current Streak</div>
                    <div className='text-2xl font-bold text-orange-900'>{studentDetails.performance.currentStreak} days</div>
                  </div>
                </div>

                {/* Subject Performance */}
                <div>
                  <h3 className='text-lg font-semibold text-gray-900 mb-4'>Subject-wise Performance</h3>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    {studentDetails.subjectDetails.map(subject => (
                      <div key={subject.subject._id} className='border rounded-lg p-4'>
                        <div className='flex items-center space-x-2 mb-2'>
                          <span className='text-lg'>{subject.subject.icon}</span>
                          <h4 className='font-medium text-gray-900'>{subject.subject.name}</h4>
                        </div>
                        <div className='space-y-2'>
                          <div className='flex justify-between text-sm'>
                            <span className='text-gray-600'>Study Time:</span>
                            <span className='font-medium'>{formatDuration(subject.totalTime)}</span>
                          </div>
                          <div className='flex justify-between text-sm'>
                            <span className='text-gray-600'>Entries:</span>
                            <span className='font-medium'>{subject.entries.length}</span>
                          </div>
                          <div className='flex justify-between text-sm'>
                            <span className='text-gray-600'>Avg Confidence:</span>
                            <span className={`font-medium ${getPerformanceColor(subject.averageConfidence)}`}>
                              {subject.averageConfidence}/5
                            </span>
                          </div>
                          {subject.lastStudied && (
                            <div className='flex justify-between text-sm'>
                              <span className='text-gray-600'>Last Studied:</span>
                              <span className='font-medium'>{new Date(subject.lastStudied).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Activity */}
                <div>
                  <h3 className='text-lg font-semibold text-gray-900 mb-4'>Recent Study Entries</h3>
                  <div className='space-y-2 max-h-64 overflow-y-auto'>
                    {studentDetails.recentEntries.map(entry => (
                      <div key={entry._id} className='flex items-center justify-between p-3 border rounded-lg'>
                        <div className='flex items-center space-x-3'>
                          <span className='text-lg'>{entry.subject?.icon}</span>
                          <div>
                            <div className='font-medium text-gray-900'>{entry.subject?.name}</div>
                            {entry.lesson && (
                              <div className='text-sm text-gray-500'>Chapter {entry.lesson.chapterNumber}: {entry.lesson.name}</div>
                            )}
                          </div>
                        </div>
                        <div className='text-right'>
                          <div className='text-sm font-medium text-gray-900'>{formatDuration(entry.totalTime)}</div>
                          <div className={`text-sm ${getPerformanceColor(entry.confidence)}`}>
                            {entry.confidence}/5
                          </div>
                          <div className='text-xs text-gray-500'>{new Date(entry.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && systemAnalytics && (
          <div className='space-y-6'>
            {/* Most Active Students */}
            <div className='bg-white rounded-lg shadow-sm border p-6'>
              <h2 className='text-lg font-semibold text-gray-900 mb-4'>Most Active Students (Last 7 Days)</h2>
              <div className='space-y-3'>
                {systemAnalytics.activeStudents.map((student, index) => (
                  <div key={student._id} className='flex items-center justify-between p-3 border rounded-lg'>
                    <div className='flex items-center space-x-3'>
                      <div className='text-lg font-bold text-gray-400'>#{index + 1}</div>
                      <div>
                        <div className='font-medium text-gray-900'>{student.studentName}</div>
                        <div className='text-sm text-gray-500'>{student.studentEmail}</div>
                      </div>
                    </div>
                    <div className='text-right'>
                      <div className='text-lg font-semibold text-gray-900'>{formatDuration(student.totalTime)}</div>
                      <div className='text-sm text-gray-500'>{student.entries} entries</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Subject Popularity */}
            <div className='bg-white rounded-lg shadow-sm border p-6'>
              <h2 className='text-lg font-semibold text-gray-900 mb-4'>Subject Popularity</h2>
              <div className='space-y-3'>
                {systemAnalytics.subjectPopularity.map((subject, index) => (
                  <div key={subject._id} className='flex items-center justify-between p-3 border rounded-lg'>
                    <div className='flex items-center space-x-3'>
                      <div className='text-lg font-bold text-gray-400'>#{index + 1}</div>
                      <span className='text-lg'>{subject.subjectIcon}</span>
                      <div>
                        <div className='font-medium text-gray-900'>{subject.subjectName}</div>
                        <div className='text-sm text-gray-500'>{subject.entries} entries</div>
                      </div>
                    </div>
                    <div className='text-right'>
                      <div className='text-lg font-semibold text-gray-900'>{formatDuration(subject.totalTime)}</div>
                      <div className='text-sm text-gray-500'>total time</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Subjects Tab */}
        {activeTab === 'subjects' && (
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Add Subject Form */}
            <div className='bg-white rounded-lg shadow-sm border p-6'>
              <h2 className='text-lg font-semibold text-gray-900 mb-4'>Add New Subject</h2>
              <form onSubmit={handleSubjectSubmit} className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>Subject Name</label>
                  <input
                    type='text'
                    value={subjectForm.name}
                    onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                    className='w-full border border-gray-300 rounded-lg px-3 py-2'
                    required
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>Total Marks</label>
                  <input
                    type='number'
                    value={subjectForm.totalMarks}
                    onChange={(e) => setSubjectForm({ ...subjectForm, totalMarks: e.target.value })}
                    className='w-full border border-gray-300 rounded-lg px-3 py-2'
                    required
                  />
                </div>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>Color</label>
                    <input
                      type='color'
                      value={subjectForm.color}
                      onChange={(e) => setSubjectForm({ ...subjectForm, color: e.target.value })}
                      className='w-full border border-gray-300 rounded-lg px-3 py-2'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>Icon</label>
                    <input
                      type='text'
                      value={subjectForm.icon}
                      onChange={(e) => setSubjectForm({ ...subjectForm, icon: e.target.value })}
                      className='w-full border border-gray-300 rounded-lg px-3 py-2'
                      placeholder='📚'
                    />
                  </div>
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>Description</label>
                  <textarea
                    value={subjectForm.description}
                    onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })}
                    className='w-full border border-gray-300 rounded-lg px-3 py-2'
                    rows={3}
                  />
                </div>
                <button
                  type='submit'
                  disabled={loading}
                  className='w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 rounded-lg font-medium'
                >
                  {loading ? 'Creating...' : 'Create Subject'}
                </button>
              </form>
            </div>

            {/* Subjects List */}
            <div className='bg-white rounded-lg shadow-sm border p-6'>
              <h2 className='text-lg font-semibold text-gray-900 mb-4'>All Subjects</h2>
              <div className='space-y-3'>
                {subjects.map(subject => (
                  <div key={subject._id} className='flex items-center justify-between p-3 border rounded-lg'>
                    <div className='flex items-center space-x-3'>
                      <span className='text-lg'>{subject.icon}</span>
                      <div>
                        <div className='font-medium text-gray-900'>{subject.name}</div>
                        <div className='text-sm text-gray-500'>{subject.totalMarks} marks</div>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteSubject(subject._id)}
                      className='text-red-600 hover:text-red-800 text-sm'
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Lessons Tab */}
        {activeTab === 'lessons' && (
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Add Lesson Form */}
            <div className='bg-white rounded-lg shadow-sm border p-6'>
              <h2 className='text-lg font-semibold text-gray-900 mb-4'>Add New Lesson</h2>
              <form onSubmit={handleLessonSubmit} className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>Subject</label>
                  <select
                    value={lessonForm.subject}
                    onChange={(e) => setLessonForm({ ...lessonForm, subject: e.target.value })}
                    className='w-full border border-gray-300 rounded-lg px-3 py-2'
                    required
                  >
                    <option value=''>Select Subject</option>
                    {subjects.map(subject => (
                      <option key={subject._id} value={subject._id}>
                        {subject.icon} {subject.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>Lesson Name</label>
                  <input
                    type='text'
                    value={lessonForm.name}
                    onChange={(e) => setLessonForm({ ...lessonForm, name: e.target.value })}
                    className='w-full border border-gray-300 rounded-lg px-3 py-2'
                    required
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>Chapter Number</label>
                  <input
                    type='number'
                    value={lessonForm.chapterNumber}
                    onChange={(e) => setLessonForm({ ...lessonForm, chapterNumber: e.target.value })}
                    className='w-full border border-gray-300 rounded-lg px-3 py-2'
                    required
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>Description</label>
                  <textarea
                    value={lessonForm.description}
                    onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                    className='w-full border border-gray-300 rounded-lg px-3 py-2'
                    rows={3}
                  />
                </div>
                <button
                  type='submit'
                  disabled={loading}
                  className='w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 rounded-lg font-medium'
                >
                  {loading ? 'Creating...' : 'Create Lesson'}
                </button>
              </form>
            </div>

            {/* Lessons List */}
            <div className='bg-white rounded-lg shadow-sm border p-6'>
              <h2 className='text-lg font-semibold text-gray-900 mb-4'>All Lessons</h2>
              <div className='space-y-3'>
                {lessons && Array.isArray(lessons) ? lessons.map(subjectData => (
                  <div key={subjectData.subject._id} className='mb-4'>
                    <div className='flex items-center space-x-2 mb-2'>
                      <span className='text-lg'>{subjectData.subject.icon}</span>
                      <h3 className='font-medium text-gray-900'>{subjectData.subject.name}</h3>
                    </div>
                    <div className='space-y-2'>
                      {Array.isArray(subjectData.lessons) && subjectData.lessons.length > 0 ? subjectData.lessons.map(lesson => (
                        <div key={lesson._id} className='flex items-center justify-between p-2 border rounded'>
                          <div>
                            <div className='font-medium text-sm'>Chapter {lesson.chapterNumber}: {lesson.name}</div>
                            {lesson.description && (
                              <div className='text-xs text-gray-500'>{lesson.description}</div>
                            )}
                          </div>
                          <button
                            onClick={() => deleteLesson(lesson._id)}
                            className='text-red-600 hover:text-red-800 text-xs'
                          >
                            Delete
                          </button>
                        </div>
                      )) : (
                        <div className='text-sm text-gray-500 p-2'>No lessons found for this subject</div>
                      )}
                    </div>
                  </div>
                )) : (
                  <div className='text-center text-gray-500 py-8'>
                    <div className='text-4xl mb-2'>📖</div>
                    <p>No lessons found. Create some lessons to get started!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className='max-w-2xl mx-auto'>
            <div className='bg-white rounded-lg shadow-sm border p-6'>
              <h2 className='text-lg font-semibold text-gray-900 mb-6'>Admin Profile Settings</h2>
              
              {profile && (
                <form onSubmit={handleProfileUpdate} className='space-y-6'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>Name</label>
                      <input
                        type='text'
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        className='w-full border border-gray-300 rounded-lg px-3 py-2'
                        required
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>Email</label>
                      <input
                        type='email'
                        value={profileForm.email}
                        className='w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100'
                        readOnly
                      />
                      <p className='text-xs text-gray-500 mt-1'>Email cannot be changed</p>
                    </div>
                  </div>
                  
                  <div className='border-t pt-6'>
                    <h3 className='text-md font-medium text-gray-900 mb-4'>Change Password</h3>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>New Password</label>
                        <input
                          type='password'
                          value={profileForm.password}
                          onChange={(e) => setProfileForm({ ...profileForm, password: e.target.value })}
                          className='w-full border border-gray-300 rounded-lg px-3 py-2'
                          placeholder='Leave blank to keep current password'
                        />
                      </div>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>Confirm Password</label>
                        <input
                          type='password'
                          value={profileForm.confirmPassword}
                          onChange={(e) => setProfileForm({ ...profileForm, confirmPassword: e.target.value })}
                          className='w-full border border-gray-300 rounded-lg px-3 py-2'
                          placeholder='Confirm new password'
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className='flex justify-end space-x-3 pt-4'>
                    <button
                      type='button'
                      onClick={() => setProfileForm({ ...profileForm, password: '', confirmPassword: '' })}
                      className='px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50'
                    >
                      Cancel
                    </button>
                    <button
                      type='submit'
                      disabled={loading}
                      className='px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg'
                    >
                      {loading ? 'Updating...' : 'Update Profile'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminPanel