export function getInitials(name = '') {
  return name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'
}

export function getBeltColor(belt) {
  const map = {
    White: '#555', Yellow: '#8a6e00', Green: '#1a6e40',
    Blue: '#1a5280', Red: '#7B241C', Black: '#1A1A1A',
  }
  return map[belt] || '#555'
}

export function getBeltTextColor(belt) {
  return belt === 'White' ? '#ccc' : '#fff'
}

export const BELT_ORDER = ['White', 'Yellow', 'Green', 'Blue', 'Red', 'Black']

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatMonth(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
}

export function daysUntil(dateStr) {
  if (!dateStr) return null
  const diff = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24))
  return diff
}

export function calcAge(dob) {
  if (!dob) return null
  const diff = Date.now() - new Date(dob).getTime()
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000))
}

export function getAttendancePercent(logs = []) {
  if (!logs.length) return 0
  const present = logs.filter(l => l.status === 'present').length
  return Math.round((present / logs.length) * 100)
}

export function getLast30Days(logs = []) {
  const days = []
  const logMap = {}
  logs.forEach(l => { logMap[l.date] = l.status })
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    days.push({ date: key, day: d.getDate(), status: logMap[key] || 'none' })
  }
  return days
}

export function currentMonthPayment(payments = []) {
  const now = new Date()
  return payments.find(p => {
    const d = new Date(p.due_date)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
}
