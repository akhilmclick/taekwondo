import { useNavigate, useLocation } from 'react-router-dom'

const ADMIN_TABS = [
  { label: 'Home',       icon: '⌂',  path: '/admin' },
  { label: 'Students',   icon: '👥', path: '/admin/students' },
  { label: 'Attendance', icon: '✓',  path: '/admin/attendance' },
  { label: 'Fees',       icon: '₹',  path: '/admin/fees' },
  { label: 'Schedule',   icon: '📅', path: '/admin/schedule' },
]

const COACH_TABS = [
  { label: 'Home',       icon: '⌂',  path: '/coach' },
  { label: 'Attendance', icon: '✓',  path: '/coach/attendance' },
  { label: 'Schedule',   icon: '📅', path: '/coach/schedule' },
]

const STUDENT_TABS = [
  { label: 'Home',     icon: '⌂',  path: '/student' },
  { label: 'Profile',  icon: '👤', path: '/student/profile' },
  { label: 'Schedule', icon: '📅', path: '/student/schedule' },
]

export default function BottomNav({ role }) {
  const navigate = useNavigate()
  const location = useLocation()
  const tabs = role === 'admin' ? ADMIN_TABS : role === 'coach' ? COACH_TABS : STUDENT_TABS

  return (
    <nav className="bottom-nav">
      {tabs.map(tab => {
        const active = location.pathname === tab.path ||
          (tab.path !== '/admin' && tab.path !== '/coach' && tab.path !== '/student' &&
           location.pathname.startsWith(tab.path))
        return (
          <button key={tab.path} className={`nav-item ${active ? 'active' : ''}`}
            onClick={() => navigate(tab.path)}>
            <span className="nav-item-icon">{tab.icon}</span>
            <span className="nav-item-label">{tab.label}</span>
            <span className="nav-dot" />
          </button>
        )
      })}
    </nav>
  )
}
