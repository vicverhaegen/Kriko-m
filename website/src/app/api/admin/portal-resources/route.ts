import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { requireLeiding, requireGroepsleiding } from '@/lib/auth'

export interface PortalResource {
  id: string
  type: 'quicklink' | 'document'
  category: string
  label: string
  description: string
  url: string
  icon: string
  sort_order: number
  created_at?: string
  updated_at?: string
}

export const DEFAULT_RESOURCES: PortalResource[] = [
  { id: 'res_q1', type: 'quicklink', category: 'Snelkoppelingen', label: 'Groepsadmin', description: 'Leden & leiding administratie', url: 'https://groepsadmin.scoutsengidsenvlaanderen.be/groepsadmin/client/', icon: 'fa-solid fa-users-gear', sort_order: 1 },
  { id: 'res_q2', type: 'quicklink', category: 'Snelkoppelingen', label: 'Google Drive', description: 'Gedeelde mappen & bestanden', url: 'https://drive.google.com', icon: 'fa-brands fa-google-drive', sort_order: 2 },
  { id: 'res_q3', type: 'quicklink', category: 'Snelkoppelingen', label: 'Facebook', description: 'Officiële Kriko-M pagina', url: 'https://www.facebook.com/ScoutsKrikoM', icon: 'fa-brands fa-facebook', sort_order: 3 },
  { id: 'res_q4', type: 'quicklink', category: 'Snelkoppelingen', label: 'Scouts & Gidsen VL', description: 'Spelaanbod & richtlijnen', url: 'https://www.scoutsengidsenvlaanderen.be', icon: 'scouts-gidsen-vl', sort_order: 4 },

  { id: 'res_d1', type: 'document', category: '🏕️ Kamp', label: 'Kampgids & Draaiboek', description: 'Handleiding & stappenplan om een vlekkeloos kamp te organiseren.', url: 'https://drive.google.com', icon: 'fa-solid fa-tent', sort_order: 10 },
  { id: 'res_d2', type: 'document', category: '🏕️ Kamp', label: 'Checklist Kamp', description: 'Overzicht van materialen, veiligheid, EHBO en transport.', url: 'https://drive.google.com', icon: 'fa-solid fa-clipboard-check', sort_order: 11 },
  { id: 'res_d3', type: 'document', category: '💶 Financieel', label: 'Financieel Sjabloon', description: 'Excel/Google Sheet sjabloon voor kasboeken en takbudgetten.', url: 'https://drive.google.com', icon: 'fa-solid fa-calculator', sort_order: 20 },
  { id: 'res_d4', type: 'document', category: '💶 Financieel', label: 'Afrekeningsfiche', description: 'Sjabloon voor het indienen van onkostennota\'s en bewijsstukken.', url: 'https://drive.google.com', icon: 'fa-solid fa-receipt', sort_order: 21 },
  { id: 'res_d5', type: 'document', category: '🎲 Spel & Activiteiten', label: 'Spel Sjabloon', description: 'Standaard format voor het uitwerken van een spelvoorbereiding.', url: 'https://drive.google.com', icon: 'fa-solid fa-file-pen', sort_order: 30 },
  { id: 'res_d6', type: 'document', category: '🎲 Spel & Activiteiten', label: 'Checklist Spel', description: 'Checklist voor materiaal, regels, veiligheid en tijdsduur.', url: 'https://drive.google.com', icon: 'fa-solid fa-list-check', sort_order: 31 },
  { id: 'res_d7', type: 'document', category: '🎲 Spel & Activiteiten', label: 'Spelideeën Lijst', description: 'Lijst met originele spelideeën en bosspelen per leeftijd.', url: 'https://drive.google.com', icon: 'fa-solid fa-lightbulb', sort_order: 32 },
  { id: 'res_d8', type: 'document', category: '📑 Veiligheid & Formulieren', label: 'Medische Fiches', description: 'Standaard medische steunfiche van Scouts & Gidsen Vlaanderen.', url: 'https://www.scoutsengidsenvlaanderen.be', icon: 'fa-solid fa-notes-medical', sort_order: 40 },
  { id: 'res_d9', type: 'document', category: '📑 Veiligheid & Formulieren', label: 'Noodnummers & Reglement', description: 'Lijst met belangrijke contactpersonen en groepsafspraken.', url: 'https://drive.google.com', icon: 'fa-solid fa-phone-volume', sort_order: 41 },
]

export async function GET() {
  const user = await requireLeiding()
  if (!user) return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })

  const role = user.app_metadata?.role || ''
  const isGroepsleiding = role === 'admin' || role === 'groepsleiding'

  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('portal_resources')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (!error && data && data.length > 0) {
      const filtered = isGroepsleiding
        ? (data as PortalResource[])
        : (data as PortalResource[]).filter(r => (r.category || '').toLowerCase() !== 'groeps')
      return NextResponse.json(filtered)
    }

    // Auto-seed default resources into DB if empty
    const seedItems = DEFAULT_RESOURCES.map(({ id: _id, ...rest }) => rest)
    const { data: seededData, error: seedError } = await admin
      .from('portal_resources')
      .insert(seedItems)
      .select()

    if (!seedError && seededData && seededData.length > 0) {
      const filtered = isGroepsleiding
        ? (seededData as PortalResource[])
        : (seededData as PortalResource[]).filter(r => (r.category || '').toLowerCase() !== 'groeps')
      return NextResponse.json(filtered)
    }

    const defaultFiltered = isGroepsleiding
      ? DEFAULT_RESOURCES
      : DEFAULT_RESOURCES.filter(r => (r.category || '').toLowerCase() !== 'groeps')
    return NextResponse.json(defaultFiltered)
  } catch (err) {
    console.error('Error fetching portal_resources:', err)
    const fallback = isGroepsleiding
      ? DEFAULT_RESOURCES
      : DEFAULT_RESOURCES.filter(r => (r.category || '').toLowerCase() !== 'groeps')
    return NextResponse.json(fallback)
  }
}

export async function POST(req: NextRequest) {
  const user = await requireGroepsleiding()
  if (!user) return NextResponse.json({ error: 'Enkel groepsleiding mag documenten en links beheren.' }, { status: 403 })

  try {
    const body = await req.json()
    const { type, category, label, description, url, icon, sort_order } = body

    const resourceType = type || 'document'
    if (!label) {
      return NextResponse.json({ error: 'Titel is verplicht' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('portal_resources')
      .insert({
        type: resourceType === 'quicklink' ? 'quicklink' : 'document',
        category: category?.trim() || (resourceType === 'quicklink' ? 'Snelkoppelingen' : 'Algemeen'),
        label: String(label).trim().slice(0, 200),
        description: String(description || '').trim().slice(0, 500),
        url: String(url || '').trim().slice(0, 1000),
        icon: String(icon || 'fa-solid fa-file').trim().slice(0, 100),
        sort_order: typeof sort_order === 'number' ? sort_order : 50,
      })
      .select()
      .single()

    if (error) {
      console.error('Error inserting portal_resource:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('Error in POST portal-resources:', err)
    return NextResponse.json({ error: 'Interne fout bij aanmaken' }, { status: 500 })
  }
}
