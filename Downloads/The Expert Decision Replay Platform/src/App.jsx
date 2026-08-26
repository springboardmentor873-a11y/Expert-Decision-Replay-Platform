import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import DashboardShell from './layouts/DashboardShell'
import Login from './pages/Login'
import Register from './pages/Register'
import Overview from './pages/Overview'
import './App.css'

function Workspace() {
  return <ProtectedRoute><DashboardShell><Overview /></DashboardShell></ProtectedRoute>
}

function App() {
  return <AuthProvider><BrowserRouter><Routes><Route path="/login" element={<Login />} /><Route path="/register" element={<Register />} /><Route path="/" element={<Workspace />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes></BrowserRouter></AuthProvider>
}

export default App
