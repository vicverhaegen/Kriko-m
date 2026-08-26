import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { requireLeiding, requireGroepsleiding } from '@/lib/auth'
import { AUDIENCE_TAGS } from '@/lib/constants'
import { revalidateTag } from 'next/cache'

const VALID_AUDIENCE = new Set<string>(AUDIENCE_TAGS)

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireLeiding()
  if (!user) return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })

  const { id } = await params
  const body = await req.json()
  const admin = createAdminClient()

  // Bestaand event ophalen om de rechten te bepalen.
  const { data: existing, error: fetchErr } = await admin
    .from('calendar')
    .select('audience, is_evenement')
    .eq('id', id)
    .single()
  if (fetchErr || !existing) return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 })

  const resultingAudience: string[] = 'audience' in body
    ? (Array.isArray(body.audience) ? body.audience.filter((a: string) => VALID_AUDIENCE.has(a)) : [])
    : (existing.audience ?? [])
  const resultingEvenement = 'is_evenement' in body ? !!body.is_evenement : !!existing.is_evenement

  const touchesPublic =
    resultingAudience.includes('groep') || (existing.audience ?? []).includes('groep')
  const touchesGrl =
    resultingAudience.includes('grl') || (existing.audience ?? []).includes('grl')

  // Publieke events (groep tag) en groepsleiding-events (grl tag) mogen enkel door groepsleiding bewerkt worden.
  if (touchesPublic || touchesGrl) {
    const gl = await requireGroepsleiding()
    if (!gl) return NextResponse.json({ error: 'Enkel groepsleiding kan publieke of GRL-events bewerken.' }, { status: 403 })
  }

  const STRING_NOT_NULL_KEYS = new Set([
    'time', 'location', 'description',
    'facebook_event_url', 'facebook_post_url', 'external_link_url',
    'document_url', 'banner_image'
  ])

  const update: Record<string, unknown> = {}
  for (const key of ['title', 'date', 'time', 'location', 'description', 'facebook_event_url', 'facebook_post_url', 'external_link_url', 'document_url', 'banner_image', 'icon']) {
    if (key in body) {
      if (STRING_NOT_NULL_KEYS.has(key)) {
        update[key] = body[key] ?? ''
      } else {
        update[key] = body[key] ?? null
      }
    }
  }
  if ('datum_tot' in body) update.datum_tot = body.datum_tot || null
  if ('audience' in body) update.audience = [...new Set(resultingAudience)]
  if ('is_evenement' in body) update.is_evenement = resultingEvenement

  let { data, error } = await admin
    .from('calendar')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  // Indien de 'icon' kolom nog niet bestaat in Supabase, voer de update uit zonder 'icon'
  if (error && error.message?.includes("'icon'")) {
    delete update.icon
    const retry = await admin
      .from('calendar')
      .update(update)
      .eq('id', id)
      .select()
      .single()
    data = retry.data
    error = retry.error
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  revalidateTag('calendar', 'max')
  return NextResponse.json(data)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireLeiding()
  if (!user) return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })

  const { id } = await params
  const admin = createAdminClient()

  // Bestaand event ophalen: publieke events en GRL-events mogen enkel door groepsleiding verwijderd worden.
  const { data: existing } = await admin
    .from('calendar')
    .select('audience, is_evenement')
    .eq('id', id)
    .single()
  const existingAudience = existing?.audience ?? []
  if (existing && (existingAudience.includes('groep') || existingAudience.includes('grl'))) {
    const gl = await requireGroepsleiding()
    if (!gl) return NextResponse.json({ error: 'Enkel groepsleiding kan publieke of GRL-events verwijderen.' }, { status: 403 })
  }

  const { error } = await admin.from('calendar').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  revalidateTag('calendar', 'max')
  return NextResponse.json({ ok: true })
}
