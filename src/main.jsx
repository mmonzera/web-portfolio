import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import AdminPanel from './AdminPanel.jsx'

const isAdmin = new URLSearchParams(window.location.search).get('admin') === 'm0s3s-lab-2026';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isAdmin ? <AdminPanel /> : <App />}
  </StrictMode>,
)
