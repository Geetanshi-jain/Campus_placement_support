import { useState, useRef, useEffect } from 'react'
import Navbar from '../components/Navbar'
import { askQuestion } from '../api/chat'

export default function ChatPage() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I'm your AI placement assistant. I can answer questions based on the real placement experiences shared by IIPS students. What would you like to know?",
      sources: []
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
      const history = messages.slice(-10).map((m) => ({ role: m.role, content: m.content }))
      const { data } = await askQuestion({ question, history })
      
      setMessages((prev) => [
        ...prev, 
        { role: 'assistant', content: data.answer, sources: data.sources }
      ])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '⚠️ Sorry, there was an error processing your request. Please try again.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="chat-page">
      <Navbar />
      
      <header className="chat-page-header">
        <div className="chat-avatar" style={{ background: 'rgba(255,255,255,0.2)' }}>🤖</div>
        <div>
          <h2>Ask Anything (RAG Chatbot)</h2>
          <p>Answers are generated using Gemini AI, grounded exclusively in our student experience database.</p>
        </div>
      </header>

      <div className="chat-page-body">
        {messages.map((m, i) => (
          <div key={i} className={`chat-bubble ${m.role}`}>
            {m.role === 'assistant' && <div className="bubble-avatar">🤖</div>}
            <div>
              <div className="bubble-text">{m.content}</div>
              {m.sources && m.sources.length > 0 && (
                <div className="sources-strip">
                  {m.sources.map((s, idx) => (
                    <span key={idx} className="source-tag">
                      Source {idx + 1}: {s.company} ({s.batch})
                    </span>
                  ))}
                </div>
              )}
            </div>
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

      <div className="chat-page-input">
        <input
          type="text"
          placeholder="e.g., What kind of DSA questions does TCS ask? What is the average CTC for Wipro?"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          autoFocus
        />
        <button onClick={sendMessage} disabled={loading}>
          Send 🚀
        </button>
      </div>
    </div>
  )
}
