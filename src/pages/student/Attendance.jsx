import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import TopBar from '../../components/ui/TopBar'
import BottomNav from '../../components/ui/BottomNav'
import Avatar from '../../components/ui/Avatar'

const STATUS_STYLE = {
  present: { bg: 'rgba(46,204,113,0.15)', color: 'var(--success)', label: '✓' },
  absent:  { bg: 'rgba(214,40,40,0.15)',  color: 'var(--red)',     label: '✗' },
  late:    { bg: 'rgba(243,156,18,0.15)', color: 'var(--warning)', label: '~' },
}

export default function StudentAttendance() {
  const [myProfile, setMyProfile] = useState(null)
  const [student, setStudent]     = useState(null)
  const [logs, setLogs]           = useState([])
  const [monthOffset, setMonthOffset] = useState(0)
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: prof }     = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setMyProfile(prof)

      const { data: stu } = await supabase.from('students')
        .select('id, belt_level, batch_id, batches(name)')
        .eq('profile_id', user.id).single()
      if (!stu) { setLoading(false); return }
      setStudent(stu)

      const { data: al } = await supabase.from('attendance_logs')
        .select('id, date, status').eq('student_id', stu.id).order('date', { ascending: false })
      setLogs(al || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>

  // Calendar for selected month
  const now         = new Date()
  const viewDate    = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
  const year        = viewDate.getFullYear()
  const month       = viewDate.getMonth()
  const monthLabel  = viewDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
  const firstDay    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const logMap = {}
  logs.forEach(l => { logMap[l.date] = l.status })

  const monthLogs  = logs.filter(l => {
    const d = new Date(l.date)
    return d.getFullYear() === year && d.getMonth() === month
  })
  const presentCount = monthLogs.filter(l => l.status === 'present').length
  const absentCount  = monthLogs.filter(l => l.status === 'absent').length
  const lateCount    = monthLogs.filter(l => l.status === 'late').length
  const totalMarked  = presentCount + absentCount + lateCount
  const pct          = totalMarked > 0 ? Math.round(((presentCount + lateCount * 0.5) / totalMarked) * 100) : 0

  return (
    <>
      <TopBar name={myProfile?.full_name} role="student" />
      <main className="page-content">
        <div className="section-pad">
          <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, marginBottom: 4 }}>My Attendance</h1>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
            {student?.batches?.name || 'Your batch'}
          </div>

          {/* ── Month navigator ─────────────────────────── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <button onClick={() => setMonthOffset(o => o - 1)}
              style={{ background: 'var(--bg-card)', border: 'none', color: 'var(--text-primary)', width: 36, height: 36, borderRadius: 10, cursor: 'pointer', fontSize: 18 }}>
              ‹
            </button>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, letterSpacing: '0.05em' }}>
              {monthLabel}
            </div>
            <button onClick={() => setMonthOffset(o => Math.min(0, o + 1))}
              style={{ background: 'var(--bg-card)', border: 'none', color: monthOffset >= 0 ? 'var(--text-dim)' : 'var(--text-primary)', width: 36, height: 36, borderRadius: 10, cursor: monthOffset >= 0 ? 'default' : 'pointer', fontSize: 18 }}
              disabled={monthOffset >= 0}>
              ›
            </button>
          </div>

          {/* ── Stats row ───────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
            {[
              { label: 'Present', value: presentCount, color: 'var(--success)' },
              { label: 'Absent',  value: absentCount,  color: 'var(--red)'     },
              { label: 'Late',    value: lateCount,     color: 'var(--warning)' },
              { label: 'Rate',    value: `${pct}%`,     color: 'var(--gold)'   },
            ].map(s => (
              <div key={s.label} className="card" style={{ textAlign: 'center', padding: '10px 4px' }}>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* ── Calendar ─────────────────────────────────── */}
          <div className="card" style={{ padding: '14px 10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, textAlign: 'center', marginBottom: 8 }}>
              {['S','M','T','W','T','F','S'].map((d, i) => (
                <div key={i} style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 600, paddingBottom: 4 }}>{d}</div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, textAlign: 'center' }}>
              {/* Blank cells for first week */}
              {Array(firstDay).fill(null).map((_, i) => <div key={`blank-${i}`} />)}
              {/* Days */}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                const status  = logMap[dateStr]
                const style   = STATUS_STYLE[status]
                const isToday = dateStr === new Date().toISOString().split('T')[0]
                return (
                  <div key={day} style={{
                    width: '100%', aspectRatio: '1', borderRadius: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: status ? 700 : 400,
                    background: style?.bg || 'transparent',
                    color: style?.color || (isToday ? 'var(--gold)' : 'var(--text-primary)'),
                    outline: isToday ? '1px solid var(--gold)' : 'none',
                    position: 'relative',
                  }}>
                    {style?.label || day}
                  </div>
                )
              })}
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginTop: 12, fontSize: 11, color: 'var(--text-muted)' }}>
              {[['Present','var(--success)','✓'],['Absent','var(--red)','✗'],['Late','var(--warning)','~']].map(([l, c, sym]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ color: c, fontWeight: 700 }}>{sym}</span> {l}
                </div>
              ))}
            </div>
          </div>

          {/* ── Recent Log ──────────────────────────────── */}
          {logs.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Recent History</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {logs.slice(0, 10).map(l => {
                  const st = STATUS_STYLE[l.status]
                  return (
                    <div key={l.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: 'var(--bg-card)', borderRadius: 10, padding: '10px 14px',
                    }}>
                      <div style={{ fontSize: 13 }}>
                        {new Date(l.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: st?.color, background: st?.bg, padding: '2px 10px', borderRadius: 20 }}>
                        {l.status}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {!student && (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
              No attendance records yet
            </div>
          )}
        </div>
      </main>
      <BottomNav role="student" />
    </>
  )
}
