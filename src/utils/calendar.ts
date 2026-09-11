/**
 * Helper to generate calendar event links and download .ics file
 */

function parseEventDateTime(dateStr: string, timeStr: string): { start: Date; end: Date } {
  const parts = dateStr.split('/')
  const day = Number(parts[0]) || 1
  const month = Number(parts[1]) || 1
  const year = Number(parts[2]) || new Date().getFullYear()

  const timeParts = timeStr.split(':')
  const hours = Number(timeParts[0]) || 11
  const minutes = Number(timeParts[1]) || 0

  const start = new Date(year, month - 1, day, hours, minutes, 0)
  // Default wedding duration: 4 hours
  const end = new Date(start.getTime() + 4 * 60 * 60 * 1000)
  return { start, end }
}

function toGoogleDateString(date: Date): string {
  return date.toISOString().replace(/-|:|\.\d+/g, '')
}

export function getGoogleCalendarUrl({
  title,
  details,
  location,
  dateStr,
  timeStr,
}: {
  title: string
  details: string
  location: string
  dateStr: string
  timeStr: string
}): string {
  const { start, end } = parseEventDateTime(dateStr, timeStr)
  const url = new URL('https://calendar.google.com/calendar/render')
  url.searchParams.set('action', 'TEMPLATE')
  url.searchParams.set('text', title)
  url.searchParams.set('details', details)
  url.searchParams.set('location', location)
  url.searchParams.set('dates', `${toGoogleDateString(start)}/${toGoogleDateString(end)}`)
  return url.toString()
}

export function downloadIcsFile({
  title,
  details,
  location,
  dateStr,
  timeStr,
}: {
  title: string
  details: string
  location: string
  dateStr: string
  timeStr: string
}) {
  const { start, end } = parseEventDateTime(dateStr, timeStr)

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ThiepCuoi//WeddingInvitation//VI',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `SUMMARY:${title}`,
    `DESCRIPTION:${details.replace(/\n/g, '\\n')}`,
    `LOCATION:${location}`,
    `DTSTART:${toGoogleDateString(start)}`,
    `DTEND:${toGoogleDateString(end)}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'thiep-cuoi.ics'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
