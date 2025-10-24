import React, { useContext, useEffect, useState } from 'react'
import axios from 'axios'
import { AppContent } from '../context/AppContexts'
import { useNavigate } from 'react-router-dom'

const Home = () => {
  const navigate = useNavigate()
  const { backendUrl, userData, isLoggedin, authChecked, setIsLoggedin, setUserData } = useContext(AppContent)
  const [notes, setNotes] = useState([])
  const [content, setContent] = useState('')

  const load = async () => {
    const { data } = await axios.get(backendUrl + '/api/v1/notes')
    if (data.success) setNotes(data.data)
  }
  const add = async (e) => {
    e.preventDefault()
    const { data } = await axios.post(backendUrl + '/api/v1/notes', { content })
    if (data.success) { setContent(''); load() }
  }
  const del = async (id) => {
    await axios.delete(backendUrl + '/api/v1/notes/' + id)
    load()
  }

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

  useEffect(() => {
    if (!authChecked) return
    if (!isLoggedin) return
    // user is authenticated - load notes
    load()
  }, [authChecked, isLoggedin])
  return (
    <div className='p-6 max-w-3xl mx-auto'>
      <div className='flex justify-between items-center mb-4'>
        <h1 className='text-2xl font-semibold'>Notes</h1>
        <div className='flex space-x-3'>
          <button 
            onClick={() => navigate('/study')}
            className='bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium'
          >
            📚 Study Tracker
          </button>
        </div>
      </div>
      <form onSubmit={add} className='flex gap-2 mb-4'>
        <input className='border p-2 flex-1' placeholder='Write a note...' value={content} onChange={e=>setContent(e.target.value)} />
        <button className='bg-blue-600 text-white px-4'>Add</button>
      </form>
      <ul className='space-y-2'>
        {notes.map(n => (
          <li key={n._id} className='border p-3 flex justify-between'>
            <div className='text-gray-800 whitespace-pre-wrap'>{n.content}</div>
            <button onClick={()=>del(n._id)} className='text-red-600'>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default Home
