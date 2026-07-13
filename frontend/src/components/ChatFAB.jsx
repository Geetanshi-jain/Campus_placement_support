import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { askQuestion } from '../api/chat'

export default function ChatFAB() {
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "👋 Hi! I'm the IIPS Placement Assistant. Ask me anything about campus placements — companies, rounds, tips, or salaries!",
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  // Hide the FAB completely if we are already on the full Chat page
  if (location.pathname === '/chat') {
    return null
  }

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [messages, open])

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
    <>
      {/* ── Floating Action Button ─────────────────────────── */}
      {!open && (
        <button
          className="chat-fab"
          id="chat-fab"
          onClick={() => setOpen(true)}
          title="Ask Placement Assistant"
          aria-label="Open chat"
        >
          {/* Chat bubble SVG icon */}
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span className="fab-pulse" />
          <span className="fab-tooltip">Ask Placement AI</span>
        </button>
      )}

      {/* ── Chat Modal ─────────────────────────────────────── */}
      {open && (
        <div
          className="chat-modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="chat-modal" id="chat-modal" role="dialog" aria-label="Placement Chat Assistant">
            {/* Header */}
            <div className="chat-modal-header">
              <div className="chat-header-info">
                <div className="chat-avatar">🤖</div>
                <div>
                  <h4>IIPS Placement Assistant</h4>
                  <small>
                    <span className="online-dot" /> Online · Powered by Gemini AI
                  </small>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <button
                  className="chat-close"
                  title="Open full chat page"
                  onClick={() => { setOpen(false); navigate('/chat') }}
                  style={{ fontSize: '0.85rem', padding: '0.3rem 0.6rem' }}
                >
                  ⤢
                </button>
                <button className="chat-close" onClick={() => setOpen(false)} aria-label="Close chat">✕</button>
              </div>
            </div>

            {/* Messages */}
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

            {/* Input */}
            <div className="chat-input-row">
              <input
                id="chat-input"
                ref={inputRef}
                type="text"
                placeholder="Ask about companies, rounds, salaries…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              />
              <button
                id="chat-send-btn"
                className="chat-send"
                onClick={sendMessage}
                disabled={loading}
                aria-label="Send message"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
            <p className="chat-disclaimer">
              Log in for personalized answers →{' '}
              <a onClick={() => { setOpen(false); navigate('/student/login') }}>Sign in</a>
            </p>
          </div>
        </div>
      )}
    </>
  )
}
