import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { createExperience } from '../api/experiences'
import { useAuth } from '../context/AuthContext'

export default function SubmitExperiencePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [form, setForm] = useState({
    company: '',
    batch: user?.profile?.batch || '',
    author: user?.first_name ? `${user.first_name} ${user.last_name || ''}` : '',
    verdict: 'selected',
    role_offered: '',
    ctc_offered: '',
    overall_process_summary: '',
    round_1_name: '', round_1_topics: '',
    round_2_name: '', round_2_topics: '',
    round_3_name: '', round_3_topics: '',
    tips_advice: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.company) {
      setError("Company name is required.")
      return
    }
    setLoading(true)
    setError('')
    try {
      await createExperience(form)
      navigate('/student/dashboard')
    } catch (err) {
      setError("Failed to submit experience. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="submit-wrapper">
      <Navbar />
      
      <header className="dashboard-hero" style={{ paddingBottom: '2rem' }}>
        <h1>Share Your Experience</h1>
        <p>Help junior batches prepare better by sharing your interview details.</p>
      </header>

      <form className="submit-form" onSubmit={handleSubmit}>
        
        {error && <div className="form-error">{error}</div>}

        <div className="submit-section">
          <h2 className="submit-section-title">Basic Details</h2>
          <div className="form-row">
            <div className="form-group">
              <label>Company *</label>
              <input name="company" value={form.company} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Verdict *</label>
              <select name="verdict" value={form.verdict} onChange={handleChange} required>
                <option value="selected">Selected</option>
                <option value="rejected">Rejected</option>
                <option value="on_hold">On Hold</option>
                <option value="internship">Internship Offer</option>
              </select>
            </div>
            <div className="form-group">
              <label>Batch</label>
              <input name="batch" value={form.batch} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Your Name (Optional)</label>
              <input name="author" value={form.author} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Role Offered</label>
              <input name="role_offered" value={form.role_offered} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>CTC Offered (Optional)</label>
              <input name="ctc_offered" value={form.ctc_offered} onChange={handleChange} />
            </div>
          </div>
        </div>

        <div className="submit-section">
          <h2 className="submit-section-title">Overall Summary</h2>
          <div className="form-group">
            <textarea 
              name="overall_process_summary" 
              value={form.overall_process_summary} 
              onChange={handleChange}
              placeholder="Provide a brief overview of the entire process..."
            />
          </div>
        </div>

        <div className="submit-section">
          <h2 className="submit-section-title">Round 1 (Aptitude/Coding)</h2>
          <div className="form-group">
            <label>Round Name</label>
            <input name="round_1_name" value={form.round_1_name} onChange={handleChange} placeholder="e.g. Online Assessment" />
          </div>
          <div className="form-group">
            <label>Topics Covered</label>
            <textarea name="round_1_topics" value={form.round_1_topics} onChange={handleChange} placeholder="e.g. Quants, Arrays, Strings..." />
          </div>
        </div>

        <div className="submit-section">
          <h2 className="submit-section-title">Round 2 (Technical)</h2>
          <div className="form-group">
            <label>Round Name</label>
            <input name="round_2_name" value={form.round_2_name} onChange={handleChange} placeholder="e.g. Technical Interview 1" />
          </div>
          <div className="form-group">
            <label>Topics Covered</label>
            <textarea name="round_2_topics" value={form.round_2_topics} onChange={handleChange} placeholder="e.g. OOPS, DBMS, Project discussion..." />
          </div>
        </div>

        <div className="submit-section">
          <h2 className="submit-section-title">Tips & Advice</h2>
          <div className="form-group">
            <textarea 
              name="tips_advice" 
              value={form.tips_advice} 
              onChange={handleChange}
              placeholder="What advice would you give to someone preparing for this company?"
            />
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Experience'}
        </button>

      </form>
    </div>
  )
}
