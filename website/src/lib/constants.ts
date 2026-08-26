// Gedeelde constanten — voorheen verspreid over meerdere bestanden.

export const TAKKEN = ['kapoenen', 'welpen', 'jonggivers', 'givers'] as const
export type Tak = (typeof TAKKEN)[number]

// Inclusief 'alle' voor kampen/verslagen die over de hele groep gaan.
export const TAKKEN_MET_ALLE = [...TAKKEN, 'alle'] as const

// Tabs in het leiding-portaal (volgorde = sidebar-volgorde).
// De 4 leeftijdstakken + 'groepsleiding' (beheerstak, enkel zichtbaar voor rol
// groepsleiding). "Evenementen" is GEEN tak — het is een kalender-tag (zie
// AUDIENCE_TAGS, label "Groep").
export const PORTAAL_TAKKEN = ['kapoenen', 'welpen', 'jonggivers', 'givers', 'groepsleiding'] as const
export type PortaalTak = (typeof PORTAAL_TAKKEN)[number]

// Tabs die enkel zichtbaar zijn voor rol groepsleiding.
export const GROEPSLEIDING_ONLY_TAKKEN = ['groepsleiding'] as const

export const TAK_NAMEN: Record<string, string> = {
  kapoenen: 'Kapoenen',
  welpen: 'Welpen',
  jonggivers: 'Jonggivers',
  givers: 'Givers',
  groepsleiding: 'Groepsleiding',
  alle: 'Alle takken',
}

// Leeftijdslabels voor dropdowns.
export const TAK_LABELS: Record<string, string> = {
  kapoenen: 'Kapoenen (6–8j)',
  welpen: 'Welpen (8–11j)',
  jonggivers: 'Jonggivers (11–14j)',
  givers: 'Givers (14–17j)',
}

export const TAK_KLEUREN: Record<string, string> = {
  kapoenen: '#F4C842',
  welpen: '#5D9E6C',
  jonggivers: '#E07B1A',
  givers: '#1A3FB5',
  groepsleiding: '#650B19', // bordeaux
  alle: '#1A3D2A',
}

// Audience-tags voor kalender én kampen (wie de activiteit betreft).
// 'groep' = publiek op de website-kalender (enkel groepsleiding mag toekennen).
// 'grl'   = exclusief voor groepsleiding (verborgen voor gewone leiding).
export const AUDIENCE_TAGS = ['groep', 'leiding', 'grl', 'kapoenen', 'welpen', 'jonggivers', 'givers'] as const
export type AudienceTagConst = (typeof AUDIENCE_TAGS)[number]

export const AUDIENCE_NAMEN: Record<string, string> = {
  leiding: 'Leiding',
  kapoenen: 'Kapoenen',
  welpen: 'Welpen',
  jonggivers: 'Jonggivers',
  givers: 'Givers',
  groep: 'Groep',
  grl: 'GRL',
}

// Kleuren per audience-tag (hergebruikt TAK_KLEUREN + leiding/groep/grl).
export const AUDIENCE_KLEUREN: Record<string, string> = {
  ...TAK_KLEUREN,
  leiding: '#650B19', // bordeaux
  groep: '#C9963A',   // goud
  grl: '#1E7E52',     // groen (GRL)
}

// Kleuren per audience-tag specifiek voor het leidingsportaal
export const PORTAAL_AUDIENCE_KLEUREN: Record<string, string> = {
  ...TAK_KLEUREN,
  groep: '#85172A',   // lichter bordeaux (Groep in leidingsportaal)
  leiding: '#2B4C8C', // lichter donkerblauw (Leiding in leidingsportaal)
  grl: '#1E7E52',     // groen (GRL)
}

export const MAANDEN: Record<number, string> = {
  1: 'januari',
  2: 'februari',
  3: 'maart',
  4: 'april',
  5: 'mei',
  6: 'juni',
  7: 'juli',
  8: 'augustus',
  9: 'september',
  10: 'oktober',
  11: 'november',
  12: 'december',
}

// Productie-URL — fallback wanneer leiding lokaal test, zodat gekopieerde
// uitnodigingslinks nooit naar localhost wijzen.
export const SITE_URL = 'https://kriko-m-indol.vercel.app'

// Origin voor publiek deelbare links (RSVP-uitnodigingen e.d.).
export function publicOrigin(): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) return SITE_URL
  return origin
}
