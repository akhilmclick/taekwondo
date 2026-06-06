export default function CircularProgress({ percent = 0, size = 90, strokeWidth = 8, label }) {
  const r = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference - (percent / 100) * circumference
  const color = percent >= 80 ? 'var(--success)' : percent >= 50 ? 'var(--warning)' : 'var(--danger)'

  return (
    <div className="ring-wrap" style={{ width: size, height: size }}>
      <svg className="ring-svg" width={size} height={size}>
        <circle className="ring-bg" cx={size/2} cy={size/2} r={r} strokeWidth={strokeWidth} />
        <circle
          className="ring-fill"
          cx={size/2} cy={size/2} r={r}
          strokeWidth={strokeWidth}
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="ring-label">
        <div className="font-display" style={{ fontSize: size * 0.22, color, lineHeight: 1 }}>{percent}%</div>
        {label && <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>}
      </div>
    </div>
  )
}
