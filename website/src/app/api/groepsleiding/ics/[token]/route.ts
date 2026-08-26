import { NextRequest } from 'next/server'
import { getAllCalendarEvents, getGroepsleidingIcsToken } from '@/lib/db'
import { CalendarEvent } from '@/lib/types'
import { AUDIENCE_NAMEN } from '@/lib/constants'
import { IcsEvent, icsHeader, buildEventVevent, foldIcsLine } from '@/lib/ics'

// Private groepsleiding-feed: ALLE events (inclusief GRL-activiteiten).
// Beveiligd met een geheim groepsleiding-token in de URL.
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await props.params
    const { searchParams } = new URL(request.url)
    const download = searchParams.get('download') === '1' || searchParams.get('download') === 'true'

    const validToken = await getGroepsleidingIcsToken()
    if (!validToken || token !== validToken) {
      return new Response('Geen toegang', { status: 403 })
    }

    const events = (await getAllCalendarEvents()) as CalendarEvent[]

    const lines = icsHeader('Groeps Kriko-m', 'Volledige kalender inclusief groepsleiding (GRL) van Scouts Kriko-m', '#1E7E52')
    const nowStr = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

    for (const event of events) {
      const tags = (event.audience ?? []).map(a => (a === 'groep' ? 'Kriko-m' : AUDIENCE_NAMEN[a] ?? a))
      const prefix = tags.length ? `${tags.join(', ')} | ` : 'Kriko-m | '
      lines.push(...buildEventVevent(event as IcsEvent, nowStr, prefix))
    }

    lines.push('END:VCALENDAR')

    const icsContent = lines.map(foldIcsLine).join('\r\n') + '\r\n'

    const headers: Record<string, string> = {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Cache-Control': 'no-cache, must-revalidate',
    }

    if (download) {
      headers['Content-Disposition'] = 'attachment; filename="kriko-m-groepsleiding-kalender.ics"'
    } else {
      headers['Content-Disposition'] = 'inline'
    }

    return new Response(icsContent, { headers })
  } catch (error) {
    console.error('Groepsleiding ICS export error:', error)
    return new Response('Server Error', { status: 500 })
  }
}
