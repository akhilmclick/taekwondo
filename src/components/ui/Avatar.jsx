import { getInitials, getBeltColor } from '../../lib/utils'

export default function Avatar({ name, belt = 'White', size = 'md', style = {} }) {
  const initials = getInitials(name)
  const bg = getBeltColor(belt)
  const cls = `avatar avatar-${size} av-${belt}`
  return (
    <div className={cls} style={{ background: bg, ...style }}>
      {initials}
    </div>
  )
}
