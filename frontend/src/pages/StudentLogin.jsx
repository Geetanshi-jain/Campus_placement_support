import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { studentLogin, studentRegister } from '../api/auth'
import { useAuth } from '../context/AuthContext'

export default function StudentLogin() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [form, setForm] = useState({ username: '', password: '', email: '', first_name: '', last_name: '', batch: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      let res
      if (mode === 'login') {
        res = await studentLogin({ username: form.username, password: form.password })
      } else {
        res = await studentRegister(form)
      }
      login(res.data.tokens, res.data.user)
      navigate('/student/dashboard')
    } catch (err) {
      const data = err.response?.data
      if (typeof data === 'object') {
        setError(Object.values(data).flat().join(' '))
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Header */}
        <div className="auth-header">
          <div className="auth-logo-wrap">
            <span className="auth-logo">🎓</span>
          </div>
          <h2 className="auth-title">Student Portal</h2>
          <p className="auth-sub">IIPS Campus Placement Knowledge Hub</p>
        </div>

        {/* Tabs */}
        <div className="auth-tabs">
          <button
            id="login-tab"
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setError('') }}
          >
            Sign In
          </button>
          <button
            id="register-tab"
            className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => { setMode('register'); setError('') }}
          >
            Register
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {/* Register-only fields */}
          {mode === 'register' && (
            <div className="form-row-mobile">
              <div className="form-group">
                <label htmlFor="first-name">First Name</label>
                <div className="input-wrap">
                  <span className="input-icon">👤</span>
                  <input id="first-name" name="first_name" value={form.first_name} onChange={handleChange} placeholder="Rahul" />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="last-name">Last Name</label>
                <div className="input-wrap">
                  <span className="input-icon">👤</span>
                  <input id="last-name" name="last_name" value={form.last_name} onChange={handleChange} placeholder="Sharma" />
                </div>
              </div>
            </div>
          )}

          {mode === 'register' && (
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <div className="input-wrap">
                <span className="input-icon">✉️</span>
                <input id="email" type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@iips.ac.in" />
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <div className="input-wrap">
              <span className="input-icon">🙍</span>
              <input id="username" name="username" value={form.username} onChange={handleChange} placeholder="your_username" required />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrap">
              <span className="input-icon">🔒</span>
              <input
                id="password"
                type={showPass ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                className="input-eye"
                onClick={() => setShowPass((s) => !s)}
                tabIndex={-1}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {mode === 'register' && (
            <div className="form-group">
              <label htmlFor="batch">Batch Year</label>
              <div className="input-wrap">
                <span className="input-icon">📅</span>
                <input id="batch" name="batch" value={form.batch} onChange={handleChange} placeholder="2025" />
              </div>
            </div>
          )}

          {error && <div className="form-error">⚠️ {error}</div>}

          <button id="auth-submit-btn" type="submit" className="btn btn-primary w-full auth-submit-btn" disabled={loading}>
            {loading ? (
              <span className="auth-spinner" />
            ) : mode === 'login' ? (
              '→ Sign In'
            ) : (
              '→ Create Account'
            )}
          </button>
        </form>

        <div className="auth-footer-links">
          <button className="link-btn" onClick={() => navigate('/')}>← Back to Home</button>
          <button className="link-btn" onClick={() => navigate('/admin/login')}>Admin Login</button>
        </div>
      </div>
    </div>
  )
}
