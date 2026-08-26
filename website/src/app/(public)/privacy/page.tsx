import type { Metadata } from 'next'
import EditableText from '@/components/editing/EditableText'

export const metadata: Metadata = { title: 'Privacyverklaring' }

export default function PrivacyPage() {
  const sections = [
    {
      id: 'wie',
      title: '1. Wie zijn wij?',
      text: 'Scouts Kriko-M vzw is gevestigd te Industriepark-Noord 33, 9100 Sint-Niklaas met ondernemingsnummer (KBO) BE0409.040.288. Wij verwerken persoonsgegevens in overeenstemming met de Algemene Verordening Gegevensbescherming (AVG / GDPR).'
    },
    {
      id: 'gegevens',
      title: '2. Welke gegevens verzamelen wij?',
      text: 'Wij bewaren enkel minimale gegevens die noodzakelijk zijn voor het afhandelen van bestellingen in onze webshop en contactaanvragen: naam en e-mailadres (plus optionele opmerking/telefoonnummer bij bestelling of contact). Medische fiches, lidregistraties en persoonlijke informatie van leden worden NOOIT op onze website of servers opgeslagen; deze worden uitsluitend en rechtstreeks beheerd via de officiële Groepsadministratie van Scouts & Gidsen Vlaanderen.'
    },
    {
      id: 'doel',
      title: '3. Waarvoor gebruiken wij je gegevens?',
      text: 'Je gegevens worden uitsluitend gebruikt voor het verwerken van je webshopbestelling (zoals het versturen van de bestelbevestiging met betaalinstructies) en het beantwoorden van je berichten. Wij verwerken geen kamp- of weekendinschrijvingen op deze website en verkopen, verhuren of delen je persoonsgegevens nooit met derden.'
    },
    {
      id: 'termijn',
      title: '4. Bewaartermijn',
      text: 'Persoonsgegevens worden niet langer bewaard dan noodzakelijk voor het afhandelen van je bestelling of om te voldoen aan wettelijke en boekhoudkundige verplichtingen van de vzw.'
    },
    {
      id: 'cookies',
      title: '5. Cookies & Opslag',
      text: 'Onze website maakt uitsluitend gebruik van functionele cookies en lokale opslag (noodzakelijk voor de werking van het winkelmandje en sessiebeheer). Wij gebruiken geen tracking-, marketing- of analytische cookies van derden.'
    },
    {
      id: 'extern',
      title: '6. Externe platformen',
      text: 'Aanvragen voor het huren van onze scoutslokalen verlopen via het externe platform Kampas (Kampas.be). De officiële ledenadministratie verloopt via Groepsadministratie van Scouts & Gidsen Vlaanderen. Bij het gebruik van deze platformen gelden hun respectievelijke privacyvoorwaarden.'
    },
    {
      id: 'rechten',
      title: '7. Jouw rechten',
      text: 'Je hebt recht op inzage, correctie, beperking of verwijdering van je persoonsgegevens. Neem hiervoor contact met ons op via ons contactformulier of per mail naar de groepsleiding.'
    }
  ]

  return (
    <>
      <section className="tak-hero primair">
        <div className="container">
          <EditableText
            blockKey="privacy.hero.title"
            page="privacy"
            section="hero"
            field="title"
            defaultValue="Privacyverklaring"
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
            padding: '40px 48px',
            border: '1px solid var(--color-border)'
          }}
        >
          <EditableText
            blockKey="privacy.main.title"
            page="privacy"
            section="main"
            field="title"
            defaultValue="Privacyverklaring Scouts Kriko-M vzw"
            as="h2"
            style={{ marginBottom: 8 }}
          />
          <EditableText
            blockKey="privacy.main.sub"
            page="privacy"
            section="main"
            defaultValue="Laatste update: augustus 2026 · KBO: BE0409.040.288"
            as="p"
            style={{ color: 'var(--color-text-muted)', marginBottom: 24, fontSize: '0.95rem' }}
          />

          {sections.map(({ id, title, text }) => (
            <div key={id} style={{ marginBottom: 24 }}>
              <EditableText
                blockKey={`privacy.section.${id}.title`}
                page="privacy"
                section="sections"
                field="title"
                defaultValue={title}
                as="h3"
                style={{ fontSize: '1.15rem', marginBottom: 8, color: 'var(--color-primary)' }}
              />
              <EditableText
                blockKey={`privacy.section.${id}.text`}
                page="privacy"
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
    </>
  )
}
