import type { Metadata } from 'next'
import { Suspense } from 'react'
import EditableText from '@/components/editing/EditableText'

export const metadata: Metadata = { title: 'Verkoopsvoorwaarden' }

export default function VoorwaardenPage() {
  const sections = [
    {
      id: 'verkoper',
      title: '1. Identiteit van de verkoper',
      text: 'Scouts Kriko-M vzw, gevestigd te Industriepark-Noord 33, 9100 Sint-Niklaas. Ondernemingsnummer (KBO): BE0409.040.288 (niet btw-plichtig). Contact via het contactformulier of e-mail naar de groepsleiding.'
    },
    {
      id: 'toepasselijkheid',
      title: '2. Toepasselijkheid',
      text: 'Deze algemene verkoopsvoorwaarden zijn van toepassing op alle bestellingen geplaatst via de online webshop van Scouts Kriko-M vzw.'
    },
    {
      id: 'prijzen',
      title: '3. Prijzen en Betalingswijze',
      text: 'Alle vermelde prijzen zijn in Euro (€) en vrijgesteld van btw conform het stelsel voor kleine ondernemingen/vzw. Betaling geschiedt via Belgische gestructureerde overschrijving. Na het plaatsen van je bestelling ontvang je een bevestigingsmail met het exacte te betalen bedrag, het rekeningnummer van de vzw en de unieke gestructureerde mededeling. Betalingen dienen binnen 14 kalenderdagen te worden overgemaakt.'
    },
    {
      id: 'levering',
      title: '4. Levering & Afhaling',
      text: 'Bestelde artikelen worden niet per post verzonden. Het afhalen van bestellingen wordt rechtstreeks afgesproken met onze uniformverantwoordelijke (tijdens de wekelijkse scoutsvergaderingen of na afspraak aan de scoutslokalen). Zodra je betaling is ontvangen en verwerkt, ontvang je hierover verdere berichtgeving.'
    },
    {
      id: 'herroeping',
      title: '5. Herroepingsrecht & Retournering',
      text: 'Voor niet-gepersonaliseerde en ongebruikte artikelen in originele staat heb je het recht om de aankoop binnen 14 kalenderdagen na afhaling te herroepen zonder opgave van reden. Neem voor retournering of omruiling vooraf contact op via het contactformulier. Gepersonaliseerde artikelen (indien van toepassing) vallen buiten het herroepingsrecht.'
    },
    {
      id: 'voorraad',
      title: '6. Voorraad & Annulering',
      text: 'Mocht een besteld artikel onverhoopt uitverkocht of niet leverbaar zijn, dan brengen wij je zo snel mogelijk op de hoogte. Het reeds betaalde bedrag wordt in dat geval volledig teruggestort, of in overleg omgezet naar een alternatief product.'
    },
    {
      id: 'klachten',
      title: '7. Klachten & Contact',
      text: 'Heb je vragen, opmerkingen of een klacht over je bestelling? Neem dan gerust contact op met de groepsleiding via de contactpagina. We zoeken steeds samen naar een passende oplossing.'
    }
  ]

  return (
    <Suspense fallback={null}>
      <section className="tak-hero primair">
        <div className="container">
          <EditableText
            blockKey="voorwaarden.hero.title"
            page="voorwaarden"
            section="hero"
            field="title"
            defaultValue="Verkoopsvoorwaarden"
            as="h1"
            className="tak-hero-title"
          />
        </div>
      </section>
      <section className="section container">
        <div
          style={{
            maxWidth: 800,
            margin: '0 auto',
            background: 'var(--color-bg-white)',
            borderRadius: 'var(--border-radius-lg)',
            boxShadow: 'var(--shadow-md)',
            padding: 'clamp(24px, 5vw, 44px) clamp(18px, 4.5vw, 40px)',
            border: '1px solid var(--color-border)'
          }}
        >
          <EditableText
            blockKey="voorwaarden.main.title"
            page="voorwaarden"
            section="main"
            field="title"
            defaultValue="Algemene Verkoopsvoorwaarden"
            as="h2"
            style={{
              marginBottom: 8,
              fontSize: 'clamp(1.4rem, 5.2vw, 2.25rem)',
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
              hyphens: 'auto',
              lineHeight: 1.25,
            }}
          />
          <EditableText
            blockKey="voorwaarden.main.sub"
            page="voorwaarden"
            section="main"
            defaultValue="Laatste update: augustus 2026 · Scouts Kriko-M vzw (KBO: BE0409.040.288)"
            as="p"
            style={{ color: 'var(--color-text-muted)', marginBottom: 24, fontSize: '0.95rem' }}
          />

          {sections.map(({ id, title, text }) => (
            <div key={id} style={{ marginBottom: 24 }}>
              <EditableText
                blockKey={`voorwaarden.section.${id}.title`}
                page="voorwaarden"
                section="sections"
                field="title"
                defaultValue={title}
                as="h3"
                style={{ fontSize: '1.15rem', marginBottom: 8, color: 'var(--color-primary)' }}
              />
              <EditableText
                blockKey={`voorwaarden.section.${id}.text`}
                page="voorwaarden"
                section="sections"
                field="content"
                defaultValue={text}
                as="p"
                multiline
                style={{ color: 'var(--color-text-dark)', lineHeight: 1.7 }}
              />
            </div>
          ))}
        </div>
      </section>
    </Suspense>
  )
}

