import { redirect } from 'next/navigation'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase'
import LeidingbeheerClient from './LeidingbeheerClient'
import { Settings } from '@/lib/types'
import { normalizeSettings } from '@/lib/db'

export const metadata = { title: 'Leidingsbeheer — Leidingsportaal | Kriko-M' }

export default async function LeidingbeheerPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) redirect('/portaal')

  const { data: { user: verified }, error } = await supabase.auth.getUser()
  if (error || !verified) redirect('/portaal')

  const role = verified.app_metadata?.role || ''
  if (role === 'webshop') redirect('/portaal?error=unauthorized')

  const isAuthorized = role === 'admin' || role === 'groepsleiding'
  if (!isAuthorized) redirect('/portaal/home')

  const admin = createAdminClient()
  const { data: settingsData } = await admin.from('settings').select('*').single()

  return <LeidingbeheerClient initialSettings={normalizeSettings(settingsData) as Settings} />
}
