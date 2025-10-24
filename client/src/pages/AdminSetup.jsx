import React, { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

const AdminSetup = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    email: 'admin@tracker.com',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)

  const backendUrl = import.meta.env.VITE_BACKEND_URL

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    if (formData.email !== 'admin@tracker.com') {
      toast.error('Only admin@tracker.com is allowed for admin access')
      return
    }

    setLoading(true)
    try {
      const { data } = await axios.post(`${backendUrl}/api/v1/admin/setup/admin`, {
        name: formData.name,
        email: formData.email,
        password: formData.password
      })
      
      if (data.success) {
        toast.success('Admin user created successfully!')
        navigate('/login')
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create admin user')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center px-4'>
      <div className='max-w-md w-full bg-white rounded-lg shadow-lg p-8'>
        <div className='text-center mb-6'>
          <h1 className='text-2xl font-bold text-gray-900'>Admin Setup</h1>
          <p className='text-gray-600 mt-2'>Create the first admin user for the study tracker</p>
          <div className='mt-2'>
            <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800'>
              Admin Only Access
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Full Name</label>
            <input
              type='text'
              name='name'
              value={formData.name}
              onChange={handleInputChange}
              className='w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
              placeholder='Enter your full name'
              required
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Email</label>
            <input
              type='email'
              name='email'
              value={formData.email}
              onChange={handleInputChange}
              className='w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500'
              placeholder='admin@tracker.com'
              readOnly
              required
            />
            <p className='text-xs text-gray-500 mt-1'>Admin email is fixed to admin@tracker.com</p>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Password</label>
            <input
              type='password'
              name='password'
              value={formData.password}
              onChange={handleInputChange}
              className='w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
              placeholder='Enter password (min 6 characters)'
              required
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Confirm Password</label>
            <input
              type='password'
              name='confirmPassword'
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className='w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
              placeholder='Confirm your password'
              required
            />
          </div>

          <button
            type='submit'
            disabled={loading}
            className='w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 rounded-lg font-medium transition-colors'
          >
            {loading ? 'Creating Admin...' : 'Create Admin User'}
          </button>
        </form>

        <div className='mt-6 text-center'>
          <p className='text-sm text-gray-600'>
            Already have an admin account?{' '}
            <button
              onClick={() => navigate('/login')}
              className='text-blue-600 hover:text-blue-800 font-medium'
            >
              Login here
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default AdminSetup
