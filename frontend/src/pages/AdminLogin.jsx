import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminLogin } from '../api/auth'
import { useAuth } from '../context/AuthContext'

export default function AdminLogin() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await adminLogin(form)
      login(res.data.tokens, res.data.user)
      navigate('/admin/dashboard')
    } catch (err) {
      const data = err.response?.data
      if (typeof data === 'object') {
        setError(Object.values(data).flat().join(' '))
      } else {
        setError('Invalid admin credentials.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page auth-page-admin">
      <div className="auth-card auth-card-admin">
        {/* Header */}
        <div className="auth-header">
          <div className="auth-logo-wrap auth-logo-wrap-admin">
            <span className="auth-logo">🛡️</span>
          </div>
          <h2 className="auth-title">Admin Portal</h2>
          <p className="auth-sub">Manage IIPS Campus Placement Data</p>
        </div>

        {/* Secure badge */}
        <div className="admin-secure-badge">
          🔐 Secure Access Only
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="admin-username">Admin Username</label>
            <div className="input-wrap">
              <span className="input-icon">👮</span>
              <input
                id="admin-username"
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="admin"
                required
                autoComplete="username"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="admin-password">Password</label>
            <div className="input-wrap">
              <span className="input-icon">🔒</span>
              <input
                id="admin-password"
                type={showPass ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                autoComplete="current-password"
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

          {error && <div className="form-error">⚠️ {error}</div>}

          <button id="admin-login-submit" type="submit" className="btn btn-primary w-full auth-submit-btn" disabled={loading}>
            {loading ? <span className="auth-spinner" /> : '🔓 Access Dashboard'}
          </button>
        </form>

        <div className="auth-footer-links">
          <button className="link-btn" onClick={() => navigate('/')}>← Back to Home</button>
          <button className="link-btn" onClick={() => navigate('/student/login')}>Student Login</button>
        </div>
      </div>
    </div>
  )
}
