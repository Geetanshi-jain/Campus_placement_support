import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { askQuestion } from '../api/chat'

export default function Landing() {
  const navigate = useNavigate()
  const [chatOpen, setChatOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "👋 Hi! I'm the IIPS Placement Assistant. Ask me anything about campus placements — companies, rounds, tips, or salaries!",
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const question = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: question }])
    setLoading(true)
    try {
      const history = messages.slice(-6).map((m) => ({ role: m.role, content: m.content }))
      const { data } = await askQuestion({ question, history })
      setMessages((prev) => [...prev, { role: 'assistant', content: data.answer }])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '⚠️ Could not connect to the server. Make sure the backend is running.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="landing-wrapper">
      {/* ── HERO ─────────────────────────────────────────────── */}
      <header className="hero">
        <div className="hero-bg-pattern" />
        <div className="hero-content">
          <div className="hero-badge">🎓 IIPS Indore</div>
          <h1 className="hero-title">
            Campus Placement
            <span className="hero-title-accent"> Knowledge Hub</span>
          </h1>
          <p className="hero-tagline">
            Feel free to connect and talk with anyone.
            <br />
            Real experiences. Real insights. Real success.
          </p>

          {/* Stats row */}
          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-number">500+</span>
              <span className="stat-label">Experiences</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-number">80+</span>
              <span className="stat-label">Companies</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-number">AI</span>
              <span className="stat-label">Powered Chat</span>
            </div>
          </div>

          {/* CTA buttons */}
          <div className="hero-cta">
            <button
              id="start-talking-btn"
              className="btn btn-primary btn-lg"
              onClick={() => setChatOpen(true)}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              Start Talking
            </button>
            <div className="hero-cta-divider">
              <span>or sign in to unlock all features</span>
            </div>
            <div className="auth-buttons">
              <button
                id="student-login-btn"
                className="btn btn-outline"
                onClick={() => navigate('/student/login')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Student Login
              </button>
              <button
                id="admin-login-btn"
                className="btn btn-ghost"
                onClick={() => navigate('/admin/login')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                Admin Login
              </button>
            </div>
          </div>
        </div>

        {/* Floating decorative cards */}
        <div className="hero-visual">
          <div className="float-card fc1">
            <div className="fc-icon">🏆</div>
            <div className="fc-text">
              <strong>TCS</strong>
              <span>12 Selected · 2025</span>
            </div>
          </div>
          <div className="float-card fc2">
            <div className="fc-icon">💡</div>
            <div className="fc-text">
              <strong>Infosys</strong>
              <span>Aptitude + DSA</span>
            </div>
          </div>
          <div className="float-card fc3">
            <div className="fc-icon">🚀</div>
            <div className="fc-text">
              <strong>Wipro</strong>
              <span>HR Tips Available</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section className="features-section">
        <h2 className="section-title">Everything you need to crack placements</h2>
        <div className="features-grid">
          {[
            { icon: '🤖', title: 'AI Chatbot', desc: 'Ask anything about companies, rounds, salaries, and get AI-powered answers grounded in real IIPS experiences.' },
            { icon: '📋', title: 'Browse Experiences', desc: 'Filter by company, batch, or verdict. Read detailed round-by-round breakdowns from your seniors.' },
            { icon: '🎯', title: 'HR Round Prep', desc: 'Get company-specific HR intel: CEO, tech stack, culture, and likely interview questions.' },
          ].map((f) => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── LOGIN CARDS ──────────────────────────────────────── */}
      <section className="login-section">
        <div className="login-card" id="student-card">
          <div className="login-card-icon">👨‍🎓</div>
          <h3>I'm a Student</h3>
          <p>Browse placement experiences, chat with the AI assistant, and prepare for your dream company.</p>
          <ul className="login-perks">
            <li>✓ Ask Anything chatbot</li>
            <li>✓ HR Round preparation</li>
            <li>✓ Browse & filter experiences</li>
            <li>✓ Share your own experience</li>
          </ul>
          <button className="btn btn-primary" onClick={() => navigate('/student/login')}>
            Student Login →
          </button>
          <p className="login-link">
            New here? <a onClick={() => navigate('/student/register')}>Create account</a>
          </p>
        </div>

        <div className="login-card login-card-admin" id="admin-card">
          <div className="login-card-icon">🛡️</div>
          <h3>I'm an Admin</h3>
          <p>Manage the knowledge base, upload placement data, and view analytics for your batch.</p>
          <ul className="login-perks">
            <li>✓ Bulk upload Excel sheets</li>
            <li>✓ Edit / delete records</li>
            <li>✓ Company-wise analytics</li>
            <li>✓ Monthly placement trends</li>
          </ul>
          <button className="btn btn-maroon-outline" onClick={() => navigate('/admin/login')}>
            Admin Login →
          </button>
        </div>
      </section>

      {/* ── FLOATING CHATBOT ─────────────────────────────────── */}
      {!chatOpen && (
        <button
          className="chat-fab"
          id="chat-fab"
          onClick={() => setChatOpen(true)}
          title="Start Talking"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span className="fab-pulse" />
        </button>
      )}

      {/* ── CHAT MODAL ───────────────────────────────────────── */}
      {chatOpen && (
        <div className="chat-modal-overlay" onClick={(e) => e.target === e.currentTarget && setChatOpen(false)}>
          <div className="chat-modal" id="chat-modal">
            <div className="chat-modal-header">
              <div className="chat-header-info">
                <div className="chat-avatar">🤖</div>
                <div>
                  <h4>IIPS Placement Assistant</h4>
                  <span className="online-dot" />
                  <small>Online · Powered by Claude AI</small>
                </div>
              </div>
              <button className="chat-close" onClick={() => setChatOpen(false)}>✕</button>
            </div>

            <div className="chat-messages">
              {messages.map((m, i) => (
                <div key={i} className={`chat-bubble ${m.role}`}>
                  {m.role === 'assistant' && <div className="bubble-avatar">🤖</div>}
                  <div className="bubble-text">{m.content}</div>
                </div>
              ))}
              {loading && (
                <div className="chat-bubble assistant">
                  <div className="bubble-avatar">🤖</div>
                  <div className="bubble-text typing">
                    <span /><span /><span />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="chat-input-row">
              <input
                id="chat-input"
                type="text"
                placeholder="Ask about companies, rounds, salaries…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              />
              <button id="chat-send-btn" className="chat-send" onClick={sendMessage} disabled={loading}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
            <p className="chat-disclaimer">
              Log in for personalized answers →{' '}
              <a onClick={() => { setChatOpen(false); navigate('/student/login') }}>Sign in</a>
            </p>
          </div>
        </div>
      )}

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer className="footer">
        <p>© 2025 IIPS Campus Placement Knowledge Hub · Developed by Geetanshi jain</p>
      </footer>
    </div>
  )
}
