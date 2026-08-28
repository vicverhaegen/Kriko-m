import { redirect } from 'next/navigation'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase'
import WebshopPageClient from '../WebshopPageClient'
import { Settings } from '@/lib/types'
import { normalizeSettings } from '@/lib/db'

export const metadata = { title: 'Bestellingen — Webshop & Uniformen | Kriko-M' }

export default async function WebshopBestellingenPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) redirect('/portaal')

  const { data: { user: verified }, error } = await supabase.auth.getUser()
  if (error || !verified) redirect('/portaal')

  const role = verified.app_metadata?.role || ''
  const isAuthorized = role === 'admin' || role === 'groepsleiding' || role === 'webshop'
  if (!isAuthorized) redirect('/portaal/home')

  const admin = createAdminClient()
  const [{ data: settingsData }, { data: ordersData }] = await Promise.all([
    admin.from('settings').select('*').single(),
    admin.from('orders').select('*').order('created_at', { ascending: false }),
  ])

  return (
    <WebshopPageClient
      initialSettings={normalizeSettings(settingsData) as Settings}
      role={role}
      activeTab="bestellingen"
      initialOrders={ordersData ?? []}
    />
  )
}
