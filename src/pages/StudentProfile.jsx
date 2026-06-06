import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getStudentProfile, getMyStudentProfile, promoteBelt, updateStudent, upsertPayment } from '../lib/queries'
import TopBar from '../components/ui/TopBar'
import BottomNav from '../components/ui/BottomNav'
import Avatar from '../components/ui/Avatar'
import BeltBadge from '../components/ui/BeltBadge'
import ExpandableCard from '../components/ui/ExpandableCard'
import CircularProgress from '../components/ui/CircularProgress'
import AttendanceCalendar from '../components/ui/AttendanceCalendar'
import BeltTimeline from '../components/ui/BeltTimeline'
import { formatDate, daysUntil, calcAge, getAttendancePercent, currentMonthPayment, BELT_ORDER } from '../lib/utils'

const BELT_COLORS = { White:'#555', Yellow:'#8a6e00', Green:'#1a6e40', Blue:'#1a5280', Red:'#7B241C', Black:'#111' }
const BELT_FULL = { White:'#E8E8E8', Yellow:'#F5C518', Green:'#27AE60', Blue:'#2980B9', Red:'#E74C3C', Black:'#1A1A1A' }

function DetailRow({ label, value, highlight }) {
  if (!value && value !== 0) return null
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
      <span style={{ fontSize:12, color:'var(--text-muted)', flex:1 }}>{label}</span>
      <span style={{ fontSize:13, fontWeight:500, flex:1, textAlign:'right', color: highlight || 'var(--text-primary)' }}>{value}</span>
    </div>
  )
}

// ─── DIGITAL TAEKWONDO ID CARD ───────────────────────────────────
function DigitalIDCard({ student, myProfile }) {
  const cardRef = useRef(null)
  const name = myProfile?.full_name || student?.profiles?.full_name || 'Student'
  const belt = student?.belt_level || 'White'
  const beltColor = BELT_FULL[belt] || '#555'
  const dan = student?.belt_rank_number
  const batch = student?.batches?.name || '—'
  const joinDate = formatDate(student?.join_date)
  const studentCode = student?.id?.slice(-8).toUpperCase() || '00000000'
  const danMap = {1:'1st',2:'2nd',3:'3rd',4:'4th',5:'5th',6:'6th',7:'7th',8:'8th',9:'9th'}

  return (
    <div ref={cardRef} style={{
      background: 'linear-gradient(145deg, #12121A 0%, #1A1A28 100%)',
      border: belt === 'Black' ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.1)',
      borderRadius: 20,
      overflow: 'hidden',
      position: 'relative',
      userSelect: 'none',
    }}>
      {/* Belt color top stripe */}
      <div style={{ height: 8, background: beltColor, opacity: belt === 'White' ? 0.5 : 1 }} />

      {/* Background watermark */}
      <div style={{ position: 'absolute', top: 20, right: -20, opacity: 0.04, fontSize: 120, lineHeight: 1, pointerEvents: 'none', fontFamily: "'Bebas Neue',sans-serif" }}>
        {belt.slice(0,1)}
      </div>

      <div style={{ padding: '18px 20px 20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
              <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize: 18, color: 'var(--gold)', letterSpacing:'0.05em' }}>DOJAN</span>
              <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize: 18, color: 'var(--red)', letterSpacing:'0.05em' }}>HUB</span>
            </div>
            <div style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Taekwondo Academy</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: '0.1em' }}>MEMBER ID</div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: 'var(--text-muted)', letterSpacing: '0.15em' }}>{studentCode}</div>
          </div>
        </div>

        {/* Main content */}
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          {/* Avatar */}
          <div style={{ flexShrink: 0 }}>
            <Avatar name={name} belt={belt} size="lg"
              style={{ border: belt === 'Black' ? '2px solid var(--gold)' : '2px solid rgba(255,255,255,0.1)' }} />
          </div>

          {/* Details */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize: 24, lineHeight: 1, marginBottom: 4,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <BeltBadge belt={belt} rankNumber={dan} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' }}>
              {[
                ['Batch', batch],
                ['Since', joinDate],
                ['Poomsae', student?.poomsae_grade || '—'],
                ['Status', student?.status || 'active'],
              ].map(([l, v]) => (
                <div key={l}>
                  <div style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{l}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Belt block */}
          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: 28, height: 80, borderRadius: 4,
              background: beltColor,
              border: belt === 'Black' ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.15)',
              position: 'relative', overflow: 'hidden',
            }}>
              {belt === 'Black' && dan && (
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%) rotate(-90deg)', fontSize: 8, fontWeight: 700, color: 'var(--gold)', whiteSpace: 'nowrap', letterSpacing: '0.1em' }}>
                  {danMap[dan]} DAN
                </div>
              )}
              {/* Belt stripes */}
              {[15, 35, 55].map(top => (
                <div key={top} style={{ position: 'absolute', top, left: 0, right: 0, height: 2, background: 'rgba(0,0,0,0.3)' }} />
              ))}
            </div>
            <div style={{ fontSize: 8, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Belt</div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: '0.06em' }}>
            NEXT GRADING · {student?.next_grading_date ? formatDate(student.next_grading_date) : 'TBD'}
          </div>
          <div style={{ display: 'flex', gap: 2 }}>
            {BELT_ORDER.slice(0, BELT_ORDER.indexOf(belt) + 1).map(b => (
              <div key={b} style={{ width: 6, height: 6, borderRadius: 1, background: BELT_FULL[b], border: b === belt ? '1px solid rgba(255,255,255,0.4)' : 'none', opacity: b === belt ? 1 : 0.5 }} />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom belt stripe */}
      <div style={{ height: 4, background: `linear-gradient(90deg, ${beltColor}, transparent)`, opacity: 0.5 }} />
    </div>
  )
}

// ─── EDIT PROFILE MODAL ──────────────────────────────────────────
function EditProfileModal({ myProfile, student, onClose, onSaved }) {
  const [form, setForm] = useState({
    full_name: myProfile?.full_name || '',
    phone: myProfile?.phone || '',
    address: student?.address || '',
    emergency_contact: student?.emergency_contact || '',
    parent_name: student?.parent_name || '',
    parent_phone: student?.parent_phone || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      // Update profile
      const { error: pe } = await supabase.from('profiles')
        .update({ full_name: form.full_name, phone: form.phone })
        .eq('id', myProfile.id)
      if (pe) throw pe

      // Update student record (if exists)
      if (student?.id) {
        const { error: se } = await supabase.from('students')
          .update({ address: form.address, emergency_contact: form.emergency_contact, parent_name: form.parent_name, parent_phone: form.parent_phone })
          .eq('id', student.id)
        if (se) throw se
      }
      onSaved()
    } catch (err) { setError(err.message) }
    setLoading(false)
  }

  const fields = [
    { k:'full_name', label:'Full Name', type:'text', required:true },
    { k:'phone', label:'Phone Number', type:'tel' },
    { k:'parent_name', label:'Parent / Guardian Name', type:'text' },
    { k:'parent_phone', label:'Parent Phone', type:'tel' },
    { k:'address', label:'Address', type:'text' },
    { k:'emergency_contact', label:'Emergency Contact', type:'tel' },
  ]

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle" />

        {/* Avatar section */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ position: 'relative', cursor: 'pointer' }}>
            <Avatar name={form.full_name} belt={student?.belt_level || 'White'} size="xl" />
            <div style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 28, height: 28, borderRadius: '50%',
              background: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, border: '2px solid var(--bg-card)',
            }}>
              📷
            </div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
            Tap avatar to change photo
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>
            (Photo upload coming soon — initials shown for now)
          </div>
        </div>

        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Edit My Profile</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {fields.map(f => (
            <div key={f.k} className="input-wrap">
              <input className="input-field" id={`ep-${f.k}`} type={f.type} placeholder={f.label}
                value={form[f.k]} onChange={set(f.k)} required={f.required} />
              <label className="input-label" htmlFor={`ep-${f.k}`}>{f.label}</label>
            </div>
          ))}
          {error && <div className="error-msg">{error}</div>}
          <div style={{ display:'flex', gap:10, marginTop:4 }}>
            <button type="button" className="btn btn-secondary" style={{ flex:1 }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex:1 }} disabled={loading}>
              {loading ? 'Saving…' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── MAIN STUDENT PROFILE COMPONENT ──────────────────────────────
export default function StudentProfile({ role }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [myProfile, setMyProfile] = useState(null)
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showPromote, setShowPromote] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [showEditProfile, setShowEditProfile] = useState(false)

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setMyProfile(prof)
    try {
      const data = role === 'student'
        ? await getMyStudentProfile(user.id)
        : await getStudentProfile(id)
      setStudent(data)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [id, role])

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>

  if (!student) return (
    <div className="loading-screen">
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🥋</div>
        <div style={{ color:'var(--text-muted)', marginBottom: 16 }}>No student profile found</div>
        {role === 'student' && (
          <div style={{ fontSize: 12, color: 'var(--text-dim)', maxWidth: 260, textAlign: 'center', lineHeight: 1.6 }}>
            Your student record hasn't been set up yet. Ask your admin to create your student profile.
          </div>
        )}
      </div>
    </div>
  )

  const name = student.profiles?.full_name || myProfile?.full_name || 'Unknown'
  const belt = student.belt_level || 'White'
  const beltColor = BELT_COLORS[belt] || '#555'
  const attPct = getAttendancePercent(student.attendance_logs || [])
  const daysToGrading = daysUntil(student.next_grading_date)
  const curPayment = currentMonthPayment(student.payments || [])
  const sortedPayments = [...(student.payments || [])].sort((a,b) => new Date(b.due_date)-new Date(a.due_date)).slice(0,6)
  const batchName = student.batches?.name || '—'
  const coachName = student.batches?.coaches?.profiles?.full_name || '—'
  const danLevel = student.batches?.coaches?.dan_level
  const danMap = {1:'1st',2:'2nd',3:'3rd',4:'4th',5:'5th',6:'6th',7:'7th',8:'8th',9:'9th'}

  const backPath = role === 'admin' ? '/admin/students' : role === 'coach' ? -1 : '/student'

  return (
    <>
      <TopBar name={myProfile?.full_name} role={role} />
      <main className="page-content">
        <div style={{ padding:'12px 16px 0' }}>
          <button onClick={() => navigate(backPath)}
            style={{ background:'none', color:'var(--text-muted)', fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
            ← Back
          </button>
        </div>

        <div className="section-pad" style={{ paddingTop: 10 }}>

          {/* DIGITAL ID CARD — shown at top for student role */}
          {role === 'student' && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 10 }}>
                <div style={{ fontSize:14, fontWeight:600 }}>🪪 My Taekwondo ID</div>
                <button className="btn btn-secondary btn-sm"
                  onClick={() => setShowEditProfile(true)} id="edit-my-profile-btn">
                  ✏️ Edit Profile
                </button>
              </div>
              <DigitalIDCard student={student} myProfile={myProfile} />
            </div>
          )}

          {/* SECTION A — Hero (for admin/coach view) */}
          {role !== 'student' && (
            <div className="hero-card mb-12">
              <Avatar name={name} belt={belt} size="xl" style={{ margin:'0 auto 12px' }} />
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:28, marginBottom:6 }}>{name}</div>
              <div style={{ margin:'0 auto 8px', maxWidth:200 }}>
                <div className="belt-graphic" style={{
                  background: belt==='White'?'#e8e8e8':belt==='Yellow'?'#F5C518':belt==='Green'?'#27AE60':belt==='Blue'?'#2980B9':belt==='Red'?'#E74C3C':'#1A1A1A',
                  border: belt==='Black'?'1px solid var(--gold)':undefined
                }}>
                  {[20,60,100,140].map(p => <div key={p} className="belt-graphic-stripe" style={{ left:p }} />)}
                  <div className="belt-graphic-label">
                    {belt}{belt==='Black'&&student.belt_rank_number ? ` · ${danMap[student.belt_rank_number]||student.belt_rank_number} Dan` : ''}
                  </div>
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginTop:8 }}>
                <BeltBadge belt={belt} rankNumber={student.belt_rank_number} />
                <span className={`badge ${student.status==='active'?'badge-success':student.status==='inactive'?'badge-danger':'badge-warning'}`} style={{ textTransform:'capitalize' }}>
                  {(student.status||'active').replace('_',' ')}
                </span>
              </div>
            </div>
          )}

          {/* SECTION B — Personal Details */}
          <ExpandableCard title="Personal Details" icon="👤" defaultOpen={role !== 'student'}>
            <DetailRow label="Date of Birth" value={formatDate(student.dob)} />
            <DetailRow label="Age" value={calcAge(student.dob) ? `${calcAge(student.dob)} years` : null} />
            <DetailRow label="Gender" value={student.gender} />
            <DetailRow label="Blood Group" value={student.blood_group} />
            <DetailRow label="Phone" value={student.profiles?.phone || myProfile?.phone} />
            <DetailRow label="Parent / Guardian" value={student.parent_name} />
            <DetailRow label="Parent Phone" value={student.parent_phone} />
            <DetailRow label="Emergency Contact" value={student.emergency_contact} />
            <DetailRow label="Address" value={student.address} />
            {student.medical_notes && (
              <div style={{ marginTop:10, background:'rgba(243,156,18,0.1)', border:'1px solid rgba(243,156,18,0.3)', borderRadius:8, padding:'10px 12px', fontSize:12, color:'var(--warning)' }}>
                ⚠️ Medical Note: {student.medical_notes}
              </div>
            )}
          </ExpandableCard>

          {/* SECTION C — Academy Profile */}
          <ExpandableCard title="Academy Profile" icon="🥋" defaultOpen>
            <DetailRow label="Join Date" value={formatDate(student.join_date)} />
            <DetailRow label="Batch" value={batchName} />
            <DetailRow label="Coach" value={coachName + (danLevel ? ` · ${danMap[danLevel]||danLevel} Dan` : '')} />
            <DetailRow label="Poomsae Grade" value={student.poomsae_grade} />
            <DetailRow label="Last Grading" value={formatDate(student.last_grading_date)} />
            <DetailRow label="Next Grading"
              value={student.next_grading_date
                ? `${formatDate(student.next_grading_date)}${daysToGrading !== null ? ` · ${daysToGrading > 0 ? `${daysToGrading} days` : daysToGrading === 0 ? 'Today!' : 'Past'}` : ''}`
                : null}
              highlight={daysToGrading !== null && daysToGrading <= 14 ? 'var(--warning)' : undefined}
            />
            <div style={{ marginTop:12 }}>
              <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.05em' }}>Belt Progression</div>
              <BeltTimeline currentBelt={belt} beltHistory={student.belt_history || []} />
            </div>
          </ExpandableCard>

          {/* SECTION D — Attendance */}
          <ExpandableCard title="Attendance" icon="📊">
            <div style={{ display:'flex', alignItems:'center', gap:20, marginBottom:16 }}>
              <CircularProgress percent={attPct} size={80} label="This month" />
              <div>
                <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:4 }}>Last 30 days</div>
                <div style={{ display:'flex', gap:16 }}>
                  {['present','absent','late'].map(s => (
                    <div key={s} style={{ textAlign:'center' }}>
                      <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22,
                        color:s==='present'?'var(--success)':s==='absent'?'var(--danger)':'var(--warning)' }}>
                        {(student.attendance_logs||[]).filter(l=>l.status===s).length}
                      </div>
                      <div style={{ fontSize:10, color:'var(--text-muted)', textTransform:'capitalize' }}>{s}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <AttendanceCalendar logs={student.attendance_logs || []} />
          </ExpandableCard>

          {/* SECTION E — Fee History */}
          {(role === 'admin' || role === 'student') && (
            <ExpandableCard title="Fee History" icon="₹">
              {curPayment ? (
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:'var(--bg-card-2)', borderRadius:10, marginBottom:12 }}>
                  <div>
                    <div style={{ fontSize:11, color:'var(--text-muted)' }}>Current Month</div>
                    <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:26, color:'var(--gold)', lineHeight:1 }}>₹{curPayment.amount}</div>
                    {curPayment.payment_mode && curPayment.status === 'paid' && (
                      <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>
                        via {curPayment.payment_mode === 'bank_transfer' ? 'Bank Transfer' : curPayment.payment_mode.toUpperCase()}
                        {curPayment.notes ? ` · ${curPayment.notes}` : ''}
                      </div>
                    )}
                  </div>
                  <span className={`badge ${curPayment.status==='paid'?'badge-success':curPayment.status==='overdue'?'badge-danger':'badge-warning'}`} style={{ fontSize:13, padding:'6px 14px' }}>
                    {curPayment.status}
                  </span>
                </div>
              ) : (
                <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:12 }}>No fee record this month</div>
              )}
              {sortedPayments.length > 0 && (
                <div style={{ overflowX:'auto' }}>
                  <table className="data-table">
                    <thead><tr><th>Month</th><th>Amount</th><th>Mode</th><th>Status</th></tr></thead>
                    <tbody>
                      {sortedPayments.map(p => (
                        <tr key={p.id}>
                          <td>{new Date(p.due_date).toLocaleDateString('en-IN',{month:'short',year:'2-digit'})}</td>
                          <td>₹{p.amount}</td>
                          <td style={{ fontSize:11 }}>{p.payment_mode ? (p.payment_mode==='bank_transfer'?'Bank':p.payment_mode.toUpperCase()) : '—'}</td>
                          <td><span className={`badge ${p.status==='paid'?'badge-success':p.status==='overdue'?'badge-danger':'badge-warning'}`}>{p.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </ExpandableCard>
          )}

          {/* SECTION F — Belt History */}
          <ExpandableCard title="Belt History" icon="🎖️">
            {(student.belt_history||[]).length === 0 ? (
              <div style={{ fontSize:13, color:'var(--text-muted)' }}>No grading history recorded</div>
            ) : (
              [...(student.belt_history||[])].sort((a,b)=>new Date(b.grading_date)-new Date(a.grading_date)).map(h => (
                <div key={h.id} style={{ display:'flex', gap:12, padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                    <div style={{ width:10, height:10, borderRadius:2, background:BELT_COLORS[h.new_belt]||'#555', border:h.new_belt==='Black'?'1px solid var(--gold)':undefined }} />
                    <div style={{ flex:1, width:1, background:'var(--border)' }} />
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600 }}>{h.previous_belt} → {h.new_belt}</div>
                    <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>
                      {formatDate(h.grading_date)} · {h.coaches?.profiles?.full_name || 'Coach'}
                    </div>
                    {h.remarks && <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:4, fontStyle:'italic' }}>"{h.remarks}"</div>}
                  </div>
                </div>
              ))
            )}
          </ExpandableCard>

          {/* SECTION G — Admin Actions */}
          {role === 'admin' && (
            <div className="card" style={{ marginBottom:10 }}>
              <div style={{ fontSize:14, fontWeight:600, marginBottom:12 }}>⚙️ Actions</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowPromote(true)} id="promote-belt-btn">⬆️ Promote Belt</button>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowPayment(true)} id="record-payment-btn">₹ Record Payment</button>
                <button className="btn btn-secondary btn-sm" style={{ color:'var(--warning)' }}
                  onClick={async () => {
                    const s = student.status==='active'?'inactive':'active'
                    await updateStudent(student.id, { status:s })
                    setStudent(prev => ({ ...prev, status:s }))
                  }}>
                  {student.status==='active'?'⏸ Mark Inactive':'▶ Activate'}
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/admin/students`)}>👥 All Students</button>
              </div>
            </div>
          )}
        </div>
      </main>
      <BottomNav role={role==='admin'?'admin':role==='coach'?'coach':'student'} />

      {/* Promote Belt Modal */}
      {showPromote && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setShowPromote(false)}>
          <div className="modal-sheet">
            <div className="modal-handle" />
            <h3 style={{ fontSize:16, fontWeight:700, marginBottom:16 }}>Promote Belt</h3>
            <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:16 }}>Current: <BeltBadge belt={belt} /></div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {BELT_ORDER.slice(BELT_ORDER.indexOf(belt)+1).map(b => (
                <button key={b} className="btn btn-secondary" onClick={async () => {
                  await promoteBelt(student.id, belt, b, null, '')
                  setStudent(prev => ({ ...prev, belt_level:b }))
                  setShowPromote(false)
                }}>
                  <BeltBadge belt={b} /> → Promote to {b}
                </button>
              ))}
              {BELT_ORDER.indexOf(belt)===BELT_ORDER.length-1 && (
                <div style={{ fontSize:13, color:'var(--text-muted)', textAlign:'center' }}>Already at highest belt</div>
              )}
            </div>
            <button className="btn btn-secondary" style={{ marginTop:12 }} onClick={() => setShowPromote(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPayment && (
        <RecordPaymentModal studentId={student.id} onClose={() => setShowPayment(false)} onSaved={() => { setShowPayment(false); loadData() }} />
      )}

      {/* Student Edit Profile Modal */}
      {showEditProfile && (
        <EditProfileModal
          myProfile={myProfile}
          student={student}
          onClose={() => setShowEditProfile(false)}
          onSaved={() => { setShowEditProfile(false); loadData() }}
        />
      )}
    </>
  )
}

function RecordPaymentModal({ studentId, onClose, onSaved }) {
  const [form, setForm] = useState({ amount:'', due_date:new Date().toISOString().split('T')[0], paid_date:'', status:'unpaid', payment_mode:'cash', notes:'' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const set = k => e => setForm(f => ({ ...f, [k]:e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault(); setLoading(true); setError('')
    try {
      await upsertPayment({ student_id:studentId, ...form, paid_date:form.paid_date||null })
      onSaved()
    } catch(err) { setError(err.message) }
    setLoading(false)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle" />
        <h3 style={{ fontSize:16, fontWeight:700, marginBottom:16 }}>Record Payment</h3>
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div className="input-wrap">
            <input className="input-field" id="pay-amount" type="number" placeholder="Amount" value={form.amount} onChange={set('amount')} required />
            <label className="input-label" htmlFor="pay-amount">Amount (₹)</label>
          </div>
          <div>
            <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:6 }}>Due Date</div>
            <input type="date" className="select-field" value={form.due_date} onChange={set('due_date')} required />
          </div>
          <div>
            <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:6 }}>Paid Date (leave blank if not yet paid)</div>
            <input type="date" className="select-field" value={form.paid_date} onChange={set('paid_date')} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div>
              <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:6 }}>Status</div>
              <select className="select-field" value={form.status} onChange={set('status')}>
                {['paid','unpaid','partial','overdue'].map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:6 }}>Mode</div>
              <select className="select-field" value={form.payment_mode} onChange={set('payment_mode')}>
                <option value="cash">💵 Cash</option>
                <option value="upi">📱 UPI</option>
                <option value="bank_transfer">🏦 Bank</option>
              </select>
            </div>
          </div>
          <div className="input-wrap">
            <input className="input-field" id="pay-notes" type="text" placeholder="Ref / Notes" value={form.notes} onChange={set('notes')} />
            <label className="input-label" htmlFor="pay-notes">Reference / Notes</label>
          </div>
          {error && <div className="error-msg">{error}</div>}
          <div style={{ display:'flex', gap:10 }}>
            <button type="button" className="btn btn-secondary" style={{ flex:1 }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex:1 }} disabled={loading}>{loading?'Saving…':'Save Payment'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
