import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContent } from '../context/AppContexts'
import axios from 'axios'
import { toast } from 'react-toastify'

const Login = () => {

    const navigate = useNavigate()
    const{backendUrl, setIsLoggedin, getUserData, isLoggedin, authChecked} = useContext(AppContent)

    const [state, setState] = useState('Sign Up')
    const [name,setName] = useState('')
    const [email,setEmail] = useState('')
    const [password,setPassword] = useState('')
    


    const onSubmitHandler = async (e)=>{
        try {
            e.preventDefault();
            axios.defaults.withCredentials = true

            if(state === 'Sign Up'){
            const {data} = await axios.post(backendUrl +'/api/v1/auth/register',{name, email, password})
            if(data.success){
                setIsLoggedin(true)
                getUserData()
                // Redirect to home page - App.jsx will handle showing correct component
                navigate('/')
            }else{
                toast.error(data.message)
            }
            }
            else{
            const {data} = await axios.post(backendUrl +'/api/v1/auth/login',{email, password})
            if(data.success){
                setIsLoggedin(true)
                getUserData()
                // Redirect to home page - App.jsx will handle showing correct component
                navigate('/')
            }else{
                toast.error(data.message)
            }
            }
        }
        catch (error) {
            toast.error(error.message)

            
        }
    }
    useEffect(()=>{
      if (authChecked && isLoggedin) {
        navigate('/')
      }
    },[authChecked, isLoggedin])
  const onGoogle = async (credential) => {
    try {
      axios.defaults.withCredentials = true
      const { data } = await axios.post(backendUrl + '/api/v1/auth/google', { idToken: credential })
      if (data.success) {
        setIsLoggedin(true)
        getUserData()
        navigate('/')
      } else {
        toast.error(data.message)
      }
    } catch (e) { toast.error(e.message) }
  }

  useEffect(() => {
    // Load Google Identity script
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.async = true
    s.defer = true
    s.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({ client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID, callback: (resp)=> onGoogle(resp.credential) })
        window.google.accounts.id.renderButton(document.getElementById('googleBtn'), { theme: 'outline', size: 'large', width: 320 })
      }
    }
    document.body.appendChild(s)
    return () => { document.body.removeChild(s) }
  }, [])

  return (
    <div className='flex items-center justify-center min-h-screen px-6 sm:px-0 bg-gray-50'>
      <div className='w-full max-w-md bg-white border rounded-lg p-8 shadow-sm'>
        <h2 className='text-2xl font-semibold text-gray-900 text-center mb-1'>{state ==='Sign Up' ? 'Create Account' : 'Sign In'}</h2>
        <p className='text-center mb-6 text-gray-500 text-sm'>Use the form below to {state === 'Sign Up' ? 'register' : 'login'}.</p>
        <form onSubmit={onSubmitHandler}>
          {state === 'Sign Up' && (
            <div className='mb-3'>
              <label className='block mb-1 text-sm text-gray-700'>Full Name</label>
              <input onChange={e => setName(e.target.value)} value={name}
                className='border rounded w-full p-2 outline-none' type="text" placeholder='Full Name' required/>
            </div>
          )}
          <div className='mb-3'>
            <label className='block mb-1 text-sm text-gray-700'>Email</label>
            <input onChange={e => setEmail(e.target.value)} value={email}
              className='border rounded w-full p-2 outline-none' type="email" placeholder='Email' required/>
          </div>
          <div className='mb-4'>
            <label className='block mb-1 text-sm text-gray-700'>Password</label>
            <input onChange={e => setPassword(e.target.value)} value={password}
              className='border rounded w-full p-2 outline-none' type="password" placeholder='Password' required/>
          </div>
          <button className='w-full py-2.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium'>{state}</button>
        </form>
        <div className='my-4 text-center text-gray-500 text-sm'>or</div>
        <div id='googleBtn' className='flex justify-center'></div>
        {state ==='Sign Up' ? (
          <p className='text-gray-600 text-center text-sm mt-4'>Already have an account?{' '}
            <span onClick={()=>setState('Login')} className='text-blue-600 cursor-pointer underline'>Login here</span>
          </p>
        ) : (
          <p className='text-gray-600 text-center text-sm mt-4'>Don't have an account?{' '}
            <span onClick={()=>setState('Sign Up')} className='text-blue-600 cursor-pointer underline'>Sign Up</span>
          </p>
        )}
      </div>
    </div>
  )
}

export default Login
