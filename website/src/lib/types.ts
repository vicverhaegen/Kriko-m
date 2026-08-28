export interface WerkjaarLeiding {
  id: string
  werkjaar: string
  tak: 'kapoenen' | 'welpen' | 'jonggivers' | 'givers'
  naam: string
  rol: string
}

// Concept (draft) voor het volgende werkjaar — leeft in settings.concept.
export interface WerkjaarConcept {
  werkjaar: string
  // leiding→tak toewijzing als { tak: [{ naam, rol }] }
  leiding: Record<string, { naam: string; rol: string }[]>
}

export interface Settings {
  id: number
  scouts_year: string
  concept?: WerkjaarConcept | Record<string, never>
  bank_iban: string
  bank_bic: string
  bank_holder: string
  contact_email: string
  webshop_email?: string
  webshop_financial_email?: string
  webshop_enable_customer_email?: boolean
  webshop_enable_financial_email?: boolean
  webshop_enable_team_email?: boolean
  contact_phone: string
  contact_address: string
  alert_message: string
  alert_active: boolean
  reg_fee_first: number
  reg_fee_extra: number
  home_leiding_foto?: string
  home_title?: string
  home_subtitle?: string

  // Startpagina titels en subtitels per rol
  home_title_leiding?: string
  home_subtitle_leiding?: string
  home_title_groepsleiding?: string
  home_subtitle_groepsleiding?: string
  portal_login_foto?: string

  takken: Record<string, TakConfig>
  // Geheim token voor de private leiding-ICS-feed (zie /api/leiding/ics).
  leiding_ics_token?: string
  // Geheim token voor de private groepsleiding-ICS-feed (zie /api/groepsleiding/ics).
  groepsleiding_ics_token?: string
  // Per-tak portaalachtergrond-configuratie (zie /api/admin/portal-backgrounds).
  portal_backgrounds?: Record<string, { style: string; custom_url?: string | null }>
}

export interface TakConfig {
  name: string
  age_range: string
  school_year: string
  email: string
  class: string
  description?: string
  uniform?: string
  photo?: string
  leaders?: Leader[]
  whatsapp_url?: string
}

export interface Leader {
  name: string
  role?: string
  totem?: string
  phone?: string
}

// Audience-tags bepalen de zichtbaarheid: een event met 'groep' is publiek
// (website-kalender); 'grl' is enkel voor groepsleiding; overige zijn leiding-breed.
export type AudienceTag = 'leiding' | 'kapoenen' | 'welpen' | 'jonggivers' | 'givers' | 'groep' | 'grl'

export interface CalendarEvent {
  id: string
  title: string
  date: string
  datum_tot?: string | null // einddatum voor meerdaagse losse events
  time: string
  location: string
  description: string
  audience: AudienceTag[]
  is_evenement: boolean
  banner_image?: string | null
  icon?: string | null
  facebook_event_url?: string | null
  facebook_post_url?: string | null
  external_link_url?: string | null
  document_url?: string | null
  werkjaar?: string
  created_at?: string
}

export interface CalendarEntry extends CalendarEvent {
  source?: 'event' | 'kamp'
  slug?: string
}

export interface Echo {
  id: string
  title: string
  month: number
  year: number
  tak: 'kapoenen' | 'welpen' | 'jonggivers' | 'givers'
  file_name: string
  approved: boolean
  werkjaar?: string
  uploaded_at?: string
  created_at?: string
}

export interface Product {
  id: string
  name: string
  price: number
  description: string
  sizes: string[]
  image: string
  category: string
  active: boolean
  sort_order: number
}

export interface Order {
  id: string
  order_number: number
  order_ref: string
  status: 'niet_betaald' | 'betaald' | 'afgehaald' | 'pending' | 'waiting_approval' | 'paid' | 'completed' | 'cancelled'
  payment_method?: 'overschrijving' | 'cash'
  customer_name: string
  child_name: string
  child_tak: string
  email: string
  items: OrderItem[]
  total: number
  communication: string
  created_at?: string
  bank_iban?: string // Helper property for UI rendering
  bank_holder?: string // Helper property for UI rendering
}

export interface OrderItem {
  id: string
  name: string
  size: string
  price: number
  quantity: number
}



export interface Message {
  id: string
  name: string
  email: string
  subject: string
  message: string
  read: boolean
  created_at?: string
}

export interface Verslag {
  id: string
  title: string
  tak: 'kapoenen' | 'welpen' | 'jonggivers' | 'givers' | 'alle'
  date: string
  content: string
  author: string
  published: boolean
  created_at?: string
}

export interface LeidingBericht {
  id: string
  content: string
  author_naam: string
  author_email: string
  created_at: string
}

export interface TodoItem {
  id: string
  title: string
  month: number
  completed: boolean
  tak: 'kapoenen' | 'welpen' | 'jonggivers' | 'givers' | 'groepsleiding'
  werkjaar: string
  created_at?: string
}

export interface PortalResource {
  id: string
  type?: 'quicklink' | 'document'
  label: string
  url?: string
  description?: string
  category?: string
  icon: string
  sort_order?: number
  order?: number
}
