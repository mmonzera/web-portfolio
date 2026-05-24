import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const AdminPanel = lazy(() => import('./AdminPanel.jsx'));

const isAdmin = new URLSearchParams(window.location.search).get('admin') === 'm0s3s-lab-2026';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isAdmin
      ? <Suspense fallback={<div style={{color:'#fff',padding:'20px',fontFamily:'monospace'}}>Loading Admin Panel...</div>}><AdminPanel /></Suspense>
      : <App />
    }
  </StrictMode>,
)
