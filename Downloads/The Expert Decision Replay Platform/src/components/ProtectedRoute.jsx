import { Navigate, useLocation } from 'react-router-dom'
import { ArrowLeft, LockKeyhole } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ allowedRoles, children }) {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <main className="denied-page"><div className="denied-mark"><LockKeyhole size={22} /></div><p className="eyebrow">ACCESS CONTROL / 403</p><h1>That room is not<br />on your floor.</h1><p className="muted-copy">Your current role does not have clearance for this workspace.</p><button className="button button-dark" onClick={() => window.history.back()}><ArrowLeft size={16} /> Go back</button></main>
  }
  return children
}
