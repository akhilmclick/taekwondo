import { useState } from 'react'
import { supabase } from '../lib/supabase'

function TKDSilhouette() {
  return (
    <svg viewBox="0 0 200 320" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-55%)', width: 260, height: 360, opacity: 0.08, pointerEvents: 'none' }} fill="#D62828">
      <circle cx="100" cy="32" r="22" />
      <path d="M78 54 Q100 70 122 54 L130 140 Q100 155 70 140 Z" />
      <path d="M78 68 Q50 55 32 72 Q20 80 28 90 Q36 100 48 88 Q60 76 82 80 Z" />
      <path d="M122 68 Q148 55 165 45 Q178 36 184 48 Q188 58 176 64 Q162 68 144 72 Q132 74 118 80 Z" />
      <path d="M88 140 Q80 185 75 210 Q72 230 80 235 Q92 238 96 225 Q100 210 104 190 Q108 170 100 145 Z" />
      <path d="M112 140 Q125 145 148 135 Q168 126 185 118 Q196 112 194 100 Q192 88 178 92 Q162 98 144 110 Q126 122 110 135 Z" />
      <ellipse cx="190" cy="108" rx="14" ry="8" transform="rotate(-15 190 108)" />
    </svg>
  )
}

export default function Login() {
  const [mode, setMode] = useState('login') // 'login' | 'signup' | 'forgot'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function switchMode(m) {
    setMode(m)
    setError('')
    setSuccess('')
  }

  async function handleLogin(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  async function handleSignup(e) {
    e.preventDefault()
    setError(''); setSuccess(''); setLoading(true)
    if (!fullName.trim()) { setError('Please enter your full name.'); setLoading(false); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); setLoading(false); return }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: fullName.trim(), role: 'student' } },
      })

      console.log('Signup response:', { data, error })

      if (error) {
        setError(error.message)
      } else if (data?.user && !data.session) {
        // Email confirmation is ON — user needs to confirm email
        setError('⚠️ Email confirmation required. Go to Supabase → Authentication → Providers → Email → disable "Confirm email", then try again. Or check your inbox for a confirmation link.')
      } else if (data?.session) {
        // Success — auto-confirmed
        setSuccess('✅ Account created! Redirecting…')
      } else {
        setError('Something went wrong. Check the browser console for details.')
      }
    } catch (err) {
      console.error('Signup exception:', err)
      setError(err.message || 'An unexpected error occurred.')
    }
    setLoading(false)
  }

  async function handleForgot(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) setError(error.message)
    else setSuccess('✅ Reset link sent — check your email.')
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 24px 40px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <TKDSilhouette />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 70% at 50% 40%, transparent 50%, rgba(0,0,0,0.6) 100%)', pointerEvents: 'none' }} />

      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 8, position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4 }}>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 56, color: 'var(--gold)', letterSpacing: '0.04em', lineHeight: 1 }}>DOJAN</span>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 56, color: 'var(--red)', letterSpacing: '0.04em', lineHeight: 1 }}>HUB</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: 4 }}>
          Academy Management
        </div>
      </div>

      <div style={{ width: 60, height: 2, background: 'var(--gold)', borderRadius: 2, margin: '16px auto 28px', opacity: 0.6 }} />

      {/* Tab switcher (Login / Sign Up) */}
      <div style={{ display: 'flex', background: 'var(--bg-card)', borderRadius: 12, padding: 4, marginBottom: 24, position: 'relative', zIndex: 1, width: '100%', maxWidth: 380 }}>
        {[['login', 'Log In'], ['signup', 'Sign Up']].map(([m, label]) => (
          <button key={m} onClick={() => switchMode(m)}
            style={{
              flex: 1, height: 40, borderRadius: 9, fontSize: 14, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s',
              background: mode === m ? 'var(--bg-card-2)' : 'transparent',
              color: mode === m ? 'var(--text-primary)' : 'var(--text-muted)',
              border: mode === m ? '1px solid var(--border-light)' : '1px solid transparent',
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* Form */}
      <div style={{ width: '100%', maxWidth: 380, position: 'relative', zIndex: 1 }}>

        {success && (
          <div style={{ background: 'rgba(46,204,113,0.1)', border: '1px solid rgba(46,204,113,0.3)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: 'var(--success)', marginBottom: 16 }}>
            {success}
          </div>
        )}

        {/* ── LOGIN ── */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="input-wrap">
              <input id="login-email" className="input-field" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
              <label className="input-label" htmlFor="login-email">Email address</label>
            </div>
            <div className="input-wrap">
              <input id="login-password" className="input-field" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
              <label className="input-label" htmlFor="login-password">Password</label>
            </div>
            {error && <div className="error-msg">{error}</div>}
            <button type="submit" className="btn btn-primary" disabled={loading} id="login-submit">
              {loading ? <Spinner /> : 'Enter the Dojang'}
            </button>
            <button type="button" onClick={() => switchMode('forgot')}
              style={{ background: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', textAlign: 'center' }}>
              Forgot password?
            </button>
          </form>
        )}

        {/* ── SIGN UP ── */}
        {mode === 'signup' && (
          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="input-wrap">
              <input id="signup-name" className="input-field" type="text" placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} required autoComplete="name" />
              <label className="input-label" htmlFor="signup-name">Full Name</label>
            </div>
            <div className="input-wrap">
              <input id="signup-email" className="input-field" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
              <label className="input-label" htmlFor="signup-email">Email address</label>
            </div>
            <div className="input-wrap">
              <input id="signup-password" className="input-field" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="new-password" minLength={6} />
              <label className="input-label" htmlFor="signup-password">Password (min 6 chars)</label>
            </div>
            {error && <div className="error-msg">{error}</div>}
            <button type="submit" className="btn btn-primary" disabled={loading} id="signup-submit">
              {loading ? <Spinner /> : 'Create Account'}
            </button>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6 }}>
              New accounts are created as <span style={{ color: 'var(--gold)' }}>Student</span> by default.<br />
              An Admin can change your role from the dashboard.
            </div>
          </form>
        )}

        {/* ── FORGOT PASSWORD ── */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgot} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ marginBottom: 4 }}>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Reset Password</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Enter your email to receive a reset link</div>
            </div>
            <div className="input-wrap">
              <input id="forgot-email" className="input-field" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
              <label className="input-label" htmlFor="forgot-email">Email address</label>
            </div>
            {error && <div className="error-msg">{error}</div>}
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <Spinner /> : 'Send Reset Link'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => switchMode('login')}>
              Back to Log In
            </button>
          </form>
        )}
      </div>

      <div style={{ position: 'absolute', bottom: 20, fontSize: 11, color: 'var(--text-dim)', textAlign: 'center', zIndex: 1 }}>
        DojanHub © {new Date().getFullYear()} · Powered by discipline
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
      Please wait…
    </span>
  )
}
