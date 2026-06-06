import { useEffect, useRef, useState } from 'react'

export default function StatCard({ label, value, icon, suffix = '' }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef(null)
  const animated = useRef(false)

  useEffect(() => {
    if (value === undefined || value === null) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !animated.current) {
        animated.current = true
        const target = parseFloat(value)
        if (isNaN(target)) { setDisplay(value); return }
        const duration = 800
        const start = performance.now()
        const tick = (now) => {
          const progress = Math.min((now - start) / duration, 1)
          const eased = 1 - Math.pow(1 - progress, 3)
          setDisplay(Math.round(eased * target))
          if (progress < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }
    }, { threshold: 0.3 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [value])

  return (
    <div className="stat-card" ref={ref}>
      {icon && <div className="stat-icon">{icon}</div>}
      <div className="stat-number">{display}{suffix}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}
