import React, { useContext, useEffect, useState } from 'react'
import { AppContent } from '../context/AppContexts'
import axios from 'axios'
import { toast } from 'react-toastify'

const AdminPanel = () => {
  const { backendUrl, userData } = useContext(AppContent)
  const [subjects, setSubjects] = useState([])
  const [lessons, setLessons] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState(null)
  const [profile, setProfile] = useState(null)
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  
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

  useEffect(() => {
    // Check if user is admin
    if (userData?.email !== 'admin@tracker.com') {
      toast.error('Access denied. Admin privileges required.')
      return
    }
    
    loadSubjects()
    loadLessons()
    loadStats()
    loadProfile()
  }, [userData])

  const loadSubjects = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/v1/admin/subjects`)
      if (data.success) {
        setSubjects(data.data)
      }
    } catch (error) {
      toast.error('Failed to load subjects')
    }
  }

  const loadLessons = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/v1/admin/lessons/by-subject`)
      if (data.success) {
        setLessons(data.data)
      }
    } catch (error) {
      toast.error('Failed to load lessons')
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

  const handleSubjectSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await axios.post(`${backendUrl}/api/v1/admin/subjects`, subjectForm)
      if (data.success) {
        toast.success('Subject created successfully!')
        setSubjectForm({ name: '', totalMarks: '', color: '#3B82F6', icon: '📚', description: '' })
        loadSubjects()
      } else {
        toast.error(data.message)
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
      // Prepare form data, only include chapterNumber if it has a value
      const formData = {
        subject: lessonForm.subject,
        name: lessonForm.name,
        description: lessonForm.description
      }
      
      // Only add chapterNumber if it's not empty
      if (lessonForm.chapterNumber && lessonForm.chapterNumber.trim() !== '') {
        formData.chapterNumber = parseInt(lessonForm.chapterNumber)
      }
      
      const { data } = await axios.post(`${backendUrl}/api/v1/admin/lessons`, formData)
      if (data.success) {
        toast.success('Lesson created successfully!')
        setLessonForm({ name: '', chapterNumber: '', subject: '', description: '' })
        loadLessons()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.error('Lesson creation error:', error.response?.data || error.message)
      toast.error(error.response?.data?.message || 'Failed to create lesson')
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
        } else {
          toast.error(data.message)
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
        } else {
          toast.error(data.message)
        }
      } catch (error) {
        toast.error('Failed to delete lesson')
      }
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
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
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
          <div className='flex items-center space-x-4'>
            <div className='text-4xl'>👑</div>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>Admin Dashboard</h1>
              <p className='text-gray-600 mt-2'>Manage subjects, lessons, and monitor student progress</p>
              <div className='mt-2'>
                <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800'>
                  Admin Access
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
            <div className='bg-white p-6 rounded-lg shadow-sm border'>
              <div className='flex items-center'>
                <div className='text-2xl text-blue-600'>📚</div>
                <div className='ml-4'>
                  <div className='text-sm text-gray-600'>Total Subjects</div>
                  <div className='text-2xl font-bold text-gray-900'>{stats.totalSubjects}</div>
                </div>
              </div>
            </div>
            <div className='bg-white p-6 rounded-lg shadow-sm border'>
              <div className='flex items-center'>
                <div className='text-2xl text-green-600'>📖</div>
                <div className='ml-4'>
                  <div className='text-sm text-gray-600'>Total Lessons</div>
                  <div className='text-2xl font-bold text-gray-900'>{stats.totalLessons}</div>
                </div>
              </div>
            </div>
            <div className='bg-white p-6 rounded-lg shadow-sm border'>
              <div className='flex items-center'>
                <div className='text-2xl text-purple-600'>👥</div>
                <div className='ml-4'>
                  <div className='text-sm text-gray-600'>Total Students</div>
                  <div className='text-2xl font-bold text-gray-900'>{stats.totalStudents}</div>
                </div>
              </div>
            </div>
            <div className='bg-white p-6 rounded-lg shadow-sm border'>
              <div className='flex items-center'>
                <div className='text-2xl text-orange-600'>📝</div>
                <div className='ml-4'>
                  <div className='text-sm text-gray-600'>Study Entries</div>
                  <div className='text-2xl font-bold text-gray-900'>{stats.totalStudyEntries}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className='border-b border-gray-200 mb-6'>
          <nav className='-mb-px flex space-x-8'>
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📊 Overview
            </button>
            <button
              onClick={() => setActiveTab('subjects')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'subjects'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📚 Subjects
            </button>
            <button
              onClick={() => setActiveTab('lessons')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'lessons'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📖 Lessons
            </button>
            <button
              onClick={() => setActiveTab('progress')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'progress'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📈 Progress
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
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
              <h2 className='text-lg font-semibold text-gray-900 mb-4'>Admin Quick Actions</h2>
              <div className='space-y-3'>
                <button
                  onClick={() => setActiveTab('subjects')}
                  className='w-full text-left p-4 border-2 border-purple-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors'
                >
                  <div className='flex items-center space-x-3'>
                    <span className='text-2xl'>📚</span>
                    <div>
                      <div className='font-medium text-gray-900'>Manage Subjects</div>
                      <div className='text-sm text-gray-500'>Add, edit, or delete subjects for students</div>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('lessons')}
                  className='w-full text-left p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors'
                >
                  <div className='flex items-center space-x-3'>
                    <span className='text-2xl'>📖</span>
                    <div>
                      <div className='font-medium text-gray-900'>Manage Lessons</div>
                      <div className='text-sm text-gray-500'>Add, edit, or delete lessons for each subject</div>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('progress')}
                  className='w-full text-left p-4 border-2 border-green-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors'
                >
                  <div className='flex items-center space-x-3'>
                    <span className='text-2xl'>📈</span>
                    <div>
                      <div className='font-medium text-gray-900'>View Student Progress</div>
                      <div className='text-sm text-gray-500'>Monitor all student study progress</div>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className='w-full text-left p-4 border-2 border-orange-200 rounded-lg hover:bg-orange-50 hover:border-orange-300 transition-colors'
                >
                  <div className='flex items-center space-x-3'>
                    <span className='text-2xl'>👤</span>
                    <div>
                      <div className='font-medium text-gray-900'>Admin Profile</div>
                      <div className='text-sm text-gray-500'>Manage your admin account settings</div>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => window.open('/setup', '_blank')}
                  className='w-full text-left p-4 border-2 border-red-200 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors'
                >
                  <div className='flex items-center space-x-3'>
                    <span className='text-2xl'>⚙️</span>
                    <div>
                      <div className='font-medium text-gray-900'>System Setup</div>
                      <div className='text-sm text-gray-500'>Create admin users and initialize system</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className='bg-white rounded-lg shadow-sm border p-6'>
              <h2 className='text-lg font-semibold text-gray-900 mb-4'>Admin Information</h2>
              <div className='space-y-4'>
                <div className='bg-purple-50 p-4 rounded-lg'>
                  <div className='flex items-center space-x-2 mb-2'>
                    <span className='text-lg'>👑</span>
                    <span className='font-medium text-purple-900'>Admin Privileges</span>
                  </div>
                  <p className='text-sm text-purple-700'>You have full access to manage the study tracking system</p>
                </div>
                <div className='bg-blue-50 p-4 rounded-lg'>
                  <div className='flex items-center space-x-2 mb-2'>
                    <span className='text-lg'>📊</span>
                    <span className='font-medium text-blue-900'>System Overview</span>
                  </div>
                  <p className='text-sm text-blue-700'>Monitor all student activities and system statistics</p>
                </div>
                <div className='bg-green-50 p-4 rounded-lg'>
                  <div className='flex items-center space-x-2 mb-2'>
                    <span className='text-lg'>⚙️</span>
                    <span className='font-medium text-green-900'>Content Management</span>
                  </div>
                  <p className='text-sm text-green-700'>Add and manage subjects, lessons, and study materials</p>
                </div>
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

        {/* Progress Tab */}
        {activeTab === 'progress' && (
          <div className='bg-white rounded-lg shadow-sm border p-6'>
            <h2 className='text-lg font-semibold text-gray-900 mb-4'>Student Progress Overview</h2>
            <div className='text-center text-gray-500 py-8'>
              <div className='text-4xl mb-2'>📊</div>
              <p>Progress monitoring features coming soon...</p>
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