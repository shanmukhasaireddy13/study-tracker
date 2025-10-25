import React, { useContext, useEffect, useState } from 'react'
import axios from 'axios'
import { AppContent } from '../context/AppContexts'
import { getPhotoUrl } from '../utils/fileUpload'
import { formatIndianDate, formatIndianDateTime } from '../utils/timezone'
import DocumentViewer from './DocumentViewer'

const ProgressDashboard = ({ studentId = null, showHeader = true }) => {
  const { backendUrl } = useContext(AppContent)
  const [stats, setStats] = useState(null)
  const [subjects, setSubjects] = useState([])
  const [lessons, setLessons] = useState([])
  const [entries, setEntries] = useState([])
  const [selectedSubject, setSelectedSubject] = useState(null)
  const [selectedLesson, setSelectedLesson] = useState(null)
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [loading, setLoading] = useState(true)
  const [viewingDocument, setViewingDocument] = useState(null)

  const loadStats = async () => {
    try {
      const url = studentId 
        ? `${backendUrl}/api/v1/study/stats/admin?studentId=${studentId}`
        : `${backendUrl}/api/v1/study/stats`
      const { data } = await axios.get(url)
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Failed to load statistics:', error)
    }
  }

  const loadSubjects = async () => {
    try {
      const { data } = await axios.get(backendUrl + '/api/v1/subjects')
      if (data.success) {
        setSubjects(data.data)
      }
    } catch (error) {
      console.error('Failed to load subjects:', error)
    }
  }

  const loadLessons = async (subjectId) => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/v1/lessons?subject=${subjectId}`)
      if (data.success) {
        setLessons(data.data)
      }
    } catch (error) {
      console.error('Failed to load lessons:', error)
    }
  }

  const loadEntries = async (lessonId) => {
    try {
      const url = studentId 
        ? `${backendUrl}/api/v1/study?lesson=${lessonId}&studentId=${studentId}`
        : `${backendUrl}/api/v1/study?lesson=${lessonId}`
      const { data } = await axios.get(url)
      if (data.success) {
        // Get ALL entries without any date restrictions
        // Sort entries by date (newest first)
        const sortedEntries = data.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        setEntries(sortedEntries)
      }
    } catch (error) {
      console.error('Failed to load entries:', error)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([loadStats(), loadSubjects()])
      setLoading(false)
    }
    loadData()
  }, [])

  useEffect(() => {
    if (selectedSubject) {
      loadLessons(selectedSubject)
      setSelectedLesson(null)
      setSelectedEntry(null)
    }
  }, [selectedSubject])

  useEffect(() => {
    if (selectedLesson) {
      loadEntries(selectedLesson)
      setSelectedEntry(null)
    }
  }, [selectedLesson])

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const getProgressPercentage = (subjectTime, totalTime) => {
    if (totalTime === 0) return 0
    return Math.round((subjectTime / totalTime) * 100)
  }

  const getConfidenceColor = (confidence) => {
    if (confidence >= 4) return 'text-green-600 bg-green-100'
    if (confidence >= 3) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  if (loading) {
    return (
      <div className='bg-white rounded-lg border'>
        <div className='p-4'>
          <div className='animate-pulse'>
            <div className='h-4 bg-gray-200 rounded w-1/4 mb-4'></div>
            <div className='space-y-3'>
              <div className='h-3 bg-gray-200 rounded'></div>
              <div className='h-3 bg-gray-200 rounded w-5/6'></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='bg-white rounded-lg border'>
      {/* Header */}
      {showHeader && (
        <div className='px-4 py-3 border-b'>
          <h3 className='text-lg font-semibold text-gray-900'>Progress Dashboard</h3>
        </div>
      )}

      <div className='p-4'>
        {/* Overall Stats */}
        {stats && (
          <div className='grid grid-cols-3 gap-4 mb-4'>
            <div className='text-center p-3 bg-blue-50 rounded-lg'>
              <div className='text-xl font-bold text-blue-600'>{formatDuration(stats.totalStudyTime)}</div>
              <div className='text-xs text-gray-600'>Total Time</div>
            </div>
            <div className='text-center p-3 bg-green-50 rounded-lg'>
              <div className='text-xl font-bold text-green-600'>{stats.totalEntries}</div>
              <div className='text-xs text-gray-600'>Sessions</div>
            </div>
            <div className='text-center p-3 bg-purple-50 rounded-lg'>
              <div className='text-xl font-bold text-purple-600'>{stats.averageConfidence?.toFixed(1) || 0}/5</div>
              <div className='text-xs text-gray-600'>Avg Confidence</div>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className='grid grid-cols-1 lg:grid-cols-4 gap-4'>
          {/* Subject Selection */}
          <div className='lg:col-span-1'>
            <h4 className='text-sm font-medium text-gray-900 mb-2'>Subjects</h4>
            <div className='space-y-2'>
              {subjects.map(subject => (
                <button
                  key={subject._id}
                  onClick={() => setSelectedSubject(subject._id)}
                  className={`w-full p-2 rounded-lg border text-left transition-colors ${
                    selectedSubject === subject._id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className='flex items-center space-x-2'>
                    <span className='text-lg'>{subject.icon}</span>
                    <div>
                      <div className='font-medium text-sm'>{subject.name}</div>
                      <div className='text-xs text-gray-500'>{subject.totalMarks} marks</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Lesson Selection */}
          <div className='lg:col-span-1'>
            <h4 className='text-sm font-medium text-gray-900 mb-2'>Lessons</h4>
            {selectedSubject ? (
              lessons.length > 0 ? (
                <div className='space-y-1 max-h-64 overflow-y-auto'>
                  {lessons.map(lesson => (
                    <button
                      key={lesson._id}
                      onClick={() => setSelectedLesson(lesson._id)}
                      className={`w-full p-2 rounded-md text-left transition-colors ${
                        selectedLesson === lesson._id
                          ? 'bg-blue-100 text-blue-900'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className='text-sm font-medium'>Ch {lesson.chapterNumber}: {lesson.name}</div>
                      {lesson.description && (
                        <div className='text-xs text-gray-500 truncate'>{lesson.description}</div>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className='text-center text-gray-500 py-4'>
                  <div className='text-xl mb-1'>📖</div>
                  <p className='text-xs'>No lessons found</p>
                </div>
              )
            ) : (
              <div className='text-center text-gray-500 py-4'>
                <div className='text-xl mb-1'>📚</div>
                <p className='text-xs'>Select a subject</p>
              </div>
            )}
          </div>

          {/* Entries List */}
          <div className='lg:col-span-1'>
            <h4 className='text-sm font-medium text-gray-900 mb-2'>Study Entries</h4>
            {selectedLesson ? (
              entries.length > 0 ? (
                <div className='space-y-1 max-h-64 overflow-y-auto'>
                  {entries.map(entry => (
                    <button
                      key={entry._id}
                      onClick={() => setSelectedEntry(entry)}
                      className={`w-full p-2 rounded-md text-left transition-colors ${
                        selectedEntry?._id === entry._id
                          ? 'bg-green-100 text-green-900'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className='flex justify-between items-center'>
                        <div className='text-sm'>
                          {formatIndianDate(entry.createdAt)}
                        </div>
                        <div className={`px-2 py-1 rounded text-xs ${getConfidenceColor(entry.confidence)}`}>
                          {entry.confidence}/5
                        </div>
                      </div>
                      <div className='text-xs text-gray-500'>{formatDuration(entry.totalTime)}</div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className='text-center text-gray-500 py-4'>
                  <div className='text-xl mb-1'>📝</div>
                  <p className='text-xs'>No entries found</p>
                </div>
              )
            ) : (
              <div className='text-center text-gray-500 py-4'>
                <div className='text-xl mb-1'>📖</div>
                <p className='text-xs'>Select a lesson</p>
              </div>
            )}
          </div>

              {/* Entry Details */}
              <div className='lg:col-span-1'>
                <h4 className='text-sm font-medium text-gray-900 mb-2'>Entry Details</h4>
                {selectedEntry ? (
                  <div className='space-y-3 max-h-64 overflow-y-auto'>
                    {/* Basic Info */}
                <div className='space-y-2 text-sm'>
                  <div className='flex justify-between'>
                    <span className='text-gray-500'>Date:</span>
                    <span className='font-medium'>{formatIndianDate(selectedEntry.createdAt)}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-500'>Time:</span>
                    <span className='font-medium'>{formatDuration(selectedEntry.totalTime)}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-500'>Confidence:</span>
                    <span className={`font-medium ${getConfidenceColor(selectedEntry.confidence)}`}>
                      {selectedEntry.confidence}/5
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-500'>Subject:</span>
                    <span className='font-medium'>{selectedEntry.subject?.name}</span>
                  </div>
                </div>

                {/* Activities */}
                <div className='space-y-2'>
                  <h5 className='text-sm font-medium text-gray-900'>Activities:</h5>
                  <div className='space-y-1'>
                    {selectedEntry.reading?.completed && (
                      <div className='p-2 bg-blue-50 rounded-md'>
                        <div className='text-xs font-medium'>📖 Reading</div>
                        {selectedEntry.reading.notes && (
                          <div className='text-xs text-gray-600 mt-1 truncate'>{selectedEntry.reading.notes}</div>
                        )}
                      </div>
                    )}
                    
                    {selectedEntry.grammar?.completed && (
                      <div className='p-2 bg-green-50 rounded-md'>
                        <div className='text-xs font-medium'>📝 Grammar</div>
                        {selectedEntry.grammar.topic && (
                          <div className='text-xs text-gray-600 mt-1'>Topic: {selectedEntry.grammar.topic}</div>
                        )}
                        {(selectedEntry.grammar.photos?.length > 0 || selectedEntry.grammar.documents?.length > 0) && (
                          <div className='text-xs text-gray-600 mt-1'>
                            Files: {(selectedEntry.grammar.photos?.length || 0) + (selectedEntry.grammar.documents?.length || 0)}
                          </div>
                        )}
                        {/* Display Grammar Files */}
                        {(selectedEntry.grammar.photos?.length > 0 || selectedEntry.grammar.documents?.length > 0) && (
                          <div className='mt-2 space-y-2'>
                            <div className='text-xs font-medium text-gray-700'>Uploaded Files:</div>
                            <div className='space-y-1'>
                              {/* Photos */}
                              {selectedEntry.grammar.photos?.map((photo, index) => {
                                const photoUrl = getPhotoUrl(photo, backendUrl)
                                return (
                                  <button
                                    key={`photo-${index}`}
                                    onClick={() => {
                                      window.open(photoUrl, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes')
                                    }}
                                    className='w-full flex items-center justify-between p-2 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors'
                                  >
                                    <div className='flex items-center space-x-2'>
                                      <span className='text-blue-600'>🖼️</span>
                                      <span className='text-sm font-medium text-blue-900'>
                                        Image {index + 1}
                                      </span>
                                    </div>
                                    <span className='text-xs text-blue-600'>View</span>
                                  </button>
                                )
                              })}
                              {/* Documents */}
                              {selectedEntry.grammar.documents?.map((doc, index) => {
                                const docUrl = getPhotoUrl(doc.path, backendUrl)
                                return (
                                  <button
                                    key={`doc-${index}`}
                                    onClick={() => {
                                      setViewingDocument({
                                        url: docUrl,
                                        name: doc.originalName || `Document ${index + 1}`
                                      })
                                    }}
                                    className='w-full flex items-center justify-between p-2 bg-green-50 hover:bg-green-100 rounded border border-green-200 transition-colors'
                                  >
                                    <div className='flex items-center space-x-2'>
                                      <span className='text-green-600'>📄</span>
                                      <span className='text-sm font-medium text-green-900'>
                                        {doc.originalName || `Document ${index + 1}`}
                                      </span>
                                    </div>
                                    <span className='text-xs text-green-600'>View</span>
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {selectedEntry.writing?.completed && (
                      <div className='p-2 bg-yellow-50 rounded-md'>
                        <div className='text-xs font-medium'>✍️ Writing</div>
                        {selectedEntry.writing.type && (
                          <div className='text-xs text-gray-600 mt-1'>Type: {selectedEntry.writing.type}</div>
                        )}
                        {selectedEntry.writing.photos?.length > 0 && (
                          <div className='text-xs text-gray-600 mt-1'>
                            Photos: {selectedEntry.writing.photos.length}
                          </div>
                        )}
                        {/* Display Writing Files */}
                        {(selectedEntry.writing.photos?.length > 0 || selectedEntry.writing.documents?.length > 0) && (
                          <div className='mt-2 space-y-2'>
                            <div className='text-xs font-medium text-gray-700'>Uploaded Files:</div>
                            <div className='space-y-1'>
                              {/* Photos */}
                              {selectedEntry.writing.photos?.map((photo, index) => {
                                const photoUrl = getPhotoUrl(photo, backendUrl)
                                return (
                                  <button
                                    key={`photo-${index}`}
                                    onClick={() => {
                                      window.open(photoUrl, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes')
                                    }}
                                    className='w-full flex items-center justify-between p-2 bg-yellow-50 hover:bg-yellow-100 rounded border border-yellow-200 transition-colors'
                                  >
                                    <div className='flex items-center space-x-2'>
                                      <span className='text-yellow-600'>🖼️</span>
                                      <span className='text-sm font-medium text-yellow-900'>
                                        Image {index + 1}
                                      </span>
                                    </div>
                                    <span className='text-xs text-yellow-600'>View</span>
                                  </button>
                                )
                              })}
                              {/* Documents */}
                              {selectedEntry.writing.documents?.map((doc, index) => {
                                const docUrl = getPhotoUrl(doc.path, backendUrl)
                                return (
                                  <button
                                    key={`doc-${index}`}
                                    onClick={() => {
                                      setViewingDocument({
                                        url: docUrl,
                                        name: doc.originalName || `Document ${index + 1}`
                                      })
                                    }}
                                    className='w-full flex items-center justify-between p-2 bg-green-50 hover:bg-green-100 rounded border border-green-200 transition-colors'
                                  >
                                    <div className='flex items-center space-x-2'>
                                      <span className='text-green-600'>📄</span>
                                      <span className='text-sm font-medium text-green-900'>
                                        {doc.originalName || `Document ${index + 1}`}
                                      </span>
                                    </div>
                                    <span className='text-xs text-green-600'>View</span>
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {selectedEntry.mathPractice?.completed && (
                      <div className='p-2 bg-purple-50 rounded-md'>
                        <div className='text-xs font-medium'>🔢 Math</div>
                        {selectedEntry.mathPractice.problemsSolved > 0 && (
                          <div className='text-xs text-gray-600 mt-1'>
                            Problems: {selectedEntry.mathPractice.problemsSolved}
                          </div>
                        )}
                        {selectedEntry.mathPractice.photos?.length > 0 && (
                          <div className='text-xs text-gray-600 mt-1'>
                            Photos: {selectedEntry.mathPractice.photos.length}
                          </div>
                        )}
                        {/* Display Math Files */}
                        {(selectedEntry.mathPractice.photos?.length > 0 || selectedEntry.mathPractice.documents?.length > 0) && (
                          <div className='mt-2 space-y-2'>
                            <div className='text-xs font-medium text-gray-700'>Uploaded Files:</div>
                            <div className='space-y-1'>
                              {/* Photos */}
                              {selectedEntry.mathPractice.photos?.map((photo, index) => {
                                const photoUrl = getPhotoUrl(photo, backendUrl)
                                return (
                                  <button
                                    key={`photo-${index}`}
                                    onClick={() => {
                                      window.open(photoUrl, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes')
                                    }}
                                    className='w-full flex items-center justify-between p-2 bg-purple-50 hover:bg-purple-100 rounded border border-purple-200 transition-colors'
                                  >
                                    <div className='flex items-center space-x-2'>
                                      <span className='text-purple-600'>🖼️</span>
                                      <span className='text-sm font-medium text-purple-900'>
                                        Image {index + 1}
                                      </span>
                                    </div>
                                    <span className='text-xs text-purple-600'>View</span>
                                  </button>
                                )
                              })}
                              {/* Documents */}
                              {selectedEntry.mathPractice.documents?.map((doc, index) => {
                                const docUrl = getPhotoUrl(doc.path, backendUrl)
                                return (
                                  <button
                                    key={`doc-${index}`}
                                    onClick={() => {
                                      setViewingDocument({
                                        url: docUrl,
                                        name: doc.originalName || `Document ${index + 1}`
                                      })
                                    }}
                                    className='w-full flex items-center justify-between p-2 bg-green-50 hover:bg-green-100 rounded border border-green-200 transition-colors'
                                  >
                                    <div className='flex items-center space-x-2'>
                                      <span className='text-green-600'>📄</span>
                                      <span className='text-sm font-medium text-green-900'>
                                        {doc.originalName || `Document ${index + 1}`}
                                      </span>
                                    </div>
                                    <span className='text-xs text-green-600'>View</span>
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {selectedEntry.sciencePractice?.completed && (
                      <div className='p-2 bg-orange-50 rounded-md'>
                        <div className='text-xs font-medium'>⚗️ Science</div>
                        {selectedEntry.sciencePractice.diagrams && (
                          <div className='text-xs text-gray-600 mt-1'>✓ Diagrams</div>
                        )}
                        {selectedEntry.sciencePractice.photos?.length > 0 && (
                          <div className='text-xs text-gray-600 mt-1'>
                            Photos: {selectedEntry.sciencePractice.photos.length}
                          </div>
                        )}
                        {/* Display Science Files */}
                        {(selectedEntry.sciencePractice.photos?.length > 0 || selectedEntry.sciencePractice.documents?.length > 0) && (
                          <div className='mt-2 space-y-2'>
                            <div className='text-xs font-medium text-gray-700'>Uploaded Files:</div>
                            <div className='space-y-1'>
                              {/* Photos */}
                              {selectedEntry.sciencePractice.photos?.map((photo, index) => {
                                const photoUrl = getPhotoUrl(photo, backendUrl)
                                return (
                                  <button
                                    key={`photo-${index}`}
                                    onClick={() => {
                                      window.open(photoUrl, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes')
                                    }}
                                    className='w-full flex items-center justify-between p-2 bg-orange-50 hover:bg-orange-100 rounded border border-orange-200 transition-colors'
                                  >
                                    <div className='flex items-center space-x-2'>
                                      <span className='text-orange-600'>🖼️</span>
                                      <span className='text-sm font-medium text-orange-900'>
                                        Image {index + 1}
                                      </span>
                                    </div>
                                    <span className='text-xs text-orange-600'>View</span>
                                  </button>
                                )
                              })}
                              {/* Documents */}
                              {selectedEntry.sciencePractice.documents?.map((doc, index) => {
                                const docUrl = getPhotoUrl(doc.path, backendUrl)
                                return (
                                  <button
                                    key={`doc-${index}`}
                                    onClick={() => {
                                      setViewingDocument({
                                        url: docUrl,
                                        name: doc.originalName || `Document ${index + 1}`
                                      })
                                    }}
                                    className='w-full flex items-center justify-between p-2 bg-green-50 hover:bg-green-100 rounded border border-green-200 transition-colors'
                                  >
                                    <div className='flex items-center space-x-2'>
                                      <span className='text-green-600'>📄</span>
                                      <span className='text-sm font-medium text-green-900'>
                                        {doc.originalName || `Document ${index + 1}`}
                                      </span>
                                    </div>
                                    <span className='text-xs text-green-600'>View</span>
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {selectedEntry.socialPractice?.completed && (
                      <div className='p-2 bg-indigo-50 rounded-md'>
                        <div className='text-xs font-medium'>🌍 Social</div>
                        {selectedEntry.socialPractice.questionsAnswered > 0 && (
                          <div className='text-xs text-gray-600 mt-1'>
                            Questions: {selectedEntry.socialPractice.questionsAnswered}
                          </div>
                        )}
                        {selectedEntry.socialPractice.photos?.length > 0 && (
                          <div className='text-xs text-gray-600 mt-1'>
                            Photos: {selectedEntry.socialPractice.photos.length}
                          </div>
                        )}
                        {/* Display Social Files */}
                        {(selectedEntry.socialPractice.photos?.length > 0 || selectedEntry.socialPractice.documents?.length > 0) && (
                          <div className='mt-2 space-y-2'>
                            <div className='text-xs font-medium text-gray-700'>Uploaded Files:</div>
                            <div className='space-y-1'>
                              {/* Photos */}
                              {selectedEntry.socialPractice.photos?.map((photo, index) => {
                                const photoUrl = getPhotoUrl(photo, backendUrl)
                                return (
                                  <button
                                    key={`photo-${index}`}
                                    onClick={() => {
                                      window.open(photoUrl, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes')
                                    }}
                                    className='w-full flex items-center justify-between p-2 bg-indigo-50 hover:bg-indigo-100 rounded border border-indigo-200 transition-colors'
                                  >
                                    <div className='flex items-center space-x-2'>
                                      <span className='text-indigo-600'>🖼️</span>
                                      <span className='text-sm font-medium text-indigo-900'>
                                        Image {index + 1}
                                      </span>
                                    </div>
                                    <span className='text-xs text-indigo-600'>View</span>
                                  </button>
                                )
                              })}
                              {/* Documents */}
                              {selectedEntry.socialPractice.documents?.map((doc, index) => {
                                const docUrl = getPhotoUrl(doc.path, backendUrl)
                                return (
                                  <button
                                    key={`doc-${index}`}
                                    onClick={() => {
                                      setViewingDocument({
                                        url: docUrl,
                                        name: doc.originalName || `Document ${index + 1}`
                                      })
                                    }}
                                    className='w-full flex items-center justify-between p-2 bg-green-50 hover:bg-green-100 rounded border border-green-200 transition-colors'
                                  >
                                    <div className='flex items-center space-x-2'>
                                      <span className='text-green-600'>📄</span>
                                      <span className='text-sm font-medium text-green-900'>
                                        {doc.originalName || `Document ${index + 1}`}
                                      </span>
                                    </div>
                                    <span className='text-xs text-green-600'>View</span>
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className='text-center text-gray-500 py-4'>
                <div className='text-xl mb-1'>📝</div>
                <p className='text-xs'>Select an entry</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Document Viewer Modal */}
      {viewingDocument && (
        <DocumentViewer
          documentUrl={viewingDocument.url}
          documentName={viewingDocument.name}
          onClose={() => setViewingDocument(null)}
        />
      )}
    </div>
  )
}

export default ProgressDashboard
