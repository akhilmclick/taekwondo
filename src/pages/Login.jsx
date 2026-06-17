import { useState } from 'react'
import { supabase } from '../lib/supabase'

// Generate a random 6-character alphanumeric invite code
function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export default function Login() {
  // 'login' | 'institute-signup' | 'student-signup'
  const [view, setView] = useState('login')

  return (
    <div className="page-content no-nav no-topbar" style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      {/* Header */}
      <div style={{ padding: '48px 24px 24px', textAlign: 'center' }}>
        <div className="logo-text" style={{ justifyContent: 'center', marginBottom: 6 }}>
          <span className="logo-dojan" style={{ fontSize: 48 }}>DOJAN</span>
          <span className="logo-hub"   style={{ fontSize: 48 }}>HUB</span>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Academy Management
        </div>
      </div>

      {/* Tab switcher (only on login) */}
      {view === 'login' && (
        <div style={{ padding: '0 24px 4px', display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, height: 2, background: 'var(--gold)', borderRadius: 2 }} />
          <div style={{ flex: 1, height: 2, background: 'var(--border)', borderRadius: 2 }} />
        </div>
      )}

      <div style={{ flex: 1, padding: '16px 24px 40px' }}>
        {view === 'login'            && <LoginForm onSwitchInstitute={() => setView('institute-signup')} onSwitchStudent={() => setView('student-signup')} />}
        {view === 'institute-signup' && <InstituteSignup onBack={() => setView('login')} />}
        {view === 'student-signup'   && <StudentSignup   onBack={() => setView('login')} />}
      </div>
    </div>
  )
}

// ─── LOGIN FORM ───────────────────────────────────────────────
function LoginForm({ onSwitchInstitute, onSwitchStudent }) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
  }

  return (
    <div>
      <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, marginBottom: 4 }}>Welcome Back</h1>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 28 }}>Sign in to your account</p>

      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="input-wrap">
          <input id="login-email" className="input-field" type="email" placeholder="Email"
            value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
          <label className="input-label" htmlFor="login-email">Email</label>
        </div>
        <div className="input-wrap">
          <input id="login-password" className="input-field" type="password" placeholder="Password"
            value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
          <label className="input-label" htmlFor="login-password">Password</label>
        </div>
        {error && <div className="error-msg">{error}</div>}
        <button type="submit" className="btn btn-primary" style={{ marginTop: 4 }} disabled={loading} id="login-btn">
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>NEW ACCOUNT</span>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <button className="btn btn-secondary" style={{ flexDirection: 'column', height: 'auto', padding: '14px 12px', gap: 4 }}
          onClick={onSwitchInstitute} id="institute-signup-btn">
          <span style={{ fontSize: 22 }}>🏟️</span>
          <span style={{ fontSize: 12, fontWeight: 600 }}>Institute</span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.3 }}>Register your academy</span>
        </button>
        <button className="btn btn-secondary" style={{ flexDirection: 'column', height: 'auto', padding: '14px 12px', gap: 4 }}
          onClick={onSwitchStudent} id="student-signup-btn">
          <span style={{ fontSize: 22 }}>🥋</span>
          <span style={{ fontSize: 12, fontWeight: 600 }}>Student</span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.3 }}>Join your academy</span>
        </button>
      </div>
    </div>
  )
}

// ─── INSTITUTE SIGNUP ─────────────────────────────────────────
function InstituteSignup({ onBack }) {
  const [form, setForm] = useState({ academyName: '', name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState(null)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true); setError('')

    try {
      // 1. Create auth user
      const { data: auth, error: authErr } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { full_name: form.name, role: 'admin' } },
      })
      if (authErr) throw authErr
      if (!auth.user) throw new Error('Account creation failed. Please try again.')

      // 2. Create institute with a unique code (retry if collision)
      let institute = null
      let attempts = 0
      while (!institute && attempts < 5) {
        const code = generateCode()
        const { data, error: instErr } = await supabase.from('institutes').insert({
          name: form.academyName,
          code,
          owner_id: auth.user.id,
          email: form.email,
        }).select().single()
        if (!instErr) institute = data
        attempts++
      }
      if (!institute) throw new Error('Failed to create institute. Please try again.')

      // 3. Update profile with institute_id + role
      await supabase.from('profiles').update({
        full_name: form.name,
        role: 'admin',
        institute_id: institute.id,
      }).eq('id', auth.user.id)

      setSuccess({ code: institute.code, name: form.academyName })

    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  // ── Success screen with institute code ───────────────────────
  if (success) {
    return (
      <div style={{ textAlign: 'center', paddingTop: 20 }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>🏟️</div>
        <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, marginBottom: 4 }}>Academy Created!</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>{success.name}</p>

        {/* Institute Code Card */}
        <div style={{
          background: 'var(--bg-card-2)', border: '1px solid var(--gold)',
          borderRadius: 16, padding: '20px 24px', marginBottom: 24,
        }}>
          <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>
            Your Institute Code
          </div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 48, color: 'var(--text-primary)', letterSpacing: '0.2em' }}>
            {success.code}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.5 }}>
            Share this code with your students.<br />They'll use it to join your academy.
          </div>
        </div>

        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 20 }}>
          Check your email to confirm your account, then sign in below.
        </div>
        <button className="btn btn-primary" onClick={onBack} id="back-to-login-btn">
          ← Back to Sign In
        </button>
      </div>
    )
  }

  return (
    <div>
      <button onClick={onBack} style={{ background: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
        ← Back
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <span style={{ fontSize: 28 }}>🏟️</span>
        <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 26 }}>Register Your Institute</h1>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 24 }}>
        Create your academy account. You'll get an invite code to share with students.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="input-wrap">
          <input id="inst-academy" className="input-field" type="text" placeholder="Academy Name"
            value={form.academyName} onChange={set('academyName')} required />
          <label className="input-label" htmlFor="inst-academy">Academy / Institute Name</label>
        </div>
        <div className="input-wrap">
          <input id="inst-name" className="input-field" type="text" placeholder="Your Full Name"
            value={form.name} onChange={set('name')} required />
          <label className="input-label" htmlFor="inst-name">Your Full Name</label>
        </div>
        <div className="input-wrap">
          <input id="inst-email" className="input-field" type="email" placeholder="Email"
            value={form.email} onChange={set('email')} required autoComplete="email" />
          <label className="input-label" htmlFor="inst-email">Email</label>
        </div>
        <div className="input-wrap">
          <input id="inst-password" className="input-field" type="password" placeholder="Password"
            value={form.password} onChange={set('password')} required autoComplete="new-password" />
          <label className="input-label" htmlFor="inst-password">Password (min 6 chars)</label>
        </div>
        {error && <div className="error-msg">{error}</div>}
        <button type="submit" className="btn btn-gold" disabled={loading} id="create-institute-btn">
          {loading ? 'Creating Academy…' : '🏟️ Create Institute'}
        </button>
      </form>
    </div>
  )
}

// ─── STUDENT SIGNUP ───────────────────────────────────────────
function StudentSignup({ onBack }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', code: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState(null)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true); setError('')

    try {
      // 1. Validate institute code
      const code = form.code.trim().toUpperCase()
      const { data: institute, error: instErr } = await supabase
        .from('institutes')
        .select('id, name')
        .eq('code', code)
        .single()
      if (instErr || !institute) throw new Error(`No academy found with code "${code}". Check with your coach.`)

      // 2. Create auth user with institute_id in metadata
      const { data: auth, error: authErr } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { full_name: form.name, role: 'student', institute_id: institute.id } },
      })
      if (authErr) throw authErr
      if (!auth.user) throw new Error('Account creation failed. Please try again.')

      // 3. Update profile + create student record
      await Promise.all([
        supabase.from('profiles').update({
          full_name: form.name,
          role: 'student',
          institute_id: institute.id,
        }).eq('id', auth.user.id),

        supabase.from('students').insert({
          profile_id: auth.user.id,
          institute_id: institute.id,
          join_date: new Date().toISOString().split('T')[0],
          status: 'active',
        }),
      ])

      setSuccess({ academyName: institute.name })

    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div style={{ textAlign: 'center', paddingTop: 20 }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>🥋</div>
        <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, marginBottom: 4 }}>You're In!</h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>
          Joined <strong style={{ color: 'var(--gold)' }}>{success.academyName}</strong>
        </p>
        <div style={{
          background: 'rgba(46,204,113,0.1)', border: '1px solid rgba(46,204,113,0.3)',
          borderRadius: 12, padding: 16, marginBottom: 24, fontSize: 13, color: 'var(--success)', lineHeight: 1.6,
        }}>
          Your account is ready. Your coach will assign you to a batch and fill in your training details.
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 20 }}>
          Check your email to confirm, then sign in.
        </div>
        <button className="btn btn-primary" onClick={onBack} id="student-back-login-btn">
          ← Sign In Now
        </button>
      </div>
    )
  }

  return (
    <div>
      <button onClick={onBack} style={{ background: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
        ← Back
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <span style={{ fontSize: 28 }}>🥋</span>
        <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 26 }}>Join Your Academy</h1>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 24 }}>
        Enter the Institute Code given by your coach to join your academy.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Institute Code — most prominent */}
        <div style={{ position: 'relative' }}>
          <input id="student-code" className="input-field" type="text"
            placeholder="Institute Code"
            value={form.code}
            onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
            maxLength={6} required
            style={{ textTransform: 'uppercase', letterSpacing: '0.2em', fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, textAlign: 'center' }}
          />
          <label className="input-label" htmlFor="student-code" style={{ textAlign: 'center', left: 0, right: 0 }}>Institute Code (e.g. TKD001)</label>
        </div>

        <div className="input-wrap">
          <input id="student-name" className="input-field" type="text" placeholder="Your Full Name"
            value={form.name} onChange={set('name')} required />
          <label className="input-label" htmlFor="student-name">Full Name</label>
        </div>
        <div className="input-wrap">
          <input id="student-email" className="input-field" type="email" placeholder="Email"
            value={form.email} onChange={set('email')} required autoComplete="email" />
          <label className="input-label" htmlFor="student-email">Email</label>
        </div>
        <div className="input-wrap">
          <input id="student-password" className="input-field" type="password" placeholder="Password"
            value={form.password} onChange={set('password')} required autoComplete="new-password" />
          <label className="input-label" htmlFor="student-password">Password (min 6 chars)</label>
        </div>
        {error && <div className="error-msg">{error}</div>}
        <button type="submit" className="btn btn-primary" disabled={loading} id="join-academy-btn">
          {loading ? 'Joining…' : '🥋 Join Academy'}
        </button>
      </form>
    </div>
  )
}
