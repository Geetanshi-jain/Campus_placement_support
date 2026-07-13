import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Landing from './pages/Landing'
import StudentLogin from './pages/StudentLogin'
import AdminLogin from './pages/AdminLogin'
import StudentDashboard from './pages/StudentDashboard'
import ChatPage from './pages/ChatPage'
import HRBriefPage from './pages/HRBriefPage'
import BrowsePage from './pages/BrowsePage'
import SubmitExperiencePage from './pages/SubmitExperiencePage'
import AdminDashboard from './pages/AdminDashboard'
import ChatFAB from './components/ChatFAB'

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="page-loading"><div className="spinner" /></div>
  if (!user) return <Navigate to="/" replace />
  if (role && user.profile?.role !== role) return <Navigate to="/" replace />
  return children
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/student/login" element={<StudentLogin />} />
          <Route path="/student/register" element={<StudentLogin />} />
          <Route path="/admin/login" element={<AdminLogin />} />

          <Route path="/student/dashboard" element={
            <ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>
          } />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/student/hr-brief" element={
            <ProtectedRoute role="student"><HRBriefPage /></ProtectedRoute>
          } />
          <Route path="/student/browse" element={<BrowsePage />} />
          <Route path="/student/submit" element={
            <ProtectedRoute role="student"><SubmitExperiencePage /></ProtectedRoute>
          } />
          <Route path="/admin/dashboard" element={
            <ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>
          } />
        </Routes>

        {/* ── Global floating chat bot — visible on every page ── */}
        <ChatFAB />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
