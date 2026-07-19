// Indian-numbering money + shared formatters.

export function inr(amount) {
  if (amount == null) return '-'
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} L`
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}k`
  return `₹${amount}`
}

export function inrFull(amount) {
  if (amount == null) return '-'
  return '₹' + amount.toLocaleString('en-IN')
}

export function pct(n, digits = 0) {
  if (n == null) return '-'
  return `${n.toFixed(digits)}%`
}

export function dateLabel(iso) {
  if (!iso) return '-'
  const [y, m, d] = iso.split(' ')[0].split('-')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${d} ${months[Number(m) - 1]} ${y}`
}

export const BAND_TONE = { Low: 'success', Watch: 'warning', High: 'error' }
export const SEVERITY_TONE = { Low: 'success', Medium: 'warning', High: 'error' }
export const STATUS_TONE = {
  New: 'info',
  'In review': 'warning',
  'Awaiting committee': 'violet',
  Decided: 'muted',
}
