import { unstable_cache } from 'next/cache'
import { createAdminClient } from './supabase'

/* eslint-disable @typescript-eslint/no-explicit-any */
export function normalizeSettings(data: any): any {
  if (!data) return data
  const pb = (data.portal_backgrounds ?? {}) as Record<string, any>
  return {
    ...data,
    home_title_leiding: data.home_title_leiding ?? pb.home_title_leiding ?? null,
    home_subtitle_leiding: data.home_subtitle_leiding ?? pb.home_subtitle_leiding ?? null,
    home_title_groepsleiding: data.home_title_groepsleiding ?? pb.home_title_groepsleiding ?? null,
    home_subtitle_groepsleiding: data.home_subtitle_groepsleiding ?? pb.home_subtitle_groepsleiding ?? null,
    portal_login_foto: data.portal_login_foto ?? pb.portal_login_foto ?? null,
  }
}

export const getSettings = unstable_cache(
  async () => {
    try {
      const supabase = createAdminClient()
      const { data } = await supabase.from('settings').select('*').single()
      return normalizeSettings(data)
    } catch (err) {
      console.error('getSettings exception:', err)
      return null
    }
  },
  ['settings-cache'],
  { revalidate: 3600, tags: ['settings'] }
)

// Actief werkjaar = settings.scouts_year. Direct (ongecachet) gelezen omdat dit
// bij schrijfacties gebruikt wordt om nieuwe records te taggen.
export async function getActiveWerkjaar(): Promise<string> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase.from('settings').select('scouts_year').eq('id', 1).single()
    return data?.scouts_year ?? ''
  } catch (err) {
    console.error('getActiveWerkjaar exception:', err)
    return ''
  }
}

// Alle kalender-events (oudercalender + interne leiding-events). Voor portaal /
// leiding-views en de private ICS-feed.
export const getAllCalendarEvents = unstable_cache(
  async () => {
    try {
      const supabase = createAdminClient()
      const { data } = await supabase
        .from('calendar')
        .select('*')
        .order('date', { ascending: true })
      return data ?? []
    } catch (err) {
      console.error('getAllCalendarEvents exception:', err)
      return []
    }
  },
  ['calendar-all-cache'],
  { revalidate: 3600, tags: ['calendar'] }
)

// Enkel publieke events (audience bevat 'groep') — de oudercalender. Voor de
// publieke site en de publieke ICS-feed.
export const getPublicCalendarEvents = unstable_cache(
  async () => {
    try {
      const supabase = createAdminClient()
      const { data } = await supabase
        .from('calendar')
        .select('*')
        .contains('audience', ['groep'])
        .order('date', { ascending: true })
      return data ?? []
    } catch (err) {
      console.error('getPublicCalendarEvents exception:', err)
      return []
    }
  },
  ['calendar-public-cache'],
  { revalidate: 3600, tags: ['calendar'] }
)

// Geheim token voor de private leiding-ICS-feed (ongecachet — beveiligingswaarde).
export async function getLeidingIcsToken(): Promise<string> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase.from('settings').select('leiding_ics_token').eq('id', 1).single()
    return data?.leiding_ics_token ?? ''
  } catch (err) {
    console.error('getLeidingIcsToken exception:', err)
    return ''
  }
}

// Geheim token voor de private groepsleiding-ICS-feed (ongecachet — beveiligingswaarde).
export async function getGroepsleidingIcsToken(): Promise<string> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase.from('settings').select('groepsleiding_ics_token').eq('id', 1).single()
    return data?.groepsleiding_ics_token ?? ''
  } catch (err) {
    console.error('getGroepsleidingIcsToken exception:', err)
    return ''
  }
}

export const getEchos = unstable_cache(
  async () => {
    try {
      const supabase = createAdminClient()
      const { data } = await supabase
        .from('echos')
        .select('*')
        .eq('approved', true)
        .order('year', { ascending: false })
        .order('month', { ascending: false })
      return data ?? []
    } catch (err) {
      console.error('getEchos exception:', err)
      return []
    }
  },
  ['echos-cache'],
  { revalidate: 3600, tags: ['echos'] }
)

export const getShopProducts = unstable_cache(
  async () => {
    try {
      const supabase = createAdminClient()
      const { data } = await supabase
        .from('shop_products')
        .select('*')
        .eq('active', true)
        .order('sort_order', { ascending: true })
      return data ?? []
    } catch (err) {
      console.error('getShopProducts exception:', err)
      return []
    }
  },
  ['shop-products-cache-v2'],
  { revalidate: 3600, tags: ['shop-products'] }
)

export async function getOrders() {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
    return data ?? []
  } catch (err) {
    console.error('getOrders exception:', err)
    return []
  }
}

export async function getMessages() {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false })
    return data ?? []
  } catch (err) {
    console.error('getMessages exception:', err)
    return []
  }
}

export const getVerslagen = unstable_cache(
  async () => {
    try {
      const supabase = createAdminClient()
      const { data } = await supabase
        .from('verslagen')
        .select('*')
        .eq('published', true)
        .order('date', { ascending: false })
      return data ?? []
    } catch (err) {
      console.error('getVerslagen exception:', err)
      return []
    }
  },
  ['verslagen-cache'],
  { revalidate: 3600, tags: ['verslagen'] }
)

export const getSiteContent = unstable_cache(
  async () => {
    try {
      const supabase = createAdminClient()
      const { data, error } = await supabase.from('site_content').select('*')
      if (error) {
        console.error('getSiteContent error:', error.message)
        return {}
      }
      const contentMap: Record<string, { title?: string; content?: string; image_url?: string }> = {}
      if (data) {
        for (const row of data) {
          contentMap[row.key] = {
            title: row.title || '',
            content: row.content || '',
            image_url: row.image_url || '',
          }
        }
      }
      return contentMap
    } catch (err) {
      console.error('getSiteContent exception:', err)
      return {}
    }
  },
  ['site-content-cache'],
  { revalidate: 3600, tags: ['site-content'] }
)


