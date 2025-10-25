import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { uploadStudyPhotos, validateFiles, getPhotoUrl, getFileTypeIcon, formatFileSize } from '../utils/fileUpload'

const StudyEntryForm = ({ subjects, onClose, onSuccess, existingEntry }) => {
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedLesson, setSelectedLesson] = useState('')
  const [lessons, setLessons] = useState([])
  const [loading, setLoading] = useState(false)
  
  // Form data
  const [formData, setFormData] = useState({
    reading: { completed: false, notes: '' },
    grammar: { completed: false, topic: '', photos: [], documents: [], notes: '' },
    writing: { completed: false, type: 'questions', topic: '', photos: [], documents: [], notes: '' },
    mathPractice: { completed: false, formulas: [], problemsSolved: 0, photos: [], documents: [], notes: '' },
    sciencePractice: { completed: false, diagrams: false, questionsAnswered: 0, photos: [], documents: [], notes: '' },
    socialPractice: { completed: false, questionsAnswered: 0, photos: [], documents: [], notes: '' },
    confidence: 3,
    totalTime: 0
  })

  const backendUrl = import.meta.env.VITE_BACKEND_URL

  useEffect(() => {
    if (existingEntry) {
      setFormData(existingEntry)
      setSelectedSubject(existingEntry.subject?._id || '')
      setSelectedLesson(existingEntry.lesson?._id || '')
    }
  }, [existingEntry])

  useEffect(() => {
    if (selectedSubject) {
      loadLessons(selectedSubject)
    }
  }, [selectedSubject])


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

  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
  }

  const handleTopLevelChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleArrayChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value.split(',').map(item => item.trim()).filter(item => item)
      }
    }))
  }

  const handleFileUpload = async (section, files) => {
    try {
      // Validate files
      validateFiles(files)
      
      // Store files for later upload
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          photos: Array.from(files),
          completed: true
        }
      }))
      
      toast.success(`${files.length} file(s) selected for ${section}`)
    } catch (error) {
      toast.error(error.message)
    }
  }

  const removeFile = (section, fileIndex) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        photos: prev[section].photos.filter((_, index) => index !== fileIndex)
      }
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedSubject) {
      toast.error('Please select a subject')
      return
    }
    
    if (!selectedLesson) {
      toast.error('Please select a lesson')
      return
    }

    setLoading(true)
    try {
      // First, create the study entry without photos
      const payload = {
        subject: selectedSubject,
        lesson: selectedLesson,
        ...formData
      }

      // Remove photos and documents from payload as they'll be uploaded separately
      const cleanPayload = { ...payload }
      Object.keys(cleanPayload).forEach(key => {
        if (cleanPayload[key] && typeof cleanPayload[key] === 'object') {
          cleanPayload[key] = { ...cleanPayload[key] }
          delete cleanPayload[key].photos
          delete cleanPayload[key].documents
        }
      })

      const { data } = await axios.post(`${backendUrl}/api/v1/study`, cleanPayload)
      if (data.success) {
        const entryId = data.data._id
        
        // Upload photos for each activity type
        const photoUploadPromises = []
        
        Object.keys(formData).forEach(activityType => {
          const activity = formData[activityType]
          if (activity && activity.photos && activity.photos.length > 0) {
            photoUploadPromises.push(
              uploadStudyPhotos(entryId, activityType, activity.photos, backendUrl)
            )
          }
        })

        // Wait for all photo uploads to complete
        if (photoUploadPromises.length > 0) {
          await Promise.all(photoUploadPromises)
        }

        toast.success('Study entry saved successfully!')
        onSuccess()
        onClose()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.error('Study entry error:', error.response?.data || error.message)
      toast.error(error.response?.data?.message || 'Failed to save study entry')
    } finally {
      setLoading(false)
    }
  }

  const getSubjectType = (subjectId) => {
    const subject = subjects.find(s => s._id === subjectId)
    if (!subject) return 'general'
    
    // Use subject type from database only
    return subject.type || 'general'
  }

  const subjectType = getSubjectType(selectedSubject)

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
      <div className='bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
        <div className='p-6'>
          <div className='flex justify-between items-center mb-4'>
            <h2 className='text-xl font-semibold'>Add Study Entry</h2>
            <button 
              onClick={onClose}
              className='text-gray-400 hover:text-gray-600 text-xl'
            >
              ✕
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className='space-y-6'>
            {/* Subject Selection */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>Subject</label>
              <select 
                value={selectedSubject} 
                onChange={(e) => setSelectedSubject(e.target.value)}
                className='w-full border border-gray-300 rounded-lg px-3 py-2'
                required
              >
                <option value=''>Select Subject</option>
                {subjects.map(subject => (
                  <option key={subject._id} value={subject._id}>
                    {subject.icon} {subject.name} ({subject.totalMarks} marks)
                  </option>
                ))}
              </select>
            </div>

            {/* Lesson Selection */}
            {selectedSubject && (
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>Lesson <span className='text-red-500'>*</span></label>
                <select 
                  value={selectedLesson} 
                  onChange={(e) => setSelectedLesson(e.target.value)}
                  className='w-full border border-gray-300 rounded-lg px-3 py-2'
                  required
                >
                  <option value=''>Select Lesson</option>
                  {lessons.map(lesson => (
                    <option key={lesson._id} value={lesson._id}>
                      Chapter {lesson.chapterNumber}: {lesson.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Reading Section */}
            <div className='border rounded-lg p-4'>
              <div className='flex items-center mb-3'>
                <input 
                  type='checkbox' 
                  checked={formData.reading.completed}
                  onChange={(e) => handleInputChange('reading', 'completed', e.target.checked)}
                  className='mr-2'
                />
                <h3 className='font-medium text-gray-900'>📖 Reading</h3>
              </div>
              {selectedLesson && (
                <div className='mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg'>
                  <div className='text-sm text-blue-800'>
                    <strong>Selected Lesson:</strong> {lessons.find(l => l._id === selectedLesson)?.name}
                  </div>
                </div>
              )}
              {formData.reading.completed && (
                <div className='space-y-3'>
                  <div>
                    <label className='block text-sm text-gray-600 mb-1'>Reading Notes</label>
                    <textarea 
                      value={formData.reading.notes}
                      onChange={(e) => handleInputChange('reading', 'notes', e.target.value)}
                      className='w-full border border-gray-300 rounded-lg px-3 py-2'
                      rows={2}
                      placeholder='Any notes about the reading...'
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Grammar Section (only for languages) */}
            {subjectType === 'language' && (
              <div className='border rounded-lg p-4'>
                <div className='flex items-center mb-3'>
                  <input 
                    type='checkbox' 
                    checked={formData.grammar.completed}
                    onChange={(e) => handleInputChange('grammar', 'completed', e.target.checked)}
                    className='mr-2'
                  />
                  <h3 className='font-medium text-gray-900'>📝 Grammar Practice</h3>
                </div>
                {formData.grammar.completed && (
                  <div className='space-y-3'>
                    <div>
                      <label className='block text-sm text-gray-600 mb-1'>Grammar Topic</label>
                      <input 
                        type='text' 
                        value={formData.grammar.topic}
                        onChange={(e) => handleInputChange('grammar', 'topic', e.target.value)}
                        className='w-full border border-gray-300 rounded-lg px-3 py-2'
                        placeholder='e.g., Tenses, Articles, Prepositions'
                      />
                    </div>
                    <div>
                      <label className='block text-sm text-gray-600 mb-1'>Upload Files (Images, PDFs, Word docs)</label>
                      <input 
                        type='file' 
                        multiple
                        accept='image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                        onChange={(e) => handleFileUpload('grammar', e.target.files)}
                        className='w-full border border-gray-300 rounded-lg px-3 py-2'
                      />
                      {formData.grammar.photos.length > 0 && (
                        <div className='mt-2 space-y-1'>
                          {formData.grammar.photos.map((file, index) => (
                            <div key={index} className='flex items-center justify-between p-2 bg-gray-50 rounded border'>
                              <div className='flex items-center space-x-2'>
                                <span className='text-lg'>{getFileTypeIcon(file.type)}</span>
                                <div>
                                  <div className='text-sm font-medium'>{file.name}</div>
                                  <div className='text-xs text-gray-500'>{formatFileSize(file.size)}</div>
                                </div>
                              </div>
                              <button
                                type='button'
                                onClick={() => removeFile('grammar', index)}
                                className='text-red-500 hover:text-red-700 text-sm'
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className='block text-sm text-gray-600 mb-1'>Notes</label>
                      <textarea 
                        value={formData.grammar.notes}
                        onChange={(e) => handleInputChange('grammar', 'notes', e.target.value)}
                        className='w-full border border-gray-300 rounded-lg px-3 py-2'
                        rows={2}
                        placeholder='Any notes about grammar practice...'
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Writing Section */}
            <div className='border rounded-lg p-4'>
              <div className='flex items-center mb-3'>
                <input 
                  type='checkbox' 
                  checked={formData.writing.completed}
                  onChange={(e) => handleInputChange('writing', 'completed', e.target.checked)}
                  className='mr-2'
                />
                <h3 className='font-medium text-gray-900'>✍️ Writing Practice</h3>
              </div>
              {formData.writing.completed && (
                <div className='space-y-3'>
                  <div>
                    <label className='block text-sm text-gray-600 mb-1'>Writing Type</label>
                    <select 
                      value={formData.writing.type}
                      onChange={(e) => handleInputChange('writing', 'type', e.target.value)}
                      className='w-full border border-gray-300 rounded-lg px-3 py-2'
                    >
                      <option value='questions'>Questions & Answers</option>
                      <option value='letters'>Letter Writing</option>
                      <option value='essays'>Essay Writing</option>
                      <option value='other'>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className='block text-sm text-gray-600 mb-1'>Topic</label>
                    <input 
                      type='text' 
                      value={formData.writing.topic}
                      onChange={(e) => handleInputChange('writing', 'topic', e.target.value)}
                      className='w-full border border-gray-300 rounded-lg px-3 py-2'
                      placeholder='e.g., Formal Letter to Principal'
                    />
                  </div>
                  <div>
                    <label className='block text-sm text-gray-600 mb-1'>Upload Files (Images, PDFs, Word docs)</label>
                    <input 
                      type='file' 
                      multiple
                      accept='image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                      onChange={(e) => handleFileUpload('writing', e.target.files)}
                      className='w-full border border-gray-300 rounded-lg px-3 py-2'
                    />
                    {formData.writing.photos.length > 0 && (
                      <div className='mt-2 space-y-1'>
                        {formData.writing.photos.map((file, index) => (
                          <div key={index} className='flex items-center justify-between p-2 bg-gray-50 rounded border'>
                            <div className='flex items-center space-x-2'>
                              <span className='text-lg'>{getFileTypeIcon(file.type)}</span>
                              <div>
                                <div className='text-sm font-medium'>{file.name}</div>
                                <div className='text-xs text-gray-500'>{formatFileSize(file.size)}</div>
                              </div>
                            </div>
                            <button
                              type='button'
                              onClick={() => removeFile('writing', index)}
                              className='text-red-500 hover:text-red-700 text-sm'
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className='block text-sm text-gray-600 mb-1'>Notes</label>
                    <textarea 
                      value={formData.writing.notes}
                      onChange={(e) => handleInputChange('writing', 'notes', e.target.value)}
                      className='w-full border border-gray-300 rounded-lg px-3 py-2'
                      rows={2}
                      placeholder='Any notes about writing practice...'
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Math Practice */}
            {subjectType === 'maths' && (
              <div className='border rounded-lg p-4'>
                <div className='flex items-center mb-3'>
                  <input 
                    type='checkbox' 
                    checked={formData.mathPractice.completed}
                    onChange={(e) => handleInputChange('mathPractice', 'completed', e.target.checked)}
                    className='mr-2'
                  />
                  <h3 className='font-medium text-gray-900'>🔢 Math Practice</h3>
                </div>
                {formData.mathPractice.completed && (
                  <div className='space-y-3'>
                    <div>
                      <label className='block text-sm text-gray-600 mb-1'>Formulas Practiced (comma-separated)</label>
                      <input 
                        type='text' 
                        value={formData.mathPractice.formulas.join(', ')}
                        onChange={(e) => handleArrayChange('mathPractice', 'formulas', e.target.value)}
                        className='w-full border border-gray-300 rounded-lg px-3 py-2'
                        placeholder='e.g., (a+b)²=a²+2ab+b², Area=πr²'
                      />
                    </div>
                    <div>
                      <label className='block text-sm text-gray-600 mb-1'>Problems Solved</label>
                      <input 
                        type='number' 
                        value={formData.mathPractice.problemsSolved}
                        onChange={(e) => handleInputChange('mathPractice', 'problemsSolved', parseInt(e.target.value))}
                        className='w-full border border-gray-300 rounded-lg px-3 py-2'
                        min='0'
                      />
                    </div>
                    <div>
                      <label className='block text-sm text-gray-600 mb-1'>Upload Files (Images, PDFs, Word docs)</label>
                      <input 
                        type='file' 
                        multiple
                        accept='image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                        onChange={(e) => handleFileUpload('mathPractice', e.target.files)}
                        className='w-full border border-gray-300 rounded-lg px-3 py-2'
                      />
                      {formData.mathPractice.photos.length > 0 && (
                        <div className='mt-2 space-y-1'>
                          {formData.mathPractice.photos.map((file, index) => (
                            <div key={index} className='flex items-center justify-between p-2 bg-gray-50 rounded border'>
                              <div className='flex items-center space-x-2'>
                                <span className='text-lg'>{getFileTypeIcon(file.type)}</span>
                                <div>
                                  <div className='text-sm font-medium'>{file.name}</div>
                                  <div className='text-xs text-gray-500'>{formatFileSize(file.size)}</div>
                                </div>
                              </div>
                              <button
                                type='button'
                                onClick={() => removeFile('mathPractice', index)}
                                className='text-red-500 hover:text-red-700 text-sm'
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className='block text-sm text-gray-600 mb-1'>Notes</label>
                      <textarea 
                        value={formData.mathPractice.notes}
                        onChange={(e) => handleInputChange('mathPractice', 'notes', e.target.value)}
                        className='w-full border border-gray-300 rounded-lg px-3 py-2'
                        rows={2}
                        placeholder='Any notes about math practice...'
                      />
                    </div>
                  </div>
                )}
              </div>
            )}


            {/* Science Practice */}
            {subjectType === 'science' && (
              <div className='border rounded-lg p-4'>
                <div className='flex items-center mb-3'>
                  <input 
                    type='checkbox' 
                    checked={formData.sciencePractice.completed}
                    onChange={(e) => handleInputChange('sciencePractice', 'completed', e.target.checked)}
                    className='mr-2'
                  />
                  <h3 className='font-medium text-gray-900'>
                    ⚗️ Science Practice
                  </h3>
                </div>
                {formData.sciencePractice.completed && (
                  <div className='space-y-3'>
                    <div className='flex items-center'>
                      <input 
                        type='checkbox' 
                        checked={formData.sciencePractice.diagrams}
                        onChange={(e) => handleInputChange('sciencePractice', 'diagrams', e.target.checked)}
                        className='mr-2'
                      />
                      <label className='text-sm text-gray-600'>Drew diagrams</label>
                    </div>
                    <div>
                      <label className='block text-sm text-gray-600 mb-1'>Questions Answered</label>
                      <input 
                        type='number' 
                        value={formData.sciencePractice.questionsAnswered}
                        onChange={(e) => handleInputChange('sciencePractice', 'questionsAnswered', parseInt(e.target.value))}
                        className='w-full border border-gray-300 rounded-lg px-3 py-2'
                        min='0'
                      />
                    </div>
                    <div>
                      <label className='block text-sm text-gray-600 mb-1'>
                        Upload Files (Images, PDFs, Word docs)
                      </label>
                      <input 
                        type='file' 
                        multiple
                        accept='image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                        onChange={(e) => handleFileUpload('sciencePractice', e.target.files)}
                        className='w-full border border-gray-300 rounded-lg px-3 py-2'
                      />
                      {formData.sciencePractice.photos.length > 0 && (
                        <div className='mt-2 space-y-1'>
                          {formData.sciencePractice.photos.map((file, index) => (
                            <div key={index} className='flex items-center justify-between p-2 bg-gray-50 rounded border'>
                              <div className='flex items-center space-x-2'>
                                <span className='text-lg'>{getFileTypeIcon(file.type)}</span>
                                <div>
                                  <div className='text-sm font-medium'>{file.name}</div>
                                  <div className='text-xs text-gray-500'>{formatFileSize(file.size)}</div>
                                </div>
                              </div>
                              <button
                                type='button'
                                onClick={() => removeFile('sciencePractice', index)}
                                className='text-red-500 hover:text-red-700 text-sm'
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className='block text-sm text-gray-600 mb-1'>Notes</label>
                      <textarea 
                        value={formData.sciencePractice.notes}
                        onChange={(e) => handleInputChange('sciencePractice', 'notes', e.target.value)}
                        className='w-full border border-gray-300 rounded-lg px-3 py-2'
                        rows={2}
                        placeholder='Any notes about science practice...'
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Social Studies Practice */}
            {subjectType === 'social' && (
              <div className='border rounded-lg p-4'>
                <div className='flex items-center mb-3'>
                  <input 
                    type='checkbox' 
                    checked={formData.socialPractice.completed}
                    onChange={(e) => handleInputChange('socialPractice', 'completed', e.target.checked)}
                    className='mr-2'
                  />
                  <h3 className='font-medium text-gray-900'>🌍 Social Studies Practice</h3>
                </div>
                {formData.socialPractice.completed && (
                  <div className='space-y-3'>
                    <div>
                      <label className='block text-sm text-gray-600 mb-1'>Questions Answered</label>
                      <input 
                        type='number' 
                        value={formData.socialPractice.questionsAnswered}
                        onChange={(e) => handleInputChange('socialPractice', 'questionsAnswered', parseInt(e.target.value))}
                        className='w-full border border-gray-300 rounded-lg px-3 py-2'
                        min='0'
                      />
                    </div>
                    <div>
                      <label className='block text-sm text-gray-600 mb-1'>Upload Files (Images, PDFs, Word docs)</label>
                      <input 
                        type='file' 
                        multiple
                        accept='image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                        onChange={(e) => handleFileUpload('socialPractice', e.target.files)}
                        className='w-full border border-gray-300 rounded-lg px-3 py-2'
                      />
                      {formData.socialPractice.photos.length > 0 && (
                        <div className='mt-2 space-y-1'>
                          {formData.socialPractice.photos.map((file, index) => (
                            <div key={index} className='flex items-center justify-between p-2 bg-gray-50 rounded border'>
                              <div className='flex items-center space-x-2'>
                                <span className='text-lg'>{getFileTypeIcon(file.type)}</span>
                                <div>
                                  <div className='text-sm font-medium'>{file.name}</div>
                                  <div className='text-xs text-gray-500'>{formatFileSize(file.size)}</div>
                                </div>
                              </div>
                              <button
                                type='button'
                                onClick={() => removeFile('socialPractice', index)}
                                className='text-red-500 hover:text-red-700 text-sm'
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className='block text-sm text-gray-600 mb-1'>Notes</label>
                      <textarea 
                        value={formData.socialPractice.notes}
                        onChange={(e) => handleInputChange('socialPractice', 'notes', e.target.value)}
                        className='w-full border border-gray-300 rounded-lg px-3 py-2'
                        rows={2}
                        placeholder='Any notes about social studies practice...'
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Overall Assessment */}
            <div className='border rounded-lg p-4'>
              <h3 className='font-medium text-gray-900 mb-3'>📊 Overall Assessment</h3>
              <div className='space-y-3'>
                <div>
                  <label className='block text-sm text-gray-600 mb-1'>Confidence Level (1-5)</label>
                  <input 
                    type='range' 
                    min='1' 
                    max='5' 
                    value={formData.confidence} 
                    onChange={(e) => handleTopLevelChange('confidence', parseInt(e.target.value))}
                    className='w-full'
                  />
                  <div className='flex justify-between text-xs text-gray-500 mt-1'>
                    <span>1 - Not confident</span>
                    <span>3 - Neutral</span>
                    <span>5 - Very confident</span>
                  </div>
                  <div className='text-center text-sm text-gray-600 mt-2 font-medium'>
                    {formData.confidence}/5 - {
                      formData.confidence === 1 ? 'Not confident' :
                      formData.confidence === 2 ? 'Somewhat confident' :
                      formData.confidence === 3 ? 'Neutral' :
                      formData.confidence === 4 ? 'Confident' :
                      'Very confident'
                    }
                  </div>
                </div>
                <div>
                  <label className='block text-sm text-gray-600 mb-1'>Total Time Spent (minutes)</label>
                  <input 
                    type='number' 
                    value={formData.totalTime}
                    onChange={(e) => handleTopLevelChange('totalTime', parseInt(e.target.value))}
                    className='w-full border border-gray-300 rounded-lg px-3 py-2'
                    min='0'
                    placeholder='e.g., 60 for 1 hour'
                  />
                  <div className='text-xs text-gray-500 mt-1'>
                    💡 Tip: Track your actual study time to build better habits
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className='flex space-x-3 pt-4'>
              <button 
                type='submit'
                disabled={loading}
                className='flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 rounded-lg font-medium'
              >
                {loading ? 'Saving...' : 'Save Entry'}
              </button>
              <button 
                type='button'
                onClick={onClose}
                className='flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 rounded-lg font-medium'
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default StudyEntryForm
