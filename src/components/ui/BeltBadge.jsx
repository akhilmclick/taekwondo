export default function BeltBadge({ belt, rankNumber }) {
  const danMap = { 1:'1st',2:'2nd',3:'3rd',4:'4th',5:'5th',6:'6th',7:'7th',8:'8th',9:'9th' }
  const rank = belt === 'Black' && rankNumber ? ` ${danMap[rankNumber] || rankNumber} Dan` : ''
  return (
    <span className={`belt-badge belt-${belt}`}>
      <span style={{ width: 8, height: 8, borderRadius: 2, background: 'currentColor', opacity: 0.7, display: 'inline-block' }} />
      {belt}{rank}
    </span>
  )
}
