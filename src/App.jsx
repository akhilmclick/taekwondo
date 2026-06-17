import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'

// Pages
import Login from './pages/Login'
import AdminDashboard from './pages/admin/Dashboard'
import AdminStudents from './pages/admin/Students'
import AdminFees from './pages/admin/Fees'
import StudentProfile from './pages/StudentProfile'
import AttendanceMarking from './pages/AttendanceMarking'
import Schedule from './pages/Schedule'
import StudentDashboard from './pages/student/Dashboard'
import CoachDashboard from './pages/coach/Dashboard'

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="logo-text" style={{ fontSize: 32 }}>
        <span className="logo-dojan" style={{ fontSize: 40 }}>DOJAN</span>
        <span className="logo-hub" style={{ fontSize: 40 }}>HUB</span>
      </div>
      <div className="spinner" style={{ marginTop: 24 }} />
    </div>
  )
}

function ProtectedRoute({ children, allowedRoles, userRole }) {
  if (!userRole) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    if (userRole === 'admin') return <Navigate to="/admin" replace />
    if (userRole === 'coach') return <Navigate to="/coach" replace />
    return <Navigate to="/student" replace />
  }
  return children
}

export default function App() {
  const [session, setSession] = useState(undefined)
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // ── Initial session check on mount ──────────────────────────
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchRoleAndSet(session)
      } else {
        setSession(null)
        setLoading(false)
      }
    })

    // ── Listen for sign-in / sign-out events ────────────────────
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session) {
          // Keep loading=true until BOTH session and role are ready
          // so we never render with session≠null but role=null
          setLoading(true)
          await fetchRoleAndSet(session)
        } else {
          // Sign-out: clear everything atomically
          setSession(null)
          setUserRole(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function fetchRoleAndSet(session) {
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()
    // Set session AND role together — single render, no intermediate blank state
    setSession(session)
    setUserRole(data?.role || null)
    setLoading(false)
  }


  if (loading || session === undefined) return <LoadingScreen />

  return (
    <BrowserRouter>
      <div className="app-shell">
        <Routes>
          <Route path="/login" element={
            session
              ? <Navigate to={roleHome(userRole)} replace />
              : <Login />
          } />

          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']} userRole={userRole}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/students" element={
            <ProtectedRoute allowedRoles={['admin']} userRole={userRole}>
              <AdminStudents />
            </ProtectedRoute>
          } />
          <Route path="/admin/students/:id" element={
            <ProtectedRoute allowedRoles={['admin']} userRole={userRole}>
              <StudentProfile role="admin" />
            </ProtectedRoute>
          } />
          <Route path="/admin/fees" element={
            <ProtectedRoute allowedRoles={['admin']} userRole={userRole}>
              <AdminFees />
            </ProtectedRoute>
          } />
          <Route path="/admin/attendance" element={
            <ProtectedRoute allowedRoles={['admin', 'coach']} userRole={userRole}>
              <AttendanceMarking />
            </ProtectedRoute>
          } />
          <Route path="/admin/schedule" element={
            <ProtectedRoute allowedRoles={['admin']} userRole={userRole}>
              <Schedule role="admin" />
            </ProtectedRoute>
          } />

          {/* Coach Routes */}
          <Route path="/coach" element={
            <ProtectedRoute allowedRoles={['coach']} userRole={userRole}>
              <CoachDashboard />
            </ProtectedRoute>
          } />
          <Route path="/coach/attendance" element={
            <ProtectedRoute allowedRoles={['admin', 'coach']} userRole={userRole}>
              <AttendanceMarking />
            </ProtectedRoute>
          } />
          <Route path="/coach/students/:id" element={
            <ProtectedRoute allowedRoles={['coach']} userRole={userRole}>
              <StudentProfile role="coach" />
            </ProtectedRoute>
          } />
          <Route path="/coach/schedule" element={
            <ProtectedRoute allowedRoles={['coach']} userRole={userRole}>
              <Schedule role="coach" />
            </ProtectedRoute>
          } />

          {/* Student Routes */}
          <Route path="/student" element={
            <ProtectedRoute allowedRoles={['student']} userRole={userRole}>
              <StudentDashboard />
            </ProtectedRoute>
          } />
          <Route path="/student/profile" element={
            <ProtectedRoute allowedRoles={['student']} userRole={userRole}>
              <StudentProfile role="student" />
            </ProtectedRoute>
          } />
          <Route path="/student/schedule" element={
            <ProtectedRoute allowedRoles={['student']} userRole={userRole}>
              <Schedule role="student" />
            </ProtectedRoute>
          } />

          {/* Default redirects */}
          <Route path="/" element={
            session
              ? <Navigate to={roleHome(userRole)} replace />
              : <Navigate to="/login" replace />
          } />
          <Route path="*" element={<Navigate to={session ? roleHome(userRole) : '/login'} replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

function roleHome(role) {
  if (role === 'admin') return '/admin'
  if (role === 'coach') return '/coach'
  return '/student'
}
