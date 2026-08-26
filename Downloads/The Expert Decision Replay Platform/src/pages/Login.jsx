import { useState } from 'react'
import { ArrowRight, Eye, EyeOff, LockKeyhole } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const { login, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    try {
      await login(email, password)
      navigate(location.state?.from?.pathname || '/')
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Unable to sign in. Check your details and try again.')
    }
  }

  return <div className="auth-page"><section className="auth-story"><div className="story-top"><div className="brand brand-light"><span className="brand-symbol">↗</span>REPLAY<span className="brand-dot">.</span></div><span className="story-index">FOUNDATION / 01</span></div><div className="story-copy"><p className="eyebrow">THE EXPERT DECISION REPLAY PLATFORM</p><h1>Make the<br /><em>thinking</em><br />traceable.</h1><p>Capture the context behind every consequential decision, so your organization can move with confidence and learn at speed.</p></div><div className="story-bottom"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="signal-line"><span>Decision intelligence</span><span>Est. 2024</span></div></div></section><section className="auth-panel"><div className="login-card"><div className="login-heading"><div className="lock-icon"><LockKeyhole size={18} /></div><p className="eyebrow">WELCOME BACK</p><h2>Sign in to your<br />decision office.</h2><p>Continue where your team left off.</p></div><form onSubmit={submit}><label className="floating-field"><input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder=" " /><span>Work email</span></label><label className="floating-field"><input type={showPassword ? 'text' : 'password'} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder=" " /><span>Password</span><button type="button" className="field-action" onClick={() => setShowPassword(!showPassword)} aria-label="Toggle password visibility">{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></label><div className="form-meta"><label><input type="checkbox" /> Remember me</label><a href="#reset">Forgot password?</a></div>{error && <p className="form-error">{error}</p>}<button className="button button-orange full-button" disabled={loading}>{loading ? <span className="spinner" /> : <>Enter workspace <ArrowRight size={17} /></>}</button></form><p className="signup-prompt">New to Replay? <Link to="/register">Create an account <ArrowRight size={13} /></Link></p></div><p className="legal">By continuing, you agree to our <a href="#terms">Terms</a> and <a href="#privacy">Privacy Policy</a>.</p></section></div>
}
