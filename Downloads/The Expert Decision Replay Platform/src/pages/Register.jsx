import { useMemo, useState } from 'react'
import { ArrowRight, Check, CheckCircle2, FileSearch, ShieldCheck, User, ChevronDown } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'

const roles = [{ name: 'Employee', value: 'employee', subtitle: 'Create & propose decisions', icon: User, color: 'blue' }, { name: 'Reviewer', value: 'reviewer', subtitle: 'Critique & provide feedback', icon: FileSearch, color: 'teal' }, { name: 'Manager', value: 'manager', subtitle: 'Evaluate & approve pipelines', icon: CheckCircle2, color: 'orange' }, { name: 'Administrator', value: 'administrator', subtitle: 'Full system governance', icon: ShieldCheck, color: 'ink' }]

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', team: '', role: 'employee' })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const strength = useMemo(() => form.password.length > 10 ? 3 : form.password.length > 6 ? 2 : form.password.length > 0 ? 1 : 0, [form.password])
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  const submit = async (event) => {
    event.preventDefault()
    setSubmitted(true)
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/register', { full_name: form.name, email: form.email, password: form.password, role: form.role, ...(form.team.trim() ? { team_name: form.team.trim() } : {}) })
      navigate('/login', { state: { registered: true } })
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Unable to create your account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return <div className="register-page"><header className="register-header"><Link to="/login" className="brand"><span className="brand-symbol">↗</span>REPLAY<span className="brand-dot">.</span></Link><span>Already have an account? <Link className="text-link" to="/login">Sign in <ArrowRight size={14} /></Link></span></header><main className="register-main"><div className="register-intro"><p className="eyebrow">YOUR DECISION OFFICE</p><h1>Build a culture<br />of <em>clear thinking.</em></h1><p>Set up your workspace and give every voice a structured place in the decision record.</p><div className="intro-note"><div className="note-icon"><Check size={16} /></div><span>Every role gets a structured place in the decision record.</span></div></div><form className="register-form" onSubmit={submit}><div className="form-section-title"><span>01</span><div><h2>Your details</h2><p>Tell us who you are.</p></div></div><div className="two-fields"><label className={`floating-field ${submitted && !form.name ? 'invalid' : ''}`}><input required value={form.name} onChange={(event) => update('name', event.target.value)} placeholder=" " /><span>Full name</span></label><label className={`floating-field ${submitted && !form.email ? 'invalid' : ''}`}><input type="email" required value={form.email} onChange={(event) => update('email', event.target.value)} placeholder=" " /><span>Work email</span></label></div><label className={`floating-field ${submitted && !form.password ? 'invalid' : ''}`}><input required type="password" value={form.password} onChange={(event) => update('password', event.target.value)} placeholder=" " /><span>Create password</span></label><div className="strength"><div className="strength-bars"><i className={strength > 0 ? 'active' : ''} /><i className={strength > 1 ? 'active' : ''} /><i className={strength > 2 ? 'active' : ''} /></div><span>{strength === 0 ? 'Use 8+ characters' : strength === 3 ? 'Strong password' : 'Could be stronger'}</span></div><div className="form-section-title role-title"><span>02</span><div><h2>Choose your role</h2><p>This shapes what you can see and do.</p></div></div><div className="role-grid">{roles.map(({ name, value, subtitle, icon: Icon, color }) => <button type="button" key={value} className={`role-card ${form.role === value ? 'selected' : ''}`} onClick={() => update('role', value)}><span className={`role-icon ${color}`}><Icon size={17} /></span><span><b>{name}</b><small>{subtitle}</small></span>{form.role === value && <Check size={16} className="role-check" />}</button>)}</div><div className="form-section-title team-title"><span>03</span><div><h2>Join a team</h2><p>Optional. Add a team name or ID.</p></div></div><label className="select-field"><input className="team-input" value={form.team} onChange={(event) => update('team', event.target.value)} placeholder="Team name or ID" /><ChevronDown size={17} /></label>{error && <p className="form-error">{error}</p>}<button className="button button-orange full-button" type="submit" disabled={loading}>{loading ? <span className="spinner" /> : <>Create my workspace <ArrowRight size={17} /></>}</button></form></main></div>
}
