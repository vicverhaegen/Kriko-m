import { NextRequest } from 'next/server'
import { getAllCalendarEvents, getLeidingIcsToken } from '@/lib/db'
import { CalendarEvent } from '@/lib/types'
import { AUDIENCE_NAMEN } from '@/lib/constants'
import { IcsEvent, icsHeader, buildEventVevent, foldIcsLine } from '@/lib/ics'

// Private leiding-feed: ALLE events. Beveiligd met een geheim token in de URL.
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await props.params
    const { searchParams } = new URL(request.url)
    const download = searchParams.get('download') === '1' || searchParams.get('download') === 'true'

    const validToken = await getLeidingIcsToken()
    if (!validToken || token !== validToken) {
      return new Response('Geen toegang', { status: 403 })
    }

    const events = (await getAllCalendarEvents()) as CalendarEvent[]

    const lines = icsHeader('Scouts Kriko-M — Leiding', 'Volledige leidingkalender en takactiviteiten van Scouts Kriko-M', '#162544')
    const nowStr = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

    for (const event of events) {
      const tags = (event.audience ?? []).map(a => (a === 'groep' ? 'Kriko-M' : AUDIENCE_NAMEN[a] ?? a))
      const prefix = tags.length ? `${tags.join(', ')} | ` : 'Kriko-M | '
      lines.push(...buildEventVevent(event as IcsEvent, nowStr, prefix))
    }

    lines.push('END:VCALENDAR')

    const icsContent = lines.map(foldIcsLine).join('\r\n') + '\r\n'

    const headers: Record<string, string> = {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Cache-Control': 'no-cache, must-revalidate',
    }

    if (download) {
      headers['Content-Disposition'] = 'attachment; filename="kriko-m-leiding-kalender.ics"'
    } else {
      headers['Content-Disposition'] = 'inline'
    }

    return new Response(icsContent, { headers })
  } catch (error) {
    console.error('Leiding ICS export error:', error)
    return new Response('Server Error', { status: 500 })
  }
}
