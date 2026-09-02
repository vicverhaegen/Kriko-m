import { NextRequest } from 'next/server'
import { getPublicCalendarEvents } from '@/lib/db'
import { IcsEvent, icsHeader, buildEventVevent, foldIcsLine } from '@/lib/ics'

// Publieke oudercalender-feed: enkel events met de 'groep'-tag.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const singleId = searchParams.get('event')
    const download = searchParams.get('download') === '1' || searchParams.get('download') === 'true'

    let calendarEvents = (await getPublicCalendarEvents()) as IcsEvent[]

    if (singleId) {
      calendarEvents = calendarEvents.filter(e => e.id === singleId)
    }

    const lines = icsHeader('Scouts Kriko-m', 'Activiteiten en evenementen van Scouts Kriko-m', '#650B19')
    const nowStr = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

    for (const event of calendarEvents) {
      lines.push(...buildEventVevent(event, nowStr, 'Kriko-m | '))
    }

    lines.push('END:VCALENDAR')

    const icsContent = lines.map(foldIcsLine).join('\r\n') + '\r\n'
    const filename = singleId ? `kriko-m-event-${singleId}.ics` : 'kriko-m-kalender.ics'

    const headers: Record<string, string> = {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Cache-Control': download
        ? 'no-cache, no-store, must-revalidate'
        : 'public, s-maxage=21600, stale-while-revalidate=86400',
    }

    if (download) {
      headers['Content-Disposition'] = `attachment; filename="${filename}"`
    } else {
      headers['Content-Disposition'] = 'inline'
    }

    return new Response(icsContent, { headers })
  } catch (error) {
    console.error('ICS export error:', error)
    return new Response('Server Error', { status: 500 })
  }
}
