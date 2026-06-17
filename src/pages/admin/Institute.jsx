import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { getMyInstitute, updateInstitute } from '../../lib/queries'
import { useAuth } from '../../lib/AuthContext'
import TopBar from '../../components/ui/TopBar'
import BottomNav from '../../components/ui/BottomNav'

export default function AdminInstitute() {
  const { instituteId } = useAuth()
  const navigate = useNavigate()
  const [myProfile, setMyProfile] = useState(null)
  const [institute, setInstitute] = useState(null)
  const [editing, setEditing]     = useState(false)
  const [form, setForm]           = useState({})
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)
  const [copied, setCopied]       = useState(false)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setMyProfile(prof)
      const inst = await getMyInstitute()
      setInstitute(inst)
      if (inst) setForm({ name: inst.name, email: inst.email || '', phone: inst.phone || '', address: inst.address || '' })
      setLoading(false)
    }
    load()
  }, [instituteId])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    await updateInstitute(institute.id, form)
    setInstitute(prev => ({ ...prev, ...form }))
    setSaving(false); setSaved(true); setEditing(false)
    setTimeout(() => setSaved(false), 2500)
  }

  function copyCode() {
    navigator.clipboard.writeText(institute?.code || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>

  return (
    <>
      <TopBar name={myProfile?.full_name} role="admin" />
      <main className="page-content">
        <div style={{ padding: '12px 16px 0' }}>
          <button onClick={() => navigate('/admin')}
            style={{ background: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            ← Home
          </button>
        </div>
        <div className="section-pad">
          <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, marginBottom: 20 }}>Institute Settings</h1>

          {/* ── Invite Code Card ─────────────────────────── */}
          <div style={{
            background: 'linear-gradient(135deg, #1A1A28 0%, #12121A 100%)',
            border: '1px solid var(--gold)', borderRadius: 20, padding: '24px 20px',
            marginBottom: 16, textAlign: 'center', position: 'relative', overflow: 'hidden',
          }}>
            {/* Watermark */}
            <div style={{ position: 'absolute', top: -10, right: -10, opacity: 0.04, fontFamily: "'Bebas Neue',sans-serif", fontSize: 100, lineHeight: 1, pointerEvents: 'none' }}>
              CODE
            </div>
            <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8 }}>
              Institute Invite Code
            </div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 56, color: 'var(--text-primary)', letterSpacing: '0.3em', lineHeight: 1, marginBottom: 8 }}>
              {institute?.code || '——'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.5 }}>
              Share this code with your students.<br />They enter it when creating their account.
            </div>
            <button className="btn btn-gold" style={{ width: '100%' }} onClick={copyCode} id="copy-code-btn">
              {copied ? '✓ Copied!' : '📋 Copy Code'}
            </button>
          </div>

          {/* ── Academy Info Card ─────────────────────────── */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>🏟️ Academy Details</div>
              {!editing && (
                <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)} id="edit-institute-btn">
                  ✏️ Edit
                </button>
              )}
            </div>

            {editing ? (
              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { k: 'name',    label: 'Academy Name',   type: 'text'  },
                  { k: 'email',   label: 'Email',           type: 'email' },
                  { k: 'phone',   label: 'Phone Number',    type: 'tel'   },
                  { k: 'address', label: 'Address',         type: 'text'  },
                ].map(f => (
                  <div key={f.k} className="input-wrap">
                    <input id={`inst-${f.k}`} className="input-field" type={f.type}
                      placeholder={f.label} value={form[f.k] || ''} onChange={set(f.k)} />
                    <label className="input-label" htmlFor={`inst-${f.k}`}>{f.label}</label>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setEditing(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </form>
            ) : (
              <div>
                {[
                  { label: 'Academy Name', value: institute?.name },
                  { label: 'Email',        value: institute?.email },
                  { label: 'Phone',        value: institute?.phone },
                  { label: 'Address',      value: institute?.address },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{row.label}</span>
                    <span style={{ fontSize: 13 }}>{row.value || <span style={{ color: 'var(--text-dim)' }}>Not set</span>}</span>
                  </div>
                ))}
                {saved && (
                  <div style={{ marginTop: 12, fontSize: 13, color: 'var(--success)', textAlign: 'center' }}>
                    ✓ Changes saved
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      <BottomNav role="admin" />
    </>
  )
}
