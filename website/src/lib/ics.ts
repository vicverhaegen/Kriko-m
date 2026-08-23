export const CAL_TZ = 'Europe/Brussels'

export interface IcsEvent {
  id: string
  title: string
  date: string
  datum_tot?: string | null
  time?: string | null
  location?: string | null
  description?: string | null
}

export function foldIcsLine(line: string): string {
  if (line.length <= 75) return line
  const out: string[] = [line.slice(0, 75)]
  let pos = 75
  while (pos < line.length) {
    out.push(line.slice(pos, pos + 74))
    pos += 74
  }
  return out.join('\r\n ')
}

export function escapeIcsText(str: string): string {
  return (str ?? '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n').replace(/\r/g, '\\n')
}

export function toUtcIcsString(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

// VTIMEZONE voor Europe/Brussels (CET/CEST). Zo interpreteren agenda's de
// lokale wandkloktijd correct, ongeacht de tijdzone van de server.
export const VTIMEZONE = [
  'BEGIN:VTIMEZONE',
  'TZID:Europe/Brussels',
  'BEGIN:DAYLIGHT',
  'TZOFFSETFROM:+0100',
  'TZOFFSETTO:+0200',
  'TZNAME:CEST',
  'DTSTART:19700329T020000',
  'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
  'END:DAYLIGHT',
  'BEGIN:STANDARD',
  'TZOFFSETFROM:+0200',
  'TZOFFSETTO:+0100',
  'TZNAME:CET',
  'DTSTART:19701025T030000',
  'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
  'END:STANDARD',
  'END:VTIMEZONE',
]

// Lokale wandkloktijd → ICS-string (geen tijdzone-conversie).
function toLocalIcsString(dateStr: string, hh: number, mm: number): string {
  const ymd = dateStr.replace(/-/g, '')
  return `${ymd}T${String(hh).padStart(2, '0')}${String(mm).padStart(2, '0')}00`
}

export function parseEventDates(event: IcsEvent) {
  const dateStr = event.date // YYYY-MM-DD
  const endDateStr = event.datum_tot && event.datum_tot !== event.date ? event.datum_tot : dateStr
  const timeStr = event.time?.trim() ?? ''

  const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})/g)
  if (timeMatch && timeMatch.length >= 1) {
    const [sh, sm] = timeMatch[0].split(':').map(Number)
    let eh: number, em: number
    if (timeMatch.length >= 2) {
      ;[eh, em] = timeMatch[1].split(':').map(Number)
    } else {
      eh = (sh + 1) % 24
      em = sm
    }
    return {
      allDay: false as const,
      startLocal: toLocalIcsString(dateStr, sh, sm),
      endLocal: toLocalIcsString(endDateStr, eh, em),
    }
  }
  // Hele dag (DTEND is exclusief → +1 dag).
  const start = new Date(`${dateStr}T00:00:00Z`)
  const end = new Date(`${endDateStr}T00:00:00Z`)
  end.setDate(end.getDate() + 1)
  return {
    allDay: true as const,
    startYmd: start.toISOString().slice(0, 10).replace(/-/g, ''),
    endYmd: end.toISOString().slice(0, 10).replace(/-/g, ''),
  }
}

export function icsHeader(
  calName: string,
  calDesc = 'Activiteiten en evenementen van Scouts Kriko-M',
  color = '#650B19'
): string[] {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Scouts Kriko-M//Kalender//NL',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'NAME:' + escapeIcsText(calName),
    'X-WR-CALNAME:' + escapeIcsText(calName),
    'DESCRIPTION:' + escapeIcsText(calDesc),
    'X-WR-CALDESC:' + escapeIcsText(calDesc),
    'COLOR:' + color,
    'X-APPLE-CALENDAR-COLOR:' + color,
    'X-OUTLOOK-COLOR:' + color,
    'X-WR-TIMEZONE:' + CAL_TZ,
    'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
    'X-PUBLISHED-TTL:PT1H',
    ...VTIMEZONE,
  ]
}

// Bouwt één VEVENT-blok voor een gewoon kalender-event.
export function buildEventVevent(event: IcsEvent, nowStr: string, summaryPrefix = ''): string[] {
  const ev = parseEventDates(event)
  const uid = `${event.id}@kriko-m.be`
  const lines: string[] = ['BEGIN:VEVENT', `UID:${escapeIcsText(uid)}`, `DTSTAMP:${nowStr}`]

  if (ev.allDay) {
    lines.push(`DTSTART;VALUE=DATE:${ev.startYmd}`)
    lines.push(`DTEND;VALUE=DATE:${ev.endYmd}`)
  } else {
    lines.push(`DTSTART;TZID=${CAL_TZ}:${ev.startLocal}`)
    lines.push(`DTEND;TZID=${CAL_TZ}:${ev.endLocal}`)
  }

  lines.push(`SUMMARY:${escapeIcsText(summaryPrefix + (event.title ?? 'Activiteit'))}`)
  if (event.description) lines.push(`DESCRIPTION:${escapeIcsText(event.description)}`)
  if (event.location) lines.push(`LOCATION:${escapeIcsText(event.location)}`)
  lines.push('END:VEVENT')
  return lines
}
