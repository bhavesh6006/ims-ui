import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

export const Unauthorized: React.FC = () => {
  const navigate = useNavigate()
  const { logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="unauthorized-container">
      <h1>403 - Unauthorized</h1>
      <p>You do not have permission to access this page.</p>
      <p>Please contact your administrator if you believe this is an error.</p>
      <div>
        <button onClick={() => navigate(-1)}>Go Back</button>
        <button onClick={handleLogout}>Logout</button>
      </div>
    </div>
  )
}
