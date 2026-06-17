import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import TopBar from '../../components/ui/TopBar'
import BottomNav from '../../components/ui/BottomNav'

const STATUS_STYLE = {
  paid:    { bg: 'rgba(46,204,113,0.12)',  color: 'var(--success)', label: 'Paid'    },
  unpaid:  { bg: 'rgba(243,156,18,0.12)',  color: 'var(--warning)', label: 'Pending' },
  overdue: { bg: 'rgba(214,40,40,0.12)',   color: 'var(--red)',     label: 'Overdue' },
  partial: { bg: 'rgba(41,128,185,0.12)',  color: 'var(--info)',    label: 'Partial' },
}

export default function StudentFees() {
  const [myProfile, setMyProfile] = useState(null)
  const [student, setStudent]     = useState(null)
  const [payments, setPayments]   = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: prof }     = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setMyProfile(prof)

      const { data: stu } = await supabase.from('students')
        .select('id, belt_level').eq('profile_id', user.id).single()
      if (!stu) { setLoading(false); return }
      setStudent(stu)

      const { data: pays } = await supabase.from('payments')
        .select('id, amount, due_date, paid_date, status, payment_mode, notes, created_at')
        .eq('student_id', stu.id)
        .order('due_date', { ascending: false })
      setPayments(pays || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>

  // Summary stats
  const totalDue  = payments.filter(p => ['unpaid','overdue'].includes(p.status)).reduce((s, p) => s + Number(p.amount), 0)
  const totalPaid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0)
  const overdue   = payments.filter(p => p.status === 'overdue').length

  const now        = new Date()
  const curMonth   = payments.filter(p => {
    const d = new Date(p.due_date)
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  })

  return (
    <>
      <TopBar name={myProfile?.full_name} role="student" />
      <main className="page-content">
        <div className="section-pad">
          <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, marginBottom: 16 }}>My Fees</h1>

          {/* ── Summary cards ───────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            <div className="card" style={{ border: totalDue > 0 ? '1px solid rgba(243,156,18,0.3)' : 'var(--border)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Amount Due</div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: totalDue > 0 ? 'var(--warning)' : 'var(--success)' }}>
                ₹{totalDue.toLocaleString()}
              </div>
            </div>
            <div className="card">
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Total Paid</div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: 'var(--gold)' }}>
                ₹{totalPaid.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Overdue alert */}
          {overdue > 0 && (
            <div style={{ background: 'rgba(214,40,40,0.1)', border: '1px solid rgba(214,40,40,0.3)', borderRadius: 12, padding: '12px 14px', marginBottom: 16, fontSize: 13 }}>
              ⚠️ <strong style={{ color: 'var(--red)' }}>{overdue} payment{overdue > 1 ? 's' : ''} overdue.</strong>
              <span style={{ color: 'var(--text-muted)' }}> Please contact your coach.</span>
            </div>
          )}

          {/* ── This month ──────────────────────────────── */}
          {curMonth.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                {now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </div>
              {curMonth.map(p => <PaymentRow key={p.id} p={p} />)}
            </div>
          )}

          {/* ── All payments ─────────────────────────────── */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Payment History</div>
            {payments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 13 }}>
                No payment records yet
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {payments.map(p => <PaymentRow key={p.id} p={p} />)}
              </div>
            )}
          </div>
        </div>
      </main>
      <BottomNav role="student" />
    </>
  )
}

function PaymentRow({ p }) {
  const s = STATUS_STYLE[p.status] || STATUS_STYLE.unpaid
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: 'var(--gold)' }}>
            ₹{Number(p.amount).toLocaleString()}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            Due: {new Date(p.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
          {p.paid_date && (
            <div style={{ fontSize: 11, color: 'var(--success)', marginTop: 2 }}>
              ✓ Paid: {new Date(p.paid_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          )}
          {p.payment_mode && (
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
              via {p.payment_mode.replace('_', ' ')}
            </div>
          )}
          {p.notes && (
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>📝 {p.notes}</div>
          )}
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, color: s.color, background: s.bg, padding: '3px 10px', borderRadius: 20, whiteSpace: 'nowrap' }}>
          {s.label}
        </span>
      </div>
    </div>
  )
}
