import { redirect } from 'next/navigation'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase'
import DocumentenClient from './DocumentenClient'
import { DEFAULT_RESOURCES, type PortalResource } from '@/app/api/admin/portal-resources/route'

export const metadata = { title: 'Documenten & Links — Portaal' }

export default async function DocumentenPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) redirect('/portaal')

  const { data: { user: verified }, error } = await supabase.auth.getUser()
  if (error || !verified) redirect('/portaal')

  const role = verified.app_metadata?.role || ''
  if (role === 'webshop') redirect('/portaal?error=unauthorized')

  const isLeiding = role === 'admin' || role === 'groepsleiding' || role === 'leiding'
  if (!isLeiding) redirect('/portaal')

  const isGroepsleiding = role === 'admin' || role === 'groepsleiding'

  let resources: PortalResource[] = DEFAULT_RESOURCES
  try {
    const admin = createAdminClient()
    const { data, error: dbError } = await admin
      .from('portal_resources')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (!dbError && data && data.length > 0) {
      resources = data as PortalResource[]
    } else {
      // Auto-seed default resources into DB if table is empty
      const seedItems = DEFAULT_RESOURCES.map(({ id: _id, ...rest }) => rest)
      const { data: seededData, error: seedError } = await admin
        .from('portal_resources')
        .insert(seedItems)
        .select()

      if (!seedError && seededData && seededData.length > 0) {
        resources = seededData as PortalResource[]
      }
    }
  } catch (err) {
    console.error('Error loading resources in server component:', err)
  }

  const filteredResources = isGroepsleiding
    ? resources
    : resources.filter(item => (item.category || '').toLowerCase() !== 'groeps')

  return (
    <DocumentenClient
      initialResources={filteredResources}
      isGroepsleiding={isGroepsleiding}
    />
  )
}
