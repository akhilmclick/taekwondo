import { useEffect, useRef } from 'react'
import { BELT_ORDER } from '../../lib/utils'

export default function BeltTimeline({ currentBelt, beltHistory = [] }) {
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        const steps = ref.current?.querySelectorAll('.belt-step')
        steps?.forEach((el, i) => {
          setTimeout(() => el.classList.add('visible'), i * 120)
        })
      }
    }, { threshold: 0.2 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  const currentIdx = BELT_ORDER.indexOf(currentBelt)
  const belts = BELT_ORDER.slice(0, currentIdx + 1)

  const dateFor = (belt) => {
    const h = beltHistory.find(h => h.new_belt === belt)
    return h?.grading_date ? new Date(h.grading_date).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }) : ''
  }

  return (
    <div className="belt-timeline" ref={ref}>
      {belts.map((belt, i) => (
        <div key={belt} style={{ display: 'flex', alignItems: 'center' }}>
          {i > 0 && <div className="belt-connector" />}
          <div className="belt-step">
            <div className={`belt-bar belt-bar-${belt}`} style={belt === currentBelt ? { boxShadow: '0 0 8px currentColor' } : {}} />
            <div style={{ fontSize: 9, color: belt === currentBelt ? 'var(--gold)' : 'var(--text-dim)', textAlign: 'center', maxWidth: 44 }}>
              {belt === 'Black' ? 'Black' : belt.slice(0,3)}
              {dateFor(belt) && <div style={{ fontSize: 8, color: 'var(--text-dim)' }}>{dateFor(belt)}</div>}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
