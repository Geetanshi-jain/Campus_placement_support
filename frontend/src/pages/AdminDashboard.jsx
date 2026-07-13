import { useState, useEffect, useRef } from 'react'
import Navbar from '../components/Navbar'
import { getStats, uploadSheet, getPlacementSummary } from '../api/admin'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetchStats()
    fetchSummary()
  }, [])

  const fetchStats = async () => {
    try {
      const { data } = await getStats()
      setStats(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchSummary = async () => {
    try {
      const { data } = await getPlacementSummary()
      setSummary(data)
    } catch (err) {
      console.error('Summary fetch error:', err)
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    setUploading(true)
    setUploadResult(null)
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      const { data } = await uploadSheet(formData)
      setUploadResult({ success: true, data })
      fetchStats() // refresh stats
    } catch (err) {
      setUploadResult({ success: false, error: err.response?.data?.error || 'Failed to upload' })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="admin-wrapper">
      <Navbar />
      
      <header className="admin-hero">
        <h1>Admin Dashboard</h1>
        <p>Manage placement data and view analytics.</p>
      </header>

      <div className="admin-body">
        
        {/* Bulk Upload Section */}
        <div className="admin-section">
          <h2 className="admin-section-title">
            <span>📥</span> Bulk Upload Experiences
          </h2>
          <div 
            className="upload-zone" 
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="upload-zone-icon">📊</div>
            <p><strong>Click to browse</strong> or drag an Excel file (.xlsx, .xls) here</p>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
            />
          </div>
          
          {uploading && <div style={{ marginTop: '1rem', color: 'var(--maroon-600)' }}>Uploading and processing data...</div>}
          
          {uploadResult && uploadResult.success && (
            <div style={{ marginTop: '1rem', color: 'var(--success)', padding: '1rem', background: '#d1fae5', borderRadius: '8px' }}>
              Successfully processed {uploadResult.data.created} rows out of {uploadResult.data.total_rows}.
              {uploadResult.data.errors?.length > 0 && (
                <div style={{ marginTop: '0.5rem', color: 'var(--error)' }}>
                  Failed rows: {uploadResult.data.errors.length}
                </div>
              )}
            </div>
          )}
          {uploadResult && !uploadResult.success && (
            <div style={{ marginTop: '1rem', color: 'var(--error)', padding: '1rem', background: '#fee2e2', borderRadius: '8px' }}>
              {uploadResult.error}
            </div>
          )}
        </div>

        {/* Overview Stats */}
        {stats && (
          <div className="admin-section">
            <h2 className="admin-section-title">
              <span>📈</span> Overview
            </h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="num">{summary ? summary.total : (stats.totals.companies_visited ?? stats.totals.companies)}</div>
                <div className="label">Total Companies Visited</div>
              </div>
              <div className="stat-card">
                <div className="num">{stats.totals.total_drive_visits ?? stats.totals.experiences}</div>
                <div className="label">Total Experiences (Drive Visits)</div>
              </div>
              <div className="stat-card">
                <div className="num">250</div>
                <div className="label">Total Students Appeared</div>
              </div>
              <div className="stat-card">
                <div className="num">200</div>
                <div className="label">Total Selections</div>
              </div>
              <div className="stat-card">
                <div className="num">~{stats.totals.selection_rate}%</div>
                <div className="label">Overall Selection Rate</div>
              </div>
            </div>
          </div>
        )}




        {/* Placement Companies Full List — from placement_companies_summary */}
        {summary && summary.companies && (
          <div className="admin-section">
            <h2 className="admin-section-title">
              <span>🏛️</span> Placement Companies Visited — 2025–26
              <span style={{ marginLeft: '0.75rem', fontSize: '0.85rem', fontWeight: 400, color: 'var(--maroon-400)' }}>
                ({summary.total} companies)
              </span>
            </h2>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>#</th>
                    <th>Company Name</th>
                    <th>Period</th>
                    <th>Package</th>
                    <th>Result Status</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.companies.map((c) => (
                    <tr key={c.serial}>
                      <td style={{ textAlign: 'center', color: 'var(--maroon-400)', fontWeight: 700 }}>{c.serial}</td>
                      <td style={{ fontWeight: 600 }}>{c.name}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{c.period}</td>
                      <td style={{ fontSize: '0.85rem' }}>{c.package}</td>
                      <td>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 10px',
                          borderRadius: '99px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background:
                            c.status === 'announced' ? '#d1fae5' :
                            c.status === 'pending'   ? '#fef9c3' :
                            '#f3f4f6',
                          color:
                            c.status === 'announced' ? '#065f46' :
                            c.status === 'pending'   ? '#92400e' :
                            '#6b7280',
                        }}>
                          {c.status === 'announced' ? '✅ Announced' :
                           c.status === 'pending'   ? '⏳ Pending' :
                           '— No Result'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
