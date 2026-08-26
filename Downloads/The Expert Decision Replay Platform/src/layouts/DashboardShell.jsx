import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Bell, ChevronDown, ChevronLeft, ChevronRight, FileText, LayoutDashboard, LogOut, Menu, Plus, Search, Settings, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const nav = [
  { label: 'Overview', to: '/', icon: LayoutDashboard },
  { label: 'Create decision', to: '/decisions/new', icon: Plus },
  { label: 'Knowledge repository', to: '/repository', icon: FileText },
  { label: 'Audit logs', to: '/audit', icon: ShieldCheck },
  { label: 'Settings', to: '/settings', icon: Settings },
]

export default function DashboardShell({ children }) {
  const [collapsed, setCollapsed] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const current = nav.find((item) => item.to === location.pathname)?.label || 'Overview'
  const initials = user?.full_name?.split(' ').map((part) => part[0]).join('')

  return <div className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''}`}><aside className="sidebar"><div className="brand"><span className="brand-symbol">↗</span>{!collapsed && <span>REPLAY<span className="brand-dot">.</span></span>}</div><div className="workspace-switcher"><div className="workspace-avatar">N</div>{!collapsed && <><div><strong>Northstar</strong><small>Decision office</small></div><ChevronDown size={15} /></>}</div><nav className="side-nav">{nav.map(({ label, to, icon: Icon }) => <NavLink key={to} to={to} end={to === '/'} title={label}><Icon size={18} /><span>{!collapsed && label}</span></NavLink>)}</nav><div className="sidebar-footer">{!collapsed && <div className="storage"><div><span>Workspace storage</span><b>68%</b></div><div className="storage-bar"><i /></div></div>}<button className="collapse-button" onClick={() => setCollapsed(!collapsed)} aria-label="Toggle sidebar">{collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}</button></div></aside><section className="main-column"><header className="topbar"><div className="mobile-brand"><Menu size={18} /><span>REPLAY<span className="brand-dot">.</span></span></div><div className="search-trigger"><Search size={17} /><span>Search the workspace</span><kbd>⌘ K</kbd></div><div className="top-actions"><button className="icon-button" aria-label="Notifications"><Bell size={18} /><i className="notification-dot">3</i></button><div className="profile-wrap"><button className="profile-button" onClick={() => setProfileOpen(!profileOpen)}><div className="avatar">{initials}</div><span className="profile-name">{user?.full_name}</span><ChevronDown size={15} /></button>{profileOpen && <div className="profile-menu"><strong>{user?.email}</strong><span className="role-badge">{user?.role}</span><button onClick={() => { logout(); navigate('/login') }}><LogOut size={15} /> Sign out</button></div>}</div></div></header><div className="page-area"><div className="breadcrumbs"><span>Workspace</span><span>/</span><b>{current}</b></div>{children}</div></section></div>
}
