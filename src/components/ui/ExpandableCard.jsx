import { useState } from 'react'

export default function ExpandableCard({ title, icon, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="card expand-card" style={{ marginBottom: 10 }}>
      <div className="expand-header" onClick={() => setOpen(!open)}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>{icon}</span> {title}
        </h3>
        <span className={`expand-chevron ${open ? 'open' : ''}`}>▾</span>
      </div>
      <div className={`expand-body ${open ? 'open' : ''}`}>
        <div style={{ paddingTop: 12 }}>{children}</div>
      </div>
    </div>
  )
}
