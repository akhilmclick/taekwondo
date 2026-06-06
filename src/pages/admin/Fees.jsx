import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { getPayments } from '../../lib/queries'
import TopBar from '../../components/ui/TopBar'
import BottomNav from '../../components/ui/BottomNav'
import { formatDate } from '../../lib/utils'

// ─── MARK PAID MODAL ────────────────────────────────────────────
function MarkPaidModal({ payment, onClose, onSaved }) {
  const [form, setForm] = useState({
    payment_mode: 'upi',
    paid_date: new Date().toISOString().split('T')[0],
    reference: '',        // stored in notes
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const noteText = [
        form.reference ? `Ref: ${form.reference}` : '',
        form.notes,
      ].filter(Boolean).join(' | ')

      const { error } = await supabase.from('payments').update({
        status: 'paid',
        paid_date: form.paid_date,
        payment_mode: form.payment_mode,
        notes: noteText || null,
      }).eq('id', payment.id)

      if (error) throw error
      onSaved()
    } catch (err) { setError(err.message) }
    setLoading(false)
  }

  const modeMeta = {
    upi:           { icon: '📱', label: 'UPI / GPay / PhonePe / Paytm', refLabel: 'UPI Transaction ID (UTR)' },
    cash:          { icon: '💵', label: 'Cash Payment', refLabel: 'Receipt Number (optional)' },
    bank_transfer: { icon: '🏦', label: 'Bank / NEFT / IMPS', refLabel: 'Transaction Reference / UTR' },
  }
  const meta = modeMeta[form.payment_mode]

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle" />

        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>Mark as Paid</div>
          <h3 style={{ fontSize: 18, fontWeight: 700 }}>{payment.students?.profiles?.full_name}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: 'var(--gold)' }}>
              ₹{Number(payment.amount).toLocaleString()}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Due {formatDate(payment.due_date)}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Payment Mode */}
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment Mode</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {Object.entries(modeMeta).map(([mode, m]) => (
                <button type="button" key={mode}
                  onClick={() => setForm(f => ({ ...f, payment_mode: mode }))}
                  style={{
                    padding: '10px 6px', borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s',
                    background: form.payment_mode === mode ? 'rgba(201,168,76,0.15)' : 'var(--bg-card-2)',
                    border: `1px solid ${form.payment_mode === mode ? 'var(--gold)' : 'var(--border)'}`,
                    color: form.payment_mode === mode ? 'var(--gold)' : 'var(--text-muted)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  }}>
                  <span style={{ fontSize: 20 }}>{m.icon}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'capitalize' }}>
                    {mode === 'bank_transfer' ? 'Bank' : mode.toUpperCase()}
                  </span>
                </button>
              ))}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6, textAlign: 'center' }}>{meta.label}</div>
          </div>

          {/* Transaction Reference */}
          <div className="input-wrap">
            <input className="input-field" id="pay-ref" type="text" placeholder={meta.refLabel}
              value={form.reference} onChange={set('reference')} />
            <label className="input-label" htmlFor="pay-ref">{meta.refLabel}</label>
          </div>

          {/* Paid Date */}
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Date of Payment</div>
            <input type="date" className="select-field"
              value={form.paid_date} onChange={set('paid_date')}
              max={new Date().toISOString().split('T')[0]} required />
          </div>

          {/* Notes */}
          <div className="input-wrap">
            <input className="input-field" id="pay-notes-mp" type="text" placeholder="Additional notes"
              value={form.notes} onChange={set('notes')} />
            <label className="input-label" htmlFor="pay-notes-mp">Notes (optional)</label>
          </div>

          {error && <div className="error-msg">{error}</div>}

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-gold" style={{ flex: 1 }} disabled={loading}>
              {loading ? 'Saving…' : '✓ Confirm Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── EDIT PAYMENT MODAL ──────────────────────────────────────────
function EditPaymentModal({ payment, onClose, onSaved }) {
  const [form, setForm] = useState({
    amount: payment?.amount || '',
    due_date: payment?.due_date || '',
    paid_date: payment?.paid_date || '',
    status: payment?.status || 'unpaid',
    payment_mode: payment?.payment_mode || 'cash',
    notes: payment?.notes || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const { error } = await supabase.from('payments').update({
        amount: form.amount,
        due_date: form.due_date,
        paid_date: form.paid_date || null,
        status: form.status,
        payment_mode: form.payment_mode,
        notes: form.notes || null,
      }).eq('id', payment.id)
      if (error) throw error
      onSaved()
    } catch (err) { setError(err.message) }
    setLoading(false)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle" />
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Edit Payment</h3>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
          {payment?.students?.profiles?.full_name}
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="input-wrap">
            <input className="input-field" id="ep-amount" type="number" placeholder="Amount"
              value={form.amount} onChange={set('amount')} required />
            <label className="input-label" htmlFor="ep-amount">Amount (₹)</label>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Due Date</div>
            <input type="date" className="select-field" value={form.due_date} onChange={set('due_date')} required />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Paid Date (leave blank if unpaid)</div>
            <input type="date" className="select-field" value={form.paid_date} onChange={set('paid_date')} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Status</div>
              <select className="select-field" value={form.status} onChange={set('status')}>
                {['paid','unpaid','partial','overdue'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Mode</div>
              <select className="select-field" value={form.payment_mode} onChange={set('payment_mode')}>
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>
          </div>
          <div className="input-wrap">
            <input className="input-field" id="ep-notes" type="text" placeholder="Notes / Ref No."
              value={form.notes} onChange={set('notes')} />
            <label className="input-label" htmlFor="ep-notes">Notes / Reference No.</label>
          </div>
          {error && <div className="error-msg">{error}</div>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────
export default function AdminFees() {
  const [myProfile, setMyProfile] = useState(null)
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [markPaidTarget, setMarkPaidTarget] = useState(null)
  const [editTarget, setEditTarget] = useState(null)
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => setMyProfile(data))
    })
  }, [])

  useEffect(() => { load() }, [month, year])

  async function load() {
    setLoading(true)
    const data = await getPayments({ month, year })
    setPayments(data)
    setLoading(false)
  }

  const total       = payments.reduce((s, p) => s + Number(p.amount || 0), 0)
  const collected   = payments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount || 0), 0)
  const outstanding = total - collected

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  const statusMeta = {
    paid:    { cls: 'badge-success', label: 'Paid' },
    unpaid:  { cls: 'badge-muted',   label: 'Unpaid' },
    partial: { cls: 'badge-warning', label: 'Partial' },
    overdue: { cls: 'badge-danger',  label: 'Overdue' },
  }

  const modeIcon = { cash: '💵', upi: '📱', bank_transfer: '🏦' }

  return (
    <>
      <TopBar name={myProfile?.full_name} role="admin" />
      <main className="page-content">
        <div className="section-pad">
          <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, marginBottom: 16 }}>Fee Management</h1>

          {/* Month/Year picker */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            <select className="select-field" value={month} onChange={e => setMonth(Number(e.target.value))} id="month-picker">
              {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select className="select-field" value={year} onChange={e => setYear(Number(e.target.value))}>
              {[2023,2024,2025,2026].map(y => <option key={y}>{y}</option>)}
            </select>
          </div>

          {/* Summary row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
            {[
              { label: 'Total Due',   val: `₹${total.toLocaleString()}`,       color: 'var(--text-primary)' },
              { label: 'Collected',   val: `₹${collected.toLocaleString()}`,   color: 'var(--success)' },
              { label: 'Outstanding', val: `₹${outstanding.toLocaleString()}`, color: 'var(--danger)' },
            ].map(s => (
              <div key={s.label} className="card" style={{ textAlign: 'center', padding: '12px 8px' }}>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Payment list */}
          {loading ? (
            <div style={{ padding: '40px 0', textAlign: 'center' }}><div className="spinner" /></div>
          ) : payments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">₹</div>
              <div>No fee records for this month</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {payments.map(p => {
                const isOverdue = p.status === 'overdue'
                const isUnpaid  = p.status === 'unpaid'
                const name = p.students?.profiles?.full_name || 'Unknown'
                const sm = statusMeta[p.status] || statusMeta.unpaid

                return (
                  <div key={p.id} style={{
                    background: 'var(--bg-card)',
                    border: `1px solid ${(isOverdue || isUnpaid) ? 'rgba(231,76,60,0.25)' : 'var(--border)'}`,
                    borderLeft: (isOverdue || isUnpaid) ? '3px solid var(--danger)' : undefined,
                    borderRadius: 14, overflow: 'hidden',
                  }}>
                    {/* Main row */}
                    <div style={{ padding: '14px', display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}
                      onClick={() => setEditTarget(p)}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 600 }}>{name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          Due: {formatDate(p.due_date)}
                          {p.paid_date && ` · Paid: ${formatDate(p.paid_date)}`}
                        </div>
                        {p.payment_mode && p.status === 'paid' && (
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                            {modeIcon[p.payment_mode]} {p.payment_mode === 'bank_transfer' ? 'Bank Transfer' : p.payment_mode.toUpperCase()}
                            {p.notes && ` · ${p.notes}`}
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: 'var(--gold)' }}>
                          ₹{Number(p.amount).toLocaleString()}
                        </div>
                        <span className={`badge ${sm.cls}`}>{sm.label}</span>
                      </div>
                    </div>

                    {/* Action bar for unpaid/overdue */}
                    {p.status !== 'paid' && (
                      <div style={{ borderTop: '1px solid var(--border)', display: 'flex' }}>
                        <button
                          style={{ flex: 1, padding: '10px', background: 'none', fontSize: 12, color: 'var(--success)', fontWeight: 600, cursor: 'pointer', borderRight: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                          onClick={() => setMarkPaidTarget(p)}>
                          ✓ Mark as Paid
                        </button>
                        <button
                          style={{ flex: 1, padding: '10px', background: 'none', fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                          onClick={() => setEditTarget(p)}>
                          ✏️ Edit
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
      <BottomNav role="admin" />

      {markPaidTarget && (
        <MarkPaidModal
          payment={markPaidTarget}
          onClose={() => setMarkPaidTarget(null)}
          onSaved={() => { setMarkPaidTarget(null); load() }}
        />
      )}
      {editTarget && (
        <EditPaymentModal
          payment={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => { setEditTarget(null); load() }}
        />
      )}
    </>
  )
}
