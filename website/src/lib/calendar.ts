import { CalendarEvent, AudienceTag } from './types'

export const PRESET_EVENT_ICONS = [
  { id: 'fa-star', label: 'Groot Event' },
  { id: 'fa-house', label: 'Lokaal / Huis' },
  { id: 'fa-champagne-glasses', label: 'Feest / Party' },
  { id: 'fa-cake-candles', label: 'Verjaardag / Taart' },
  { id: 'fa-campground', label: 'Kamp / Weekend' },
  { id: 'fa-fire', label: 'Kampvuur' },
  { id: 'fa-utensils', label: 'Eten / BBQ' },
  { id: 'fa-beer-mug-empty', label: 'Bar / Café' },
  { id: 'fa-music', label: 'Muziek / Party' },
  { id: 'fa-gift', label: 'Sint / Cadeau' },
  { id: 'fa-ghost', label: 'Griezel' },
  { id: 'fa-person-hiking', label: 'Dropping / Tocht' },
  { id: 'fa-lightbulb', label: 'Quiz' },
  { id: 'fa-masks-theater', label: 'Bonte Avond' },
  { id: 'fa-coins', label: 'Verkoop' },
  { id: 'fa-ban', label: 'Geen vergadering' },
]

export function getEventIcon(event: CalendarEvent): string {
  return event.icon || ''
}

export const AUDIENCE_PRIORITY: AudienceTag[] = [
  'groep',
  'grl',
  'leiding',
  'kapoenen',
  'welpen',
  'jonggivers',
  'givers',
]

export function getPrimaryAudienceTag(audience?: string[]): AudienceTag {
  if (!audience || audience.length === 0) return 'leiding'
  for (const tag of AUDIENCE_PRIORITY) {
    if (audience.includes(tag)) return tag
  }
  const first = audience[0] as AudienceTag
  return AUDIENCE_PRIORITY.includes(first) ? first : 'leiding'
}

