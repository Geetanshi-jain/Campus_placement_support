import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import { getExperiences } from '../api/experiences'

export default function BrowsePage() {
  const [experiences, setExperiences] = useState([])
  const [filters, setFilters] = useState({ company: '', batch: '', verdict: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchExperiences()
  }, [])

  const fetchExperiences = async (currentFilters = filters) => {
    setLoading(true)
    try {
      const { data } = await getExperiences(currentFilters)
      setExperiences(data.results || data) // handle pagination if DRF returns it
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    const newFilters = { ...filters, [name]: value }
    setFilters(newFilters)
    fetchExperiences(newFilters)
  }

  return (
    <div className="browse-wrapper">
      <Navbar />
      
      <header className="browse-hero">
        <h1>Browse Experiences</h1>
        <p>Explore interview processes from your seniors and prepare effectively.</p>
      </header>

      <div className="browse-filters">
        <div className="form-group">
          <label>Company</label>
          <input 
            name="company" 
            placeholder="Search company..." 
            value={filters.company} 
            onChange={handleFilterChange} 
          />
        </div>
        <div className="form-group">
          <label>Batch</label>
          <input 
            name="batch" 
            placeholder="e.g. 2025" 
            value={filters.batch} 
            onChange={handleFilterChange} 
          />
        </div>
        <div className="form-group">
          <label>Verdict</label>
          <select name="verdict" value={filters.verdict} onChange={handleFilterChange}>
            <option value="">All</option>
            <option value="selected">Selected</option>
            <option value="rejected">Rejected</option>
            <option value="on_hold">On Hold</option>
            <option value="internship">Internship Offer</option>
          </select>
        </div>
      </div>

      <div className="browse-grid">
        {loading ? (
          <div style={{ textAlign: 'center', gridColumn: '1 / -1', padding: '2rem' }}>Loading...</div>
        ) : experiences.length === 0 ? (
          <div style={{ textAlign: 'center', gridColumn: '1 / -1', padding: '2rem' }}>No experiences found matching your filters.</div>
        ) : (
          experiences.map(exp => (
            <div key={exp.submission_id} className="exp-card">
              <div className="exp-card-header">
                <div className="exp-company">{exp.company}</div>
                <div className={`verdict-badge verdict-${exp.verdict.toLowerCase()}`}>
                  {exp.verdict.replace('_', ' ')}
                </div>
              </div>
              
              <div className="exp-meta">
                <span className="exp-meta-item">
                  <span>📅</span> {exp.batch}
                </span>
                {exp.author && (
                  <span className="exp-meta-item">
                    <span>👤</span> {exp.author}
                  </span>
                )}
                {exp.role_offered && (
                  <span className="exp-meta-item">
                    <span>💼</span> {exp.role_offered}
                  </span>
                )}
              </div>
              
              <div className="exp-summary">
                {exp.overall_process_summary || "No overall summary provided."}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
