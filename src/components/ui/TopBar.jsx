import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { getInitials } from '../../lib/utils'
import Avatar from './Avatar'

export default function TopBar({ name, role, belt }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <header className="top-bar">
      <div className="logo-text">
        <span className="logo-dojan">DOJAN</span>
        <span className="logo-hub">HUB</span>
      </div>
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setOpen(!open)}
          style={{ background: 'none', display: 'flex', alignItems: 'center', gap: 8, padding: 4, borderRadius: 24, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}
        >
          <Avatar name={name} belt={belt || 'White'} size="sm" />
          <span style={{ fontSize: 13, color: 'var(--text-primary)', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {name?.split(' ')[0]}
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', marginRight: 4 }}>▾</span>
        </button>
        {open && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 8px)', right: 0,
            background: 'var(--bg-card-2)', border: '1px solid var(--border-light)',
            borderRadius: 12, minWidth: 160, overflow: 'hidden', zIndex: 200,
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)' }}>
              {name}<br />
              <span style={{ textTransform: 'capitalize', color: 'var(--gold)', fontSize: 11 }}>{role}</span>
            </div>
            <button onClick={handleLogout}
              style={{ width: '100%', padding: '12px 14px', background: 'none', color: 'var(--danger)', textAlign: 'left', fontSize: 13, cursor: 'pointer' }}>
              🚪 Logout
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
