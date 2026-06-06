import { getLast30Days } from '../../lib/utils'

export default function AttendanceCalendar({ logs = [] }) {
  const days = getLast30Days(logs)
  const dayNames = ['S','M','T','W','T','F','S']

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
        {dayNames.map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 9, color: 'var(--text-dim)', fontWeight: 600 }}>{d}</div>
        ))}
      </div>
      <div className="att-cal">
        {days.map((d) => (
          <div key={d.date} className={`att-day att-${d.status}`} title={`${d.date}: ${d.status}`}>
            {d.day}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
        {[['present','var(--success)','Present'],['absent','var(--danger)','Absent'],['late','var(--warning)','Late']].map(([s,c,l]) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-muted)' }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: c, opacity: 0.6 }} />
            {l}: {logs.filter(lg => lg.status === s).length}
          </div>
        ))}
      </div>
    </div>
  )
}
