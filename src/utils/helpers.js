/** Merge class names, filtering falsy values */
export const cn = (...classes) => classes.filter(Boolean).join(' ')

/** Format a date string to readable format */
export const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/** Get initials from a full name */
export const getInitials = (name = '') =>
  name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()

/** Clamp a number between min and max */
export const clamp = (val, min, max) => Math.min(Math.max(val, min), max)

/** Calculate percentage, safe division */
export const pct = (num, den) => (den === 0 ? 0 : Math.round((num / den) * 100))
