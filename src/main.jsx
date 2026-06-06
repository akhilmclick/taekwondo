import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// ── Catch silent crashes and show them on screen ──────────────
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100dvh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: '#0A0A0F', color: '#F0EEE9', padding: 24, fontFamily: 'sans-serif',
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: '#E74C3C' }}>
            App failed to start
          </div>
          <div style={{
            fontSize: 13, color: '#6B6B7A', maxWidth: 360, textAlign: 'center',
            background: '#12121A', padding: 16, borderRadius: 12, wordBreak: 'break-all',
          }}>
            {this.state.error?.message || String(this.state.error)}
          </div>
          <div style={{ marginTop: 20, fontSize: 12, color: '#4A4A58' }}>
            Check that VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in Vercel → Settings → Environment Variables
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: 16, padding: '10px 24px', background: '#D62828', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// ── Guard: warn loudly if env vars are missing ─────────────────
if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.error(
    '[DojanHub] Missing environment variables!\n' +
    'VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL,
    '\nVITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY,
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

