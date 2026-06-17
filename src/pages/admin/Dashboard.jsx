import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { getDashboardStats, getRecentActivity } from '../../lib/queries'
import { useAuth } from '../../lib/AuthContext'
import TopBar from '../../components/ui/TopBar'
import BottomNav from '../../components/ui/BottomNav'
import StatCard from '../../components/ui/StatCard'
import { formatDate } from '../../lib/utils'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { instituteId } = useAuth()
  const [profile, setProfile] = useState(null)
  const [stats, setStats]     = useState(null)
  const [activity, setActivity] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(prof)
      if (instituteId) {
        const [s, a] = await Promise.all([getDashboardStats(instituteId), getRecentActivity(instituteId)])
        setStats(s); setActivity(a)
      }
      setLoading(false)
    }
    load()
  }, [instituteId])

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })


  const quickActions = [
    { icon: '👤', label: 'Add Student', color: 'rgba(214,40,40,0.15)', iconColor: 'var(--red)', action: () => navigate('/admin/students') },
    { icon: '✓',  label: 'Mark Attendance', color: 'rgba(46,204,113,0.12)', iconColor: 'var(--success)', action: () => navigate('/admin/attendance') },
    { icon: '₹',  label: 'Record Payment', color: 'rgba(201,168,76,0.12)', iconColor: 'var(--gold)', action: () => navigate('/admin/fees') },
    { icon: '📅', label: 'Add Schedule', color: 'rgba(41,128,185,0.12)', iconColor: 'var(--info)', action: () => navigate('/admin/schedule') },
  ]

  return (
    <>
      <TopBar name={profile?.full_name} role="admin" />
      <main className="page-content">
        {/* Greeting */}
        <div className="greeting-section">
          <div className="greeting-sub">Sabeum</div>
          <div className="greeting-name">{profile?.full_name || '…'}</div>
          <div className="greeting-date">{today}</div>
        </div>

        <div className="section-pad" style={{ paddingTop: 0 }}>
          {/* Stats */}
          <div className="stat-grid mb-16">
            <StatCard label="Active Students" value={stats?.totalStudents ?? 0} icon="👥" />
            <StatCard label="Today's Attendance" value={stats?.todayAttendancePct ?? 0} suffix="%" icon="✓" />
            <StatCard label="Fees Due" value={stats?.feesDue ?? 0} icon="₹" />
            <StatCard label="Active Batches" value={stats?.activeBatches ?? 0} icon="🥋" />
          </div>

          {/* Quick Actions */}
          <div className="section-header">
            <span className="section-title">Quick Actions</span>
          </div>
          <div className="quick-grid mb-16">
            {quickActions.map(qa => (
              <button key={qa.label} className="quick-btn" onClick={qa.action} id={`qa-${qa.label.replace(/\s+/g,'-').toLowerCase()}`}>
                <div className="quick-btn-icon" style={{ background: qa.color }}>
                  <span style={{ fontSize: 22, color: qa.iconColor }}>{qa.icon}</span>
                </div>
                <div className="quick-btn-label">{qa.label}</div>
              </button>
            ))}
          </div>

          {/* Recent Activity */}
          <div className="section-header">
            <span className="section-title">Recent Activity</span>
          </div>
          <div className="card">
            {loading ? (
              <div style={{ padding: '20px 0', textAlign: 'center' }}><div className="spinner" /></div>
            ) : activity.length === 0 ? (
              <div className="empty-state" style={{ padding: '20px 0' }}>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No recent activity</div>
              </div>
            ) : activity.map(item => (
              <div key={item.id} className="activity-item">
                <div className={`activity-dot activity-dot-${item.type}`} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                    {item.type === 'attendance' ? `Marked ${item.detail}` : `Payment — ${item.detail}`}
                  </div>
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                  {new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <BottomNav role="admin" />
    </>
  )
}
