import React, { createContext, useContext, useState, useCallback, useRef } from 'react'
import axios from 'axios'

const DataCacheContext = createContext()

export const useDataCache = () => {
  const context = useContext(DataCacheContext)
  if (!context) {
    throw new Error('useDataCache must be used within a DataCacheProvider')
  }
  return context
}

export const DataCacheProvider = ({ children, backendUrl }) => {
  // Cache storage
  const [cache, setCache] = useState({})
  const [loading, setLoading] = useState({})
  const [lastFetch, setLastFetch] = useState({})
  
  // Cache configuration
  const CACHE_DURATION = {
    subjects: 5 * 60 * 1000, // 5 minutes
    studyEntries: 2 * 60 * 1000, // 2 minutes
    streakData: 1 * 60 * 1000, // 1 minute
    stats: 2 * 60 * 1000, // 2 minutes
    revisionPlan: 3 * 60 * 1000, // 3 minutes
    lessons: 10 * 60 * 1000, // 10 minutes
  }

  // Check if data is fresh
  const isDataFresh = useCallback((key) => {
    const lastFetchTime = lastFetch[key]
    if (!lastFetchTime) return false
    
    const cacheDuration = CACHE_DURATION[key] || 2 * 60 * 1000
    return Date.now() - lastFetchTime < cacheDuration
  }, [lastFetch])

  // Generic fetch function with caching
  const fetchData = useCallback(async (key, fetchFunction, forceRefresh = false) => {
    // Return cached data if fresh and not forcing refresh
    if (!forceRefresh && cache[key] && isDataFresh(key)) {
      return { data: cache[key], fromCache: true }
    }

    // Prevent duplicate requests
    if (loading[key]) {
      return new Promise((resolve) => {
        const checkLoading = () => {
          if (!loading[key]) {
            resolve({ data: cache[key], fromCache: true })
          } else {
            setTimeout(checkLoading, 100)
          }
        }
        checkLoading()
      })
    }

    setLoading(prev => ({ ...prev, [key]: true }))

    try {
      const data = await fetchFunction()
      setCache(prev => ({ ...prev, [key]: data }))
      setLastFetch(prev => ({ ...prev, [key]: Date.now() }))
      return { data, fromCache: false }
    } catch (error) {
      console.error(`Failed to fetch ${key}:`, error)
      throw error
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }))
    }
  }, [cache, loading, isDataFresh])

  // Specific data fetchers
  const fetchSubjects = useCallback((forceRefresh = false) => {
    return fetchData('subjects', async () => {
      const { data } = await axios.get(`${backendUrl}/api/v1/subjects`)
      return data.success ? data.data : []
    }, forceRefresh)
  }, [fetchData, backendUrl])

  const fetchStudyEntries = useCallback((params = {}, forceRefresh = false) => {
    const cacheKey = `studyEntries_${JSON.stringify(params)}`
    return fetchData(cacheKey, async () => {
      const queryParams = new URLSearchParams()
      if (params.limit) queryParams.append('limit', params.limit)
      if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom)
      if (params.subject) queryParams.append('subject', params.subject)
      if (params.date) queryParams.append('date', params.date)
      if (params.lesson) queryParams.append('lesson', params.lesson)
      
      const { data } = await axios.get(`${backendUrl}/api/v1/study?${queryParams}`)
      return data.success ? data.data : []
    }, forceRefresh)
  }, [fetchData, backendUrl])

  const fetchStreakData = useCallback((forceRefresh = false) => {
    return fetchData('streakData', async () => {
      // First refresh the streak
      await axios.post(`${backendUrl}/api/v1/streak/refresh`)
      const { data } = await axios.get(`${backendUrl}/api/v1/streak`)
      return data.success ? data.data : null
    }, forceRefresh)
  }, [fetchData, backendUrl])

  const fetchStats = useCallback((params = {}, forceRefresh = false) => {
    const cacheKey = `stats_${JSON.stringify(params)}`
    return fetchData(cacheKey, async () => {
      const queryParams = new URLSearchParams()
      if (params.period) queryParams.append('period', params.period)
      if (params.subject) queryParams.append('subject', params.subject)
      
      const { data } = await axios.get(`${backendUrl}/api/v1/study/stats?${queryParams}`)
      return data.success ? data.data : null
    }, forceRefresh)
  }, [fetchData, backendUrl])

  const fetchLessons = useCallback((subjectId, forceRefresh = false) => {
    const cacheKey = `lessons_${subjectId}`
    return fetchData(cacheKey, async () => {
      const { data } = await axios.get(`${backendUrl}/api/v1/lessons?subject=${subjectId}`)
      return data.success ? data.data : []
    }, forceRefresh)
  }, [fetchData, backendUrl])

  const fetchRevisionPlan = useCallback((forceRefresh = false) => {
    return fetchData('revisionPlan', async () => {
      const sixtyDaysAgo = new Date()
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)
      
      const { data } = await axios.get(`${backendUrl}/api/v1/study?limit=100&dateFrom=${sixtyDaysAgo.toISOString()}`)
      if (data.success) {
        return createRevisionPlan(data.data)
      }
      return []
    }, forceRefresh)
  }, [fetchData, backendUrl])

  // Revision plan creation logic
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
        return a.priority - b.priority
      }
      return new Date(a.revisionDate) - new Date(b.revisionDate)
    })
  }

  const calculateRevisionDate = (confidence, daysSinceStudy) => {
    const today = new Date()
    let daysToAdd = 0
    
    if (confidence >= 4) {
      if (daysSinceStudy >= 14) daysToAdd = 0
      else if (daysSinceStudy >= 7) daysToAdd = 3
      else daysToAdd = 7
    } else if (confidence >= 3) {
      if (daysSinceStudy >= 7) daysToAdd = 0
      else if (daysSinceStudy >= 3) daysToAdd = 2
      else daysToAdd = 5
    } else {
      if (daysSinceStudy >= 3) daysToAdd = 0
      else if (daysSinceStudy >= 1) daysToAdd = 1
      else daysToAdd = 2
    }
    
    const revisionDate = new Date(today)
    revisionDate.setDate(today.getDate() + daysToAdd)
    return revisionDate
  }

  const calculatePriority = (confidence, daysSinceStudy) => {
    if (confidence <= 2 && daysSinceStudy >= 7) return 1
    if (confidence <= 3 && daysSinceStudy >= 14) return 1
    if (confidence <= 2 && daysSinceStudy >= 3) return 2
    if (confidence <= 3 && daysSinceStudy >= 7) return 2
    if (confidence <= 4 && daysSinceStudy >= 21) return 2
    return 3
  }

  const getRevisionStatus = (revisionDate, today) => {
    const daysDiff = Math.floor((revisionDate - today) / (1000 * 60 * 60 * 24))
    
    if (daysDiff < 0) return 'overdue'
    if (daysDiff === 0) return 'today'
    if (daysDiff <= 2) return 'soon'
    return 'scheduled'
  }

  // Invalidate specific cache entries
  const invalidateCache = useCallback((keys) => {
    if (Array.isArray(keys)) {
      setCache(prev => {
        const newCache = { ...prev }
        keys.forEach(key => delete newCache[key])
        return newCache
      })
      setLastFetch(prev => {
        const newLastFetch = { ...prev }
        keys.forEach(key => delete newLastFetch[key])
        return newLastFetch
      })
    } else {
      setCache(prev => {
        const newCache = { ...prev }
        delete newCache[keys]
        return newCache
      })
      setLastFetch(prev => {
        const newLastFetch = { ...prev }
        delete newLastFetch[keys]
        return newLastFetch
      })
    }
  }, [])

  // Clear all cache
  const clearCache = useCallback(() => {
    setCache({})
    setLastFetch({})
  }, [])

  // Get cache status
  const getCacheStatus = useCallback(() => {
    const status = {}
    Object.keys(cache).forEach(key => {
      status[key] = {
        hasData: !!cache[key],
        isFresh: isDataFresh(key),
        lastFetch: lastFetch[key],
        isLoading: loading[key]
      }
    })
    return status
  }, [cache, lastFetch, loading, isDataFresh])

  const value = {
    // Data fetchers
    fetchSubjects,
    fetchStudyEntries,
    fetchStreakData,
    fetchStats,
    fetchLessons,
    fetchRevisionPlan,
    
    // Cache management
    invalidateCache,
    clearCache,
    getCacheStatus,
    
    // Direct cache access
    cache,
    loading,
    isDataFresh
  }

  return (
    <DataCacheContext.Provider value={value}>
      {children}
    </DataCacheContext.Provider>
  )
}

export default DataCacheContext
