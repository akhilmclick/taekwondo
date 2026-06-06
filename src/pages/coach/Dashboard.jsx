import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { getCoachByProfileId, getCoachTodayBatches, getStudentCount } from '../../lib/queries'
import TopBar from '../../components/ui/TopBar'
import BottomNav from '../../components/ui/BottomNav'

export default function CoachDashboard() {
  const navigate = useNavigate()
  const [myProfile, setMyProfile] = useState(null)
  const [coach, setCoach] = useState(null)
  const [todayBatches, setTodayBatches] = useState([])
  const [studentCounts, setStudentCounts] = useState({})
  const [recentSessions, setRecentSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setMyProfile(prof)

      try {
        const coachData = await getCoachByProfileId(user.id)
        setCoach(coachData)

        const today = await getCoachTodayBatches(coachData.id)
        setTodayBatches(today)

        // Fetch student counts for each batch
        const counts = {}
        await Promise.all((coachData.batches || []).map(async b => {
          counts[b.id] = await getStudentCount(b.id)
        }))
        setStudentCounts(counts)

        // Recent attendance sessions (last 3)
        const { data: recent } = await supabase
          .from('attendance_logs')
          .select('date, batch_id, batches(name)')
          .eq('marked_by', user.id)
          .order('created_at', { ascending: false })
          .limit(30)

        // De-duplicate by date+batch
        const seen = new Set()
        const sessions = []
        ;(recent || []).forEach(r => {
          const key = `${r.date}-${r.batch_id}`
          if (!seen.has(key)) { seen.add(key); sessions.push(r) }
        })
        setRecentSessions(sessions.slice(0,3))
      } catch (e) { console.error(e) }
      setLoading(false)
    }
    load()
  }, [])

  const danMap = { 1:'1st',2:'2nd',3:'3rd',4:'4th',5:'5th',6:'6th',7:'7th',8:'8th',9:'9th' }
  const today = new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long' })

  return (
    <>
      <TopBar name={myProfile?.full_name} role="coach" />
      <main className="page-content">
        <div className="greeting-section">
          <div className="greeting-sub">Coach</div>
          <div className="greeting-name">{myProfile?.full_name || '…'}</div>
          <div className="greeting-date">
            {coach && <span style={{ color:'var(--gold)' }}>{danMap[coach.dan_level] || ''} Dan</span>}
            {coach ? ' · ' : ''}{today}
          </div>
        </div>

        <div className="section-pad" style={{ paddingTop:0 }}>
          {/* Today's Batches */}
          <div className="section-header mb-12">
            <span className="section-title">Today's Sessions</span>
          </div>

          {loading ? (
            <div style={{ padding:'30px 0', textAlign:'center' }}><div className="spinner" /></div>
          ) : todayBatches.length === 0 ? (
            <div className="card mb-16" style={{ textAlign:'center', padding:'24px' }}>
              <div style={{ fontSize:36, marginBottom:8 }}>🏖️</div>
              <div style={{ fontSize:14, color:'var(--text-muted)' }}>No sessions scheduled for today</div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:20 }}>
              {todayBatches.map(s => (
                <div key={s.id} className="today-class-card">
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 }}>
                    <div>
                      <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:20 }}>{s.batches?.name}</div>
                      <div style={{ fontSize:12, color:'var(--text-muted)' }}>
                        {s.start_time?.slice(0,5)} – {s.end_time?.slice(0,5)} · {s.location || 'Main Dojang'}
                      </div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:28, color:'var(--gold)', lineHeight:1 }}>
                        {studentCounts[s.batches?.id] || 0}
                      </div>
                      <div style={{ fontSize:10, color:'var(--text-muted)' }}>students</div>
                    </div>
                  </div>
                  <button className="btn btn-primary btn-sm" style={{ width:'100%' }}
                    onClick={() => navigate('/coach/attendance', { state: { batchId: s.batches?.id } })}
                    id={`mark-att-${s.id}`}>
                    ✓ Mark Attendance
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* All My Batches */}
          {coach?.batches && coach.batches.length > 0 && (
            <>
              <div className="section-header mb-12">
                <span className="section-title">My Batches</span>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:20 }}>
                {coach.batches.map(b => (
                  <div key={b.id} className="card" style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div>
                      <div style={{ fontSize:14, fontWeight:600 }}>{b.name}</div>
                      <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>{b.level} · Max {b.max_capacity}</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:24, color:'var(--gold)' }}>{studentCounts[b.id] || 0}</div>
                      <div style={{ fontSize:10, color:'var(--text-muted)' }}>enrolled</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Recent Sessions */}
          {recentSessions.length > 0 && (
            <>
              <div className="section-header mb-12">
                <span className="section-title">Recent Sessions</span>
              </div>
              <div className="card">
                {recentSessions.map((s, i) => (
                  <div key={i} className="activity-item">
                    <div className="activity-dot" style={{ background:'var(--success)' }} />
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:500 }}>{s.batches?.name}</div>
                      <div style={{ fontSize:11, color:'var(--text-muted)' }}>Attendance marked</div>
                    </div>
                    <div style={{ fontSize:11, color:'var(--text-dim)' }}>
                      {new Date(s.date).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
      <BottomNav role="coach" />
    </>
  )
}
