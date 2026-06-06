import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getSchedules, getBatches, createSchedule, deleteSchedule } from '../lib/queries'
import TopBar from '../components/ui/TopBar'
import BottomNav from '../components/ui/BottomNav'

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
const LEVEL_COLOR = { Beginner:'tt-block-beginner', Intermediate:'tt-block-intermediate', Advanced:'tt-block-advanced' }

function AddScheduleModal({ batches, onClose, onSaved }) {
  const [form, setForm] = useState({ batch_id:'', day_of_week:'Monday', start_time:'09:00', end_time:'10:00', location:'Main Dojang' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await createSchedule(form)
      onSaved()
    } catch(err) { setError(err.message) }
    setLoading(false)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle" />
        <h3 style={{ fontSize:16, fontWeight:700, marginBottom:16 }}>Add Schedule</h3>
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div>
            <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:6 }}>Batch</div>
            <select className="select-field" value={form.batch_id} onChange={set('batch_id')} required>
              <option value="">Select batch</option>
              {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:6 }}>Day</div>
            <select className="select-field" value={form.day_of_week} onChange={set('day_of_week')}>
              {DAYS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div>
              <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:6 }}>Start Time</div>
              <input type="time" className="select-field" value={form.start_time} onChange={set('start_time')} required />
            </div>
            <div>
              <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:6 }}>End Time</div>
              <input type="time" className="select-field" value={form.end_time} onChange={set('end_time')} required />
            </div>
          </div>
          <div className="input-wrap">
            <input className="input-field" id="sch-location" type="text" placeholder="Location" value={form.location} onChange={set('location')} />
            <label className="input-label" htmlFor="sch-location">Location</label>
          </div>
          {error && <div className="error-msg">{error}</div>}
          <div style={{ display:'flex', gap:10 }}>
            <button type="button" className="btn btn-secondary" style={{ flex:1 }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex:1 }} disabled={loading}>{loading?'Saving…':'Add'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function BlockDetail({ block, onClose, onDelete, isAdmin }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle" />
        <div style={{ marginBottom:16 }}>
          <h3 style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:24 }}>{block.batches?.name}</h3>
          <span className={`badge badge-${block.batches?.level === 'Beginner' ? 'blue' : block.batches?.level === 'Intermediate' ? 'warning' : 'danger'}`}>
            {block.batches?.level}
          </span>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:10, fontSize:14 }}>
          <div style={{ display:'flex', gap:12 }}>
            <span style={{ color:'var(--text-muted)', width:80, fontSize:12 }}>Day</span>
            <span>{block.day_of_week}</span>
          </div>
          <div style={{ display:'flex', gap:12 }}>
            <span style={{ color:'var(--text-muted)', width:80, fontSize:12 }}>Time</span>
            <span>{block.start_time?.slice(0,5)} – {block.end_time?.slice(0,5)}</span>
          </div>
          <div style={{ display:'flex', gap:12 }}>
            <span style={{ color:'var(--text-muted)', width:80, fontSize:12 }}>Location</span>
            <span>{block.location || 'Main Dojang'}</span>
          </div>
          <div style={{ display:'flex', gap:12 }}>
            <span style={{ color:'var(--text-muted)', width:80, fontSize:12 }}>Coach</span>
            <span>{block.batches?.coaches?.profiles?.full_name || '—'}</span>
          </div>
        </div>
        <div style={{ display:'flex', gap:10, marginTop:20 }}>
          <button className="btn btn-secondary" style={{ flex:1 }} onClick={onClose}>Close</button>
          {isAdmin && <button className="btn btn-sm" style={{ background:'rgba(231,76,60,0.15)', color:'var(--danger)', border:'1px solid rgba(231,76,60,0.3)' }} onClick={() => { onDelete(block.id); onClose() }}>Delete</button>}
        </div>
      </div>
    </div>
  )
}

export default function Schedule({ role }) {
  const [myProfile, setMyProfile] = useState(null)
  const [schedules, setSchedules] = useState([])
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [selectedBlock, setSelectedBlock] = useState(null)
  const [studentBatchId, setStudentBatchId] = useState(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setMyProfile(prof)

      if (role === 'student') {
        const { data: st } = await supabase.from('students').select('batch_id').eq('profile_id', user.id).single()
        setStudentBatchId(st?.batch_id)
      }

      const [schs, bats] = await Promise.all([getSchedules(), getBatches()])
      setSchedules(schs)
      setBatches(bats)
      setLoading(false)
    }
    load()
  }, [])

  function load() {
    getSchedules().then(s => setSchedules(s))
  }

  // Group schedules by day
  const byDay = {}
  DAYS.forEach(d => { byDay[d] = [] })
  schedules.forEach(s => {
    if (role === 'student' && s.batch_id !== studentBatchId) return
    if (byDay[s.day_of_week]) byDay[s.day_of_week].push(s)
  })

  // Get current day
  const todayDay = DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]

  return (
    <>
      <TopBar name={myProfile?.full_name} role={role} />
      <main className="page-content">
        <div className="section-pad">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <h1 style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:28 }}>Schedule</h1>
            {role === 'admin' && (
              <button className="btn btn-sm btn-primary" onClick={() => setShowAdd(true)} id="add-schedule-btn">+ Add</button>
            )}
          </div>

          {/* Legend */}
          <div style={{ display:'flex', gap:12, marginBottom:16, flexWrap:'wrap' }}>
            {[['Beginner','var(--teal)'],['Intermediate','var(--warning)'],['Advanced','var(--red)']].map(([l,c]) => (
              <div key={l} style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'var(--text-muted)' }}>
                <div style={{ width:10, height:10, borderRadius:2, background:c, opacity:0.8 }} />
                {l}
              </div>
            ))}
          </div>

          {loading ? (
            <div style={{ padding:'40px 0', textAlign:'center' }}><div className="spinner" /></div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {DAYS.map(day => {
                const daySchedules = byDay[day] || []
                const isToday = day === todayDay
                return (
                  <div key={day} style={{ background: isToday ? 'rgba(201,168,76,0.04)' : 'var(--bg-card)', border:`1px solid ${isToday ? 'rgba(201,168,76,0.2)' : 'var(--border)'}`, borderRadius:14, overflow:'hidden' }}>
                    <div style={{ padding:'10px 14px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:13, fontWeight:600, color: isToday ? 'var(--gold)' : 'var(--text-primary)' }}>{day}</span>
                      {isToday && <span className="badge badge-gold">Today</span>}
                      <span style={{ marginLeft:'auto', fontSize:11, color:'var(--text-dim)' }}>{daySchedules.length} session{daySchedules.length !== 1 ? 's' : ''}</span>
                    </div>
                    {daySchedules.length === 0 ? (
                      <div style={{ padding:'12px 14px', fontSize:12, color:'var(--text-dim)' }}>No classes</div>
                    ) : (
                      daySchedules.map(s => {
                        const level = s.batches?.level || 'Beginner'
                        const colorClass = LEVEL_COLOR[level] || 'tt-block-beginner'
                        const isMyBatch = role === 'student' && s.batch_id === studentBatchId
                        return (
                          <div key={s.id} className={`tt-block ${colorClass}`}
                            style={{ margin:'8px 14px', cursor:'pointer', border: isMyBatch ? '1px solid var(--gold)' : undefined }}
                            onClick={() => setSelectedBlock(s)}>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                              <div>
                                <div style={{ fontSize:13, fontWeight:600 }}>{s.batches?.name}</div>
                                <div style={{ fontSize:11, marginTop:2, opacity:0.8 }}>{s.start_time?.slice(0,5)} – {s.end_time?.slice(0,5)}</div>
                                <div style={{ fontSize:11, marginTop:2, opacity:0.7 }}>📍 {s.location || 'Main Dojang'}</div>
                              </div>
                              <div style={{ textAlign:'right', fontSize:11, opacity:0.7 }}>
                                {s.batches?.coaches?.profiles?.full_name?.split(' ')[0]}
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
      <BottomNav role={role} />

      {showAdd && role === 'admin' && (
        <AddScheduleModal batches={batches} onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load() }} />
      )}
      {selectedBlock && (
        <BlockDetail block={selectedBlock} isAdmin={role==='admin'} onClose={() => setSelectedBlock(null)}
          onDelete={async id => { await deleteSchedule(id); load() }} />
      )}
    </>
  )
}
