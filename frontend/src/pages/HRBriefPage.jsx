import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import Navbar from '../components/Navbar'
import { getHRBrief } from '../api/chat'

export default function HRBriefPage() {
  const [company, setCompany] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = async () => {
    if (!company.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const { data } = await getHRBrief({ company })
      setResult(data)
    } catch (err) {
      setError('Failed to generate brief. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="hr-wrapper">
      <Navbar />
      
      <header className="hr-hero">
        <h1>Must Know for HR</h1>
        <p>Enter a company name to generate an AI-powered HR interview prep brief.</p>
      </header>

      <div className="hr-search-box">
        <input 
          type="text" 
          placeholder="e.g., Google, TCS, Infosys, Microsoft..."
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button className="btn btn-primary" onClick={handleSearch} disabled={loading}>
          {loading ? 'Generating...' : 'Generate Brief ✨'}
        </button>
      </div>

      {error && (
        <div style={{ textAlign: 'center', color: 'var(--error)', marginTop: '2rem' }}>
          {error}
        </div>
      )}

      {result && (
        <div className="hr-result">
          <h2>HR Brief: {result.company}</h2>
          <div className="hr-result-content">
            <ReactMarkdown>{result.brief}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  )
}
