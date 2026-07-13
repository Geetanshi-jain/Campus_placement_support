import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'

export default function StudentDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <div className="dashboard-wrapper">
      <Navbar />
      
      <header className="dashboard-hero">
        <h1>Welcome to the IIPS placement preparation Hub.</h1>
        <p>Feel free to ask anything.</p>
      </header>

      <div className="dashboard-cards">
        <div className="dash-card" onClick={() => navigate('/chat')}>
          <div className="dash-card-icon">🤖</div>
          <div className="dash-badge">RAG Powered</div>
          <h3>Ask Anything</h3>
          <p>Talk to our AI assistant trained on hundreds of real IIPS placement experiences. Get specific answers about rounds, questions, and salaries.</p>
          <div className="dash-arrow">→</div>
        </div>

        <div className="dash-card" onClick={() => navigate('/student/browse')}>
          <div className="dash-card-icon">📋</div>
          <div className="dash-badge">Database</div>
          <h3>Browse Experiences</h3>
          <p>Read detailed, round-by-round interview experiences from your seniors. Filter by company, batch, or selection status.</p>
          <div className="dash-arrow">→</div>
        </div>

        <div className="dash-card" onClick={() => navigate('/student/hr-brief')}>
          <div className="dash-card-icon">🎯</div>
          <div className="dash-badge">Web Augmented</div>
          <h3>Must Know for HR</h3>
          <p>Generate a comprehensive HR interview preparation brief for any company, including leadership, tech stack, and recent news.</p>
          <div className="dash-arrow">→</div>
        </div>

        <div className="dash-card" onClick={() => navigate('/student/submit')}>
          <div className="dash-card-icon">✍️</div>
          <div className="dash-badge">Contribute</div>
          <h3>Share Experience</h3>
          <p>Recently interviewed? Share your experience to help junior batches prepare better.</p>
          <div className="dash-arrow">→</div>
        </div>
      </div>
    </div>
  )
}
