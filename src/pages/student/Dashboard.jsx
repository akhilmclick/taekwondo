import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { getMyStudentProfile } from '../../lib/queries'
import TopBar from '../../components/ui/TopBar'
import BottomNav from '../../components/ui/BottomNav'
import CircularProgress from '../../components/ui/CircularProgress'
import BeltBadge from '../../components/ui/BeltBadge'
import Avatar from '../../components/ui/Avatar'
import { formatDate, daysUntil, calcAge, getAttendancePercent, currentMonthPayment, BELT_ORDER } from '../../lib/utils'

const BELT_FULL = { White:'#E8E8E8', Yellow:'#F5C518', Green:'#27AE60', Blue:'#2980B9', Red:'#E74C3C', Black:'#1A1A1A' }

export default function StudentDashboard() {
  const navigate = useNavigate()
  const [myProfile, setMyProfile] = useState(null)
  const [student, setStudent]     = useState(null)
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setMyProfile(prof)
      try {
        const data = await getMyStudentProfile(user.id)
        setStudent(data)
      } catch (e) { console.log('No student record yet') }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>

  // No student record yet — show pending screen
  if (!student) {
    return (
      <>
        <TopBar name={myProfile?.full_name} role="student" />
        <main className="page-content">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🥋</div>
            <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, marginBottom: 8 }}>Welcome, {myProfile?.full_name?.split(' ')[0]}!</h2>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 280 }}>
              Your account is ready. Your coach will assign you to a batch and set up your training profile shortly.
            </p>
            <div style={{ marginTop: 24, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, fontSize: 13, color: 'var(--text-muted)' }}>
              📱 Contact your coach to get started
            </div>
          </div>
        </main>
        <BottomNav role="student" />
      </>
    )
  }

  const name         = myProfile?.full_name || 'Student'
  const belt         = student.belt_level || 'White'
  const beltColor    = BELT_FULL[belt]
  const attPct       = getAttendancePercent(student.attendance_logs || [])
  const daysToGrade  = daysUntil(student.next_grading_date)
  const curPayment   = currentMonthPayment(student.payments || [])
  const batchName    = student.batches?.name || '—'

  // Today's class
  const days        = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const todayName   = days[new Date().getDay()]
  const todayClass  = student.batches?.schedule?.find(s => s.day_of_week === todayName)

  // Month attendance stats
  const logs       = student.attendance_logs || []
  const thisMonth  = new Date()
  const monthLogs  = logs.filter(l => {
    const d = new Date(l.date)
    return d.getMonth() === thisMonth.getMonth() && d.getFullYear() === thisMonth.getFullYear()
  })
  const presentCount = monthLogs.filter(l => l.status === 'present').length
  const absentCount  = monthLogs.filter(l => l.status === 'absent').length

  const greetingHour = new Date().getHours()
  const greeting = greetingHour < 12 ? 'Good morning' : greetingHour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <>
      <TopBar name={myProfile?.full_name} role="student" />
      <main className="page-content">

        {/* ── Greeting ─────────────────────────────────── */}
        <div className="greeting-section">
          <div className="greeting-sub">{greeting}</div>
          <div className="greeting-name">{name.split(' ')[0]}</div>
          <div className="greeting-date">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </div>

        <div className="section-pad" style={{ paddingTop: 8 }}>

          {/* ── Belt Card ───────────────────────────────── */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(18,18,26,1) 0%, rgba(26,26,40,1) 100%)',
            border: belt === 'Black' ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.08)',
            borderLeft: `4px solid ${beltColor}`,
            borderRadius: 16, padding: '16px', marginBottom: 12,
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <Avatar name={name} belt={belt} size="lg" />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, lineHeight: 1 }}>{name}</div>
              <div style={{ marginTop: 4 }}><BeltBadge belt={belt} rankNumber={student.belt_rank_number} /></div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{batchName}</div>
            </div>
            {/* Belt bar visual */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <div style={{ width: 20, height: 60, borderRadius: 3, background: beltColor, border: belt === 'Black' ? '1px solid var(--gold)' : 'none', opacity: 0.9 }} />
              <div style={{ fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Belt</div>
            </div>
          </div>

          {/* ── Today's Class ───────────────────────────── */}
          {todayClass ? (
            <div className="today-class-card mb-12" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 28 }}>⏰</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Today's Class</div>
                <div style={{ fontSize: 16, fontWeight: 600, marginTop: 2 }}>
                  {todayClass.start_time?.slice(0, 5)} – {todayClass.end_time?.slice(0, 5)}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{todayClass.location || 'Main Dojang'}</div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => navigate('/student/schedule')}>View</button>
            </div>
          ) : (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 22 }}>📅</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No class today</div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Enjoy your rest day!</div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => navigate('/student/schedule')}>Schedule</button>
            </div>
          )}

          {/* ── Stats Row ────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>

            {/* Attendance ring */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer' }}
              onClick={() => navigate('/student/attendance')}>
              <CircularProgress percent={attPct} size={72} label="This month" />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 12, fontWeight: 600 }}>Attendance</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {presentCount}P · {absentCount}A
                </div>
              </div>
            </div>

            {/* Fees status */}
            <div className="card" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6 }}
              onClick={() => navigate('/student/fees')}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>This Month Fees</div>
              {curPayment ? (
                <>
                  <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: 'var(--gold)', lineHeight: 1 }}>
                    ₹{Number(curPayment.amount).toLocaleString()}
                  </div>
                  <span className={`badge ${curPayment.status === 'paid' ? 'badge-success' : curPayment.status === 'overdue' ? 'badge-danger' : 'badge-warning'}`}>
                    {curPayment.status}
                  </span>
                </>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>No record</div>
              )}
            </div>
          </div>

          {/* ── Next Grading ─────────────────────────────── */}
          {student.next_grading_date && (
            <div className="card mb-12" style={{
              border: daysToGrade !== null && daysToGrade <= 14 ? '1px solid rgba(243,156,18,0.4)' : 'var(--border)',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{ fontSize: 28 }}>🎖️</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: daysToGrade !== null && daysToGrade <= 14 ? 'var(--warning)' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Next Grading
                </div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{formatDate(student.next_grading_date)}</div>
                {daysToGrade !== null && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {daysToGrade > 0 ? `${daysToGrade} days away` : daysToGrade === 0 ? '🔔 Today!' : 'Date passed'}
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Next belt</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  {BELT_ORDER[BELT_ORDER.indexOf(belt) + 1] && (
                    <div style={{ width: 28, height: 10, borderRadius: 2, background: BELT_FULL[BELT_ORDER[BELT_ORDER.indexOf(belt) + 1]] }} />
                  )}
                  <span style={{ fontSize: 11 }}>{BELT_ORDER[BELT_ORDER.indexOf(belt) + 1] || 'Black 🏆'}</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Quick Nav ─────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { icon: '✓', label: 'Attendance', path: '/student/attendance', color: 'rgba(46,204,113,0.12)', iconColor: 'var(--success)' },
              { icon: '₹', label: 'Fees',       path: '/student/fees',       color: 'rgba(201,168,76,0.12)', iconColor: 'var(--gold)' },
              { icon: '📅', label: 'Schedule',  path: '/student/schedule',   color: 'rgba(41,128,185,0.12)', iconColor: 'var(--info)' },
              { icon: '👤', label: 'My Profile', path: '/student/profile',   color: 'rgba(214,40,40,0.12)', iconColor: 'var(--red)' },
            ].map(q => (
              <button key={q.path} className="quick-btn" onClick={() => navigate(q.path)} id={`quick-${q.label.toLowerCase().replace(' ','-')}`}>
                <div className="quick-btn-icon" style={{ background: q.color }}>
                  <span style={{ fontSize: 22, color: q.iconColor }}>{q.icon}</span>
                </div>
                <div className="quick-btn-label">{q.label}</div>
              </button>
            ))}
          </div>
        </div>
      </main>
      <BottomNav role="student" />
    </>
  )
}
