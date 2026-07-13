import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { logout as apiLogout } from '../api/auth'

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await apiLogout(localStorage.getItem('refresh_token'))
    } catch (e) {
      console.error(e)
    } finally {
      logout()
      navigate('/')
    }
  }

  const role = user?.profile?.role

  const navLinks = role === 'student'
    ? [
        { label: 'Dashboard', path: '/student/dashboard' },
        { label: 'Experiences', path: '/student/browse' },
        { label: 'Ask AI', path: '/chat' },
        { label: 'HR Prep', path: '/student/hr-brief' },
      ]
    : role === 'admin'
    ? [{ label: 'Dashboard', path: '/admin/dashboard' }]
    : []

  return (
    <nav className="navbar">
      {/* Brand */}
      <div className="navbar-brand" style={{ cursor: 'pointer' }} onClick={() => { navigate('/'); setMenuOpen(false) }}>
        <div className="navbar-brand-icon">🎓</div>
        <div className="navbar-brand-text">
          <strong>IIPS Placement Hub</strong>
          <small>Knowledge Base</small>
        </div>
      </div>

      {/* Desktop nav */}
      <div className="navbar-nav navbar-nav-desktop">
        {navLinks.map((l) => (
          <button
            key={l.path}
            className={`nav-link ${location.pathname === l.path ? 'active' : ''}`}
            onClick={() => navigate(l.path)}
          >
            {l.label}
          </button>
        ))}

        <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.2)', margin: '0 0.5rem' }} />

        <div className="nav-user">
          <div className="nav-user-avatar">
            {user?.first_name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase()}
          </div>
          <button className="nav-link" onClick={handleLogout} style={{ marginLeft: '0.2rem' }}>Logout</button>
        </div>
      </div>

      {/* Hamburger button — mobile only */}
      <button
        className="navbar-hamburger"
        onClick={() => setMenuOpen((o) => !o)}
        aria-label="Toggle menu"
      >
        <span className={`ham-line ${menuOpen ? 'open' : ''}`} />
        <span className={`ham-line ${menuOpen ? 'open' : ''}`} />
        <span className={`ham-line ${menuOpen ? 'open' : ''}`} />
      </button>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="navbar-mobile-menu">
          {navLinks.map((l) => (
            <button
              key={l.path}
              className={`mobile-nav-link ${location.pathname === l.path ? 'active' : ''}`}
              onClick={() => { navigate(l.path); setMenuOpen(false) }}
            >
              {l.label}
            </button>
          ))}
          <div className="mobile-nav-divider" />
          <div className="mobile-nav-user">
            <div className="nav-user-avatar" style={{ width: 32, height: 32 }}>
              {user?.first_name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase()}
            </div>
            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>{user?.username}</span>
          </div>
          <button
            className="mobile-nav-link"
            style={{ color: '#fca5a5' }}
            onClick={() => { handleLogout(); setMenuOpen(false) }}
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  )
}
