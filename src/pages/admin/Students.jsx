import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { getStudents, getBatches, createStudent } from '../../lib/queries'
import TopBar from '../../components/ui/TopBar'
import BottomNav from '../../components/ui/BottomNav'
import Avatar from '../../components/ui/Avatar'
import BeltBadge from '../../components/ui/BeltBadge'
import { formatDate, currentMonthPayment } from '../../lib/utils'

const BELTS = ['White','Yellow','Green','Blue','Red','Black']

function AddStudentModal({ batches, onClose, onSaved }) {
  const [form, setForm] = useState({
    full_name:'', phone:'', email:'', password:'',
    dob:'', gender:'', blood_group:'', parent_name:'', parent_phone:'',
    address:'', emergency_contact:'', belt_level:'White', batch_id:'', join_date: new Date().toISOString().split('T')[0]
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      // Create auth user
      const { data: authData, error: authErr } = await supabase.auth.admin
        ? { data: null, error: { message: 'Use service key for admin create' } }
        : { data: null, error: null }

      // Use sign-up instead (works with anon key)
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { full_name: form.full_name, role: 'student' } }
      })
      if (signUpErr) throw signUpErr

      const profileId = signUpData.user?.id
      if (!profileId) throw new Error('Could not create user account')

      // Update profile
      await supabase.from('profiles').upsert({
        id: profileId, full_name: form.full_name, phone: form.phone, role: 'student'
      })

      // Create student record
      await supabase.from('students').insert({
        profile_id: profileId,
        dob: form.dob || null, gender: form.gender, blood_group: form.blood_group,
        parent_name: form.parent_name, parent_phone: form.parent_phone,
        address: form.address, emergency_contact: form.emergency_contact,
        belt_level: form.belt_level, join_date: form.join_date,
        batch_id: form.batch_id || null, status: 'active'
      })

      onSaved()
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  const fields = [
    { k:'full_name', label:'Full Name', type:'text', required:true },
    { k:'email', label:'Email', type:'email', required:true },
    { k:'password', label:'Temp Password', type:'password', required:true },
    { k:'phone', label:'Phone', type:'tel' },
    { k:'dob', label:'Date of Birth', type:'date' },
    { k:'parent_name', label:'Parent Name', type:'text' },
    { k:'parent_phone', label:'Parent Phone', type:'tel' },
    { k:'address', label:'Address', type:'text' },
    { k:'emergency_contact', label:'Emergency Contact', type:'tel' },
    { k:'join_date', label:'Join Date', type:'date' },
  ]

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle" />
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Add New Student</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {fields.map(f => (
            <div key={f.k} className="input-wrap">
              <input className="input-field" id={`add-${f.k}`} type={f.type} placeholder={f.label}
                value={form[f.k]} onChange={set(f.k)} required={f.required} />
              <label className="input-label" htmlFor={`add-${f.k}`}>{f.label}</label>
            </div>
          ))}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Gender</div>
              <select className="select-field" value={form.gender} onChange={set('gender')}>
                <option value="">Select</option>
                <option>Male</option><option>Female</option><option>Other</option>
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Blood Group</div>
              <select className="select-field" value={form.blood_group} onChange={set('blood_group')}>
                <option value="">Select</option>
                {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Belt Level</div>
            <select className="select-field" value={form.belt_level} onChange={set('belt_level')}>
              {BELTS.map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Assign Batch</div>
            <select className="select-field" value={form.batch_id} onChange={set('batch_id')}>
              <option value="">No batch</option>
              {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>

          {error && <div className="error-msg">{error}</div>}
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? 'Saving…' : 'Add Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminStudents() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [students, setStudents] = useState([])
  const [batches, setBatches] = useState([])
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterBelt, setFilterBelt] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const [s, b] = await Promise.all([
      getStudents({ search, status: filterStatus, belt: filterBelt }),
      getBatches()
    ])
    setStudents(s)
    setBatches(b)
    setLoading(false)
  }, [search, filterStatus, filterBelt])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => setProfile(data))
    })
  }, [])

  useEffect(() => { load() }, [load])

  function getFeeStatus(payments = []) {
    const cur = currentMonthPayment(payments)
    if (!cur) return { label: 'No Fee', cls: 'badge-muted' }
    if (cur.status === 'paid') return { label: 'Paid', cls: 'badge-success' }
    if (cur.status === 'overdue') return { label: 'Overdue', cls: 'badge-danger' }
    const days = Math.ceil((new Date(cur.due_date) - new Date()) / 86400000)
    if (days <= 7) return { label: 'Due Soon', cls: 'badge-warning' }
    return { label: 'Unpaid', cls: 'badge-muted' }
  }

  const chips = [
    { label: 'All', status: '' },
    { label: 'Active', status: 'active' },
    { label: 'Inactive', status: 'inactive' },
    { label: 'On Leave', status: 'on_leave' },
  ]

  return (
    <>
      <TopBar name={profile?.full_name} role="admin" />
      <main className="page-content">
        <div className="section-pad">
          <h1 style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize: 28, marginBottom: 16 }}>Students</h1>

          {/* Search */}
          <div className="search-wrap mb-12">
            <span className="search-icon">🔍</span>
            <input className="input-search" placeholder="Search students…" value={search}
              onChange={e => setSearch(e.target.value)} id="student-search" />
          </div>

          {/* Status filter chips */}
          <div className="chip-row mb-12">
            {chips.map(c => (
              <button key={c.status} className={`chip ${filterStatus === c.status ? 'active' : ''}`}
                onClick={() => setFilterStatus(c.status)}>{c.label}</button>
            ))}
          </div>

          {/* Belt filter chips */}
          <div className="chip-row mb-16">
            <button className={`chip ${filterBelt === '' ? 'active' : ''}`} onClick={() => setFilterBelt('')}>All Belts</button>
            {BELTS.map(b => (
              <button key={b} className={`chip ${filterBelt === b ? 'active' : ''}`}
                onClick={() => setFilterBelt(b)}>{b}</button>
            ))}
          </div>

          {/* Student list */}
          {loading ? (
            <div style={{ padding: '40px 0', textAlign: 'center' }}><div className="spinner" /></div>
          ) : students.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🥋</div>
              <div>No students found</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {students.map(st => {
                const feeStatus = getFeeStatus(st.payments)
                const isOverdue = feeStatus.label === 'Overdue'
                return (
                  <div key={st.id} className={`student-card card-tap ${isOverdue ? 'overdue' : ''}`}
                    onClick={() => navigate(`/admin/students/${st.id}`)}>
                    <Avatar name={st.profiles?.full_name} belt={st.belt_level} size="md" />
                    <div className="student-info">
                      <div className="student-name">{st.profiles?.full_name}</div>
                      <div className="student-meta">
                        {st.batches?.name || 'No batch'} · Joined {formatDate(st.join_date)}
                      </div>
                      <div className="student-stats">
                        <BeltBadge belt={st.belt_level} rankNumber={st.belt_rank_number} />
                        <span className={`badge ${feeStatus.cls}`}>{feeStatus.label}</span>
                        {st.status !== 'active' && (
                          <span className="badge badge-muted" style={{ textTransform: 'capitalize' }}>{st.status.replace('_',' ')}</span>
                        )}
                      </div>
                    </div>
                    <div style={{ fontSize: 18, color: 'var(--text-dim)' }}>›</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {/* FAB */}
      <button className="fab" onClick={() => setShowAdd(true)} id="add-student-fab">+</button>
      <BottomNav role="admin" />

      {showAdd && (
        <AddStudentModal batches={batches} onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load() }} />
      )}
    </>
  )
}
