import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { getMyStudentProfile } from '../../lib/queries'
import TopBar from '../../components/ui/TopBar'
import BottomNav from '../../components/ui/BottomNav'
import BeltBadge from '../../components/ui/BeltBadge'
import CircularProgress from '../../components/ui/CircularProgress'
import { daysUntil, getAttendancePercent, currentMonthPayment, formatDate } from '../../lib/utils'

const BELT_BG = { White:'linear-gradient(135deg,#555 0%,#333 100%)', Yellow:'linear-gradient(135deg,#8a6e00 0%,#5a4700 100%)', Green:'linear-gradient(135deg,#1a6e40 0%,#0e4228 100%)', Blue:'linear-gradient(135deg,#1a5280 0%,#0d3050 100%)', Red:'linear-gradient(135deg,#7B241C 0%,#4a1510 100%)', Black:'linear-gradient(135deg,#1A1A1A 0%,#000 100%)' }

export default function StudentDashboard() {
  const navigate = useNavigate()
  const [myProfile, setMyProfile] = useState(null)
  const [student, setStudent] = useState(null)
  const [todaySchedule, setTodaySchedule] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setMyProfile(prof)
      try {
        const st = await getMyStudentProfile(user.id)
        setStudent(st)
        // Get today's schedule
        const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
        const today = days[new Date().getDay()]
        if (st.batch_id) {
          const { data: sch } = await supabase.from('schedules').select('*').eq('batch_id', st.batch_id).eq('day_of_week', today).single()
          setTodaySchedule(sch)
        }
      } catch(e) { console.error(e) }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>

  const belt = student?.belt_level || 'White'
  const attPct = getAttendancePercent(student?.attendance_logs || [])
  const curPayment = currentMonthPayment(student?.payments || [])
  const daysToGrading = daysUntil(student?.next_grading_date)

  const quickLinks = [
    { icon:'👤', label:'My Profile', path:'/student/profile' },
    { icon:'📊', label:'Attendance', path:'/student/profile' },
    { icon:'₹', label:'Fee History', path:'/student/profile' },
    { icon:'📅', label:'Schedule', path:'/student/schedule' },
  ]

  return (
    <>
      <TopBar name={myProfile?.full_name} role="student" />
      <main className="page-content">
        <div className="greeting-section">
          <div className="greeting-sub">Sabeum-nim</div>
          <div className="greeting-name">{myProfile?.full_name || '…'}</div>
          <div className="greeting-date">{new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}</div>
        </div>

        <div className="section-pad" style={{ paddingTop:0 }}>
          {/* Belt Card */}
          <div className="mb-12" style={{ background: BELT_BG[belt] || BELT_BG.White, border: belt==='Black'?'1px solid var(--gold)':'1px solid rgba(255,255,255,0.1)', borderRadius:20, padding:'20px', textAlign:'center', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:-20, right:-20, width:100, height:100, borderRadius:'50%', background:'rgba(255,255,255,0.05)' }} />
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.6)', letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:8 }}>Current Belt</div>
            <BeltBadge belt={belt} rankNumber={student?.belt_rank_number} />
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:36, marginTop:8, letterSpacing:'0.05em' }}>{belt} Belt</div>
            {daysToGrading !== null && (
              <div style={{ marginTop:6, fontSize:12, color:'rgba(255,255,255,0.7)' }}>
                {daysToGrading > 0 ? `⏰ ${daysToGrading} days to next grading` : daysToGrading === 0 ? '🎯 Grading today!' : '📋 Past grading date'}
              </div>
            )}
          </div>

          {/* Today's Class */}
          <div className={`mb-12 ${todaySchedule ? 'today-class-card' : 'card'}`}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:40, height:40, borderRadius:12, background:'rgba(214,40,40,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>📅</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, color:'var(--text-muted)' }}>Today's Class</div>
                {todaySchedule ? (
                  <>
                    <div style={{ fontSize:15, fontWeight:600 }}>{student?.batches?.name}</div>
                    <div style={{ fontSize:12, color:'var(--text-muted)' }}>
                      {todaySchedule.start_time?.slice(0,5)} – {todaySchedule.end_time?.slice(0,5)} · {todaySchedule.location || 'Main Dojang'}
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize:14, color:'var(--text-muted)' }}>No class scheduled today</div>
                )}
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
            {/* Attendance Ring */}
            <div className="card" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
              <CircularProgress percent={attPct} size={72} label="Attendance" />
              <div style={{ fontSize:11, color:'var(--text-muted)' }}>This month</div>
            </div>

            {/* Fee Status */}
            <div className="card" style={{ display:'flex', flexDirection:'column', justifyContent:'center' }}>
              <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:6 }}>Fee Status</div>
              {curPayment ? (
                <>
                  <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:28, color:'var(--gold)', lineHeight:1 }}>₹{Number(curPayment.amount).toLocaleString()}</div>
                  <span className={`badge ${curPayment.status==='paid'?'badge-success':curPayment.status==='overdue'?'badge-danger':'badge-warning'}`} style={{ marginTop:6, alignSelf:'flex-start' }}>
                    {curPayment.status}
                  </span>
                  {curPayment.status !== 'paid' && (
                    <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>Due {formatDate(curPayment.due_date)}</div>
                  )}
                </>
              ) : (
                <div style={{ fontSize:13, color:'var(--text-muted)' }}>No fee this month</div>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="section-header mb-8">
            <span className="section-title">Quick Links</span>
          </div>
          <div className="quick-grid">
            {quickLinks.map(ql => (
              <button key={ql.label} className="quick-btn" onClick={() => navigate(ql.path)}>
                <div className="quick-btn-icon" style={{ background:'rgba(201,168,76,0.1)' }}>
                  <span style={{ fontSize:22 }}>{ql.icon}</span>
                </div>
                <div className="quick-btn-label">{ql.label}</div>
              </button>
            ))}
          </div>
        </div>
      </main>
      <BottomNav role="student" />
    </>
  )
}
