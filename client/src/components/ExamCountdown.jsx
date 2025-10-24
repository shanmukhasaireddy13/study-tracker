import React, { useState, useEffect } from 'react'

const ExamCountdown = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  })

  useEffect(() => {
    const examDate = new Date('2026-03-15T00:00:00').getTime()
    
    const timer = setInterval(() => {
      const now = new Date().getTime()
      const distance = examDate - now

      if (distance > 0) {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24))
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((distance % (1000 * 60)) / 1000)

        setTimeLeft({ days, hours, minutes, seconds })
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        clearInterval(timer)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className='bg-gradient-to-r from-red-500 to-orange-500 text-white p-4 rounded-lg shadow-lg'>
      <div className='text-center'>
        <h2 className='text-xl font-bold mb-2'>📅 10th Class Exams Start</h2>
        <p className='text-sm opacity-90 mb-4'>March 15th, 2026</p>
        
        <div className='grid grid-cols-4 gap-4'>
          <div className='bg-white bg-opacity-20 rounded-lg p-3'>
            <div className='text-2xl font-bold'>{timeLeft.days}</div>
            <div className='text-xs opacity-90'>Days</div>
          </div>
          <div className='bg-white bg-opacity-20 rounded-lg p-3'>
            <div className='text-2xl font-bold'>{timeLeft.hours}</div>
            <div className='text-xs opacity-90'>Hours</div>
          </div>
          <div className='bg-white bg-opacity-20 rounded-lg p-3'>
            <div className='text-2xl font-bold'>{timeLeft.minutes}</div>
            <div className='text-xs opacity-90'>Minutes</div>
          </div>
          <div className='bg-white bg-opacity-20 rounded-lg p-3'>
            <div className='text-2xl font-bold'>{timeLeft.seconds}</div>
            <div className='text-xs opacity-90'>Seconds</div>
          </div>
        </div>
        
        <div className='mt-4 text-sm opacity-90'>
          Keep studying! Every day counts! 💪
        </div>
      </div>
    </div>
  )
}

export default ExamCountdown
