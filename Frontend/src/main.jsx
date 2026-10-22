import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { installAuthInterceptor } from './api.js'
import App from './App.jsx'

installAuthInterceptor()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
