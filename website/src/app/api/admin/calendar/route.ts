import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { requireLeiding, requireGroepsleiding } from '@/lib/auth'
import { getActiveWerkjaar } from '@/lib/db'
import { AUDIENCE_TAGS } from '@/lib/constants'
import { revalidateTag } from 'next/cache'

const VALID_AUDIENCE = new Set<string>(AUDIENCE_TAGS)

// Schoont en valideert de audience-tags en past de rechten toe. Enkel
// groepsleiding mag publiceren naar 'groep' (publiek) of 'grl' (groepsleiding).
function sanitizeAudience(raw: unknown, isGroepsleiding: boolean) {
  let audience = Array.isArray(raw) ? raw.filter(a => VALID_AUDIENCE.has(a)) : []
  if (!isGroepsleiding) {
    audience = audience.filter(a => a !== 'groep' && a !== 'grl') // gewone leiding mag niet publiek publiceren of GRL taggen
  }
  // Dedupe
  audience = [...new Set(audience)]
  return audience
}

export async function POST(req: NextRequest) {
  const user = await requireLeiding()
  if (!user) return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })

  const body = await req.json()
  const wantsPublic = Array.isArray(body.audience) && body.audience.includes('groep')
  const wantsGrl = Array.isArray(body.audience) && body.audience.includes('grl')

  // Publiek publiceren naar ouderagenda of GRL agenda = enkel groepsleiding.
  let isGroepsleiding = false
  if (wantsPublic || wantsGrl) {
    const gl = await requireGroepsleiding()
    if (!gl) return NextResponse.json({ error: 'Enkel groepsleiding kan publiceren naar de ouderagenda of GRL-agenda.' }, { status: 403 })
    isGroepsleiding = true
  }

  const audience = sanitizeAudience(body.audience, isGroepsleiding)
  const evenement = !!body.is_evenement

  const werkjaar = await getActiveWerkjaar()
  const admin = createAdminClient()

  const insertData: Record<string, unknown> = {
    title: body.title,
    date: body.date,
    datum_tot: body.datum_tot || null,
    time: body.time || '',
    location: body.location || '',
    description: body.description || '',
    facebook_event_url: body.facebook_event_url || '',
    facebook_post_url: body.facebook_post_url || '',
    external_link_url: body.external_link_url || '',
    document_url: body.document_url || '',
    banner_image: body.banner_image || '',
    audience,
    is_evenement: evenement,
    werkjaar,
  }

  if (body.icon) {
    insertData.icon = body.icon
  }

  let { data, error } = await admin
    .from('calendar')
    .insert(insertData)
    .select()
    .single()

  // Indien de 'icon' kolom nog niet bestaat in Supabase, voer de insert uit zonder 'icon'
  if (error && error.message?.includes("'icon'")) {
    delete insertData.icon
    const retry = await admin
      .from('calendar')
      .insert(insertData)
      .select()
      .single()
    data = retry.data
    error = retry.error
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  revalidateTag('calendar', 'max')
  return NextResponse.json(data)
}
