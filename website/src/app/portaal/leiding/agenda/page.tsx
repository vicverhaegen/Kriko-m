import { redirect } from 'next/navigation'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase'
import LeidingCalendar from '../../_components/LeidingCalendar'
import { CalendarEvent } from '@/lib/types'

export default async function FullAgendaPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) redirect('/portaal')
  const user = session.user

  const role = user.app_metadata?.role || ''
  if (role === 'webshop') redirect('/portaal?error=unauthorized')

  const isLeiding = role === 'admin' || role === 'groepsleiding' || role === 'leiding'
  if (!isLeiding) redirect('/portaal')

  const isGroepsleiding = role === 'admin' || role === 'groepsleiding'
  const admin = createAdminClient()
  const [authRes, calendarRes, settingsRes] = await Promise.all([
    supabase.auth.getUser(),
    admin.from('calendar').select('*').order('date', { ascending: true }),
    admin.from('settings').select('leiding_ics_token, groepsleiding_ics_token').eq('id', 1).single(),
  ])

  if (authRes.error || !authRes.data.user) redirect('/portaal')

  let calendarEvents = (calendarRes.data ?? []) as CalendarEvent[]
  // Gewone leiding mag géén GRL-activiteiten zien
  if (!isGroepsleiding) {
    calendarEvents = calendarEvents.filter(e => !(e.audience ?? []).includes('grl'))
  }

  const icsToken = (isGroepsleiding
    ? (settingsRes.data?.groepsleiding_ics_token || settingsRes.data?.leiding_ics_token || '')
    : (settingsRes.data?.leiding_ics_token || '')) as string
  const canPublish = isGroepsleiding

  return (
    <div className="portaal-page-container portaal-agenda-page-container">
      <LeidingCalendar
        initialCalendar={calendarEvents}
        canPublish={canPublish}
        isGroepsleiding={isGroepsleiding}
        icsToken={icsToken}
        twoColumn={true}
      />
    </div>
  )
}
