import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getBatches, getBatchStudents, getAttendanceForDate, submitAttendance } from '../lib/queries'
import TopBar from '../components/ui/TopBar'
import BottomNav from '../components/ui/BottomNav'
import Avatar from '../components/ui/Avatar'
import BeltBadge from '../components/ui/BeltBadge'

export default function AttendanceMarking() {
  const navigate = useNavigate()
  const location = useLocation()
  const [myProfile, setMyProfile] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [batches, setBatches] = useState([])
  const [selectedBatch, setSelectedBatch] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [students, setStudents] = useState([])
  const [attendance, setAttendance] = useState({}) // { studentId: 'present'|'absent'|'late' }
  const [existingAttendance, setExistingAttendance] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setMyProfile(prof)
      setUserRole(prof.role)

      let batchList = []
      if (prof.role === 'admin') {
        batchList = await getBatches()
      } else {
        // Coach — only their batches
        const { data: coachData } = await supabase.from('coaches').select('id').eq('profile_id', user.id).single()
        if (coachData) {
          const { data: cb } = await supabase.from('batches').select('*').eq('coach_id', coachData.id)
          batchList = cb || []
        }
      }
      setBatches(batchList)
      if (batchList.length > 0) setSelectedBatch(batchList[0].id)
    }
    loadUser()
  }, [])

  useEffect(() => {
    if (!selectedBatch || !selectedDate) return
    loadBatchData()
  }, [selectedBatch, selectedDate])

  async function loadBatchData() {
    setLoading(true)
    const [stds, existing] = await Promise.all([
      getBatchStudents(selectedBatch),
      getAttendanceForDate(selectedBatch, selectedDate),
    ])
    setStudents(stds)
    setExistingAttendance(existing)

    if (existing.length > 0) {
      const map = {}
      existing.forEach(e => { map[e.student_id] = e.status })
      setAttendance(map)
      setSubmitted(true)
      setEditMode(false)
    } else {
      setAttendance({})
      setSubmitted(false)
      setEditMode(true)
    }
    setLoading(false)
  }

  function markAll(status) {
    const map = {}
    students.forEach(s => { map[s.id] = status })
    setAttendance(map)
  }

  async function handleSubmit() {
    setSubmitting(true); setError('')
    const { data: { user } } = await supabase.auth.getUser()
    const records = students.map(s => ({
      student_id: s.id,
      batch_id: selectedBatch,
      date: selectedDate,
      status: attendance[s.id] || 'absent',
      marked_by: user.id,
    }))
    try {
      await submitAttendance(records)
      setSubmitted(true)
      setEditMode(false)
    } catch (e) { setError(e.message) }
    setSubmitting(false)
  }

  const canEdit = userRole === 'admin' || !submitted
  const isReadOnly = submitted && !editMode

  return (
    <>
      <TopBar name={myProfile?.full_name} role={userRole} />
      <main className="page-content">
        <div className="section-pad">
          <h1 style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:28, marginBottom:16 }}>Attendance</h1>

          {/* Date + Batch selectors */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
            <div>
              <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:6 }}>Date</div>
              <input type="date" className="select-field"
                value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]} />
            </div>
            <div>
              <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:6 }}>Batch</div>
              <select className="select-field" value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)} id="batch-selector">
                {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          </div>

          {/* Status banner */}
          {submitted && (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:'rgba(46,204,113,0.1)', border:'1px solid rgba(46,204,113,0.3)', borderRadius:10, marginBottom:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'var(--success)' }}>
                ✓ Attendance marked for this session
              </div>
              {userRole === 'admin' && !editMode && (
                <button className="btn btn-secondary btn-sm" onClick={() => setEditMode(true)}>Edit</button>
              )}
            </div>
          )}

          {/* Mark all buttons */}
          {!isReadOnly && students.length > 0 && (
            <div style={{ display:'flex', gap:8, marginBottom:12 }}>
              <button className="btn btn-sm" style={{ background:'rgba(46,204,113,0.15)', color:'var(--success)', border:'1px solid rgba(46,204,113,0.3)', flex:1 }} onClick={() => markAll('present')}>All Present</button>
              <button className="btn btn-sm" style={{ background:'rgba(231,76,60,0.15)', color:'var(--danger)', border:'1px solid rgba(231,76,60,0.3)', flex:1 }} onClick={() => markAll('absent')}>All Absent</button>
            </div>
          )}

          {/* Student list */}
          {loading ? (
            <div style={{ padding:'40px 0', textAlign:'center' }}><div className="spinner" /></div>
          ) : students.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">👥</div>
              <div>{batches.length === 0 ? 'No batches assigned' : 'No students in this batch'}</div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {students.map(st => {
                const status = attendance[st.id]
                const name = st.profiles?.full_name || 'Unknown'
                const rowBg = status === 'present' ? 'rgba(46,204,113,0.06)' : status === 'absent' ? 'rgba(231,76,60,0.06)' : status === 'late' ? 'rgba(243,156,18,0.06)' : 'var(--bg-card)'
                return (
                  <div key={st.id} style={{ background:rowBg, border:'1px solid var(--border)', borderRadius:14, padding:'12px 14px', transition:'background 0.2s' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom: isReadOnly ? 0 : 10 }}>
                      <Avatar name={name} belt={st.belt_level} size="sm" />
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:14, fontWeight:500 }}>{name}</div>
                        <BeltBadge belt={st.belt_level} rankNumber={st.belt_rank_number} />
                      </div>
                      {isReadOnly && (
                        <span className={`badge ${status==='present'?'badge-success':status==='absent'?'badge-danger':'badge-warning'}`} style={{ textTransform:'capitalize' }}>
                          {status || 'absent'}
                        </span>
                      )}
                    </div>
                    {!isReadOnly && (
                      <div className="att-btn-group">
                        {['present','late','absent'].map(s => (
                          <button key={s} className={`att-btn ${s} ${status === s ? 'selected' : ''}`}
                            style={{ opacity: status && status !== s ? 0.5 : 1 }}
                            onClick={() => setAttendance(prev => ({ ...prev, [st.id]: s }))}>
                            {s === 'present' ? '✓ Present' : s === 'late' ? '⏰ Late' : '✗ Absent'}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {/* Sticky submit button */}
      {!isReadOnly && students.length > 0 && (
        <div className="sticky-bottom" style={{ position:'fixed', bottom:'var(--nav-height)', left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:'var(--app-max)', zIndex:99 }}>
          {error && <div className="error-msg" style={{ marginBottom:8 }}>{error}</div>}
          <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:6, textAlign:'center' }}>
            {Object.keys(attendance).length} / {students.length} students marked
          </div>
          <button className="btn btn-primary" disabled={submitting} onClick={handleSubmit} id="submit-attendance">
            {submitting ? 'Saving…' : submitted ? '✓ Update Attendance' : '✓ Submit Attendance'}
          </button>
        </div>
      )}
      <BottomNav role={userRole === 'admin' ? 'admin' : 'coach'} />
    </>
  )
}
