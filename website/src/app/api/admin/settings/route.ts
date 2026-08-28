import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { requireGroepsleiding, requireWebshop } from '@/lib/auth'
import { revalidateTag } from 'next/cache'
import { PORTAAL_TAKKEN } from '@/lib/constants'
import { normalizeSettings } from '@/lib/db'

// Welke publieke tak-velden de website-content-editor mag aanpassen.
const TAK_EDITABLE_FIELDS = ['email', 'whatsapp_url', 'description', 'uniform', 'photo'] as const

export async function PATCH(req: NextRequest) {
  // Webshop role can edit webshop settings; Groepsleiding can edit all settings
  const webshopUser = await requireWebshop()
  if (!webshopUser) return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })

  const isGroepsleiding = webshopUser.app_metadata?.role === 'admin' || webshopUser.app_metadata?.role === 'groepsleiding'

  const body = await req.json()
  const admin = createAdminClient()

  // 1. Fetch current settings (including portal_backgrounds JSONB)
  const { data: currentSettings, error: fetchError } = await admin
    .from('settings')
    .select('*')
    .eq('id', 1)
    .single()

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  const pb: Record<string, unknown> = { ...(currentSettings?.portal_backgrounds ?? {}) }

  const PORTAL_FIELDS = [
    'home_title_leiding',
    'home_subtitle_leiding',
    'home_title_groepsleiding',
    'home_subtitle_groepsleiding',
    'portal_login_foto',
  ]

  const WEBSHOP_BOOLEAN_FIELDS = [
    'webshop_enable_customer_email',
    'webshop_enable_financial_email',
    'webshop_enable_team_email',
  ]

  let pbChanged = false
  if (isGroepsleiding) {
    for (const field of PORTAL_FIELDS) {
      if (field in body) {
        pb[field] = String(body[field]).slice(0, 1000)
        pbChanged = true
      }
    }
  }

  for (const field of WEBSHOP_BOOLEAN_FIELDS) {
    if (field in body) {
      pb[field] = Boolean(body[field])
      pbChanged = true
    }
  }

  const update: Record<string, unknown> = {}
  if (pbChanged) {
    update.portal_backgrounds = pb
  }

  const STANDARD_SQL_FIELDS = [
    'scouts_year',
    'bank_iban',
    'bank_bic',
    'bank_holder',
    'contact_email',
    'webshop_email',
    'webshop_financial_email',
    'reg_fee_first',
    'reg_fee_extra',
    'home_leiding_foto',
    'home_title',
    'home_subtitle',
  ]

  for (const key of STANDARD_SQL_FIELDS) {
    if (key in body) {
      // If not groepsleiding, only allow webshop email fields
      if (!isGroepsleiding && key !== 'webshop_email' && key !== 'webshop_financial_email') {
        continue
      }
      if (key === 'reg_fee_first' || key === 'reg_fee_extra') {
        update[key] = Number(body[key]) || 0
      } else {
        update[key] = String(body[key]).slice(0, 1000)
      }
    }
  }

  // Takken-content (publieke takpagina's + groepsleiding): veilige per-tak merge op de
  // bestaande JSONB zodat we nooit andere takken/velden overschrijven.
  if (body.takken && typeof body.takken === 'object') {
    const merged: Record<string, Record<string, unknown>> = { ...(currentSettings?.takken ?? {}) }

    for (const [tak, incoming] of Object.entries(body.takken as Record<string, unknown>)) {
      if (!(PORTAAL_TAKKEN as readonly string[]).includes(tak)) continue
      if (!incoming || typeof incoming !== 'object') continue
      const src = incoming as Record<string, unknown>
      const target = { ...(merged[tak] ?? {}) }

      for (const field of TAK_EDITABLE_FIELDS) {
        if (field in src) target[field] = String(src[field] ?? '').slice(0, 2000)
      }

      if (Array.isArray(src.leaders)) {
        target.leaders = (src.leaders as unknown[])
          .filter(l => l && typeof l === 'object')
          .map(l => ({
            name: String((l as Record<string, unknown>).name ?? '').slice(0, 120),
            totem: String((l as Record<string, unknown>).totem ?? '').slice(0, 200),
            role: String((l as Record<string, unknown>).role ?? '').slice(0, 120),
            phone: String((l as Record<string, unknown>).phone ?? '').slice(0, 60),
          }))
          .filter(l => l.name)
      }

      merged[tak] = target
    }

    update.takken = merged
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Geen geldige velden' }, { status: 400 })
  }

  let { data, error } = await admin.from('settings').update(update).eq('id', 1).select().single()
  
  // Als de database-tabel een specifieke kolom mist (bijv. webshop_email als de migratie nog niet uitgevoerd is),
  // vangen we de fout op, verwijderen de ontbrekende kolom uit 'update' en proberen opnieuw.
  while (error && error.message.includes("Could not find the '")) {
    const match = error.message.match(/Could not find the '([^']+)' column/)
    if (match && match[1] && match[1] in update) {
      delete update[match[1]]
      if (Object.keys(update).length === 0) break
      const retry = await admin.from('settings').update(update).eq('id', 1).select().single()
      data = retry.data
      error = retry.error
    } else {
      break
    }
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  revalidateTag('settings', 'max')

  const normalized = normalizeSettings(data)
  return NextResponse.json(normalized)
}

export async function POST(req: NextRequest) {
  return PATCH(req)
}
